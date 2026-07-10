# Brief 04 — Vent Control Wall (gas stage)

**Difficulty:** ⚙⚙ · **Bench time:** ~2 days · **Stage:** vents (stage 2)

## Mission

A wall-mounted "ventilation manifold": two big industrial levers (INTERNAL / EXTERNAL),
a rotary FLOW selector (INWARD / OUTWARD), and two motorized vent flaps that physically
swing open when players set the correct combination — venting the "gas" shown in
monitor 1's countdown video (`1_gas_countdown.mp4` → `1_gas_win.mp4`).

## Game context

- Dashboard fields driven by this prop: `vents_internal`, `vents_external` ("Open"/"Closed"),
  `vents_flow` ("INWARD"/"OUTWARD") on screen 9.
- Sounds in repo: `vent_open`, `vent_pending`, `vent_successful`, `vent_loss`,
  `sequence_vents`. Monitor 1/2 videos switch on success.
- The win condition (which lever/flow combination) lives in Node-RED so it can vary.

## Materials

| Item | Notes | Est. |
|---|---|---|
| 2× heavy DPDT knife/battleship levers (or gate-valve handles on hall sensors) | the *feel* is the puzzle | $30 |
| 1× rotary cam switch (2-position, panel mount) | FLOW selector | $10 |
| 2× MG996R servos + steel horn linkage | drive the vent flaps | bin |
| 2× 20×20 cm louvered vent grilles (HVAC section) | flaps behind them | $20 |
| 12 V PC fans ×2 | air movement + noise through open vents | $12 |
| ESP32 DevKit-C, MOSFET/relay board, 12 V PSU | | bin |
| Plywood manifold board 120×60 cm + conduit/pipe dressing | | $40 |

## Step-by-step build

1. **Manifold board (1 day).** Mount grilles top corners, levers center, rotary right.
   Dress with EMT conduit and pipe fittings between elements so it reads as plumbing.
   Stencil: "ATMOSPHERIC CONTROL — SECTOR GAMMA".
2. **Flap mechanism (½ day).** Behind each grille, hinge a lightweight flap; MG996R +
   pushrod opens it ~70°. Fan mounted behind blows through when open. Servo and fan on
   separate MOSFET channels.
3. **Sensing (¼ day).** Levers and rotary → GPIO. If using real knife switches DO NOT
   run any real load through them — sense only, low-voltage.
4. **Firmware (¼ day).** Platform base plus:
   - `loop/vents/event` → `{"event":"state","internal":"open","external":"closed","flow":"OUTWARD"}`
     published on every change.
   - `loop/vents/cmd`: `{"cmd":"flaps","open":true}` (servos + fans),
     `{"cmd":"reset"}` (flaps closed, fans off).
5. **Node-RED (¼ day).** On each state change, update dashboard screen-9 fields live
   (players see their levers reflected on the security wall — strong feedback loop).
   Correct combination held 3 s → `{"cmd":"flaps","open":true}` + `vent_open.mp3` +
   `vent_successful.mp3`, switch monitor 1 to `1_gas_win.mp4`, advance stage. Timeout →
   `vent_loss.mp3`.

## Test checklist

- [ ] Every lever/rotary change appears on dashboard screen 9 within ~200 ms
- [ ] Correct combo → flaps open, fans audible, win video plays
- [ ] Reset closes flaps and restores countdown state
- [ ] Levers survive being forced (mechanical end stops, not the switch body)

## Stretch goals

- **Haze reveal:** a small water-based hazer behind one grille puffs "gas" while the
  stage is failing — venting it visually clears the room. Check venue smoke detectors first.
- Pressure gauge (RC servo behind a real gauge face) that tracks the dashboard
  `VENT PRESSURE` bar.
