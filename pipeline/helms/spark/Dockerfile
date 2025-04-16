FROM apache/spark-py:3.4.0

USER root
RUN apt-get update && apt-get install -y openjdk-17-jdk && \
    ln -s /usr/lib/jvm/java-17-openjdk-amd64 /opt/bitnami/java

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

RUN useradd -m airflow
USER airflow