<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## VoltFlow Mate charging history

- Do not assume charging-history data is lost when a chart stops below the session target. First compare `charging_sessions.started_at/stopped_at/current_percent/target_percent` with `bydmate_telemetry_samples.device_time` and delayed samples around the stop time.
- Preserve delayed completion samples: VoltFlow Mate may report target SOC a few minutes after VoltFlow marks a session `completed`.
- When VoltFlow Mate live SOC exists, never auto-complete a charging session from mathematical time-based estimates. Math can drive display fallback only; session completion must wait for fresh live SOC so the 100% cell-voltage tail is captured.
