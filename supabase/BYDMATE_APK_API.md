# BYDMate APK API Contract

Last updated: 2026-05-26

This file is the handoff contract for the Android APK. Keep it in sync with
`src/lib/bydmate/ingest-payload.ts` and `src/app/api/bydmate/telemetry/route.ts`.

## Endpoint

```http
POST https://<voltflow-domain>/api/bydmate/telemetry
Content-Type: application/json
X-API-Key: <profile bydmate_cloud_api_key>
X-Vehicle-Id: <vehicle_id>
```

`X-Vehicle-Id` must match every sample `vehicle_id`.

## Sample Shape

```ts
{
  schema_version: 1;
  vehicle_id: string;
  device_time: string;
  source: "BYDMate";
  telemetry: Telemetry;
  location: Location;
  diplus?: Diplus | null;
}
```

Rules:

- `schema_version` must be `1`.
- `source` must be `"BYDMate"`.
- `vehicle_id` must be 1..160 chars.
- `device_time` should be ISO-8601, for example `2026-05-26T10:30:00.000Z`.
- `telemetry` is required and must be an object. `{}` is valid.
- `location` is required and must be an object. `{}` is valid.
- `diplus` may be an object, `null`, or omitted.
- Numeric values may be JSON numbers or numeric strings.
- Batch size is 1..300 samples.

## Single Sample

```json
{
  "schema_version": 1,
  "vehicle_id": "way",
  "device_time": "2026-05-26T10:30:00.000Z",
  "source": "BYDMate",
  "telemetry": {
    "soc": 57,
    "speed_kmh": 0,
    "power_kw": -1.2,
    "is_charging": true,
    "charge_power_kw": 7.1
  },
  "diplus": null,
  "location": {}
}
```

## Batch

Preferred batch shape:

```json
{
  "samples": [
    {
      "schema_version": 1,
      "vehicle_id": "way",
      "device_time": "2026-05-26T10:30:00.000Z",
      "source": "BYDMate",
      "telemetry": {
        "soc": 57
      },
      "diplus": null,
      "location": {}
    }
  ]
}
```

A direct JSON array is also accepted:

```json
[
  {
    "schema_version": 1,
    "vehicle_id": "way",
    "device_time": "2026-05-26T10:30:00.000Z",
    "source": "BYDMate",
    "telemetry": {
      "soc": 57
    },
    "location": {}
  }
]
```

## Telemetry

All fields are optional. Unknown extra keys are accepted and preserved in the
raw payload.

```ts
type Telemetry = {
  soc?: number | string | null;
  speed_kmh?: number | string | null;
  power_kw?: number | string | null;
  battery_temp_c?: number | string | null;
  cabin_temp_c?: number | string | null;
  outside_temp_c?: number | string | null;
  battery_voltage_v?: number | string | null;
  aux_voltage_v?: number | string | null;
  cell_voltage_min_v?: number | string | null;
  cell_voltage_max_v?: number | string | null;
  cell_delta_v?: number | string | null;
  diplus_min_cell_voltage_v?: number | string | null;
  diplus_max_cell_voltage_v?: number | string | null;
  diplus_cell_delta_v?: number | string | null;
  odometer_km?: number | string | null;
  soh_percent?: number | string | null;
  is_charging?: boolean | "true" | "false" | null;
  charge_power_kw?: number | string | null;
  charge_type?: string | null;
  kwh_charged?: number | string | null;
  range_est_km?: number | string | null;
  current_trip_distance_km?: number | string | null;
  current_trip_consumption_kwh_100km?: number | string | null;
};
```

Charging samples are stored in live/history telemetry, but they do not create or
extend driving trips. The server treats a sample as charging when any of these
are true:

- `telemetry.is_charging` is true.
- `telemetry.charge_power_kw` is greater than `0.1`.
- `diplus.charging_status` is one of `charging`, `charge`, `active`, `on`,
  `true`, `1`, `yes`.
- `diplus.charge_gun_state` is one of `connected`, `plugged`, `inserted`, `on`,
  `true`, `yes`.

## Location

All fields are optional. `{}` is valid.

