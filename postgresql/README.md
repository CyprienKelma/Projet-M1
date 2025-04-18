# PostgreSQL Helm Chart

This Helm chart deploys a PostgreSQL cluster on Kubernetes using the [Zalando Postgres Operator](https://github.com/zalando/postgres-operator). It supports production-grade Postgres clusters, optional Citus extension, and includes an Adminer UI for database management.

## Purpose

- Deploy and manage PostgreSQL clusters on Kubernetes.
- Use Zalando Postgres Operator for automated operations (failover, backups, scaling).
- Optionally deploy Citus for distributed Postgres.
- Provide Adminer web UI for database access.

## Technologies Used

- **Kubernetes**
- **Helm**
- **Zalando Postgres Operator** & Operator UI
- **PostgreSQL** (v15/v17)
- **Adminer** (web-based DB UI)

## Structure

- `Chart.yaml` – Chart definition and dependencies
- `crds/` – Custom Resource Definitions for operator and clusters
- `templates/` – Kubernetes manifests (Postgres clusters, Adminer, helpers)
- `values.yaml` – Default configuration

## Prerequisites

- Kubernetes cluster
- Helm 3
- Sufficient storage provisioner for PVCs

## Installation

1. **Add Zalando Operator Helm repo:**
   ```sh
   helm repo add zalando https://opensource.zalando.com/postgres-operator/charts/postgres-operator
   helm repo update
   ```

2. **Install the chart:**
   ```sh
   helm install my-postgres ./postgresql
   ```

   Replace `my-postgres` with your desired release name.

## Configuration

- **Cluster settings:** Edit `templates/postgres.yaml` for team, DB name, user, version, and resources.
- **Operator settings:** Adjust in `values.yaml` or via Helm `--set`.
- **Adminer UI:** Deployed by default for web access on port 80.

## Usage

- **Access Adminer:**
  Forward port to your local machine:
  ```sh
  kubectl port-forward svc/adminer 8080:80
  ```
  Then open [http://localhost:8080](http://localhost:8080) in your browser.

- **Manage clusters:**
  Use Zalando CRDs (`postgresqls.acid.zalan.do`) to define and manage clusters.

## Customization

- **Citus extension:**
  Example manifests for Citus coordinator/workers are provided (commented in `templates/`). Uncomment and adjust as needed.
- **Scaling:**
  Change `numberOfInstances` in the Postgres manifest.
- **Storage:**
  Adjust `volume.size` in the manifest.

## Uninstallation

```sh
helm uninstall my-postgres
```

## License

See main project license.
