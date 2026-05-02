/**
 * GROAN Data Registry — Source 006: Allen Coral Atlas (ACA)
 * Module: allen-coral-atlas.js  →  /js/allen-coral-atlas.js
 *
 * Data product:  ACA Geomorphic Zonation + Benthic Habitat v2.0
 * Coverage:      Shallow tropical reefs, 30°N–30°S, ≤15 m depth
 * Resolution:    5 m pixel (geomorphic); 10 m pixel (benthic)
 * Vintage:       2018–2021 PlanetScope composite
 * Citation:      Allen Coral Atlas (2020). Imagery, maps and monitoring
 *                of the world's tropical coral reefs. Zenodo.
 *                DOI: 10.5281/zenodo.3833242
 *
 * DTI produced:  RSI — Reef Structural Integrity Index (0–10)
 * Normalization: POSITIVE (higher = better reef structure)
 *
 * Data access architecture:
 *   ACA does not expose an unauthenticated public point-query REST API.
 *   Primary access paths:
 *     (A) Google Earth Engine REST API (requires OAuth service account)
 *     (B) Pre-fetched regional GeoJSON/vector tiles served from GROAN repo  ← ACTIVE PATH
 *
 *   Active path (B):
 *     1. Download ACA Caribbean vector export (benthic + geomorphic layers)
 *        from allencoralatlas.org → Atlas → Draw AOI → Download → GeoJSON
 *     2. Commit to /data/aca_caribbean_benthic.geojson
 *                   /data/aca_caribbean_geomorphic.geojson
 *                   /data/aca_caribbean_reef_extent.geojson
 *     3. This module loads those files at init and performs client-side
 *        point-in-polygon spatial queries using turf.js.
 *
 *   TODO_ENDPOINT: Replace stub paths in DATA_PATHS once Caribbean AOI
 *   export is downloaded and committed to repo.
 *
 * Architecture:  Browser-side window.GROAN globals — no Node.js
 * Dependencies:  turf.js (CDN) for point-in-polygon spatial queries
 *                <script src="https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js"></script>
 *
 * Normalization direction: POSITIVE — higher RSI = better structural integrity
 */

