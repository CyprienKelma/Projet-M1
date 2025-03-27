Projet M1 - Backend NestJS with Distributed Storage (PostgreSQL, Cassandra, Neo4j, Redis, Bucket)

## Introduction

This project constitutes an advanced RESTful backend solution developed with NestJS to manage a distributed and scalable data architecture, suitable for the Summer-Trip web application. Faced with rapid growth in data volume and complexity, this application requires a robust, scalable, and resilient solution, integrating several specialized databases (PostgreSQL, Cassandra, Neo4j, Redis, and S3-compatible Bucket).

## Project Context

Conducted as part of the Master 1 Big Data at JUNIA ISEN (2024), the project addresses the following problem:

"How to develop the data architecture of a storage system to ensure its scalability and resilience in the face of increasing load and data volume?"

The backend (Nolan Cacheux) particularly covers the management and advanced testing of each storage system through the use of automatically generated fictitious data, thus ensuring a complete technical validation of the distributed architecture.

## Project Objectives

- Provide a distributed REST API to manage users, messages, notifications, groups, and files.
- Ensure data persistence with PostgreSQL, Cassandra, Neo4j, Redis, and Bucket.
- Optimize performance via Redis caching.
- Automate multi-container deployment with Docker and Docker Compose.
- Analyze performance and test integration using advanced Jupyter Notebooks.
- Efficiently manage horizontal scalability.

## Installation & Deployment with Docker

1. Clone the project

```bash
git clone https://github.com/nolancacheux/backend-distributed-api.git
cd backend-distributed-api
```

2. Configure the .env file

Create a .env file at the root of the project with:

```env
PORT=3000
NODE_ENV=development

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=mydb

REDIS_HOST=redis
REDIS_PORT=6379

NEO4J_HOST=neo4j
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

CASSANDRA_HOST=cassandra
CASSANDRA_PORT=9042

STORAGE_ENDPOINT=http://storage
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=appbucket
```

3. Build and launch the Docker containers

```bash
docker-compose up -d --build
```

The API will be accessible at: http://localhost:3000

4. Generate fictitious data for testing

Use the dedicated scripts to populate each database:

```bash
docker exec -it backend-api npx ts-node src/scripts/postgres_fake_data.ts
docker exec -it backend-api npx ts-node src/scripts/cassandra_fake_data.ts
docker exec -it backend-api npx ts-node src/scripts/neo4j_fake_data.ts
docker exec -it backend-api npx ts-node src/scripts/storage_upload_test.ts
```

5. Analyze performance via Notebooks

Use the available Jupyter notebooks in notebooks/ to test and analyze the API.

6. Restart the Docker containers if necessary

```bash
docker-compose down
docker-compose up -d --build
```

## Detailed Project Structure

```
Projet-M1/
├── backend-distributed-api/
│   ├── dist/                        # Compiled files after build
│   ├── node_modules/                # Project dependencies
│   ├── notebooks/                   # API tests and performance analysis
│   │   ├── api_tests.ipynb          # Complete tests of different DBs
│   │   └── data_analysis.ipynb      # Advanced analyses (later)
│   ├── src/
│   │   ├── config/                  # General & DB configurations
│   │   │   ├── config.module.ts
│   │   │   ├── postgres.config.ts
│   │   │   ├── redis.config.ts
│   │   │   ├── neo4j.config.ts
│   │   │   ├── cassandra.config.ts
│   │   │   └── storage.config.ts
│   │   ├── controllers/             # REST API controllers
│   │   │   ├── user.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── group.controller.ts
│   │   │   └── storage.controller.ts
│   │   ├── databases/               # Specific modules for each DB
│   │   │   ├── postgres/
│   │   │   │   ├── postgres.module.ts
│   │   │   │   └── postgres.provider.ts
│   │   │   ├── redis/
│   │   │   │   ├── redis.module.ts
│   │   │   │   └── redis.provider.ts
│   │   │   ├── neo4j/
│   │   │   │   ├── neo4j.module.ts
│   │   │   │   └── neo4j.provider.ts
│   │   │   ├── cassandra/
│   │   │   │   ├── cassandra.module.ts
│   │   │   │   └── cassandra.provider.ts
│   │   │   └── storage/
│   │   │       ├── storage.module.ts
│   │   │       └── storage.provider.ts
│   │   ├── models/                  # Data schemas by DB
│   │   │   ├── postgres/
│   │   │   │   ├── user.entity.ts
│   │   │   │   └── group.entity.ts
│   │   │   ├── cassandra/
│   │   │   │   ├── message.model.ts
│   │   │   │   └── notification.model.ts
│   │   │   └── neo4j/
│   │   │       └── relationship.model.ts
│   │   ├── services/                # Business logic
│   │   │   ├── postgres/
│   │   │   │   ├── user.service.ts
│   │   │   │   └── group.service.ts
│   │   │   ├── cassandra/
│   │   │   │   ├── message.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── neo4j/
│   │   │   │   └── relationship.service.ts
│   │   │   ├── redis/
│   │   │   │   └── cache.service.ts
│   │   │   └── storage/
│   │   │       └── file-storage.service.ts
│   │   ├── scripts/                 # Advanced utility scripts
│   │   │   ├── postgres_fake_data.ts
│   │   │   ├── cassandra_fake_data.ts
│   │   │   ├── neo4j_fake_data.ts
│   │   │   └── storage_upload_test.ts
│   │   ├── shared/                  # Common interfaces and DTOs
│   │   │   ├── dto/
│   │   │   │   ├── user.dto.ts
│   │   │   │   ├── message.dto.ts
│   │   │   │   └── notification.dto.ts
│   │   │   └── interfaces/
│   │   │       └── generic.interface.ts
│   │   ├── app.module.ts            # NestJS root module
│   │   └── main.ts                  # Application entry point
│   ├── uploads/                     # Temporary file storage before Bucket upload
│   ├── .dockerignore
│   ├── .env                         # Global environment variables
│   ├── .gitignore
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
```

## Folder Descriptions

- **config/**: Configuration modules for each DB.
- **controllers/**: Management of REST routes for each entity.
- **databases/**: Providers and specific modules for DB connections.
- **models/**: Schemas and entities by DB.
- **services/**: Business logic for interactions with DBs.
- **scripts/**: Scripts for generating fictitious data for tests.
- **shared/**: Shared DTOs and interfaces between services.
- **uploads/**: Temporary file storage before sending to Bucket.
