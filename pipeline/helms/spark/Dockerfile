FROM bitnami/spark:latest

USER root

# (optionnel) Installer des outils ou paquets Python
RUN pip install pyspark==3.5.5 apache-airflow

# Crée un user airflow si nécessaire
RUN useradd -m airflow
USER airflow
