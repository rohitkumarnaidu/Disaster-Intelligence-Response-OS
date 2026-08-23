# Platform Roadmap

<span className="badge-planned">Planned</span>

The DRAXELYRA platform is under continuous active development. The roadmap outlines strategic architectural enhancements and functional expansions designed to scale the system for larger, concurrent disaster intelligence workflows.

## Upcoming Architectural Enhancements

### 1. Offline-First Synchronization
Implementation of local-first data caching utilizing RxDB or WatermelonDB to allow Field Responders to execute tasks and capture evidence without persistent network connectivity, synchronizing payloads when connectivity is restored.

### 2. Real-time Telemetry Services
Migration from standard HTTP polling to WebSocket/SSE streams for live tactical map updates, reducing database query overhead and providing sub-second latency for resource tracking.

### 3. Federated Authentication
Integration of OIDC (OpenID Connect) and SAML 2.0 to support SSO (Single Sign-On) against existing enterprise directories (e.g., Azure AD, Okta), critical for rapid inter-agency onboarding.

### 4. Machine Learning Ingestion Pipeline
Establishing a dedicated gRPC microservice to handle asynchronous analysis of uploaded evidence, automatically tagging media and drafting preliminary Review cases for human verification.
