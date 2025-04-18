#!/bin/bash

RESET_FLAG=false
SEED_FLAG=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --reset) RESET_FLAG=true ;;
    --seed) SEED_FLAG=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Configuration
MIGRATIONS_CHART_NAME="migrations"
SEEDING_CHART_NAME="seeding"
NAMESPACE="default"
MIGRATIONS_RELEASE_NAME="migrations"
SEEDING_RELEASE_NAME="seeding"

echo "🚀 Building and pushing Docker images..."

# Build and push Cassandra migrations
echo "📦 Building Cassandra migrations image"
cd "$(dirname "$0")/cassandra" || exit 1
./build-and-push.sh
if [ $? -ne 0 ]; then
  echo "❌ Failed to build/push Cassandra migrations image"
  exit 1
fi
cd ../

# Build and push Postgres migrations
echo "📦 Building Postgres migrations image"
cd "$(dirname "$0")/postgres" || exit 1
./build-and-push.sh
if [ $? -ne 0 ]; then
  echo "❌ Failed to build/push Postgres migrations image"
  exit 1
fi
cd ../

# Build and push Seeding image if needed
if [ "$SEED_FLAG" = true ]; then
  echo "📦 Building Database Seeding image"
  cd "$(dirname "$0")/seeding-node" || exit 1
  ./build-and-push.sh
  if [ $? -ne 0 ]; then
    echo "❌ Failed to build/push Database Seeding image"
    exit 1
  fi
    cd ../
fi

# Deploy Migrations Helm chart
cd "$(dirname "$0")/helm" || exit 1
echo "⚙️ Deploying Migrations Helm chart..."

if [ "$RESET_FLAG" = true ]; then
  echo "🧨 Reset flag detected - databases will be reset"
  helm upgrade --install $MIGRATIONS_RELEASE_NAME $MIGRATIONS_CHART_NAME \
    --namespace $NAMESPACE \
    --set postgresql.reset=true \
    --set cassandra.reset=true
else
  helm upgrade --install $MIGRATIONS_RELEASE_NAME $MIGRATIONS_CHART_NAME \
    --namespace $NAMESPACE
fi

if [ $? -ne 0 ]; then
  echo "❌ Migrations deployment failed"
  exit 1
fi

echo "🔍 Monitoring migration jobs..."
kubectl get jobs -n $NAMESPACE | grep $MIGRATIONS_RELEASE_NAME

# Wait for migrations to complete if seeding is requested
if [ "$SEED_FLAG" = true ]; then
  echo "⏳ Waiting for migrations to complete before seeding..."

  # Wait for PostgreSQL migrations to complete
  echo "⏳ Waiting for PostgreSQL migrations..."
  kubectl wait --for=condition=complete --timeout=120s job/$MIGRATIONS_RELEASE_NAME-postgres-migrations -n $NAMESPACE
  if [ $? -ne 0 ]; then
    echo "❌ PostgreSQL migrations did not complete in time"
    exit 1
  fi

  # Wait for Cassandra migrations to complete
  echo "⏳ Waiting for Cassandra migrations..."
  kubectl wait --for=condition=complete --timeout=120s job/$MIGRATIONS_RELEASE_NAME-cassandra-migrations -n $NAMESPACE
  if [ $? -ne 0 ]; then
    echo "❌ Cassandra migrations did not complete in time"
    exit 1
  fi

  # Deploy Seeding Helm chart
  echo "🌱 Deploying Database Seeding Helm chart..."

  # Determine data volume based on reset flag
  DATA_VOLUME="small"
  if [ "$RESET_FLAG" = true ]; then
    # Use medium volume when resetting to populate with more data
    DATA_VOLUME="medium"
  fi

  helm upgrade --install $SEEDING_RELEASE_NAME $SEEDING_CHART_NAME \
    --namespace $NAMESPACE \
    --set seeding.dataVolume=$DATA_VOLUME

  if [ $? -eq 0 ]; then
    echo "✅ Seeding job started successfully"
    kubectl get jobs -n $NAMESPACE | grep $SEEDING_RELEASE_NAME
  else
    echo "❌ Seeding deployment failed"
    exit 1
  fi
fi

echo "✅ Deployment completed successfully"
