import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

function HeroBanner() {
  return (
    <header className="hero hero--dark" style={{
      background: 'linear-gradient(180deg, #0b1210 0%, #131f1c 100%)',
      padding: '2.5rem 1.5rem',
      borderBottom: '1px solid #1c2b27'
    }}>
      <div className="container" style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 145, 132, 0.12)', border: '1px solid rgba(37, 145, 132, 0.4)', padding: '3px 10px', borderRadius: '4px', marginBottom: '1rem' }}>
          <span style={{ height: '6px', width: '6px', borderRadius: '50%', background: '#34b3a4', display: 'inline-block' }}></span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#79d0c2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Technical Architecture & Operational Guide</span>
        </div>
        <Heading as="h1" className="hero__title" style={{ fontSize: '2.3rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#ffffff', lineHeight: 1.15, margin: 0 }}>
          DRAXELYRA
        </Heading>
        <p className="hero__subtitle" style={{ fontSize: '1.05rem', color: '#9bb3ad', maxWidth: '680px', marginTop: '0.75rem', marginBottom: '1.5rem', lineHeight: 1.45 }}>
          Disaster Intelligence & Response OS — Turning post-disaster imagery into explainable priorities, accountable response tasks, and verified field outcomes.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            className="button button--primary"
            to="/docs/overview/introduction"
            style={{ fontWeight: 650, padding: '0.45rem 1.25rem', fontSize: '0.88rem' }}>
            Explore Documentation
          </Link>
          <Link
            className="button button--secondary"
            to="/docs/architecture/system-architecture"
            style={{ fontWeight: 650, padding: '0.45rem 1.25rem', fontSize: '0.88rem' }}>
            System Architecture
          </Link>
          <Link
            className="button button--outline button--info"
            to="/docs/api/overview"
            style={{ fontWeight: 650, padding: '0.45rem 1.25rem', fontSize: '0.88rem' }}>
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
      description: 'Multi-factor ranking combining severity, criticality, exposure, time urgency decay, and model confidence.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'State Machines & OCC',
      link: '/docs/domain/case-lifecycle',
      description: 'Strict state transition matrices for Cases and Tasks backed by PostgreSQL transactions and OCC version checks.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Geospatial Operations',
      link: '/docs/geospatial/map-engine',
      description: 'MapLibre GL multi-layer visualization with interactive GeoJSON overlays for AOIs, critical assets, and detections.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Offline-First Field Sync',
      link: '/docs/offline/offline-architecture',
      description: 'IndexedDB mutation queue with automatic replay on network reconnection for disconnected field responders.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Evidence Integrity',
      link: '/docs/domain/evidence-audit',
      description: 'Multipart file ingestion with magic-byte header validation, SHA-256 integrity checksums, and traversal defenses.',
      status: 'Implemented',
      statusClass: 'badge-implemented'
    },
    {
      title: 'Deterministic Scenario Replay',
      link: '/docs/api/overview',
      description: 'End-to-end replay scenarios (Chennai Urban Flood) with synthetic Sentinel-2 imagery and seeded personas.',
      status: 'Development-Only',
      statusClass: 'badge-dev'
    }
  ];




  return (
    <section style={{ padding: '2.5rem 1.5rem', maxWidth: '1050px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.45rem', textTransform: 'uppercase', letterSpacing: '0.04em', border: 'none', margin: 0 }}>Core Architectural Foundations</h2>
        <p style={{ color: '#9bb3ad', maxWidth: '600px', margin: '0.35rem auto 0', fontSize: '0.88rem' }}>
          Explore runtime contracts, state machines, and security boundaries powering DRAXELYRA.
        </p>
      </div>

      <div className="tactical-grid">
        {pillars.map((p, idx) => (
          <Link key={idx} to={p.link} className="tactical-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
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
    { category: 'Security & Auth', items: 'Session-based Auth, Bcrypt, Granular RBAC, SHA-256 Magic-Bytes' },
  ];

  return (
    <section style={{ background: '#090e0d', padding: '2.5rem 1.5rem', borderTop: '1px solid #1c2b27', borderBottom: '1px solid #1c2b27' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1.25rem', textAlign: 'center', border: 'none' }}>
          Verified Repository Technology Stack
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {stack.map((item, idx) => (
            <div key={idx} style={{ background: '#121c1a', border: '1px solid #1c2b27', padding: '1rem', borderRadius: '5px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#34b3a4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                {item.category}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
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
