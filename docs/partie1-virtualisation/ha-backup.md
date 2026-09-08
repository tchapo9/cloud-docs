---
sidebar_position: 4
title: Haute disponibilité et sauvegarde
---

# Haute Disponibilité (HA)

## Définition et métriques

La haute disponibilité (HA) désigne la capacité d'un système à rester opérationnel malgré la défaillance d'un ou plusieurs de ses composants. Elle se mesure principalement par deux métriques :

- **RTO** (Recovery Time Objective) : durée maximale tolérable d'interruption de service après un incident. Pour un système bancaire critique, le RTO est typiquement inférieur à 15 minutes.
- **RPO** (Recovery Point Objective) : quantité maximale de données qu'on peut se permettre de perdre, exprimée en unité de temps. Un RPO de 1 heure signifie que la dernière sauvegarde doit dater de moins d'une heure.

## HA Manager Proxmox

Le HA Manager de Proxmox surveille en permanence l'état des VM et des nœuds du cluster. En cas de détection d'une panne (timeout Corosync, watchdog matériel), il orchestre automatiquement :

- L'isolation du nœud défaillant (**fencing**) pour éviter le *Split-Brain* — situation où deux nœuds pensent chacun être le seul actif et écrivent simultanément sur le même disque.
- La migration d'urgence (restart) des VM vers un nœud sain du cluster.
- Le respect des règles d'affinité et d'anti-affinité pour le replacement des VM.

## Règles d'affinité et d'anti-affinité

Les règles d'**affinité** définissent quelles VM doivent être colocalisées sur le même nœud (latence, cohérence), tandis que les règles d'**anti-affinité** imposent la séparation de VM critiques sur des nœuds distincts pour éviter qu'une panne d'un seul nœud n'impacte simultanément plusieurs services essentiels.

| Type de règle | Exemple d'usage | Bénéfice |
|---|---|---|
| Affinité (colocation) | Serveur Web + Cache Redis sur même nœud | Latence réduite entre composants liés |
| Anti-affinité (séparation) | Primaire et réplique de BDD sur nœuds différents | Panne d'un nœud n'impacte pas les 2 instances |

# Sauvegarde et Plan de Reprise d'Activités (PRA)

## Proxmox Backup Server (PBS)

Proxmox Backup Server est une solution de sauvegarde dédiée aux environnements Proxmox. Ses caractéristiques principales :

- **Sauvegarde incrémentale** basée sur les blocs modifiés (Changed Block Tracking) : seules les données modifiées depuis la dernière sauvegarde sont transmises, réduisant drastiquement le temps et la bande passante nécessaires.
- **Déduplication et compression** côté serveur : optimisation de l'espace de stockage.
- **Chiffrement AES-256** côté client : les données sont chiffrées avant transmission vers le serveur de sauvegarde.
- **Vérification d'intégrité automatique** : PBS vérifie régulièrement que les sauvegardes sont lisibles et non corrompues.

Le Backup est l'action de copier et d'archiver des données numériques (fichiers, bases de données, ou machines virtuelles entières) sur un support ou un serveur distinct de l'emplacement d'origine. L'objectif est de pouvoir restaurer ces données à un état antérieur en cas de perte, de suppression accidentelle, de cyberattaque (ransomware) ou de panne matérielle majeure.

*La mise en œuvre pratique du HA, du fencing/migration automatique et de l'installation/configuration de Proxmox Backup Server est détaillée dans la [mise en œuvre du Projet 1](/partie1-virtualisation/mise-en-oeuvre-banque).*
