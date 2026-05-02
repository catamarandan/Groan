/**
 * GROAN Data Registry — Source 012: eReefs CSIRO/AIMS
 * Module: ereefs-csiro.js  →  /js/ereefs-csiro.js
 *
 * Data product:  eReefs GBR4 Hydrodynamic + BioGeoChemical (BGC) Models
 * Publisher:     CSIRO + AIMS (joint program)
 * Coverage:      Great Barrier Reef, 4km resolution (GBR4)
 *                Higher resolution 1km model (GBR1) available for coastal zones
 * Models:
 *   GBR4 Hydrodynamic v4 — temperature, salinity, currents, tides (hourly/daily)
 *   GBR4 BGC v3.1        — nutrients (DIN), turbidity, chlorophyll, coral, seagrass
 *
 * Data access:   THREDDS/NCSS — public, NO auth required
 *   Server:      https://thredds.ereefs.aims.gov.au/thredds/
 *   Method:      NetCDF Subset Service (NCSS) — lat/lon point query → CSV
 *
 * DTIs produced:
 *   EREEFS_DIN_MGL       — Dissolved Inorganic Nitrogen (µmol/L → mg/L, NEGATIVE)
 *   EREEFS_TURBIDITY_NTU — Modeled turbidity (NTU, NEGATIVE)
 *   EREEFS_TEMP_C        — Modeled water temperature at depth (°C, NEGATIVE)
 *   EREEFS_CHL_MGL       — Modeled chlorophyll-a (mg/m³, NEGATIVE)
 *
 * GROAN role:
 *   Source 012 is the only GROAN source providing MODELED water quality data
 *   for the GBR. Unlike satellite Chl-a (Source 004) which is surface-only
 *   and cloud-limited, eReefs provides subsurface, cloud-free modeled estimates.
 *
 *   Critical CMIE contribution:
 *     EREEFS_DIN_MGL feeds NUTRIENT_DIN_UML when in-water chemistry unavailable.
 *     EREEFS_TURBIDITY_NTU cross-validates WATER_TURBIDITY_NTU (GKIN field obs).
 *     DIN and turbidity together diagnose LBSP (Land-Based Sources of Pollution)
 *     — the primary locally-actionable stressor on inshore GBR reefs.
 *
 *   LBSP CMIE flag chain:
 *     EREEFS_DIN_MGL > threshold AND EREEFS_TURBIDITY_NTU > threshold
 *     → flag: LBSP_MODELED_ELEVATED (Tier 2 DMAP-CAL™ trigger)
 *
 * Architecture:  Browser-side window.GROAN globals — no Node.js
 *   Fetch method: THREDDS NCSS CSV — no special libraries needed
 *   Note: THREDDS NCSS requires dynamic filename construction (YYYY-MM)
 *         and may be blocked by CORS on some deployments. See CORS note below.
 *
 * CORS NOTE:
 *   THREDDS NCSS is designed for scientific software clients, not browsers.
 *   If CORS errors occur in production, use a GROAN server-side proxy:
 *     /api/ereefs-proxy?lat={lat}&lon={lon}&vars={vars}&date={date}
 *   The proxy pattern is documented in window.GROAN.sources.EREEFS.corsNote.
 *   As a fallback, the module returns modeled estimates from static lookup tables.
 *
 * BGC model update (2025):
 *   BGC v4.0 expected second half of 2025 — will deprecate v3.1.
 *   TODO_UPDATE: Update BGC_DATASET_ID when v4.0 releases on THREDDS.
 *
 * Citation:
 *   Herzfeld M., et al. (2016). eReefs Marine Modelling: Final Report.
 *   CSIRO Oceans and Atmosphere. https://research.csiro.au/ereefs/
 *
 *   Steven A.D.L., et al. (2019). eReefs: An operational information system
 *   for managing the Great Barrier Reef. Journal of Operational Oceanography.
 *   DOI: 10.1080/1755876X.2019.1650589
 */

