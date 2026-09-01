export type DataMode = "DEMO" | "REAL";

export type FreshnessClass =
  | "LIVE"
  | "NEAR_REAL_TIME"
  | "ACQUISITION_DEPENDENT"
  | "PERIODIC"
  | "CACHED"
  | "HISTORICAL"
  | "UNKNOWN";

export type DataSourceStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "HEALTHY"
  | "DEGRADED"
  | "AUTH_ERROR"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "DISABLED";

export type QualityStatus =
  | "DISCOVERED"
  | "VALIDATING"
  | "READY"
  | "UNSUITABLE"
  | "UNSUITABLE_FOR_OPTICAL_ASSESSMENT"
  | "DOWNLOADING"
  | "DOWNLOADED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";

export type JobType =
  | "DISCOVERY"
  | "DOWNLOAD"
  | "PREPROCESS"
  | "CHANGE_DETECTION"
  | "THUMBNAIL"
  | "GEOJSON_EXTRACTION";

export type JobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type ProviderErrorCode =
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_INVALID_RESPONSE"
  | "PROVIDER_NOT_FOUND"
  | "PROVIDER_INVALID_REQUEST";

export class ProviderError extends Error {
  public readonly code: ProviderErrorCode;
  public readonly provider: string;
  public readonly retryable: boolean;
  public readonly statusCode?: number;

  constructor(options: {
    code: ProviderErrorCode;
    message: string;
    provider: string;
    retryable?: boolean;
    statusCode?: number;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = "ProviderError";
    this.code = options.code;
    this.provider = options.provider;
    this.retryable = options.retryable ?? (options.code === "PROVIDER_TIMEOUT" || options.code === "PROVIDER_RATE_LIMITED" || options.code === "PROVIDER_UNAVAILABLE");
    this.statusCode = options.statusCode;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export interface EarthObservationItem {
  externalId: string;
  provider: string;
  collection: string;
  platform: string;
  datetime: string;
  startDatetime?: string;
  endDatetime?: string;
  geometry: {
    type: "Polygon" | "MultiPolygon" | string;
    coordinates: any;
  };
  bbox: [number, number, number, number];
  cloudCover?: number;
  processingLevel: string;
  polarization?: string[];
  orbit?: "ASCENDING" | "DESCENDING" | string;
  assets: Record<string, { href: string; type?: string; title?: string }>;
  providerMetadata: Record<string, any>;
  qualityStatus: QualityStatus;
  dataMode: DataMode;
  catalogUrl?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
}

export interface SearchParams {
  aoi?: {
    type: string;
    coordinates: any;
  } | null;
  bbox?: [number, number, number, number];
  startDate?: string;
  endDate?: string;
  collection?: string;
  maxCloudCover?: number;
  limit?: number;
  cursor?: string;
}

export interface SearchResult {
  items: EarthObservationItem[];
  nextCursor?: string;
  totalCount?: number;
  sourceStatus: DataSourceStatus;
  provider: string;
}

export interface ProviderHealth {
  provider: string;
  name: string;
  type: string;
  configured: boolean;
  reachable: boolean;
  authenticated: boolean;
  latencyMs: number;
  freshnessClass?: FreshnessClass;
  coverage?: string;
  lastSuccess?: string;
  lastError?: string;
  status: DataSourceStatus;
  checkedAt: string;
}

export interface DataProvider {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  search(params: SearchParams): Promise<SearchResult>;
  getMetadata(externalId: string): Promise<EarthObservationItem>;
  download?(externalId: string, assetKey?: string, destPath?: string): Promise<{ localUri: string; size: number; checksum: string }>;
  healthCheck(): Promise<ProviderHealth>;
}
