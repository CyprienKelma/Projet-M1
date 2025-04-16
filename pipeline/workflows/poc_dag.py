from airflow import DAG
from kubernetes.client import models as k8s
from airflow.operators.python import PythonOperator
from airflow.providers.cncf.kubernetes.operators.spark_kubernetes import SparkKubernetesOperator, KubernetesPodOperator
#from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator

from datetime import datetime
from proof_of_concept.script.extract_load import extract_postgres_to_minio,extract_cassandra_tables_to_minio,load_to_duckdb,extract_neo4j_to_minio
#from pipeline.dags.proof_of_concept.script.extract_load import extract_postgres_to_minio,extract_cassandra_tables_to_minio,load_to_duckdb


with DAG("poc_pipeline",
         start_date=datetime(2024, 1, 1),
         schedule_interval=None,
         catchup=False) as dag:

    extract_from_postgres = extract_postgres_to_minio()

    extract_from_cassandra = extract_cassandra_tables_to_minio()
    
    extract_from_neo4j = extract_neo4j_to_minio()
    
    # transform_data = SparkKubernetesOperator(
    #     task_id="spark_transform",
    #     namespace="spark",
    #     application_file="spark_jobs/demo_bronze_to_silver/poc-transform.yaml",
    #     do_xcom_push=False,
    # )

    transform_data = KubernetesPodOperator(
        task_id="spark_transform",
        namespace="spark", # la ou on execute le pod
        image="apache/spark-py:v3.4.0",
        cmds=["bash", "-c"],
        arguments=[
            "USER=${USER:-airflow} && "
            "echo \"$USER:x:1000:1000:$USER:/home/$USER:/bin/bash\" >> /etc/passwd && "
            "mkdir -p /tmp/.ivy2/local && chmod -R 777 /tmp/.ivy2 && "
            "export IVY_HOME=/tmp/.ivy2 && export HOME=/tmp && "
            "/opt/spark/bin/spark-submit "
            "--conf spark.driver.extraJavaOptions=-Divy.home=/tmp/.ivy2 "
            "--conf spark.executor.extraJavaOptions=-Divy.home=/tmp/.ivy2 "
            "--conf spark.jars.ivy=/tmp/.ivy2 "
            "--conf spark.hadoop.security.authentication=NOSASL "
            "/opt/spark/scripts/bronze_to_silver.py"
        ],
        name="spark-transform-job", # <-- du pod kubernetes (doit être unique !)
        is_delete_operator_pod=True, # delete à chaque fin de task
        get_logs=True, # dans l'ui d'airflow
        volume_mounts=[  # dit où le contenu de la ConfigMap sera monté dans le conteneur spark
            k8s.V1VolumeMount(
                name="script-volume",
                mount_path="/opt/spark/scripts",  # emplacement des scripts dans le conteneur
                read_only=True
            )
        ],
        volumes=[ # config du volume dans le pod
            k8s.V1Volume(
                name="script-volume",
                config_map=k8s.V1ConfigMapVolumeSource(
                    name="bronze-to-silver-script"
                )
            )
        ],
        env_vars={ # pour que spark se co à minio
            "AWS_ACCESS_KEY_ID": "minio",
            "AWS_SECRET_ACCESS_KEY": "minio123",
            "AWS_ENDPOINT": "http://minio-tenant.minio-tenant.svc.cluster.local:9000",
            "SPARK_LOCAL_DIRS": "/tmp",
            "HOME": "/tmp",
            "IVY_HOME": "/tmp/.ivy2",
            "USER": "airflow"
        }
    )


    load_on_data_warehouse = PythonOperator(
        task_id="load_to_duckdb",
        python_callable=load_to_duckdb
    )

[extract_from_postgres, extract_from_cassandra, extract_from_neo4j] >> transform_data >> load_on_data_warehouse
