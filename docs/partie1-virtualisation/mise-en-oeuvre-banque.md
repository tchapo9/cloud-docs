---
sidebar_position: 5
title: "Projet 1 — Plateforme HA pour une banque locale"
---

# Mise en œuvre — Projet 1 Proxmox : plateforme de virtualisation HA pour une banque locale

Une banque locale souhaite héberger ses services critiques en interne. Elle exige :

- Haute disponibilité
- Tolérance aux pannes
- Sauvegarde externalisée
- Répartition intelligente des charges

## Création du cluster

Sur le nœud **pve1**, on crée un cluster, qu'on renomme `master1`, puis on clique sur **Create**.

![Création du cluster sur pve1](/img/page-20.png)

Après la création du cluster, on copie le **token** pour ajouter les autres nœuds à ce cluster. Sur le **pve2**, on clique sur **Join Cluster**, on colle le token puis on saisit le mot de passe du pve1 (idem pour le pve3).

![Join Cluster](/img/page-21.png)

On peut voir que les deux autres nœuds ont rejoint le cluster.

![Cluster Nodes rejoints](/img/page-22.png)

## Configuration réseau

Pour une bonne communication entre les nœuds et le partage des ressources, il faut que les nœuds communiquent entre eux. Chacun des nœuds doit avoir deux interfaces réseau :

1. **Interface 1** : accès par pont pour accéder à Internet.
2. **Interface 2** : réseau interne pour Ceph.

### Création du VLAN

Sur le pve1, on clique sur **Network**, puis on choisit **Linux VLAN**, et on donne l'adresse IP `10.0.0.1/24`.

![Création du VLAN pve1](/img/page-23.png)

Sur le pve2 on donne `10.0.0.2/24`, sur le pve3 `10.0.0.3/24`.

![Linux Bridge vmbr1 pve2](/img/page-24.png)

On peut voir que les réseaux sont créés sur chaque nœud.

![Réseaux créés](/img/page-25.png)

## Stockage Ceph

Le **Ceph** est une solution de stockage Open Source extrêmement puissante et populaire dans le monde du Cloud et des infrastructures serveurs. On le définit souvent comme un système de **Software-Defined Storage (SDS)** : le stockage est géré par un logiciel et non par un matériel spécifique (comme une baie de stockage propriétaire coûteuse).

Sur chaque machine, on crée un stockage sur le contrôleur SATA.

![Contrôleur SATA VirtualBox](/img/page-26.png)

On clique sur **Créer**, on donne 20 Gio.

