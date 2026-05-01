console.log("COPERNICUS MODULE LOADED — Source 005");

// ============================================================
// copernicus-ingestion.js
// GROAN™ — Global Reef & Ocean Analytics Network
// Nevado Ranch Camp LLC | All Rights Reserved
//
// Source 005 — Copernicus Marine Service (CMEMS)
// Variables: Salinity, Surface Currents, Mixed Layer Depth,
//            Subsurface Temperature
//
// Product: GLOBAL_ANALYSISFORECAST_PHY_001_024
// Provider: EU Copernicus Marine Service
// Resolution: 1/12° (~8km)
// Update: Daily NRT (Near Real-Time)
// Auth: Copernicus Marine account required
//       Store credentials in GROAN.config.copernicus
//
// ERDDAP-style access via CMEMS OPeNDAP endpoint
// ============================================================

const GROAN = window.GROAN || {};
window.GROAN = GROAN;
GROAN.data = GROAN.data || {};
GROAN.data.copernicus = GROAN.data.copernicus || {};
GROAN.DATA_LAYER = GROAN.DATA_LAYER || {};
GROAN.DATA_LAYER.COPERNICUS = GROAN.data.copernicus;

// ============================================================
// CONFIG
// ============================================================

GROAN.data.copernicus.config = {
  sourceId        : "005",
  sourceName      : "Copernicus Marine — GLOBAL_ANALYSISFORECAST_PHY_001_024",
  product         : "GLOBAL_ANALYSISFORECAST_PHY_001_024",
  baseUrl         : "https://nrt.cmems-du.eu/thredds/dodsC/cmems_mod_glo_phy-all_anfc_0.083deg_P1D-m",

  // Variable keys within the product
  vars: {
    salinity    : "so",       // Sea water salinity (PSU)
    currentU    : "uo",       // Eastward sea water velocity (m/s)
    currentV    : "vo",       // Northward sea water velocity (m/s)
    tempSubsurf : "thetao",   // Sea water potential temperature at depth (°C)
    mld         : "mlotst"    // Ocean mixed layer thickness (m)
  },

  // Subsurface reference depth for thermal refuge assessment
  // 50m is standard for reef-adjacent thermal refuge analysis
  subSurfDepthM   : 50,

  // Normalization ranges — reef-relevant
  salinity: {
    optimal     : 35.0,   // PSU — typical open Caribbean/Indo-Pacific
    stressLow   : 30.0,   // PSU — freshwater intrusion threshold
    stressHigh  : 40.0    // PSU — hypersaline stress threshold
  },
  current: {
    optimalMin  : 0.05,   // m/s — minimum for reef flushing
    optimalMax  : 0.30,   // m/s — upper moderate current (reef-beneficial)
    stressHigh  : 0.80    // m/s — mechanical stress threshold
  },
  mld: {
    shallow     : 10,     // m — shallow MLD = limited thermal buffering
    deep        : 80      // m — deep MLD = strong thermal buffering
  },
  subSurfTemp: {
    // Assessed as delta from SST — thermal refuge = cooler subsurface
    // Negative delta (subsurface cooler than surface) = refuge potential
    refugeThreshold : -1.5  // °C — delta below SST indicating meaningful refuge
  }
};

// ============================================================
// FETCH — pulls all Copernicus variables for a given lat/lon
// Uses OPeNDAP constraint expression syntax
// Auth via Basic credentials in request header
// ============================================================

