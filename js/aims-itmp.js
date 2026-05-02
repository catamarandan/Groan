/**
 * GROAN Data Registry — Source 009: AIMS Long-Term Monitoring Program (LTMP)
 * Module: aims-ltmp.js  →  /js/aims-ltmp.js
 *
 * Data products:
 *   (A) AIMS Data Platform API — LIVE (API key required)
 *       Variables:  Sea surface temperature, weather station data
 *       Coverage:   ~80 GBR sites + 16 Coral Sea sites + PNG sites
 *       Endpoint:   https://api.aims.gov.au/data/v1.0/{DOI}/data
 *       Auth:       x-api-key header (free registration)
 *       Register:   https://open-aims.github.io/data-platform/key_request.html
 *       Key DOI:    10.25845/5c09bf93f315d (Sea Water Temperature Loggers)
 *
 *   (B) AIMS LTMP Annual Reports — STATIC BENCHMARKS
 *       Variables:  Hard coral cover, COTS, disturbance history by GBR sector
 *       Latest:     2025 Annual Summary (2024/25 survey season — post-bleaching)
 *       Coverage:   Northern, Central, Southern GBR (124 reefs)
 *       Access:     Download-form only (no live API for benthic data)
 *       Update:     Annual (published ~August each year)
 *
 * DTIs produced:
 *   GBR_CORAL_COVER_SCORE  — Normalized regional hard coral cover (0–10, POSITIVE)
 *   GBR_COTS_FLAG          — Crown-of-Thorns Starfish disturbance level (categorical)
 *   GBR_DISTURBANCE_INDEX  — Cumulative disturbance score (0–10, NEGATIVE)
 *   AIMS_SST_C             — In-situ SST from AIMS logger network (°C, NEGATIVE)
 *
 * GROAN role:
 *   Source 009 is the GBR theater reference benchmark — the scientific counterpart
 *   to HRI/AGRRA (Source 011) for the Caribbean. GBR is GROAN's primary proof-of-
 *   concept theater for comparison with Caribbean Rim Run data — demonstrating
 *   cross-ecosystem CMIE applicability.
 *
 *   GBR-specific CMIE flags:
 *     COTS_OUTBREAK_ACTIVE → amplifies CMIE coral loss trajectory weighting
 *     CYCLONE_COMPOUNDING  → compound disturbance flag (bleaching + physical)
 *     ACROPORA_VULNERABLE  → fast-growing recovery corals disproportionately at risk
 *
 * Architecture:  Browser-side window.GROAN globals — no Node.js
 *
 * Data versions:
 *   Benchmarks: AIMS LTMP Annual Summary 2024/25 (AIMS, 2025)
 *   Live API:   AIMS Data Platform API v1.0
 *   TODO_UPDATE: Refresh GBR_BENCHMARKS each August when new Annual Summary publishes.
 *
 * Citation:
 *   Australian Institute of Marine Science (AIMS). (2025). Long-Term Monitoring
 *   Program — Annual Summary Report of Coral Reef Condition 2024/25. AIMS, Townsville.
 *   https://www.aims.gov.au/monitoring-great-barrier-reef/gbr-condition-summary-2024-25
 *
 *   AIMS Data Platform API: https://open-aims.github.io/data-platform/
 */