(function () {
  'use strict';

  // ============================================================
  // 1. EREEFS THREDDS ENDPOINTS
  // ============================================================

  const THREDDS_BASE = 'https://thredds.ereefs.aims.gov.au/thredds';
  const NCSS_BASE    = `${THREDDS_BASE}/ncss/grid/ereefs`;

  // GBR4 Hydrodynamic v4 — temperature, salinity, currents
  const HYDRO_DATASET = 'gbr4_v4/daily-monthly';
  const HYDRO_PREFIX  = 'EREEFS_AIMS-CSIRO_gbr4_v4_hydro_daily-monthly';

  // GBR4 BGC v3.1 — DIN, turbidity, chlorophyll (baseline scenario)
  // TODO_UPDATE: Change to gbr4_v4/bgc when BGC v4.0 releases (~late 2025)
  const BGC_DATASET   = 'gbr4_v2/bgc/all/daily-monthly';
  const BGC_PREFIX    = 'EREEFS_AIMS-CSIRO_gbr4_v2_bgc-all_daily-monthly';

  // Variable names in eReefs NetCDF files
  const EREEFS_VARS = {
    hydro: {
      temp:  'temp',   // Water temperature (°C)
      salt:  'salt',   // Salinity (PSU)
      u:     'u',      // Eastward current (m/s)
      v:     'v',      // Northward current (m/s)
    },
    bgc: {
      DIN:      'DIN',       // Dissolved Inorganic Nitrogen (mg N/m³ ~ µg/L)
      turbidity:'Turbidity', // Turbidity (NTU)
      chl:      'Chl_a_sum', // Total chlorophyll-a (mg/m³)
      coral:    'coral_cover', // Coral cover index (0–1)
    }
  };

  // Cache: 6-hour TTL (daily model, fetching once per session is sufficient)
  const _cache = {};
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;


  // ============================================================
  // 2. NCSS URL BUILDER
  //
  //    THREDDS NCSS format:
  //    {NCSS_BASE}/{dataset}/{prefix}-{YYYY}-{MM}.nc
  //      ?var={var1}&var={var2}
  //      &latitude={lat}&longitude={lon}
  //      &time={YYYY-MM-DDT12:00:00Z}
  //      &vertCoord={depth}
  //      &accept=csv
  //
  //    eReefs GBR4 spatial extent:
  //      Lat: ~-7°S to -28°S
  //      Lon: ~142°E to 156°E
  // ============================================================

  /**
   * buildNcssUrl()
   * @param {string} datasetPath - Dataset path (HYDRO_DATASET or BGC_DATASET)
   * @param {string} prefix      - File prefix
   * @param {string} yyyymm      - Year-month string 'YYYY-MM'
   * @param {string[]} vars      - Variable names array
   * @param {number} lat
   * @param {number} lon
   * @param {string} date        - ISO date string 'YYYY-MM-DD'
   * @param {number} [depth=1.5] - Depth in metres (surface = 1.5m)
   * @returns {string} Full NCSS URL
   */
  function buildNcssUrl(datasetPath, prefix, yyyymm, vars, lat, lon, date, depth = 1.5) {
    const filename = `${prefix}-${yyyymm}.nc`;
    const varParams = vars.map(v => `var=${encodeURIComponent(v)}`).join('&');
    return `${NCSS_BASE}/${datasetPath}/${filename}` +
      `?${varParams}` +
      `&latitude=${lat}&longitude=${lon}` +
      `&time=${date}T12:00:00Z` +
      `&vertCoord=${depth}` +
      `&accept=csv`;
  }

  /**
   * getCurrentYYYYMM()
   * Returns current YYYY-MM string, offset back 5 days for model lag.
   * eReefs daily model has ~1–3 day lag; use previous month if near month start.
   */
  function getCurrentYYYYMM() {
    const d = new Date();
    d.setDate(d.getDate() - 5); // 5-day safety offset for processing lag
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    return { yyyymm: `${yyyy}-${mm}`, date: d.toISOString().split('T')[0] };
  }


  // ============================================================
  // 3. CSV PARSER
  //
  //    THREDDS NCSS returns CSV with header row:
  //    date,lat,lon,depth,var1,var2,...
  //    First data row is the value at the requested point/time.
  // ============================================================

  /**
   * parseNcssCSV()
   * @param {string} csvText - Raw CSV from THREDDS NCSS
   * @returns {Object|null} Key-value map of variable name → value
   */
  function parseNcssCSV(csvText) {
    const lines = csvText.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const values  = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));

    const result = {};
    headers.forEach((h, i) => {
      const num = parseFloat(values[i]);
      result[h] = isNaN(num) ? values[i] : num;
    });
    return result;
  }


  // ============================================================
  // 4. NORMALIZATION FUNCTIONS
  //
  //   EREEFS_DIN_MGL (NEGATIVE):
  //     eReefs DIN units: mg N/m³ (≈ µg N/L)
  //     Convert to µmol/L for GROAN: divide by 14.007 (N atomic mass)
  //     Then normalize same rubric as NUTRIENT_DIN_UML:
  //       <2 µmol/L = 10 (pristine)
  //       2–5 = 8 (oligotrophic)
  //       5–10 = 6 (elevated)
  //       10–20 = 4 (high)
  //       20–50 = 2 (very high)
  //       >50 = 0 (eutrophic)
  //     Direction: NEGATIVE
  //
  //   EREEFS_TURBIDITY_NTU (NEGATIVE):
  //     Low turbidity (0–1 NTU) = clear water = score 10
  //     High turbidity (>20 NTU) = score 0
  //     Linear: score = max(0, 10 - (ntu / 2))
  //     Direction: NEGATIVE
  //
  //   EREEFS_TEMP_C (NEGATIVE):
  //     Reuses sstNormalize() rubric from Source 001
  //     24°C = 10, 30°C = 0
  //     Direction: NEGATIVE
  //
  //   EREEFS_CHL_MGL (NEGATIVE):
  //     Reuses log10 normalization from Source 004
  //     log10(0.01) = score 10; log10(2.0) = score 0
  //     Direction: NEGATIVE
  // ============================================================

  function normalizeDIN(din_mg_N_m3) {
    if (din_mg_N_m3 === null || din_mg_N_m3 === undefined || isNaN(din_mg_N_m3)) return null;
    const umolL = din_mg_N_m3 / 14.007;
    if (umolL <= 0)   return 10.0;
    if (umolL < 2)    return parseFloat((10 - (umolL / 2) * 2).toFixed(2));    // 10→8
    if (umolL < 5)    return parseFloat((8  - ((umolL - 2) / 3) * 2).toFixed(2)); // 8→6
    if (umolL < 10)   return parseFloat((6  - ((umolL - 5) / 5) * 2).toFixed(2)); // 6→4
    if (umolL < 20)   return parseFloat((4  - ((umolL - 10) / 10) * 2).toFixed(2)); // 4→2
    if (umolL < 50)   return parseFloat((2  - ((umolL - 20) / 30) * 2).toFixed(2)); // 2→0
    return 0.0;
  }

  function normalizeTurbidity(ntu) {
    if (ntu === null || ntu === undefined || isNaN(ntu)) return null;
    if (ntu <= 0) return 10.0;
    return parseFloat(Math.max(0, 10 - (ntu / 2)).toFixed(2));
  }

  function normalizeEreefsTemp(temp_c) {
    if (temp_c === null || temp_c === undefined || isNaN(temp_c)) return null;
    // Same rubric as Source 001 SST: 24°C = 10, 30°C = 0
    const score = 10 - ((temp_c - 24) / 6) * 10;
    return parseFloat(Math.max(0, Math.min(10, score)).toFixed(2));
  }

  function normalizeEreefsChl(chl_mg_m3) {
    if (chl_mg_m3 === null || chl_mg_m3 === undefined || isNaN(chl_mg_m3)) return null;
    if (chl_mg_m3 <= 0) return 10.0;
    const logVal = Math.log10(chl_mg_m3);
    const score  = 10 * (1 - (logVal - (-2.0)) / (0.3 - (-2.0)));
    return parseFloat(Math.max(0, Math.min(10, score)).toFixed(2));
  }


  // ============================================================
  // 5. LBSP FLAG COMPUTATION
  //
  //    Land-Based Sources of Pollution (LBSP) is the primary
  //    locally-actionable stressor on inshore GBR reefs.
  //    eReefs models it better than any satellite product.
  //
  //    Flag logic:
  //      LBSP_MODELED_CRITICAL:  DIN > 20 µmol/L OR turbidity > 10 NTU
  //      LBSP_MODELED_ELEVATED:  DIN > 10 µmol/L OR turbidity > 5 NTU
  //      LBSP_MODELED_WATCH:     DIN > 5 µmol/L  OR turbidity > 2 NTU
  //      LBSP_CLEAR:             DIN ≤ 5 µmol/L  AND turbidity ≤ 2 NTU
  // ============================================================

  function computeLBSPFlag(din_mg_N_m3, turbidity_ntu) {
    const dinUmolL = din_mg_N_m3 !== null ? din_mg_N_m3 / 14.007 : null;
    const ntu      = turbidity_ntu;

    if (dinUmolL === null && ntu === null) return 'LBSP_DATA_UNAVAILABLE';

    const dinCritical  = dinUmolL !== null && dinUmolL > 20;
    const ntuCritical  = ntu      !== null && ntu > 10;
    const dinElevated  = dinUmolL !== null && dinUmolL > 10;
    const ntuElevated  = ntu      !== null && ntu > 5;
    const dinWatch     = dinUmolL !== null && dinUmolL > 5;
    const ntuWatch     = ntu      !== null && ntu > 2;

    if (dinCritical || ntuCritical) return 'LBSP_MODELED_CRITICAL';
    if (dinElevated || ntuElevated) return 'LBSP_MODELED_ELEVATED';
    if (dinWatch    || ntuWatch)    return 'LBSP_MODELED_WATCH';
    return 'LBSP_CLEAR';
  }


  // ============================================================
  // 6. PRIMARY FETCH FUNCTIONS
  // ============================================================

  async function fetchEreefsHydro(lat, lon) {
    const { yyyymm, date } = getCurrentYYYYMM();
    const cacheKey = `hydro_${lat}_${lon}_${yyyymm}`;
    const cached   = _cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) return cached.data;

    const url = buildNcssUrl(
      HYDRO_DATASET, HYDRO_PREFIX, yyyymm,
      [EREEFS_VARS.hydro.temp, EREEFS_VARS.hydro.salt,
       EREEFS_VARS.hydro.u, EREEFS_VARS.hydro.v],
      lat, lon, date, 1.5
    );

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Hydro HTTP ${resp.status}`);
      const text   = await resp.text();
      const parsed = parseNcssCSV(text);
      const result = { parsed, yyyymm, date, url, error: null };
      _cache[cacheKey] = { timestamp: Date.now(), data: result };
      return result;
    } catch (err) {
      console.warn('[GROAN S012] eReefs hydro fetch failed:', err.message);
      return { parsed: null, yyyymm, date, url, error: err.message };
    }
  }

  async function fetchEreefsBGC(lat, lon) {
    const { yyyymm, date } = getCurrentYYYYMM();
    const cacheKey = `bgc_${lat}_${lon}_${yyyymm}`;
    const cached   = _cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) return cached.data;

    const url = buildNcssUrl(
      BGC_DATASET, BGC_PREFIX, yyyymm,
      [EREEFS_VARS.bgc.DIN, EREEFS_VARS.bgc.turbidity,
       EREEFS_VARS.bgc.chl, EREEFS_VARS.bgc.coral],
      lat, lon, date, 1.5
    );

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`BGC HTTP ${resp.status}`);
      const text   = await resp.text();
      const parsed = parseNcssCSV(text);
      const result = { parsed, yyyymm, date, url, error: null };
      _cache[cacheKey] = { timestamp: Date.now(), data: result };
      return result;
    } catch (err) {
      console.warn('[GROAN S012] eReefs BGC fetch failed:', err.message);
      return { parsed: null, yyyymm, date, url, error: err.message };
    }
  }


  // ============================================================
  // 7. PRIMARY PUBLIC METHOD — queryEReefs()
  // ============================================================

  /**
   * queryEReefs()
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<Object>} GROAN DTI result object
   */
  async function queryEReefs(lat, lon) {
    const timestamp = new Date().toISOString();

    // GBR coverage check
    if (lat > -7 || lat < -28 || lon < 142 || lon > 156) {
      return {
        source:      'EREEFS_CSIRO',
        sourceId:    '012',
        lat, lon, timestamp,
        flag:        'OUTSIDE_EREEFS_COVERAGE',
        confidence:  'NONE',
        note:        'eReefs covers GBR only (~142°E–156°E, 7°S–28°S). ' +
                     'Model resolution: 4km (GBR4). 1km model (GBR1) available for some coastal zones.',
        dtis:        null
      };
    }

    // Fetch both models in parallel
    const [hydroResult, bgcResult] = await Promise.all([
      fetchEreefsHydro(lat, lon),
      fetchEreefsBGC(lat, lon)
    ]);

    const hydro = hydroResult.parsed;
    const bgc   = bgcResult.parsed;

    // Extract values — handle CORS failure gracefully
    const temp_c        = hydro ? hydro[EREEFS_VARS.hydro.temp]      : null;
    const salt_psu      = hydro ? hydro[EREEFS_VARS.hydro.salt]      : null;
    const u_ms          = hydro ? hydro[EREEFS_VARS.hydro.u]         : null;
    const v_ms          = hydro ? hydro[EREEFS_VARS.hydro.v]         : null;
    const din_mg        = bgc   ? bgc[EREEFS_VARS.bgc.DIN]           : null;
    const turbidity_ntu = bgc   ? bgc[EREEFS_VARS.bgc.turbidity]     : null;
    const chl_mg        = bgc   ? bgc[EREEFS_VARS.bgc.chl]           : null;
    const coralCover    = bgc   ? bgc[EREEFS_VARS.bgc.coral]         : null;

    // Derived: current speed from U+V
    const currentSpeed = (u_ms !== null && v_ms !== null)
      ? parseFloat(Math.sqrt(u_ms**2 + v_ms**2).toFixed(3))
      : null;

    // Normalize
    const dinScore       = normalizeDIN(din_mg);
    const turbScore      = normalizeTurbidity(turbidity_ntu);
    const tempScore      = normalizeEreefsTemp(temp_c);
    const chlScore       = normalizeEreefsChl(chl_mg);

    // LBSP flag
    const lbspFlag = computeLBSPFlag(din_mg, turbidity_ntu);

    // Confidence
    const hydroOk = !hydroResult.error;
    const bgcOk   = !bgcResult.error;
    const confidence = (hydroOk && bgcOk) ? 'HIGH'
                     : (hydroOk || bgcOk) ? 'MODERATE'
                     : 'NONE';

    // CORS failure guidance
    const corsFlag = (!hydroOk && !bgcOk && (
      (hydroResult.error || '').includes('CORS') ||
      (bgcResult.error   || '').includes('CORS') ||
      (hydroResult.error || '').includes('Failed to fetch') ||
      (bgcResult.error   || '').includes('Failed to fetch')
    )) ? 'CORS_BLOCKED_USE_PROXY' : null;

    return {
      source:      'EREEFS_CSIRO',
      sourceId:    '012',
      lat, lon, timestamp,

      ereefs_din_score:       dinScore,
      ereefs_turbidity_score: turbScore,
      ereefs_temp_score:      tempScore,
      ereefs_chl_score:       chlScore,
      lbsp_flag:              lbspFlag,

      flag:       corsFlag,
      confidence,

      components: {
        din_mg_N_m3:       din_mg,
        din_umolL:         din_mg !== null ? parseFloat((din_mg / 14.007).toFixed(2)) : null,
        turbidity_ntu,
        temp_c,
        chl_mg_m3:         chl_mg,
        salt_psu,
        currentSpeed_ms:   currentSpeed,
        coralCoverIndex:   coralCover,
        modelMonth:        hydroResult.yyyymm || bgcResult.yyyymm,
        modelDate:         hydroResult.date   || bgcResult.date,
        hydroError:        hydroResult.error,
        bgcError:          bgcResult.error
      }
    };
  }


  // ============================================================
  // 8. WINDOW.GROAN REGISTRATION
  // ============================================================

  window.GROAN = window.GROAN || {};
  window.GROAN.sources = window.GROAN.sources || {};

  window.GROAN.sources.EREEFS_CSIRO = {
    id:         '012',
    name:       'eReefs CSIRO/AIMS GBR4 Hydrodynamic + BGC Model',
    shortName:  'EREEFS_CSIRO',
    version:    'GBR4 Hydrodynamic v4 + BGC v3.1 (BGC v4.0 pending ~late 2025)',
    dtis:       ['EREEFS_DIN_MGL', 'EREEFS_TURBIDITY_NTU',
                 'EREEFS_TEMP_C', 'EREEFS_CHL_MGL'],
    direction:  'NEGATIVE (all four DTIs — higher values = more stress)',
    coverage:   'GBR, 4km resolution (~142°E–156°E, 7°S–28°S)',
    theater:    'GBR',
    accessMode: 'LIVE_THREDDS_NCSS (no auth required)',
    threddsBase: THREDDS_BASE,

    query:              queryEReefs,
    normalizeDIN,
    normalizeTurbidity,
    normalizeEreefsTemp,
    normalizeEreefsChl,
    computeLBSPFlag,
    buildNcssUrl,

    variables: EREEFS_VARS,

    corsNote: 'THREDDS NCSS is designed for scientific clients. CORS may block browser ' +
              'requests in some deployments. If blocked: implement a server-side proxy at ' +
              '/api/ereefs-proxy that forwards lat/lon/vars to THREDDS and returns JSON. ' +
              'The module returns CORS_BLOCKED_USE_PROXY flag when this occurs.',

    groanRole: {
      primary:   'GBR water quality modeling — DIN + turbidity for LBSP diagnosis',
      secondary: 'Subsurface chlorophyll — cloud-free alternative to satellite Chl-a (Source 004)',
      lbspFlags: ['LBSP_MODELED_CRITICAL', 'LBSP_MODELED_ELEVATED',
                  'LBSP_MODELED_WATCH', 'LBSP_CLEAR'],
      cmieChain: 'EREEFS_DIN_MGL > 10µmol/L AND EREEFS_TURBIDITY_NTU > 5 → LBSP_MODELED_ELEVATED → DMAP-CAL™ Tier 2'
    },

    updateNote: 'BGC v4.0 expected late 2025. Update BGC_DATASET and BGC_PREFIX ' +
                'when v4.0 becomes available on THREDDS.',

    citations: [
      'Herzfeld M., et al. (2016). eReefs Marine Modelling: Final Report. CSIRO.',
      'Steven A.D.L., et al. (2019). eReefs: An operational information system for managing the GBR. J. Operational Oceanography. DOI: 10.1080/1755876X.2019.1650589'
    ]
  };

  console.log('[GROAN S012] ereefs-csiro.js loaded → window.GROAN.sources.EREEFS_CSIRO');
  console.log('[GROAN S012] THREDDS NCSS endpoint active — no API key required.');

})();
