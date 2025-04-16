FROM apache/spark-py:3.4.0

USER root
RUN apt-get update && apt-get install -y openjdk-17-jdk && \
    ln -s /usr/lib/jvm/java-17-openjdk-amd64 /opt/bitnami/java

# Pour rendre spark-submit accessible globalement
ENV JAVA_HOME=/opt/bitnami/java
ENV PATH="/opt/bitnami/java/bin:/opt/bitnami/python/bin:$PATH"

RUN useradd -m airflow
USER airflow
