---
sidebar_position: 1
title: "Déploiement d'une application scalable dans un cloud privé"
---

# Partie 2 — Déploiement d'une application scalable dans un cloud privé

L'objectif de cette mise en œuvre est de concevoir et de mettre en œuvre une infrastructure de cloud privé basée sur **OpenStack**, puis d'y déployer une application scalable, sécurisée et accessible depuis l'extérieur. Le déploiement d'OpenStack est réalisé en utilisant la méthode **DevStack** en mode *all-in-one*.

On met en avant le principe de la répartition de charge avec un **Load balancer (Nginx/HAProxy)**, mis en place pour répartir la charge entre les machines applicatives situées derrière lui ainsi qu'avec la base de données, afin de rendre le service tolérant aux pannes — et le principe de sécurité en bloquant tout scan de port depuis l'extérieur grâce à **port security**.

## Processus de mise en place de l'environnement

### Prérequis

- Machine Ubuntu 24
- Mémoire RAM 8 Go maximum
- CPU 4

Lors de la création de la machine, on active la virtualisation assistée par le matériel :

```bash
.\VBoxManage.exe modifyvm "masterStack" --nested-hw-virt on
```

### Installation des dépendances

```bash
apt update
apt install snapd
apt install git-all
```

### Préparation de l'environnement

On crée un compte utilisateur dédié à l'administration du cloud OpenStack, avec son shell et son répertoire, qui contiendra le script d'installation ainsi que les différents modules d'OpenStack (Nova, Neutron, Keystone, Glance, Horizon, etc.) :

```bash
useradd -s /bin/bash -d /opt/stack -m stack
chmod +x /opt/stack
```

Ce compte n'a pas besoin de se connecter avec les droits sudo et ne doit pas contenir de mot de passe : l'idée est de ne **jamais** exécuter DevStack en root, mais via l'utilisateur `stack`, pour limiter les risques et garder un environnement isolé.

```bash
echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack
sudo -u stack -i
```

### Augmentation de la mémoire swap

Une fois installé et démarré, OpenStack lance simultanément de nombreux services, chacun consommant de la mémoire. Sans swap, le système peut planter dès que la RAM est saturée.

```bash
free -h

# Création d'un fichier swap
fallocate -l 16G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
swapon --show
```

![Configuration du swap](/img/page-48.png)

### Téléchargement du dépôt DevStack

```bash
git clone https://opendev.org/openstack/devstack
cd devstack/
```

![Clonage du dépôt DevStack](/img/page-49.png)

Dans ce dossier, on crée le fichier de configuration `local.conf`, qui contient les paramètres d'accès pour la gestion d'OpenStack et les identifiants de la base de données et des services :

```ini
[[local|localrc]]
# ==================== CREDENTIALS ====================
ADMIN_PASSWORD=AdminSecure123
DATABASE_PASSWORD=$ADMIN_PASSWORD
RABBIT_PASSWORD=$ADMIN_PASSWORD
SERVICE_PASSWORD=$ADMIN_PASSWORD

# ==================== HOST CONFIG ====================
HOST_IP=192.168.1.70   # Remplacer par l'IP de votre machine

enable_plugin heat https://opendev.org/openstack/heat

enable_service h-eng
enable_service h-api
enable_service h-api-cfn
enable_service h-api-cw
```

![Fichier local.conf](/img/page-50.png)

Puis on lance le script de configuration automatique de l'environnement OpenStack :

```bash
./stack.sh
```

À l'issue de l'installation, Horizon (le dashboard) est disponible à `http://<HOST_IP>/dashboard`, et Keystone à `http://<HOST_IP>/identity/`.

![Interface graphique Horizon](/img/page-51.png)

### Vérification et administration en ligne de commande

```bash
openstack --version
```

Pour administrer le cloud privé depuis la ligne de commande avec les droits administrateur, on charge les variables d'environnement Keystone :

```bash
source openrc admin admin
```

Le fichier `openrc` contient les identifiants et paramètres d'accès à l'environnement OpenStack :

- `OS_USERNAME` — le nom d'utilisateur (ici `admin`)
- `OS_PASSWORD` — le mot de passe associé
- `OS_PROJECT_NAME` — le projet auquel l'utilisateur appartient
- `OS_AUTH_URL` — l'URL du service d'authentification Keystone

