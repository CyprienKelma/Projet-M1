from airflow import DAG
from airflow.decorators import task
from datetime import datetime


@task.virtualenv(
    use_dill=True,
    requirements=["pyspark", "minio"],
    system_site_packages=False,
)
def transform_bronze_to_silver():
    from pyspark.sql import SparkSession
    from minio import Minio

    spark = SparkSession.builder \
        .appName("bronze-to-silver-local") \
        .master("local[*]") \
        .config("spark.hadoop.fs.s3a.endpoint", "http://minio-tenant-hl.minio-tenant.svc.cluster.local:9000") \
        .config("spark.hadoop.fs.s3a.access.key", "minio") \
        .config("spark.hadoop.fs.s3a.secret.key", "minio123") \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false") \
        .getOrCreate()

    df = spark.read.csv("s3a://bronze/demo/users.csv", header=True)
    df_clean = df.filter(df["email"].isNotNull())
    df_clean.write.mode("overwrite").parquet("s3a://silver/demo/users_clean.parquet")

    print("✔️ Transformation Spark locale terminée")