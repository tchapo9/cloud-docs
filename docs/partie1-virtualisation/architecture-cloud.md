---
sidebar_position: 2
title: Architectures Cloud
---

# Définition de l'architecture cloud

Une architecture cloud est un modèle pour l'intégration des technologies qui permettent de créer des environnements informatiques qui dissocient, regroupent et partagent des ressources évolutives sur un réseau. Elle indique la manière dont les composants et fonctionnalités nécessaires à la conception d'un cloud sont connectés afin de fournir une plateforme en ligne sur laquelle les applications s'exécuteront.

Les clouds sont considérés comme des PaaS (Platform-as-a-Service) puisque le fournisseur fournit à la fois la plateforme et l'infrastructure informatique sous-jacente.

## Architecture de cloud public

Un cloud public est une infrastructure informatique dans laquelle un fournisseur de services met des ressources à la disposition du public via internet (stockage, applications, machines virtuelles). Il permet une évolutivité et un partage des ressources qu'une seule organisation ne pourrait pas réaliser autrement.

### Structure du cloud public

- **SaaS (Software as a Service)** : un fournisseur distribue des logiciels hébergés dans le cloud, accessibles via internet. Élimine le besoin d'installation locale et réduit les coûts d'assistance et de maintenance.
- **PaaS (Platform as a Service)** : permet à une organisation de développer des logiciels sans maintenir l'infrastructure sous-jacente. Comprend souvent des services de contrôle de version, de compilation, et des ressources informatiques/stockage.
- **IaaS (Infrastructure as a Service)** : une organisation externalise la totalité de son centre de données auprès d'un fournisseur cloud, qui héberge serveurs, stockage et matériel réseau, et maintient la virtualisation. Souvent plus rentable que l'achat/maintenance de matériel sur place.

## Architecture de cloud privé

Le cloud privé offre un environnement propriétaire dédié à une seule entité commerciale, via des composants physiques stockés sur place ou dans le centre de données d'un fournisseur — généralement à l'intérieur du pare-feu.

### Avantages
- **Sécurité et conformité** : données sensibles conservées sur du matériel inaccessible à des tiers, adapté aux secteurs fortement réglementés.
- **Personnalisation** : environnement entièrement configurable par l'organisation qui l'utilise.
- **Intégration hybride** : possibilité d'étendre les ressources vers un cloud public en cas de besoin supplémentaire.

### Inconvénients
- **Coûts initiaux** élevés (matériel + architecte expert requis)
- **Utilisation de la capacité** : l'organisation est responsable de maximiser l'usage — un déploiement sous-utilisé coûte cher
- **Évolutivité** plus lente que sur un cloud public

## Architecture de cloud hybride

Environnement informatique qui intègre systèmes sur site, ressources de cloud privé et services de cloud public dans un cadre unifié et interconnecté, permettant aux données et charges de travail de se déplacer dynamiquement.

### Avantages
- **Flexibilité** : choisir la meilleure architecture de déploiement selon la charge de travail
- **Rentabilité** : optimiser les coûts en évitant le sur-provisionnement
- **Sécurité et conformité** : données sensibles sur site / cloud privé + certifications des fournisseurs publics
- **Haute disponibilité et reprise après sinistre** : redondance entre environnements
- **Évolutivité et performances** : adaptation dynamique des ressources

### Inconvénients
- **Complexité** : gérer plusieurs plateformes, systèmes sur site et composants réseau
- **Gestion des coûts** : outils de gestion, licences, et frais de transmission entre fournisseurs

## Architecture multicloud

Système informatique qui comprend au moins deux clouds (privés ou publics), mis en réseau ou non.

**Avantage** : offre de nombreuses opportunités d'améliorer l'agilité informatique et la flexibilité.