![Version OpenStack et source openrc](/img/page-52.png)

## Création des comptes utilisateurs et management de projet

On crée des comptes utilisateurs qui ont pour rôle de membre et pour fonction d'administrer les différents projets créés, afin de mettre en place le principe d'isolation.

### Création des projets

Trois projets sont créés sous OpenStack pour simuler un cloud privé bancaire : un projet central `Projet_Banque` qui regroupe l'infrastructure, et deux projets applicatifs dédiés au développement du front-end (`Projet_Dev`) et destiné aux clients (`Projet_Client`). Les développeurs accèdent directement au code, tandis que les clients utilisent l'application via un Load Balancer géré par HAProxy.

```bash
openstack project create --description "Projet Banque Locale" Projet_Banque
openstack project create Projet_Dev
openstack project create Projet_Client
openstack project list
```

![Création des projets OpenStack](/img/page-53.png)

### Création des comptes utilisateurs associés aux projets

```bash
openstack user create --project Projet_Dev --password passer123 dev
openstack user create --project Projet_Client --password passer123 client
```

![Liste des projets](/img/page-55.png)

### Gestion de rôle

Un rôle est la personnalité qu'un utilisateur assume et qui lui permet d'effectuer un ensemble spécifique d'opérations. Pour chaque projet, on associe un utilisateur pour la séparation des responsabilités (par défaut, le compte `admin` est le seul compte ayant accès au contenu de tous les projets) :

```bash
openstack role add --user dev --project Projet_Dev member
openstack role add --user client --project Projet_Client member
```

![Attribution des rôles](/img/page-57.png)

### Stratégie de séparation

La banque requiert une séparation stricte entre plusieurs domaines fonctionnels, chacun correspondant à un projet OpenStack (tenant) avec ses propres quotas, réseaux et utilisateurs :

| Projet | Utilisateurs | Quota VM | Usage |
|---|---|---|---|
| admin-banque | admin | Illimité | Administration globale du cloud |
| Application222 | dev | 10 VM / 40 GB RAM | Environnement de développement et tests |
| Application1 | client | 30 VM / 128 GB RAM | Infrastructure de production bancaire |
| BaseDonnee | dev | 5 VM / 16 GB RAM | Accès et stockage des informations clientes |
| LoadBalance | admin | 5 VM / 16 GB RAM | Répartiteur de charge |

## Configuration du réseau

OpenStack Networking (**Neutron**) est un service autonome qui déploie souvent plusieurs services de processus à travers plusieurs nœuds. Le processus principal est `neutron-server`, un démon Python qui expose l'API réseau et transmet les requêtes locataires à une suite de plug-ins.

Composants réseau principaux :

- **Neutron Server** (`neutron-server`, `neutron-plugin`) : sert l'API réseau et ses extensions, applique le modèle réseau et l'adressage IP.
- **Agent de plugin** (`neutron-agent`) : gère le commutateur virtuel local (vSwitch) sur chaque nœud de calcul.
- **Agent DHCP** (`neutron-dhcp-agent`) : fournit les services DHCP aux réseaux locataires.
- **Agent L3** (`neutron-l3-agent`) : fournit le transfert L3/NAT pour l'accès réseau externe des VM.
- **Services de fournisseur réseau (SDN)** : services de réseautage supplémentaires, interagissant via des API REST.

Une configuration standard comprend jusqu'à quatre réseaux physiques distincts : réseau de gestion, réseau invité, réseau externe et réseau API.

![Architecture réseau OpenStack](/img/page-58.png)

### Création de routeur

```bash
openstack router create route-banque
openstack router list
```

![Création du routeur](/img/page-59.png)

Connexion du routeur au réseau public (externe) :

```bash
openstack router set --external-gateway public route-banque
```

### Création du réseau privé et du sous-réseau

```bash
openstack network create banque-net

openstack subnet create --network banque-net --subnet-range 10.10.0.0/24 \
  --dns-nameserver 8.8.8.8 banque-subnet
```

![Création du réseau et du sous-réseau](/img/page-60.png)

```bash
openstack router add subnet route-banque banque-subnet
openstack router set --external-gateway public route-banque
```

### Création du groupe de sécurité (Security Groups)

