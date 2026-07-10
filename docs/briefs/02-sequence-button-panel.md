# Brief 02 — Firewall Sequence Button Panel

**Difficulty:** ⚙ · **Bench time:** ~1.5 days · **Stage:** firewall (stage 1)

## Mission

A wall panel of illuminated arcade buttons players must press in the correct order to
drop the facility firewall — the first stage in `SecurityDashboard.jsx`'s
`gameStages` list. Wrong presses trigger `incorrect_buttons.mp3`; the finished sequence
flips the dashboard's `security_firewall` field and plays `sequence_cyber.mp3` /
`firewall_final.mp3` beats.

## Game context

- Sounds already in repo: `sequence_start`, `sequence_locked`, `sequence_cyber`,
  `incorrect_buttons`, `incorrect_sequence`, `puzzle_confirmation`, `attempt_fail`.
- Dashboard field: `security_firewall` (string shown on screen 9) — Node-RED updates it
  when the puzzle solves.
- The *order* should be discoverable elsewhere in the room (e.g. numbered codes shown in
  the white code boxes on monitors 1–8 via the `code` field of camera messages —
  the wall already renders a big number per screen).

## Materials

| Item | Notes | Est. |
|---|---|---|
| 6× 30 mm LED arcade buttons | different colors | bin |
| 1× 60 mm dome button | "EXECUTE" | bin |
| ESP32 DevKit-C | | bin |
| MOSFET board (LED channels) or direct-drive w/ resistors | LEDs in these buttons are 12 V or 5 V — check before wiring | bin |
| ABS/plywood enclosure ~40×20 cm, laser-cut acrylic legend plate | | $20 |

## Step-by-step build

1. **Panel (½ day).** Lay out 6 buttons in a 3×2 grid + EXECUTE below. Laser-cut/engrave
   a legend plate: "FIREWALL OVERRIDE — NODE 1..6". Drill 30/60 mm holes, mount buttons.
2. **Wiring (½ day).** Button contacts → GPIO w/ internal pull-ups. LED per button →
   MOSFET channel. Single JST harness to the ESP32 board on standoffs inside.
3. **Firmware (¼ day).** Platform base plus:
   - `loop/firewall/event` → `{"event":"press","btn":3}`
   - `loop/firewall/cmd`: `{"cmd":"led","btn":3,"on":true}`, `{"cmd":"chase"}`
     (attract-mode LED chase between puzzles), `{"cmd":"lockout","secs":5}` (all LEDs
     flash red-pattern, presses ignored — anti-brute-force), `{"cmd":"reset"}`.
   - Keep ALL game logic in Node-RED — the panel is dumb. This lets the GM change the
     sequence per session without reflashing.
4. **Node-RED flow (¼ day).** Sequence validator: correct press → light that button +
   `pop.mp3`; wrong press → `incorrect_buttons.mp3`, wipe progress, 3 wrong attempts →
   `{"cmd":"lockout"}` + `sequence_locked.mp3`. Full sequence + EXECUTE →
   `puzzle_confirmation.mp3`, dashboard `security_firewall: "DISABLED"`, advance stage.

## Test checklist

- [ ] Attract chase runs at idle; stops when stage becomes active
- [ ] Correct full sequence advances dashboard + sound
- [ ] Wrong press wipes progress audibly; lockout works
- [ ] GM can change the sequence in Node-RED without touching the panel

## Stretch goals

- **IR proximity attract:** an HC-SR501 PIR or VL53L0X time-of-flight sensor makes the
  panel wake and chase only when a player approaches — cheap "the room is alive" magic.
- Per-button RGB (WS2812 rings) so the same panel can host a Simon-says variant later.
