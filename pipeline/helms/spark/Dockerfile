FROM bitnami/spark:latest

USER root


ADD https://repo1.maven.org/maven2/org/apache/hadoop/hadoop-aws/3.3.4/hadoop-aws-3.3.4.jar /opt/spark/jars/
ADD https://repo1.maven.org/maven2/com/amazonaws/aws-java-sdk-bundle/1.12.262/aws-java-sdk-bundle-1.12.262.jar /opt/spark/jars/
# (optionnel) Installer des outils ou paquets Python
RUN pip install pyspark apache-airflow

# Crée un user airflow si nécessaire
RUN useradd -m airflow
USER airflow