GROAN.data.copernicus.fetch = async function (lat, lon, credentials) {
  var cfg    = GROAN.data.copernicus.config;
  var creds  = credentials || GROAN.config && GROAN.config.copernicusCredentials;

  if (!creds || !creds.username || !creds.password) {
    console.error("Copernicus credentials required. Set GROAN.config.copernicusCredentials = {username, password}");
    return null;
  }

  if (typeof lat !== "number" || typeof lon !== "number") {
    throw new Error("fetch requires numeric lat and lon");
  }

  // Build OPeNDAP constraint — last time step, nearest grid point, surface + 50m depth
  var constraints = [
    cfg.vars.salinity    + "[0][0][" + lat + "][" + lon + "]",
    cfg.vars.currentU    + "[0][0][" + lat + "][" + lon + "]",
    cfg.vars.currentV    + "[0][0][" + lat + "][" + lon + "]",
    cfg.vars.mld         + "[0][" + lat + "][" + lon + "]",
    cfg.vars.tempSubsurf + "[0][1][" + lat + "][" + lon + "]"   // index 1 ≈ 50m in most CMEMS products
  ].join(",");

  var url = cfg.baseUrl + ".json?" + constraints;

  try {
    var headers = new Headers();
    headers.append("Authorization", "Basic " + btoa(creds.username + ":" + creds.password));

    var res = await fetch(url, { headers: headers });
    if (!res.ok) throw new Error("HTTP " + res.status + " from Copernicus");

    var data = await res.json();
    console.log("COPERNICUS RAW:", data);

    // Extract values from OPeNDAP JSON response structure
    var salinity    = _extractVal(data, cfg.vars.salinity);
    var currentU    = _extractVal(data, cfg.vars.currentU);
    var currentV    = _extractVal(data, cfg.vars.currentV);
    var mld         = _extractVal(data, cfg.vars.mld);
    var tempSubsurf = _extractVal(data, cfg.vars.tempSubsurf);

    // Compute current speed and direction from U/V components
    var currentSpeed = (currentU !== null && currentV !== null)
      ? parseFloat(Math.sqrt(currentU * currentU + currentV * currentV).toFixed(3))
      : null;

    var currentDir = (currentU !== null && currentV !== null)
      ? parseFloat(((Math.atan2(currentU, currentV) * 180 / Math.PI + 360) % 360).toFixed(1))
      : null;

    return {
      salinity      : salinity    !== null ? parseFloat(salinity.toFixed(2))    : null,
      currentU      : currentU    !== null ? parseFloat(currentU.toFixed(3))    : null,
      currentV      : currentV    !== null ? parseFloat(currentV.toFixed(3))    : null,
      currentSpeed  : currentSpeed,
      currentDir    : currentDir,
      mld           : mld         !== null ? parseFloat(mld.toFixed(1))         : null,
      tempSubsurf   : tempSubsurf !== null ? parseFloat(tempSubsurf.toFixed(2)) : null,
      source        : cfg.sourceName,
      sourceId      : cfg.sourceId,
      timestamp     : new Date().toISOString(),
      lat           : lat,
      lon           : lon
    };

  } catch (err) {
    console.error("Copernicus fetch error:", err);
    return null;
  }
};

// OPeNDAP JSON value extractor
function _extractVal(data, varName) {
  try {
    var v = data[varName];
    if (!v) return null;
    // OPeNDAP JSON nests values under variable name → data array
    var arr = v[varName] || v.data;
    if (!arr) return null;
    // Flatten nested arrays to get scalar
    while (Array.isArray(arr)) arr = arr[0];
    return typeof arr === "number" ? arr : null;
  } catch (e) {
    return null;
  }
}

// ============================================================
// NORMALIZE — all five Copernicus variables
// ============================================================

GROAN.data.copernicus.normalize = {};

// ─────────────────────────────────────────────────────────────
// Salinity Normalize
// Reef-optimal: ~35 PSU (open ocean Caribbean/Indo-Pacific)
// Stress zones: <30 PSU (freshwater intrusion) or >40 PSU (hypersaline)
// Direction: PARABOLIC — optimal near center, stress at both extremes
// Score 10 at 35 PSU → falls symmetrically toward 0 at 30 or 40 PSU
// ─────────────────────────────────────────────────────────────
GROAN.data.copernicus.normalize.salinity = function (rawValue, timestamp, location, theater) {
  var cfg     = GROAN.data.copernicus.config.salinity;
  var optimal = cfg.optimal;
  var range   = Math.max(optimal - cfg.stressLow, cfg.stressHigh - optimal);

  // Parabolic: score = 10 * (1 - ((val - optimal) / range)²)
  var deviation  = (rawValue - optimal) / range;
  var normalized = Math.max(0, Math.min(10, 10 * (1 - deviation * deviation)));
  normalized     = parseFloat(normalized.toFixed(2));

  var flags = [];
  if (rawValue < 30) flags.push("FRESHWATER_INTRUSION");
  if (rawValue > 38) flags.push("HYPERSALINE_STRESS");
  if (rawValue < 33) flags.push("LOW_SALINITY_STRESS");

  return {
    sourceId:"005", sourceName:"Copernicus Marine",
    variable:"SALINITY_PSU", rawValue:rawValue, rawUnit:"PSU",
    normalizedValue:normalized, direction:"parabolic", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null, flags:flags
  };
};

