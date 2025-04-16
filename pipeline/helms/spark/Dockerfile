FROM apache/spark-py:3.4.0

USER root

RUN apt-get update && apt-get install -y openjdk-17-jdk \
 && rm -rf /opt/bitnami/java \
 && ln -s /usr/lib/jvm/java-17-openjdk-amd64 /opt/bitnami/java

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:/opt/bitnami/python/bin:$PATH"

RUN pip install pyspark==3.4.0

RUN useradd -m airflow
USER airflow
