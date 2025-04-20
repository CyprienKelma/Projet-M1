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

    # Contexte de date pour lire les bons dossiers
    ds = context["ds"]
    today = datetime.strptime(ds, "%Y-%m-%d").date()

    # Connexion à MinIO
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

    # Charger les datasets silver nécessaires
    notif_states = read_parquet_from_minio("silver", f"notification_states/{ds}/notification_states_clean.parquet")
    user_notifs = read_parquet_from_minio("silver", f"user_notifications/{ds}/user_notifications_clean.parquet")
    sessions = read_parquet_from_minio("silver", f"user_session_events/{ds}/user_session_events_clean.parquet")

    # Préparation des données
    notif_states["notif_date"] = pd.to_datetime(notif_states["updated_at"]).dt.date
    user_notifs["notif_date"] = pd.to_datetime(user_notifs["notification_time"]).dt.date

    print("Notif Shape : ", notif_states.shape, notif_states.head())
    print("Activity Shape : ", user_notifs.shape, user_notifs.head())

    # Harmoniser les types avant le merge
    notif_states["notification_id"] = notif_states["notification_id"].astype(str)
    user_notifs["notification_id"] = user_notifs["notification_id"].astype(str)

    # Merge uniquement sur notification_id (pas user_id)
    merged = pd.merge(
        notif_states,
        user_notifs,
        how="inner",
        on="notification_id"
    )

    after_notif["user_id"] = after_notif["user_id_x"]
    merged["is_success"] = merged["status"] == "read"

    # Garde la notif_date de notif_states
    merged["notif_date"] = pd.to_datetime(merged["updated_at"]).dt.date

    # Sélection colonnes
    merged = merged[["user_id_x", "content", "notif_date", "is_success"]].rename(
        columns={"user_id_x": "user_id", "content": "content_notif"}
    )

    # Nettoyage sessions
    sessions["event_time"] = pd.to_datetime(sessions["event_time"])
    sessions["session_date"] = sessions["event_time"].dt.date
    sessions["notif_date"] = sessions["session_date"]
    sessions["user_id"] = sessions["user_id"].astype(str)
    merged["user_id"] = merged["user_id"].astype(str)

    # Jointure avec sessions
    merged["merge_key"] = 1
    sessions["merge_key"] = 1
    sessions["notif_date"] = sessions["session_date"]

    # Merge uniquement sur notif_date (peu précis, mais ça donne des lignes)
    after_notif = pd.merge(
        merged,
        sessions,
        how="inner",
        on=["merge_key", "notif_date"]
    )

    # Calcul durée
    durations = after_notif.groupby(
        ["user_id", "content_notif", "notif_date", "is_success"]
    )["event_time"].agg(["min", "max"]).reset_index()

    durations["time_spend_after_success"] = durations["max"] - durations["min"]
    final_df = durations[["user_id", "content_notif", "notif_date", "is_success", "time_spend_after_success"]]

    print("Final Shape : ", final_df.shape, final_df.head())

    # Écriture vers MinIO (bucket gold)
    out_path = f"/tmp/global_notif_impact_per_day_{ds}.parquet"
    final_df.to_parquet(out_path, index=False)



    if not client.bucket_exists("gold"):
        client.make_bucket("gold")

    minio_path = f"global_notif_impact_per_day/{ds}/global_notif_impact_per_day.parquet"
    client.fput_object("gold", minio_path, out_path)

    print(f"Table gold_notif_impact créée et envoyée dans gold/{minio_path}")
    