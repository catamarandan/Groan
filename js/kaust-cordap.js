/**
 * GROAN Data Registry — Source 010: KAUST / CORDAP
 * Module: kaust-cordap.js  →  /js/kaust-cordap.js
 *
 * Data products:
 *   (A) KAUST Red Sea Research Center (RSRC) — Red Sea reef monitoring benchmarks
 *       Publisher:  King Abdullah University of Science and Technology (KAUST)
 *       Coverage:   Central Red Sea reef system, Thuwal area (22°N, 39°E)
 *       Data type:  Published peer-reviewed survey data (not a live API)
 *       Key refs:   Gonzalez et al. (2024) Sci. Reports; Berumen et al. (2013);
 *                   Roder et al. (2013 PLOS ONE)
 *
 *   (B) G20 CORDAP — Coral Research & Development Accelerator Platform
 *       Publisher:  G20 / KAUST (host institution)
 *       Role:       R&D funding accelerator, open-source technology platform
 *       Data type:  Awarded project outputs (variable; no central data API)
 *       Relevance:  Decision Support System ($1.5M call, 2026) — GROAN alignment
 *
 * Access architecture:
 *   NO PUBLIC REST API for either KAUST or CORDAP reef data.
 *   KAUST data is published via peer-reviewed journals (open access).
 *   This module uses HARDCODED published benchmark values.
 *
 *   LIVE DATA STUB: A partnership integration socket is provided for when
 *   a data-sharing agreement with Dr. Haiwei Luo (KAUST/CORDAP) is established.
 *   Activate by setting window.GROAN.config.KAUST_API_ENDPOINT and
 *   window.GROAN.config.KAUST_API_KEY.
 *   Contact: Dr. Haiwei Luo — CORDAP; KAUST Red Sea Research Center
 *
 * DTIs produced:
 *   RED_SEA_RHI      — Red Sea Reef Health Index (0–10, POSITIVE)
 *                      Composite from published KAUST benthic + fish data
 *   RED_SEA_THERMAL_TOLERANCE_FLAG — Red Sea MMM adjustment flag (categorical)
 *                      Red Sea corals have elevated bleaching thresholds vs. global.
 *                      This flag adjusts DHW normalization for Red Sea theater queries.
 *
 * GROAN role:
 *   Source 010 is the Red Sea proof-of-concept theater anchor (GSIN).
 *   Provides the site-specific MMM offset, benthic benchmarks, and thermal
 *   tolerance parameters that make GROAN's Caribbean DHW/SST normalizations
 *   valid in the Red Sea context.
 *
 *   Critical CMIE integration:
 *     Red Sea corals tolerate SSTs 1–2°C higher than global MMM baselines.
 *     Without this adjustment, Source 001/003 DHW/BAA scores would systematically
 *     underestimate Red Sea reef health (false alarm). RED_SEA_THERMAL_TOLERANCE_FLAG
 *     triggers a CMIE recalibration of DHW_DEGREE_HEATING_WEEKS for Red Sea sites.
 *
 * Architecture:  Browser-side window.GROAN globals — no Node.js
 * No fetch dependencies until live KAUST endpoint is activated.
 *
 * Data version:  KAUST/RSRC published literature through 2024
 *   Primary ref:  Gonzalez et al. (2024). Sci. Rep. — post-bleaching benthic recovery
 *   TODO_LIVE:    Activate live data stub when KAUST partnership confirmed.
 *                 Contact: Dr. Haiwei Luo (CORDAP / KAUST RSRC)
 *
 * Citations:
 *   Gonzalez K., et al. (2024). Differential spatio-temporal responses of Red Sea
 *   coral reef benthic communities to a mass bleaching event. Scientific Reports.
 *   DOI: 10.1038/s41598-024-74956-7
 *
 *   Berumen M.L., et al. (2013). Spatial variation in coral reef fish and benthic
 *   communities in the central Saudi Arabian Red Sea. PeerJ, 1, e107.
 *   DOI: 10.7717/peerj.107
 *
 *   Roder C., et al. (2013). First biological measurements of deep-sea corals from
 *   the Red Sea. Scientific Reports, 3, 2802. DOI: 10.1038/srep02802
 *
 *   CORDAP (2020–2026). G20 Coral Research & Development Accelerator Platform.
 *   https://cordap.org
 */

