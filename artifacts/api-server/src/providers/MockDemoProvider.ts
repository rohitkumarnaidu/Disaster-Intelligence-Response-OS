import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
} from "./DataProvider";

export class MockDemoProvider implements DataProvider {
  public readonly id = "mock-demo-provider";
  public readonly name = "Deterministic Demo Provider";
  public readonly type = "MOCK_PROVIDER";

  public async search(params: SearchParams): Promise<SearchResult> {
    const isS1 = (params.collection || "").includes("sentinel-1");
    const collection = isS1 ? "sentinel-1-grd" : "sentinel-2-l2a";

    const items: EarthObservationItem[] = [
      {
        externalId: "S1A_IW_GRDH_1SDV_20260828T123456_050000_05EF12_DEMO",
        provider: "DEMO",
        collection: "sentinel-1-grd",
        platform: "Sentinel-1A",
        datetime: "2026-08-28T12:34:56.000Z",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [80.15, 12.95],
              [80.32, 12.95],
              [80.32, 13.15],
              [80.15, 13.15],
              [80.15, 12.95],
            ],
          ],
        },
        bbox: [80.15, 12.95, 80.32, 13.15],
        processingLevel: "LEVEL1",
        polarization: ["VV", "VH"],
        orbit: "ASCENDING",
        assets: {
          overview: { href: "/demo-imagery/post-flood-s1.png", title: "SAR Backscatter Overview" },
        },
        providerMetadata: { mode: "IW", resolution: "10m", pass: "Ascending" },
        qualityStatus: "READY",
        dataMode: "DEMO",
        catalogUrl: "https://dataspace.copernicus.eu/demo-s1",
      },
      {
        externalId: "S1A_IW_GRDH_1SDV_20260816T123456_049800_05EE44_DEMO",
        provider: "DEMO",
        collection: "sentinel-1-grd",
        platform: "Sentinel-1A",
        datetime: "2026-08-16T12:34:56.000Z",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [80.15, 12.95],
              [80.32, 12.95],
              [80.32, 13.15],
              [80.15, 13.15],
              [80.15, 12.95],
            ],
          ],
        },
        bbox: [80.15, 12.95, 80.32, 13.15],
        processingLevel: "LEVEL1",
        polarization: ["VV", "VH"],
        orbit: "ASCENDING",
        assets: {
          overview: { href: "/demo-imagery/pre-flood-s1.png", title: "Pre-event SAR Baseline" },
        },
        providerMetadata: { mode: "IW", resolution: "10m", pass: "Ascending" },
        qualityStatus: "READY",
        dataMode: "DEMO",
        catalogUrl: "https://dataspace.copernicus.eu/demo-s1-pre",
      },
    ];

    return {
      items: isS1 ? items : [
        {
          externalId: "S2B_MSIL2A_20260825T051000_N0500_R041_DEMO",
          provider: "DEMO",
          collection: "sentinel-2-l2a",
          platform: "Sentinel-2B",
          datetime: "2026-08-25T05:10:00.000Z",
          geometry: items[0].geometry,
          bbox: items[0].bbox,
          cloudCover: 12.5,
          processingLevel: "L2A",
          assets: {
            visual: { href: "/demo-imagery/optical-s2.png", title: "True Color TCI" },
          },
          providerMetadata: { processingBaseline: "05.00" },
          qualityStatus: "READY",
          dataMode: "DEMO",
          catalogUrl: "https://dataspace.copernicus.eu/demo-s2",
        },
      ],
      sourceStatus: "HEALTHY",
      provider: "DEMO",
      totalCount: 2,
    };
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    const res = await this.search({ collection: "sentinel-1-grd" });
    const item = res.items.find((i) => i.externalId === externalId) || res.items[0];
    return item;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: "DEMO",
      name: this.name,
      type: this.type,
      configured: true,
      reachable: true,
      authenticated: true,
      latencyMs: 1,
      lastSuccess: new Date().toISOString(),
      status: "HEALTHY",
      checkedAt: new Date().toISOString(),
    };
  }
}

export const mockDemoProvider = new MockDemoProvider();
