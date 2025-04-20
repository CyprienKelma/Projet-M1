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
    from datetime import datetime, timedelta

    # Contexte de date
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

    # Lecture de notif_states uniquement
    notif_states = read_parquet_from_minio("silver", f"notification_states/{ds}/notification_states_clean.parquet")

    # Nettoyage minimum pour avoir une colonne de date et de user
    notif_states["notif_date"] = pd.to_datetime(notif_states["updated_at"]).dt.date
    notif_states["user_id"] = notif_states["user_id"].astype(str)

    # Ajout de colonnes fictives pour la démo
    notif_states["content_notif"] = "Dummy notification content"
    notif_states["is_success"] = notif_states["status"] == "read"
    notif_states["time_spend_after_success"] = timedelta(minutes=5)  # valeur fixe

    final_df = notif_states[["user_id", "content_notif", "notif_date", "is_success", "time_spend_after_success"]]

    print("Final Shape : ", final_df.shape)
    print(final_df.head())

    # Écriture vers MinIO
    out_path = f"/tmp/global_notif_impact_per_day_{ds}.parquet"
    final_df.to_parquet(out_path, index=False)

    if not client.bucket_exists("gold"):
        client.make_bucket("gold")

    minio_path = f"global_notif_impact_per_day/{ds}/global_notif_impact_per_day.parquet"
    client.fput_object("gold", minio_path, out_path)

    print(f"Table gold_notif_impact envoyée dans gold/{minio_path}")
