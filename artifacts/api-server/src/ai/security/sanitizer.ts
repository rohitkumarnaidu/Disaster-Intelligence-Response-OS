/**
 * Prompt Injection Defense & Input Sanitization
 * 
 * Ensures untrusted field observations, filenames, metadata, and user notes
 * cannot override system instructions or inject malicious prompt delimiters.
 */

export class InputSanitizer {
  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/gi,
    /system\s*:\s*you\s+are\s+now/gi,
    /you\s+are\s+a\s+different\s+assistant/gi,
    /override\s+system\s+prompt/gi,
    /as\s+an?\s+unrestricted\s+ai/gi,
    /sudo\s+mode/gi,
    /jailbreak/gi,
    /<\s*script/gi,
    /<\s*\/\s*script/gi,
    /\[\s*system\s*\]/gi,
    /```[\s\S]*?(override|ignore|bypass)/gi
  ];

  /**
   * Sanitizes text strings intended for insertion into prompt context.
   */
  public static sanitizeText(input?: string | null, maxLength: number = 2000): string {
    if (!input) return "";

    let sanitized = String(input).trim();

    // Enforce max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + " [TRUNCATED]";
    }

    // Strip/neutralize potential prompt injection attempts
    for (const pattern of this.INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[BLOCKED_SUSPICIOUS_PROMPT_INPUT]");
    }

    // Neutralize control characters and brackets that mimic system delimiters
    sanitized = sanitized
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/<\|im_start\|>/g, "")
      .replace(/<\|im_end\|>/g, "");

    return sanitized;
  }

  /**
   * Validates and sanitizes structured metadata objects.
   */
  public static sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata || typeof metadata !== "object") return {};

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_\-\.]/g, "").substring(0, 64);
      if (!cleanKey) continue;

      if (typeof value === "string") {
        clean[cleanKey] = this.sanitizeText(value, 500);
      } else if (typeof value === "number" || typeof value === "boolean") {
        clean[cleanKey] = value;
      } else if (Array.isArray(value)) {
        clean[cleanKey] = value.slice(0, 10).map((item) =>
          typeof item === "string" ? this.sanitizeText(item, 200) : item
        );
      } else if (value && typeof value === "object") {
        clean[cleanKey] = this.sanitizeMetadata(value);
      }
    }
    return clean;
  }
}
