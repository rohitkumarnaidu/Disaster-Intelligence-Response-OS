import {
  fetchRecentEarthquakes,
  fetchActiveDisasters,
  fetchActiveWeatherAlerts,
  fetchNaturalEvents,
  fetchSachetAlerts,
  fetchActiveFireHotspots,
  type UsgsEarthquakeEvent,
  type GdacsDisasterEvent,
  type NwsAlertEvent,
  type NasaEonetEvent,
  type SachetDisasterAlert,
  type NasaFirmsFireHotspot,
} from '../lib/external-apis';
import { db, incidents, detections, disasterEvents, weatherAlerts, fireDetections } from '@workspace/db';
import { enrichIncidentAssets, enrichAndCreateCasesForIncident } from './asset-enrichment';
import { eventBus } from './event-emitter';
import { realtimeGateway } from '../realtime/gateway';
import { enqueueOutboxEvent, dispatchCommittedEvent } from '../realtime/outbox';
import { logger } from '../lib/logger';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export class IngestionEngine {
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  public start(): void {
    if (this.running) return;

    const ingestionEnabled = process.env.INGESTION_ENABLED !== 'false';
    if (!ingestionEnabled) {
      logger.info('Ingestion engine disabled (INGESTION_ENABLED=false)');
      return;
    }

    this.running = true;

    const INGESTION_INTERVAL_EARTHQUAKES_MS = parseInt(process.env.INGESTION_INTERVAL_EARTHQUAKES_MS || '300000', 10);
    const INGESTION_INTERVAL_GDACS_MS = parseInt(process.env.INGESTION_INTERVAL_GDACS_MS || '900000', 10);
    const INGESTION_INTERVAL_WEATHER_MS = parseInt(process.env.INGESTION_INTERVAL_WEATHER_MS || '600000', 10);
    const INGESTION_INTERVAL_EONET_MS = 3600000;
    const INGESTION_INTERVAL_SACHET_MS = 600000;
    const INGESTION_INTERVAL_FIRMS_MS = 900000;

    const runEarthquakes = () => this.runSafe('Earthquakes', () => this.ingestEarthquakes());
    const runGDACS = () => this.runSafe('GDACS', () => this.ingestGDACS());
    const runWeatherAlerts = () => this.runSafe('Weather Alerts', () => this.ingestWeatherAlerts());
    const runEONET = () => this.runSafe('EONET', () => this.ingestEONET());
    const runSachet = () => this.runSafe('SACHET India Alerts', () => this.ingestSachetAlerts());
    const runFirms = () => this.runSafe('NASA FIRMS Thermal Anomalies', () => this.ingestFirmsHotspots());

    // Initial fetches
    runEarthquakes();
    runGDACS();
    runWeatherAlerts();
    runEONET();
    runSachet();
    runFirms();

    this.timers.push(setInterval(runEarthquakes, INGESTION_INTERVAL_EARTHQUAKES_MS));
    this.timers.push(setInterval(runGDACS, INGESTION_INTERVAL_GDACS_MS));
    this.timers.push(setInterval(runWeatherAlerts, INGESTION_INTERVAL_WEATHER_MS));
    this.timers.push(setInterval(runEONET, INGESTION_INTERVAL_EONET_MS));
    this.timers.push(setInterval(runSachet, INGESTION_INTERVAL_SACHET_MS));
    this.timers.push(setInterval(runFirms, INGESTION_INTERVAL_FIRMS_MS));

    logger.info('Ingestion engine started successfully');
  }

  public stop(): void {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
    this.running = false;
    logger.info('Ingestion engine stopped');
  }

  public async ingestEarthquakes(): Promise<void> {
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const events: UsgsEarthquakeEvent[] = await fetchRecentEarthquakes({ startTime, minMagnitude: 4.0 });
    let newEventsCount = 0;

    for (const event of events) {
      const existing = await db
        .select()
        .from(disasterEvents)
        .where(eq(disasterEvents.externalId, event.externalId))
        .limit(1);

      if (existing.length === 0) {
        const incidentId = `inc-usgs-${event.externalId}`;
        const aoi = event.boundingBox;

        // Insert incident parent row first to satisfy FK constraint
        await db.insert(incidents).values({
          id: incidentId,
          name: event.title,
          disasterType: 'Earthquake',
          status: 'Active',
          severity: event.severity || 'moderate',
          aoi: aoi || event.location,
          source: 'USGS',
          description: `Magnitude ${event.magnitude} earthquake detected by USGS Hazards Program.`,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalEventId: event.externalId,
          sourceApi: 'USGS',
        }).onConflictDoNothing();

        await db.insert(disasterEvents).values({
          id: crypto.randomUUID(),
          externalId: event.externalId,
          source: 'USGS',
          eventType: 'Earthquake',
          title: event.title,
          severity: event.severity || 'moderate',
          magnitude: event.magnitude,
          location: event.location,
          boundingBox: event.boundingBox || null,
          country: 'Global',
          populationExposed: 0,
          sourceUrl: `https://earthquake.usgs.gov/earthquakes/eventpage/${event.externalId}`,
          incidentId,
          rawPayload: event.rawPayload || event,
          eventTime: event.eventTime ? new Date(event.eventTime) : new Date(),
          createdAt: new Date(),
        });

        const detectionId = crypto.randomUUID();
        await db.insert(detections).values({
          id: detectionId,
          incidentId,
          geometry: event.location,
          class: 'Seismic Activity',
          severity: event.severity || 'moderate',
          confidence: Math.min(0.95, (event.magnitude || 5) / 10),
          modelName: 'USGS Earthquake API',
          modelVersion: 'v1.0',
          inferenceTimestamp: new Date(),
          externalSource: 'USGS',
          externalId: event.externalId,
        });

        await enrichAndCreateCasesForIncident({
          incidentId,
          name: event.title,
          disasterType: 'Earthquake',
          severity: event.severity || 'Moderate',
          location: event.location,
          aoi: aoi || null
        });

        eventBus.broadcast('incident:created', { incidentId, title: event.title, type: 'Earthquake' });
        realtimeGateway.broadcastEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: 'INCIDENT_CREATED',
          entityType: 'INCIDENT',
          entityId: incidentId,
          incidentId,
          version: 1,
          occurredAt: new Date().toISOString(),
          data: { id: incidentId, name: event.title, disasterType: 'Earthquake', severity: event.severity || 'moderate', aoi },
        });
        newEventsCount++;
      }
    }

    if (newEventsCount > 0) {
      logger.info(`Ingested ${newEventsCount} new earthquake events from USGS`);
    }
  }

  public async ingestGDACS(): Promise<void> {
    const events: GdacsDisasterEvent[] = await fetchActiveDisasters();
    let newEventsCount = 0;

    for (const event of events) {
      const existing = await db
        .select()
        .from(disasterEvents)
        .where(eq(disasterEvents.externalId, event.externalId))
        .limit(1);

      if (existing.length === 0) {
        let disasterType = 'Multi-Hazard';
        const rawType = (event.eventType || '').toUpperCase();
        if (rawType === 'EQ') disasterType = 'Earthquake';
        else if (rawType === 'TC') disasterType = 'Tropical Cyclone';
        else if (rawType === 'FL') disasterType = 'Flood';
        else if (rawType === 'TS') disasterType = 'Tsunami';
        else if (rawType === 'VO') disasterType = 'Volcano';
        else if (rawType === 'WF') disasterType = 'Wildfire';
        else if (rawType === 'DR') disasterType = 'Drought';

        const incidentId = `inc-gdacs-${event.externalId}`;

        await db.insert(disasterEvents).values({
          id: crypto.randomUUID(),
          externalId: event.externalId,
          source: 'GDACS',
          eventType: disasterType,
          title: event.title,
          severity: event.severity || 'severe',
          location: event.location,
          boundingBox: event.boundingBox || null,
          country: event.country,
          populationExposed: event.populationExposed,
          sourceUrl: event.sourceUrl,
          incidentId,
          rawPayload: event.rawPayload || event,
          eventTime: event.eventTime || new Date(),
          createdAt: new Date(),
        });

        const aoi = event.boundingBox || event.location;
        await db.insert(incidents).values({
          id: incidentId,
          name: event.title,
          disasterType,
          status: 'Active',
          severity: event.severity || 'severe',
          aoi,
          source: 'GDACS',
          description: `GDACS Alert: ${event.title} in ${event.country}. Estimated exposed population: ${event.populationExposed}.`,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalEventId: event.externalId,
          sourceApi: 'GDACS',
        });

        await enrichAndCreateCasesForIncident({
          incidentId,
          name: event.title,
          disasterType,
          severity: event.severity || 'severe',
          location: event.location,
          aoi
        });

        eventBus.broadcast('incident:created', { incidentId, title: event.title, type: disasterType });
        realtimeGateway.broadcastEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: 'INCIDENT_CREATED',
          entityType: 'INCIDENT',
          entityId: incidentId,
          incidentId,
          version: 1,
          occurredAt: new Date().toISOString(),
          data: { id: incidentId, name: event.title, disasterType, severity: event.severity || 'severe', aoi },
        });
        newEventsCount++;
      }
    }

    if (newEventsCount > 0) {
      logger.info(`Ingested ${newEventsCount} new GDACS multi-hazard alerts`);
    }
  }

  public async ingestWeatherAlerts(): Promise<void> {
    const alerts: NwsAlertEvent[] = await fetchActiveWeatherAlerts();
    let newAlertsCount = 0;

    for (const alert of alerts) {
      const existing = await db
        .select()
        .from(weatherAlerts)
        .where(eq(weatherAlerts.externalId, alert.externalId))
        .limit(1);

      if (existing.length === 0) {
        const isSevere = alert.severity === 'Extreme' || alert.severity === 'Severe';
        const incidentId = isSevere ? `inc-nws-${alert.externalId}` : null;

        if (incidentId && alert.area) {
          await db.insert(incidents).values({
            id: incidentId,
            name: alert.headline || `${alert.alertType} Alert`,
            disasterType: 'Severe Weather',
            status: 'Active',
            severity: alert.severity,
            aoi: alert.area,
            source: alert.source,
            description: alert.description,
            createdBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            externalEventId: alert.externalId,
            sourceApi: alert.source,
          }).onConflictDoNothing();

          if (alert.area.type === 'Polygon' || (alert.area as any).type === 'MultiPolygon') {
            await enrichIncidentAssets(alert.area);
          }
        }

        await db.insert(weatherAlerts).values({
          id: crypto.randomUUID(),
          externalId: alert.externalId,
          incidentId: (incidentId && alert.area) ? incidentId : null,
          alertType: alert.alertType,
          severity: alert.severity,
          headline: alert.headline,
          description: alert.description,
          instruction: alert.instruction,
          area: alert.area,
          effectiveAt: alert.effectiveAt ? new Date(alert.effectiveAt) : new Date(),
          expiresAt: alert.expiresAt ? new Date(alert.expiresAt) : new Date(),
          source: alert.source,
          rawPayload: alert.rawPayload || alert,
          createdAt: new Date(),
        });

        eventBus.broadcast('alert:weather', {
          alertId: alert.externalId,
          headline: alert.headline,
          severity: alert.severity
        });
        newAlertsCount++;
      }
    }

    if (newAlertsCount > 0) {
      logger.info(`Ingested ${newAlertsCount} new weather alerts (NWS fallback)`);
    }

    // GDACS India weather alerts
    let newGdacsCount = 0;
    try {
      const gdacsEvents = await fetchActiveDisasters();
      for (const event of gdacsEvents) {
        if (!event.location || !event.location.coordinates) continue;
        const [lon, lat] = event.location.coordinates;
        // India region
        const isIndia = lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98;
        if (!isIndia) continue;

        if (event.severity === 'severe' || event.severity === 'moderate') {
          const alertId = `gdacs-weather-${event.externalId}`;
          const existing = await db
            .select()
            .from(weatherAlerts)
            .where(eq(weatherAlerts.externalId, alertId))
            .limit(1);

          if (existing.length === 0) {
            const mappedSeverity = event.severity === 'severe' ? 'Severe' : 'Moderate';
            const isSevere = event.severity === 'severe';
            const incidentId = isSevere ? `inc-gdacs-weather-${event.externalId}` : null;
            const area = event.boundingBox || event.location;

            if (incidentId && area) {
              await db.insert(incidents).values({
                id: incidentId,
                name: event.title || `${event.eventType} Alert`,
                disasterType: event.eventType || 'Severe Weather',
                status: 'Active',
                severity: mappedSeverity,
                aoi: area,
                source: event.source,
                description: `GDACS India Alert: ${event.title}`,
                createdBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                externalEventId: event.externalId,
                sourceApi: event.source,
              }).onConflictDoNothing();

              if (area.type === 'Polygon' || (area as any).type === 'MultiPolygon') {
                await enrichIncidentAssets(area);
              }
            }

            await db.insert(weatherAlerts).values({
              id: crypto.randomUUID(),
              externalId: alertId,
              incidentId: (incidentId && area) ? incidentId : null,
              alertType: event.eventType || 'Unknown',
              severity: mappedSeverity,
              headline: event.title,
              description: `GDACS India alert for ${event.country}`,
              instruction: event.sourceUrl,
              area: area,
              effectiveAt: event.eventTime ? new Date(event.eventTime) : new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              source: event.source,
              rawPayload: event.rawPayload || event,
              createdAt: new Date(),
            });

            eventBus.broadcast('alert:weather', {
              alertId: alertId,
              headline: event.title,
              severity: mappedSeverity
            });
            newGdacsCount++;
          }
        }
      }
    } catch (err: any) {
      logger.error({ err }, 'Error ingesting GDACS weather alerts for India');
    }

    if (newGdacsCount > 0) {
      logger.info(`Ingested ${newGdacsCount} new GDACS weather alerts for India`);
    }
  }

  public async ingestEONET(): Promise<void> {
    const events: NasaEonetEvent[] = await fetchNaturalEvents();
    let newEventsCount = 0;

    for (const event of events) {
      const existing = await db
        .select()
        .from(disasterEvents)
        .where(eq(disasterEvents.externalId, event.externalId))
        .limit(1);

      if (existing.length === 0) {
        const incidentId = `inc-eonet-${event.externalId}`;

        await db.insert(disasterEvents).values({
          id: crypto.randomUUID(),
          externalId: event.externalId,
          source: 'EONET',
          eventType: event.eventType || 'Natural Event',
          title: event.title,
          severity: 'moderate',
          location: event.location,
          sourceUrl: event.sourceUrl,
          incidentId,
          rawPayload: event.rawPayload || event,
          eventTime: event.eventTime || new Date(),
          createdAt: new Date(),
        });

        await db.insert(incidents).values({
          id: incidentId,
          name: event.title,
          disasterType: event.eventType || 'Natural Event',
          status: 'Active',
          severity: 'moderate',
          aoi: event.location,
          source: 'NASA EONET',
          description: `NASA EONET Observed Event: ${event.title}`,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          externalEventId: event.externalId,
          sourceApi: 'EONET',
        });

        await enrichAndCreateCasesForIncident({
          incidentId,
          name: event.title,
          disasterType: event.eventType || 'Natural Event',
          severity: 'moderate',
          location: event.location,
          aoi: event.location
        });

        eventBus.broadcast('incident:created', { incidentId, title: event.title, type: event.eventType });
        realtimeGateway.broadcastEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: 'INCIDENT_CREATED',
          entityType: 'INCIDENT',
          entityId: incidentId,
          incidentId,
          version: 1,
          occurredAt: new Date().toISOString(),
          data: { id: incidentId, name: event.title, disasterType: event.eventType || 'Natural Event', severity: 'moderate', aoi: event.location },
        });
        newEventsCount++;
      }
    }

    if (newEventsCount > 0) {
      logger.info(`Ingested ${newEventsCount} new NASA EONET events`);
    }
  }

  public async ingestSachetAlerts(): Promise<void> {
    try {
      const alerts: SachetDisasterAlert[] = await fetchSachetAlerts();
      let newAlertsCount = 0;

      for (const alert of alerts) {
        const existing = await db
          .select()
          .from(weatherAlerts)
          .where(eq(weatherAlerts.externalId, alert.alertId))
          .limit(1);

        if (existing.length === 0) {
          const isSevere = alert.severity === "Extreme" || alert.severity === "Severe";
          const incidentId = isSevere ? `inc-${alert.alertId}` : null;

          if (incidentId && alert.geometry) {
            await db
              .insert(incidents)
              .values({
                id: incidentId,
                name: alert.headline,
                disasterType: alert.event || "Severe Weather",
                status: "Active",
                severity: alert.severity,
                aoi: alert.geometry,
                source: "SACHET_NDMA",
                description: `Official CAP Alert issued by SACHET (NDMA): ${alert.headline}. Urgency: ${alert.urgency}, Certainty: ${alert.certainty}`,
                createdBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                externalEventId: alert.alertId,
                sourceApi: "SACHET_NDMA",
              })
              .onConflictDoNothing();

            if (alert.geometry.type === "Polygon") {
              await enrichIncidentAssets(alert.geometry);
            }
          }

          await db.insert(weatherAlerts).values({
            id: crypto.randomUUID(),
            externalId: alert.alertId,
            incidentId: incidentId && alert.geometry ? incidentId : null,
            alertType: alert.event || "Disaster Alert",
            severity: alert.severity,
            headline: alert.headline,
            description: alert.headline,
            instruction: alert.instruction || alert.sourceUrl,
            area: alert.geometry || null,
            effectiveAt: alert.effective,
            expiresAt: alert.expires,
            source: alert.source,
            rawPayload: alert.rawPayload,
            createdAt: new Date(),
          });

          eventBus.broadcast("alert:weather", {
            alertId: alert.alertId,
            headline: alert.headline,
            severity: alert.severity,
          });

          realtimeGateway.broadcastEvent({
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            type: "ALERT_CREATED",
            entityType: "ALERT",
            entityId: alert.alertId,
            incidentId,
            version: 1,
            occurredAt: new Date().toISOString(),
            data: { id: alert.alertId, headline: alert.headline, severity: alert.severity, source: alert.source },
          });

          newAlertsCount++;
        }
      }

      if (newAlertsCount > 0) {
        logger.info(`Ingested ${newAlertsCount} new SACHET NDMA disaster alerts`);
      }
    } catch (err: any) {
      logger.error({ err }, "Error ingesting SACHET India alerts");
    }
  }

  public async ingestFirmsHotspots(): Promise<void> {
    if (!process.env.NASA_FIRMS_MAP_KEY) return;

    try {
      // Query India national bounding box [68.0, 6.0, 98.0, 38.0]
      const hotspots: NasaFirmsFireHotspot[] = await fetchActiveFireHotspots({
        west: 68.0,
        south: 6.0,
        east: 98.0,
        north: 38.0,
        days: 1,
        sensor: "VIIRS_SNPP_NRT",
      });

      let newFirmsCount = 0;
      for (const spot of hotspots.slice(0, 100)) {
        const existing = await db
          .select()
          .from(fireDetections)
          .where(eq(fireDetections.externalId, spot.externalId))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(fireDetections).values({
            id: `fire_${crypto.randomUUID()}`,
            incidentId: null,
            externalId: spot.externalId,
            latitude: spot.latitude,
            longitude: spot.longitude,
            brightness: spot.brightness,
            confidence: spot.confidence,
            frp: spot.frp,
            satellite: spot.satellite,
            instrument: spot.instrument,
            acqTime: spot.eventTime,
            geometry: spot.location,
            source: "NASA_FIRMS",
            retrievedAt: new Date(),
            rawPayload: spot,
          });

          newFirmsCount++;
        }
      }

      if (newFirmsCount > 0) {
        logger.info(`Ingested ${newFirmsCount} new NASA FIRMS fire/thermal hotspots in India AOI`);
        realtimeGateway.broadcastEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: "FIRE_DETECTION_CREATED",
          entityType: "DETECTION",
          entityId: "firms-batch",
          version: 1,
          occurredAt: new Date().toISOString(),
          data: { count: newFirmsCount, source: "NASA_FIRMS" },
        });
      }
    } catch (err: any) {
      logger.error({ err }, "Error ingesting NASA FIRMS thermal hotspots");
    }
  }

  private async runSafe(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error: any) {
      logger.error({ err: error }, `Error in background ingestion task [${name}]`);
    }
  }
}

export const ingestionEngine = new IngestionEngine();