(function () {
  'use strict';

  // ============================================================
  // 1. AIMS LTMP PUBLISHED BENCHMARKS — 2025 ANNUAL REPORT
  //
  //    Source: AIMS LTMP Annual Summary Report 2024/25
  //    Survey period: August 2024 – May 2025 (124 reefs)
  //    Context: Post-2024 mass bleaching event (5th since 2016,
  //             largest spatial footprint ever recorded on GBR)
  //
  //    Values are region-wide averages (95% credible intervals in notes).
  //    Pre-bleaching peak (2024) values included for trajectory reference.
  //
  //    Units: hard coral cover (%)
  //    TODO_UPDATE: Refresh each August from aims.gov.au annual summary.
  // ============================================================

  const GBR_BENCHMARKS = {
    // Northern GBR (Cooktown–Lizard Island sector)
    NORTHERN_GBR: {
      year: 2025,
      coralCover_pct:       30.0,  // Post-bleaching (CI: 26.6–33.8%)
      coralCover_2024_pct:  39.8,  // Pre-bleaching peak
      longTermAverage_pct:  26.6,  // 38-year LTMP average
      relativeDecline_pct:  24.8,  // % decline from 2024 — largest annual decline on record
      cotsStatus:           'LOW', // Low COTS numbers reported
      disturbances2024:     ['MASS_BLEACHING_2024', 'CYCLONE_JASPER_DEC2023'],
      note: 'Largest annual decline recorded for Northern GBR. 2025 surveys completed ' +
            'before second 2025 bleaching event — full impact not yet captured.',
      latRange: [-14.5, -19.5]
    },
    // Central GBR (Cairns, Innisfail, Townsville sectors)
    CENTRAL_GBR: {
      year: 2025,
      coralCover_pct:       28.6,  // Post-bleaching (CI: 25.5–31.7%)
      coralCover_2024_pct:  33.2,  // Pre-bleaching peak (regional high)
      longTermAverage_pct:  19.8,  // 38-year LTMP average
      relativeDecline_pct:  13.9,  // % decline from 2024
      cotsStatus:           'ACTIVE_SOME_REEFS', // 4 reefs with persistent COTS
      disturbances2024:     ['MASS_BLEACHING_2024', 'CYCLONE_JASPER_DEC2023',
                             'CYCLONE_KIRRILY_JAN2024', 'FRESHWATER_INUNDATION'],
      note: 'Most complex disturbance mosaic — two cyclones + bleaching + flooding. ' +
            'Still above long-term average of 19.8%.',
      latRange: [-19.5, -23.5]
    },
    // Southern GBR (Whitsunday, Swain, Capricorn-Bunker sectors)
    SOUTHERN_GBR: {
      year: 2025,
      coralCover_pct:       null,  // Not yet published in 2025 report — pending
      coralCover_2024_pct:  39.1,  // Pre-bleaching peak
      longTermAverage_pct:  28.0,  // Estimated from historical reports
      relativeDecline_pct:  null,
      cotsStatus:           'OUTBREAK_ACTIVE', // 4 Southern GBR reefs with COTS outbreak
      disturbances2024:     ['MASS_BLEACHING_2024', 'COTS_OUTBREAK'],
      note: 'Southern GBR 2025 post-bleaching data pending next survey season. ' +
            'COTS outbreak persisting on 4 reefs.',
      latRange: [-23.5, -28.0],
      TODO: 'TODO_UPDATE: Southern GBR 2025 post-bleach cover not yet published. ' +
            'Update coralCover_pct when full data releases (~Aug 2025 report).'
    },
    // GBR-wide composite
    GBR_WIDE: {
      year: 2025,
      coralCover_pct:       29.5,  // Weighted approximate (N+C average; S pending)
      coralCover_2024_pct:  37.4,  // Pre-bleaching composite high
      longTermAverage_pct:  24.8,  // Approximate 38-year mean
      surveyedReefs:        124,
      bleachingEvents:      5,     // Since 2016
      bleachingYears:       [2016, 2017, 2020, 2022, 2024],
      note: '5th mass bleaching event since 2016. 2024 had largest spatial footprint ' +
            'ever recorded. Fast-growing Acropora (recovery driver 2017–2024) ' +
            'disproportionately impacted.',
      latRange: [-14.5, -28.0]
    }
  };

  // ============================================================
  // 2. COTS (Crown-of-Thorns Starfish) CLASSIFICATION
  //
  //    COTS outbreaks are a GBR-specific major disturbance agent.
  //    Unlike the Caribbean, COTS are a recurrent, trackable threat
  //    that GROAN must flag independently of bleaching.
  //
  //    AIMS COTS status categories:
  //      NO_COTS:        <0.22 per tow (background)
  //      LOW:            0.22–1.0 per tow (watch)
  //      ACTIVE:         1.0–2.0 per tow (active feeding)
  //      OUTBREAK_ACTIVE: >2.0 per tow (outbreak — CMIE flag trigger)
  //
  //    CMIE integration:
  //      COTS_OUTBREAK_ACTIVE + DHW > 4 → COMPOUND_DISTURBANCE_GBR
  // ============================================================

  const COTS_LEVELS = {
    NO_COTS:         { perTow: [0, 0.22],   score: 10.0, cmieFlag: null },
    LOW:             { perTow: [0.22, 1.0],  score: 7.0,  cmieFlag: 'COTS_WATCH' },
    ACTIVE_SOME_REEFS: { perTow: [1.0, 2.0], score: 4.0, cmieFlag: 'COTS_ACTIVE' },
    OUTBREAK_ACTIVE: { perTow: [2.0, null],  score: 0.0,  cmieFlag: 'COTS_OUTBREAK_ACTIVE' }
  };


  // ============================================================
  // 3. GBR GEOGRAPHIC SECTOR LOOKUP
  // ============================================================

  function findGBRSector(lat, lon) {
    // GBR spans ~145°E–154°E, 10°S–28°S
    if (lon < 142 || lon > 155 || lat > -10 || lat < -28) return null;

    for (const [sector, data] of Object.entries(GBR_BENCHMARKS)) {
      if (sector === 'GBR_WIDE') continue;
      if (lat >= data.latRange[1] && lat <= data.latRange[0]) {
        return sector;
      }
    }
    return 'GBR_WIDE'; // fallback
  }


  // ============================================================
  // 4. NORMALIZATION FUNCTIONS
  //
  //   GBR_CORAL_COVER_SCORE (POSITIVE):
  //     Linear scale: 0% = 0, ≥60% = 10
  //     GBR historically peaks at ~50–60% on healthy offshore reefs
  //
  //   GBR_DISTURBANCE_INDEX (NEGATIVE):
  //     Counts compound disturbances in current/prior 2 years
  //     Each disturbance type weighted:
  //       MASS_BLEACHING:      3.0 points
  //       COTS_OUTBREAK:       2.0 points
  //       MAJOR_CYCLONE:       2.0 points
  //       FRESHWATER_INUNDATION: 1.0 point
  //     Score = max(0, 10 - disturbance_points)
  //     Direction: NEGATIVE (more disturbance = lower score)
  // ============================================================

  function normalizeCoralCover(coralCover_pct) {
    if (coralCover_pct === null || coralCover_pct === undefined) return null;
    return parseFloat(Math.max(0, Math.min(10, (coralCover_pct / 60) * 10)).toFixed(2));
  }

  const DISTURBANCE_WEIGHTS = {
    MASS_BLEACHING_2024:      3.0,
    MASS_BLEACHING:           3.0,
    COTS_OUTBREAK:            2.0,
    MAJOR_CYCLONE:            2.0,
    CYCLONE_JASPER_DEC2023:   2.0,
    CYCLONE_KIRRILY_JAN2024:  1.5,
    FRESHWATER_INUNDATION:    1.0
  };

  function computeDisturbanceIndex(disturbances, cotsStatus) {
    let points = 0;
    for (const d of (disturbances || [])) {
      points += DISTURBANCE_WEIGHTS[d] || 1.0;
    }
    // Add COTS contribution
    if (cotsStatus === 'OUTBREAK_ACTIVE')   points += 2.0;
    else if (cotsStatus === 'ACTIVE_SOME_REEFS') points += 1.0;

    const score = Math.max(0, 10 - points);
    const cotsEntry = COTS_LEVELS[cotsStatus] || COTS_LEVELS['NO_COTS'];

    return {
      disturbanceIndex: parseFloat(score.toFixed(2)),
      disturbancePoints: parseFloat(points.toFixed(1)),
      cotsFlag: cotsEntry.cmieFlag,
      cmieFlag: points >= 4.0 ? 'COMPOUND_DISTURBANCE_GBR' : null
    };
  }


  // ============================================================
  // 5. LIVE API — AIMS DATA PLATFORM
  //
  //    Endpoint: https://api.aims.gov.au/data/v1.0/{DOI}/data
  //    Auth: x-api-key header
  //    Primary dataset: Sea Water Temperature Loggers
  //      DOI: 10.25845/5c09bf93f315d
  //
  //    Query params:
  //      site-name: site name filter (e.g., "Davies Reef")
  //      from-date: ISO date string
  //      thru-date: ISO date string
  //      size: number of records
  //
  //    API key: Set window.GROAN.config.AIMS_API_KEY
  //    Register: https://open-aims.github.io/data-platform/key_request.html
  // ============================================================

  const AIMS_API_BASE = 'https://api.aims.gov.au/data/v1.0';
  const AIMS_SST_DOI  = '10.25845/5c09bf93f315d';
  const AIMS_SST_CACHE = {};
  const CACHE_TTL_MS   = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * fetchAIMSSST()
   * Fetches in-situ SST from nearest AIMS logger for a GBR lat/lon.
   * @param {string} siteName - AIMS site name (e.g., 'Davies Reef')
   * @returns {Promise<{ sst: number|null, date: string|null, raw: object|null }>}
   */
  async function fetchAIMSSST(siteName) {
    const apiKey = window.GROAN && window.GROAN.config && window.GROAN.config.AIMS_API_KEY;
    if (!apiKey) {
      console.warn('[GROAN S009] AIMS_API_KEY not set. Register at open-aims.github.io/data-platform/key_request.html');
      return { sst: null, date: null, raw: null, error: 'API_KEY_NOT_SET' };
    }

    const cacheKey = siteName;
    const cached   = AIMS_SST_CACHE[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) return cached.data;

    // Get last 30 days of daily SST
    const now   = new Date();
    const from  = new Date(now);
    from.setDate(from.getDate() - 30);
    const fmt   = d => d.toISOString().split('T')[0];

    const url = `${AIMS_API_BASE}/${AIMS_SST_DOI}/data` +
      `?site-name=${encodeURIComponent(siteName)}` +
      `&from-date=${fmt(from)}&thru-date=${fmt(now)}&size=1`;

    try {
      const response = await fetch(url, {
        headers: { 'x-api-key': apiKey }
      });

      if (!response.ok) {
        throw new Error(`AIMS API HTTP ${response.status}`);
      }

      const data  = await response.json();
      const items = data.results || data.data || [];
      const latest = items.length > 0 ? items[items.length - 1] : null;

      const result = {
        sst:   latest ? parseFloat(latest.qc_val || latest.value || latest.sst) : null,
        date:  latest ? (latest.time || latest.date) : null,
        site:  siteName,
        raw:   data,
        error: null
      };

      AIMS_SST_CACHE[cacheKey] = { timestamp: Date.now(), data: result };
      return result;

    } catch (err) {
      console.warn('[GROAN S009] AIMS SST fetch failed:', err.message);
      return { sst: null, date: null, raw: null, error: err.message };
    }
  }

  // Known AIMS SST logger sites near GBR sectors (partial list)
  // Full site list: https://apps.aims.gov.au/metadata/view/5c09bf93-f315-4dc6-b418-df90bc60ff5d
  const GBR_SST_SITES = {
    NORTHERN_GBR: ['Lizard Island', 'Cooktown', 'Princess Charlotte Bay'],
    CENTRAL_GBR:  ['Davies Reef', 'Myrmidon Reef', 'Rib Reef', 'Townsville'],
    SOUTHERN_GBR: ['Heron Island', 'One Tree Island', 'Erskine Island']
  };


  // ============================================================
  // 6. PRIMARY PUBLIC METHOD — queryAIMS()
  // ============================================================

  /**
   * queryAIMS()
   * @param {number} lat
   * @param {number} lon
   * @param {Object} [options]
   * @param {string} [options.siteName] - Override AIMS SST site name
   * @returns {Promise<Object>} GROAN DTI result object
   */
  async function queryAIMS(lat, lon, options = {}) {
    const timestamp = new Date().toISOString();
    const sector    = findGBRSector(lat, lon);

    if (!sector) {
      return {
        source:      'AIMS_LTMP',
        sourceId:    '009',
        lat, lon, timestamp,
        sector:      null,
        flag:        'OUTSIDE_GBR_COVERAGE',
        confidence:  'NONE',
        note:        'Source 009 covers GBR only (~145°E–154°E, 10°S–28°S). ' +
                     'AIMS also has Coral Sea and Ningaloo sites — extend coverage if needed.',
        benchmarks:  null,
        disturbance: null,
        sst:         null
      };
    }

    const benchmark   = GBR_BENCHMARKS[sector] || GBR_BENCHMARKS['GBR_WIDE'];
    const coverScore  = normalizeCoralCover(benchmark.coralCover_pct);
    const disturbance = computeDisturbanceIndex(benchmark.disturbances2024, benchmark.cotsStatus);

    // Live SST fetch
    let sstResult = { sst: null, date: null, error: 'NOT_ATTEMPTED' };
    const siteName = options.siteName || (GBR_SST_SITES[sector] || [])[0];
    if (siteName) {
      sstResult = await fetchAIMSSST(siteName);
    }

    // GBR CMIE compound flag
    const compoundFlag = disturbance.cmieFlag ||
      (disturbance.cotsFlag && disturbance.disturbancePoints >= 3 ? 'COTS_BLEACHING_COMPOUND' : null);

    // Trajectory assessment — 2025 vs 2024 vs long-term average
    let trajectory = 'UNKNOWN';
    if (benchmark.coralCover_pct && benchmark.coralCover_2024_pct) {
      const delta = benchmark.coralCover_pct - benchmark.coralCover_2024_pct;
      if (delta < -5)      trajectory = 'POST_BLEACHING_DECLINE';
      else if (delta < 0)  trajectory = 'SLIGHT_DECLINE';
      else if (delta >= 0) trajectory = 'STABLE_OR_RECOVERING';
    }
    if (benchmark.coralCover_pct && benchmark.longTermAverage_pct) {
      if (benchmark.coralCover_pct > benchmark.longTermAverage_pct * 1.1)
        trajectory += '_ABOVE_LONGTERM_AVG';
    }

    return {
      source:      'AIMS_LTMP',
      sourceId:    '009',
      lat, lon, timestamp,

      sector,
      flag:        null,
      confidence:  sstResult.sst ? 'HIGH' : 'MODERATE',

      gbr_coral_cover_score: coverScore,
      gbr_disturbance_index: disturbance.disturbanceIndex,
      gbr_cots_flag:         benchmark.cotsStatus,
      compound_flag:         compoundFlag,
      trajectory,

      benchmarks: {
        year:                benchmark.year,
        coralCover_pct:      benchmark.coralCover_pct,
        coralCover_2024_pct: benchmark.coralCover_2024_pct,
        longTermAvg_pct:     benchmark.longTermAverage_pct,
        relativeDecline_pct: benchmark.relativeDecline_pct,
        cotsStatus:          benchmark.cotsStatus,
        disturbances:        benchmark.disturbances2024,
        note:                benchmark.note
      },

      disturbance: {
        index:         disturbance.disturbanceIndex,
        points:        disturbance.disturbancePoints,
        cotsFlag:      disturbance.cotsFlag,
        cmieFlag:      disturbance.cmieFlag
      },

      sst: {
        value_c: sstResult.sst,
        date:    sstResult.date,
        site:    siteName || null,
        error:   sstResult.error || null
      }
    };
  }


  // ============================================================
  // 7. WINDOW.GROAN REGISTRATION
  // ============================================================

  window.GROAN = window.GROAN || {};
  window.GROAN.config  = window.GROAN.config  || {};
  window.GROAN.sources = window.GROAN.sources || {};

  window.GROAN.sources.AIMS_LTMP = {
    id:         '009',
    name:       'AIMS Long-Term Monitoring Program',
    shortName:  'AIMS_LTMP',
    version:    'Annual Summary 2024/25 + AIMS Data Platform API v1.0',
    dtis:       ['GBR_CORAL_COVER_SCORE', 'GBR_COTS_FLAG',
                 'GBR_DISTURBANCE_INDEX', 'AIMS_SST_C'],
    direction:  'POSITIVE (cover/SST) / NEGATIVE (disturbance)',
    coverage:   'Great Barrier Reef — Northern, Central, Southern sectors (124 reefs)',
    theater:    'GBR',
    accessMode: 'STATIC_BENCHMARKS + LIVE_API (SST only)',
    apiKeyVar:  'window.GROAN.config.AIMS_API_KEY',
    apiKeyUrl:  'https://open-aims.github.io/data-platform/key_request.html',
    liveEndpoint: `${AIMS_API_BASE}/${AIMS_SST_DOI}/data`,

    query:               queryAIMS,
    fetchAIMSSST,
    normalizeCoralCover,
    computeDisturbanceIndex,
    findGBRSector,

    benchmarks:  GBR_BENCHMARKS,
    cotsLevels:  COTS_LEVELS,
    sstSites:    GBR_SST_SITES,

    groanRole: {
      primary:   'GBR theater reference benchmark — scientific counterpart to HRI/AGRRA (Source 011)',
      secondary: 'COTS disturbance flagging — GBR-specific stressor not present in Caribbean',
      cmieFlags: ['COTS_WATCH', 'COTS_ACTIVE', 'COTS_OUTBREAK_ACTIVE',
                  'COMPOUND_DISTURBANCE_GBR', 'COTS_BLEACHING_COMPOUND',
                  'ACROPORA_VULNERABLE']
    },

    updateProtocol: {
      trigger:    'New AIMS Annual Summary (~August each year)',
      nextExpected: '~August 2025',
      updateTarget: 'GBR_BENCHMARKS in this file',
      dataSource:  'https://www.aims.gov.au/monitoring-great-barrier-reef/gbr-condition-summary',
      todo:        'TODO_UPDATE — refresh hardcoded values each August'
    },

    citation: 'Australian Institute of Marine Science (AIMS). (2025). LTMP Annual Summary ' +
              'Report of Coral Reef Condition 2024/25. ' +
              'https://www.aims.gov.au/monitoring-great-barrier-reef/gbr-condition-summary-2024-25'
  };

  console.log('[GROAN S009] aims-ltmp.js loaded → window.GROAN.sources.AIMS_LTMP');
  console.log('[GROAN S009] Live SST API available. Set window.GROAN.config.AIMS_API_KEY to activate.');

})();
