#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="airflow"
POD_NAME="duckdb-copy"
YAML_PATH="$SCRIPT_DIR/duckdb-copy.yaml"
REMOTE_PATH="/opt/airflow/duckdb/analytics.duckdb"
LOCAL_PATH="$SCRIPT_DIR/analytics.duckdb"

kubectl apply -f "$YAML_PATH"

echo "Waiting for pod to be ready..."
kubectl wait --for=condition=Ready pod/$POD_NAME -n $NAMESPACE --timeout=60s

kubectl cp "$NAMESPACE/$POD_NAME:$REMOTE_PATH" "$LOCAL_PATH"

kubectl delete pod "$POD_NAME" -n $NAMESPACE

echo "Done. File copied to $LOCAL_PATH"
