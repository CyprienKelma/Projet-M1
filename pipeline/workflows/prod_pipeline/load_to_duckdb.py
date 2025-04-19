from airflow.decorators import task
from datetime import datetime


@task.virtualenv(
    use_dill=True,
    requirements=["duckdb", "pandas", "pyarrow", "minio"],
    system_site_packages=False,
)
def load_to_duckdb(**context):
    import duckdb
    import pandas as pd
    from minio import Minio
    from io import BytesIO
    import os

    ds = context["ds"]

    client = Minio(
        "minio-tenant-hl.minio-tenant.svc.cluster.local:9000",
        access_key="minio",
        secret_key="minio123",
        secure=True,
        cert_check=False
    )

    def read_parquet(bucket, path):
        response = client.get_object(bucket, path)
        return pd.read_parquet(BytesIO(response.read()))

    notif_df = read_parquet("gold", f"global_notif_impact_per_day/{ds}/global_notif_impact_per_day.parquet")
    activity_df = read_parquet("gold", f"global_user_activity_per_day/{ds}/global_user_activity_per_day.parquet")

    print(notif_df.shape, notif_df.head())
    
    # Connexion au fichier DuckDB
    duckdb_path = "/opt/airflow/duckdb/analytics.duckdb"
    os.makedirs(os.path.dirname(duckdb_path), exist_ok=True)

    if not os.path.exists(duckdb_path):
        conn_init = duckdb.connect(duckdb_path)
        conn_init.close()

    conn = duckdb.connect(duckdb_path)



    # Créer les tables si elles n’existent pas encore
    conn.execute("""
        CREATE TABLE IF NOT EXISTS gold_notif_impact_per_day AS SELECT * FROM notif_df LIMIT 0
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS gold_user_activity_per_day AS SELECT * FROM activity_df LIMIT 0
    """)

    # Append les nouvelles données
    conn.execute("INSERT INTO gold_notif_impact_per_day SELECT * FROM notif_df")
    conn.execute("INSERT INTO gold_user_activity_per_day SELECT * FROM activity_df")

    print(f"Données du {ds} insérées dans DuckDB.")

    duckdb_backup_path = f"duckdb_backups/{ds}/analytics.duckdb"
    client.fput_object(
        bucket_name="backup",
        object_name=duckdb_backup_path,
        file_path=duckdb_path,
    )
    print(f"Données du {ds} insérées en backup dans MinIO.")