// ─────────────────────────────────────────────────────────────
// Current Speed Normalize
// Moderate current = reef-beneficial (flushing, oxygenation, larval supply)
// Very low = stagnant, thermal accumulation risk
// Very high = mechanical stress, sediment resuspension
// Direction: PARABOLIC — optimal in mid range (0.05–0.30 m/s)
// ─────────────────────────────────────────────────────────────
GROAN.data.copernicus.normalize.currentSpeed = function (rawValue, timestamp, location, theater) {
  var cfg = GROAN.data.copernicus.config.current;

  var normalized;
  if (rawValue >= cfg.optimalMin && rawValue <= cfg.optimalMax) {
    // Optimal zone — score 8–10
    normalized = 10;
  } else if (rawValue < cfg.optimalMin) {
    // Too slow — stagnant penalty
    normalized = Math.max(0, (rawValue / cfg.optimalMin) * 8);
  } else {
    // Too fast — mechanical stress penalty
    normalized = Math.max(0, 10 - (((rawValue - cfg.optimalMax) / (cfg.stressHigh - cfg.optimalMax)) * 10));
  }
  normalized = parseFloat(Math.min(10, normalized).toFixed(2));

  var flags = [];
  if (rawValue < 0.02) flags.push("STAGNANT_CONDITIONS");
  if (rawValue > cfg.stressHigh) flags.push("HIGH_CURRENT_STRESS");

  return {
    sourceId:"005", sourceName:"Copernicus Marine",
    variable:"CURRENT_SPEED_MS", rawValue:rawValue, rawUnit:"m/s",
    normalizedValue:normalized, direction:"parabolic", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null, flags:flags
  };
};

// ─────────────────────────────────────────────────────────────
// Mixed Layer Depth Normalize
// Deeper MLD = greater thermal buffering for reef = higher score
// Shallow MLD during thermal stress = bleaching amplifier
// Direction: POSITIVE (deeper = better)
// ─────────────────────────────────────────────────────────────
GROAN.data.copernicus.normalize.mld = function (rawValue, timestamp, location, theater) {
  var cfg        = GROAN.data.copernicus.config.mld;
  var normalized = parseFloat(Math.min(10, Math.max(0,
    ((rawValue - cfg.shallow) / (cfg.deep - cfg.shallow)) * 10
  )).toFixed(2));

  var flags = [];
  if (rawValue < 15) flags.push("SHALLOW_MLD_BLEACHING_RISK");
  if (rawValue < cfg.shallow) flags.push("CRITICALLY_SHALLOW_MLD");

  return {
    sourceId:"005", sourceName:"Copernicus Marine",
    variable:"MIXED_LAYER_DEPTH_M", rawValue:rawValue, rawUnit:"m",
    normalizedValue:normalized, direction:"positive", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null, flags:flags
  };
};

