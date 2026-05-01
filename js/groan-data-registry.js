console.log("GROAN DATA REGISTRY LOADED — v1.2");

// ============================================================
// groan-data-registry.js
// GROAN™ — Global Reef & Ocean Analytics Network
// Nevado Ranch Camp LLC | All Rights Reserved
//
// 3-LAYER ARCHITECTURE
//   L1 — API Registry        : Named source configs + endpoints
//   L2 — Normalization       : Per-source normalize() → 0–10 scale
//   L3 — Source Arbitration  : Confidence tiers, recency weights,
//                              theater multipliers, conflict rules
//
// ARCHITECTURE: Browser-side, window.GROAN globals
// Compatible with existing sst-ingestion.js pattern
//
// SOURCE INDEX
//   001 — SST            | NOAA CoralTemp (NOAA_DHW, 5km daily)
//   002 — WAVE           | NOAA WaveWatch III
//   003 — DHW / BAA      | NOAA CRW (shares ERDDAP call with 001)
//   004 — CHLOROPHYLL-A  | NASA OceanColor (MODIS-Aqua / VIIRS)
// ============================================================

const GROAN = window.GROAN || {};
window.GROAN = GROAN;
GROAN.registry = GROAN.registry || {};

// ============================================================
// L1 — API REGISTRY
// ============================================================

GROAN.registry.L1 = {

  "001": {
    sourceId        : "001",
    name            : "NOAA CoralTemp SST",
    description     : "Sea Surface Temperature — NOAA CoralTemp 5km product",
    variable        : "SST",
    nativeUnit      : "°C",
    provider        : "NOAA Coral Reef Watch",
    baseUrl         : "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
    dataset         : "NOAA_DHW",
    variableKey     : "CRW_SST",
    updateFrequency : "daily",
    latencyHours    : 24,
    spatialResKm    : 5,
    authRequired    : false,
    theaters        : ["MAR","GBR","RED_SEA","CORAL_TRIANGLE"],
    note            : "Same ERDDAP call as Source_003. Pull SST+DHW+BAA in one request."
  },

  "002": {
    sourceId        : "002",
    name            : "NOAA WaveWatch III",
    description     : "Significant wave height, period, and direction",
    variable        : "WAVE",
    nativeUnit      : "m (Hs)",
    provider        : "NOAA NCEP",
    baseUrl         : "https://nomads.ncep.noaa.gov/cgi-bin/filter_wave_global.pl",
    dataset         : "WW3_GLOBAL",
    variableKey     : "HTSGW_surface",
    updateFrequency : "6-hourly",
    latencyHours    : 6,
    spatialResKm    : 16,
    authRequired    : false,
    theaters        : ["MAR","GBR","RED_SEA","CORAL_TRIANGLE"]
  },

  "003": {
    sourceId        : "003",
    name            : "NOAA CRW — DHW + BAA",
    description     : "Degree Heating Weeks and Bleaching Alert Area categorical product",
    variable        : "DHW_BAA",
    nativeUnit      : "°C-weeks (DHW) / categorical 0-4 (BAA)",
    provider        : "NOAA Coral Reef Watch",
    baseUrl         : "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
    dataset         : "NOAA_DHW",
    variableKeys    : { DHW:"CRW_DHW", BAA:"CRW_BAA", ANOMALY:"CRW_SSTANOMALY" },
    updateFrequency : "daily",
    latencyHours    : 24,
    spatialResKm    : 5,
    authRequired    : false,
    theaters        : ["MAR","GBR","RED_SEA","CORAL_TRIANGLE"],
    note            : "Shares ERDDAP dataset NOAA_DHW with Source_001. Single API call retrieves all variables."
  },

  "004": {
    sourceId          : "004",
    name              : "NASA OceanColor — Chlorophyll-a",
    description       : "Surface chlorophyll-a — nutrient loading and water clarity proxy",
    variable          : "CHLOROPHYLL_A",
    nativeUnit        : "mg/m³",
    provider          : "NASA Ocean Biology Processing Group",
    baseUrl           : "https://oceandata.sci.gsfc.nasa.gov/api/file_search",
    dataset           : "MODISA_L3m_CHL",
    variableKey       : "chlor_a",
    preferredComposite: "8D",
    updateFrequency   : "daily L3 / 8-day composite preferred",
    latencyHours      : 24,
    spatialResKm      : 4,
    authRequired      : true,
    authEnvVar        : "NASA_EARTHDATA_TOKEN",
    theaters          : ["MAR","GBR","RED_SEA","CORAL_TRIANGLE"],
    note              : "log10 transform required before normalization. 8-day composite preferred."
  },

  "005": {
    sourceId        : "005",
    name            : "Copernicus Marine — Global Physics",
    description     : "Salinity, surface currents, mixed layer depth, subsurface temperature",
    variable        : "COPERNICUS_PHY",
    nativeUnit      : "PSU / m/s / m / degrees C",
    provider        : "EU Copernicus Marine Service",
    baseUrl         : "https://nrt.cmems-du.eu/thredds/dodsC/cmems_mod_glo_phy-all_anfc_0.083deg_P1D-m",
    dataset         : "GLOBAL_ANALYSISFORECAST_PHY_001_024",
    variableKeys    : { salinity:"so", currentU:"uo", currentV:"vo", mld:"mlotst", tempSubsurf:"thetao" },
    updateFrequency : "daily NRT",
    latencyHours    : 24,
    spatialResKm    : 8,
    authRequired    : true,
    authMethod      : "Basic (username:password)",
    registrationUrl : "https://marine.copernicus.eu",
    theaters        : ["MAR","GBR","RED_SEA","CORAL_TRIANGLE"],
    note            : "Current speed/direction computed from U+V components. Subsurface temp assessed as delta vs SST from Source_001."
  }

};

