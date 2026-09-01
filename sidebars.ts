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
      label: '04. Frontend Application',
      collapsed: true,
      items: [
        'frontend/architecture',
        'frontend/pages',
        'frontend/components',
        'frontend/state-management',
        'frontend/forms-validation',
        'frontend/error-handling-resilience',
      ],
    },
    {
      type: 'category',
      label: '05. Backend Services & Pipeline',
      collapsed: true,
      items: [
        'backend/architecture',
        'backend/services',
        'backend/middleware',
        'backend/error-handling',
        'backend/jobs-processing',
      ],
    },
    {
      type: 'category',
      label: '06. Database & Concurrency',
      collapsed: true,
      items: [
        'database/schema',
        'database/architecture',
        'database/concurrency-occ',
        'database/er-diagram',
      ],
    },
    {
      type: 'category',
      label: '07. Authentication & RBAC',
      collapsed: true,
      items: [
        'authentication/auth-rbac',
      ],
    },
    {
      type: 'category',
      label: '08. Domain Operations & FSM',
      collapsed: true,
      items: [
        'domain/case-lifecycle',
        'domain/task-lifecycle',
        'domain/priority-engine',
        'domain/evidence-audit',
      ],
    },
    {
      type: 'category',
      label: '09. Geospatial & Map Engine',
      collapsed: true,
      items: [
        'geospatial/map-engine',
        'geospatial/geojson-pipelines',
        'geospatial/critical-infrastructure',
      ],
    },
    {
      type: 'category',
      label: '10. Offline Architecture & Sync',
      collapsed: true,
      items: [
        'offline/offline-architecture',
        'offline/indexeddb-queue',
        'offline/sync-replay-occ',
      ],
    },
    {
      type: 'category',
      label: '11. Real-Time Telemetry & Outbox',
      collapsed: true,
      items: [
        'realtime/realtime-architecture',
        'realtime/transactional-outbox',
        'realtime/event-contracts',
        'realtime/subscriptions-channels',
      ],
    },
    {
      type: 'category',
      label: '12. External Data Integrations',
      collapsed: true,
      items: [
        'data-integrations/overview',
        'data-integrations/sachet-ndma',
        'data-integrations/usgs',
        'data-integrations/gdacs',
        'data-integrations/nasa-firms',
        'data-integrations/nasa-eonet',
        'data-integrations/weather-apis',
        'data-integrations/osm-overpass',
        'data-integrations/copernicus-sentinel',
        'data-integrations/waqi',
      ],
    },
    {
      type: 'category',
      label: '13. AI / ML Intelligence Engine',
      collapsed: true,
      items: [
        'ai-ml/ai-architecture',
        'ai-ml/gemini-multimodal',
        'ai-ml/mock-baseline',
        'ai-ml/prompt-engineering',
        'ai-ml/schemas-validation',
        'ai-ml/ai-decision-logging',
        'ai-ml/human-in-the-loop',
      ],
    },
    {
      type: 'category',
      label: '14. REST API Reference',
      collapsed: true,
      items: [
        'api/overview',
        'api/incidents',
        'api/cases',
        'api/tasks',
        'api/evidence',
        'api/ai-processing',
        'api/integrations',
        'api/analytics',
      ],
    },
    {
      type: 'category',
      label: '15. Testing & Quality Gates',
      collapsed: true,
      items: [
        'testing/testing-strategy',
      ],
    },
    {
      type: 'category',
      label: '16. Security Model & Hardening',
      collapsed: true,
      items: [
        'security/security-model',
      ],
    },
    {
      type: 'category',
      label: '17. Production Deployment',
      collapsed: true,
      items: [
        'deployment/deployment-guide',
      ],
    },
    {
      type: 'category',
      label: '18. Operations & Runbooks',
      collapsed: true,
      items: [
        'maintenance/runbooks',
        'maintenance/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: '19. Contributing Guidelines',
      collapsed: true,
      items: [
        'contributing/development-setup',
        'contributing/coding-standards',
      ],
    },
    {
      type: 'category',
      label: '20. Technical Reference',
      collapsed: true,
      items: [
        'reference/glossary',
        'reference/configuration',
      ],
    },
    {
      type: 'category',
      label: '21. Strategic Roadmap',
      collapsed: true,
      items: [
        'roadmap/production-roadmap',
      ],
    },
  ],
};

export default sidebars;


