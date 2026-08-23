import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

function HeroBanner() {
  return (
    <header className="hero hero--dark" style={{
      background: 'linear-gradient(180deg, #0b1210 0%, #152220 100%)',
      padding: '4rem 2rem',
      borderBottom: '1px solid #253934'
    }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37, 145, 132, 0.15)', border: '1px solid #259184', padding: '4px 12px', borderRadius: '4px', marginBottom: '1.5rem' }}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#34b3a4', display: 'inline-block' }}></span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#79d0c2', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Technical Architecture & Operational Guide</span>
        </div>
        <Heading as="h1" className="hero__title" style={{ fontSize: '3.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#ffffff', lineHeight: 1.1 }}>
          DRAXELYRA
        </Heading>
        <p className="hero__subtitle" style={{ fontSize: '1.4rem', color: '#9bb3ad', maxWidth: '750px', marginTop: '1rem', lineHeight: 1.4 }}>
          Disaster Intelligence & Response OS — Turning post-disaster imagery into explainable priorities, accountable response tasks, and verified field outcomes.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <Link
            className="button button--primary button--lg"
            to="/docs/overview/introduction"
            style={{ fontWeight: 700, padding: '0.75rem 1.75rem' }}>
            Explore Documentation
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/architecture/system-architecture"
            style={{ fontWeight: 700, padding: '0.75rem 1.75rem' }}>
            System Architecture
          </Link>
          <Link
            className="button button--outline button--info button--lg"
            to="/docs/api/overview"
            style={{ fontWeight: 700, padding: '0.75rem 1.75rem' }}>
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

function PillarSection() {
  const pillars = [
    {
      title: 'Explainable Priority Engine',
      link: '/docs/domain/priority-engine',
      description: 'Transparent multi-factor ranking combining structural severity, facility criticality, population exposure, urgency time decay, and model confidence.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'State Machines & OCC',
      link: '/docs/domain/case-lifecycle',
      description: 'Strict state transition matrices for Cases and Tasks backed by PostgreSQL transactions, audit event logging, and optimistic concurrency version CAS.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Geospatial Operations',
      link: '/docs/geospatial/map-architecture',
      description: 'MapLibre GL multi-layer visualization with interactive GeoJSON overlays for Areas of Interest (AOI), infrastructure assets, detections, and field observations.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Offline-First Field Sync',
      link: '/docs/offline/offline-architecture',
      description: 'IndexedDB mutation queue in the browser with automatic replay on network reconnection, enabling tactical responders to operate disconnected.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Evidence Integrity & Uploads',
      link: '/docs/domain/evidence-management',
      description: 'Multipart file ingestion with magic-byte signature validation, SHA-256 integrity checksums, and strict path-traversal prevention.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Deterministic Scenario Replay',
      link: '/docs/api/demo',
      description: 'End-to-end replay scenarios (Chennai Urban Flood) with synthetic Sentinel-2 imagery, seeded responder personas, and predictable triage runs.',
      status: 'Development-Only',
      statusClass: 'badge-dev'
    }
  ];

  return (
    <section style={{ padding: '3.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Core Architectural Foundations</h2>
        <p style={{ color: '#9bb3ad', maxWidth: '650px', margin: '0.5rem auto 0' }}>
          Explore the developer-facing design, runtime contracts, and security boundaries powering DRAXELYRA.
        </p>
      </div>

      <div className="tactical-grid">
        {pillars.map((p, idx) => (
          <Link key={idx} to={p.link} className="tactical-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span className={p.statusClass}>{p.status}</span>
            </div>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TechStackSection() {
  const stack = [
    { category: 'Runtime & Monorepo', items: 'Node.js 24, TypeScript 5.9, pnpm Workspaces, esbuild' },
    { category: 'Backend & API', items: 'Express 5, OpenAPI 3.1, Zod v4, Pino Structured Logging' },
    { category: 'Persistence & ORM', items: 'PostgreSQL 15, Drizzle ORM, Drizzle-Zod, connect-pg-simple' },
    { category: 'Frontend Console', items: 'React 19, Vite 7, Tailwind CSS v4, Wouter, Radix UI, TanStack Query' },
    { category: 'Geospatial Engine', items: 'MapLibre GL, React-Map-GL, GeoJSON FeatureCollections, Carto Voyager' },
    { category: 'Security & Auth', items: 'Session-based Auth, Bcrypt, Granular RBAC Middleware, SHA-256 Magic-Bytes' },
  ];

  return (
    <section style={{ background: '#0b1210', padding: '3.5rem 2rem', borderTop: '1px solid #1c2b27', borderBottom: '1px solid #1c2b27' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', textAlign: 'center' }}>
          Verified Repository Technology Stack
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {stack.map((item, idx) => (
            <div key={idx} style={{ background: '#152220', border: '1px solid #253934', padding: '1.25rem', borderRadius: '6px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#34b3a4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                {item.category}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
                {item.items}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Technical Documentation and Architecture Guide for DRAXELYRA Disaster Intelligence & Response OS">
      <HeroBanner />
      <main>
        <PillarSection />
        <TechStackSection />
      </main>
    </Layout>
  );
}
