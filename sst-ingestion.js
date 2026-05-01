console.log("SST MODULE LOADED");

// sst-ingestion.js
// GROAN SST ingestion pipeline
// Source 001 — NOAA CoralTemp (NOAA_DHW dataset)
// FIX 1: Dataset changed from jplMURSST41 → NOAA_DHW (CoralTemp)
//         Single API call returns SST + DHW + BAA simultaneously
// FIX 2: Normalization direction corrected — hotter reef = LOWER score
// FIX 3: Temp range corrected — 24°C (optimal) to 30°C (Alert 1 bleaching threshold)

const GROAN = window.GROAN || {};
window.GROAN = GROAN;
GROAN.data = GROAN.data || {};
GROAN.data.sst = GROAN.data.sst || {};
GROAN.DATA_LAYER = GROAN.DATA_LAYER || {};
GROAN.DATA_LAYER.SST = GROAN.data.sst;

GROAN.data.sst.config = {
  dataset     : "NOAA_DHW",
  baseUrl     : "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
  // NOAA_DHW variable keys
  varSST      : "CRW_SST",
  varDHW      : "CRW_DHW",
  varBAA      : "CRW_BAA",
  varAnomaly  : "CRW_SSTANOMALY",
  // Normalization range
  // FIX 3: 24°C = reef optimal (score 10), 30°C = Alert 1 threshold (score 0)
  tempOptimal : 24,
  tempLethal  : 30,
  // Source identification
  sourceId    : "001",
  sourceName  : "NOAA CoralTemp"
};

