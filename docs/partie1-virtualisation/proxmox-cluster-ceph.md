---
sidebar_position: 3
title: Proxmox VE, cluster et stockage Ceph
---

# Proxmox Virtual Environment (Proxmox VE)

Proxmox VE est une plateforme open-source de virtualisation de type 1, basée sur Debian GNU/Linux. Elle intègre nativement deux technologies de virtualisation complémentaires :

- **KVM (Kernel-based Virtual Machine)** : hyperviseur complet intégré au noyau Linux, permettant de virtualiser n'importe quel système d'exploitation (Windows, Linux, FreeBSD...) avec des performances quasi-natives grâce aux extensions matérielles Intel VT-x / AMD-V.
- **LXC (Linux Containers)** : conteneurisation légère partageant le noyau de l'hôte. Les conteneurs démarrent en quelques secondes et consomment très peu de ressources. Réservé aux workloads Linux.

Proxmox VE propose une interface web unifiée accessible via le port **8006** (HTTPS), et une API RESTful complète permettant l'automatisation via Terraform, Ansible ou des scripts personnalisés.

## Architecture d'un cluster Proxmox

Proxmox est composé de 4 piliers :

| Pilier | Description |
|---|---|
| Nœud | Un serveur physique avec Proxmox installé |
| Cluster | Plusieurs nœuds avec config partagée |
| Stockage | Là où sont stockés les disques des VM/CT |
| Réseau | Comment les VM/CT communiquent |

### Premier pilier — Nœud

Un nœud Proxmox est un serveur physique (ou parfois une VM) autonome sur lequel Proxmox VE est installé. C'est l'unité de base de la plateforme. Il :
- exécute les VM et conteneurs ;
- fournit les ressources CPU, RAM, stockage local ;
- héberge l'interface web d'administration (port 8006) ;
- gère son propre réseau (bridges).

### Deuxième pilier — Cluster

Un cluster Proxmox regroupe plusieurs nœuds physiques qui partagent une vue commune de l'état du cluster via le daemon **Corosync**, qui assure la communication inter-nœuds et le **quorum** — le mécanisme qui détermine si le cluster peut prendre des décisions de démarrer des VM ou d'effectuer des migrations.

![Architecture d'un cluster Proxmox](/img/page-15.png)

| Sans Cluster | Avec Cluster |
|---|---|
| Chaque nœud est isolé | Configuration partagée |
| Pas de migration entre nœuds | Migration à chaud possible |
| Pas de haute disponibilité | HA automatique |
| Gestion nœud par nœud | Vue unifiée « Datacenter » |

#### Règle du quorum

Un cluster Proxmox a besoin d'une majorité de nœuds actifs pour fonctionner. Avec 3 nœuds, le quorum est à 2. Si 2 nœuds tombent simultanément, le cluster se met en sécurité et bloque les opérations — d'où la recommandation d'un minimum de **3 nœuds**.

Le quorum garantit qu'un cluster ne se « divise » pas en deux parties indépendantes (*split-brain*). Pour fonctionner, plus de 50 % des votes doivent être disponibles.

| Configuration | Votes totaux | Majorité requise | Pannes tolérées |
|---|---|---|---|
| 2 nœuds | 2 | 2 | 0 |
| 3 nœuds | 3 | 2 | 1 |
| 4 nœuds | 4 | 3 | 1 |
| 5 nœuds | 5 | 3 | 2 |
| 2 nœuds + QDevice | 3 | 2 | 1 |

> **NB :** dans un cluster de seulement 2 nœuds, aucune panne n'est tolérée. Si un nœud tombe, l'autre perd le quorum et refuse de fonctionner.

### Troisième pilier — Stockage

Le stockage Proxmox désigne l'endroit où sont enregistrés les disques virtuels des VM, les systèmes de fichiers des conteneurs, les templates/ISO et les backups.

| Type | Usage | Partage possible |
|---|---|---|
| Directory | Dossier sur le disque local | Non |
| LVM-thin | Volumes logiques avec thin provisioning | Non |
| ZFS | Système de fichiers avancé (snapshots, compression) | Non |
| NFS | Partage réseau (serveur NAS) | Oui |
| iSCSI | Stockage bloc via réseau | Oui |
| Ceph | Stockage distribué intégré à Proxmox | Oui |

**Stockage local** : chaque nœud a son propre espace. Simple et performant, mais les VM ne peuvent pas migrer vers un autre nœud.

**Stockage partagé** : tous les nœuds accèdent au même espace (NFS, Ceph, iSCSI). Obligatoire pour la migration à chaud et la haute disponibilité (HA).

![Stockage partagé NFS](/img/page-17.png)

### Quatrième pilier — Réseau

Le réseau Proxmox connecte les VM et conteneurs au réseau public par l'intermédiaire d'un **bridge** (pont) — un commutateur virtuel qui relie les VM au réseau physique.

## Stockage distribué avec Ceph

Dans un cluster de virtualisation, le stockage représente le défi principal de la haute disponibilité : les VM doivent être accessibles depuis n'importe quel nœud pour permettre la migration à chaud et le failover automatique. Trois grandes approches existent :

- **SAN** (Storage Area Network) : réseau de stockage dédié, performant mais coûteux, avec un point unique de défaillance potentiel.
- **NAS** (Network Attached Storage) : partage de fichiers en réseau, plus simple mais moins performant pour les I/O aléatoires des VM.
- **Stockage distribué** (Ceph, GlusterFS...) : réplication des données sur tous les nœuds, sans point unique de défaillance — solution recommandée pour les clusters HA.

### Architecture Ceph

Ceph est un système de stockage distribué open-source conçu pour être scalable, résilient et sans point unique de défaillance :

| Composant | Abréviation | Rôle |
|---|---|---|
| Monitor | MON | Maintient la carte de l'état du cluster (cluster map). Gère le quorum Ceph. Minimum 3 recommandés. |
| Manager | MGR | Expose les métriques et l'interface de gestion. Minimum 2 (actif/passif). |
| Object Storage Daemon | OSD | Gère les disques physiques. Chaque disque = 1 OSD. Assure réplication et récupération. |
| Metadata Server | MDS | Requis uniquement pour CephFS. Non nécessaire pour RBD. |
| RADOS Block Device | RBD | Interface bloc utilisée par Proxmox pour stocker les images disque des VM. |

### Algorithme CRUSH et réplication

Ceph utilise l'algorithme **CRUSH** (Controlled Replication Under Scalable Hashing) pour déterminer où stocker chaque objet dans le cluster, sans recours à un annuaire centralisé — éliminant ainsi le goulot d'étranglement d'un serveur de métadonnées central.

Le facteur de réplication (`size`) définit combien de copies de chaque donnée sont maintenues. Avec `size=3`, chaque objet est stocké sur 3 OSD distincts, idéalement sur 3 nœuds différents. Si un nœud tombe, les données restent accessibles sur les 2 autres nœuds, et Ceph lance automatiquement une réplication vers un OSD sain.
