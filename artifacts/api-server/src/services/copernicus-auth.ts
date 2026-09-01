import { ProviderError } from "../providers/DataProvider";
import { logger } from "../lib/logger";

interface TokenCache {
  accessToken: string;
  expiresAt: number; // timestamp in ms
  tokenType: string;
}

export class CopernicusAuthService {
  private static instance: CopernicusAuthService;
  private tokenCache: TokenCache | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  private readonly tokenEndpoint = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

  private constructor() {}

  public static getInstance(): CopernicusAuthService {
    if (!CopernicusAuthService.instance) {
      CopernicusAuthService.instance = new CopernicusAuthService();
    }
    return CopernicusAuthService.instance;
  }

  public isConfigured(): boolean {
    const clientId = process.env.CDSE_CLIENT_ID || process.env.COPERNICUS_CLIENT_ID;
    const clientSecret = process.env.CDSE_CLIENT_SECRET || process.env.COPERNICUS_CLIENT_SECRET;
    return Boolean(clientId && clientSecret);
  }

  public async getAccessToken(forceRefresh = false): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const now = Date.now();
    if (!forceRefresh && this.tokenCache && this.tokenCache.expiresAt > now + 60000) {
      return this.tokenCache.accessToken;
    }

    // Mutex promise to prevent race conditions across concurrent queries
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const clientId = (process.env.CDSE_CLIENT_ID || process.env.COPERNICUS_CLIENT_ID)!.trim();
        const clientSecret = (process.env.CDSE_CLIENT_SECRET || process.env.COPERNICUS_CLIENT_SECRET)!.trim();

        const bodyParams = new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(this.tokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParams.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          logger.error({ status: response.status }, "Copernicus OAuth token request failed");
          if (response.status === 401 || response.status === 400) {
            throw new ProviderError({
              code: "PROVIDER_AUTH_FAILED",
              message: "Copernicus CDSE authentication failed. Invalid client credentials.",
              provider: "COPERNICUS",
              statusCode: response.status,
              retryable: false,
            });
          }
          if (response.status === 429) {
            throw new ProviderError({
              code: "PROVIDER_RATE_LIMITED",
              message: "Copernicus CDSE token endpoint rate limit exceeded.",
              provider: "COPERNICUS",
              statusCode: response.status,
              retryable: true,
            });
          }
          throw new ProviderError({
            code: "PROVIDER_UNAVAILABLE",
            message: `Copernicus CDSE identity service error (${response.status}): ${errorText.slice(0, 100)}`,
            provider: "COPERNICUS",
            statusCode: response.status,
            retryable: true,
          });
        }

        const data: any = await response.json();
        const expiresInSec = data.expires_in || 3600;
        this.tokenCache = {
          accessToken: data.access_token,
          tokenType: data.token_type || "Bearer",
          expiresAt: Date.now() + expiresInSec * 1000,
        };

        return this.tokenCache.accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public clearCache(): void {
    this.tokenCache = null;
  }
}

export const copernicusAuthService = CopernicusAuthService.getInstance();
