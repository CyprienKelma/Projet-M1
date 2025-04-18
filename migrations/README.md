# Database Migrations & Seeding Module

This module manages schema migrations and initial data seeding for both PostgreSQL and Cassandra databases in Kubernetes environments.

## Purpose

- Define, version, and apply schema changes for PostgreSQL and Cassandra.
- Deploy migrations and seeding as Kubernetes jobs via Helm.
- Support database resets and flexible data volumes for development/testing.

## Technologies Used

- **PostgreSQL** & **Cassandra** (databases)
- **dbmate** (PostgreSQL migrations)
- **Custom CQL scripts** (Cassandra migrations)
- **Docker** (containerized migration/seeding tools)
- **Helm** (Kubernetes deployment)
- **Node.js** & **Deno** (data seeding scripts)
- **faker.js** (realistic test data generation)

## Structure

- `postgres/` – PostgreSQL migrations (dbmate, SQL files, Dockerfile)
- `cassandra/` – Cassandra migrations (CQL scripts, Dockerfile)
- `seeding/` – Deno-based seeding scripts (Postgres & Cassandra)
- `seeding-node/` – Node.js-based seeding scripts (alternative)
- `helm/` – Helm charts for deploying migrations and seeding as jobs
- `deploy.sh` – Orchestrates build and deployment

## Prerequisites

- Docker
- Kubernetes cluster & `kubectl`
- Helm 3

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

### 1. Configure Database Connections

Edit `helm/migrations/values.yaml` and `helm/seeding/values.yaml` to set database hosts, credentials, and keyspaces.

### 2. Build and Push Migration Images

```sh
cd migrations
./deploy.sh
```
This builds Docker images for migrations and deploys them as Kubernetes jobs.

- Use `./deploy.sh --reset` to drop and recreate schemas.
- Use `./deploy.sh --seed` to run data seeding after migrations.

### 3. Creating New Migrations

**PostgreSQL:**
```sh
cd postgres
./dbmate.sh new add_new_table
# Edit the generated SQL file in postgres/migrations/
```

**Cassandra:**
- Add a new `.cql` file in `cassandra/migrations/` (e.g., `005_add_table.cql`).

### 4. Seeding Data

- Seeding jobs run automatically if `--seed` is passed to `deploy.sh`.
- Data volume (small/medium/large) can be set in values or via `DATA_VOLUME` env var.

## Monitoring & Troubleshooting

- Check job status:
  `kubectl get jobs`
- View logs:
  `kubectl logs job/<job-name>`
- Reset databases if migrations fail:
  `./deploy.sh --reset`

## Customization

- Adjust data volume for seeding (`small`, `medium`, `large`, `prod`).
- Add/modify migration scripts as needed.
- Use either Deno or Node.js seeding scripts.

## License

See main project license.
