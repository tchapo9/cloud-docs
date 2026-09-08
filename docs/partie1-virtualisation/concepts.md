---
sidebar_position: 1
title: Virtualisation vs Cloud Computing
---

# La différence entre la virtualisation et le cloud computing

## La Virtualisation (la technologie)

La virtualisation est une technologie qui permet de créer plusieurs environnements simulés ou ressources spécialisées à partir d'un seul système physique. Son logiciel, appelé **hyperviseur**, est directement relié au matériel et permet de fragmenter ce système unique en plusieurs environnements distincts : les **machines virtuelles**.

> **Analogie :** c'est comme un gâteau (ton serveur physique) que tu coupes en plusieurs parts (tes VMs). Chaque part peut être mangée séparément.
>
> **Objectif :** rentabiliser le matériel et isoler les services.

## Le Cloud Computing (l'environnement)

Le cloud computing désigne un ensemble de principes et d'approches visant à mettre à la disposition d'utilisateurs, quel que soit le réseau, des ressources de calcul, de réseau et de stockage, ainsi que des services, des plateformes et des applications, via des portails en libre-service qui prennent en charge la mise à l'échelle automatique et l'allocation dynamique de ressources.

Le Cloud utilise la virtualisation comme moteur, mais y ajoute des couches de services :

- **Libre-service** : l'utilisateur commande sa VM via un portail web sans appeler un administrateur.
- **Élasticité** : les ressources (RAM, CPU) augmentent ou diminuent automatiquement selon la charge.
- **Facturation à l'usage** : on paie uniquement ce qu'on consomme (ex : AWS, Azure, Google Cloud).

> **Analogie :** c'est comme une boulangerie (le Cloud). Tu ne t'occupes pas de savoir comment le boulanger coupe le gâteau, tu achètes juste la part dont tu as besoin, quand tu en as besoin, et tu paies pour ce que tu manges.

![Virtualisation vs Cloud Computing](/img/page-05.png)

### Tableau comparatif

| Caractéristique | Virtualisation | Cloud Computing |
|---|---|---|
| Nature | Logiciel / Technologie | Concept / Service global |
| Gestion | Manuelle (par administrateur) | Automatisé (self-service) |
| Lieu | Souvent sur site (on-premise) | Souvent à distance (datacenters tiers) |
| Flexibilité | Limitée à la puissance du serveur | Presque infinie (élasticité) |
| Objectif | Créer plusieurs environnements simulés à partir d'un même système physique | Regrouper et automatiser des ressources virtuelles pour une utilisation à la demande |

## Définitions et notions clés

- **Machine Hôte** : terme général pour décrire tout ordinateur relié à un réseau informatique, qu'il fournisse des services à d'autres systèmes ou utilisateurs (serveur informatique, ou « système hôte »).
- **Machine virtuelle** : environnement virtualisé qui fonctionne sur une machine physique (machine hôte). Elle permet d'émuler un OS sans l'installer physiquement sur l'ordinateur.
- **Virtualisation** : mécanisme informatique qui consiste à faire fonctionner plusieurs systèmes, serveurs ou applications, sur un même serveur physique.

## Différents types de virtualisation

### A. La virtualisation Serveur

Consiste à héberger plusieurs systèmes d'exploitation sur une ressource matérielle unique. On distingue 4 types de virtualisation serveur.

**Avantages**
- Moins de serveurs physiques
- Une disponibilité accrue
- Une meilleure performance
- Une meilleure sécurité

**Inconvénients**
- Une mise en œuvre complexe
- Si la machine est hors service, tous les serveurs virtuels de cette machine ne fonctionnent pas

### B. La virtualisation au niveau OS

Consiste à créer des serveurs virtuels au niveau de la couche de l'OS (noyau). Les environnements virtuels sont créés sur le même serveur physique **et** le même OS.

### C. La virtualisation d'Application

Anciennement appelée « publication d'applications » ou « served-based computing », elle permet de mettre à disposition des applications comme des services en s'émancipant des contraintes techniques de déploiement.

**Avantages**
- Mise à jour centralisée des applications
- Gestion centralisée des droits d'accès aux applications
- Déploiement rapide des applications

**Inconvénients**
- Le support du multimédia est fragile
- Il faut des serveurs performants ; la redirection des périphériques reste compliquée

### D. Virtualisation de Poste de Travail

A pour but de réduire la dépendance entre l'ordinateur et l'utilisateur : virtualiser le bureau de l'utilisateur. Trois formes existent :

- Le Virtualization Desktop Infrastructure (VDI)
- Le Streaming OS
- L'hyperviseur Client

**Avantages**
- Création simple de nouveaux postes de travail
- Coût attractif et facilité d'utilisation pour déployer de nouvelles applications
- Sécurité des données ; accès à distance depuis un environnement de bureau d'entreprise

**Inconvénients**
- Dégradation potentielle de la performance / bande passante réseau
- Risques pour la sécurité si le réseau n'est pas correctement géré
- Complexité et coûts élevés pour le déploiement et la gestion
- Dépendance à la connectivité réseau

## Les différents types d'hyperviseur

### Hyperviseur type 1 (natif)

S'installe directement sur la couche matérielle du serveur. Ces systèmes sont allégés pour se « concentrer » sur la gestion des systèmes d'exploitation invités (les VMs). Un seul hyperviseur type 1 peut tourner à la fois sur un serveur ; la machine devient dédiée à cet usage — l'hyperviseur devient le système d'exploitation de la machine.

Solutions courantes :
- **Hyper-V** (Microsoft)
- **ESXi** (VMware, intégré dans vSphere)
- **Proxmox VE** — basé sur Linux KVM, open source
- **Citrix XenServer**

![Hyperviseur de type 1](/img/page-08.png)

> Note : Hyper-V sous Windows est un cas particulier — il s'installe comme un rôle (sauf Hyper-V Server) et donne l'impression d'être de type 2, mais il accède directement au matériel : Windows est modifié pour se placer un niveau au-dessus de l'instance Hyper-V.

### Hyperviseur de type 2 (hébergé)

Logiciel qui s'installe et s'exécute sur un système d'exploitation déjà en place (ex : Windows 10 hôte + hyperviseur pour créer des VMs). Plus de ressources sont consommées car il faut faire tourner à la fois l'hyperviseur et l'OS hôte. En contrepartie, plusieurs hyperviseurs peuvent tourner simultanément.

Solutions courantes :
- **Oracle VirtualBox** (gratuit, Windows/Linux)
- **VMware Workstation** (payant) / **VMware Workstation Player** (gratuit) / **VMware Fusion** (MacOS)

![Hyperviseur de type 2](/img/page-09.png)
