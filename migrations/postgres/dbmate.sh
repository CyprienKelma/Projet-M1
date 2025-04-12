#!/bin/bash

# Run dbmate via Docker and write migrations to ./migrations/ correctly

# Config
MIGRATIONS_DIR="./migrations"
DOCKER_IMAGE="amacneil/dbmate:latest"
CONTAINER_DIR="/db/migrations"

# Get current UID and GID
USER_ID=$(id -u)
GROUP_ID=$(id -g)

# Ensure migrations dir exists
mkdir -p "${MIGRATIONS_DIR}"

# Load .env if exists
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | xargs)
fi

# Run dbmate from container, with project mounted at /workspace
docker run --rm \
  -u "$USER_ID:$GROUP_ID" \
  -v "$MIGRATIONS_DIR:$CONTAINER_DIR" \
  "$DOCKER_IMAGE" "$@"
