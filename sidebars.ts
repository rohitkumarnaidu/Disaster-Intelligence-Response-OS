import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: '01. Overview',
      collapsed: false,
      items: [
        'overview/introduction',
        'overview/product-overview',
        'overview/core-concepts',
        'overview/terminology',
      ],
    },
    {
      type: 'category',
      label: '02. Getting Started',
      collapsed: false,
      items: [
        'getting-started/prerequisites',
        'getting-started/installation',
        'getting-started/local-development',
        'getting-started/environment-variables',
        'getting-started/first-run',
      ],
    },
    {
      type: 'category',
      label: '03. Architecture',
      collapsed: true,
      items: [
        'architecture/system-architecture',
        'architecture/architecture-principles',
        'architecture/request-flow',
        'architecture/data-flow',
        'architecture/frontend-architecture',
        'architecture/backend-architecture',
        'architecture/database-architecture',
        'architecture/ai-architecture',
      ],
    },
    {
      type: 'category',
      label: '04. Frontend',
      collapsed: true,
      items: [
        'frontend/architecture',
        'frontend/pages',
        'frontend/components',
        'frontend/offline-pwa',
      ],
    },
    {
      type: 'category',
      label: '05. Backend',
      collapsed: true,
      items: [
        'backend/architecture',
        'backend/services',
        'backend/error-handling',
      ],
    },
    {
      type: 'category',
      label: '06. Database',
      collapsed: true,
      items: [
        'database/schema',
        'database/architecture',
        'database/concurrency',
      ],
    },
    {
      type: 'category',
      label: '07. Authentication & RBAC',
      collapsed: true,
      items: [
        'authentication/authentication-rbac',
      ],
    },
    {
      type: 'category',
      label: '08. Domain Operations',
      collapsed: true,
      items: [
        'domain/case-lifecycle',
        'domain/task-evidence-audit',
        'domain/priority-engine',
      ],
    },
    {
      type: 'category',
      label: '09. Geospatial & Offline',
      collapsed: true,
      items: [
        'geospatial/map-engine',
        'geospatial/offline-sync',
      ],
    },
    {
      type: 'category',
      label: '10. AI / ML Intelligence',
      collapsed: true,
      items: [
        'ai-ml/intelligence-pipeline',
      ],
    },
    {
      type: 'category',
      label: '11. API Reference',
      collapsed: true,
      items: [
        'api/overview',
        'api/endpoints',
      ],
    },
    {
      type: 'category',
      label: '12. Testing',
      collapsed: true,
      items: [
        'testing/testing',
      ],
    },
    {
      type: 'category',
      label: '13. Security & Hardening',
      collapsed: true,
      items: [
        'security/security',
      ],
    },
    {
      type: 'category',
      label: '14. Deployment & DevOps',
      collapsed: true,
      items: [
        'deployment/deployment',
      ],
    },
    {
      type: 'category',
      label: '15. Maintenance & Runbooks',
      collapsed: true,
      items: [
        'maintenance/operations',
      ],
    },
    {
      type: 'category',
      label: '16. Contributing',
      collapsed: true,
      items: [
        'contributing/contributing',
      ],
    },
    {
      type: 'category',
      label: '17. Technical Reference',
      collapsed: true,
      items: [
        'reference/reference',
      ],
    },
    {
      type: 'category',
      label: '18. Roadmap',
      collapsed: true,
      items: [
        'roadmap/roadmap',
      ],
    },
  ],
};

export default sidebars;
