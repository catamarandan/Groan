/**
 * GROAN Data Registry — Source 011: HRI / AGRRA
 * Module: hri-agrra.js  →  /js/hri-agrra.js
 *
 * Data products:
 *   (A) Healthy Reefs Initiative (HRI) — Mesoamerican Reef Health Report Cards
 *       Publisher:  Smithsonian Institution / Healthy Reefs for Healthy People (HRHP)
 *       Coverage:   Mexico, Belize, Guatemala, Honduras (MAR system)
 *       Frequency:  Biennial (survey year + 1 year lag for publication)
 *       Latest:     2024 Report Card (2023 survey data)
 *
 *   (B) Atlantic and Gulf Rapid Reef Assessment (AGRRA)
 *       Publisher:  AGRRA / Dr. Robert Ginsburg Ocean Research Foundation
 *       Coverage:   29 Caribbean countries, >2,000 reef areas, 1997–present
 *       Access:     Open-access database (agrra.org/data-explorer/)
 *
 * Access architecture:
 *   No REST API available. Both datasets are accessed via:
 *   (A) HRI: Published PDF report cards (biennial) + downloadable data
 *   (B) AGRRA: Web portal, downloadable spreadsheets/GIS shapefiles
 *   This module uses HARDCODED published values with clear version stamps.
 *   Update this file when a new HRI Report Card is released (~every 2 years).
 *
 * DTIs produced:
 *   RHI_SCORE      — Reef Health Index normalized 0–10 (POSITIVE)
 *   AGRRA_DELTA_CORAL    — Field coral cover vs. regional benchmark (delta %)
 *   AGRRA_DELTA_ALGAE    — Field algae cover vs. regional benchmark (delta %)
 *   AGRRA_DELTA_HERBIVORE — Field herbivore biomass vs. benchmark (delta kg/ha)
 *
 * GROAN role:
 *   Source 011 is GROAN's primary validation reference for the Caribbean theater.
 *   RHI_SCORE provides the published scientific consensus on reef health by country.
 *   AGRRA_DELTA_* DTIs compare GROAN field observations (GRIN module) against
 *   published regional benchmarks — flagging whether a site is above or below
 *   the regional average for that country/period.
 *
 *   CMIE integration:
 *     DELTA_CORAL < -10% AND RHI_SCORE < 4.0 → flag: BELOW_REGIONAL_CORAL_AVERAGE
 *     DELTA_HERBIVORE < -50% AND FPI < 5.0   → flag: HERBIVORE_COLLAPSE_CONFIRMED
 *
 * Architecture:  Browser-side window.GROAN globals — no Node.js, no fetch required.
 *
 * Data version:  HRI 2024 Report Card (McField et al., 2024)
 *   Next update:  ~2026 (next biennial report card)
 *   TODO_UPDATE:  When 2026 HRI Report Card releases, update HRI_REPORT_CARDS
 *                 and MAR_BENCHMARKS below with new published values.
 *
 * Citations:
 *   McField M., et al. (2024). 2024 Report Card for the Mesoamerican Reef.
 *   Healthy Reefs for Healthy People Initiative, Smithsonian Institution.
 *   https://www.healthyreefs.org/en/healthy-reefs-data/report-cards
 *
 *   Lang J.C., et al. (2010). AGRRA Protocols Version 5.4.
 *   Atlantic and Gulf Rapid Reef Assessment Program.
 *   https://www.agrra.org/method/
 */

