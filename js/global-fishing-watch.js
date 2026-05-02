/**
 * GROAN Data Registry — Source 008: Global Fishing Watch (GFW)
 * Module: global-fishing-watch.js  →  /js/global-fishing-watch.js
 *
 * Data product:  GFW AIS Apparent Fishing Effort (4Wings API v3)
 * Coverage:      Global, 2017–present (~72hr data delay)
 * Resolution:    0.1° spatial (LOW), 0.01° (MEDIUM), 0.001° (HIGH)
 * Variables:     Apparent fishing hours (AIS-detected vessels)
 * Update freq:   Daily NRT (~72hr lag)
 *
 * DTI produced:  FPI — Fishing Pressure Index (0–10, NEGATIVE)
 *
 * Auth:          FREE API key required
 *   Register:    https://globalfishingwatch.org/our-apis/
 *   Set key:     window.GROAN.config.GFW_API_KEY = 'your_key_here'
 *   Method:      Bearer token in Authorization header
 *
 * Rate limit:    50,000 requests/day — 1 request per queryGFW() call
 *
 * Query method:
 *   POST 4Wings report endpoint with bounding box around waypoint.
 *   Default AOI: ±0.5° lat/lon (~55km radius) — configurable.
 *   Returns total apparent fishing hours summed across all cells in AOI.
 *   Period: configurable (default: last 30 days).
 *
 * Normalization: LOG-BASED NEGATIVE
 *   Fishing hours are highly right-skewed — log10 transform applied
 *   before linear normalization.
 *   Score 10 = <0.1 total hours in AOI (pristine/MPA)
 *   Score 0  = >10,000 total hours in AOI (severely exploited)
 *   Direction: NEGATIVE (higher hours = more pressure = lower score)
 *
 * GROAN role:
 *   Feeds DMAP-CAL™ Tier 2 stressor: fisheries pressure.
 *   Combines with APEX_PREDATOR_INDEX (GRIN) and HERBIVORE_BIOMASS_KG_HA
 *   (GRIN) in CMIE trophic cascade module.
 *   High FPI + low APEX_PREDATOR_INDEX → CMIE flag: TROPHIC_CASCADE_RISK.
 *
 * Architecture:  Browser-side window.GROAN globals — no Node.js
 * No additional dependencies beyond fetch API.
 *
 * Citation:
 *   Global Fishing Watch. (2018). Tracking the global footprint of fisheries.
 *   Science, 359(6378), 904–908. DOI: 10.1126/science.aao5646
 */