// ─────────────────────────────────────────────────────────────
// Subsurface Temperature Delta Normalize
// Assessed as DELTA vs. SST (requires SST from Source 001)
// Negative delta (subsurface cooler) = thermal refuge potential
// Positive delta (subsurface warmer) = no refuge, full column stress
// Direction: NEGATIVE delta is beneficial
// ─────────────────────────────────────────────────────────────
GROAN.data.copernicus.normalize.subSurfTempDelta = function (subSurfTemp, sst, timestamp, location, theater) {
  if (subSurfTemp === null || sst === null) {
    return {
      sourceId:"005", sourceName:"Copernicus Marine",
      variable:"SUBSURFACE_TEMP_DELTA_C", rawValue:null, rawUnit:"°C delta",
      normalizedValue:null, direction:"negative", confidence:"LOW",
      timestamp:timestamp||new Date().toISOString(),
      location:location||null, theater:theater||null,
      flags:["INSUFFICIENT_DATA"]
    };
  }

  var delta      = subSurfTemp - sst;               // negative = cooler subsurface = refuge
  var cfg        = GROAN.data.copernicus.config.subSurfTemp;

  // Score: delta of -3°C or cooler = 10 (strong refuge), delta of 0 = 5, delta of +3 = 0
  var normalized = parseFloat(Math.min(10, Math.max(0,
    5 - (delta / 3) * 5
  )).toFixed(2));

  var flags = [];
  if (delta <= cfg.refugeThreshold) flags.push("THERMAL_REFUGE_AVAILABLE");
  if (delta > 0) flags.push("NO_THERMAL_REFUGE");
  if (delta > 1.5) flags.push("FULL_COLUMN_THERMAL_STRESS");

  return {
    sourceId:"005", sourceName:"Copernicus Marine",
    variable:"SUBSURFACE_TEMP_DELTA_C",
    rawValue:parseFloat(delta.toFixed(2)), rawUnit:"°C delta (subsurface − SST)",
    subSurfTemp:subSurfTemp, sst:sst,
    normalizedValue:normalized, direction:"negative", confidence:"HIGH",
    timestamp:timestamp||new Date().toISOString(),
    location:location||null, theater:theater||null, flags:flags
  };
};

// ============================================================
// INJECT — fetch + normalize all variables, write to GROAN_INPUT
// Requires SST from GROAN_INPUT.raw_sst (set by sst-ingestion.js)
// ============================================================

GROAN.data.copernicus.inject = async function (lat, lon, credentials) {
  var raw = await GROAN.data.copernicus.fetch(lat, lon, credentials);
  if (!raw) return null;

  // Pull SST from GROAN_INPUT if available (set by sst-ingestion.js)
  var sst = (window.GROAN_INPUT && window.GROAN_INPUT.raw_sst) || null;

  var N_sal     = GROAN.data.copernicus.normalize.salinity(raw.salinity, raw.timestamp, {lat:lat,lon:lon});
  var N_curr    = GROAN.data.copernicus.normalize.currentSpeed(raw.currentSpeed, raw.timestamp, {lat:lat,lon:lon});
  var N_mld     = GROAN.data.copernicus.normalize.mld(raw.mld, raw.timestamp, {lat:lat,lon:lon});
  var N_sub     = GROAN.data.copernicus.normalize.subSurfTempDelta(raw.tempSubsurf, sst, raw.timestamp, {lat:lat,lon:lon});

  window.GROAN_INPUT = window.GROAN_INPUT || {};
  window.GROAN_INPUT.salinity_score       = N_sal.normalizedValue;
  window.GROAN_INPUT.current_score        = N_curr.normalizedValue;
  window.GROAN_INPUT.mld_score            = N_mld.normalizedValue;
  window.GROAN_INPUT.subsurface_score     = N_sub.normalizedValue;
  window.GROAN_INPUT.copernicus_flags     = [].concat(N_sal.flags, N_curr.flags, N_mld.flags, N_sub.flags);

  var result = {
    raw           : raw,
    scores        : {
      salinity    : N_sal.normalizedValue,
      current     : N_curr.normalizedValue,
      mld         : N_mld.normalizedValue,
      subsurface  : N_sub.normalizedValue
    },
    flags         : window.GROAN_INPUT.copernicus_flags,
    timestamp     : raw.timestamp,
    lat           : lat,
    lon           : lon
  };

  console.log("GROAN COPERNICUS INJECT:", result);
  return result;
};

// ============================================================
// updateUI — writes Copernicus values to DOM elements
// ============================================================