Dans OpenStack, un groupe de sécurité agit comme un pare-feu virtuel : il contrôle le trafic réseau autorisé à entrer (*Ingress*) et à sortir (*Egress*) des ressources auxquelles il est associé.

```bash
openstack security group create sg-banque
```

![Création du groupe de sécurité](/img/page-61.png)

### Gestion des règles de firewall et port security

Un **port** dans le cadre d'OpenStack Neutron est un point de connexion entre les sous-réseaux et les éléments réseau. On ajoute au groupe de sécurité les règles pour les services suivants :

```bash
# SSH
openstack security group rule create --proto tcp --dst-port 22 sg-banque

# HTTP
openstack security group rule create --proto tcp --dst-port 80 sg-banque
```

![Règles SSH et HTTP](/img/page-62.png)

```bash
# HTTPS
openstack security group rule create --proto tcp --dst-port 443 sg-banque
```

![Règle HTTPS](/img/page-63.png)

Il est important d'ajouter également le protocole **ICMP**, pour permettre les tests de connectivité (ping) :

```bash
openstack security group rule create --proto icmp sg-banque
```

![Règle ICMP](/img/page-64.png)

## Service d'image

Le service d'Image (**Glance**) permet aux utilisateurs de découvrir, enregistrer et récupérer les images de machines virtuelles, via une API REST. Les images peuvent être stockées à différents emplacements, du simple système de fichiers au stockage objet.

```bash
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img \
  -O ubuntu-22.04.qcow2
```

