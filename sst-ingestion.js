// GROAN™ SST INGESTION MODULE (Task 3)
// NOAA ERDDAP → GROAN Temperature Pipeline

// =============================
// CONFIG
// =============================
const GROAN_SST_CONFIG = {
  dataset: "jplMURSST41",
  baseUrl: "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
  minTemp: 24,
  maxTemp: 32
};

// =============================
// FETCH SST (NOAA ERDDAP)
// =============================
async function fetchSST(lat, lon) {
  const url = `${GROAN_SST_CONFIG.baseUrl}/${GROAN_SST_CONFIG.dataset}.json?analysed_sst[(last)][(${lat})][(${lon})]`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const kelvin = data.table.rows[0][3];
    const celsius = kelvin - 273.15;

    return {
      sst: parseFloat(celsius.toFixed(2)),
      source: "NOAA ERDDAP",
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error("SST fetch error:", err);
    return null;
  }
}

// =============================
// NORMALIZE → GROAN SCALE (0–10)
// =============================
function normalizeTemperature(sst) {
  const min = GROAN_SST_CONFIG.minTemp;
  const max = GROAN_SST_CONFIG.maxTemp;

  let normalized = (sst - min) / (max - min);
  normalized = Math.max(0, Math.min(1, normalized));

  return parseFloat((normalized * 10).toFixed(2));
}

// =============================
// INJECT INTO GROAN ENGINE
// =============================
async function injectSST(lat, lon) {
  const sstData = await fetchSST(lat, lon);
  if (!sstData) return null;

  const T = normalizeTemperature(sstData.sst);

  if (typeof GROAN_INPUT !== "undefined") {
    GROAN_INPUT.temperature = T;
  }

  return {
    raw_sst: sstData.sst,
    normalized_T: T,
    timestamp: sstData.timestamp,
    source: sstData.source
  };
}

// =============================
// UI INTEGRATION
// =============================
function initSSTToggle(currentLat, currentLon) {
  const toggle = document.getElementById("liveSSTToggle");
  if (!toggle) return;

  toggle.addEventListener("change", async (e) => {
    if (e.target.checked) {
      const result = await injectSST(currentLat, currentLon);
      if (result) updateUIWithSST(result);
    }
  });
}

// =============================
// UI UPDATE HANDLER
// =============================
function updateUIWithSST(data) {
  const sstEl = document.getElementById("sstValue");
  const normEl = document.getElementById("tempNormalized");
  const timeEl = document.getElementById("sstTimestamp");

  if (sstEl) sstEl.innerText = `${data.raw_sst} °C`;
  if (normEl) normEl.innerText = `${data.normalized_T}`;
  if (timeEl) timeEl.innerText = `${data.timestamp} (${data.source})`;
}

// =============================
// HTML SNIPPET (REQUIRED)
// =============================
/*
<label>
  <input type="checkbox" id="liveSSTToggle">
  Use Live SST (NOAA)
</label>

<div>
  SST: <span id="sstValue">--</span><br>
  T (0–10): <span id="tempNormalized">--</span><br>
  Time: <span id="sstTimestamp">--</span>
</div>
*/

// =============================
// EXPORT (OPTIONAL)
// =============================
export {
  fetchSST,
  normalizeTemperature,
  injectSST,
  initSSTToggle
};