(function () {
  'use strict';

  // ============================================================
  // 1. RED SEA THERMAL PARAMETERS
  //
  //    Red Sea corals are thermally exceptional — they experience
  //    some of the world's warmest reef temperatures yet persist.
  //    This has two critical implications for GROAN:
  //
  //    (A) MMM (Maximum Monthly Mean) baseline is higher than global average
  //        Central Red Sea MMM: ~30.5–31.5°C (vs. Caribbean ~28–29°C)
  //        Bleaching threshold: MMM + 1°C = ~31.5–32.5°C
  //
  //    (B) DHW accumulation above this higher threshold — not the global
  //        NOAA CRW threshold — is the correct bleaching predictor.
  //        NOAA CRW global MMM grid may underestimate Red Sea MMM by 0.5–1.5°C,
  //        causing false DHW accumulation in GROAN if uncorrected.
  //
  //    Source: Hughes et al. (2017); Osman et al. (2018);
  //            Cantin et al. (2010); Palacio-Castro et al. (2023)
  // ============================================================

  const RED_SEA_THERMAL_PARAMS = {
    // Central Red Sea (Thuwal area, 22°N) — primary KAUST monitoring zone
    CENTRAL_RED_SEA: {
      lat_center:        22.0,
      lon_center:        39.0,
      mmm_c:             30.8,     // Maximum Monthly Mean SST (°C)
      bleaching_threshold_c: 31.8, // MMM + 1°C
      mmm_offset_vs_noaa: 0.8,     // How much higher than NOAA CRW MMM grid (approx.)
      dhw_adjustment:    'APPLY_LOCAL_MMM',
      thermal_tolerance: 'ELEVATED',
      notes: 'Central Red Sea corals tolerate ~1-2°C above global equivalents. ' +
             'NOAA CRW DHW may overestimate stress by using global MMM baseline.'
    },
    // Northern Red Sea (Gulf of Aqaba) — extreme thermal tolerance
    NORTHERN_RED_SEA: {
      lat_center:        28.5,
      lon_center:        34.5,
      mmm_c:             28.0,
      bleaching_threshold_c: 29.0,
      mmm_offset_vs_noaa: 0.3,
      dhw_adjustment:    'MINOR_ADJUSTMENT',
      thermal_tolerance: 'VERY_HIGH',
      notes: 'Gulf of Aqaba corals may be most thermally resistant on Earth. ' +
             'Cooler absolute temperatures but extreme tolerance relative to MMM.'
    },
    // Southern Red Sea — most bleaching vulnerable zone
    SOUTHERN_RED_SEA: {
      lat_center:        16.0,
      lon_center:        42.0,
      mmm_c:             31.5,
      bleaching_threshold_c: 32.5,
      mmm_offset_vs_noaa: 1.2,
      dhw_adjustment:    'APPLY_LOCAL_MMM',
      thermal_tolerance: 'MODERATE',
      notes: 'Southern Red Sea hit hardest in 2015–2016 bleaching. ' +
             'Community response was region-specific with >40% to <5% cover loss.'
    }
  };

  // ============================================================
  // 2. KAUST/RSRC PUBLISHED BENTHIC BENCHMARKS
  //
  //    Central Red Sea reef system — Thuwal area (22°N)
  //    9 reef sites monitored (3–24 km offshore gradient)
  //
  //    Pre-bleaching (2013 baseline — Berumen et al.):
  //      Offshore reefs: coral cover ~35–45%
  //      Inshore reefs:  coral cover ~10–20% (thermal stress + sediment)
  //
  //    Post-bleaching (2024 — Gonzalez et al.):
  //      Southern Red Sea reefs: cover dropped from >40% to <5% in 2 years
  //      Central Red Sea: more resilient, region-specific recovery patterns
  //
  //    Fish benchmarks (Berumen et al. 2013):
  //      All reefs show herbivore-dominated trophic structure
  //      Few apex predators (sharks, large groupers) — overfishing signature
  //      Fish biomass increases with distance from shore
  // ============================================================

  const RSRC_BENCHMARKS = {
    // Offshore reefs (>15 km from shore) — Thuwal area
    CENTRAL_RS_OFFSHORE: {
      year:              2013,
      distanceFromShore: '>15 km',
      coralCover_pct:    40.0,   // Pre-bleaching baseline
      algaeCover_pct:     8.0,   // Low — oligotrophic Red Sea
      herbivoreBiomass:  180.0,  // kg/ha — herbivore dominated
      commercialBiomass:   8.0,  // kg/ha — low apex predators
      trophicStructure:  'HERBIVORE_DOMINATED',
      notes: 'Pre-2015 bleaching baseline. More diverse herbivore assemblage, faster-growing corals.'
    },
    // Inshore reefs (<5 km from shore) — Thuwal area
    CENTRAL_RS_INSHORE: {
      year:              2013,
      distanceFromShore: '<5 km',
      coralCover_pct:    15.0,   // Post-2010 bleaching — substantially reduced
      algaeCover_pct:    20.0,   // Turf algae dominant (damselfish farms)
      herbivoreBiomass:  120.0,  // kg/ha — lower diversity
      commercialBiomass:   3.5,  // kg/ha
      trophicStructure:  'HERBIVORE_DOMINATED_LOW_DIVERSITY',
      notes: 'Inshore reefs impacted by 2010 bleaching. Turf-farming damselfishes abundant. ' +
             'More vulnerable to thermal bleaching than offshore equivalents.'
    },
    // Post-2015 bleaching — Southern Red Sea (Gonzalez et al. 2024)
    SOUTHERN_RS_POST_BLEACH: {
      year:              2024,
      distanceFromShore: 'mixed',
      coralCover_pct:     4.5,   // Collapsed from >40% — worst-affected zone
      algaeCover_pct:    35.0,
      herbivoreBiomass:   85.0,
      commercialBiomass:   2.0,
      trophicStructure:  'ALGAE_TRANSITIONING',
      notes: 'Severe post-bleaching collapse. Coral community responses were region-specific — ' +
             'southern reefs more promptly affected than central/northern zones.'
    },
    // Regional Red Sea baseline (synthesis across published literature)
    RED_SEA_REGIONAL: {
      year:              2022,
      coralCover_pct:    22.0,   // Synthesis estimate (pre-2023 mass bleaching)
      algaeCover_pct:    12.0,
      herbivoreBiomass:  150.0,
      commercialBiomass:   5.0,
      trophicStructure:  'HERBIVORE_DOMINATED',
      notes: 'Regional synthesis — high uncertainty. Red Sea is data-sparse outside KAUST zone. ' +
             'TODO_LIVE: Replace with KAUST live data when partnership confirmed.'
    }
  };

  // ============================================================
  // 3. RED SEA GEOGRAPHIC ZONES
  //    For thermal parameter and benchmark assignment by lat/lon
  // ============================================================

  const RED_SEA_ZONES = {
    NORTHERN_RED_SEA: { latMin: 27.0, latMax: 30.5, lonMin: 32.0, lonMax: 37.0 },
    CENTRAL_RED_SEA:  { latMin: 18.0, latMax: 27.0, lonMin: 36.0, lonMax: 42.0 },
    SOUTHERN_RED_SEA: { latMin: 12.0, latMax: 18.0, lonMin: 40.0, lonMax: 45.0 }
  };

  function findRedSeaZone(lat, lon) {
    for (const [zone, bounds] of Object.entries(RED_SEA_ZONES)) {
      if (lat >= bounds.latMin && lat <= bounds.latMax &&
          lon >= bounds.lonMin && lon <= bounds.lonMax) {
        return zone;
      }
    }
    return null;
  }

  // ============================================================
  // 4. DHW RECALIBRATION UTILITY
  //
  //    When CMIE processes a Red Sea site, the DHW score from
  //    Source 003 (NOAA CRW) may be overestimated because NOAA's
  //    global MMM grid underestimates the Red Sea's actual MMM.
  //
  //    This function computes the corrected DHW using the local
  //    KAUST-derived MMM offset, and returns the adjusted score.
  //
  //    Formula:
  //      Adjusted DHW = max(0, DHW_noaa − (MMM_local − MMM_noaa) × weeks)
  //      Where weeks = number of weeks in accumulation period (typically 12)
  //
  //    In practice: a +0.8°C MMM offset over 12 weeks = up to 9.6 DHW
  //    of "false" accumulation in the NOAA global product.
  //    This is architecturally significant — it can flip a GROAN
  //    site score from ALERT to WATCH level.
  // ============================================================

  /**
   * recalibrateDHW()
   * Adjusts NOAA CRW DHW for Red Sea MMM offset.
   * @param {number} dhw_noaa   - Raw DHW from Source 003
   * @param {string} zone       - RED_SEA_ZONES key
   * @param {number} [weeks=12] - DHW accumulation window (NOAA = 12 weeks)
   * @returns {{ dhw_adjusted: number, offset_applied: number, flag: string|null }}
   */
  function recalibrateDHW(dhw_noaa, zone, weeks = 12) {
    if (dhw_noaa === null || !zone) {
      return { dhw_adjusted: dhw_noaa, offset_applied: 0, flag: null };
    }

    const params = RED_SEA_THERMAL_PARAMS[zone];
    if (!params || params.dhw_adjustment === 'MINOR_ADJUSTMENT') {
      return {
        dhw_adjusted:   dhw_noaa,
        offset_applied: 0,
        flag: params ? 'MINOR_MMM_OFFSET_NOT_APPLIED' : 'ZONE_NOT_FOUND'
      };
    }

    const mmmOffset    = params.mmm_offset_vs_noaa;  // °C
    const dhwOffset    = mmmOffset * weeks;           // °C-weeks false accumulation
    const dhw_adjusted = Math.max(0, dhw_noaa - dhwOffset);

    return {
      dhw_adjusted:   parseFloat(dhw_adjusted.toFixed(2)),
      offset_applied: parseFloat(dhwOffset.toFixed(2)),
      flag: dhwOffset > 2 ? 'RED_SEA_DHW_RECALIBRATED' : null
    };
  }

  // ============================================================
  // 5. RED SEA RHI NORMALIZATION
  //
  //    Red Sea reef health is scored 0–10 from published benchmarks.
  //    Composite of:
  //      - Coral cover normalized vs. Red Sea zone baseline
  //      - Algae cover (inverted)
  //      - Herbivore biomass normalized vs. Red Sea baseline
  //
  //    Weights:
  //      coral cover:      0.45 (primary structural indicator)
  //      algae cover:      0.30 (competitive pressure)
  //      herbivore biomass: 0.25 (functional integrity)
  //
  //    Direction: POSITIVE
  // ============================================================

  const RED_SEA_RHI_WEIGHTS = { coral: 0.45, algae: 0.30, herbivore: 0.25 };

  // Normalization ranges derived from Red Sea published data
  const RED_SEA_NORMS = {
    coral:     { min: 0,    max: 50  },  // 0% = 0, ≥50% = 10
    algae:     { min: 0,    max: 50  },  // 0% = 10 (inverted), ≥50% = 0
    herbivore: { min: 0,    max: 300 }   // 0 kg/ha = 0, ≥300 = 10
  };

  /**
   * computeRedSeaRHI()
   * @param {number} coralCover_pct
   * @param {number} algaeCover_pct
   * @param {number} herbivoreBiomass_kgha
   * @returns {{ rhi: number, components: object }}
   */
  function computeRedSeaRHI(coralCover_pct, algaeCover_pct, herbivoreBiomass_kgha) {
    const coralScore = Math.min(10, (coralCover_pct / RED_SEA_NORMS.coral.max) * 10);
    const algaeScore = Math.max(0, 10 - (algaeCover_pct / RED_SEA_NORMS.algae.max) * 10);
    const herbScore  = Math.min(10, (herbivoreBiomass_kgha / RED_SEA_NORMS.herbivore.max) * 10);

    const rhi = (RED_SEA_RHI_WEIGHTS.coral * coralScore) +
                (RED_SEA_RHI_WEIGHTS.algae  * algaeScore) +
                (RED_SEA_RHI_WEIGHTS.herbivore * herbScore);

    return {
      rhi: parseFloat(rhi.toFixed(2)),
      components: {
        coralScore:    parseFloat(coralScore.toFixed(2)),
        algaeScore:    parseFloat(algaeScore.toFixed(2)),
        herbivoreScore: parseFloat(herbScore.toFixed(2)),
        weights:       RED_SEA_RHI_WEIGHTS
      }
    };
  }

  // ============================================================
  // 6. PRIMARY PUBLIC METHOD — queryKAUST()
  //
  //    Synchronous unless live endpoint is active.
  //    Returns zone parameters, benchmarks, thermal flags,
  //    and DHW recalibration values for a Red Sea lat/lon.
  //
  //    LIVE DATA STUB:
  //    When window.GROAN.config.KAUST_API_ENDPOINT is set,
  //    this function attempts a live fetch before falling back
  //    to hardcoded benchmarks.
  // ============================================================

  async function queryKAUST(lat, lon, options = {}) {
    const timestamp = new Date().toISOString();
    const zone      = findRedSeaZone(lat, lon);

    if (!zone) {
      return {
        source:     'KAUST_CORDAP',
        sourceId:   '010',
        lat, lon, timestamp,
        zone:       null,
        flag:       'OUTSIDE_RED_SEA_COVERAGE',
        confidence: 'NONE',
        note:       'Source 010 covers Red Sea only. For Caribbean theater use Sources 007/011.',
        thermal:    null,
        benchmark:  null,
        rhi:        null
      };
    }

    const thermalParams = RED_SEA_THERMAL_PARAMS[zone];

    // Select benchmark — offshore if lat/lon near KAUST study zone
    const isKAUSTZone = (lat >= 21.5 && lat <= 22.5 && lon >= 38.5 && lon <= 39.5);
    const benchmarkKey = isKAUSTZone ? 'CENTRAL_RS_OFFSHORE' : 'RED_SEA_REGIONAL';
    const benchmark    = RSRC_BENCHMARKS[benchmarkKey];

    // Compute RHI from benchmark values (as baseline reference)
    const rhiResult = computeRedSeaRHI(
      benchmark.coralCover_pct,
      benchmark.algaeCover_pct,
      benchmark.herbivoreBiomass
    );

    // DHW recalibration (if DHW value passed in options)
    let dhwRecalibration = null;
    if (options.dhw_noaa !== undefined && options.dhw_noaa !== null) {
      dhwRecalibration = recalibrateDHW(options.dhw_noaa, zone);
    }

    // LIVE DATA STUB
    // TODO_LIVE: When KAUST API endpoint confirmed with Dr. Haiwei:
    //   1. Set window.GROAN.config.KAUST_API_ENDPOINT = 'https://...'
    //   2. Set window.GROAN.config.KAUST_API_KEY = 'your_key'
    //   3. The stub below will fetch live survey data and override benchmarks
    let liveData = null;
    const liveEndpoint = window.GROAN && window.GROAN.config && window.GROAN.config.KAUST_API_ENDPOINT;
    if (liveEndpoint) {
      try {
        const apiKey  = window.GROAN.config.KAUST_API_KEY || '';
        const url     = `${liveEndpoint}?lat=${lat}&lon=${lon}`;
        const headers = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
        const resp    = await fetch(url, { headers });
        if (resp.ok) {
          liveData = await resp.json();
          console.log('[GROAN S010] Live KAUST data fetched:', liveData);
        }
      } catch (e) {
        console.warn('[GROAN S010] Live fetch failed, using published benchmarks:', e.message);
      }
    }

    // Determine data confidence
    const confidence = liveData ? 'HIGH' : (isKAUSTZone ? 'MODERATE' : 'LOW');
    const dataSource = liveData ? 'KAUST_LIVE_API' : 'PUBLISHED_BENCHMARKS';

    return {
      source:     'KAUST_CORDAP',
      sourceId:   '010',
      lat, lon, timestamp,

      zone,
      flag:       null,
      confidence,
      dataSource,

      thermal: {
        zone,
        mmm_c:                 thermalParams.mmm_c,
        bleaching_threshold_c: thermalParams.bleaching_threshold_c,
        mmm_offset_vs_noaa:    thermalParams.mmm_offset_vs_noaa,
        thermal_tolerance:     thermalParams.thermal_tolerance,
        dhw_adjustment:        thermalParams.dhw_adjustment,
        thermalNote:           thermalParams.notes
      },

      benchmark: {
        key:               benchmarkKey,
        year:              benchmark.year,
        coralCover_pct:    benchmark.coralCover_pct,
        algaeCover_pct:    benchmark.algaeCover_pct,
        herbivoreBiomass:  benchmark.herbivoreBiomass,
        commercialBiomass: benchmark.commercialBiomass,
        trophicStructure:  benchmark.trophicStructure,
        notes:             benchmark.notes
      },

      rhi: {
        score:      rhiResult.rhi,
        components: rhiResult.components,
        note:       'Derived from published KAUST benchmark — not a site observation. ' +
                    'Activate KAUST_API_ENDPOINT for live survey data.'
      },

      dhwRecalibration,
      liveData: liveData || null
    };
  }

  // ============================================================
  // 7. GSIN PROOF-OF-CONCEPT INTEGRATION
  //
  //    Source 010 is the Red Sea anchor for GROAN's GSIN spec.
  //    The GSIN Red Sea proof-of-concept uses KAUST/RSRC survey
  //    imagery for image confidence tier validation.
  //
  //    Key GSIN parameters for Red Sea theater:
  //      - Image confidence thresholds remain standard (High >85%)
  //      - Benthic ID challenge: Red Sea has unique coral morphologies
  //        not in Caribbean-trained models — flag for human review
  //      - Thermal context: use recalibrateDHW() before CMIE scoring
  // ============================================================

  const GSIN_RED_SEA_PARAMS = {
    theater:           'RED_SEA',
    primaryContact:    'Dr. Haiwei Luo — KAUST / CORDAP',
    contactStatus:     'AWAITING_RESPONSE',
    proofOfConceptSite: 'Central Red Sea, Thuwal area (22°N, 39°E)',
    imageConfidenceNote: 'Red Sea coral morphologies differ from Caribbean. ' +
                         'AI benthic classification models trained on Caribbean data ' +
                         'may misclassify Red Sea Acropora and Porites species. ' +
                         'Flag all Red Sea GSIN outputs for expert review until ' +
                         'Red Sea training data is integrated.',
    dhwAdjustmentRequired: true,
    dhwAdjustmentMethod:   'recalibrateDHW() — Source 010',
    mmpOffset_c:           0.8,
    TODO: 'TODO_LIVE: Confirm partnership with Dr. Haiwei. ' +
          'Set KAUST_API_ENDPOINT in window.GROAN.config when established.'
  };

  // ============================================================
  // 8. WINDOW.GROAN REGISTRATION
  // ============================================================

  window.GROAN = window.GROAN || {};
  window.GROAN.config  = window.GROAN.config  || {};
  window.GROAN.sources = window.GROAN.sources || {};

  window.GROAN.sources.KAUST_CORDAP = {
    id:         '010',
    name:       'KAUST Red Sea Research Center / CORDAP',
    shortName:  'KAUST_CORDAP',
    version:    'Published benchmarks through 2024 + live stub',
    dtis:       ['RED_SEA_RHI', 'RED_SEA_THERMAL_TOLERANCE_FLAG'],
    direction:  'POSITIVE',
    units:      'RED_SEA_RHI: 0–10 scale',
    coverage:   'Red Sea (Northern, Central, Southern zones)',
    accessMode: 'STATIC_HARDCODED + LIVE_STUB (activate via KAUST_API_ENDPOINT)',
    liveEndpointVar: 'window.GROAN.config.KAUST_API_ENDPOINT',
    liveKeyVar:      'window.GROAN.config.KAUST_API_KEY',

    query:              queryKAUST,
    computeRedSeaRHI,
    recalibrateDHW,
    findRedSeaZone,

    thermalParams:      RED_SEA_THERMAL_PARAMS,
    benchmarks:         RSRC_BENCHMARKS,
    gsinParams:         GSIN_RED_SEA_PARAMS,

    cordap: {
      role:         'G20 R&D accelerator — funds coral restoration projects worldwide',
      host:         'KAUST (King Abdullah University of Science and Technology)',
      dssCall:      'USD $1.5M Decision Support System call launched 2026 — GROAN alignment',
      website:      'https://cordap.org',
      contact:      'Dr. Haiwei Luo (CORDAP / KAUST RSRC)',
      contactStatus:'AWAITING_RESPONSE — Western Caribbean contacts email sent'
    },

    groanRole: {
      primary:   'Red Sea theater thermal recalibration — adjusts DHW/SST scores for Red Sea MMM',
      secondary: 'GSIN Red Sea proof-of-concept anchor site (Thuwal, 22°N)',
      critical:  'Without Source 010, Sources 001/003 DHW scores systematically overestimate ' +
                 'Red Sea thermal stress by up to 9.6 DHW (0.8°C × 12 weeks)'
    },

    updateProtocol: {
      trigger:    'New KAUST/RSRC publication OR partnership API confirmed',
      liveStub:   'Set window.GROAN.config.KAUST_API_ENDPOINT to activate',
      dataSource: 'https://reefecology.kaust.edu.sa and https://cordap.org',
      todo:       'TODO_LIVE — activate when Dr. Haiwei responds'
    },

    citations: [
      'Gonzalez K., et al. (2024). Differential spatio-temporal responses of Red Sea coral reef benthic communities to a mass bleaching event. Sci. Reports. DOI: 10.1038/s41598-024-74956-7',
      'Berumen M.L., et al. (2013). Spatial variation in coral reef fish and benthic communities in the central Saudi Arabian Red Sea. PeerJ, 1, e107.',
      'CORDAP (2020–2026). G20 Coral Research & Development Accelerator Platform. https://cordap.org'
    ]
  };

  console.log('[GROAN S010] kaust-cordap.js loaded → window.GROAN.sources.KAUST_CORDAP');
  console.log('[GROAN S010] Status: Published benchmarks active. Live endpoint: NOT SET.');
  console.log('[GROAN S010] To activate live data: window.GROAN.config.KAUST_API_ENDPOINT = "..."');

})();
