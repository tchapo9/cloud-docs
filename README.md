# Rapport Cloud Computing — EC2LT

Site web du rapport sur le Cloud Computing, présentant la virtualisation, Proxmox HA et le cloud privé OpenStack.

## Technologies

- [Docusaurus](https://docusaurus.io/) — générateur de sites statiques
- Proxmox VE — virtualisation et cluster HA
- Ceph — stockage distribué
- OpenStack — cloud privé

## Développement local

```bash
npm install
npm run start
```

## Build

```bash
npm run build
```

## Déploiement

Le site est déployé automatiquement sur GitHub Pages via GitHub Actions à chaque push sur `main`.

URL : https://tchapo9.github.io/cloud-docs/
