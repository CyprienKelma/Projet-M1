FROM apache/airflow:2.10.5-python3.10

USER airflow

RUN pip install --no-cache-dir \
    minio \
    duckdb \
    pandas \
    psycopg2-binary \
    apache-airflow-providers-cncf-kubernetes \
    pyspark \
    cassandra-driver \
    neo4j \
    requests \
    pyarrow \
    faker \
    sqlalchemy

USER airflow
