{
  "version": "2.0",
  "updated": "2026-05-02",
  "owner": "Nevado Ranch Camp LLC",
  "system": "GROAN\u2122 \u2014 Global Reef & Ocean Analytics Network",
  "notes": "v2.0 \u2014 COMPLETE. Added Source_012 (eReefs CSIRO/AIMS) DTIs: EREEFS_DIN_MGL, EREEFS_TURBIDITY_NTU, EREEFS_TEMP_C, EREEFS_CHL_MGL. All 12 sources registered. Total: 73 DTIs.",
  "modules": [
    "GRIN",
    "GSIN",
    "GMIN",
    "GKIN",
    "CMIE",
    "DMAP-CAL\u2122",
    "MOOP"
  ],
  "source_registry": {
    "Source_001": {
      "name": "NOAA CoralTemp",
      "dataset": "NOAA_DHW",
      "baseUrl": "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
      "variables": [
        "CRW_SST",
        "CRW_DHW",
        "CRW_BAA",
        "CRW_SSTANOMALY"
      ],
      "resolution_km": 5,
      "update_frequency": "daily",
      "note": "Single ERDDAP call returns SST + DHW + BAA simultaneously. Shared by Source_001 and Source_003."
    },
    "Source_002": {
      "name": "NOAA WaveWatch III",
      "dataset": "WW3_GLOBAL",
      "baseUrl": "https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_global.pl",
      "variables": [
        "HTSGW_surface"
      ],
      "resolution_km": 16,
      "update_frequency": "6-hourly"
    },
    "Source_003": {
      "name": "NOAA CRW \u2014 DHW + BAA",
      "dataset": "NOAA_DHW",
      "baseUrl": "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
      "variables": [
        "CRW_DHW",
        "CRW_BAA",
        "CRW_SSTANOMALY"
      ],
      "resolution_km": 5,
      "update_frequency": "daily",
      "note": "Shares ERDDAP call with Source_001. No additional API request required."
    },
    "Source_004": {
      "name": "NASA OceanColor \u2014 Chlorophyll-a",
      "dataset": "MODISA_L3m_CHL",
      "baseUrl": "https://oceandata.sci.gsfc.nasa.gov",
      "variables": [
        "chlor_a"
      ],
      "resolution_km": 4,
      "preferred_composite": "8D",
      "update_frequency": "daily (8-day composite preferred)",
      "auth_required": true,
      "auth_env_var": "NASA_EARTHDATA_TOKEN",
      "note": "log10 transform required before normalization. 8-day composite preferred over daily to reduce cloud-gap noise."
    },
    "Source_005": {
      "name": "Copernicus Marine \u2014 Global Physics Analysis and Forecast",
      "dataset": "GLOBAL_ANALYSISFORECAST_PHY_001_024",
      "baseUrl": "https://nrt.cmems-du.eu/thredds/dodsC/cmems_mod_glo_phy-all_anfc_0.083deg_P1D-m",
      "variables": [
        "so",
        "uo",
        "vo",
        "mlotst",
        "thetao"
      ],
      "resolution_km": 8,
      "update_frequency": "daily NRT",
      "auth_required": true,
      "auth_method": "Basic (username:password)",
      "registration_url": "https://marine.copernicus.eu",
      "note": "Current speed/direction derived from U+V components. Subsurface temp at ~50m for thermal refuge assessment."
    },
    "Source_006": {
      "name": "Allen Coral Atlas",
      "dataset": "ACA_reef_habitat_v2_0",
      "accessMode": "LOCAL_GEOJSON",
      "dataVersion": "v2.0",
      "vintage": "2018\u20132021 (static \u2014 PlanetScope composite)",
      "coverage": "30\u00b0N\u201330\u00b0S, shallow tropical reefs \u226415 m depth",
      "resolution_m": 5,
      "update_frequency": "static (periodic release updates)",
      "auth_required": false,
      "variables": [
        "geomorphic_zone",
        "benthic_class",
        "reef_extent"
      ],
      "geomorphic_classes": 12,
      "benthic_classes": 7,
      "dependency": "turf.js v6.5.0 (client-side point-in-polygon)",
      "local_data_paths": {
        "benthic": "/data/aca_caribbean_benthic.geojson",
        "geomorphic": "/data/aca_caribbean_geomorphic.geojson",
        "reefExtent": "/data/aca_caribbean_reef_extent.geojson"
      },
      "download_url": "https://allencoralatlas.org/atlas/",
      "todo": "TODO_ENDPOINT \u2014 Download Caribbean AOI GeoJSON from allencoralatlas.org/atlas and commit to /data/ before this source is active. Verify GeoJSON property key for class code after download.",
      "citation": "Allen Coral Atlas (2020). Imagery, maps and monitoring of the world's tropical coral reefs. Zenodo. DOI: 10.5281/zenodo.3833242"
    },
    "Source_007": {
      "name": "NOAA CRW Regional Virtual Stations",
      "dataset": "CRW_5km_Regional_Virtual_Stations_v3.1",
      "baseUrl": "https://coralreefwatch.noaa.gov/product/vs/data/",
      "variables": [
        "SST_mean",
        "SST_anomaly",
        "HotSpot",
        "DHW",
        "BAA_7day_max"
      ],
      "stationType": "Regional (jurisdiction-level, 90th percentile reef pixels)",
      "stationCount_RimRun": 16,
      "stationCount_global": 219,
      "update_frequency": "daily",
      "time_series_start": "1985",
      "auth_required": false,
      "data_format": "ASCII text (.txt)",
      "note": "90th-percentile DHW/BAA across reef pixels in jurisdiction. Complements Sources 001/003 (point-level). CMIE uses delta between point and jurisdiction to classify systemic vs. isolated stress."
    },
    "Source_008": {
      "name": "Global Fishing Watch",
      "dataset": "public-global-fishing-effort:v3.0",
      "baseUrl": "https://gateway.api.globalfishingwatch.org/v3/4wings/report",
      "variables": [
        "apparent_fishing_hours"
      ],
      "resolution": "LOW (0.1\u00b0) / MEDIUM (0.01\u00b0) / HIGH (0.001\u00b0) \u2014 configurable",
      "update_frequency": "Daily NRT (~72hr lag)",
      "time_series_start": "2017",
      "auth_required": true,
      "auth_method": "Bearer token (free API key)",
      "api_key_registration": "https://globalfishingwatch.org/our-apis/",
      "api_key_var": "window.GROAN.config.GFW_API_KEY",
      "rate_limit": "50,000 requests/day",
      "caveat": "AIS vessels only (~70,000). Non-AIS artisanal fishing not detected. May overestimate reef health in high small-boat fishing regions (coastal Honduras, Nicaragua, Guatemala).",
      "note": "Default AOI: \u00b10.5\u00b0 bounding box (~55km) around waypoint. Default period: 30 days. Total fishing hours summed across AOI cells, log10-normalized to FPI."
    },
    "Source_011": {
      "name": "Healthy Reefs Initiative / AGRRA",
      "components": {
        "HRI": "Healthy Reefs for Healthy People Initiative (Smithsonian Institution)",
        "AGRRA": "Atlantic and Gulf Rapid Reef Assessment Program"
      },
      "dataset": "HRI Mesoamerican Reef Report Cards (biennial) + AGRRA Caribbean Database",
      "accessMode": "STATIC_HARDCODED (no REST API)",
      "coverage": "MAR: Mexico, Belize, Guatemala, Honduras (~300 sites, ~1,000 km coast)",
      "latestReportCard": 2024,
      "surveyYearLatest": 2023,
      "updateFrequency": "Biennial (~every 2 years)",
      "nextExpectedUpdate": "~Late 2026",
      "auth_required": false,
      "dataUrl": "https://www.healthyreefs.org/en/healthy-reefs-data/report-cards",
      "agrraPortal": "https://www.agrra.org/data-explorer/",
      "indicators": [
        "live_coral_cover_pct",
        "fleshy_macroalgae_cover_pct",
        "herbivorous_fish_biomass_kgha",
        "commercial_fish_biomass_kgha"
      ],
      "rhi_scale": "1-5 (1=Critical, 2=Poor, 3=Fair, 4=Good, 5=Very Good)",
      "note": "No REST API. Values hardcoded from published Report Cards. Update hri-agrra.js when new Report Card releases. GROAN validation reference for Caribbean theater."
    },
    "Source_010": {
      "name": "KAUST Red Sea Research Center / CORDAP",
      "components": {
        "KAUST_RSRC": "King Abdullah University of Science and Technology \u2014 Red Sea Research Center",
        "CORDAP": "G20 Coral Research & Development Accelerator Platform (hosted at KAUST)"
      },
      "dataset": "KAUST/RSRC published survey data + CORDAP project outputs",
      "accessMode": "STATIC_HARDCODED + LIVE_STUB (no public REST API currently)",
      "coverage": "Red Sea \u2014 Northern, Central (Thuwal, 22\u00b0N), Southern zones",
      "auth_required": false,
      "live_endpoint_var": "window.GROAN.config.KAUST_API_ENDPOINT",
      "live_key_var": "window.GROAN.config.KAUST_API_KEY",
      "contact": "Dr. Haiwei Luo \u2014 KAUST/CORDAP (awaiting response)",
      "primaryRef": "Gonzalez et al. (2024). Sci. Reports. DOI: 10.1038/s41598-024-74956-7",
      "cordap_dss_call": "USD $1.5M AI Decision Support System call (2026) \u2014 GROAN alignment",
      "note": "No public API. Benchmarks hardcoded from peer-reviewed KAUST/RSRC publications. Live stub activates when partnership with Dr. Haiwei confirmed. Critical for Red Sea DHW recalibration \u2014 Red Sea MMM is ~0.8\u00b0C higher than NOAA global grid."
    },
    "Source_009": {
      "name": "AIMS Long-Term Monitoring Program",
      "shortName": "AIMS_LTMP",
      "components": {
        "live_api": "AIMS Data Platform API v1.0 (SST/temperature \u2014 API key required)",
        "benchmarks": "AIMS LTMP Annual Summary Reports (benthic \u2014 hardcoded)"
      },
      "live_api_endpoint": "https://api.aims.gov.au/data/v1.0/10.25845/5c09bf93f315d/data",
      "api_key_var": "window.GROAN.config.AIMS_API_KEY",
      "api_key_registration": "https://open-aims.github.io/data-platform/key_request.html",
      "benchmark_source": "AIMS LTMP Annual Summary 2024/25",
      "coverage": "Great Barrier Reef \u2014 Northern, Central, Southern sectors (124 reefs surveyed 2024/25)",
      "theater": "GBR",
      "update_frequency": "Annual (published ~August each year)",
      "auth_required": true,
      "auth_method": "x-api-key header (free registration)",
      "latest_report_year": 2025,
      "bleaching_events_since_2016": 5,
      "note": "Live API covers SST only. Benthic coral cover data requires form-based download \u2014 hardcoded from Annual Summary. TODO_UPDATE each August."
    },
    "Source_012": {
      "name": "eReefs CSIRO/AIMS GBR4 Hydrodynamic + BioGeoChemical Model",
      "shortName": "EREEFS_CSIRO",
      "components": {
        "hydro": "GBR4 Hydrodynamic v4 \u2014 temperature, salinity, currents (CSIRO/AIMS)",
        "bgc": "GBR4 BGC v3.1 \u2014 DIN, turbidity, chlorophyll, coral, seagrass (CSIRO/AIMS)"
      },
      "thredds_base": "https://thredds.ereefs.aims.gov.au/thredds/",
      "ncss_access": "NetCDF Subset Service (NCSS) \u2014 lat/lon point query, returns CSV",
      "auth_required": false,
      "coverage": "GBR (~142\u00b0E\u2013156\u00b0E, 7\u00b0S\u201328\u00b0S), 4km resolution",
      "theater": "GBR",
      "update_frequency": "Daily model outputs (NRT)",
      "bgc_update": "BGC v4.0 expected late 2025 \u2014 will deprecate v3.1",
      "cors_note": "THREDDS NCSS may be blocked by CORS in browser. Use server-side proxy if blocked.",
      "note": "Only GROAN source providing modeled subsurface water quality (DIN, turbidity). Cloud-free. Critical for LBSP diagnosis on inshore GBR reefs."
    }
  },
  "DTIs": {
    "CORAL_COVER_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Live coral cover from belt transect (25m x 4m)"
    },
    "ALGAE_COVER_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Macroalgae cover from belt transect"
    },
    "CCA_COVER_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Crustose coralline algae cover \u2014 succession stage indicator"
    },
    "BARE_SUBSTRATE_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Bare carbonate substrate from belt transect"
    },
    "SEDIMENT_COVER_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Sediment cover on reef substrate \u2014 LBSP proxy"
    },
    "REEF_BLEACHING_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Percentage of observed coral showing bleaching (pale, partial, or full)"
    },
    "REEF_CORAL_CONDITION": {
      "module": "GRIN",
      "type": "enum",
      "values": [
        "healthy",
        "pale",
        "partial_bleach",
        "full_bleach",
        "recovering",
        "diseased",
        "dead"
      ],
      "description": "Dominant coral condition state at survey site"
    },
    "SUCCESSION_STAGE": {
      "module": "GRIN",
      "type": "enum",
      "values": [
        "pioneer",
        "transitional",
        "climax",
        "arrested"
      ],
      "description": "Ecological succession stage \u2014 recovery index input to DMAP-CAL\u2122"
    },
    "PAM_FV_FM": {
      "module": "GRIN",
      "type": "float",
      "unit": "ratio",
      "min": 0,
      "max": 0.75,
      "description": "Fv/Fm quantum yield of PSII. Healthy: 0.55-0.65. Pre-bleach stress: <0.45. Severe dysfunction: <0.30. Must be measured <50 \u00b5mol PAR."
    },
    "JUVENILE_CORAL_DENSITY_M2": {
      "module": "GRIN",
      "type": "float",
      "unit": "count/m\u00b2",
      "min": 0,
      "max": 500,
      "description": "Juvenile coral density (<4cm diameter) per m\u00b2 \u2014 recruitment signal"
    },
    "HERBIVORE_BIOMASS_KG_HA": {
      "module": "GRIN",
      "type": "float",
      "unit": "kg/ha",
      "min": 0,
      "max": 5000,
      "description": "Herbivore functional group biomass (parrotfish + surgeonfish + urchins) from fish survey"
    },
    "APEX_PREDATOR_INDEX": {
      "module": "GRIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Apex predator encounter rate normalized to circuit 1 baseline \u2014 trophic cascade trigger"
    },
    "LIONFISH_DENSITY_100M2": {
      "module": "GRIN",
      "type": "float",
      "unit": "count/100m\u00b2",
      "min": 0,
      "max": 200,
      "description": "Lionfish density per 100m\u00b2 \u2014 herbivore suppression signal distinct from overfishing"
    },
    "SCTLD_PREVALENCE_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Stony Coral Tissue Loss Disease prevalence at survey site. Non-additive with thermal bleaching \u2014 must be logged separately in CMIE."
    },
    "ALGAE_CONTACT_MARGIN_M": {
      "module": "GRIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 100,
      "description": "Total algae-coral contact margin length per transect \u2014 allelopathy zone proxy"
    },
    "SEAGRASS_COVER_PCT": {
      "module": "GSIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Seagrass meadow cover in lagoon/back-reef zone"
    },
    "SEAGRASS_HEALTH_INDEX": {
      "module": "GSIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Composite seagrass health \u2014 blade density, rhizome architecture, sediment condition"
    },
    "SEAGRASS_CARBON_BURIAL_INDEX": {
      "module": "GSIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Biological pump efficiency proxy \u2014 sediment darkness, rhizome intact, no bioturbation"
    },
    "MANGROVE_CANOPY_INDEX": {
      "module": "GMIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Mangrove canopy cover normalized index"
    },
    "MANGROVE_DENSITY_INDEX": {
      "module": "GMIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Mangrove prop root/stem density index"
    },
    "MANGROVE_DOC_EXPORT_INDEX": {
      "module": "GMIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Estimated DOC export capacity to adjacent seagrass/reef \u2014 derived from canopy area"
    },
    "WATER_TEMP_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b0C",
      "min": -2,
      "max": 40,
      "source": "Source_001",
      "variable_key": "CRW_SST",
      "normalize_fn": "sstNormalize",
      "description": "Sea surface temperature from NOAA CoralTemp. Normalized: 24\u00b0C=10, 30\u00b0C=0 (inverted \u2014 hotter=lower score)."
    },
    "WATER_TEMP_ANOMALY_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b0C",
      "min": -10,
      "max": 10,
      "source": "Source_001",
      "variable_key": "CRW_SSTANOMALY",
      "description": "SST anomaly vs. site MMM baseline. >+1\u00b0C for >4 weeks triggers Sverdrup NPP flag."
    },
    "DHW_DEGREE_HEATING_WEEKS": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b0C-weeks",
      "min": 0,
      "max": 30,
      "source": "Source_003",
      "variable_key": "CRW_DHW",
      "normalize_fn": "dhwNormalize",
      "thresholds": {
        "watch": 4,
        "alert_1": 8,
        "alert_2": 12
      },
      "description": "Degree Heating Weeks \u2014 primary bleaching predictor. Piecewise normalized: 0=10, 4=7, 8=4, 12=1, >12=0. Highest single-variable CMIE weight."
    },
    "BAA_BLEACHING_ALERT_AREA": {
      "module": "GKIN",
      "type": "integer",
      "unit": "categorical",
      "min": 0,
      "max": 4,
      "source": "Source_003",
      "variable_key": "CRW_BAA",
      "normalize_fn": "baaNormalize",
      "values": {
        "0": "No Thermal Stress",
        "1": "Bleaching Watch",
        "2": "Bleaching Warning",
        "3": "Bleaching Alert Level 1",
        "4": "Bleaching Alert Level 2"
      },
      "normalized_scores": {
        "0": 10.0,
        "1": 7.0,
        "2": 5.0,
        "3": 2.5,
        "4": 0.0
      },
      "description": "NOAA CRW Bleaching Alert Area categorical product. Feeds GROAN alert dashboard tier. Retrieved in same ERDDAP call as DHW."
    },
    "CHLOROPHYLL_A_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg/m\u00b3",
      "min": 0.001,
      "max": 10,
      "source": "Source_004",
      "variable_key": "chlor_a",
      "normalize_fn": "chlorophyllNormalize",
      "transform": "log10",
      "normalize_range": {
        "log_min": -2.0,
        "log_max": 0.3,
        "note": "log10(0.01)=-2.0 maps to score 10; log10(2.0)=0.30 maps to score 0"
      },
      "preferred_composite": "8D",
      "thresholds": {
        "ultra_oligotrophic": 0.02,
        "oligotrophic_upper": 0.1,
        "elevated": 0.5,
        "eutrophic_stress": 1.0,
        "severe_eutrophic": 2.0
      },
      "theater_weights": {
        "MAR": 1.1,
        "GBR": 1.2,
        "RED_SEA": 0.9,
        "CORAL_TRIANGLE": 1.0
      },
      "description": "Surface chlorophyll-a concentration \u2014 primary proxy for nutrient/pollution loading. log10 transform required. Low Chl-a = clear oligotrophic water (reef-favorable). Direction: negative (higher=lower score). NASA Earthdata auth required."
    },
    "OMEGA_ARAGONITE": {
      "module": "GKIN",
      "type": "float",
      "unit": "dimensionless",
      "min": 0,
      "max": 6,
      "description": "Aragonite saturation state. Monitor: 2.5-3.5. Alert: 1.5-2.5. Critical/tipping: <1.5 (net negative accretion trigger)."
    },
    "NUTRIENT_NP_RATIO": {
      "module": "GKIN",
      "type": "float",
      "unit": "ratio",
      "min": 0,
      "max": 200,
      "description": "DIN:DIP ratio vs. Redfield baseline 16:1. >20 = anthropogenic N loading (Tier 2 LBSP). <8 = N-cycling perturbation (GKIN flag)."
    },
    "NUTRIENT_DIN_UML": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b5mol/L",
      "min": 0,
      "max": 500,
      "description": "Dissolved inorganic nitrogen (NH4+ + NO2- + NO3-). Sample must be preserved within 30 min."
    },
    "NUTRIENT_DIP_UML": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b5mol/L",
      "min": 0,
      "max": 100,
      "description": "Dissolved inorganic phosphorus (PO4\u00b3\u207b). Sample must be preserved within 30 min."
    },
    "WATER_TURBIDITY_NTU": {
      "module": "GKIN",
      "type": "float",
      "unit": "NTU",
      "min": 0,
      "max": 1000,
      "description": "Water turbidity \u2014 LBSP sediment proxy"
    },
    "SECCHI_DEPTH_M": {
      "module": "GKIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 50,
      "description": "Secchi disk depth \u2014 turbidity proxy, concurrent with water chemistry sampling"
    },
    "VISIBILITY_M": {
      "module": "GKIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 50,
      "description": "Horizontal underwater visibility at survey depth"
    },
    "WAVE_HEIGHT_M": {
      "module": "GKIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 20,
      "source": "Source_002",
      "variable_key": "HTSGW_surface",
      "normalize_fn": "waveNormalize",
      "description": "Significant wave height (Hs) \u2014 Source 002. Visual Beaufort estimate or instrument."
    },
    "THERMOCLINE_DEPTH_M": {
      "module": "GKIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 200,
      "description": "Thermocline depth (max dT/dz) from CTD profile. <50m triggers DVM compression flag."
    },
    "DISSOLVED_OXYGEN_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg/L",
      "min": 0,
      "max": 20,
      "description": "Dissolved oxygen from CTD profile"
    },
    "TIDAL_PHASE_COMPLIANCE": {
      "module": "MOOP",
      "type": "enum",
      "values": [
        "compliant",
        "non_compliant",
        "flagged_resurvey"
      ],
      "description": "Survey tidal phase vs. circuit 1 anchor (\u00b11hr). Non-compliant data cannot enter longitudinal cover trend."
    },
    "IMAGE_CONFIDENCE_TIER": {
      "module": "MOOP",
      "type": "enum",
      "values": [
        "high",
        "moderate",
        "low"
      ],
      "description": "GSIN image confidence tier assigned at ingestion. High>85%, Moderate 60-85%, Low<60%."
    },
    "OBSERVER_PAIR_CALIBRATED": {
      "module": "MOOP",
      "type": "enum",
      "values": [
        "certified",
        "provisional",
        "failed"
      ],
      "description": "Observer pair calibration status from Banco Chinchorro standard transect. Uncertified data not accepted into pipeline."
    },
    "CMIE_CASCADE_FLAG": {
      "module": "CMIE",
      "type": "enum",
      "values": [
        "none",
        "trophic_cascade",
        "lbsp_upstream",
        "thermal_pre_bleach",
        "sctld_compound",
        "phase_shift_proximity",
        "compounding_pulse",
        "lbsp_modeled_elevated",
        "lbsp_modeled_critical"
      ],
      "description": "Cross-module interaction signal type. Multiple flags allowed per site per circuit. EREEFS LBSP flags: lbsp_modeled_elevated, lbsp_modeled_critical."
    },
    "CMIE_PHASE_SHIFT_PROXIMITY": {
      "module": "CMIE",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Proximity to coral-algae phase shift threshold (0=low risk, 1=imminent). Weighted by hysteresis asymmetry."
    },
    "CMIE_RESILIENCE_INDEX": {
      "module": "CMIE",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Estimated reef resilience \u2014 rate of recovery between disturbance events across circuits."
    },
    "CMIE_RESISTANCE_INDEX": {
      "module": "CMIE",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Estimated reef resistance \u2014 magnitude of disturbance survived without phase shift."
    },
    "COVER_TRAJECTORY": {
      "module": "CMIE",
      "type": "enum",
      "values": [
        "recovering",
        "stable",
        "declining",
        "accelerating_decline",
        "insufficient_data"
      ],
      "description": "Multi-circuit coral cover trajectory. Requires \u22652 circuits. Overrides status-only DS for routing."
    },
    "OUTCOME_SIGNAL": {
      "module": "CMIE",
      "type": "enum",
      "values": [
        "improved",
        "stable",
        "declined",
        "critical"
      ],
      "description": "Circuit-over-circuit outcome classification from CMIE"
    },
    "DS_SCORE": {
      "module": "DMAP-CAL\u2122",
      "type": "float",
      "unit": "score",
      "min": 0,
      "max": 10,
      "description": "Decision Score: DS = \u03b1\u00b7E[Benefit] \u2212 \u03b2\u00b7Risk \u2212 \u03b3\u00b7Cost + \u03b4\u00b7Feasibility"
    },
    "DS_LOCAL_DRIVER_PCT": {
      "module": "DMAP-CAL\u2122",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Percentage of DS driven by locally actionable stressors (Tier 1-4). Critical for intervention ROI calculation."
    },
    "INTERVENTION_TIER": {
      "module": "DMAP-CAL\u2122",
      "type": "integer",
      "min": 1,
      "max": 5,
      "description": "DMAP-CAL\u2122 intervention tier. 1=site-level (mooring/diver), 2=local regulation, 3=MPA/watershed, 4=restoration, 5=global advocacy."
    },
    "INTERVENTION_TYPE": {
      "module": "DMAP-CAL\u2122",
      "type": "enum",
      "values": [
        "none",
        "t1_mooring_buoy",
        "t1_diver_management",
        "t1_no_anchor_zone",
        "t1_sunscreen_free_zone",
        "t2_nutrient_source_control",
        "t2_sediment_control",
        "t2_fisheries_regulation",
        "t2_lionfish_removal",
        "t3_mpa_establishment",
        "t3_watershed_management",
        "t4_mangrove_restoration",
        "t4_seagrass_restoration",
        "t4_coral_nursery_outplant",
        "t5_policy_advocacy"
      ],
      "description": "Specific DMAP-CAL\u2122 intervention \u2014 prefixed by tier for routing clarity. Tier 5 = climate/global only."
    },
    "OUTCOME_TIME_DAYS": {
      "module": "DMAP-CAL\u2122",
      "type": "integer",
      "unit": "days",
      "min": 0,
      "max": 3650,
      "description": "Expected time to measurable outcome from intervention initiation"
    },
    "SALINITY_PSU": {
      "module": "GKIN",
      "type": "float",
      "unit": "PSU",
      "min": 20,
      "max": 45,
      "source": "Source_005",
      "variable_key": "so",
      "normalize_fn": "salinityNormalize",
      "normalize_type": "parabolic",
      "optimal": 35.0,
      "stress_low": 30.0,
      "stress_high": 40.0,
      "description": "Sea surface salinity. Parabolic normalization \u2014 optimal near 35 PSU, stress at both low (<30, freshwater intrusion) and high (>40, hypersaline) extremes."
    },
    "CURRENT_SPEED_MS": {
      "module": "GKIN",
      "type": "float",
      "unit": "m/s",
      "min": 0,
      "max": 3.0,
      "source": "Source_005",
      "variable_keys": {
        "U": "uo",
        "V": "vo"
      },
      "normalize_fn": "currentSpeedNormalize",
      "normalize_type": "parabolic",
      "optimal_range": [
        0.05,
        0.3
      ],
      "stress_high": 0.8,
      "theater_weights": {
        "MAR": 1.0,
        "GBR": 1.1,
        "RED_SEA": 1.2,
        "CORAL_TRIANGLE": 1.0
      },
      "description": "Surface current speed derived from U+V components. Parabolic: moderate current (0.05-0.30 m/s) = optimal reef flushing. Too slow = stagnant. Too fast = mechanical stress."
    },
    "CURRENT_DIR_DEG": {
      "module": "GKIN",
      "type": "float",
      "unit": "degrees",
      "min": 0,
      "max": 360,
      "source": "Source_005",
      "variable_keys": {
        "U": "uo",
        "V": "vo"
      },
      "normalize_fn": "none",
      "description": "Surface current direction (degrees from North). Used for reef aspect/exposure calculation in CMIE \u2014 not independently normalized. Combined with site aspect data."
    },
    "MIXED_LAYER_DEPTH_M": {
      "module": "GKIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 200,
      "source": "Source_005",
      "variable_key": "mlotst",
      "normalize_fn": "mldNormalize",
      "normalize_type": "positive",
      "thresholds": {
        "critically_shallow": 10,
        "shallow_bleaching_risk": 15,
        "deep_refuge": 80
      },
      "theater_weights": {
        "MAR": 1.0,
        "GBR": 1.1,
        "RED_SEA": 1.2,
        "CORAL_TRIANGLE": 1.0
      },
      "description": "Ocean mixed layer depth. Deeper MLD = greater thermal buffering = higher score. Shallow MLD during thermal stress amplifies bleaching risk. RED_SEA elevated \u2014 stratification is acute bleaching amplifier in Red Sea basin."
    },
    "SUBSURFACE_TEMP_DELTA_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "degrees C delta",
      "min": -10,
      "max": 10,
      "source": "Source_005",
      "variable_key": "thetao",
      "reference_depth_m": 50,
      "normalize_fn": "subSurfTempDeltaNormalize",
      "normalize_type": "negative_delta",
      "requires": "Source_001 SST (WATER_TEMP_C) for delta calculation",
      "thresholds": {
        "strong_refuge": -3.0,
        "moderate_refuge": -1.5,
        "no_refuge": 0.0,
        "full_column_stress": 1.5
      },
      "description": "Subsurface temperature at ~50m assessed as delta vs. SST (Source_001). Negative delta = cooler subsurface = thermal refuge potential. Score 10 at -3 C delta, score 5 at 0, score 0 at +3 C delta."
    },
    "RSI": {
      "module": "GRIN",
      "type": "float",
      "unit": "0\u201310 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_006",
      "normalize_fn": "normalizeRSI",
      "normalize_type": "positive",
      "direction": "POSITIVE",
      "direction_note": "Higher RSI = better reef structural integrity. No inversion required for CMIE integration.",
      "formula": "RSI = (0.40 \u00d7 zoneScore) + (0.40 \u00d7 benthicScore) + (0.20 \u00d7 presenceScore)",
      "weights": {
        "zone": 0.4,
        "benthic": 0.4,
        "presence": 0.2
      },
      "null_handling": {
        "benthic_unmapped": "RSI = (0.70 \u00d7 zoneScore) + (0.30 \u00d7 presenceScore) \u2192 flag: BENTHIC_UNMAPPED",
        "presence_unknown": "RSI = (0.50 \u00d7 zoneScore) + (0.50 \u00d7 benthicScore) \u2192 flag: PRESENCE_UNKNOWN",
        "zone_unmapped": "RSI = null \u2192 flag: OUTSIDE_ACA_EXTENT"
      },
      "confidence_tiers": {
        "HIGH": "All three components (zone + benthic + presence) available",
        "MODERATE": "Two components available (benthic unmapped OR presence unknown)",
        "LOW": "Zone score only",
        "NONE": "Outside ACA extent or data load failure"
      },
      "flags": {
        "OUTSIDE_ACA_EXTENT": "Point outside ACA geomorphic mapping extent",
        "OUTSIDE_ACA_LATITUDE_BOUNDS": "Latitude > 30\u00b0N or < 30\u00b0S",
        "BENTHIC_UNMAPPED": "Point >10m depth or turbid \u2014 benthic layer unavailable",
        "PRESENCE_UNKNOWN": "Reef extent product returned no result",
        "ZONE_ONLY": "Zone score only; benthic and presence both unavailable",
        "DATA_LOAD_FAILED": "GeoJSON files not found \u2014 see TODO_ENDPOINT in allen-coral-atlas.js"
      },
      "geomorphic_rubric": {
        "11_ReefCrest": 10.0,
        "14_ReefSlope": 9.5,
        "12_OuterReefFlat": 8.0,
        "19_ShelteredReefSlope": 8.0,
        "16_Plateau": 7.5,
        "15_BackReefSlope": 7.0,
        "13_InnerReefFlat": 6.5,
        "17_Lagoon": 4.0,
        "21_SparseReef": 3.5,
        "18_DeepLagoon": 2.5,
        "20_TerrestrialReefFlat": 1.5,
        "22_Unknown": null
      },
      "benthic_rubric": {
        "401_CoralAlgae": 9.0,
        "402_MicroalgalMats": 5.0,
        "406_Seagrass": 4.5,
        "403_Rock": 4.0,
        "404_Rubble": 2.0,
        "405_Sand": 1.0,
        "407_Unknown": null
      },
      "description": "Reef Structural Integrity Index \u2014 composite score from ACA geomorphic zone, benthic habitat class, and reef presence. Static dataset (2018\u20132021). Provides spatial structural baseline for CMIE; not a real-time signal."
    },
    "VS_DHW_90PCT": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b0C-weeks",
      "min": 0,
      "max": 30,
      "source": "Source_007",
      "variable_key": "DHW",
      "normalize_fn": "normalizeDHW",
      "normalize_type": "piecewise_negative",
      "direction": "NEGATIVE",
      "thresholds": {
        "watch": 4,
        "alert_1": 8,
        "alert_2": 12
      },
      "normalized_scores": {
        "0": 10.0,
        "4": 7.0,
        "8": 4.0,
        "12": 1.0,
        ">12": 0.0
      },
      "note": "Jurisdiction 90th-percentile DHW. Same piecewise rubric as DHW_DEGREE_HEATING_WEEKS (Source_003) for direct CMIE delta comparison. Higher value = more stress = lower score.",
      "cmie_delta_partner": "DHW_DEGREE_HEATING_WEEKS",
      "cmie_delta_flags": {
        "POINT_ANOMALOUSLY_HOT": "Point DHW > VS DHW by >2\u00b0C-wk \u2014 isolated hotspot",
        "SYSTEMIC_JURISDICTION_STRESS": "VS DHW > Point DHW by >2\u00b0C-wk \u2014 systemic event",
        "POINT_REPRESENTATIVE_OF_JURISDICTION": "Delta \u2264 \u00b12\u00b0C-wk \u2014 point is representative"
      },
      "description": "NOAA CRW Virtual Station Degree Heating Weeks \u2014 90th percentile of reef pixels in jurisdiction. Provides jurisdictional thermal stress context for CMIE. Distinct from DHW_DEGREE_HEATING_WEEKS (Source_003) which is point-level gridded."
    },
    "VS_BAA_7D_MAX": {
      "module": "GKIN",
      "type": "integer",
      "unit": "categorical",
      "min": 0,
      "max": 4,
      "source": "Source_007",
      "variable_key": "BAA_7day_max",
      "normalize_fn": "normalizeBAA",
      "normalize_type": "categorical_negative",
      "direction": "NEGATIVE",
      "values": {
        "0": "No Thermal Stress",
        "1": "Bleaching Watch",
        "2": "Bleaching Warning",
        "3": "Bleaching Alert Level 1",
        "4": "Bleaching Alert Level 2"
      },
      "normalized_scores": {
        "0": 10.0,
        "1": 7.0,
        "2": 5.0,
        "3": 2.5,
        "4": 0.0
      },
      "note": "Jurisdiction 7-day max BAA. Same categorical rubric as BAA_BLEACHING_ALERT_AREA (Source_003). Represents worst stress level reached across the reef jurisdiction in the past 7 days.",
      "cmie_delta_partner": "BAA_BLEACHING_ALERT_AREA",
      "description": "NOAA CRW Virtual Station 7-day maximum Bleaching Alert Area \u2014 jurisdiction-level. Derived from 90th percentile HotSpot/DHW pair across all reef pixels in station boundary. Complements point-level BAA from Source_003."
    },
    "FPI": {
      "module": "GKIN",
      "type": "float",
      "unit": "0\u201310 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_008",
      "variable_key": "apparent_fishing_hours",
      "normalize_fn": "normalizeFPI",
      "normalize_type": "log10_linear_negative",
      "direction": "NEGATIVE",
      "direction_note": "Higher FPI = less fishing pressure = better reef condition. No inversion needed \u2014 low score means high pressure.",
      "formula": "FPI = 10 \u00d7 (1 \u2212 (log10(totalHours) \u2212 LOG_MIN) / (LOG_MAX \u2212 LOG_MIN))",
      "normalization_params": {
        "LOG_MIN": -1.0,
        "LOG_MAX": 4.0,
        "zero_hours": "FPI = 10.0 (no AIS fishing detected)",
        "reference_aoi": "\u00b10.5\u00b0 bounding box (~55km radius, ~9,500 km\u00b2)",
        "reference_period": "30 days"
      },
      "tier_labels": {
        "PRISTINE": "FPI \u2265 9.0 \u2014 <0.1 total hours, virtually no AIS fishing",
        "LOW_PRESSURE": "FPI 7.5\u20139.0 \u2014 0.1\u201310 total hours, light/occasional",
        "MODERATE_PRESSURE": "FPI 5.5\u20137.5 \u2014 10\u2013500 hours, typical Caribbean reef",
        "HIGH_PRESSURE": "FPI 3.0\u20135.5 \u2014 500\u20135,000 hours, heavy pressure",
        "SEVERE_PRESSURE": "FPI < 3.0 \u2014 >5,000 hours, severely exploited"
      },
      "cmie_integration": {
        "primary_flag": "TROPHIC_CASCADE_RISK",
        "trigger": "FPI < 5.0 AND APEX_PREDATOR_INDEX < 0.3",
        "secondary_flag": "PHASE_SHIFT_FISHING_DRIVER",
        "trigger_2": "FPI < 3.0 AND HERBIVORE_BIOMASS_KG_HA < 200",
        "grin_partners": [
          "APEX_PREDATOR_INDEX",
          "HERBIVORE_BIOMASS_KG_HA",
          "LIONFISH_DENSITY_100M2"
        ]
      },
      "caveat": "AIS vessels only. Non-AIS artisanal fishing not captured. FPI may overestimate health in coastal small-boat fishing regions.",
      "description": "Fishing Pressure Index \u2014 apparent fishing effort (hours) within \u00b10.5\u00b0 AOI over 30-day window, log10-normalized to 0\u201310. Feeds DMAP-CAL\u2122 Tier 2 (fisheries stressor) and CMIE trophic cascade module."
    },
    "RHI_SCORE": {
      "module": "GRIN",
      "type": "float",
      "unit": "0\u201310 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_011",
      "variable_key": "rhi",
      "normalize_fn": "normalizeRHI",
      "normalize_type": "linear_rescale_positive",
      "direction": "POSITIVE",
      "formula": "GROAN_RHI = (RHI_raw \u2212 1) / 4 \u00d7 10",
      "rhi_native_scale": "1\u20135 (Critical to Very Good)",
      "grade_map": {
        "CRITICAL": {
          "rhi": [
            1.0,
            1.5
          ],
          "groan": [
            0.0,
            1.25
          ]
        },
        "POOR": {
          "rhi": [
            1.5,
            2.5
          ],
          "groan": [
            1.25,
            3.75
          ]
        },
        "FAIR": {
          "rhi": [
            2.5,
            3.5
          ],
          "groan": [
            3.75,
            6.25
          ]
        },
        "GOOD": {
          "rhi": [
            3.5,
            4.5
          ],
          "groan": [
            6.25,
            8.75
          ]
        },
        "VERY_GOOD": {
          "rhi": [
            4.5,
            5.0
          ],
          "groan": [
            8.75,
            10.0
          ]
        }
      },
      "2024_country_scores": {
        "MAR_REGIONAL": 2.5,
        "MEXICO": 2.5,
        "BELIZE": 2.5,
        "GUATEMALA": 2.3,
        "HONDURAS": 2.4
      },
      "description": "Reef Health Index from HRI Mesoamerican Reef Report Card, normalized to GROAN 0\u201310 scale. Jurisdictional benchmark for Caribbean validation. MAR coverage only (Mexico/Belize/Guatemala/Honduras). Static \u2014 updated at each biennial HRI Report Card release."
    },
    "AGRRA_DELTA_CORAL": {
      "module": "CMIE",
      "type": "float",
      "unit": "percentage points delta",
      "min": -100,
      "max": 100,
      "source": "Source_011",
      "normalize_fn": "none",
      "direction": "POSITIVE_DELTA",
      "direction_note": "Positive = site above regional coral average (good). Negative = below average.",
      "cmie_flags": {
        "BELOW_REGIONAL_CORAL_AVERAGE": "delta < \u221210 percentage points",
        "ABOVE_REGIONAL_CORAL_AVERAGE": "delta > +15 percentage points"
      },
      "inputs_required": [
        "CORAL_COVER_PCT (GRIN field obs)",
        "MAR country benchmark (Source_011)"
      ],
      "description": "Delta between GRIN field coral cover observation and published HRI/AGRRA regional benchmark for that MAR country. Negative = site performing below country average."
    },
    "AGRRA_DELTA_ALGAE": {
      "module": "CMIE",
      "type": "float",
      "unit": "percentage points delta",
      "min": -100,
      "max": 100,
      "source": "Source_011",
      "normalize_fn": "none",
      "direction": "NEGATIVE_DELTA",
      "direction_note": "Positive = more algae than regional average (bad). Negative = less algae (good).",
      "cmie_flags": {
        "MACROALGAE_ABOVE_REGIONAL_AVERAGE": "delta > +10 percentage points"
      },
      "inputs_required": [
        "ALGAE_COVER_PCT (GRIN field obs)",
        "MAR country benchmark (Source_011)"
      ],
      "description": "Delta between GRIN field fleshy macroalgae cover and published HRI/AGRRA regional benchmark."
    },
    "AGRRA_DELTA_HERBIVORE": {
      "module": "CMIE",
      "type": "float",
      "unit": "kg/ha delta",
      "min": -5000,
      "max": 5000,
      "source": "Source_011",
      "normalize_fn": "none",
      "direction": "POSITIVE_DELTA",
      "direction_note": "Positive = more herbivore biomass than regional average (good). Negative = depleted.",
      "cmie_flags": {
        "HERBIVORE_BIOMASS_CRITICALLY_LOW": "delta < \u221250% of benchmark",
        "HERBIVORE_BIOMASS_ABOVE_AVERAGE": "delta > +50% of benchmark"
      },
      "cmie_compound_flag": {
        "HERBIVORE_COLLAPSE_CONFIRMED": "HERBIVORE_BIOMASS_CRITICALLY_LOW AND FPI < 5.0 (Sources 011+008)"
      },
      "inputs_required": [
        "HERBIVORE_BIOMASS_KG_HA (GRIN field obs)",
        "MAR country benchmark (Source_011)"
      ],
      "description": "Delta between GRIN field herbivore biomass and published HRI/AGRRA regional benchmark. Cross-references FPI (Source_008) in CMIE for compound trophic flag."
    },
    "RED_SEA_RHI": {
      "module": "GSIN",
      "type": "float",
      "unit": "0\u201310 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_010",
      "normalize_fn": "computeRedSeaRHI",
      "normalize_type": "weighted_composite_positive",
      "direction": "POSITIVE",
      "formula": "RED_SEA_RHI = (0.45 \u00d7 coralScore) + (0.30 \u00d7 algaeScore) + (0.25 \u00d7 herbivoreScore)",
      "weights": {
        "coral": 0.45,
        "algae": 0.3,
        "herbivore": 0.25
      },
      "normalization_ranges": {
        "coral_pct": {
          "min": 0,
          "max": 50,
          "note": "Red Sea offshore reefs reach 40-50% cover"
        },
        "algae_pct": {
          "min": 0,
          "max": 50,
          "note": "Inverted \u2014 0% algae = score 10"
        },
        "herbivore_kgha": {
          "min": 0,
          "max": 300,
          "note": "Red Sea reefs are herbivore-dominated"
        }
      },
      "zone_benchmarks": {
        "CENTRAL_RS_OFFSHORE": {
          "coralCover_pct": 40.0,
          "year": 2013,
          "status": "Pre-bleaching baseline"
        },
        "CENTRAL_RS_INSHORE": {
          "coralCover_pct": 15.0,
          "year": 2013,
          "status": "Post-2010 bleaching"
        },
        "SOUTHERN_RS_POST_BLEACH": {
          "coralCover_pct": 4.5,
          "year": 2024,
          "status": "Post-2015 collapse"
        },
        "RED_SEA_REGIONAL": {
          "coralCover_pct": 22.0,
          "year": 2022,
          "status": "Synthesis estimate"
        }
      },
      "data_status": "STATIC_BENCHMARKS \u2014 live data pending KAUST partnership (TODO_LIVE)",
      "description": "Red Sea Reef Health Index \u2014 composite from KAUST/RSRC published benthic and fish survey data. Theater-specific benchmark for GSIN Red Sea proof-of-concept. Activates live data when KAUST_API_ENDPOINT configured."
    },
    "RED_SEA_THERMAL_TOLERANCE_FLAG": {
      "module": "CMIE",
      "type": "enum",
      "values": [
        "APPLY_LOCAL_MMM",
        "MINOR_ADJUSTMENT",
        "NO_ADJUSTMENT"
      ],
      "source": "Source_010",
      "normalize_fn": "recalibrateDHW",
      "direction": "N/A (categorical flag \u2014 triggers DHW recalibration)",
      "theater": "RED_SEA_ONLY",
      "zones": {
        "CENTRAL_RED_SEA": {
          "mmm_c": 30.8,
          "mmm_offset_vs_noaa": 0.8,
          "dhw_false_accumulation_12wk": 9.6,
          "action": "APPLY_LOCAL_MMM"
        },
        "NORTHERN_RED_SEA": {
          "mmm_c": 28.0,
          "mmm_offset_vs_noaa": 0.3,
          "dhw_false_accumulation_12wk": 3.6,
          "action": "MINOR_ADJUSTMENT"
        },
        "SOUTHERN_RED_SEA": {
          "mmm_c": 31.5,
          "mmm_offset_vs_noaa": 1.2,
          "dhw_false_accumulation_12wk": 14.4,
          "action": "APPLY_LOCAL_MMM"
        }
      },
      "cmie_action": "Recalibrate DHW_DEGREE_HEATING_WEEKS (Source_003) using local MMM offset before CMIE scoring. Prevents systematic overestimation of Red Sea thermal stress.",
      "critical_note": "Without this flag, Sources 001/003 DHW can overstate Red Sea stress by up to 14.4\u00b0C-wk in the southern zone \u2014 sufficient to trigger false BLEACHING_ALERT_LEVEL_2.",
      "description": "Red Sea thermal tolerance adjustment flag. Triggers recalibrateDHW() in CMIE when processing Red Sea theater queries. Corrects NOAA CRW global MMM grid underestimation of Red Sea Maximum Monthly Mean temperatures."
    },
    "GBR_CORAL_COVER_SCORE": {
      "module": "GKIN",
      "type": "float",
      "unit": "0\u201310 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_009",
      "normalize_fn": "normalizeCoralCover",
      "normalize_type": "linear_positive",
      "direction": "POSITIVE",
      "formula": "score = min(10, (coralCover_pct / 60) * 10)",
      "2025_benchmarks": {
        "NORTHERN_GBR": {
          "coralCover_pct": 30.0,
          "pre_bleach_2024": 39.8,
          "longTermAvg": 26.6
        },
        "CENTRAL_GBR": {
          "coralCover_pct": 28.6,
          "pre_bleach_2024": 33.2,
          "longTermAvg": 19.8
        },
        "SOUTHERN_GBR": {
          "coralCover_pct": null,
          "pre_bleach_2024": 39.1,
          "note": "Pending post-bleach survey"
        }
      },
      "description": "GBR hard coral cover normalized to 0\u201310. Derived from AIMS LTMP Annual Summary manta tow surveys. Static benchmark \u2014 updated annually each August. Post-2024 mass bleaching event shows 14\u201325% regional declines."
    },
    "GBR_COTS_FLAG": {
      "module": "CMIE",
      "type": "enum",
      "values": [
        "NO_COTS",
        "LOW",
        "ACTIVE_SOME_REEFS",
        "OUTBREAK_ACTIVE"
      ],
      "source": "Source_009",
      "normalize_fn": "none (categorical)",
      "direction": "N/A",
      "cmie_flags": {
        "NO_COTS": null,
        "LOW": "COTS_WATCH",
        "ACTIVE_SOME_REEFS": "COTS_ACTIVE",
        "OUTBREAK_ACTIVE": "COTS_OUTBREAK_ACTIVE"
      },
      "compound_trigger": "COTS_OUTBREAK_ACTIVE + DHW_DEGREE_HEATING_WEEKS > 4 \u2192 COTS_BLEACHING_COMPOUND",
      "2025_status": {
        "NORTHERN_GBR": "LOW",
        "CENTRAL_GBR": "ACTIVE_SOME_REEFS",
        "SOUTHERN_GBR": "OUTBREAK_ACTIVE"
      },
      "description": "Crown-of-Thorns Starfish disturbance level by GBR sector. GBR-specific stressor \u2014 no Caribbean equivalent. COTS outbreaks compound bleaching mortality, particularly on fast-recovering Acropora."
    },
    "GBR_DISTURBANCE_INDEX": {
      "module": "CMIE",
      "type": "float",
      "unit": "0\u201310 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_009",
      "normalize_fn": "computeDisturbanceIndex",
      "normalize_type": "weighted_negative",
      "direction": "NEGATIVE",
      "formula": "score = max(0, 10 - disturbance_points). Weights: MASS_BLEACHING=3.0, COTS_OUTBREAK=2.0, MAJOR_CYCLONE=2.0, MINOR_CYCLONE=1.5, FLOODING=1.0",
      "2025_context": "2024 saw 5th mass bleaching + 2 cyclones + flooding \u2014 highest compound disturbance load in GBR monitoring history",
      "cmie_flag": "COMPOUND_DISTURBANCE_GBR when disturbance_points >= 4.0",
      "description": "Cumulative disturbance index for GBR sector \u2014 bleaching events, COTS outbreaks, cyclones, flooding. Lower score = more disturbance. Used by CMIE to weight coral cover trajectory and recovery probability."
    },
    "AIMS_SST_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b0C",
      "min": 18,
      "max": 35,
      "source": "Source_009",
      "variable_key": "qc_val",
      "normalize_fn": "sstNormalize (Source_001 function)",
      "direction": "NEGATIVE",
      "access": "LIVE \u2014 AIMS Data Platform API (x-api-key required)",
      "doi": "10.25845/5c09bf93f315d",
      "coverage_sites": "~80 GBR sites + 16 Coral Sea sites",
      "note": "In-situ logger SST \u2014 complements Source_001 satellite SST. Higher spatial resolution near reef structures. Use for validation of Source_001 SST values at GBR sites.",
      "description": "In-situ sea surface temperature from AIMS logger network at GBR reef sites. Live API (free key). Used to validate and ground-truth NOAA CoralTemp (Source_001) satellite-derived SST in the GBR theater."
    },
    "EREEFS_DIN_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg N/m\u00b3 (raw) \u2192 \u00b5mol/L (normalized)",
      "min": 0,
      "max": null,
      "source": "Source_012",
      "variable_key": "DIN",
      "normalize_fn": "normalizeDIN",
      "normalize_type": "piecewise_negative",
      "direction": "NEGATIVE",
      "conversion": "\u00b5mol/L = mg_N_m3 / 14.007",
      "thresholds_umolL": {
        "pristine": "<2",
        "oligotrophic": "2\u20135",
        "elevated": "5\u201310",
        "high": "10\u201320",
        "very_high": "20\u201350",
        "eutrophic": ">50"
      },
      "lbsp_flag_trigger": "DIN > 10 \u00b5mol/L \u2192 LBSP_MODELED_ELEVATED; >20 \u00b5mol/L \u2192 LBSP_MODELED_CRITICAL",
      "cmie_chain": "LBSP_MODELED_ELEVATED \u2192 DMAP-CAL\u2122 Tier 2 (nutrient source control)",
      "description": "Modeled dissolved inorganic nitrogen from eReefs BGC. Cloud-free, subsurface. Primary GROAN indicator for land-based nutrient pollution on GBR inshore reefs."
    },
    "EREEFS_TURBIDITY_NTU": {
      "module": "GKIN",
      "type": "float",
      "unit": "NTU",
      "min": 0,
      "max": null,
      "source": "Source_012",
      "variable_key": "Turbidity",
      "normalize_fn": "normalizeTurbidity",
      "normalize_type": "linear_negative",
      "direction": "NEGATIVE",
      "formula": "score = max(0, 10 - (NTU / 2))",
      "thresholds": {
        "clear": "<2 NTU",
        "watch": "2\u20135 NTU",
        "elevated": "5\u201310 NTU",
        "critical": ">10 NTU"
      },
      "lbsp_flag_trigger": "Turbidity > 5 NTU \u2192 LBSP_MODELED_ELEVATED; >10 NTU \u2192 LBSP_MODELED_CRITICAL",
      "cross_validates": "WATER_TURBIDITY_NTU (GKIN field obs)",
      "description": "Modeled turbidity from eReefs BGC. Complements and cross-validates field turbidity measurements. LBSP sediment loading proxy for GBR inshore reefs."
    },
    "EREEFS_TEMP_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "\u00b0C",
      "min": 18,
      "max": 35,
      "source": "Source_012",
      "variable_key": "temp",
      "normalize_fn": "normalizeEreefsTemp",
      "normalize_type": "linear_negative",
      "direction": "NEGATIVE",
      "formula": "score = 10 - ((temp_c - 24) / 6) * 10. Clamped [0,10].",
      "depth": "1.5m surface",
      "cross_validates": "WATER_TEMP_C (Source_001 satellite SST)",
      "description": "Modeled water temperature from eReefs Hydrodynamic model. Subsurface complement to Source_001 satellite SST. Same normalization rubric for direct CMIE comparison."
    },
    "EREEFS_CHL_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg/m\u00b3",
      "min": 0.001,
      "max": null,
      "source": "Source_012",
      "variable_key": "Chl_a_sum",
      "normalize_fn": "normalizeEreefsChl",
      "normalize_type": "log10_linear_negative",
      "direction": "NEGATIVE",
      "transform": "log10",
      "normalize_range": {
        "log_min": -2.0,
        "log_max": 0.3
      },
      "cross_validates": "CHLOROPHYLL_A_MGL (Source_004 satellite Chl-a)",
      "advantage": "Cloud-free modeled product \u2014 fills gaps where satellite (Source_004) is blocked by cloud cover",
      "description": "Modeled total chlorophyll-a from eReefs BGC. Same log10 normalization as satellite Chl-a (Source_004) for direct CMIE comparison. Cloud-free \u2014 fills data gaps during GBR wet season."
    }
  }
}
