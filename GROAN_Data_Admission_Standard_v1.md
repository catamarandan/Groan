GROAN Data Admission Standard (DAS v1)
Purpose

Define the rules governing ingestion of all data into the GROAN system.

Only data that is analytically relevant, standardized, and scientifically valid is accepted.

Core Principle

GROAN accepts only data that:

Maps to a valid DTI in the registry
Falls within defined scientific ranges or enums
Can be normalized into a standard unit or category
Contributes to condition, intervention, or outcome modeling

All other data is rejected.

Ingestion Pipeline

All incoming data follows this sequence:

Scrub
Assign DTI
Validate
Normalize
Route
Store

Failure at any stage results in rejection.

Validation Rules
1. DTI Validation
Must exist in dti_registry_v1.json
No undefined or custom DTIs allowed

Reject code:

ERR_NO_DTI
ERR_INVALID_DTI
2. Type Validation
Value must match expected type:
float
integer
enum

Reject code:

ERR_INVALID_TYPE
3. Range Validation
Value must fall within defined min/max

Reject code:

ERR_OUT_OF_RANGE
4. Enum Validation
Value must match one of allowed values

Reject code:

ERR_INVALID_ENUM
5. Time Validation
Timestamp must be valid ISO format

Reject code:

ERR_INVALID_TIME
6. Required Fields

All records must include:

site_id
time
dti
value

Reject code:

ERR_MISSING_FIELD
Imagery Rule

Raw imagery is not accepted.

Imagery must be converted into one or more of the following DTIs:

REEF_BLEACHING_PCT
CORAL_COVER_PCT
ALGAE_COVER_PCT
SEDIMENT_COVER_PCT

Reject code:

ERR_IMG_NO_DERIVED_METRICS
Routing Rules

Each accepted datum is routed to exactly one module:

GRIN → Reef
GSIN → Seagrass
GMIN → Mangrove
GMAIN → Environmental, intervention, and outcome

Routing is determined solely by DTI.

Rejection Policy

All rejected records must return:

status: REJECTED
reason:
original record

No silent failures are permitted.

Acceptance Policy

Accepted records must return:

status: ACCEPTED
module: <GRIN | GSIN | GMIN | GMAIN>
normalized record
System Integrity Rule

GROAN is a closed analytical system.

Data is admitted only if it meets all validation criteria.

No exceptions.
