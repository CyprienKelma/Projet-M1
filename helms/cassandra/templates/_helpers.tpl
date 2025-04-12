{{/*
Expand the name of the chart.
*/}}
{{- define "cassandra.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "cassandra.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "cassandra.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "cassandra.labels" -}}
helm.sh/chart: {{ include "cassandra.chart" . }}
{{ include "cassandra.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "cassandra.selectorLabels" -}}
app.kubernetes.io/name: {{ include "cassandra.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "cassandra.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "cassandra.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}


{{- define "cassandra.k8ssandraClusterManifest" }}
apiVersion: k8ssandra.io/v1alpha1
kind: K8ssandraCluster
metadata:
  name: demo
spec:
  cassandra:
    serverVersion: "4.1.3"
    datacenters:
      - metadata:
          name: dc1
        size: 1
    softPodAntiAffinity: true
    # Resources must be specified for each Cassandra node when using softPodAntiAffinity
    resources:
      requests:
        cpu: "1200m"
        memory: "2Gi"
      limits:
        cpu: "2400m"
        memory: "4Gi"
    # It is also recommended to set the JVM heap size
    config:
      jvmOptions:
        heap_initial_size: 1G
        heap_max_size: 1G
    storageConfig:
      cassandraDataVolumeClaimSpec:
        storageClassName: local-path
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 5Gi
{{- end }}