![Téléchargement de l'image Ubuntu 22.04](/img/page-65.png)

### Création d'une image Ubuntu

```bash
openstack image create "Ubuntu 22.04" --disk-format qcow2 \
  --container-format bare --public --file ubuntu-22.04.qcow2
```

![Création de l'image](/img/page-66.png)

```bash
openstack image list
```

![Liste des images](/img/page-67.png)

## Création de flavor

Dans OpenStack, un **flavor** (gabarit) est un modèle matériel qui définit les caractéristiques de calcul, de mémoire et de stockage allouées à une instance.

```bash
openstack flavor create --id 6 --ram 1024 --disk 5 --vcpus 1 m1.banque
```

## Création des instances

Les instances sont créées dans l'ordre suivant :

### Load Balancer

```bash
openstack server create --flavor m1.banque --image "Ubuntu 22.04" \
  --network banque-net LoadBalance
```

![Création de l'instance LoadBalance](/img/page-68.png)

### Base de données

```bash
openstack server create --flavor m1.banque --image "Ubuntu 22.04" \
  --network banque-net BaseDonnee
```

### Instances applicatives

```bash
openstack server create --flavor m3.banque --image "Ubuntu 22.04" \
  --network banque-net Application1

openstack server create --flavor m3.banque --image "Ubuntu 22.04" \
  --network banque-net Application2
```

![Création des instances applicatives](/img/page-69.png)

Vérification :

```bash
openstack server list
```

![Liste des instances](/img/page-70.png)

## Notion d'adresse IP flottante (Floating IP)

Une IP flottante est une adresse IP publique et routable réservée depuis un pool externe, qui peut être associée et dissociée dynamiquement d'une instance. Elle permet d'exposer un service au trafic externe sans modifier l'adresse IP privée de la VM.

```bash
openstack floating ip create public
openstack floating ip list
```

![Création et liste des IP flottantes](/img/page-71.png)

```bash
openstack server add floating ip LoadBalance 172.24.4.70
```

## Gestion des accès aux instances

La gestion des accès aux instances OpenStack repose sur l'utilisation d'une paire de clés SSH (publique et privée). Lors de la création d'une instance, OpenStack injecte la clé publique dans la machine virtuelle, permettant une connexion chiffrée et sans mot de passe.

```bash
ssh-keygen -t rsa -b 4096
# Fichier : cle-ssh / cle-ssh.pub

openstack keypair create --public-key cle-ssh.pub cle-ssh
```

![Génération et import de la paire de clés SSH](/img/page-72.png)

On ajoute la clé d'accès SSH au niveau des instances déjà créées :

```bash
openstack server rebuild --key-name cle-ssh --image "Ubuntu 22.04" LoadBalance
```

(opération répétée pour les autres instances).

## Test de connectivité

Dans une installation OVN, le trafic « flottant » reste bloqué au niveau du pont `br-ex` car le système hôte ne sait pas qu'il doit lui-même avoir une adresse dans ce réseau pour parler aux VMs.

```bash
sudo ip addr add 172.24.4.1/24 dev br-ex
sudo ip link set br-ex up
```

### Activation de l'IP Forwarding

```bash
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
```

### Activation du NAT (Masquerade)

```bash
sudo iptables -t nat -A POSTROUTING -o enp0s3 -j MASQUERADE
iptables -t nat -L POSTROUTING -v -n
```

Vérification que le SNAT est activé :

```bash
openstack router show route-banque -c enable_snat
```

Le test de connectivité avec le Load Balancer depuis l'extérieur fonctionne correctement :

```bash
ping 172.24.4.70
ssh -i cle-ssh ubuntu@172.24.4.70
```

## Déploiement du Load Balancer

```bash
sudo apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring

curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
  | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null

gpg --dry-run --quiet --no-keyring --import --import-options import-show \
  /usr/share/keyrings/nginx-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
https://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" \
  | sudo tee /etc/apt/sources.list.d/nginx.list

echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" \
  | sudo tee /etc/apt/preferences.d/99nginx

apt update
apt install nginx
```

### Installation de HAProxy

```bash
sudo apt install haproxy -y
```

### Configuration de HAProxy

Création du compte utilisateur `haproxy` :

```bash
sudo useradd -r -s /sbin/nologin haproxy
```

Création de `/etc/systemd/system/haproxy.service` :

```ini
[Unit]
Description=HAProxy Load Balancer
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStartPre=/usr/local/sbin/haproxy -c -f /etc/haproxy/haproxy.cfg
ExecStart=/usr/local/sbin/haproxy -Ws -f /etc/haproxy.cfg -p /run/haproxy.pid
ExecReload=/bin/kill -USR2 $MAINPID
Restart=on-failure
User=haproxy
Group=haproxy
RuntimeDirectory=haproxy
RuntimeDirectoryMode=0755

[Install]
WantedBy=multi-user.target
```

Puis on active le service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now haproxy
```

## Mise à l'échelle (Auto Scaling)

La mise à l'échelle automatique est réalisée avec **Heat**, le service d'orchestration d'OpenStack, via un template déclarant un groupe auto-scalable (`OS::Heat::AutoScalingGroup`) instanciant des serveurs Nova (`OS::Nova::Server`) :

```yaml
heat_template_version: 2018-08-31

parameters:
  metadata:
    type: json
    default: {}
  image:
    type: string
    default: Ubuntu 22.04
  flavor:
    type: string
    default: m1.small
  network:
    type: string
    default: banque-net

resources:
  asg:
    type: OS::Heat::AutoScalingGroup
    properties:
      min_size: 1
      max_size: 3

      resource:
        type: OS::Nova::Server
        properties:
          name: ScalingImage

          image:
            get_param: image

          flavor:
            get_param: flavor

          networks:
            - network:
                get_param: network

          security_groups:
            - sg-banque
```

Création et vérification de la pile (*stack*) :

```bash
openstack stack create -t autoscaling.yaml stack-banque
openstack stack list
```

## Conclusion de la mise en œuvre

Dans la première partie, nous avons mis en place une plateforme de virtualisation basée sur **Proxmox VE** en intégrant un cluster haute disponibilité reposant sur le stockage distribué **Ceph**. Cette réalisation a permis de garantir la tolérance aux pannes, la migration des machines virtuelles, la sauvegarde centralisée et la continuité des services critiques. Les tests effectués ont démontré l'efficacité des mécanismes de haute disponibilité et de reprise après incident.

Dans la seconde partie, nous avons déployé un cloud privé à l'aide d'**OpenStack** en mode DevStack, en configurant les services nécessaires à la gestion des ressources, des réseaux, des images et des instances virtuelles. L'infrastructure mise en place a permis le déploiement d'une application scalable reposant sur plusieurs instances applicatives, une base de données et un répartiteur de charge. Les mécanismes de sécurité, de gestion des accès et de connectivité ont également été mis en œuvre afin de garantir un environnement fiable et sécurisé.
