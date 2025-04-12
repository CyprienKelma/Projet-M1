FROM amacneil/dbmate:latest
WORKDIR /app
COPY ./migrations ./db/migrations

CMD ["dbmate", "--wait", "--no-dump-schema", "up"]
