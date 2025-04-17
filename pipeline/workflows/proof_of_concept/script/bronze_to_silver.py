from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("bronze-to-silver-demo") \
    .config("spark.hadoop.fs.s3a.endpoint", "http://minio-s3a.minio-tenant:9000") \
    .config("spark.hadoop.fs.s3a.access.key", "minio") \
    .config("spark.hadoop.fs.s3a.secret.key", "minio123") \
    .config("spark.hadoop.fs.s3a.path.style.access", "true") \
    .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false") \
    .getOrCreate()

# df = spark.read.csv("s3a://minio-s3a.minio-tenant:9000/bronze/demo/users.csv", header=True)
# df_clean = df.filter(df["email"].isNotNull())
# df_clean.write.mode("overwrite").parquet("s3a://silver/demo/users_clean.parquet")


print("Transfortmation réussie pour Bronze ---> Silver")
