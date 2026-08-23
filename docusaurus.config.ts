import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'DRAXELYRA Documentation',
  tagline: 'Disaster Intelligence & Response Operating System',
  favicon: 'img/favicon.ico',

  url: 'https://docs.draxelyra.internal',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/draxelyra-social-card.png',
    navbar: {
      title: 'DRAXELYRA',
      logo: {
        alt: 'DRAXELYRA Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/architecture/system-architecture',
          label: 'Architecture',
          position: 'left',
        },
        {
          to: '/docs/api/overview',
          label: 'API Reference',
          position: 'left',
        },
        {
          to: '/docs/domain/priority-engine',
          label: 'Priority Engine',
          position: 'left',
        },
        {
          to: '/docs/roadmap/current-state',
          label: 'Roadmap',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Core Architecture',
          items: [
            { label: 'System Overview', to: '/docs/overview/introduction' },
            { label: 'System Architecture', to: '/docs/architecture/system-architecture' },
            { label: 'Priority Engine', to: '/docs/domain/priority-engine' },
            { label: 'Database Schema', to: '/docs/database/schema' },
          ],
        },
        {
          title: 'Developer Guides',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started/local-development' },
            { label: 'API Reference', to: '/docs/api/overview' },
            { label: 'State Machines & OCC', to: '/docs/domain/case-lifecycle' },
            { label: 'Testing Suite', to: '/docs/testing/testing-strategy' },
          ],
        },
        {
          title: 'Operations & Security',
          items: [
            { label: 'Security Model & RBAC', to: '/docs/authentication/security-model' },
            { label: 'Offline PWA Sync', to: '/docs/offline/offline-architecture' },
            { label: 'Deployment Guide', to: '/docs/deployment/production' },
            { label: 'Contributing', to: '/docs/contributing/development-workflow' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} DRAXELYRA Emergency Response Operations System. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'sql', 'typescript', 'powershell', 'docker'],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