(function () {
  'use strict';

  // ============================================================
  // 1. CONFIGURATION
  // ============================================================

  const GFW_BASE_URL     = 'https://gateway.api.globalfishingwatch.org/v3';
  const GFW_DATASET      = 'public-global-fishing-effort:v3.0';
  const GFW_RESOLUTION   = 'LOW';    // LOW=0.1°, MEDIUM=0.01°, HIGH=0.001°
  const GFW_AOI_DEG      = 0.5;     // Bounding box half-width in degrees (~55km)
  const GFW_PERIOD_DAYS  = 30;      // Lookback window in days

  // Normalization thresholds (log10 scale of total fishing hours in AOI)
  // Tuned for Caribbean reef waypoint AOI (~55km radius = ~9,500 km²)
  //
  // Empirical reference points:
  //   log10(0.1)  = -1.0  → pristine / active MPA enforcement
  //   log10(1)    =  0.0  → very lightly fished
  //   log10(10)   =  1.0  → light fishing pressure
  //   log10(100)  =  2.0  → moderate pressure (typical Caribbean)
  //   log10(1000) =  3.0  → heavy pressure
  //   log10(10000)=  4.0  → severely exploited (score = 0)
  const LOG_MIN = -1.0;  // log10 hours → score 10
  const LOG_MAX =  4.0;  // log10 hours → score 0

  // ============================================================
  // 2. NORMALIZATION
  //
  //   FPI = 10 × (1 − (log10(hours) − LOG_MIN) / (LOG_MAX − LOG_MIN))
  //   Clamped [0, 10]. Zero hours → score 10 (no fishing detected).
  //   Direction: NEGATIVE (higher fishing = lower FPI score)
  // ============================================================

  /**
   * normalizeFPI()
   * @param {number} totalHours - Raw total apparent fishing hours in AOI
   * @returns {number|null} FPI score 0–10
   */
  function normalizeFPI(totalHours) {
    if (totalHours === null || totalHours === undefined || isNaN(totalHours)) return null;
    if (totalHours <= 0) return 10.0;

    const logHours = Math.log10(totalHours);
    const score = 10 * (1 - (logHours - LOG_MIN) / (LOG_MAX - LOG_MIN));
    return parseFloat(Math.max(0, Math.min(10, score)).toFixed(2));
  }

  /**
   * classifyFPI()
   * Returns a human-readable pressure tier for CMIE and dashboard display.
   * @param {number} fpi - Normalized FPI score 0–10
   * @returns {string}
   */
  function classifyFPI(fpi) {
    if (fpi === null) return 'UNKNOWN';
    if (fpi >= 9.0) return 'PRISTINE';
    if (fpi >= 7.5) return 'LOW_PRESSURE';
    if (fpi >= 5.5) return 'MODERATE_PRESSURE';
    if (fpi >= 3.0) return 'HIGH_PRESSURE';
    return 'SEVERE_PRESSURE';
  }


  // ============================================================
  // 3. BOUNDING BOX BUILDER
  //
  //   Constructs GeoJSON polygon for 4Wings report endpoint.
  //   ±GFW_AOI_DEG around the query point.
  // ============================================================

  function buildAOI(lat, lon, halfDeg) {
    const minLat = lat - halfDeg;
    const maxLat = lat + halfDeg;
    const minLon = lon - halfDeg;
    const maxLon = lon + halfDeg;

    return {
      type: 'Polygon',
      coordinates: [[
        [minLon, minLat],
        [maxLon, minLat],
        [maxLon, maxLat],
        [minLon, maxLat],
        [minLon, minLat]
      ]]
    };
  }

  /**
   * buildDateRange()
   * Returns ISO date strings for the query period.
   * GFW data has ~72hr lag so end date is 3 days ago.
   * @param {number} periodDays
   * @returns {{ startDate: string, endDate: string }}
   */
  function buildDateRange(periodDays) {
    const end   = new Date();
    end.setDate(end.getDate() - 3); // account for ~72hr data lag
    const start = new Date(end);
    start.setDate(start.getDate() - periodDays);

    const fmt = d => d.toISOString().split('T')[0];
    return { startDate: fmt(start), endDate: fmt(end) };
  }


  // ============================================================
  // 4. API FETCH — 4WINGS REPORT ENDPOINT
  //
  //   POST /v3/4wings/report
  //   Returns array of grid cells with fishing hours.
  //   We sum all cell values for total hours in AOI.
  //
  //   API key must be set in window.GROAN.config.GFW_API_KEY
  //   before calling queryGFW().
  // ============================================================

  const _cache = {};
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (data updates daily)

  /**
   * fetchFishingEffort()
   * @param {number} lat
   * @param {number} lon
   * @param {Object} opts
   * @param {number} [opts.aoiDeg]     - Bounding box half-width (default GFW_AOI_DEG)
   * @param {number} [opts.periodDays] - Lookback days (default GFW_PERIOD_DAYS)
   * @returns {Promise<{ totalHours: number, cellCount: number, raw: Object }|null>}
   */
  async function fetchFishingEffort(lat, lon, opts = {}) {
    const aoiDeg     = opts.aoiDeg     || GFW_AOI_DEG;
    const periodDays = opts.periodDays || GFW_PERIOD_DAYS;

    // Cache key
    const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}_${aoiDeg}_${periodDays}`;
    const cached = _cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return cached.data;
    }

    // API key check
    const apiKey = (window.GROAN && window.GROAN.config && window.GROAN.config.GFW_API_KEY)
      ? window.GROAN.config.GFW_API_KEY
      : null;

    if (!apiKey) {
      throw new Error(
        'GFW_API_KEY not set. Register at https://globalfishingwatch.org/our-apis/ ' +
        'then set: window.GROAN.config.GFW_API_KEY = "your_key_here"'
      );
    }

    const { startDate, endDate } = buildDateRange(periodDays);
    const aoi = buildAOI(lat, lon, aoiDeg);

    const requestBody = {
      datasets:   [GFW_DATASET],
      'date-range': `${startDate},${endDate}`,
      region:     { dataset: 'public-global-eez-areas:v3', id: null },
      'spatial-resolution': GFW_RESOLUTION,
      'temporal-resolution': 'MONTHLY',
      'group-by': 'FLAG',
      geojson: aoi
    };

    // Use the simpler bbox report format for point queries
    const url = `${GFW_BASE_URL}/4wings/report` +
      `?datasets[0]=${encodeURIComponent(GFW_DATASET)}` +
      `&date-range=${startDate},${endDate}` +
      `&spatial-resolution=${GFW_RESOLUTION}` +
      `&temporal-resolution=ENTIRE`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ geojson: aoi })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`GFW API HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();

    // Sum total fishing hours across all cells
    // GFW response structure: { entries: [{ date, datasets: [{ id, value }] }] }
    // OR: { data: number[][] } depending on endpoint variant
    let totalHours = 0;
    let cellCount  = 0;

    if (data.entries && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        if (entry.datasets) {
          for (const ds of entry.datasets) {
            if (typeof ds.value === 'number') {
              totalHours += ds.value;
              cellCount++;
            }
          }
        }
      }
    } else if (data.data && Array.isArray(data.data)) {
      // Flat array format
      for (const row of data.data) {
        if (Array.isArray(row)) {
          for (const v of row) {
            if (typeof v === 'number' && v > 0) {
              totalHours += v;
              cellCount++;
            }
          }
        }
      }
    }

    const result = { totalHours, cellCount, raw: data };
    _cache[cacheKey] = { timestamp: Date.now(), data: result };
    return result;
  }


  // ============================================================
  // 5. PRIMARY PUBLIC METHOD — queryGFW()
  // ============================================================

  /**
   * queryGFW()
   * @param {number} lat
   * @param {number} lon
   * @param {Object} [options]
   * @param {number} [options.aoiDeg]     - AOI half-width in degrees (default 0.5°)
   * @param {number} [options.periodDays] - Lookback period in days (default 30)
   * @returns {Promise<Object>} GROAN DTI result object
   */
  async function queryGFW(lat, lon, options = {}) {
    const timestamp = new Date().toISOString();
    const aoiDeg    = options.aoiDeg     || GFW_AOI_DEG;
    const period    = options.periodDays || GFW_PERIOD_DAYS;

    try {
      const effort = await fetchFishingEffort(lat, lon, { aoiDeg, periodDays: period });

      const fpi          = normalizeFPI(effort.totalHours);
      const pressureTier = classifyFPI(fpi);
      const { startDate, endDate } = buildDateRange(period);

      return {
        source:      'GFW',
        sourceId:    '008',
        dti:         'FPI',
        lat, lon, timestamp,

        fpi,
        pressureTier,
        flag:        null,
        confidence:  effort.cellCount > 0 ? 'HIGH' : 'MODERATE',

        components: {
          totalHoursRaw: effort.totalHours,
          cellCount:     effort.cellCount,
          aoiDeg,
          periodDays:    period,
          startDate,
          endDate,
          dataset:       GFW_DATASET,
          resolution:    GFW_RESOLUTION,
          logHours:      effort.totalHours > 0
            ? parseFloat(Math.log10(effort.totalHours).toFixed(3))
            : null,
          normParams: { LOG_MIN, LOG_MAX }
        },

        raw: effort.raw
      };

    } catch (err) {
      return {
        source:      'GFW',
        sourceId:    '008',
        dti:         'FPI',
        lat, lon, timestamp,
        fpi:         null,
        pressureTier: 'UNKNOWN',
        flag:        'FETCH_ERROR: ' + err.message,
        confidence:  'NONE',
        components:  null,
        raw:         null
      };
    }
  }


  // ============================================================
  // 6. CMIE INTEGRATION HELPER
  //
  //    Evaluates trophic cascade risk by combining FPI (Source 008)
  //    with in-water GRIN metrics.
  //
  //    Trigger condition:
  //      FPI < 5.0 (high fishing pressure) AND
  //      APEX_PREDATOR_INDEX < 0.3 (low apex predator encounter)
  //      → CMIE flag: TROPHIC_CASCADE_RISK
  //
  //    Secondary condition:
  //      FPI < 3.0 (severe pressure) AND
  //      HERBIVORE_BIOMASS_KG_HA < 200 (low herbivore)
  //      → CMIE flag: PHASE_SHIFT_FISHING_DRIVER
  // ============================================================

  /**
   * evaluateTrophicRisk()
   * @param {number} fpi              - FPI score from queryGFW()
   * @param {number} apexPredatorIndex - APEX_PREDATOR_INDEX from GRIN
   * @param {number} herbivoreBiomass  - HERBIVORE_BIOMASS_KG_HA from GRIN
   * @returns {{ flag: string|null, risk: string }}
   */
  function evaluateTrophicRisk(fpi, apexPredatorIndex, herbivoreBiomass) {
    const flags = [];

    if (fpi !== null && apexPredatorIndex !== null) {
      if (fpi < 5.0 && apexPredatorIndex < 0.3) {
        flags.push('TROPHIC_CASCADE_RISK');
      }
    }

    if (fpi !== null && herbivoreBiomass !== null) {
      if (fpi < 3.0 && herbivoreBiomass < 200) {
        flags.push('PHASE_SHIFT_FISHING_DRIVER');
      }
    }

    let risk = 'LOW';
    if (flags.includes('PHASE_SHIFT_FISHING_DRIVER')) risk = 'CRITICAL';
    else if (flags.includes('TROPHIC_CASCADE_RISK'))  risk = 'HIGH';
    else if (fpi !== null && fpi < 5.0)               risk = 'MODERATE';

    return {
      flag:  flags.length > 0 ? flags.join(',') : null,
      risk
    };
  }


  // ============================================================
  // 7. WINDOW.GROAN REGISTRATION
  // ============================================================

  window.GROAN = window.GROAN || {};
  window.GROAN.config  = window.GROAN.config  || {};
  window.GROAN.sources = window.GROAN.sources || {};

  window.GROAN.sources.GFW = {
    id:        '008',
    name:      'Global Fishing Watch',
    shortName: 'GFW',
    version:   '4Wings API v3',
    dti:       'FPI',
    dtiLabel:  'Fishing Pressure Index',
    direction: 'NEGATIVE',
    units:     '0–10 scale (higher = less fishing pressure)',
    coverage:  'Global AIS-detected fishing vessels',
    vintage:   '2017–present (~72hr lag)',
    accessMode:'API_KEY_REQUIRED',
    apiKeyVar: 'window.GROAN.config.GFW_API_KEY',
    apiKeyUrl: 'https://globalfishingwatch.org/our-apis/',
    rateLimit: '50,000 requests/day',

    query:             queryGFW,
    normalize:         normalizeFPI,
    classify:          classifyFPI,
    evaluateTrophicRisk,
    buildAOI,

    normalization: {
      method:     'LOG10_LINEAR_NEGATIVE',
      logMin:     LOG_MIN,
      logMax:     LOG_MAX,
      formula:    'FPI = 10 × (1 − (log10(hours) − LOG_MIN) / (LOG_MAX − LOG_MIN))',
      zeroHours:  'FPI = 10.0 (no fishing detected = pristine)',
      tierLabels: {
        PRISTINE:          'FPI ≥ 9.0 — virtually no AIS-detected fishing',
        LOW_PRESSURE:      'FPI 7.5–9.0 — light/occasional fishing activity',
        MODERATE_PRESSURE: 'FPI 5.5–7.5 — typical fished Caribbean reef',
        HIGH_PRESSURE:     'FPI 3.0–5.5 — heavy commercial/artisanal pressure',
        SEVERE_PRESSURE:   'FPI < 3.0 — severely exploited; trophic cascade likely'
      }
    },

    cmieIntegration: {
      primaryFlag:   'TROPHIC_CASCADE_RISK',
      trigger:       'FPI < 5.0 AND APEX_PREDATOR_INDEX < 0.3',
      secondaryFlag: 'PHASE_SHIFT_FISHING_DRIVER',
      trigger2:      'FPI < 3.0 AND HERBIVORE_BIOMASS_KG_HA < 200',
      grinnPartners: ['APEX_PREDATOR_INDEX', 'HERBIVORE_BIOMASS_KG_HA', 'LIONFISH_DENSITY_100M2']
    },

    queryDefaults: {
      aoiDeg:     GFW_AOI_DEG,
      periodDays: GFW_PERIOD_DAYS,
      resolution: GFW_RESOLUTION,
      dataset:    GFW_DATASET
    },

    caveat: 'GFW captures AIS-broadcasting vessels only (~70,000 vessels). ' +
            'Non-AIS artisanal fishing is not detected. FPI may OVERESTIMATE ' +
            'reef health in regions with high non-AIS small-boat fishing (e.g., ' +
            'coastal Honduras, Nicaragua, Guatemala). Cross-reference with ' +
            'HERBIVORE_BIOMASS_KG_HA and local knowledge.',

    citation: 'Kroodsma et al. (2018). Tracking the global footprint of fisheries. ' +
              'Science, 359(6378), 904–908. DOI: 10.1126/science.aao5646'
  };

  console.log('[GROAN S008] global-fishing-watch.js loaded → window.GROAN.sources.GFW');
  console.log('[GROAN S008] API key required. Set: window.GROAN.config.GFW_API_KEY = "your_key"');

})();
