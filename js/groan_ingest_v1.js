// GROAN Ingestion Engine v1

let DTI_REGISTRY = null;

// Load DTI registry
export async function loadDTI() {
  const res = await fetch('./config/dti_registry_v1.json');
  DTI_REGISTRY = await res.json();
  console.log("DTI Loaded:", DTI_REGISTRY);
  return DTI_REGISTRY;
}

// Reject helper
function reject(reason, record) {
  return { status: "REJECTED", reason, record };
}

// MAIN INGEST FUNCTION
export function ingest(record) {
  try {
    if (!DTI_REGISTRY) throw "ERR_NO_DTI_LOADED";

    if (!record.site_id || !record.time || !record.dti || record.value === undefined) {
      throw "ERR_MISSING_FIELD";
    }

    if (isNaN(Date.parse(record.time))) {
      throw "ERR_INVALID_TIME";
    }

    const rule = DTI_REGISTRY.DTIs[record.dti];
    if (!rule) throw "ERR_INVALID_DTI";

    // Type validation
    if (rule.type === "float" && typeof record.value !== "number") {
      throw "ERR_INVALID_TYPE";
    }

    if (rule.type === "integer" && !Number.isInteger(record.value)) {
      throw "ERR_INVALID_TYPE";
    }

    if (rule.type === "enum" && typeof record.value !== "string") {
      throw "ERR_INVALID_TYPE";
    }

    // Range validation
    if (rule.min !== undefined && record.value < rule.min) {
      throw "ERR_OUT_OF_RANGE";
    }

    if (rule.max !== undefined && record.value > rule.max) {
      throw "ERR_OUT_OF_RANGE";
    }

    // Enum validation
    if (rule.values && !rule.values.includes(record.value)) {
      throw "ERR_INVALID_ENUM";
    }

    // Normalize
    const normalized = {
      ...record,
      time: new Date(record.time).toISOString(),
      unit: rule.unit || null
    };

    return {
      status: "ACCEPTED",
      module: rule.module,
      record: normalized
    };

  } catch (err) {
    return reject(err, record);
  }
}