// ─────────────────────────────────────────────────────────────
// sstFetch — pulls SST + DHW + BAA in a single ERDDAP call
// Returns raw values for all three variables
// ─────────────────────────────────────────────────────────────
GROAN.data.sst.sstFetch = async function (lat, lon) {
  const { baseUrl, dataset, varSST, varDHW, varBAA } = GROAN.data.sst.config;

  if (typeof lat !== "number" || typeof lon !== "number") {
    throw new Error("sstFetch requires numeric lat and lon");
  }

  // Single ERDDAP call — requests SST, DHW, and BAA simultaneously
  const url = `${baseUrl}/${dataset}.json?${varSST}[(last)][(${lat})][(${lon})],${varDHW}[(last)][(${lat})][(${lon})],${varBAA}[(last)][(${lat})][(${lon})]`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log("NOAA RAW:", data);

    const row = data?.table?.rows?.[0];
    if (!row) throw new Error("Invalid ERDDAP response structure");

    // CoralTemp SST is in °C natively (not Kelvin — unlike jplMURSST41)
    const sst_c = typeof row[0] === "number" ? row[0] : null;
    const dhw   = typeof row[1] === "number" ? row[1] : null;
    const baa   = typeof row[2] === "number" ? row[2] : null;

    if (sst_c === null) throw new Error("SST value missing from response");

    console.log("CoralTemp SST (°C):", sst_c);
    console.log("DHW (°C-weeks):", dhw);
    console.log("BAA (0-4):", baa);

    return {
      sst       : parseFloat(sst_c.toFixed(2)),
      dhw       : dhw !== null ? parseFloat(dhw.toFixed(2)) : null,
      baa       : baa !== null ? Math.round(baa) : null,
      source    : "NOAA CoralTemp",
      sourceId  : "001",
      dataset   : dataset,
      timestamp : new Date().toISOString(),
      lat       : lat,
      lon       : lon
    };

  } catch (err) {
    console.error("SST fetch error:", err);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// sstNormalize — converts raw SST (°C) to 0–10 reef health score
// FIX 2: Direction corrected — higher temp = LOWER score
//   24°C (optimal) → 10
//   30°C (Alert 1) →  0
//   >30°C          →  0 (clamped)
// ─────────────────────────────────────────────────────────────
GROAN.data.sst.sstNormalize = function (tempC) {
  const { tempOptimal, tempLethal } = GROAN.data.sst.config;

  if (typeof tempC !== "number" || Number.isNaN(tempC)) return 0;

  // Inverted normalization: cooler = higher score
  let normalized = 10 - ((tempC - tempOptimal) / (tempLethal - tempOptimal)) * 10;
  normalized = Math.max(0, Math.min(10, normalized));
  return parseFloat(normalized.toFixed(2));
};

// ─────────────────────────────────────────────────────────────
// dhwNormalize — converts DHW (°C-weeks) to 0–10 score
// Piecewise linear across CRW threshold zones:
//   0       → 10.0 (no stress)
//   0–4     → 10→7 (watch zone)
//   4–8     → 7→4  (alert 1 zone)
//   8–12    → 4→1  (alert 2 zone)
//   >12     → →0   (mass mortality zone)
// ─────────────────────────────────────────────────────────────
GROAN.data.sst.dhwNormalize = function (dhw) {
  if (typeof dhw !== "number" || Number.isNaN(dhw)) return null;

  let score;
  if (dhw <= 0)       { score = 10.0; }
  else if (dhw <= 4)  { score = 10 - ((dhw / 4) * 3); }
  else if (dhw <= 8)  { score = 7  - (((dhw - 4) / 4) * 3); }
  else if (dhw <= 12) { score = 4  - (((dhw - 8) / 4) * 3); }
  else                { score = Math.max(0, 1 - ((dhw - 12) / 4)); }

  return parseFloat(Math.max(0, Math.min(10, score)).toFixed(2));
};

// ─────────────────────────────────────────────────────────────
// baaNormalize — converts BAA categorical (0–4) to 0–10 score
//   0 = No Stress  → 10.0
//   1 = Watch       → 7.0
//   2 = Warning     → 5.0
//   3 = Alert 1     → 2.5
//   4 = Alert 2     → 0.0
// ─────────────────────────────────────────────────────────────
GROAN.data.sst.baaNormalize = function (baa) {
  if (typeof baa !== "number" || Number.isNaN(baa)) return null;

  const BAA_SCORES = { 0: 10.0, 1: 7.0, 2: 5.0, 3: 2.5, 4: 0.0 };
  const score = BAA_SCORES[Math.round(baa)];
  return score !== undefined ? score : 0.0;
};

// ─────────────────────────────────────────────────────────────
// sstInject — fetches all three variables, normalizes each,
// writes results to window.GROAN_INPUT for CMIE consumption
// ─────────────────────────────────────────────────────────────
GROAN.data.sst.sstInject = async function (lat, lon) {
  const raw = await GROAN.data.sst.sstFetch(lat, lon);
  if (!raw) return null;

  const T_sst = GROAN.data.sst.sstNormalize(raw.sst);
  const T_dhw = GROAN.data.sst.dhwNormalize(raw.dhw);
  const T_baa = GROAN.data.sst.baaNormalize(raw.baa);

  // Flag generation
  const flags = [];
  if (raw.dhw >= 12) flags.push("MASS_MORTALITY_RISK");
  else if (raw.dhw >= 8)  flags.push("BLEACHING_ALERT_1");
  else if (raw.dhw >= 4)  flags.push("BLEACHING_WATCH");
  if (raw.sst > 31) flags.push("ABOVE_LETHAL_THRESHOLD");
  if (raw.baa >= 3) flags.push(`BAA_ALERT_${raw.baa === 3 ? "1" : "2"}`);

  window.GROAN_INPUT = window.GROAN_INPUT || {};
  window.GROAN_INPUT.temperature    = T_sst;
  window.GROAN_INPUT.dhw_score      = T_dhw;
  window.GROAN_INPUT.baa_score      = T_baa;
  window.GROAN_INPUT.thermal_flags  = flags;

  const result = {
    // Raw values
    raw_sst   : raw.sst,
    raw_dhw   : raw.dhw,
    raw_baa   : raw.baa,
    // Normalized scores (0–10)
    T_sst     : T_sst,
    T_dhw     : T_dhw,
    T_baa     : T_baa,
    // Metadata
    flags     : flags,
    timestamp : raw.timestamp,
    source    : raw.source,
    sourceId  : raw.sourceId,
    dataset   : raw.dataset,
    lat       : lat,
    lon       : lon
  };

  console.log("GROAN SST INJECT:", result);
  return result;
};

// ─────────────────────────────────────────────────────────────
// updateUI — writes all three values to the DOM
// ─────────────────────────────────────────────────────────────
GROAN.data.sst.updateUI = function (data) {
  const els = {
    sst       : document.getElementById("sstValue"),
    dhw       : document.getElementById("dhwValue"),
    baa       : document.getElementById("baaValue"),
    T_sst     : document.getElementById("tempNormalized"),
    T_dhw     : document.getElementById("dhwNormalized"),
    T_baa     : document.getElementById("baaNormalized"),
    timestamp : document.getElementById("sstTimestamp"),
    flags     : document.getElementById("thermalFlags")
  };

  const BAA_LABELS = ["No Stress", "Watch", "Warning", "Alert Level 1", "Alert Level 2"];

  if (els.sst)       els.sst.textContent       = `${data.raw_sst} °C`;
  if (els.dhw)       els.dhw.textContent       = `${data.raw_dhw} °C-weeks`;
  if (els.baa)       els.baa.textContent       = `${BAA_LABELS[data.raw_baa] || "—"} (${data.raw_baa})`;
  if (els.T_sst)     els.T_sst.textContent     = `${data.T_sst}`;
  if (els.T_dhw)     els.T_dhw.textContent     = `${data.T_dhw}`;
  if (els.T_baa)     els.T_baa.textContent     = `${data.T_baa}`;
  if (els.timestamp) els.timestamp.textContent = `${data.timestamp} (${data.source})`;
  if (els.flags)     els.flags.textContent     = data.flags.length ? data.flags.join(" · ") : "None";
};

// ─────────────────────────────────────────────────────────────
// initToggle — attaches live toggle behavior to UI element
// ─────────────────────────────────────────────────────────────
GROAN.data.sst.initToggle = function (currentLat, currentLon) {
  const toggle = document.getElementById("liveSSTToggle");
  if (!toggle) return;

  toggle.addEventListener("change", async (e) => {
    if (e.target.checked) {
      const result = await GROAN.data.sst.sstInject(currentLat, currentLon);
      if (result) GROAN.data.sst.updateUI(result);
    }
  });
};

/*
───────────────────────────────────────────────
REQUIRED HTML SNIPPET (updated for SST + DHW + BAA)
───────────────────────────────────────────────
<label>
  <input type="checkbox" id="liveSSTToggle">
  Use Live NOAA CoralTemp Data
</label>
<div>
  SST: <span id="sstValue">--</span><br>
  DHW: <span id="dhwValue">--</span><br>
  BAA: <span id="baaValue">--</span><br>
  T_sst (0–10): <span id="tempNormalized">--</span><br>
  T_dhw (0–10): <span id="dhwNormalized">--</span><br>
  T_baa (0–10): <span id="baaNormalized">--</span><br>
  Flags: <span id="thermalFlags">--</span><br>
  Time: <span id="sstTimestamp">--</span>
</div>

───────────────────────────────────────────────
EXAMPLE CALLS
───────────────────────────────────────────────
// Initialize toggle (Lighthouse Reef, Belize):
GROAN.data.sst.initToggle(17.2, -87.5);

// Direct injection call:
await GROAN.data.sst.sstInject(17.2, -87.5);

// Normalize SST only (no fetch):
GROAN.data.sst.sstNormalize(28.5); // → 2.50

// Normalize DHW only:
GROAN.data.sst.dhwNormalize(6.0);  // → 5.50

// Normalize BAA only:
GROAN.data.sst.baaNormalize(2);    // → 5.0 (Warning)
───────────────────────────────────────────────
*/