// ============================================================
// L2 — NORMALIZATION PIPELINE
// ============================================================

GROAN.registry.normalize = {};

function _clamp(val) {
  return parseFloat(Math.min(10, Math.max(0, val)).toFixed(2));
}

GROAN.registry.normalize.sst = function (rawValue, timestamp, location, theater) {
  var SST_OPTIMAL = 24.0;
  var SST_LETHAL  = 30.0;
  var normalized  = _clamp(10 - ((rawValue - SST_OPTIMAL) / (SST_LETHAL - SST_OPTIMAL)) * 10);
  return {
    sourceId:"001", sourceName:"NOAA CoralTemp SST",
    variable:"WATER_TEMP_C", rawValue:rawValue, rawUnit:"°C",
    normalizedValue:normalized, direction:"negative", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null,
    flags:rawValue>31?["ABOVE_LETHAL_THRESHOLD"]:[]
  };
};

GROAN.registry.normalize.wave = function (rawValue, timestamp, location, theater) {
  var WAVE_STRESS = 3.0;
  var normalized  = _clamp(10 - (rawValue / WAVE_STRESS) * 10);
  return {
    sourceId:"002", sourceName:"NOAA WaveWatch III",
    variable:"WAVE_HEIGHT_M", rawValue:rawValue, rawUnit:"m",
    normalizedValue:normalized, direction:"negative", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null,
    flags:rawValue>4?["EXTREME_WAVE_EVENT"]:[]
  };
};

GROAN.registry.normalize.dhw = function (rawValue, timestamp, location, theater) {
  var score;
  if (rawValue <= 0)       { score = 10.0; }
  else if (rawValue <= 4)  { score = 10 - ((rawValue / 4) * 3); }
  else if (rawValue <= 8)  { score = 7  - (((rawValue - 4) / 4) * 3); }
  else if (rawValue <= 12) { score = 4  - (((rawValue - 8) / 4) * 3); }
  else                     { score = Math.max(0, 1 - ((rawValue - 12) / 4)); }

  var flags = [];
  if (rawValue >= 12)     flags.push("MASS_MORTALITY_RISK");
  else if (rawValue >= 8) flags.push("BLEACHING_ALERT_1");
  else if (rawValue >= 4) flags.push("BLEACHING_WATCH");

  return {
    sourceId:"003", sourceName:"NOAA CRW — DHW",
    variable:"DHW_DEGREE_HEATING_WEEKS", rawValue:rawValue, rawUnit:"°C-weeks",
    normalizedValue:_clamp(score), direction:"negative", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null, flags:flags
  };
};

GROAN.registry.normalize.baa = function (rawValue, timestamp, location, theater) {
  var BAA_SCORES = {0:10.0, 1:7.0, 2:5.0, 3:2.5, 4:0.0};
  var BAA_LABELS = ["NO_STRESS","WATCH","WARNING","ALERT_1","ALERT_2"];
  var intVal     = Math.round(rawValue);
  var score      = BAA_SCORES[intVal] !== undefined ? BAA_SCORES[intVal] : 0.0;
  return {
    sourceId:"003", sourceName:"NOAA CRW — BAA",
    variable:"BAA_BLEACHING_ALERT_AREA", rawValue:intVal, rawUnit:"categorical (0-4)",
    normalizedValue:score, direction:"negative", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null,
    flags:intVal>=3?["BAA_"+(BAA_LABELS[intVal]||"UNKNOWN")]:[]
  };
};

