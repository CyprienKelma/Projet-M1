from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.cncf.kubernetes.operators.spark_kubernetes import SparkKubernetesOperator
from datetime import datetime
from minio import Minio
import duckdb
import psycopg2
import pandas as pd
import os
from proof_of_concept.script.extract_load import extract_postgres_to_minio, extract_cassandra_tables_to_minio, load_to_duckdb


with DAG("prod_pipeline",
         start_date=datetime(2024, 1, 1),
         schedule_interval=None,
         catchup=False) as dag: 

    extract_from_postgres = PythonOperator(
        task_id="extract_postgres_to_minio",
        python_callable=extract_postgres_to_minio
    )

    extract_from_cassandra = PythonOperator(
        task_id="extract_cassandra_to_minio",
        python_callable=extract_cassandra_tables_to_minio
   )
    
    transform_data = SparkKubernetesOperator(
        task_id="spark_transform",
        namespace="spark",
        application_file="spark_jobsdemo_bronze_to_silver/poc-transform.yaml",
        do_xcom_push=False,
    )

    load_on_data_warehouse = PythonOperator(
        task_id="load_to_duckdb",
        python_callable=load_to_duckdb
    )

[extract_from_postgres, extract_from_cassandra] >> transform_data >> load_on_data_warehouse
