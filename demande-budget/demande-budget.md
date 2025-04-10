# Demande de Budget – Projet Scolaire M1

## Objet de la Demande

Dans le cadre de notre projet scolaire, nous avons besoin de ressources techniques pour héberger et faire fonctionner notre architecture. Afin de répondre à ces besoins, nous sollicitons un budget pour louer un serveur VPS (Virtual Private Server) chez l'hébergeur **Hetzner**.

## Description du Besoin

Nous avons identifié une configuration de serveur qui répond à nos exigences techniques :

| Modèle VPS | vCPU | RAM    | Stockage | Bande Passante | Tarif Horaire | Coût Mensuel | Coût pour 18 jours |
|------------|------|--------|----------|----------------|----------------|--------------|--------------------|
| CX52       | 16   | 32 Go  | 320 Go   | 20 To          | 0,064 € / h     | 38,28 €      | **27,65 €**         |

> Le coût pour 18 jours a été calculé sur une base de 24h/24 :
> - CX52 → 0,064 € × 24 h × 18 j = **27,65 €**

Cette configuration garantit de bonnes performances pour l’ensemble de nos travaux pratiques, tests de charge et environnements distribués.

## Justification Technique du Changement de Serveur

Actuellement, nous utilisons un serveur de **4 vCPU et 8 Go de RAM**, mais celui-ci atteint déjà ses limites, comme le montre l’interface de surveillance Kubernetes :
- **CPU réservé : 3,65 / 4 cores → 91,25 %**
- **Mémoire réservée : 5,48 / 7,57 Go → 72,39 %**
- Le cluster Kubernetes exécute actuellement de nombreuses applications et bases de données, ainsi qu’un backend d’interaction essentiel à notre architecture applicative :
  - Cassandra
  - PostgreSQL
  - Neo4j
  - KeyDB
  - Airflow (avec plusieurs composants comme scheduler, webserver, etc.)
  - Backend (API REST) permettant l'interaction entre les utilisateurs et notre infrastructure distribuée

Nous avons récemment observé des défaillances système (crashes du cluster Kubernetes) liées au manque de ressources.

Avec la mise en place de notre pipeline de données, les besoins en ressources augmentent : réplication, orchestrations, traitements distribués, etc. Le serveur actuel ne permet plus :
- d’assurer une réplication stable des données,
- de déployer correctement la pipeline,
- ni d’exécuter un stress test minimum pour valider la robustesse de notre architecture.

Le passage à une machine avec **16 vCPU et 32 Go de RAM (CX52)** est donc nécessaire pour garantir la stabilité et la performance de notre projet.

## Facturation et Dépenses Déjà Engagées

L’hébergeur Hetzner facture mensuellement, en fonction de l’utilisation réelle du serveur. Une **facture est émise aux alentours du 3 de chaque mois**, pour le mois précédent, et doit être réglée peu après.

Nous avons déjà engagé les dépenses suivantes :

- Une première facture de **3,44 €** pour la période de **mars 2025**, datée du **03/04/2025**, dont une copie est disponible ici : [facture Hetzner_2025-04-03_084000222718](https://drive.google.com/file/d/1ZPLoAlQIqaVIecR2ky-Bxt5N6KmPA4gB/view?usp=sharing) .
- Une prévision d’utilisation du serveur entre le **1er et le 9 avril 2025** sur une configuration à **7,56 €/mois**, soit :
  > (7,56 € / 30 jours) × 9 jours = **2,27 €**
- La future utilisation du serveur CX52 sur **18 jours**, pour **27,65 €**.

Les factures sont actuellement payées via le **compte Hetzner personnel de Nathan Eudeline**, ce qui implique que nous avançons le règlement de ces montants.

Nous proposons donc que les paiements soient **avancés par l’un des membres du projet**, puis **remboursés par l’établissement** sur présentation des factures justificatives, comme celle déjà fournie.

## Budget Demandé

| Description                                                     | Montant estimé |
|----------------------------------------------------------------|----------------|
| Facture VPS mars 2025                                          | 3,44 €         |
| Prévision du 01/04 au 09/04 sur VPS à 7,56 €/mois              | 2,27 €         |
| Utilisation VPS CX52 du 10/04 au 27/04 (18 jours)              | 27,65 €        |
| **Total estimé**                                               | **33,36 €**    |

Nous demandons donc un **budget total de 34 € maximum** pour couvrir l'ensemble des dépenses engagées et à venir liées à l'hébergement du projet.

## Conclusion

Cette dépense est essentielle au bon déroulement de notre projet, notamment pour le déploiement, les tests et la collaboration. Nous nous engageons à fournir toutes les factures nécessaires à la justification des frais, ainsi qu’à documenter les modalités de remboursement.

---

**Nom de projet :** Architecture distribuée de gestion de données

**Équipe projet :**
- Cyprien Kelma – Chef de projet
- Nathan Eudeline – Chef technique
- Paul Pousset
- Mamoun Kabbaj
- Nolan Cacheux

**Date :** 09/04/2026
