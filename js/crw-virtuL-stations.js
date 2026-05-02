/**
 * GROAN Data Registry — Source 007: NOAA CRW Regional Virtual Stations
 * Module: crw-virtual-stations.js  →  /js/crw-virtual-stations.js
 *
 * Data product:  NOAA Coral Reef Watch 5km Regional Virtual Stations v3.1
 * Coverage:      219 global stations; this module covers Rim Run Caribbean
 *                theater + ABC Islands + Colombia coast
 * Variables:     SST, SST anomaly, HotSpot, DHW (90th pct), BAA 7-day max
 * Update freq:   Daily (concurrent with CRW 5km gridded products)
 * Time series:   1985–present
 *
 * Data access:   Public ASCII text files — no auth required
 * Base URL:      https://coralreefwatch.noaa.gov/product/vs/data/{station_id}.txt
 *
 * DTIs produced:
 *   VS_DHW_90PCT   — jurisdiction 90th-percentile Degree Heating Weeks (0–10, NEGATIVE)
 *   VS_BAA_7D_MAX  — jurisdiction 7-day max Bleaching Alert Area (0–10, NEGATIVE)
 *
 * Relationship to Sources 001/003:
 *   Source 001/003 = point-level gridded DHW/BAA at exact lat/lon
 *   Source 007     = jurisdiction-level 90th-percentile DHW/BAA for the
 *                    reef system surrounding a waypoint
 *   CMIE uses the DELTA between point and jurisdiction values to flag whether
 *   a local observation is isolated or representative of systemic stress.
 *
 * Architecture:  Browser-side window.GROAN globals — no Node.js
 * No dependencies beyond fetch API (native browser).
 *
 * Normalization:
 *   VS_DHW_90PCT  → NEGATIVE (piecewise, same rubric as Source 003 DHW)
 *   VS_BAA_7D_MAX → NEGATIVE (categorical, same rubric as Source 003 BAA)
 *
 * Citation:
 *   NOAA Coral Reef Watch. 2018, updated daily. NOAA Coral Reef Watch
 *   Version 3.1 Daily Global 5-km Satellite Coral Bleaching Heat Stress
 *   Monitoring. College Park, Maryland, USA: NOAA/NESDIS/STAR Coral Reef
 *   Watch program. Data set accessed at https://coralreefwatch.noaa.gov/product/5km/
 */

