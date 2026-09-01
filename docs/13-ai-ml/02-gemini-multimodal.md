---
id: gemini-multimodal
title: Google Gemini 2.5 Flash Multimodal Provider
sidebar_label: Gemini Multimodal
sidebar_position: 2
---

# Google Gemini 2.5 Flash Multimodal Provider

<span className="badge-implemented">Implemented</span>

**Source File**: `artifacts/api-server/src/ai/GeminiMultimodalProvider.ts`

The production multimodal AI provider uses Google's official TypeScript SDK (`@google/genai`) to invoke **Gemini 2.5 Flash** with low temperature (0.1) and enforced JSON output schema.


```typescript
import { GoogleGenAI } from '@google/genai';
import { DamageAssessmentOutputSchema } from './schemas';

export class GeminiMultimodalProvider implements MultimodalAssessmentProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async assessDamage(input: DamageAssessmentInput): Promise<DamageAssessmentOutput> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [
          { text: constructPrompt(input) },
          { inlineData: { mimeType: 'image/jpeg', data: input.postImageBase64 } }
        ]}
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const parsedJson = JSON.parse(response.text!);
    return DamageAssessmentOutputSchema.parse(parsedJson);
  }
}
```
