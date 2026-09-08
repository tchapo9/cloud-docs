---
sidebar_position: 1
---

# Rapport sur le Cloud Computing

**École Centrale des Logiciels Libres et de Télécommunications (EC2LT)**

Présenté par : Tchapo TCHEDRE, Emile Royal MOLOWA ESSONGA, Leonel, Clevy BANZOULOU, Junior

Sous la supervision de : Mr. BASSENE

## Introduction

Aujourd'hui, notre monde est confronté à une évolution permanente dans les domaines de l'informatique, de l'environnement et de la société.

Les entreprises qui utilisent des serveurs pour traiter leurs données doivent organiser leurs infrastructures informatiques de manière à être les plus efficientes possible. Afin d'optimiser leurs ressources et de réduire les coûts, elles ont recours à la **virtualisation**.

Ce mécanisme informatique permet de mutualiser les capacités de chaque serveur, offrant ainsi des économies sur l'infrastructure physique. Toutefois, la virtualisation présente certaines contraintes techniques : pour être mise en place, elle nécessite l'intervention d'un expert dans ce domaine. De plus, bien que rentable à long terme, elle peut engendrer des dépenses initiales importantes pour l'entreprise.

Prenons un exemple concret : une entreprise ayant besoin de plusieurs serveurs peut se procurer un unique serveur physique. Grâce à un **hyperviseur** installé sur ce serveur « hôte », elle pourra créer et gérer plusieurs serveurs virtuels — les **Serveurs Privés Virtuels** (VPS) ou « Virtual Environment » (VE).

Grâce à la virtualisation, l'entreprise pourra réaliser des économies à la fois sur le plan énergétique et financier, comparé à l'installation de plusieurs serveurs physiques.

## Sommaire

### Partie 1 — Virtualisation, Cloud et Proxmox
- [Virtualisation vs Cloud Computing](/partie1-virtualisation/concepts)
- [Architectures Cloud](/partie1-virtualisation/architecture-cloud)
- [Proxmox VE, cluster et stockage](/partie1-virtualisation/proxmox-cluster-ceph)
- [Haute disponibilité et sauvegarde](/partie1-virtualisation/ha-backup)
- [Mise en œuvre — Projet 1 : Plateforme HA pour une banque locale](/partie1-virtualisation/mise-en-oeuvre-banque)

### Partie 2 — Cloud privé OpenStack
- [Mise en œuvre — Déploiement d'une application scalable avec OpenStack](/partie2-openstack/mise-en-oeuvre-openstack)
  (inclut la conclusion générale du rapport)
