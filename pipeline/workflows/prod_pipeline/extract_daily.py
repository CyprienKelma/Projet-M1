from airflow.decorators import task
from datetime import datetime


@task.virtualenv(
    use_dill=True,
    requirements=["pandas", "minio", "psycopg2-binary"],
    system_site_packages=False,
)
def extract_postgres_to_bronze_bucket():
    import pandas as pd
    import psycopg2
    from minio import Minio
    from datetime import datetime

    conn = psycopg2.connect(
        host="postgres-minimal-cluster.postgresql.svc.cluster.local",
        dbname="demo",
        user="stmg",
        password="uzWe8yt6cihF9gbuJi7ot5whT2hsOQfikcCupPLRSA3a70JQQmBacfCspbjKUrwu"
    )

    client = Minio(
        "minio-tenant-hl.minio-tenant.svc.cluster.local:9000",
        access_key="minio",
        secret_key="minio123",
        secure=True,
        cert_check=False
    )

    if not client.bucket_exists("bronze"):
        client.make_bucket("bronze")

    TABLES = ["users", "groups", "groups_users_user", "activities", "notification_states"]
    today = datetime.today().strftime("%Y-%m-%d")
    batch_size = 10000

    for table in TABLES:
        offset = 0
        batch_num = 0

        while True:
            print(f"[INFO] Extracting {table} from Postgres at batch {batch_num}...")
            query = f"SELECT * FROM {table} WHERE DATE(created_at) = '{today}' LIMIT {batch_size} OFFSET {offset}"
            df = pd.read_sql(query, conn)
            if df.empty:
                break

            local_path = f"/tmp/{table}_batch{batch_num}.csv"
            minio_path = f"{table}/{today}/{table}_batch{batch_num}.csv"

            df.to_csv(local_path, index=False)
            client.fput_object("bronze", minio_path, local_path)

            print(f"Batch {batch_num} de {table} uploaded dans : bronze/{table}/{today}/")

            offset += batch_size
            batch_num += 1



@task.virtualenv(
    use_dill=True,
    requirements=["pandas", "minio", "cassandra-driver"],
    system_site_packages=False,
)
def extract_cassandra_tables_to_bronze_bucket():
    import pandas as pd
    from cassandra.cluster import Cluster
    from cassandra.auth import PlainTextAuthProvider
    from minio import Minio
    from datetime import datetime

    auth_provider = PlainTextAuthProvider("demo-superuser", "aNgSePPuVZs63BlFeS02")
    cluster = Cluster(["demo-dc1-service.cassandra.svc.cluster.local"], port=9042, auth_provider=auth_provider)
    session = cluster.connect("cassandra")

    client = Minio(
        "minio-tenant-hl.minio-tenant.svc.cluster.local:9000",
        access_key="minio",
        secret_key="minio123",
        secure=True,
        cert_check=False
    )

    if not client.bucket_exists("bronze"):
        client.make_bucket("bronze")

    TABLES = ["group_messages", "user_notifications", "user_purchases", "user_session_events"]
    today = datetime.today().strftime("%Y-%m-%d")

    for table in TABLES:
        print(f"[INFO] Extracting {table} from Cassandra...")
        rows = session.execute(f"SELECT * FROM {table}")
        df = pd.DataFrame(rows.all(), columns=rows.column_names)

        local_path = f"/tmp/{table}.csv"
        minio_path = f"{table}/{today}/{table}.csv"

        df.to_csv(local_path, index=False)
        client.fput_object("bronze", minio_path, local_path)

        print(f"Table {table}.csv uploaded dans le bucket : bronze/{table}/{today}/")