(function () {
  'use strict';

  // ============================================================
  // 1. RIM RUN CARIBBEAN VIRTUAL STATION REGISTRY
  //
  //    Stations covering the 37-stop Rim Run Caribe™ corridor.
  //    Source: NOAA CRW Caribbean group (23 stations) + select
  //    South Caribbean stations covering ABC Islands / Colombia.
  //
  //    Station ID = exact filename key in CRW data URL:
  //    https://coralreefwatch.noaa.gov/product/vs/data/{id}.txt
  //
  //    Coordinates are station centroid markers from CRW.
  //    Stations cover reef pixels within jurisdiction + 20km buffer.
  // ============================================================

  const RIM_RUN_STATIONS = {
    // --- MESOAMERICAN REEF SYSTEM ---
    banco_chinchorro: {
      id:          'banco_chinchorro',
      label:       'Banco Chinchorro, Mexico',
      country:     'Mexico',
      lat:          18.0,
      lon:         -87.5,
      rimRunLegs:  ['MEX-Yucatan', 'MEX-Caribe'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/banco_chinchorro.php'
    },
    mesoamerican_reef_mexico: {
      id:          'mesoamerican_reef_mexico',
      label:       'Mesoamerican Reef, Mexico',
      country:     'Mexico',
      lat:          20.5,
      lon:         -87.0,
      rimRunLegs:  ['MEX-Yucatan'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/mesoamerican_reef_mexico.php'
    },
    glovers_reef: {
      id:          'glovers_reef',
      label:       "Glover's Reef, Belize",
      country:     'Belize',
      lat:          16.5,
      lon:         -88.0,
      rimRunLegs:  ['BLZ'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/glovers_reef.php'
    },
    mesoamerican_reef_belize: {
      id:          'mesoamerican_reef_belize',
      label:       'Mesoamerican Reef, Belize',
      country:     'Belize',
      lat:          17.0,
      lon:         -87.5,
      rimRunLegs:  ['BLZ'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/mesoamerican_reef_belize.php'
    },
    bay_islands: {
      id:          'bay_islands',
      label:       'Bay Islands, Honduras',
      country:     'Honduras',
      lat:          16.5,
      lon:         -85.5,
      rimRunLegs:  ['HND'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/bay_islands.php'
    },
    cayos_miskitos: {
      id:          'cayos_miskitos',
      label:       'Cayos Miskitos, Nicaragua',
      country:     'Nicaragua',
      lat:          14.0,
      lon:         -83.0,
      rimRunLegs:  ['NIC'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/cayos_miskitos.php'
    },
    bocas_del_toro: {
      id:          'bocas_del_toro',
      label:       'Bocas del Toro, Panama',
      country:     'Panama',
      lat:           9.5,
      lon:         -81.5,
      rimRunLegs:  ['PAN'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/bocas_del_toro.php'
    },

    // --- GREATER ANTILLES / CAYMAN ---
    cayman_islands: {
      id:          'cayman_islands',
      label:       'Cayman Islands',
      country:     'Cayman Islands',
      lat:          19.5,
      lon:         -80.5,
      rimRunLegs:  ['CYM'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/cayman_islands.php'
    },
    cuba_south: {
      id:          'cuba_south',
      label:       'Cuba South',
      country:     'Cuba',
      lat:          21.5,
      lon:         -78.0,
      rimRunLegs:  ['CUB-S'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/cuba_south.php'
    },
    jamaica: {
      id:          'jamaica',
      label:       'Jamaica',
      country:     'Jamaica',
      lat:          17.5,
      lon:         -77.5,
      rimRunLegs:  ['JAM'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/jamaica.php'
    },

    // --- COLOMBIA / SOUTH CARIBBEAN ---
    colombia_caribbean: {
      id:          'colombia_caribbean',
      label:       'Colombia Caribbean',
      country:     'Colombia',
      lat:          12.5,
      lon:         -74.5,
      rimRunLegs:  ['COL-N', 'COL-S'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/colombia_caribbean.php'
    },
    providencia: {
      id:          'providencia',
      label:       'Providencia, Colombia',
      country:     'Colombia',
      lat:          13.5,
      lon:         -81.5,
      rimRunLegs:  ['COL-N'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/providencia.php'
    },

    // --- ABC ISLANDS / VENEZUELA ---
    curacao_aruba: {
      id:          'curacao_aruba',
      label:       'Curaçao and Aruba',
      country:     'Netherlands Antilles',
      lat:          12.5,
      lon:         -69.5,
      rimRunLegs:  ['ABC'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/curacao_aruba.php'
    },
    los_roques: {
      id:          'los_roques',
      label:       'Los Roques, Venezuela',
      country:     'Venezuela',
      lat:          11.5,
      lon:         -66.5,
      rimRunLegs:  ['VEN'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/los_roques.php'
    },

    // --- LESSER ANTILLES (Rim Run transit corridor) ---
    barbados: {
      id:          'barbados',
      label:       'Barbados',
      country:     'Barbados',
      lat:          13.0,
      lon:         -60.0,
      rimRunLegs:  ['LCA-BRB'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/barbados.php'
    },
    buccoo_reef_tobago: {
      id:          'buccoo_reef_tobago',
      label:       'Buccoo Reef, Tobago',
      country:     'Trinidad and Tobago',
      lat:          11.5,
      lon:         -61.0,
      rimRunLegs:  ['TTO'],
      gaugeUrl:    'https://coralreefwatch.noaa.gov/product/vs/gauges/buccoo_reef_tobago.php'
    }
  };

  // Base URL for CRW Virtual Station ASCII data files
  const VS_BASE_URL = 'https://coralreefwatch.noaa.gov/product/vs/data/';


  // ============================================================
  // 2. STATION PROXIMITY MATCHER
  //
  //    Given a lat/lon, returns the nearest station in RIM_RUN_STATIONS.
  //    Uses Haversine distance. Returns station object + distance_km.
  // ============================================================

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * findNearestStation()
   * @param {number} lat
   * @param {number} lon
   * @param {number} maxDistKm - reject stations beyond this distance (default 300km)
   * @returns {{ station: object, distanceKm: number } | null}
   */
  function findNearestStation(lat, lon, maxDistKm = 300) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const station of Object.values(RIM_RUN_STATIONS)) {
      const dist = haversineKm(lat, lon, station.lat, station.lon);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = station;
      }
    }

    if (nearest && nearestDist <= maxDistKm) {
      return { station: nearest, distanceKm: parseFloat(nearestDist.toFixed(1)) };
    }

    return null;
  }


  // ============================================================
  // 3. ASCII DATA PARSER
  //
  //    CRW Virtual Station files are ASCII text with:
  //    - Comment/header lines beginning with '#'
  //    - Column header line (space/tab delimited)
  //    - Data rows: date + numeric columns
  //
  //    Known columns (may vary by station):
  //    Date, SST_min, SST_max, SST_mean, Anomaly, HotSpot, DHW, BAA_7day_max
  //
  //    We extract the MOST RECENT row only for GROAN's real-time use.
  //    Historical rows are preserved in the parsed output for trend access.
  // ============================================================

  /**
   * parseVSAscii()
   * Parses CRW Virtual Station ASCII text data.
   * @param {string} text - Raw ASCII response body
   * @returns {{ headers: string[], rows: Object[], latest: Object|null }}
   */
  function parseVSAscii(text) {
    const lines = text.split('\n').filter(l => l.trim() !== '');

    let headers = [];
    const rows = [];
    let headerFound = false;

    for (const line of lines) {
      // Skip comment lines
      if (line.startsWith('#') || line.startsWith('%')) continue;

      const cols = line.trim().split(/\s+/);

      if (!headerFound) {
        // Detect header row — first non-comment line that starts with a non-numeric
        if (isNaN(Number(cols[0]))) {
          headers = cols.map(h => h.trim());
          headerFound = true;
          continue;
        }
      }

      // Data row — first column is date (YYYYMMDD or YYYY-MM-DD)
      if (cols.length >= 2 && !isNaN(Number(cols[0].replace(/-/g, '')))) {
        const row = {};
        cols.forEach((val, i) => {
          const key = headers[i] || `col_${i}`;
          row[key] = isNaN(Number(val)) ? val : Number(val);
        });
        rows.push(row);
      }
    }

    const latest = rows.length > 0 ? rows[rows.length - 1] : null;
    return { headers, rows, latest };
  }

  /**
   * extractCurrentValues()
   * Maps parsed VS row to GROAN-standard field names.
   * CRW column names vary slightly by station version — this handles aliases.
   * @param {Object} row - Latest parsed row
   * @returns {Object} Standardized values
   */
  function extractCurrentValues(row) {
    if (!row) return null;

    // Column name aliases — CRW uses slightly different names across stations
    const get = (row, ...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) return row[k];
        // Case-insensitive search
        const match = Object.keys(row).find(rk => rk.toLowerCase() === k.toLowerCase());
        if (match) return row[match];
      }
      return null;
    };

    const dhw     = get(row, 'DHW', 'dhw', 'DHW_90pct');
    const baa     = get(row, 'BAA_7day_max', 'BAA_7d_max', 'BAA_7day', 'Alert_Level', 'BAA');
    const hotspot = get(row, 'HotSpot', 'Hotspot', 'hotspot', 'HS');
    const sstMean = get(row, 'SST_mean', 'SST', 'sst_mean', 'SST_Mean');
    const anomaly = get(row, 'Anomaly', 'anomaly', 'SST_Anomaly', 'SSTA');
    const date    = get(row, 'Date', 'date', 'TIME', 'time');

    return { date, sstMean, anomaly, hotspot, dhw, baa };
  }


  // ============================================================
  // 4. NORMALIZATION FUNCTIONS
  //
  //   VS_DHW_90PCT:
  //     Same piecewise rubric as Source 003 DHW — ensures CMIE
  //     can directly compare point-level vs. jurisdiction-level DHW.
  //     0 DHW = 10.0, 4 = 7.0, 8 = 4.0, 12 = 1.0, >12 = 0.0
  //     Direction: NEGATIVE (higher DHW = lower score)
  //
  //   VS_BAA_7D_MAX:
  //     Same categorical rubric as Source 003 BAA.
  //     0=10.0, 1=7.0, 2=5.0, 3=2.5, 4=0.0
  //     Direction: NEGATIVE
  // ============================================================

  function normalizeDHW(dhw) {
    if (dhw === null || dhw === undefined || isNaN(dhw)) return null;
    if (dhw <= 0)  return 10.0;
    if (dhw <= 4)  return parseFloat((10.0 - (dhw / 4) * 3.0).toFixed(2));   // 10→7
    if (dhw <= 8)  return parseFloat((7.0  - ((dhw - 4) / 4) * 3.0).toFixed(2)); // 7→4
    if (dhw <= 12) return parseFloat((4.0  - ((dhw - 8) / 4) * 3.0).toFixed(2)); // 4→1
    return 0.0;
  }

  const BAA_SCORE_MAP = { 0: 10.0, 1: 7.0, 2: 5.0, 3: 2.5, 4: 0.0 };

  function normalizeBAA(baa) {
    if (baa === null || baa === undefined || isNaN(baa)) return null;
    const k = Math.round(baa);
    return BAA_SCORE_MAP[k] !== undefined ? BAA_SCORE_MAP[k] : 0.0;
  }


  // ============================================================
  // 5. FETCH — CURRENT STATION DATA
  //
  //    Fetches ASCII file for a given station ID.
  //    Returns parsed latest row + normalized scores.
  //    Cache: 1 hour TTL (station data updates once daily).
  // ============================================================

  const _fetchCache = {};
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  async function fetchStationData(stationId) {
    const now = Date.now();
    const cached = _fetchCache[stationId];
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return cached.data;
    }

    const url = `${VS_BASE_URL}${stationId}.txt`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching VS data for station: ${stationId}`);
      }

      const text = await response.text();
      const parsed = parseVSAscii(text);
      const current = extractCurrentValues(parsed.latest);

      const result = {
        stationId,
        parsed,
        current,
        fetchedAt: new Date().toISOString(),
        error: null
      };

      _fetchCache[stationId] = { timestamp: now, data: result };
      return result;

    } catch (err) {
      console.warn(`[GROAN S007] Fetch failed for ${stationId}:`, err.message);
      const errorResult = {
        stationId,
        parsed: null,
        current: null,
        fetchedAt: new Date().toISOString(),
        error: err.message
      };
      return errorResult;
    }
  }


  // ============================================================
  // 6. PRIMARY PUBLIC METHOD — queryVS()
  //
  //    Given lat/lon, finds nearest Rim Run station, fetches
  //    current data, returns VS_DHW_90PCT and VS_BAA_7D_MAX.
  //
  //    Optional: pass stationId directly to bypass proximity match.
  // ============================================================

  /**
   * queryVS()
   * @param {number} lat
   * @param {number} lon
   * @param {Object} options
   * @param {string} [options.stationId] - Override proximity match with specific station
   * @param {number} [options.maxDistKm] - Max distance for proximity match (default 300km)
   * @returns {Promise<Object>} GROAN DTI result object
   */
  async function queryVS(lat, lon, options = {}) {
    const timestamp = new Date().toISOString();

    // Station resolution — direct ID or proximity match
    let stationMatch;
    if (options.stationId) {
      const station = RIM_RUN_STATIONS[options.stationId];
      if (!station) {
        return {
          source: 'CRW_VS', sourceId: '007', lat, lon, timestamp,
          vs_dhw_score: null, vs_baa_score: null,
          flag: `STATION_NOT_FOUND: ${options.stationId}`, confidence: 'NONE',
          station: null, components: null
        };
      }
      stationMatch = {
        station,
        distanceKm: haversineKm(lat, lon, station.lat, station.lon)
      };
    } else {
      stationMatch = findNearestStation(lat, lon, options.maxDistKm);
    }

    if (!stationMatch) {
      return {
        source: 'CRW_VS', sourceId: '007', lat, lon, timestamp,
        vs_dhw_score: null, vs_baa_score: null,
        flag: 'NO_RIM_RUN_STATION_WITHIN_RANGE', confidence: 'NONE',
        station: null, components: null
      };
    }

    const { station, distanceKm } = stationMatch;

    // Fetch station data
    const fetched = await fetchStationData(station.id);

    if (fetched.error || !fetched.current) {
      return {
        source: 'CRW_VS', sourceId: '007', lat, lon, timestamp,
        vs_dhw_score: null, vs_baa_score: null,
        flag: 'FETCH_FAILED: ' + (fetched.error || 'no current data'),
        confidence: 'NONE',
        station: { id: station.id, label: station.label, distanceKm },
        components: null
      };
    }

    const { current } = fetched;

    // Normalize
    const vs_dhw_score = normalizeDHW(current.dhw);
    const vs_baa_score = normalizeBAA(current.baa);

    // Confidence based on data completeness
    let confidence = 'HIGH';
    let flag = null;
    if (vs_dhw_score === null && vs_baa_score === null) {
      confidence = 'NONE';
      flag = 'BOTH_METRICS_MISSING';
    } else if (vs_dhw_score === null || vs_baa_score === null) {
      confidence = 'MODERATE';
      flag = vs_dhw_score === null ? 'DHW_MISSING' : 'BAA_MISSING';
    }

    // Distance warning — station >150km from query point is less representative
    if (distanceKm > 150) {
      flag = (flag ? flag + ',' : '') + `STATION_DISTANT_${Math.round(distanceKm)}KM`;
      if (confidence === 'HIGH') confidence = 'MODERATE';
    }

    return {
      source:     'CRW_VS',
      sourceId:   '007',
      lat, lon, timestamp,

      vs_dhw_score,
      vs_baa_score,

      flag,
      confidence,

      station: {
        id:          station.id,
        label:       station.label,
        country:     station.country,
        stationLat:  station.lat,
        stationLon:  station.lon,
        distanceKm,
        gaugeUrl:    station.gaugeUrl,
        dataDate:    current.date
      },

      components: {
        dhw_raw:       current.dhw,
        baa_raw:       current.baa,
        hotspot_raw:   current.hotspot,
        sst_mean_raw:  current.sstMean,
        anomaly_raw:   current.anomaly,
        vs_dhw_score,
        vs_baa_score
      }
    };
  }


  // ============================================================
  // 7. CMIE DELTA UTILITY
  //
  //    Computes the difference between jurisdiction-level VS values
  //    (Source 007) and point-level gridded values (Source 003).
  //    Used by CMIE to classify whether local stress is isolated or systemic.
  //
  //    DELTA_DHW > +2: point is anomalously hot vs. jurisdiction
  //    DELTA_DHW < -2: jurisdiction is hotter than this specific point
  //    |DELTA_DHW| ≤ 2: point is representative of jurisdiction
  // ============================================================

  /**
   * computeVSDelta()
   * @param {number} pointDHW - DHW from Source 003 (point-level)
   * @param {number} vsDHW    - DHW from Source 007 (jurisdiction 90th pct)
   * @param {number} pointBAA - BAA from Source 003
   * @param {number} vsBAA    - BAA from Source 007
   * @returns {Object} Delta values + CMIE context classification
   */
  function computeVSDelta(pointDHW, vsDHW, pointBAA, vsBAA) {
    const deltaDHW = (pointDHW !== null && vsDHW !== null)
      ? parseFloat((pointDHW - vsDHW).toFixed(2))
      : null;

    const deltaBAA = (pointBAA !== null && vsBAA !== null)
      ? parseFloat((pointBAA - vsBAA).toFixed(2))
      : null;

    let cmieContext = 'UNKNOWN';
    if (deltaDHW !== null) {
      if (deltaDHW > 2)       cmieContext = 'POINT_ANOMALOUSLY_HOT';
      else if (deltaDHW < -2) cmieContext = 'SYSTEMIC_JURISDICTION_STRESS';
      else                    cmieContext = 'POINT_REPRESENTATIVE_OF_JURISDICTION';
    }

    return { deltaDHW, deltaBAA, cmieContext };
  }


  // ============================================================
  // 8. WINDOW.GROAN REGISTRATION
  // ============================================================

  window.GROAN = window.GROAN || {};
  window.GROAN.sources = window.GROAN.sources || {};

  window.GROAN.sources.CRW_VS = {
    id:         '007',
    name:       'NOAA CRW Regional Virtual Stations',
    shortName:  'CRW_VS',
    version:    'v3.1',
    dtis:       ['VS_DHW_90PCT', 'VS_BAA_7D_MAX'],
    direction:  'NEGATIVE',
    units:      '0–10 scale (inverted: higher score = less stress)',
    coverage:   'Rim Run Caribbean theater + ABC Islands + Colombia',
    stationCount: Object.keys(RIM_RUN_STATIONS).length,
    vintage:    'Daily NRT (1985–present time series)',
    accessMode: 'PUBLIC_ASCII_NO_AUTH',
    baseUrl:    VS_BASE_URL,

    // Public methods
    query:          queryVS,
    findNearest:    findNearestStation,
    fetchStation:   fetchStationData,
    computeDelta:   computeVSDelta,
    normalizeDHW,
    normalizeBAA,

    // Station registry
    stations: RIM_RUN_STATIONS,

    // Normalization rubrics
    dhwNormalization: {
      description: 'Piecewise linear — same rubric as Source 003 DHW for direct CMIE comparison',
      breakpoints: { 0: 10.0, 4: 7.0, 8: 4.0, 12: 1.0, '>12': 0.0 }
    },
    baaNormalization: {
      description: 'Categorical — same rubric as Source 003 BAA',
      map: BAA_SCORE_MAP
    },

    // CMIE integration note
    cmieRole: {
      description: 'Source 007 provides jurisdiction-level thermal stress context. ' +
                   'CMIE uses computeVSDelta() to classify whether a local thermal observation ' +
                   'is site-isolated or representative of systemic reef stress across the jurisdiction.',
      deltaThreshold: 2.0,
      flags: {
        'POINT_ANOMALOUSLY_HOT':              'Local DHW > jurisdiction DHW by >2°C-wk — isolated hot spot',
        'SYSTEMIC_JURISDICTION_STRESS':       'Jurisdiction DHW > local DHW by >2°C-wk — systemic stress event',
        'POINT_REPRESENTATIVE_OF_JURISDICTION': 'Local and jurisdiction DHW within ±2°C-wk — representative'
      }
    },

    citation: 'NOAA Coral Reef Watch. 2018, updated daily. NOAA CRW Version 3.1 Daily Global 5-km Satellite Coral Bleaching Heat Stress Monitoring. https://coralreefwatch.noaa.gov/product/5km/'
  };

  console.log('[GROAN S007] crw-virtual-stations.js loaded →',
    `window.GROAN.sources.CRW_VS (${Object.keys(RIM_RUN_STATIONS).length} Rim Run stations)`);

})();
