# Cassandra Helm Chart

This Helm chart deploys an Apache Cassandra cluster on Kubernetes using the [K8ssandra Operator](https://k8ssandra.io/docs/). It automates the setup of a single-datacenter Cassandra cluster, including all necessary Kubernetes resources and post-install configuration.

## Technologies Used

- **Kubernetes**: Container orchestration platform.
- **Helm**: Kubernetes package manager.
- **K8ssandra Operator**: Manages Cassandra clusters on Kubernetes.
- **Apache Cassandra**: Distributed NoSQL database.
- **Bitnami Kubectl**: Used in a post-install job to apply the cluster manifest.

## Prerequisites

- Kubernetes cluster (v1.21+ recommended)
- [Helm 3](https://helm.sh/docs/intro/install/)
- Access to the [K8ssandra Operator Helm repository](https://helm.k8ssandra.io/stable)

## Installation

1. **Add the K8ssandra Helm repository:**
   ```sh
   helm repo add k8ssandra https://helm.k8ssandra.io/stable
   helm repo update
   ```

2. **Install the chart:**
   ```sh
   helm install my-cassandra ./cassandra
   ```

   Replace `my-cassandra` with your desired release name.

## Configuration

- The default configuration deploys a Cassandra 4.1.3 cluster with one datacenter (`dc1`) and one node.
- Persistent storage is provisioned using the `local-path` storage class.
- Resource requests and limits are set for each Cassandra node.
- Soft pod anti-affinity is enabled for better scheduling.

You can customize settings by editing `values.yaml` or using `--set` during installation.

## Usage

- After installation, the chart:
  - Installs the K8ssandra Operator as a dependency.
  - Waits for the operator to be ready.
  - Applies a `K8ssandraCluster` manifest to create the Cassandra cluster.

- To check the status:
  ```sh
  kubectl get k8ssandracluster
  kubectl get pods
  ```

## Customization

- **Cluster Size**: Edit the `datacenters.size` field in the manifest or template to scale nodes.
- **Cassandra Version**: Change `serverVersion` in the manifest/template.
- **Storage**: Adjust `storageClassName` and storage size as needed.
- **Advanced Config**: Modify the `k8c1.yaml` or the template in `_helpers.tpl` for JVM options, resources, etc.

## Uninstallation

To remove the release and all associated resources:
```sh
helm uninstall my-cassandra
```

## License

This project is provided under your project's license. See the main repository for details.
