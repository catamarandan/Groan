{
  "version": "2.2",
  "updated": "2026-05-20",
  "owner": "Nevado Ranch Camp LLC",
  "system": "GROAN™ — Global Reef & Ocean Analytics Network",
  "notes": "v2.2 — Added GMAIN module (Global Marine Animal Intelligence Network) with 13 DTIs sourced from GMAIN dashboard. Updated modules list to full 11-module architecture. DTI assignments corrected: oceanographic DTIs remain GKIN, interventions remain DMAP-CAL™, outcomes remain CMIE. Stub modules added: GDSIN, GEIN, GOPEN, GPIN, GPLIN, GSMAN (no DTIs yet).",
  "modules": [
    "GRIN",
    "GSIN",
    "GMIN",
    "GKIN",
    "GMAIN",
    "GDSIN",
    "GEIN",
    "GOPEN",
    "GPIN",
    "GPLIN",
    "GSMAN"
  ],
  "layers": [
    "CMIE",
    "DMAP-CAL™",
    "MOOP"
  ],
  "stub_modules": {
    "GDSIN": { "status": "stub", "DTIs": "pending" },
    "GEIN": { "status": "stub", "DTIs": "pending" },
    "GOPEN": { "status": "stub", "DTIs": "pending" },
    "GPIN": { "status": "stub", "DTIs": "pending" },
    "GPLIN": { "status": "stub", "DTIs": "pending" },
    "GSMAN": { "status": "stub", "DTIs": "pending" }
  },
  "source_registry": {
    "Source_001": {
      "name": "NOAA CoralTemp",
      "dataset": "NOAA_DHW",
      "baseUrl": "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
      "variables": ["CRW_SST", "CRW_DHW", "CRW_BAA", "CRW_SSTANOMALY"],
      "resolution_km": 5,
      "update_frequency": "daily",
      "note": "Single ERDDAP call returns SST + DHW + BAA simultaneously. Shared by Source_001 and Source_003."
    },
    "Source_002": {
      "name": "NOAA WaveWatch III",
      "dataset": "WW3_GLOBAL",
      "baseUrl": "https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_global.pl",
      "variables": ["HTSGW_surface"],
      "resolution_km": 16,
      "update_frequency": "6-hourly"
    },
    "Source_003": {
      "name": "NOAA CRW — DHW + BAA",
      "dataset": "NOAA_DHW",
      "baseUrl": "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
      "variables": ["CRW_DHW", "CRW_BAA", "CRW_SSTANOMALY"],
      "resolution_km": 5,
      "update_frequency": "daily",
      "note": "Shares ERDDAP call with Source_001. No additional API request required."
    },
    "Source_004": {
      "name": "NASA OceanColor — Chlorophyll-a",
      "dataset": "MODISA_L3m_CHL",
      "baseUrl": "https://oceandata.sci.gsfc.nasa.gov",
      "variables": ["chlor_a"],
      "resolution_km": 4,
      "preferred_composite": "8D",
      "update_frequency": "daily (8-day composite preferred)",
      "auth_required": true,
      "auth_env_var": "NASA_EARTHDATA_TOKEN",
      "note": "log10 transform required before normalization. 8-day composite preferred over daily to reduce cloud-gap noise."
    },
    "Source_005": {
      "name": "Copernicus Marine — Global Physics Analysis and Forecast",
      "dataset": "GLOBAL_ANALYSISFORECAST_PHY_001_024",
      "baseUrl": "https://nrt.cmems-du.eu/thredds/dodsC/cmems_mod_glo_phy-all_anfc_0.083deg_P1D-m",
      "variables": ["so", "uo", "vo", "mlotst", "thetao"],
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
      "vintage": "2018–2021 (static — PlanetScope composite)",
      "coverage": "30°N–30°S, shallow tropical reefs ≤15 m depth",
      "resolution_m": 5,
      "update_frequency": "static (periodic release updates)",
      "auth_required": false,
      "variables": ["geomorphic_zone", "benthic_class", "reef_extent"],
      "geomorphic_classes": 12,
      "benthic_classes": 7,
      "dependency": "turf.js v6.5.0 (client-side point-in-polygon)",
      "local_data_paths": {
        "benthic": "/data/aca_caribbean_benthic.geojson",
        "geomorphic": "/data/aca_caribbean_geomorphic.geojson",
        "reefExtent": "/data/aca_caribbean_reef_extent.geojson"
      },
      "download_url": "https://allencoralatlas.org/atlas/",
      "todo": "TODO_ENDPOINT — Download Caribbean AOI GeoJSON from allencoralatlas.org/atlas and commit to /data/ before this source is active.",
      "citation": "Allen Coral Atlas (2020). Imagery, maps and monitoring of the world's tropical coral reefs. Zenodo. DOI: 10.5281/zenodo.3833242"
    },
    "Source_007": {
      "name": "NOAA CRW Regional Virtual Stations",
      "dataset": "CRW_5km_Regional_Virtual_Stations_v3.1",
      "baseUrl": "https://coralreefwatch.noaa.gov/product/vs/data/",
      "variables": ["SST_mean", "SST_anomaly", "HotSpot", "DHW", "BAA_7day_max"],
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
      "variables": ["apparent_fishing_hours"],
      "resolution": "LOW (0.1°) / MEDIUM (0.01°) / HIGH (0.001°) — configurable",
      "update_frequency": "Daily NRT (~72hr lag)",
      "time_series_start": "2017",
      "auth_required": true,
      "auth_method": "Bearer token (free API key)",
      "api_key_registration": "https://globalfishingwatch.org/our-apis/",
      "api_key_var": "window.GROAN.config.GFW_API_KEY",
      "rate_limit": "50,000 requests/day",
      "caveat": "AIS vessels only (~70,000). Non-AIS artisanal fishing not detected.",
      "note": "Default AOI: ±0.5° bounding box (~55km) around waypoint. Default period: 30 days."
    },
    "Source_009": {
      "name": "AIMS Long-Term Monitoring Program",
      "shortName": "AIMS_LTMP",
      "components": {
        "live_api": "AIMS Data Platform API v1.0 (SST/temperature — API key required)",
        "benchmarks": "AIMS LTMP Annual Summary Reports (benthic — hardcoded)"
      },
      "live_api_endpoint": "https://api.aims.gov.au/data/v1.0/10.25845/5c09bf93f315d/data",
      "api_key_var": "window.GROAN.config.AIMS_API_KEY",
      "api_key_registration": "https://open-aims.github.io/data-platform/key_request.html",
      "coverage": "Great Barrier Reef — Northern, Central, Southern sectors",
      "theater": "GBR",
      "update_frequency": "Annual (published ~August each year)",
      "auth_required": true,
      "auth_method": "x-api-key header (free registration)"
    },
    "Source_010": {
      "name": "KAUST Red Sea Research Center",
      "components": {
        "KAUST_RSRC": "King Abdullah University of Science and Technology — Red Sea Research Center"
      },
      "dataset": "KAUST/RSRC published survey data",
      "accessMode": "STATIC_HARDCODED + LIVE_STUB (no public REST API currently)",
      "coverage": "Red Sea — Northern, Central (Thuwal, 22°N), Southern zones",
      "auth_required": false,
      "live_endpoint_var": "window.GROAN.config.KAUST_API_ENDPOINT",
      "live_key_var": "window.GROAN.config.KAUST_API_KEY",
      "note": "Data source only. No institutional partnership. Live stub activates when API confirmed."
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
      "updateFrequency": "Biennial (~every 2 years)",
      "auth_required": false,
      "dataUrl": "https://www.healthyreefs.org/en/healthy-reefs-data/report-cards"
    },
    "Source_012": {
      "name": "eReefs CSIRO/AIMS GBR4 Hydrodynamic + BioGeoChemical Model",
      "shortName": "EREEFS_CSIRO",
      "thredds_base": "https://thredds.ereefs.aims.gov.au/thredds/",
      "auth_required": false,
      "coverage": "GBR (~142°E–156°E, 7°S–28°S), 4km resolution",
      "theater": "GBR",
      "update_frequency": "Daily model outputs (NRT)",
      "cors_note": "THREDDS NCSS may be blocked by CORS in browser. Use server-side proxy if blocked."
    }
  },
  "DTIs": {

    "_comment_GRIN": "=== GRIN — Global Reef Intelligence Network ===",

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
      "description": "Crustose coralline algae cover — succession stage indicator"
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
      "description": "Sediment cover on reef substrate — LBSP proxy"
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
      "values": ["healthy", "pale", "partial_bleach", "full_bleach", "recovering", "diseased", "dead"],
      "description": "Dominant coral condition state at survey site"
    },
    "SUCCESSION_STAGE": {
      "module": "GRIN",
      "type": "enum",
      "values": ["pioneer", "transitional", "climax", "arrested"],
      "description": "Ecological succession stage — recovery index input to DMAP-CAL™"
    },
    "PAM_FV_FM": {
      "module": "GRIN",
      "type": "float",
      "unit": "ratio",
      "min": 0,
      "max": 0.75,
      "description": "Fv/Fm quantum yield of PSII. Healthy: 0.55-0.65. Pre-bleach stress: <0.45. Severe dysfunction: <0.30."
    },
    "JUVENILE_CORAL_DENSITY_M2": {
      "module": "GRIN",
      "type": "float",
      "unit": "count/m²",
      "min": 0,
      "max": 500,
      "description": "Juvenile coral density (<4cm diameter) per m² — recruitment signal"
    },
    "HERBIVORE_BIOMASS_KG_HA": {
      "module": "GRIN",
      "type": "float",
      "unit": "kg/ha",
      "min": 0,
      "max": 5000,
      "description": "Herbivore functional group biomass (parrotfish + surgeonfish + urchins)"
    },
    "APEX_PREDATOR_INDEX": {
      "module": "GRIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Apex predator encounter rate normalized to circuit 1 baseline — trophic cascade trigger"
    },
    "LIONFISH_DENSITY_100M2": {
      "module": "GRIN",
      "type": "float",
      "unit": "count/100m²",
      "min": 0,
      "max": 200,
      "description": "Lionfish density per 100m² — herbivore suppression signal distinct from overfishing"
    },
    "SCTLD_PREVALENCE_PCT": {
      "module": "GRIN",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Stony Coral Tissue Loss Disease prevalence at survey site. Non-additive with thermal bleaching."
    },
    "ALGAE_CONTACT_MARGIN_M": {
      "module": "GRIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 100,
      "description": "Total algae-coral contact margin length per transect — allelopathy zone proxy"
    },
    "RSI": {
      "module": "GRIN",
      "type": "float",
      "unit": "0–10 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_006",
      "normalize_fn": "normalizeRSI",
      "formula": "RSI = (0.40 × zoneScore) + (0.40 × benthicScore) + (0.20 × presenceScore)",
      "description": "Reef Structural Integrity Index — composite from ACA geomorphic zone, benthic habitat class, and reef presence."
    },
    "RHI_SCORE": {
      "module": "GRIN",
      "type": "float",
      "unit": "0–10 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_011",
      "normalize_fn": "normalizeRHI",
      "formula": "GROAN_RHI = (RHI_raw − 1) / 4 × 10",
      "description": "Reef Health Index from HRI Mesoamerican Reef Report Card, normalized to GROAN 0–10 scale."
    },
    "GBR_CORAL_COVER_SCORE": {
      "module": "GRIN",
      "type": "float",
      "unit": "0–10 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_009",
      "normalize_fn": "normalizeCoralCover",
      "formula": "score = min(10, (coralCover_pct / 60) * 10)",
      "description": "GBR hard coral cover normalized to 0–10. From AIMS LTMP Annual Summary manta tow surveys."
    },

    "_comment_GSIN": "=== GSIN — Global Seagrass Intelligence Network ===",

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
      "description": "Composite seagrass health — blade density, rhizome architecture, sediment condition"
    },
    "SEAGRASS_CARBON_BURIAL_INDEX": {
      "module": "GSIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Biological pump efficiency proxy — sediment darkness, rhizome intact, no bioturbation"
    },
    "RED_SEA_RHI": {
      "module": "GSIN",
      "type": "float",
      "unit": "0–10 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_010",
      "normalize_fn": "computeRedSeaRHI",
      "formula": "RED_SEA_RHI = (0.45 × coralScore) + (0.30 × algaeScore) + (0.25 × herbivoreScore)",
      "description": "Red Sea Reef Health Index — composite from KAUST/RSRC published benthic and fish survey data."
    },

    "_comment_GMIN": "=== GMIN — Global Mangrove Intelligence Network ===",

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
      "description": "Estimated DOC export capacity to adjacent seagrass/reef — derived from canopy area"
    },

    "_comment_GKIN": "=== GKIN — Global Kelp Intelligence Network (cross-module oceanographic layer) ===",

    "WATER_TEMP_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "°C",
      "min": -2,
      "max": 40,
      "source": "Source_001",
      "variable_key": "CRW_SST",
      "normalize_fn": "sstNormalize",
      "description": "Sea surface temperature from NOAA CoralTemp. Normalized: 24°C=10, 30°C=0."
    },
    "WATER_TEMP_ANOMALY_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "°C",
      "min": -10,
      "max": 10,
      "source": "Source_001",
      "variable_key": "CRW_SSTANOMALY",
      "description": "SST anomaly vs. site MMM baseline."
    },
    "DHW_DEGREE_HEATING_WEEKS": {
      "module": "GKIN",
      "type": "float",
      "unit": "°C-weeks",
      "min": 0,
      "max": 30,
      "source": "Source_003",
      "variable_key": "CRW_DHW",
      "normalize_fn": "dhwNormalize",
      "thresholds": { "watch": 4, "alert_1": 8, "alert_2": 12 },
      "description": "Degree Heating Weeks — primary bleaching predictor. Highest single-variable CMIE weight."
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
      "description": "NOAA CRW Bleaching Alert Area categorical product."
    },
    "CHLOROPHYLL_A_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg/m³",
      "min": 0.001,
      "max": 10,
      "source": "Source_004",
      "variable_key": "chlor_a",
      "normalize_fn": "chlorophyllNormalize",
      "transform": "log10",
      "description": "Surface chlorophyll-a — primary proxy for nutrient/pollution loading."
    },
    "OMEGA_ARAGONITE": {
      "module": "GKIN",
      "type": "float",
      "unit": "dimensionless",
      "min": 0,
      "max": 6,
      "description": "Aragonite saturation state. Critical/tipping: <1.5."
    },
    "NUTRIENT_NP_RATIO": {
      "module": "GKIN",
      "type": "float",
      "unit": "ratio",
      "min": 0,
      "max": 200,
      "description": "DIN:DIP ratio vs. Redfield baseline 16:1."
    },
    "NUTRIENT_DIN_UML": {
      "module": "GKIN",
      "type": "float",
      "unit": "µmol/L",
      "min": 0,
      "max": 500,
      "description": "Dissolved inorganic nitrogen."
    },
    "NUTRIENT_DIP_UML": {
      "module": "GKIN",
      "type": "float",
      "unit": "µmol/L",
      "min": 0,
      "max": 100,
      "description": "Dissolved inorganic phosphorus."
    },
    "WATER_TURBIDITY_NTU": {
      "module": "GKIN",
      "type": "float",
      "unit": "NTU",
      "min": 0,
      "max": 1000,
      "description": "Water turbidity — LBSP sediment proxy"
    },
    "SECCHI_DEPTH_M": {
      "module": "GKIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 50,
      "description": "Secchi disk depth — turbidity proxy"
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
      "description": "Significant wave height (Hs)"
    },
    "THERMOCLINE_DEPTH_M": {
      "module": "GKIN",
      "type": "float",
      "unit": "meters",
      "min": 0,
      "max": 200,
      "description": "Thermocline depth from CTD profile. <50m triggers DVM compression flag."
    },
    "DISSOLVED_OXYGEN_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg/L",
      "min": 0,
      "max": 20,
      "description": "Dissolved oxygen from CTD profile"
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
      "description": "Sea surface salinity. Parabolic normalization — optimal near 35 PSU."
    },
    "CURRENT_SPEED_MS": {
      "module": "GKIN",
      "type": "float",
      "unit": "m/s",
      "min": 0,
      "max": 3.0,
      "source": "Source_005",
      "variable_keys": { "U": "uo", "V": "vo" },
      "normalize_fn": "currentSpeedNormalize",
      "normalize_type": "parabolic",
      "optimal_range": [0.05, 0.3],
      "description": "Surface current speed derived from U+V components."
    },
    "CURRENT_DIR_DEG": {
      "module": "GKIN",
      "type": "float",
      "unit": "degrees",
      "min": 0,
      "max": 360,
      "source": "Source_005",
      "description": "Surface current direction (degrees from North)."
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
      "description": "Ocean mixed layer depth. Deeper MLD = greater thermal buffering."
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
      "description": "Subsurface temperature at ~50m assessed as delta vs. SST. Negative delta = thermal refuge."
    },
    "VS_DHW_90PCT": {
      "module": "GKIN",
      "type": "float",
      "unit": "°C-weeks",
      "min": 0,
      "max": 30,
      "source": "Source_007",
      "variable_key": "DHW",
      "normalize_fn": "normalizeDHW",
      "description": "NOAA CRW Virtual Station DHW — 90th percentile of reef pixels in jurisdiction."
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
      "description": "NOAA CRW Virtual Station 7-day maximum Bleaching Alert Area — jurisdiction-level."
    },
    "FPI": {
      "module": "GKIN",
      "type": "float",
      "unit": "0–10 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_008",
      "variable_key": "apparent_fishing_hours",
      "normalize_fn": "normalizeFPI",
      "formula": "FPI = 10 × (1 − (log10(totalHours) − LOG_MIN) / (LOG_MAX − LOG_MIN))",
      "description": "Fishing Pressure Index — apparent fishing effort log10-normalized to 0–10."
    },
    "AIMS_SST_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "°C",
      "min": 18,
      "max": 35,
      "source": "Source_009",
      "variable_key": "qc_val",
      "description": "In-situ SST from AIMS logger network at GBR reef sites."
    },
    "EREEFS_DIN_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg N/m³ (raw) → µmol/L (normalized)",
      "min": 0,
      "max": null,
      "source": "Source_012",
      "variable_key": "DIN",
      "normalize_fn": "normalizeDIN",
      "lbsp_flag_trigger": "DIN > 10 µmol/L → LBSP_MODELED_ELEVATED; >20 µmol/L → LBSP_MODELED_CRITICAL",
      "description": "Modeled dissolved inorganic nitrogen from eReefs BGC."
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
      "description": "Modeled turbidity from eReefs BGC."
    },
    "EREEFS_TEMP_C": {
      "module": "GKIN",
      "type": "float",
      "unit": "°C",
      "min": 18,
      "max": 35,
      "source": "Source_012",
      "variable_key": "temp",
      "normalize_fn": "normalizeEreefsTemp",
      "description": "Modeled water temperature from eReefs Hydrodynamic model."
    },
    "EREEFS_CHL_MGL": {
      "module": "GKIN",
      "type": "float",
      "unit": "mg/m³",
      "min": 0.001,
      "max": null,
      "source": "Source_012",
      "variable_key": "Chl_a_sum",
      "normalize_fn": "normalizeEreefsChl",
      "description": "Modeled total chlorophyll-a from eReefs BGC. Cloud-free — fills satellite data gaps."
    },

    "_comment_GMAIN": "=== GMAIN — Global Marine Animal Intelligence Network ===",

    "MARINE_ANIMAL_HEALTH_SCORE": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Composite marine animal health index across monitored species and populations at survey site."
    },
    "SPECIES_ABUNDANCE_INDEX": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Normalized species abundance index — encounter rates relative to baseline across monitored taxa."
    },
    "TOTAL_BIOMASS_PG_CARBON": {
      "module": "GMAIN",
      "type": "float",
      "unit": "PgC",
      "min": 0,
      "max": 10,
      "description": "Total marine animal biomass expressed as petagrams of carbon. Global synthesis metric."
    },
    "MIGRATION_DISTANCE_KM_YR": {
      "module": "GMAIN",
      "type": "float",
      "unit": "km/yr",
      "min": 0,
      "max": 100000,
      "description": "Average annual migration distance across tracked species populations."
    },
    "POPULATION_TREND_PCT_YR": {
      "module": "GMAIN",
      "type": "float",
      "unit": "%/yr",
      "min": -100,
      "max": 100,
      "description": "Year-over-year population trend. Negative = decline. Feeds CMIE trophic cascade module."
    },
    "HIGH_RISK_SPECIES_COUNT": {
      "module": "GMAIN",
      "type": "integer",
      "unit": "count",
      "min": 0,
      "max": 10000,
      "description": "Count of species at high risk (threatened/endangered/critically endangered) within survey AOI."
    },
    "GMAIN_THREAT_OVERFISHING": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "cmie_partner": "FPI",
      "description": "Overfishing threat index for marine animal populations. Cross-validates with FPI (GKIN/Source_008)."
    },
    "GMAIN_THREAT_HABITAT_DEGRADATION": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "cmie_partners": ["MANGROVE_CANOPY_INDEX", "SEAGRASS_COVER_PCT", "CORAL_COVER_PCT"],
      "description": "Habitat degradation threat index — integrates reef, seagrass, and mangrove condition signals."
    },
    "GMAIN_THREAT_OCEAN_WARMING": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "cmie_partners": ["DHW_DEGREE_HEATING_WEEKS", "WATER_TEMP_ANOMALY_C"],
      "description": "Ocean warming threat index for marine animal populations. Derived from thermal stress DTIs."
    },
    "GMAIN_THREAT_NOISE_POLLUTION": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Anthropogenic noise pollution threat index — vessel traffic, seismic, sonar exposure."
    },
    "GMAIN_THREAT_BYCATCH": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "cmie_partner": "FPI",
      "description": "Bycatch risk index — non-target species mortality from fishing activity in AOI."
    },
    "GMAIN_THREAT_PREY_DECLINE": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "cmie_partners": ["HERBIVORE_BIOMASS_KG_HA", "CHLOROPHYLL_A_MGL"],
      "description": "Prey availability decline index — forage species depletion across trophic levels."
    },
    "GMAIN_THREAT_PLASTIC_POLLUTION": {
      "module": "GMAIN",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Plastic pollution threat index — ingestion and entanglement risk from marine debris."
    },

    "_comment_MOOP": "=== MOOP — Methodology & Operations ===",

    "TIDAL_PHASE_COMPLIANCE": {
      "module": "MOOP",
      "type": "enum",
      "values": ["compliant", "non_compliant", "flagged_resurvey"],
      "description": "Survey tidal phase vs. circuit 1 anchor (±1hr). Non-compliant data cannot enter longitudinal cover trend."
    },
    "IMAGE_CONFIDENCE_TIER": {
      "module": "MOOP",
      "type": "enum",
      "values": ["high", "moderate", "low"],
      "description": "GSIN image confidence tier assigned at ingestion. High>85%, Moderate 60-85%, Low<60%."
    },
    "OBSERVER_PAIR_CALIBRATED": {
      "module": "MOOP",
      "type": "enum",
      "values": ["certified", "provisional", "failed"],
      "description": "Observer pair calibration status from Banco Chinchorro standard transect."
    },

    "_comment_CMIE": "=== CMIE — Cross-Module Intelligence Engine ===",

    "CMIE_CASCADE_FLAG": {
      "module": "CMIE",
      "type": "enum",
      "values": [
        "none", "trophic_cascade", "lbsp_upstream", "thermal_pre_bleach",
        "sctld_compound", "phase_shift_proximity", "compounding_pulse",
        "lbsp_modeled_elevated", "lbsp_modeled_critical"
      ],
      "description": "Cross-module interaction signal type. Multiple flags allowed per site per circuit."
    },
    "CMIE_PHASE_SHIFT_PROXIMITY": {
      "module": "CMIE",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Proximity to coral-algae phase shift threshold. Weighted by hysteresis asymmetry."
    },
    "CMIE_RESILIENCE_INDEX": {
      "module": "CMIE",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Estimated reef resilience — rate of recovery between disturbance events across circuits."
    },
    "CMIE_RESISTANCE_INDEX": {
      "module": "CMIE",
      "type": "float",
      "unit": "index",
      "min": 0,
      "max": 1,
      "description": "Estimated reef resistance — magnitude of disturbance survived without phase shift."
    },
    "COVER_TRAJECTORY": {
      "module": "CMIE",
      "type": "enum",
      "values": ["recovering", "stable", "declining", "accelerating_decline", "insufficient_data"],
      "description": "Multi-circuit coral cover trajectory. Requires ≥2 circuits."
    },
    "OUTCOME_SIGNAL": {
      "module": "CMIE",
      "type": "enum",
      "values": ["improved", "stable", "declined", "critical"],
      "description": "Circuit-over-circuit outcome classification from CMIE"
    },
    "AGRRA_DELTA_CORAL": {
      "module": "CMIE",
      "type": "float",
      "unit": "percentage points delta",
      "min": -100,
      "max": 100,
      "source": "Source_011",
      "description": "Delta between GRIN field coral cover and published HRI/AGRRA regional benchmark."
    },
    "AGRRA_DELTA_ALGAE": {
      "module": "CMIE",
      "type": "float",
      "unit": "percentage points delta",
      "min": -100,
      "max": 100,
      "source": "Source_011",
      "description": "Delta between GRIN field macroalgae cover and published HRI/AGRRA regional benchmark."
    },
    "AGRRA_DELTA_HERBIVORE": {
      "module": "CMIE",
      "type": "float",
      "unit": "kg/ha delta",
      "min": -5000,
      "max": 5000,
      "source": "Source_011",
      "description": "Delta between GRIN field herbivore biomass and published HRI/AGRRA regional benchmark."
    },
    "RED_SEA_THERMAL_TOLERANCE_FLAG": {
      "module": "CMIE",
      "type": "enum",
      "values": ["APPLY_LOCAL_MMM", "MINOR_ADJUSTMENT", "NO_ADJUSTMENT"],
      "source": "Source_010",
      "theater": "RED_SEA_ONLY",
      "description": "Red Sea thermal tolerance adjustment flag. Triggers DHW recalibration to correct NOAA global MMM underestimation."
    },
    "GBR_COTS_FLAG": {
      "module": "CMIE",
      "type": "enum",
      "values": ["NO_COTS", "LOW", "ACTIVE_SOME_REEFS", "OUTBREAK_ACTIVE"],
      "source": "Source_009",
      "description": "Crown-of-Thorns Starfish disturbance level by GBR sector. GBR-specific stressor."
    },
    "GBR_DISTURBANCE_INDEX": {
      "module": "CMIE",
      "type": "float",
      "unit": "0–10 scale",
      "min": 0.0,
      "max": 10.0,
      "source": "Source_009",
      "normalize_fn": "computeDisturbanceIndex",
      "description": "Cumulative disturbance index for GBR sector — bleaching, COTS, cyclones, flooding."
    },

    "_comment_DMAP": "=== DMAP-CAL™ — Decision Mapping & Calibration ===",

    "DS_SCORE": {
      "module": "DMAP-CAL™",
      "type": "float",
      "unit": "score",
      "min": 0,
      "max": 10,
      "description": "Decision Score: DS = α·E[Benefit] − β·Risk − γ·Cost + δ·Feasibility"
    },
    "DS_LOCAL_DRIVER_PCT": {
      "module": "DMAP-CAL™",
      "type": "float",
      "unit": "%",
      "min": 0,
      "max": 100,
      "description": "Percentage of DS driven by locally actionable stressors (Tier 1-4)."
    },
    "INTERVENTION_TIER": {
      "module": "DMAP-CAL™",
      "type": "integer",
      "min": 1,
      "max": 5,
      "description": "DMAP-CAL™ intervention tier. 1=site-level, 2=local regulation, 3=MPA/watershed, 4=restoration, 5=global advocacy."
    },
    "INTERVENTION_TYPE": {
      "module": "DMAP-CAL™",
      "type": "enum",
      "values": [
        "none", "t1_mooring_buoy", "t1_diver_management", "t1_no_anchor_zone",
        "t1_sunscreen_free_zone", "t2_nutrient_source_control", "t2_sediment_control",
        "t2_fisheries_regulation", "t2_lionfish_removal", "t3_mpa_establishment",
        "t3_watershed_management", "t4_mangrove_restoration", "t4_seagrass_restoration",
        "t4_coral_nursery_outplant", "t5_policy_advocacy"
      ],
      "description": "Specific DMAP-CAL™ intervention — prefixed by tier for routing clarity."
    },
    "OUTCOME_TIME_DAYS": {
      "module": "DMAP-CAL™",
      "type": "integer",
      "unit": "days",
      "min": 0,
      "max": 3650,
      "description": "Expected time to measurable outcome from intervention initiation"
    }

  }
}