GROAN.data.copernicus.updateUI = function (data) {
  var els = {
    salinity      : document.getElementById("salinityValue"),
    currentSpeed  : document.getElementById("currentSpeedValue"),
    currentDir    : document.getElementById("currentDirValue"),
    mld           : document.getElementById("mldValue"),
    subSurf       : document.getElementById("subSurfTempValue"),
    salScore      : document.getElementById("salinityScore"),
    currScore     : document.getElementById("currentScore"),
    mldScore      : document.getElementById("mldScore"),
    subScore      : document.getElementById("subSurfScore"),
    flags         : document.getElementById("copernicusFlags"),
    timestamp     : document.getElementById("copernicusTimestamp")
  };

  if (els.salinity)     els.salinity.textContent     = data.raw.salinity + " PSU";
  if (els.currentSpeed) els.currentSpeed.textContent = data.raw.currentSpeed + " m/s";
  if (els.currentDir)   els.currentDir.textContent   = data.raw.currentDir + "°";
  if (els.mld)          els.mld.textContent          = data.raw.mld + " m";
  if (els.subSurf)      els.subSurf.textContent      = data.raw.tempSubsurf + " °C";
  if (els.salScore)     els.salScore.textContent     = data.scores.salinity;
  if (els.currScore)    els.currScore.textContent    = data.scores.current;
  if (els.mldScore)     els.mldScore.textContent     = data.scores.mld;
  if (els.subScore)     els.subScore.textContent     = data.scores.subsurface;
  if (els.flags)        els.flags.textContent        = data.flags.length ? data.flags.join(" · ") : "None";
  if (els.timestamp)    els.timestamp.textContent    = data.timestamp + " (Copernicus Marine)";
};

// ============================================================
// initToggle
// ============================================================

GROAN.data.copernicus.initToggle = function (lat, lon, credentials) {
  var toggle = document.getElementById("liveCopernicusToggle");
  if (!toggle) return;

  toggle.addEventListener("change", async function (e) {
    if (e.target.checked) {
      var result = await GROAN.data.copernicus.inject(lat, lon, credentials);
      if (result) GROAN.data.copernicus.updateUI(result);
    }
  });
};

/*
───────────────────────────────────────────────
CREDENTIAL SETUP (call before initToggle)
───────────────────────────────────────────────
// Store credentials once at page init — never hardcode in source:
window.GROAN = window.GROAN || {};
GROAN.config = GROAN.config || {};
GROAN.config.copernicusCredentials = {
  username: "your_copernicus_username",
  password: "your_copernicus_password"
};

// Register at: https://marine.copernicus.eu (free account)

───────────────────────────────────────────────
REQUIRED HTML SNIPPET
───────────────────────────────────────────────
<label>
  <input type="checkbox" id="liveCopernicusToggle">
  Use Live Copernicus Marine Data
</label>
<div>
  Salinity: <span id="salinityValue">--</span> | Score: <span id="salinityScore">--</span><br>
  Current: <span id="currentSpeedValue">--</span> @ <span id="currentDirValue">--</span> | Score: <span id="currentScore">--</span><br>
  MLD: <span id="mldValue">--</span> | Score: <span id="mldScore">--</span><br>
  Subsurface Temp: <span id="subSurfTempValue">--</span> | Score: <span id="subSurfScore">--</span><br>
  Flags: <span id="copernicusFlags">--</span><br>
  Time: <span id="copernicusTimestamp">--</span>
</div>

───────────────────────────────────────────────
EXAMPLE CALLS
───────────────────────────────────────────────
// Initialize toggle (Lighthouse Reef, Belize):
GROAN.data.copernicus.initToggle(17.2, -87.5, GROAN.config.copernicusCredentials);

// Direct inject:
await GROAN.data.copernicus.inject(17.2, -87.5, GROAN.config.copernicusCredentials);

// Normalize salinity only:
GROAN.data.copernicus.normalize.salinity(33.5);  // → score ~7.8

// Normalize MLD only:
GROAN.data.copernicus.normalize.mld(45);         // → score ~5.0

// Normalize current speed only:
GROAN.data.copernicus.normalize.currentSpeed(0.15);  // → score 10.0

// Normalize subsurface delta (requires SST):
GROAN.data.copernicus.normalize.subSurfTempDelta(26.5, 29.0);  // → score ~9.58 (strong refuge)
───────────────────────────────────────────────
*/
