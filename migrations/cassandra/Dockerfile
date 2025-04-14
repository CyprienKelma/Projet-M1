FROM cassandra:4.1

WORKDIR /migrations

COPY migrations/ ./migrations/
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
