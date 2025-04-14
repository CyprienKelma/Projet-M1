from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.cncf.kubernetes.operators.spark_kubernetes import SparkKubernetesOperator
from datetime import datetime
from minio import Minio
import duckdb
import psycopg2
import pandas as pd
import os

def extract_postgres_to_minio():
    # Ici direct à la DB sans passer par le backend pour le moment
    conn = psycopg2.connect(
        host="postgres-minimal-cluster.postgresql",
        dbname="mydb",
        user="myuser",
        password="mypassword"
    )
    df = pd.read_sql("SELECT * FROM users", conn)
    path = "/tmp/users.csv"
    df.to_csv(path, index=False)

    # Pareil pour le Tenant de MinIO
    client = Minio(
        "minio-tenant.minio-tenant.svc.cluster.local:9000",
        access_key="minioadmin",
        secret_key="minioadmin",
        secure=False,
    )
    if not client.bucket_exists("poc_data"):
        client.make_bucket("poc_data")
    client.fput_object("poc_data", "demo/users.csv", path)


def load_to_duckdb():
    df = pd.read_parquet("s3a://transformed/demo/users_clean.parquet")
    conn = duckdb.connect("/tmp/duckdb/analytics.duckdb")
    conn.execute("CREATE TABLE IF NOT EXISTS users AS SELECT * FROM df")