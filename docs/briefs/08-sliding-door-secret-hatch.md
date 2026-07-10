# Brief 08 — Sliding Door & Secret Hatch

**Difficulty:** ⚙⚙⚙⚙ · **Bench time:** ~4 days · **Stage:** room infrastructure

## Mission

Two reveals: (a) a **motorized sliding door** that rumbles open when a stage completes
(`doors_open.mp3` already exists for exactly this moment), and (b) a **secret hatch** —
a bookcase/panel section that pops open on a hidden latch to reveal the microfilm
reader alcove or a clue cache.

## ⚠️ Safety first (re-read README §4)

Both mechanisms gate player movement, so: fail-open on power loss, a mechanical
emergency release reachable by players, pinch protection (current sensing + soft edges),
and never lock the room's actual exit path with anything but the fire-releasing maglock
circuit. Get sign-off before installing.

## Game context

- `doors_open.mp3`, `facility_powerup.mp3` are the audio beats for reveals.
- Dashboard field `security_doors` should reflect door state on screen 9.
- Suggested placements: sliding door gates the timecore alcove (opens after `power`
  stage); secret hatch hides the microfilm reader (opens when the admin-manual code
  `xhjym` is typed).

## Materials

| Item | Notes | Est. |
|---|---|---|
| Sliding door: 60 kg barn-door track + plywood door leaf | industrial paint + rivet detail | $80 |
| 12 V worm-gear DC motor (~30 RPM, high torque) + GT2 belt & idlers, or a 500 mm 12 V linear actuator for a shorter throw | worm gear self-holds without power **but see fail-open note** — pair with a clutch/manual release lever | $45 |
| BTS7960 motor driver | current sensing = pinch detection | $10 |
| Hall limit switches ×2 + door-edge rubber bumper | | bin |
| Secret hatch: 12 V solenoid latch (spring-loaded, fail-open) + gas strut | strut pushes hatch 5 cm proud when released | bin + $15 |
| Concealed hinges, reed switch (hatch closed sensing) | | $15 |
| ESP32 DevKit-C ×1 (drives both), relay/MOSFET board | | bin |

## Step-by-step build

### Sliding door (2.5 days)

1. Hang the door on the barn track; balance it so one finger moves it (players must be
   able to shove it open if all power dies — this is your mechanical fail-open).
2. Belt drive: motor at one end, belt clamped to the door top edge, idler at the far
   end. A belt (not a lead screw) slips harmlessly when a human pushes against it.
3. Limit switches at both ends of travel; rubber bumper on the leading edge.
4. Firmware: `{"cmd":"door","action":"open|close|stop"}`; ramp PWM up/down for a heavy
   mechanical feel; monitor BTS7960 current — spike mid-travel = obstruction → stop and
   reverse 10 cm, publish `{"event":"obstructed"}`.
5. Node-RED: stage-complete → `doors_open.mp3` + open + `security_doors:"OPEN"` on the
   dashboard. Add a low rumble track to the wall audio during motion.

### Secret hatch (1.5 days)

1. Build the hatch as a shelf/panel section on concealed hinges, gas strut inside.
2. Solenoid latch holds it shut; energize-to-release (spring latch = closed with no
   power, but the hatch is a reveal, not an exit, so this is acceptable — players are
   never *contained* by it).
3. Reed switch reports open/closed. Disguise the seam with trim and clutter.
4. Firmware: `{"cmd":"hatch","action":"release"}` → 500 ms solenoid pulse; publish
   `{"event":"hatch","open":true}` when the reed opens.
5. Node-RED: typewriter code `xhjym` accepted → `pop.mp3` + release + LOOP AI line
   ("Archive access granted. Mind the dust.").

## Test checklist

- [ ] Door opens/closes smoothly 50× consecutively; obstruction test with a foam block
  → stops and reverses every time
- [ ] Door movable by hand with power fully cut
- [ ] Hatch releases on command and *never* releases from vibration (slam the wall)
- [ ] `security_doors` on screen 9 always matches reality
- [ ] Emergency release path walked and signed off by a second person

## Stretch goals

- **IR curtain** (break-beam pair across the doorway) pauses door motion while anyone
  is in the opening — proper elevator-style safety and it demos great.
- Hatch "knock detector" (piezo on the panel) as an alternate trigger: knock the rhythm
  from the music stage to pop it early — rewards attentive players.