![Création d'un disque virtuel 20 Gio](/img/page-27.png)

Le disque est bien attaché au contrôleur SATA (opération répétée pour les deux autres machines).

![Disque attaché au contrôleur SATA](/img/page-28.png)

### Installation Ceph

On installe Ceph sur le pve1, puis on configure les interfaces réseau (Publique / Cluster). Idem pour pve2 et pve3.

![Installation Ceph et configuration réseau](/img/page-29.png)

![Configuration Public/Cluster Network](/img/page-30.png)

### Monitor

On crée le monitor et on l'affecte à tous les nœuds (pve1, pve2, pve3).

![Création du Monitor Ceph](/img/page-31.png)

![Monitor pve2 / pve3](/img/page-32.png)

On fait pareil pour le Manager.

![Manager et résultat final des services (Monitors/Managers/MDS)](/img/page-33.png)

### Création des OSD

L'**OSD** (Object Storage Daemon) est l'unité de base et le composant le plus important du système de stockage Ceph : un processus logiciel dont la mission est de gérer un disque dur physique (HDD, SSD ou NVMe) au sein du cluster.

![Création d'un OSD sur pve1](/img/page-34.png)

Après l'avoir fait sur les trois nœuds, chacun a partagé son disque, ce qui fait une somme de **60 GiB**.

![OSD créés sur les trois nœuds](/img/page-35.png)

### Pool de stockage

Un pool de stockage (ou « bassin ») est un regroupement logique de ressources physiques (les disques durs). Au lieu d'utiliser chaque disque séparément, on les met tous ensemble pour créer un grand réservoir de données unique.

On crée le pool `stockage-pool` avec un niveau de réplication (`size`) de 3, en donnant une priorité de CRUSH différente à chaque nœud (pve1 : priorité 3, pve2 : priorité 2, pve3 : priorité 1).

![Création du pool de stockage Ceph](/img/page-36.png)

Le pool de stockage est bien créé et disponible sur les trois nœuds.

![Pool de stockage créé](/img/page-37.png)

### Configuration RBD

Le **RBD** (RADOS Block Device) est le format de disque utilisé par Ceph pour offrir un stockage partagé aux VM. C'est ce qui permet aux machines virtuelles de migrer instantanément d'un nœud à l'autre sans avoir à déplacer les données.

Dans *Datacenter → Storage*, on ajoute un RBD en choisissant le pool créé `stockage-pool`.

![Ajout d'un stockage RBD](/img/page-38.png)

Le RBD `ceph-storage-pool` est bien créé.

![RBD créé](/img/page-39.png)

## Création de la machine virtuelle

Avant de créer la machine virtuelle, on téléverse l'ISO Ubuntu 20.04 sur l'un des nœuds (pve1).

![Téléversement de l'ISO Ubuntu](/img/page-40.png)

On clique sur **Create VM**, on renomme la VM (`API-HA`), on choisit l'ISO téléversé, on donne la taille du disque (20 Gio sur `ceph-storage-pool`), et on choisit l'interface `vmbr0` pour l'accès à Internet.

![Assistant de création de VM](/img/page-41.png)

![Configuration disque et réseau de la VM](/img/page-42.png)

Puis on confirme la configuration et on clique sur **Finish**. On répète l'opération pour les autres machines (front-end, etc.).

![Résumé et confirmation de la VM](/img/page-43.png)

### Configuration réseau (routage)

Pour que les machines aient accès à Internet, on active le routage sur le pve :

```bash
sysctl -w net.ipv4.ip_forward=1
```

Puis on applique les règles permettant aux machines d'avoir accès à Internet :

```bash
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o vmbr0 -j MASQUERADE
iptables -A FORWARD -i vmbr0 -o vmbr0 -j ACCEPT
```

![Installation en cours des machines](/img/page-44.png)

Pour que la machine ait accès à Internet, on lui attribue la passerelle du pve1 (`192.168.1.76`) :

```bash
ip route add default via 192.168.1.76
```

Puis, dans `/etc/resolv.conf`, on remplace le nameserver par `8.8.8.8` (Google), et on vérifie la connectivité :

```bash
ping 8.8.8.8
```

On vérifie l'adresse IP de la VM (`ip addr show`) puis on s'y connecte en SSH.

![Test de connectivité et connexion SSH](/img/page-45.png)

## Déploiement de l'application

Pour des raisons de ressources, l'API et la base de données sont créées sur une même machine. Le serveur applicatif (Node.js / Express avec le moteur de template EJS) écoute sur le port `3000` et est accessible depuis l'extérieur via l'adresse IP de la VM :

```bash
node app.js
```

```
http://192.168.1.136:3000
```

![Dashboard de la plateforme bancaire](/img/page-46.png)

## Haute disponibilité

La Haute Disponibilité (*High Availability*) désigne l'ensemble des mesures techniques et organisationnelles mises en œuvre pour garantir qu'un système informatique reste opérationnel le plus longtemps possible, avec un minimum d'interruption, même en cas de panne d'un de ses composants.

On définit des règles d'**affinité de nœud (HA Node Affinity)** avec des priorités :

- **Premier choix : pve3** (priorité 3) — la VM cherchera toujours à tourner sur ce nœud en priorité.
- **Deuxième choix : pve1** (priorité 2) — si pve3 tombe en panne, la VM redémarre sur pve1.
- **Troisième choix : pve2** (priorité 1) — si pve3 **et** pve1 tombent en panne, la VM va sur pve2.

On configure également une règle d'**affinité de ressource** (*Keep Together*) pour que les deux VM applicatives restent colocalisées.

### Test de fonctionnement

Sur le pve prioritaire (pve1), on simule une panne : une migration se lance automatiquement, et la VM migre vers le pve2 (seconde priorité). On accède de nouveau au site : rien ne change, la VM ne change ni d'adresse et reste opérationnelle.

## Sauvegarde et PRA (Plan de Reprise d'Activités)

### Installation du serveur Proxmox Backup Server

On installe **Proxmox Backup Server** (PBS) sur une machine dédiée : on choisit l'interface réseau, la région (Sénégal / Africa-Dakar / clavier French), on renomme le nœud (`pbs.master1.ec2lt.sn`, IP `192.168.1.119/24`), puis on clique sur **Install**.

Après l'installation, on se connecte au dashboard de PBS. On crée un dossier `/mnt/backups` avec les droits pour l'utilisateur `backup`, puis on crée le **Datastore** `backup-tp` pointant vers ce dossier.

Dans le Datacenter Proxmox, on ajoute un stockage de type **Proxmox Backup Server** en renseignant les informations du serveur PBS et le token de jonction.

### Sauvegarde automatique

On configure une sauvegarde automatique de la VM toutes les 30 minutes (`*/30`), en mode **Snapshot**, avec compression **ZSTD**.

### Test de fonctionnement

Après 30 minutes, le dashboard PBS affiche bien 2 sauvegardes effectuées. On supprime ensuite la VM depuis le pve, puis on la restaure depuis PBS : on choisit la sauvegarde, on clique sur **Restore**, on sélectionne la VM cible et on lance la restauration. La VM est restaurée avec succès, et le site redevient accessible normalement.
