from airflow.decorators import task
from datetime import datetime


@task.virtualenv(
    use_dill=True,
    requirements=["pandas", "pyarrow", "minio"],
    system_site_packages=False,
)
def transform_silver_to_notif_impact(**context):
    import pandas as pd
    from minio import Minio
    from io import BytesIO
    import os
    from datetime import datetime

    # Récupérer la date d'exécution
    ds = context["ds"]
    today = datetime.strptime(ds, "%Y-%m-%d").date()

    # Connexion MinIO
    client = Minio(
        "minio-tenant-hl.minio-tenant.svc.cluster.local:9000",
        access_key="minio",
        secret_key="minio123",
        secure=True,
        cert_check=False
    )

    def read_parquet_from_minio(bucket, path):
        response = client.get_object(bucket, path)
        return pd.read_parquet(BytesIO(response.read()))

    # Lecture des fichiers silver
    notif_states = read_parquet_from_minio("silver", f"notification_states/{ds}/notification_states_clean.parquet")
    user_notifs = read_parquet_from_minio("silver", f"user_notifications/{ds}/user_notifications_clean.parquet")
    sessions = read_parquet_from_minio("silver", f"user_session_events/{ds}/user_session_events_clean.parquet")

    notif_states["notif_date"] = pd.to_datetime(notif_states["updated_at"]).dt.date
    user_notifs["notif_date"] = pd.to_datetime(user_notifs["notification_time"]).dt.date

    print("Notif Shape : ", notif_states.shape, notif_states.head())
    print("Activity Shape : ", user_notifs.shape, user_notifs.head())

    # Merge sur notification_id uniquement (pas user_id)
    notif_states["notification_id"] = notif_states["notification_id"].astype(str)
    user_notifs["notification_id"] = user_notifs["notification_id"].astype(str)

    merged = pd.merge(
        notif_states,
        user_notifs,
        how="inner",
        on="notification_id"
    )

    merged["is_success"] = merged["status"] == "read"
    merged["notif_date"] = pd.to_datetime(merged["updated_at"]).dt.date

    # Sélection des colonnes d'intérêt
    merged = merged[["user_id_x", "content", "notif_date", "is_success"]].rename(
        columns={"user_id_x": "user_id", "content": "content_notif"}
    )

    # Sessions
    sessions["event_time"] = pd.to_datetime(sessions["event_time"])
    sessions["session_date"] = sessions["event_time"].dt.date
    sessions["notif_date"] = sessions["session_date"]

    # Jointure artificielle (merge sur date uniquement, pour la démo)
    merged["merge_key"] = 1
    sessions["merge_key"] = 1

    after_notif = pd.merge(
        merged,
        sessions,
        how="inner",
        on=["merge_key", "notif_date"]
    )

    after_notif["event_time"] = pd.Timestamp.now()
    after_notif["user_id"] = after_notif["user_id"]

    # Calcul des durées
    durations = after_notif.groupby(
        ["user_id", "content_notif", "notif_date", "is_success"]
    )["event_time"].agg(["min", "max"]).reset_index()

    durations["time_spend_after_success"] = durations["max"] - durations["min"]

    final_df = durations[["user_id", "content_notif", "notif_date", "is_success", "time_spend_after_success"]]

    print("Final Shape : ", final_df.shape, final_df.head())

    # Export MinIO
    out_path = f"/tmp/global_notif_impact_per_day_{ds}.parquet"
    final_df.to_parquet(out_path, index=False)

    if not client.bucket_exists("gold"):
        client.make_bucket("gold")

    minio_path = f"global_notif_impact_per_day/{ds}/global_notif_impact_per_day.parquet"
    client.fput_object("gold", minio_path, out_path)

    print(f"Table gold_notif_impact créée et envoyée dans gold/{minio_path}")
