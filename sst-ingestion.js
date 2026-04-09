GROAN.data.sst.sstFetch = async function (lat, lon) {
  const { baseUrl, dataset } = GROAN.data.sst.config;

  const url = `${baseUrl}/${dataset}.json?analysed_sst[(last)][(${lat})][(${lon})]`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    console.log("NOAA RAW:", data);

    const row = data?.table?.rows?.[0];

    if (!row) {
      throw new Error("No SST data returned");
    }

    // NOAA structure: value is typically first element
    const kelvin = row[0];

    const celsius = kelvin - 273.15;

    console.log("NOAA TEMP (C):", celsius);

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