GROAN.registry.normalize.chlorophyll = function (rawValue, timestamp, location, theater) {
  if (rawValue <= 0) {
    return {
      sourceId:"004", sourceName:"NASA OceanColor — Chlorophyll-a",
      variable:"CHLOROPHYLL_A_MGL", rawValue:rawValue, rawUnit:"mg/m³",
      normalizedValue:null, direction:"negative", confidence:"LOW",
      timestamp:timestamp||new Date().toISOString(),
      location:location||null, theater:theater||null,
      flags:["INVALID_VALUE"]
    };
  }
  var LOG_MIN    = Math.log10(0.01);
  var LOG_MAX    = Math.log10(2.0);
  var logVal     = Math.log10(rawValue);
  var normalized = _clamp(10 - ((logVal - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 10);

  var flags = [];
  if (rawValue > 2.0)  flags.push("EUTROPHIC_STRESS");
  if (rawValue > 1.0)  flags.push("ELEVATED_NUTRIENT_LOADING");
  if (rawValue < 0.02) flags.push("ULTRA_OLIGOTROPHIC");

  return {
    sourceId:"004", sourceName:"NASA OceanColor — Chlorophyll-a",
    variable:"CHLOROPHYLL_A_MGL", rawValue:rawValue, rawUnit:"mg/m³",
    normalizedValue:normalized, direction:"negative", confidence:"MODERATE",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null, flags:flags
  };
};

// ============================================================
// L3 — SOURCE ARBITRATION
// ============================================================

GROAN.registry.L3 = {
  "001": {
    sourceId:"001", variable:"WATER_TEMP_C", conflictGroup:"SST",
    conflictPriority:1, defaultWeight:0.20, recencyWeight:0.9,
    staleThresholdHours:48,
    theaterMultipliers:{MAR:1.0,GBR:1.0,RED_SEA:1.1,CORAL_TRIANGLE:1.0}
  },
  "002": {
    sourceId:"002", variable:"WAVE_HEIGHT_M", conflictGroup:"WAVE",
    conflictPriority:1, defaultWeight:0.10, recencyWeight:0.8,
    staleThresholdHours:12,
    theaterMultipliers:{MAR:1.0,GBR:1.2,RED_SEA:0.8,CORAL_TRIANGLE:1.1}
  },
  "003": {
    sourceId:"003", variables:["DHW_DEGREE_HEATING_WEEKS","BAA_BLEACHING_ALERT_AREA"],
    conflictGroup:"THERMAL_STRESS", conflictPriority:1,
    defaultWeight:{DHW:0.25,BAA:0.10}, recencyWeight:0.95,
    staleThresholdHours:48,
    theaterMultipliers:{MAR:1.0,GBR:1.2,RED_SEA:1.3,CORAL_TRIANGLE:1.0}
  },
  "004": {
    sourceId:"004", variable:"CHLOROPHYLL_A_MGL", conflictGroup:"WATER_QUALITY",
    conflictPriority:1, defaultWeight:0.15, recencyWeight:0.6,
    staleThresholdHours:192, compositeOk:true, preferredComposite:"8D",
    theaterMultipliers:{MAR:1.1,GBR:1.2,RED_SEA:0.9,CORAL_TRIANGLE:1.0}
  }
};

GROAN.registry.resolveConflict = function (outputs) {
  if (!outputs || outputs.length === 1) return outputs[0];
  var now = Date.now();
  return outputs.reduce(function (winner, challenger) {
    var wCfg = GROAN.registry.L3[winner.sourceId];
    var cCfg = GROAN.registry.L3[challenger.sourceId];
    if (!wCfg || !cCfg) return winner;
    var wStale = ((now - new Date(winner.timestamp).getTime()) / 3600000) > wCfg.staleThresholdHours;
    var cStale = ((now - new Date(challenger.timestamp).getTime()) / 3600000) > cCfg.staleThresholdHours;
    if (wStale && !cStale) return challenger;
    if (!wStale && cStale) return winner;
    return (wCfg.conflictPriority||99) <= (cCfg.conflictPriority||99) ? winner : challenger;
  });
};

// Source 005 normalize functions delegate to copernicus-ingestion.js
// Registered here for registry completeness
GROAN.registry.normalize.salinity = function(v,t,l,th){ return GROAN.data.copernicus.normalize.salinity(v,t,l,th); };
GROAN.registry.normalize.currentSpeed = function(v,t,l,th){ return GROAN.data.copernicus.normalize.currentSpeed(v,t,l,th); };
GROAN.registry.normalize.mld = function(v,t,l,th){ return GROAN.data.copernicus.normalize.mld(v,t,l,th); };
GROAN.registry.normalize.subSurfTempDelta = function(s,sst,t,l,th){ return GROAN.data.copernicus.normalize.subSurfTempDelta(s,sst,t,l,th); };

// L3 — Source 005 arbitration
GROAN.registry.L3["005"] = {
  sourceId:"005", variables:["SALINITY_PSU","CURRENT_SPEED_MS","MIXED_LAYER_DEPTH_M","SUBSURFACE_TEMP_DELTA_C"],
  conflictGroup:"WATER_COLUMN_PHYSICS", conflictPriority:1,
  defaultWeight:{ salinity:0.10, current:0.08, mld:0.12, subSurf:0.10 },
  recencyWeight:0.85, staleThresholdHours:36,
  theaterMultipliers:{ MAR:1.0, GBR:1.1, RED_SEA:1.2, CORAL_TRIANGLE:1.0 },
  note:"RED_SEA elevated — thermal stratification and MLD are acute bleaching amplifiers in Red Sea basin."
};

GROAN.registry.sources = Object.keys(GROAN.registry.L1);
console.log("GROAN Registry sources loaded:", GROAN.registry.sources);

/*
NEXT IN QUEUE: 005 Copernicus Marine, 006 Allen Coral Atlas,
007 NOAA CRW Virtual Stations, 008 Global Fishing Watch,
009 AIMS LTMP, 010 KAUST/CORDAP, 011 HRI/AGRRA, 012 eReefs CSIRO
*/
