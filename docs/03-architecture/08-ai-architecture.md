---
id: ai-architecture
title: AI / ML Intelligence Pipeline Architecture
sidebar_label: AI Architecture
sidebar_position: 8
---

# AI / ML Intelligence Pipeline Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a dual-provider AI architecture designed to support real multimodal computer vision assessment when cloud API credentials are configured, while providing a fully deterministic baseline vision engine for air-gapped, offline, and scenario training environments.

```mermaid
flowchart TD
    subgraph Input["Input Data"]
        IMG_BEFORE[Pre-Disaster Baseline Imagery]
        IMG_AFTER[Post-Disaster Target Imagery]
        ASSET_CTX[Critical Asset Context & Exposure]
        INC_CTX[Incident Hazard & Weather Context]
    end

    subgraph Factory["AIProviderFactory (src/ai/AIProviderFactory.ts)"]
        CHECK{GEMINI_API_KEY Configured?}
        P_GEMINI[GeminiMultimodalProvider<br/>Google Gemini 2.5 Flash]
        P_MOCK[MockVisionAssessmentProvider<br/>Baseline Vision Engine v2.4]
    end

    subgraph Prompting["Prompt Template & Security Layer"]
        SANITIZE[InputSanitizer: Prompt Injection Shield]
        PROMPT_CAT[Prompt Catalog: damage_assessment_v1]
    end

    subgraph Execution["Model Execution & Schema Validation"]
        LLM[generateContent responseMimeType=application/json]
        ZOD[Zod Schema Validator: DamageAssessmentOutputSchema]
    end

    subgraph Logging["Cryptographic Audit & Caching"]
        CACHE[AICacheService: SHA-256 Input Hash]
        LOGS[(PostgreSQL: ai_decision_logs & detections)]
    end

    IMG_BEFORE & IMG_AFTER & ASSET_CTX & INC_CTX --> SANITIZE
    SANITIZE --> PROMPT_CAT --> CHECK
    CHECK -->|Yes| P_GEMINI
    CHECK -->|No| P_MOCK
    P_GEMINI & P_MOCK --> LLM --> ZOD
    ZOD --> CACHE --> LOGS
```

---

## Dual Provider Strategy

| Provider Feature | `GeminiMultimodalProvider` | `MockVisionAssessmentProvider` |
| :--- | :--- | :--- |
| **Model Engine** | Google Gemini 2.5 Flash (`@google/genai`) | `draxelyra-cv-baseline-v2` (Deterministic CV Engine) |
| **Inference Mode** | Real Vision-Language Model (VLM) Reasoning | Synthetic SAR Backscatter & Optical Index Simulator |
| **Prerequisites** | Valid `GEMINI_API_KEY` | None (Runs offline with zero configuration) |
| **Output Format** | Validated JSON conforming to Zod Schema | Validated JSON conforming to Zod Schema |
| **Token Tracking** | Captures Prompt, Completion, and Total Tokens | Emits zero-token telemetry |
| **Latency** | 800–2500 ms (Network dependent) | 20–50 ms (Local execution) |
