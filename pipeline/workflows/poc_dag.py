from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.cncf.kubernetes.operators.spark_kubernetes import SparkKubernetesOperator, KubernetesPodOperator
#from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator

from datetime import datetime
from workflows.proof_of_concept.script.extract_load import extract_postgres_to_minio,extract_cassandra_tables_to_minio,load_to_duckdb,extract_neo4j_to_minio
#from pipeline.dags.proof_of_concept.script.extract_load import extract_postgres_to_minio,extract_cassandra_tables_to_minio,load_to_duckdb


with DAG("poc_pipeline",
         start_date=datetime(2024, 1, 1),
         schedule_interval=None,
         catchup=False) as dag:

    extract_from_postgres = extract_postgres_to_minio()

#     extract_from_cassandra = PythonOperator(
#         task_id="extract_cassandra_to_minio",
#         python_callable=extract_cassandra_tables_to_minio
#    )

    extract_from_cassandra = KubernetesPodOperator(
        task_id="extract_cassandra_to_minio",
        namespace="airflow",
        name="extract-cassandra",
        image="ghcr.io/cyprienklm/airflow-cassandra-minio:latest",
        cmds=["python", "-c"],
        arguments=["from script import extract_cassandra_tables_to_minio; extract_cassandra_tables_to_minio()"],
        is_delete_operator_pod=True,
        get_logs=True,
)
    
    extract_from_neo4j = KubernetesPodOperator(
        task_id="extract_neo4j_to_minio",
        namespace="airflow",
        name="extract-neo4j",
        image="ghcr.io/cyprienklm/airflow-cassandra-minio:latest",  # À créer si pas encore fait
        cmds=["python", "-c"],
        arguments=["from script import extract_neo4j_to_minio; extract_neo4j_to_minio()"],
        is_delete_operator_pod=True,
        get_logs=True,
    )
    
    transform_data = SparkKubernetesOperator(
        task_id="spark_transform",
        namespace="spark",
        application_file="spark_jobs/demo_bronze_to_silver/poc-transform.yaml",
        do_xcom_push=False,
    )

    load_on_data_warehouse = PythonOperator(
        task_id="load_to_duckdb",
        python_callable=load_to_duckdb
    )

[extract_from_postgres, extract_from_cassandra] >> transform_data >> load_on_data_warehouse
