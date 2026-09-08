/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Partie 1 — Virtualisation & Proxmox',
      collapsed: false,
      items: [
        'partie1-virtualisation/concepts',
        'partie1-virtualisation/architecture-cloud',
        'partie1-virtualisation/proxmox-cluster-ceph',
        'partie1-virtualisation/ha-backup',
        'partie1-virtualisation/mise-en-oeuvre-banque',
      ],
    },
    {
      type: 'category',
      label: 'Partie 2 — Cloud privé OpenStack',
      collapsed: false,
      items: [
        'partie2-openstack/mise-en-oeuvre-openstack',
      ],
    },
  ],
};

module.exports = sidebars;