```ts
type Location = {
  lat?: number | string | null;
  lon?: number | string | null;
  accuracy_m?: number | string | null;
  bearing_deg?: number | string | null;
};
```

The server may drop suspicious GPS points before persistence.

## Di+

`diplus` may be omitted or set to `null` when Di+ data is unavailable. All
fields are optional. Unknown extra keys are accepted and preserved in the raw
payload.

```ts
type Diplus = {
  soc?: number | string | null;
  speed_kmh?: number | string | null;
  mileage_km?: number | string | null;
  power_kw?: number | string | null;
  charge_gun_state?: string | number | null;
  charging_status?: string | number | null;
  battery_capacity_kwh?: number | string | null;
  total_elec_consumption_kwh?: number | string | null;
  voltage_12v?: number | string | null;
  max_cell_voltage_v?: number | string | null;
  min_cell_voltage_v?: number | string | null;
  cell_delta_v?: number | string | null;
  avg_battery_temp_c?: number | string | null;
  exterior_temp_c?: number | string | null;
  gear?: string | number | null;
  power_state?: string | number | null;
  inside_temp_c?: number | string | null;
  ac_status?: string | number | boolean | null;
  ac_temp_c?: number | string | null;
  fan_level?: number | string | null;
  door_fl?: string | number | boolean | null;
  door_fr?: string | number | boolean | null;
  door_rl?: string | number | boolean | null;
  door_rr?: string | number | boolean | null;
  window_fl_percent?: number | string | null;
  window_fr_percent?: number | string | null;
  window_rl_percent?: number | string | null;
  window_rr_percent?: number | string | null;
  sunroof_percent?: number | string | null;
  trunk?: string | number | boolean | null;
  hood?: string | number | boolean | null;
  tire_press_fl_kpa?: number | string | null;
  tire_press_fr_kpa?: number | string | null;
  tire_press_rl_kpa?: number | string | null;
  tire_press_rr_kpa?: number | string | null;
  drive_mode?: string | number | null;
  work_mode?: string | number | null;
  auto_park?: string | number | boolean | null;
  rain?: string | number | boolean | null;
  light_low?: string | number | boolean | null;
  drl?: string | number | boolean | null;
};
```

## Success Response

```json
{
  "ok": true,
  "persisted": {
    "vehicle_id": "way",
    "received_at": "2026-05-26T10:30:01.000Z",
    "device_time": "2026-05-26T10:30:00.000Z",
    "diplus": {},
    "diplus_min_cell_voltage_v": null,
    "diplus_max_cell_voltage_v": null,
    "diplus_cell_delta_v": null
  },
  "vehicle_id": "way",
  "sample_count": 1,
  "dropped_location_count": 0,
  "dropped_telemetry_field_count": 0,
  "charge_notifications": {
    "sent": 0,
    "thresholds": []
  },
  "received_at": "2026-05-26T10:30:01.000Z",
  "ingest": {
    "duplicate": false
  }
}
```

The exact `ingest` object may include fields such as `duplicate`, `charging`,
`trip_id`, `closed_trip_id`, `sample_count`, `track_point_count`,
`skipped_stale_count`, `vehicle_id`, and `last_device_time`.

## Error Responses

```json
{ "ok": false, "error": "Missing X-Vehicle-Id" }
```

```json
{ "ok": false, "error": "Invalid JSON" }
```

```json
{ "ok": false, "error": "Invalid payload", "issues": {} }
```

```json
{ "ok": false, "error": "Vehicle ID mismatch" }
```

```json
{ "ok": false, "error": "Unauthorized" }
```

```json
{ "ok": false, "error": "Telemetry ingest failed" }
```

## APK Checklist

- Send `X-API-Key` and `X-Vehicle-Id` on every request.
- Keep `X-Vehicle-Id` equal to every sample `vehicle_id`.
- Prefer `{ "samples": [...] }` for batches.
- Send at most 300 samples per request.
- Always send `telemetry` and `location` as objects.
- Use `diplus: null` when Di+ data is unavailable.
- Retry is safe: `(user_id, vehicle_id, device_time)` is idempotent.
