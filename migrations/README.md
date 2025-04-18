# Database Migrations Module

This module manages database schemas for both PostgreSQL and Cassandra databases using containerized migration tools and Helm charts for Kubernetes deployment.

## Overview

The migrations module provides an organized approach to:
- Define, version and apply database schema changes
- Deploy migrations as Kubernetes jobs
- Support both PostgreSQL and Cassandra databases
- Reset databases when needed during development

## Architecture

The system consists of:

- **PostgreSQL migrations**: Using [dbmate](https://github.com/amacneil/dbmate) for SQL migrations
- **Cassandra migrations**: Using custom CQL scripts with versioning
- **Helm chart**: For deploying as Kubernetes jobs
- **Docker images**: Containerized migration tools

## Database Schema

```mermaid
classDiagram

%% === PostgreSQL Tables ===
class PG_Users {
    +int id
    +string first_name
    +string last_name
    +string email
    +string password
    +timestamp created_at
    +timestamp updated_at
}

class PG_Groups {
    +int id
    +string name
    +string description
    +timestamp created_at
    +timestamp updated_at
}

class PG_GroupsUsersUser {
    +int groups_id
    +int users_id
}

class PG_Activities {
    +int id
    +int group_id
    +int user_id
    +string activity_type
    +string title
    +string description
    +string location
    +timestamp scheduled_at
    +string status
    +timestamp created_at
}

class PG_NotificationStates {
    +int id
    +int user_id
    +int notification_id
    +string status
    +timestamp updated_at
}

%% === Cassandra Tables ===
class C_GroupMessages {
    +uuid group_id
    +timestamp created_at
    +uuid message_id
    +uuid user_id
    +string content
}

class C_UserNotifications {
    +uuid user_id
    +timestamp notification_time
    +uuid notification_id
    +string content
    +string state
    +timestamp modified_at
}

class C_UserPurchases {
    +uuid user_id
    +timestamp purchase_time
    +uuid purchase_id
    +string product_type
    +decimal amount
    +string currency
}

class C_UserSessionEvents {
    +uuid user_id
    +timestamp event_time
    +uuid session_id
    +string event_type
}

%% === PostgreSQL Relationships ===
PG_Users "1" --> "many" PG_GroupsUsersUser : participates
PG_Groups "1" --> "many" PG_GroupsUsersUser : contains
PG_Users "1" --> "many" PG_Activities : performs
PG_Groups "1" --> "many" PG_Activities : hosts
PG_Users "1" --> "many" PG_NotificationStates : receives

%% === Symbolic Cassandra Links ===
C_GroupMessages ..> PG_Groups : group_id
C_GroupMessages ..> PG_Users : user_id
C_UserNotifications ..> PG_Users : user_id
C_UserPurchases ..> PG_Users : user_id
C_UserSessionEvents ..> PG_Users : user_id
PG_NotificationStates ..> C_UserNotifications : references
```

## Usage

### Prerequisites

- Docker installed and configured
- Access to a Kubernetes cluster
- `kubectl` configured to access your cluster
- `helm` installed

### Configuration

Edit the `helm/migrations/values.yaml` file to configure database connection details:

```yaml
postgresql:
  env:
    host: your-postgres-host
    username: your-username
    password: your-password
    database: your-database

cassandra:
  env:
    host: your-cassandra-host
    username: your-username
    password: your-password
    keyspace: your-keyspace
```

### Creating New Migrations

### PostgreSQL

1. Navigate to the `postgres` directory
2. Create a new migration using the dbmate script:
   ```bash
   ./dbmate.sh new your_migration_name
   ```
   This will create a new SQL file in `postgres/migrations/` with the naming convention `YYYYMMDDHHMMSS_your_migration_name.sql`

3. Edit the file and add your schema changes between the `-- migrate:up` and `-- migrate:down` markers:
   ```sql
   -- migrate:up
   CREATE TABLE your_table (
     id SERIAL PRIMARY KEY,
     name TEXT
   );

   -- migrate:down
   DROP TABLE IF EXISTS your_table;
   ```

#### Cassandra

1. Create a new CQL file in `cassandra/migrations/` with the naming convention `NNN_description.cql`
2. Add your CQL commands to create or modify tables

### Building and Deploying

Use the provided deploy script:

```bash
# Deploy migrations
./deploy.sh

# Deploy with database reset (caution: destroys data)
./deploy.sh --reset
```

## How It Works

1. Docker images are built for both PostgreSQL and Cassandra migrations
2. Helm deploys Kubernetes jobs that run these images
3. PostgreSQL migrations use dbmate to track and apply changes
4. Cassandra migrations use a custom script to track applied migrations in a table
5. Each migration runs only once

## Troubleshooting

- Check Kubernetes job logs: `kubectl logs job/migrations-postgres-migrations`
- Verify database connectivity from within cluster
- Use `--reset` flag to start fresh if migrations are in a failed state
