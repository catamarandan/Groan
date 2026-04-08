// noaa_ingest.js
// GROAN™ NOAA Coral Reef Watch Integration (Phase 1)

const NOAA_BASE_URL = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/";

// Example dataset (SST — can expand later)
const DATASET = "jplMURSST41";

async function fetchNOAAData(lat, lon) {
    try {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];

        const query = `${NOAA_BASE_URL}${DATASET}.json?analysed_sst[(${dateStr}T00:00:00Z)][(${lat})][(${lon})]`;

        const response = await fetch(query);
        if (!response.ok) throw new Error("NOAA fetch failed");

        const data = await response.json();

        const sstKelvin = data.table.rows[0][0];
        const tempC = kelvinToCelsius(sstKelvin);

        return {
            temperature_c: round(tempC, 2),
            source: "NOAA_CRW",
            timestamp: now.toISOString()
        };

    } catch (err) {
        console.error("NOAA ERROR:", err);
        return null;
    }
}

// --- HELPERS ---

function kelvinToCelsius(k) {
    return k - 273.15;
}

function round(val, decimals) {
    return Number(Math.round(val + "e" + decimals) + "e-" + decimals);
}

// --- NORMALIZATION HOOK (DO NOT MODIFY ENGINE) ---

function mapNOAAToGROAN(noaaData) {
    if (!noaaData) return null;

    return {
        T: convertTemperatureToStress(noaaData.temperature_c)
    };
}

// Placeholder (connect to your existing standardization layer)
function convertTemperatureToStress(tempC) {
    // Example mapping (adjust later via calibration)
    if (tempC < 26) return 2;
    if (tempC < 28) return 4;
    if (tempC < 30) return 6;
    if (tempC < 31) return 8;
    return 10;
}

export { fetchNOAAData, mapNOAAToGROAN };
