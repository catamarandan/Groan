// sst-ingestion.js
// GROAN™ SST ingestion pipeline — complete drop-in file

const GROAN = window.GROAN || {};
window.GROAN = GROAN;

GROAN.data = GROAN.data || {};
GROAN.data.sst = GROAN.data.sst || {};
GROAN.DATA_LAYER = GROAN.DATA_LAYER || {};
GROAN.DATA_LAYER.SST = GROAN.data.sst;

GROAN.data.sst.config = {
  dataset: "jplMURSST41",
  baseUrl: "https://coastwatch.pfeg.noaa.gov/erddap/griddap",
  minTemp: 24,
  maxTemp: 32
};

GROAN.data.sst.sstFetch = async function (lat, lon) {
  const { baseUrl, dataset } = GROAN.data.sst.config;
  const url = `${baseUrl}/${dataset}.json?analysed_sst[(last)][(${lat})][(${lon})]`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const row = data?.table?.rows?.[0];
    if (!row || typeof row[3] !== "number") {
      throw new Error("Invalid SST response structure");
    }

    const kelvin = row[3];
    const celsius = kelvin - 273.15;

    return {
      sst: parseFloat(celsius.toFixed(2)),
      source: "NOAA ERDDAP",
      dataset,
      timestamp: new Date().toISOString(),
      lat,
      lon
    };
  } catch (err) {
    console.error("SST fetch error:", err);
    return null;
  }
};

GROAN.data.sst.sstNormalize = function (sst) {
  const { minTemp, maxTemp } = GROAN.data.sst.config;
  let normalized = (sst - minTemp) / (maxTemp - minTemp);
  normalized = Math.max(0, Math.min(1, normalized));
  return parseFloat((normalized * 10).toFixed(2));
};

GROAN.data.sst.sstInject = async function (lat, lon) {
  const sstData = await GROAN.data.sst.sstFetch(lat, lon);
  if (!sstData) return null;

  const T = GROAN.data.sst.sstNormalize(sstData.sst);

  if (typeof window.GROAN_INPUT === "undefined") {
    window.GROAN_INPUT = {};
  }
  window.GROAN_INPUT.temperature = T;

  return {
    raw_sst: sstData.sst,
    normalized_T: T,
    timestamp: sstData.timestamp,
    source: sstData.source,
    dataset: sstData.dataset,
    lat: sstData.lat,
    lon: sstData.lon
  };
};

GROAN.data.sst.updateUI = function (data) {
  const sstEl = document.getElementById("sstValue");
  const normEl = document.getElementById("tempNormalized");
  const timeEl = document.getElementById("sstTimestamp");

  if (sstEl) sstEl.textContent = `${data.raw_sst} °C`;
  if (normEl) normEl.textContent = `${data.normalized_T}`;
  if (timeEl) timeEl.textContent = `${data.timestamp} (${data.source})`;
};

GROAN.data.sst.initToggle = function (currentLat, currentLon) {
  const toggle = document.getElementById("liveSSTToggle");
  if (!toggle) return;

  toggle.addEventListener("change", async (e) => {
    if (e.target.checked) {
      const result = await GROAN.data.sst.sstInject(currentLat, currentLon);
      if (result) {
        GROAN.data.sst.updateUI(result);
      }
    }
  });
};

/*
Required HTML snippet:

<label>
  <input type="checkbox" id="liveSSTToggle">
  Use Live SST (NOAA)
</label>

<div>
  SST: <span id="sstValue">--</span><br>
  T (0–10): <span id="tempNormalized">--</span><br>
  Time: <span id="sstTimestamp">--</span>
</div>

Example call:
GROAN.data.sst.initToggle(18.5, -87.2);

Direct injection call:
await GROAN.data.sst.sstInject(18.5, -87.2);
*/
