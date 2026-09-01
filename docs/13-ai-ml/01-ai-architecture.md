---
id: ai-architecture
title: Multimodal AI Architecture & Pipeline
sidebar_label: AI Architecture
sidebar_position: 1
---

# Multimodal AI Architecture & Pipeline

<span className="badge-implemented">Implemented</span>

DRAXELYRA incorporates a dual-provider multimodal AI architecture designed to execute satellite change detection, structural damage classification, and prompt-driven impact reasoning.

```mermaid
flowchart TD
    subgraph Inputs["Multimodal Telemetry Inputs"]
        IMG_PRE["Pre-Disaster Baseline Imagery"]
        IMG_POST["Post-Disaster Target Imagery"]
        VEC_OSM["OSM Critical Asset Attributes"]
        ENV_CTX["Hazard Type & Weather Conditions"]
    end

    subgraph Factory["AIProviderFactory (src/ai/AIProviderFactory.ts)"]
        DECISION{"GEMINI_API_KEY Available?"}
        P_GEMINI["GeminiMultimodalProvider (@google/genai)"]
        P_MOCK["MockVisionAssessmentProvider (Baseline CV Engine)"]
    end

    subgraph Engine["Inference & Schema Parsing"]
        PROMPT["Catalog Prompt Template"]
        LLM["Model Execution responseMimeType=application/json"]
        ZOD["Zod DamageAssessmentOutputSchema"]
    end

    subgraph Persistence["Storage & Decision Ledger"]
        DB_LOG[("PostgreSQL: ai_decision_logs")]
        CACHE["AICacheService: SHA-256 Hash Key"]
    end

    Inputs --> Factory
    DECISION -->|Yes| P_GEMINI
    DECISION -->|No| P_MOCK
    P_GEMINI & P_MOCK --> PROMPT --> LLM --> ZOD --> CACHE --> DB_LOG
```
