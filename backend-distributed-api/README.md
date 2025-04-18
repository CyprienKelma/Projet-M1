# Backend Distributed API

This module provides a scalable, containerized backend API for the SummerTrip project, deployable on Kubernetes via Helm. It integrates multiple databases (PostgreSQL, Cassandra, Redis, Neo4j, MinIO) and exposes REST endpoints for user, group, message, notification, and storage management.

## Purpose

- Serve as the main backend for distributed data and file storage.
- Provide REST APIs for users, groups, messages, notifications, and file storage.
- Integrate with PostgreSQL, Cassandra, Redis, Neo4j, and MinIO.
- Support seeding and resetting data for development/testing.

## Technologies Used

- **NestJS** (TypeScript, REST API)
- **PostgreSQL** (relational data)
- **Cassandra** (messages, notifications)
- **Redis/KeyDB** (caching)
- **Neo4j** (graph data)
- **MinIO** (object storage)
- **Helm** (Kubernetes deployment)
- **TypeORM** (Postgres ORM)
- **cassandra-driver**, **neo4j-driver**, **minio**, **redis** (clients)

## Structure

- `src/` – NestJS modules, controllers, services, models, configs
- `helm/backend/` – Helm chart for Kubernetes deployment
- `package.json` – Project dependencies and scripts

## Prerequisites

- Kubernetes cluster
- Helm 3
- Docker image registry access (for backend image)
- Running instances of PostgreSQL, Cassandra, Redis, Neo4j, MinIO (can be deployed via other project charts)

## Configuration

Edit `helm/backend/values.yaml` to set:

- Image repository/tag
- Service type/port
- Ingress host and class
- Database connection environment variables (`connectionEnv`)

## Installation

1. **Build and push the backend Docker image** (if not already available):

   ```sh
   docker build -t <your-repo>/m1-backend:latest .
   docker push <your-repo>/m1-backend:latest
   ```

2. **Install the Helm chart:**

   ```sh
   helm install my-backend ./helm/backend
   ```

   Adjust values as needed with `-f` or `--set`.

## Usage

- **API Endpoints:**
  - `/users`, `/groups`, `/messages`, `/notifications`, `/storage`, `/health`
- **Seeding/Reset:**
  - POST to `/users/seed`, `/groups/seed`, `/messages/seed`, `/notifications/seed` to generate fake data.
  - POST to `/users/reset`, `/groups/reset`, etc. to clear tables.
- **Health Check:**
  - GET `/health` returns service status.

- **Access via Ingress:**
  - Default host: `projet.bafbi.fr` (see `values.yaml`)
  - Or use `kubectl port-forward` for local testing.

## Customization

- **Scaling:**
  Set `replicaCount` or enable autoscaling in `values.yaml`.
- **Resources:**
  Configure CPU/memory requests/limits.
- **Probes:**
  Adjust liveness/readiness probes as needed.
- **Environment:**
  Override any connection string or secret via `connectionEnv`.

## Uninstallation

```sh
helm uninstall my-backend
```

## License

See main project license.
