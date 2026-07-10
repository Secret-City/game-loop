# Brief 07 — Harmonics Core Crystal

**Difficulty:** ⚙⚙⚙ · **Bench time:** ~3 days · **Stage:** timecore (finale centerpiece)

## Mission

The room's hero prop: a glowing crystal core in a pedestal whose light, sound, and
motion mirror the dashboard's crystal state in real time —
`crystal_integrty` (sic): *Calibrated/Stable → Unstable → Critical → Collapsing →
Collapsed* — plus `crystal_power`. During `RCB008` players recalibrate it (typewriter
code, Brief 01) and during the finale (`FNL009`) it goes full drama, synced to
`timeline_collapse.mp3` / `rewind_timeline.mp3`.

## Game context

- Dashboard fields: `crystal_integrty` (**keep the misspelling** — the client key is
  load-bearing), `crystal_power`, `collapse_seconds` (default 10 s collapse countdown).
- Sounds: `timeline_collapse`, `rewind_timeline`, `timeline_backup_pending/successful`,
  `recalibration_*`, `ai_final_message`, `music_victory`, `final_loss`.
- The 7-minute backup timer (`last_backup`, `BACKUP_TIME = 7*60*1000` in
  `SecurityDashboard.jsx`) is the room's doom clock — the crystal should visibly worsen
  as it runs down.

## Materials

| Item | Notes | Est. |
|---|---|---|
| Cast-resin or acrylic "crystal" ~25 cm (or stacked laser-cut acrylic fins) | fins light beautifully edge-on | $40 |
| WS2812B strip (60/m, 1 m) coiled in the base + 8 mm diffusion | | bin |
| NEMA17 stepper + A4988 on a slew ring, 2 RPM | slow crystal rotation | $20 |
| Seismic vibration motor (large eccentric) bolted to pedestal shell | shudder during collapse | $8 |
| 3 W exciter/transducer speaker on the pedestal skin | low hum, physically felt | $10 |
| ESP32 DevKit-C, MOSFETs, 12 V PSU | | bin |
| Pedestal: hex plinth, plywood + PVC "coolant" pipes + gauges | | $60 |

## Step-by-step build

1. **Pedestal (1 day).** Hexagonal plinth ~90 cm tall; crystal under an acrylic bell or
   open cage. Route WS2812 up the center; stepper + slew ring under the crystal mount;
   vibration motor and exciter bolted to inner walls; electronics on a tray behind a
   locked hatch. Dress with pipes into the floor and a real analog gauge
   ("CRYSTAL POWER") driven by a hidden SG90 behind the gauge face.
2. **Firmware — state machine (1 day).** Subscribe `loop/crystal/cmd`:
   `{"cmd":"state","value":"stable|unstable|critical|collapsing|collapsed|rewind|victory"}`
   plus `{"cmd":"power","pct":75}` (gauge servo). Effects per state, all non-blocking:

   | State | LEDs | Motion | Sound (local exciter) |
   |---|---|---|---|
   | stable | slow cyan breathe | 2 RPM rotate | soft 50 Hz hum |
   | unstable | amber flicker | rotation stutters | hum + irregular pulse |
   | critical | red strobing waves | vibration bursts | rising hum |
   | collapsing | violent white/red flash | full shudder, rotation stops | (room plays `timeline_collapse.mp3`) |
   | collapsed | near-dark ember | still | silence |
   | rewind | white sweep bottom→top, reversed rotation | — | (room plays `rewind_timeline.mp3`) |
   | victory | rainbow-gold slow bloom | gentle rotate | (room plays `music_victory.mp3`) |

3. **Node-RED (½ day).** Single function node maps every dashboard screen-9 update to a
   crystal cmd, so the prop can never disagree with the screen. Bind the doom clock:
   as `last_backup` age crosses 4/6 min, force unstable/critical.
4. **Polish (½ day).** Sync test: trigger `FNL009` and tune LED timings against the
   finale audio by ear. Add a GM override row (Brief 11) for every state.

## Test checklist

- [ ] Every `crystal_integrty` value on screen 9 is mirrored by the prop < 300 ms
- [ ] Collapse sequence (10 s `collapse_seconds`) lines up with `timeline_collapse.mp3`
- [ ] Rewind + victory states run clean after a full game cycle + `refresh_page`
- [ ] Vibration motor doesn't walk the pedestal or rattle fasteners loose (thread-lock)
- [ ] 4-hour soak test at "critical" without LED PSU sag

## Stretch goals

- Capacitive touch on the crystal (bare wire → ESP32 touch pin) — touching it during
  `critical` earns a LOOP AI scolding + `ai_security_warning.mp3`.
- UV-reactive resin + hidden UV LEDs: a code appears *inside* the crystal only during
  the finale.