(function () {
  'use strict';

  // ============================================================
  // 1. HRI REPORT CARD TIME SERIES — MAR REGIONAL
  //
  //    RHI scale: 1–5
  //      1 = Critical  (< 1.5)
  //      2 = Poor      (1.5–2.5)
  //      3 = Fair      (2.5–3.5)
  //      4 = Good      (3.5–4.5)
  //      5 = Very Good (> 4.5)
  //
  //    Note: Boundary between Poor and Fair is 2.5.
  //    Belize 2024 at 2.5 is at the threshold — classified Poor by HRI.
  //
  //    Data source: HRI Report Cards 2006–2024 (McField et al.)
  // ============================================================

  const HRI_REPORT_CARDS = {
    // MAR regional composite
    MAR_REGIONAL: {
      2006: { rhi: 2.3, grade: 'Poor',  surveyYear: 2005 },
      2008: { rhi: 2.4, grade: 'Poor',  surveyYear: 2007 },
      2010: { rhi: 2.5, grade: 'Poor',  surveyYear: 2009 },
      2012: { rhi: 2.6, grade: 'Poor',  surveyYear: 2011 },
      2014: { rhi: 2.7, grade: 'Fair',  surveyYear: 2013 },
      2016: { rhi: 2.8, grade: 'Fair',  surveyYear: 2015 },
      2018: { rhi: 2.8, grade: 'Fair',  surveyYear: 2017 },
      2020: { rhi: 2.5, grade: 'Poor',  surveyYear: 2019 },
      2022: { rhi: 2.3, grade: 'Poor',  surveyYear: 2021 },
      2024: { rhi: 2.5, grade: 'Poor',  surveyYear: 2023, note: 'First improvement in 5 years — driven by fish biomass gains' }
    },
    // Country-level RHI (2024 Report Card)
    MEXICO: {
      2006: { rhi: 2.5, grade: 'Poor'  },
      2010: { rhi: 2.7, grade: 'Fair'  },
      2014: { rhi: 2.9, grade: 'Fair'  },
      2018: { rhi: 2.8, grade: 'Fair'  },
      2020: { rhi: 2.5, grade: 'Poor'  },
      2022: { rhi: 2.4, grade: 'Poor'  },
      2024: { rhi: 2.5, grade: 'Poor',  note: 'Cozumel remains only Very Good site regionally (fully protected 30+ yr)' }
    },
    BELIZE: {
      2006: { rhi: 2.4, grade: 'Poor'  },
      2010: { rhi: 2.6, grade: 'Poor'  },
      2014: { rhi: 2.8, grade: 'Fair'  },
      2018: { rhi: 2.9, grade: 'Fair'  },
      2020: { rhi: 2.7, grade: 'Fair'  },
      2022: { rhi: 2.4, grade: 'Poor'  },
      2024: { rhi: 2.5, grade: 'Poor',  note: 'Trending up; parrotfish protection since 2009 showing multi-year herbivore recovery' }
    },
    GUATEMALA: {
      2006: { rhi: 2.0, grade: 'Poor'  },
      2010: { rhi: 2.1, grade: 'Poor'  },
      2014: { rhi: 2.2, grade: 'Poor'  },
      2018: { rhi: 2.0, grade: 'Poor'  },
      2020: { rhi: 1.9, grade: 'Poor'  },
      2022: { rhi: 1.8, grade: 'Poor'  },
      2024: { rhi: 2.3, grade: 'Poor',  note: 'Largest single-report improvement; Cayman Crown full protection 2020 showing results' }
    },
    HONDURAS: {
      2006: { rhi: 2.3, grade: 'Poor'  },
      2010: { rhi: 2.5, grade: 'Poor'  },
      2014: { rhi: 2.6, grade: 'Fair'  },
      2018: { rhi: 2.7, grade: 'Fair'  },
      2020: { rhi: 2.3, grade: 'Poor'  },
      2022: { rhi: 2.2, grade: 'Poor'  },
      2024: { rhi: 2.4, grade: 'Poor',
        note: 'Bay Islands improved (MPA enforcement); coastal Honduras declined. Swan Islands and Miskito Cays highly vulnerable.' }
    }
  };

  // Latest report card year
  const LATEST_REPORT_YEAR = 2024;

  // ============================================================
  // 2. AGRRA REGIONAL BENCHMARKS — 2024 REPORT CARD
  //
  //    Four primary AGRRA indicators by country (2024 survey data).
  //    Values represent regional means across all monitored sites.
  //    Used by CMIE to contextualize GRIN field observations.
  //
  //    Units:
  //      coralCover_pct:    live coral cover (%)
  //      algaeCover_pct:    fleshy macroalgae cover (%)
  //      herbivoreBiomass:  herbivorous fish biomass (kg/ha) — parrotfish + surgeonfish
  //      commercialBiomass: commercial fish biomass (kg/ha) — snapper + grouper
  //
  //    Data source: HRI 2024 Report Card + AGRRA database (McField et al., 2024)
  //    Note: Sub-regional variation within countries is significant.
  //    These are country-wide means; site-level variation can be 2–5× higher/lower.
  // ============================================================

  const MAR_BENCHMARKS = {
    MAR_REGIONAL: {
      year: 2024,
      coralCover_pct:    14.5,   // ~15% regional mean — well below historical ~30%
      algaeCover_pct:    18.0,   // Macroalgae dominant in many sites
      herbivoreBiomass:  96.0,   // kg/ha — recovering but below 200 kg/ha management target
      commercialBiomass:  2.1,   // kg/ha — critically depleted; "nearly empty court"
      sites_n:            286
    },
    MEXICO: {
      year: 2024,
      coralCover_pct:    13.5,
      algaeCover_pct:    20.5,  // Dense algal turf mats in some zones
      herbivoreBiomass:  88.0,
      commercialBiomass:  2.3,
      sites_n:            80,
      note: 'Cozumel (fully protected) outlier: commercial biomass 5× regional average'
    },
    BELIZE: {
      year: 2024,
      coralCover_pct:    17.0,
      algaeCover_pct:    16.0,  // Declining macroalgae trend — parrotfish effect
      herbivoreBiomass: 115.0,  // Highest in MAR — parrotfish protection impact
      commercialBiomass:  2.4,
      sites_n:           110,
      note: 'Parrotfish protection since 2009; best herbivore recovery in MAR'
    },
    GUATEMALA: {
      year: 2024,
      coralCover_pct:    18.0,  // Good coral cover — best in MAR
      algaeCover_pct:    15.5,  // Improving
      herbivoreBiomass:  90.0,  // Improving
      commercialBiomass:  1.2,  // Critical — lowest in MAR
      sites_n:            40,
      note: 'Good coral but critically depleted commercial fish; Punta Manabique highly degraded'
    },
    HONDURAS: {
      year: 2024,
      coralCover_pct:    12.5,
      algaeCover_pct:    19.0,
      herbivoreBiomass:  92.0,   // Bay Islands: higher. Coastal: lower.
      commercialBiomass:  2.5,
      sites_n:            56,
      note: 'High within-country variation. Bay Islands (MPA) vs. coastal Honduras strongly divergent.'
    }
  };

  // Sub-regional benchmarks for key Rim Run waypoints
  // Where HRI provides sub-regional data
  const SUBREGION_BENCHMARKS = {
    // Mexico
    COZUMEL: {
      country: 'Mexico', year: 2024,
      coralCover_pct:    35.0,   // Best site in MAR — fully protected 30+ years
      herbivoreBiomass: 180.0,
      commercialBiomass: 12.0,   // ~5× regional average
      mpaStatus: 'FULLY_PROTECTED'
    },
    BANCO_CHINCHORRO: {
      country: 'Mexico', year: 2024,
      coralCover_pct:    22.0,   // Biosphere Reserve — above national average
      herbivoreBiomass: 120.0,
      commercialBiomass:  4.5,
      mpaStatus: 'BIOSPHERE_RESERVE'
    },
    // Honduras
    BAY_ISLANDS: {
      country: 'Honduras', year: 2024,
      coralCover_pct:    15.0,
      herbivoreBiomass: 130.0,   // MPA enforcement showing; except Guanaja
      commercialBiomass:  3.2,
      mpaStatus: 'MIXED_PROTECTION',
      note: 'Roatan and Utila improved. Guanaja: herbivore biomass dipped.'
    },
    SWAN_ISLANDS: {
      country: 'Honduras', year: 2024,
      coralCover_pct:    28.0,   // Remote, pristine-adjacent
      herbivoreBiomass: 150.0,
      commercialBiomass:  5.0,
      mpaStatus: 'WILDLIFE_RESERVE',
      note: 'Highly vulnerable — listed as priority conservation area in 2024 report'
    },
    // Guatemala
    CAYMAN_CROWN: {
      country: 'Guatemala', year: 2024,
      coralCover_pct:    30.0,   // First fully protected area in Guatemala (2020)
      herbivoreBiomass: 145.0,
      commercialBiomass:  3.8,
      mpaStatus: 'FULLY_PROTECTED',
      note: 'First full protection in Guatemala; recovery trajectory being monitored'
    }
  };


  // ============================================================
  // 3. MAR GEOGRAPHIC LOOKUP
  //
  //    Given lat/lon, determine which MAR country the point falls in.
  //    Bounding boxes are approximate — sufficient for country-level
  //    benchmark assignment. Points outside MAR = null (no HRI data).
  //
  //    MAR extent: ~14°N–22°N, 83°W–90°W
  // ============================================================

  const MAR_COUNTRY_BOUNDS = {
    MEXICO: {
      // Caribbean coast of Yucatan Peninsula
      latMin: 18.0, latMax: 22.0,
      lonMin: -90.0, lonMax: -86.5,
      benchmarkKey: 'MEXICO'
    },
    BELIZE: {
      latMin: 15.8, latMax: 18.5,
      lonMin: -89.0, lonMax: -87.0,
      benchmarkKey: 'BELIZE'
    },
    GUATEMALA: {
      // Caribbean coast only (Atlantic Guatemala is narrow)
      latMin: 15.5, latMax: 16.0,
      lonMin: -89.5, lonMax: -88.0,
      benchmarkKey: 'GUATEMALA'
    },
    HONDURAS: {
      // Caribbean coast including Bay Islands
      latMin: 14.5, latMax: 17.5,
      lonMin: -88.5, lonMax: -83.0,
      benchmarkKey: 'HONDURAS'
    }
  };

  /**
   * findMARCountry()
   * Returns MAR country key for a lat/lon, or null if outside MAR.
   */
  function findMARCountry(lat, lon) {
    for (const [country, bounds] of Object.entries(MAR_COUNTRY_BOUNDS)) {
      if (lat >= bounds.latMin && lat <= bounds.latMax &&
          lon >= bounds.lonMin && lon <= bounds.lonMax) {
        return country;
      }
    }
    return null;
  }

  /**
   * findNearestSubregion()
   * Returns the closest named subregion for a lat/lon (within 80km).
   */
  const SUBREGION_CENTROIDS = {
    COZUMEL:       { lat: 20.4, lon: -86.9 },
    BANCO_CHINCHORRO: { lat: 18.6, lon: -87.3 },
    BAY_ISLANDS:   { lat: 16.3, lon: -86.5 },
    SWAN_ISLANDS:  { lat: 17.4, lon: -83.9 },
    CAYMAN_CROWN:  { lat: 15.8, lon: -89.0 }
  };

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function findNearestSubregion(lat, lon) {
    let nearest = null, nearestDist = Infinity;
    for (const [key, centroid] of Object.entries(SUBREGION_CENTROIDS)) {
      const d = haversineKm(lat, lon, centroid.lat, centroid.lon);
      if (d < nearestDist) { nearestDist = d; nearest = key; }
    }
    return nearestDist <= 80 ? { key: nearest, distKm: nearestDist } : null;
  }


  // ============================================================
  // 4. RHI NORMALIZATION
  //
  //    RHI (1–5) → GROAN score (0–10)
  //    Formula: GROAN_RHI = (RHI − 1) / 4 × 10
  //
  //    RHI 1.0 (Critical)  → 0.0
  //    RHI 2.0 (Poor)      → 2.5
  //    RHI 2.5 (Poor/Fair) → 3.75
  //    RHI 3.0 (Fair)      → 5.0
  //    RHI 4.0 (Good)      → 7.5
  //    RHI 5.0 (Very Good) → 10.0
  //
  //    Direction: POSITIVE (higher RHI = better reef health = higher score)
  // ============================================================

  function normalizeRHI(rhi) {
    if (rhi === null || rhi === undefined) return null;
    return parseFloat(Math.max(0, Math.min(10, (rhi - 1) / 4 * 10)).toFixed(2));
  }

  function classifyRHI(rhi) {
    if (rhi === null) return 'UNKNOWN';
    if (rhi < 1.5) return 'CRITICAL';
    if (rhi < 2.5) return 'POOR';
    if (rhi < 3.5) return 'FAIR';
    if (rhi < 4.5) return 'GOOD';
    return 'VERY_GOOD';
  }


  // ============================================================
  // 5. BENCHMARK DELTA COMPUTATION
  //
  //    Compares GRIN field observations against published regional
  //    benchmarks. Returns signed deltas and CMIE flags.
  //
  //    DELTA = observed − benchmark
  //    Positive delta = above average (good for coral/herbivore; bad for algae)
  //    Negative delta = below average
  // ============================================================

  /**
   * computeAGRRADeltas()
   * @param {Object} grinnObs - Field observations from GRIN module
   *   grinnObs.coralCover_pct
   *   grinnObs.algaeCover_pct
   *   grinnObs.herbivoreBiomass_kgha
   *   grinnObs.commercialBiomass_kgha (optional)
   * @param {Object} benchmark - Country/subregion benchmark from MAR_BENCHMARKS
   * @returns {Object} Delta values + CMIE flags
   */
  function computeAGRRADeltas(grinnObs, benchmark) {
    const deltas = {};
    const flags  = [];

    if (grinnObs.coralCover_pct !== null && benchmark.coralCover_pct !== null) {
      deltas.deltaCoralCover = parseFloat(
        (grinnObs.coralCover_pct - benchmark.coralCover_pct).toFixed(1)
      );
      if (deltas.deltaCoralCover < -10) flags.push('BELOW_REGIONAL_CORAL_AVERAGE');
      if (deltas.deltaCoralCover >  15) flags.push('ABOVE_REGIONAL_CORAL_AVERAGE');
    }

    if (grinnObs.algaeCover_pct !== null && benchmark.algaeCover_pct !== null) {
      deltas.deltaAlgaeCover = parseFloat(
        (grinnObs.algaeCover_pct - benchmark.algaeCover_pct).toFixed(1)
      );
      if (deltas.deltaAlgaeCover > 10) flags.push('MACROALGAE_ABOVE_REGIONAL_AVERAGE');
    }

    if (grinnObs.herbivoreBiomass_kgha !== null && benchmark.herbivoreBiomass !== null) {
      deltas.deltaHerbivoreBiomass = parseFloat(
        (grinnObs.herbivoreBiomass_kgha - benchmark.herbivoreBiomass).toFixed(1)
      );
      const pctDelta = (deltas.deltaHerbivoreBiomass / benchmark.herbivoreBiomass) * 100;
      if (pctDelta < -50) flags.push('HERBIVORE_BIOMASS_CRITICALLY_LOW');
      if (pctDelta >  50) flags.push('HERBIVORE_BIOMASS_ABOVE_AVERAGE');
    }

    if (grinnObs.commercialBiomass_kgha !== null && benchmark.commercialBiomass !== null) {
      deltas.deltaCommercialBiomass = parseFloat(
        (grinnObs.commercialBiomass_kgha - benchmark.commercialBiomass).toFixed(2)
      );
      if (grinnObs.commercialBiomass_kgha < 1.0) flags.push('COMMERCIAL_FISH_CRITICAL');
    }

    return { deltas, cmieFlags: flags.length ? flags.join(',') : null };
  }


  // ============================================================
  // 6. PRIMARY PUBLIC METHOD — queryHRI()
  //
  //    Synchronous — no fetch required (static dataset).
  //    Returns RHI score, benchmarks, and trend for a lat/lon.
  // ============================================================

  /**
   * queryHRI()
   * @param {number} lat
   * @param {number} lon
   * @param {Object} [options]
   * @param {Object} [options.grinnObs] - GRIN field observations for delta computation
   * @param {number} [options.reportYear] - Specific report year (default: latest)
   * @returns {Object} GROAN DTI result object
   */
  function queryHRI(lat, lon, options = {}) {
    const timestamp  = new Date().toISOString();
    const reportYear = options.reportYear || LATEST_REPORT_YEAR;

    // MAR country lookup
    const marCountry = findMARCountry(lat, lon);
    const subregion  = findNearestSubregion(lat, lon);

    if (!marCountry) {
      return {
        source:    'HRI_AGRRA',
        sourceId:  '011',
        dti:       'RHI_SCORE',
        lat, lon, timestamp,
        rhi_score: null,
        rhi_raw:   null,
        grade:     null,
        flag:      'OUTSIDE_MAR_COVERAGE',
        confidence:'NONE',
        note:      'HRI Report Cards cover MAR only: Mexico, Belize, Guatemala, Honduras. ' +
                   'For other Caribbean sites, use AGRRA Data Explorer: agrra.org/data-explorer/',
        benchmark: null,
        deltas:    null,
        trend:     null
      };
    }

    // Pull RHI for country + year
    const countryData = HRI_REPORT_CARDS[marCountry];
    const rhiEntry    = countryData[reportYear] || countryData[LATEST_REPORT_YEAR];
    const rhi         = rhiEntry ? rhiEntry.rhi : null;

    // Pull benchmarks
    const benchmark    = MAR_BENCHMARKS[marCountry];
    const subbenchmark = subregion ? SUBREGION_BENCHMARKS[subregion.key] : null;

    // Compute deltas if GRIN observations provided
    let deltaResult = null;
    if (options.grinnObs) {
      const refBenchmark = subbenchmark || benchmark;
      deltaResult = computeAGRRADeltas(options.grinnObs, refBenchmark);
    }

    // Compute trend (last 3 report cards)
    const years = Object.keys(countryData).map(Number).sort((a,b) => b-a);
    const recent = years.slice(0, 3).map(y => ({ year: y, rhi: countryData[y].rhi }));
    let trend = 'INSUFFICIENT_DATA';
    if (recent.length >= 2) {
      const delta = recent[0].rhi - recent[recent.length-1].rhi;
      if (delta > 0.2)       trend = 'IMPROVING';
      else if (delta < -0.2) trend = 'DECLINING';
      else                   trend = 'STABLE';
    }

    return {
      source:     'HRI_AGRRA',
      sourceId:   '011',
      dti:        'RHI_SCORE',
      lat, lon, timestamp,

      rhi_score:  normalizeRHI(rhi),
      rhi_raw:    rhi,
      grade:      rhiEntry ? rhiEntry.grade : null,
      flag:       null,
      confidence: 'HIGH',   // Published peer-reviewed data

      location: {
        marCountry,
        reportYear,
        subregion:    subregion ? subregion.key : null,
        subregionDistKm: subregion ? subregion.distKm : null,
        reportNote:   rhiEntry ? (rhiEntry.note || null) : null
      },

      benchmark: {
        source:    subbenchmark ? 'SUBREGION' : 'COUNTRY',
        key:       subbenchmark ? subregion.key : marCountry,
        year:      benchmark.year,
        coralCover_pct:    (subbenchmark || benchmark).coralCover_pct,
        algaeCover_pct:    benchmark.algaeCover_pct,
        herbivoreBiomass:  (subbenchmark || benchmark).herbivoreBiomass,
        commercialBiomass: (subbenchmark || benchmark).commercialBiomass,
        mpaStatus:         subbenchmark ? subbenchmark.mpaStatus : null
      },

      trend: {
        direction: trend,
        recentReportCards: recent
      },

      deltas:     deltaResult ? deltaResult.deltas    : null,
      cmieFlags:  deltaResult ? deltaResult.cmieFlags : null
    };
  }


  // ============================================================
  // 7. HISTORICAL TREND UTILITY
  //
  //    Returns full time series for a MAR country.
  //    Used for CMIE trajectory analysis and GROAN dashboard charts.
  // ============================================================

  function getHistoricalRHI(countryKey) {
    const data = HRI_REPORT_CARDS[countryKey];
    if (!data) return null;
    return Object.entries(data)
      .map(([year, entry]) => ({
        year:      parseInt(year),
        rhi_raw:   entry.rhi,
        rhi_score: normalizeRHI(entry.rhi),
        grade:     entry.grade,
        note:      entry.note || null
      }))
      .sort((a, b) => a.year - b.year);
  }


  // ============================================================
  // 8. WINDOW.GROAN REGISTRATION
  // ============================================================

  window.GROAN = window.GROAN || {};
  window.GROAN.sources = window.GROAN.sources || {};

  window.GROAN.sources.HRI_AGRRA = {
    id:         '011',
    name:       'Healthy Reefs Initiative / AGRRA',
    shortName:  'HRI_AGRRA',
    version:    'HRI 2024 Report Card (McField et al., 2024)',
    dtis:       ['RHI_SCORE', 'AGRRA_DELTA_CORAL', 'AGRRA_DELTA_ALGAE', 'AGRRA_DELTA_HERBIVORE'],
    direction:  'POSITIVE',
    units:      'RHI_SCORE: 0–10 (normalized from 1–5 RHI scale)',
    coverage:   'MAR: Mexico, Belize, Guatemala, Honduras (4 countries, ~300 sites, ~1,000 km)',
    accessMode: 'STATIC_HARDCODED (biennial update)',
    latestReport: LATEST_REPORT_YEAR,
    nextExpectedReport: 2026,

    // Public methods
    query:              queryHRI,
    normalizeRHI,
    classifyRHI,
    computeAGRRADeltas,
    getHistoricalRHI,
    findMARCountry,

    // Exposed data tables
    reportCards:        HRI_REPORT_CARDS,
    benchmarks:         MAR_BENCHMARKS,
    subregionBenchmarks: SUBREGION_BENCHMARKS,

    normalization: {
      method:  'LINEAR_RESCALE',
      formula: 'GROAN_RHI = (RHI_raw − 1) / 4 × 10',
      gradeMap: {
        CRITICAL:   { rhiRange: [1.0, 1.5], groanRange: [0.0, 1.25] },
        POOR:       { rhiRange: [1.5, 2.5], groanRange: [1.25, 3.75] },
        FAIR:       { rhiRange: [2.5, 3.5], groanRange: [3.75, 6.25] },
        GOOD:       { rhiRange: [3.5, 4.5], groanRange: [6.25, 8.75] },
        VERY_GOOD:  { rhiRange: [4.5, 5.0], groanRange: [8.75, 10.0] }
      }
    },

    groanRole: {
      primary:   'Caribbean theater validation reference — compares GROAN DS output against published HRI RHI',
      secondary: 'AGRRA benchmark comparison — flags GRIN field observations above/below country average',
      cmieFlags: [
        'BELOW_REGIONAL_CORAL_AVERAGE',
        'ABOVE_REGIONAL_CORAL_AVERAGE',
        'MACROALGAE_ABOVE_REGIONAL_AVERAGE',
        'HERBIVORE_BIOMASS_CRITICALLY_LOW',
        'HERBIVORE_BIOMASS_ABOVE_AVERAGE',
        'COMMERCIAL_FISH_CRITICAL'
      ]
    },

    updateProtocol: {
      trigger:     'New HRI Report Card release (~every 2 years)',
      nextExpected: 'Late 2026 (covering 2025 survey data)',
      updateTarget: 'HRI_REPORT_CARDS + MAR_BENCHMARKS in this file',
      dataSource:  'https://www.healthyreefs.org/en/healthy-reefs-data/report-cards',
      todo:        'TODO_UPDATE — refresh hardcoded values when 2026 Report Card publishes'
    },

    citations: {
      hri2024: 'McField M., et al. (2024). 2024 Report Card for the Mesoamerican Reef. Healthy Reefs for Healthy People Initiative / Smithsonian Institution. https://www.healthyreefs.org',
      agrra:   'Lang J.C., et al. (2010). AGRRA Protocols Version 5.4. Atlantic and Gulf Rapid Reef Assessment Program. https://www.agrra.org/method/'
    }
  };

  console.log('[GROAN S011] hri-agrra.js loaded → window.GROAN.sources.HRI_AGRRA');
  console.log('[GROAN S011] HRI 2024 Report Card data loaded. MAR countries:', Object.keys(MAR_COUNTRY_BOUNDS).join(', '));
  console.log('[GROAN S011] Next update: ~2026 Report Card. See TODO_UPDATE in file header.');

})();
