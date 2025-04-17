FROM bitnami/spark:latest

USER root

# Ajout des JARs pour accès MinIO via s3a://
ADD https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-aws/3.3.4/hadoop-aws-3.3.4.jar /opt/bitnami/spark/jars/
ADD https://repo1.maven.org/maven2/com/amazonaws/aws-java-sdk-bundle/1.12.262/aws-java-sdk-bundle-1.12.262.jar /opt/bitnami/spark/jars/

# (Facultatif) Install de pyspark côté Python si besoin
RUN pip install pyspark

# Repasse sur utilisateur non-root
RUN useradd -m airflow
USER airflow
