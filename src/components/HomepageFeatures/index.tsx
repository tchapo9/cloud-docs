import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Virtualisation & Proxmox',
    Svg: require('@site/static/img/proxmox.svg').default,
    description: (
      <>
        Maîtrisez les concepts de la <strong>virtualisation</strong>, les
        hyperviseurs de type 1 et 2, et découvrez comment déployer un
        <strong> cluster Proxmox VE</strong> avec stockage distribué
        <strong> Ceph</strong> pour une infrastructure résiliente.
      </>
    ),
  },
  {
    title: 'Haute Disponibilité & Sauvegarde',
    Svg: require('@site/static/img/HDS.svg').default,
    description: (
      <>
        Mettez en place la <strong>haute disponibilité</strong> avec le HA
        Manager de Proxmox, les règles d'affinité, le <strong>fencing</strong>,
        et configurez <strong>Proxmox Backup Server</strong> pour la
        sauvegarde et la reprise d'activités.
      </>
    ),
  },
  {
    title: 'Cloud Privé OpenStack',
    Svg: require('@site/static/img/openstack.svg').default,
    description: (
      <>
        Déployez un <strong>cloud privé</strong> avec OpenStack (DevStack),
        configurez <strong>Neutron</strong>, <strong>Glance</strong>,
        <strong> Heat</strong>, et mettez en place un
        <strong> load balancer HAProxy</strong> avec mise à l'échelle
        automatique.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((feature, index) => (
            <Feature key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
