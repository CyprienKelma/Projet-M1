#!/bin/sh

echo "📦 Starting Cassandra migrations"

HOST=${CASSANDRA_HOST:-localhost}
PORT=${CASSANDRA_PORT:-9042}
USER=${CASSANDRA_USERNAME}
PASS=${CASSANDRA_PASSWORD}
KEYSPACE=${CASSANDRA_KEYSPACE:-default}

# Ensure the _migrations table exists
cqlsh $HOST $PORT -u $USER -p $PASS -e "
  CREATE KEYSPACE IF NOT EXISTS $KEYSPACE WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
  USE $KEYSPACE;
  CREATE TABLE IF NOT EXISTS m1_migrations (
    id TEXT PRIMARY KEY,
    applied_at TIMESTAMP
  );
"

for file in ./migrations/*.cql; do
  FILENAME=$(basename "$file")
  ID="${FILENAME%%.cql}"

  echo "➡️  Checking if $ID already applied..."
  APPLIED=$(cqlsh $HOST $PORT -u $USER -p $PASS -k $KEYSPACE -e "SELECT id FROM m1_migrations WHERE id = '$ID';" | grep "$ID")

  if [ -z "$APPLIED" ]; then
    echo "⚙️  Applying $FILENAME"
    cqlsh $HOST $PORT -u $USER -p $PASS -k $KEYSPACE -f "$file" &&
    cqlsh $HOST $PORT -u $USER -p $PASS -k $KEYSPACE -e "INSERT INTO m1_migrations (id, applied_at) VALUES ('$ID', toTimestamp(now()));"
  else
    echo "✅ $ID already applied"
  fi
done

echo "✅ All migrations complete"