(function () {
  'use strict';

  // ============================================================
  // 1. CLASS LOOKUP TABLES
  //    Source: ACA Mapping Class Descriptions v3
  //    https://allencoralatlas.org/resources/
  // ============================================================

  /**
   * GEOMORPHIC ZONE CLASSIFICATIONS (12 zones)
   * Score reflects ecological/structural significance to reef system integrity.
   * Higher score = higher structural value to reef ecosystem.
   *
   * Scoring rationale:
   *   Reef Crest / Slope = primary wave-energy dissipation, high coral density → 9.5–10
   *   Reef Flat / Back Reef / Plateau = moderate structural role → 6.5–8
   *   Lagoon / Sparse zones = low structural density → 3.5–5
   *   Terrestrial / Deep Lagoon = minimal reef structural contribution → 1.5–2.5
   */
  const GEOMORPHIC_ZONES = {
    11: { label: 'Reef Crest',            score: 10.0, desc: 'Highest wave energy zone; framework-building coral peak density' },
    12: { label: 'Outer Reef Flat',       score: 8.0,  desc: 'Seaward flat; high hydrodynamic exposure, moderate coral cover' },
    13: { label: 'Inner Reef Flat',       score: 6.5,  desc: 'Leeward flat; lower energy, mixed benthic community' },
    14: { label: 'Reef Slope',            score: 9.5,  desc: 'Primary accretion zone; high coral density, structural complexity' },
    15: { label: 'Back Reef Slope',       score: 7.0,  desc: 'Sheltered slope; moderate coral, transitional community' },
    16: { label: 'Plateau',              score: 7.5,  desc: 'Sub-surface flat; variable energy, consistent coral assemblages' },
    17: { label: 'Lagoon',               score: 4.0,  desc: 'Enclosed low-energy zone; sediment accumulation, sparse hard coral' },
    18: { label: 'Deep Lagoon',          score: 2.5,  desc: 'Deeper lagoonal basin; sand/rubble dominant, low structural role' },
    19: { label: 'Sheltered Reef Slope', score: 8.0,  desc: 'Low-wave slope; coral diversity high but lower calcification rate' },
    20: { label: 'Terrestrial Reef Flat',score: 1.5,  desc: 'Reef flat adjacent to shoreline; high turbidity, degraded' },
    21: { label: 'Sparse Reef',          score: 3.5,  desc: 'Isolated patch reef; low connectivity, fragmented structure' },
    22: { label: 'Unknown/Unmapped',     score: null,  desc: 'Outside ACA mapping extent or insufficient image quality' }
  };

  /**
   * BENTHIC HABITAT CLASSIFICATIONS (7 classes)
   * Score reflects live biotic cover contribution to reef structural integrity.
   * Higher score = higher living cover / structural complexity.
   *
   * Note: ACA merges hard coral + crustose coralline algae (CCA) into one
   * class (Coral/Algae) due to spectral similarity at satellite resolution.
   *
   * Scoring rationale:
   *   Coral/Algae = living framework builders → 9.0
   *   Seagrass = adjacent ecosystem; linked but not reef structure → 4.5
   *   Microalgal Mats = moderate disturbance indicator → 5.0
   *   Rock = recruitment surface potential → 4.0
   *   Rubble = structural degradation indicator → 2.0
   *   Sand = no structural contribution → 1.0
   */
  const BENTHIC_CLASSES = {
    401: { label: 'Coral/Algae',       score: 9.0, desc: 'Hard coral + CCA; primary carbonate framework builders' },
    402: { label: 'Microalgal Mats',   score: 5.0, desc: 'Turf/biofilm algae; moderate disturbance indicator' },
    403: { label: 'Rock',              score: 4.0, desc: 'Consolidated bare substrate; coral recruitment surface potential' },
    404: { label: 'Rubble',            score: 2.0, desc: 'Unconsolidated dead coral fragments; structural degradation marker' },
    405: { label: 'Sand',              score: 1.0, desc: 'Unconsolidated sediment; no structural contribution' },
    406: { label: 'Seagrass',          score: 4.5, desc: 'Adjacent seagrass habitat; ecological linkage, not reef structure' },
    407: { label: 'Unknown/Unmapped',  score: null, desc: 'Outside ACA benthic mapping extent (deeper than 10m or turbid)' }
  };

  const PRESENCE_SCORES = {
    present: 10.0,
    absent:   0.0,
    unknown:  null
  };


  // ============================================================
  // 2. RSI FORMULA
  //
  //   RSI = (w_zone × zoneScore) + (w_benthic × benthicScore) + (w_presence × presenceScore)
  //
  //   Weights:
  //     w_zone     = 0.40  (structural zone is primary ecological context)
  //     w_benthic  = 0.40  (live benthic cover is primary condition indicator)
  //     w_presence = 0.20  (presence confirmation; highest info value at boundaries)
  //
  //   Null handling:
  //     Zone unmapped (null)         → RSI = null, flag: OUTSIDE_ACA_EXTENT
  //     Benthic unmapped (>10m/turbid) → redistribute: zone=0.70, presence=0.30
  //     Presence unknown             → redistribute: zone=0.50, benthic=0.50
  //     Zone + benthic only          → RSI = zoneScore (zone=1.00)
  //
  //   Output range: 0.0–10.0
  //   Normalization: POSITIVE (no inversion)
  // ============================================================

  const RSI_WEIGHTS = {
    zone:     0.40,
    benthic:  0.40,
    presence: 0.20
  };

  function computeRSI(zoneScore, benthicScore, presenceScore) {
    if (zoneScore === null) {
      return { rsi: null, flag: 'OUTSIDE_ACA_EXTENT', confidence: 'NONE' };
    }

    let rsi, flag = null, confidence;

    if (benthicScore !== null && presenceScore !== null) {
      rsi = (RSI_WEIGHTS.zone * zoneScore) +
            (RSI_WEIGHTS.benthic * benthicScore) +
            (RSI_WEIGHTS.presence * presenceScore);
      confidence = 'HIGH';

    } else if (benthicScore === null && presenceScore !== null) {
      rsi = (0.70 * zoneScore) + (0.30 * presenceScore);
      flag = 'BENTHIC_UNMAPPED';
      confidence = 'MODERATE';

    } else if (benthicScore !== null && presenceScore === null) {
      rsi = (0.50 * zoneScore) + (0.50 * benthicScore);
      flag = 'PRESENCE_UNKNOWN';
      confidence = 'MODERATE';

    } else {
      rsi = zoneScore;
      flag = 'ZONE_ONLY';
      confidence = 'LOW';
    }

    return {
      rsi: parseFloat(rsi.toFixed(2)),
      flag,
      confidence
    };
  }


  // ============================================================
  // 3. DATA PATHS — LOCAL GEOJSON
  //
  //   ACA does not provide a public unauthenticated point-query API.
  //   GROAN uses pre-downloaded regional GeoJSON served from repo.
  //
  //   TODO_ENDPOINT: Update paths after ACA Caribbean export is downloaded.
  //
  //   Download steps:
  //   1. Go to https://allencoralatlas.org/atlas/
  //   2. Draw AOI: Caribbean Rim Run corridor
  //      (approx. 10°N–23°N, 58°W–92°W)
  //   3. Download → benthic layer → GeoJSON → commit as:
  //        Groan/data/aca_caribbean_benthic.geojson
  //   4. Download → geomorphic layer → GeoJSON → commit as:
  //        Groan/data/aca_caribbean_geomorphic.geojson
  //   5. Download → reef extent layer → GeoJSON → commit as:
  //        Groan/data/aca_caribbean_reef_extent.geojson
  //   6. Update DATA_PATHS below to match repo paths.
  //
  //   Expected file sizes (Caribbean AOI):
  //     Benthic:    ~50–150 MB
  //     Geomorphic: ~20–80 MB
  //     Reef Extent:~10–40 MB
  //   Consider filtering to Rim Run waypoint corridor to reduce size.
  //
  //   Turf.js CDN (add to index.html before this module):
  //   <script src="https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js"></script>
  // ============================================================

  const DATA_PATHS = {
    benthic:    '/data/aca_caribbean_benthic.geojson',    // TODO_ENDPOINT
    geomorphic: '/data/aca_caribbean_geomorphic.geojson', // TODO_ENDPOINT
    reefExtent: '/data/aca_caribbean_reef_extent.geojson' // TODO_ENDPOINT
  };

  let _cache = {
    benthic:    null,
    geomorphic: null,
    reefExtent: null,
    loaded:     false,
    loading:    false,
    error:      null
  };

  async function loadACAData() {
    if (_cache.loaded) return true;
    if (_cache.loading) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!_cache.loading) {
            clearInterval(interval);
            resolve(_cache.loaded);
          }
        }, 100);
      });
    }

    _cache.loading = true;

    try {
      const [benthicRes, geomorphicRes, extentRes] = await Promise.all([
        fetch(DATA_PATHS.benthic),
        fetch(DATA_PATHS.geomorphic),
        fetch(DATA_PATHS.reefExtent)
      ]);

      if (!benthicRes.ok || !geomorphicRes.ok || !extentRes.ok) {
        throw new Error(
          'ACA GeoJSON files not found. See TODO_ENDPOINT in allen-coral-atlas.js. ' +
          'Download from allencoralatlas.org/atlas and commit to /data/ directory.'
        );
      }

      _cache.benthic    = await benthicRes.json();
      _cache.geomorphic = await geomorphicRes.json();
      _cache.reefExtent = await extentRes.json();
      _cache.loaded     = true;
      _cache.error      = null;

      console.log('[GROAN S006] ACA data loaded. Features:', {
        benthic:    _cache.benthic.features.length,
        geomorphic: _cache.geomorphic.features.length,
        reefExtent: _cache.reefExtent.features.length
      });

      return true;

    } catch (err) {
      _cache.error   = err.message;
      _cache.loaded  = false;
      _cache.loading = false;
      console.warn('[GROAN S006] ACA load failed:', err.message);
      return false;
    } finally {
      _cache.loading = false;
    }
  }


  // ============================================================
  // 4. SPATIAL QUERY — POINT-IN-POLYGON
  //    Requires turf.js loaded globally.
  // ============================================================

  function queryPointACA(lat, lon) {
    if (!_cache.loaded) {
      console.warn('[GROAN S006] Data not loaded. Call loadACAData() first.');
      return { geomorphic: null, benthic: null, reefPresent: null };
    }

    if (typeof turf === 'undefined') {
      console.error('[GROAN S006] turf.js not loaded. Add CDN script to HTML before this module.');
      return { geomorphic: null, benthic: null, reefPresent: null };
    }

    const point = turf.point([lon, lat]);

    // Reef presence
    let reefPresent = false;
    for (const feature of _cache.reefExtent.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        reefPresent = true;
        break;
      }
    }

    // Geomorphic zone
    let geomorphicFeature = null;
    for (const feature of _cache.geomorphic.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        geomorphicFeature = feature;
        break;
      }
    }

    // Benthic class
    let benthicFeature = null;
    for (const feature of _cache.benthic.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        benthicFeature = feature;
        break;
      }
    }

    return { geomorphic: geomorphicFeature, benthic: benthicFeature, reefPresent };
  }


  // ============================================================
  // 5. PRIMARY PUBLIC METHOD — queryACA()
  // ============================================================

  async function queryACA(lat, lon) {
    const timestamp = new Date().toISOString();

    // ACA latitude bounds
    if (lat > 30 || lat < -30) {
      return {
        source: 'ACA', sourceId: '006', dti: 'RSI',
        lat, lon, timestamp,
        rsi: null, flag: 'OUTSIDE_ACA_LATITUDE_BOUNDS', confidence: 'NONE',
        components: null, raw: null
      };
    }

    const loaded = await loadACAData();

    if (!loaded) {
      return {
        source: 'ACA', sourceId: '006', dti: 'RSI',
        lat, lon, timestamp,
        rsi: null, flag: 'DATA_LOAD_FAILED: ' + _cache.error, confidence: 'NONE',
        components: null, raw: null
      };
    }

    const spatial = queryPointACA(lat, lon);

    // TODO_ENDPOINT: Verify exact GeoJSON property key for class code after download.
    // Expected based on ACA documentation: feature.properties.class (integer)
    // Alternate possibilities: 'class_id', 'zone_id', 'benthic_class'
    // Confirm by inspecting downloaded GeoJSON before deploying.
    const geomorphicCode = spatial.geomorphic
      ? parseInt(spatial.geomorphic.properties.class, 10)
      : null;

    const benthicCode = spatial.benthic
      ? parseInt(spatial.benthic.properties.class, 10)
      : null;

    const geomorphicEntry = geomorphicCode ? (GEOMORPHIC_ZONES[geomorphicCode] || GEOMORPHIC_ZONES[22]) : null;
    const benthicEntry    = benthicCode    ? (BENTHIC_CLASSES[benthicCode]    || BENTHIC_CLASSES[407])  : null;

    const zoneScore     = geomorphicEntry ? geomorphicEntry.score : null;
    const benthicScore  = benthicEntry    ? benthicEntry.score    : null;
    const presenceScore = spatial.reefPresent === null
      ? null
      : spatial.reefPresent ? PRESENCE_SCORES.present : PRESENCE_SCORES.absent;

    const rsiResult = computeRSI(zoneScore, benthicScore, presenceScore);

    return {
      source:     'ACA',
      sourceId:   '006',
      dti:        'RSI',
      lat, lon, timestamp,

      rsi:        rsiResult.rsi,
      flag:       rsiResult.flag,
      confidence: rsiResult.confidence,

      components: {
        reefPresent:      spatial.reefPresent,
        presenceScore,
        geomorphicCode,
        geomorphicLabel:  geomorphicEntry ? geomorphicEntry.label : null,
        geomorphicDesc:   geomorphicEntry ? geomorphicEntry.desc  : null,
        zoneScore,
        benthicCode,
        benthicLabel:     benthicEntry ? benthicEntry.label : null,
        benthicDesc:      benthicEntry ? benthicEntry.desc  : null,
        benthicScore,
        weights:          RSI_WEIGHTS
      },

      raw: {
        geomorphicFeature: spatial.geomorphic,
        benthicFeature:    spatial.benthic
      }
    };
  }


  // ============================================================
  // 6. NORMALIZATION HELPER
  //    RSI is natively 0–10 POSITIVE. No transformation required.
  //    Exposed for CMIE symmetry with other source normalizers.
  // ============================================================

  function normalizeRSI(rsi) {
    if (rsi === null || rsi === undefined) return null;
    return Math.max(0, Math.min(10, rsi));
  }


  // ============================================================
  // 7. WINDOW.GROAN REGISTRATION
  // ============================================================

  window.GROAN = window.GROAN || {};
  window.GROAN.sources = window.GROAN.sources || {};

  window.GROAN.sources.ACA = {
    id:         '006',
    name:       'Allen Coral Atlas',
    shortName:  'ACA',
    version:    'v2.0 (2018–2021)',
    dti:        'RSI',
    dtiLabel:   'Reef Structural Integrity Index',
    direction:  'POSITIVE',
    units:      '0–10 scale',
    coverage:   '30°N–30°S, shallow reefs ≤15 m depth',
    vintage:    '2018–2021 (static dataset — not real-time)',
    accessMode: 'LOCAL_GEOJSON',

    load:      loadACAData,
    query:     queryACA,
    normalize: normalizeRSI,

    geomorphicZones: GEOMORPHIC_ZONES,
    benthicClasses:  BENTHIC_CLASSES,

    get loaded() { return _cache.loaded; },
    get error()  { return _cache.error; },

    formula: {
      description: 'RSI = (0.40 × zoneScore) + (0.40 × benthicScore) + (0.20 × presenceScore)',
      weights: RSI_WEIGHTS,
      nullHandling: {
        benthicUnmapped: 'RSI = (0.70 × zoneScore) + (0.30 × presenceScore)',
        presenceUnknown: 'RSI = (0.50 × zoneScore) + (0.50 × benthicScore)',
        zoneUnmapped:    'RSI = null → flag: OUTSIDE_ACA_EXTENT'
      }
    },

    citation: 'Allen Coral Atlas (2020). Imagery, maps and monitoring of the world\'s tropical coral reefs. Zenodo. DOI: 10.5281/zenodo.3833242'
  };

  console.log('[GROAN S006] allen-coral-atlas.js loaded → window.GROAN.sources.ACA');

})();
