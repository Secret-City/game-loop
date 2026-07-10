# Brief 03 — Drone Maze Co-op Consoles

**Difficulty:** ⚙⚙ · **Bench time:** ~2 days · **Stage:** maze (stage 5)

## Mission

Turn the two existing browser screens (`/dronemap`, `/ventmap`) into proper physical
control stations. Today players use a bare keyboard: arrows move the drone, holding
**SPACE** hands control to the other console (`spacebar_down`/`spacebar_up` messages,
`clientControl` handoff in `DroneMap.jsx`/`VentMap.jsx`). Replace that with an arcade
joystick + a big illuminated "TRANSFER CONTROL" dome button per station, built into two
console desks facing away from each other so the players *must* talk.

## Game context

- `DroneMap.jsx`: arrows move only while `clientControl === 'drone'`; SPACE hold grants
  the other console control. Reaching the goal fires `capture_sequence_initiated`.
- `VentMap.jsx` mirrors this on channel `ws://towerloop:1880/ws/dronemaze`.
- Maze layout served by `GET /get-drone-map` (`map1`/`map2`) — walls differ per console,
  which is why communication is mandatory.

## Materials (per console — build two)

| Item | Notes | Est. |
|---|---|---|
| ESP32-S3 DevKit | **USB-HID keyboard mode** — zero changes to the web app | bin |
| Sanwa-style arcade joystick (4-way microswitch) | up/down/left/right | $15 |
| 60 mm LED dome button | TRANSFER CONTROL (SPACE) | bin |
| 24" monitor + mini-PC/Pi 5 in kiosk mode | already owned per current setup | — |
| Console shell: plywood desk w/ 15° control face | paint industrial grey, stencil "CONSOLE 1/2" | $40 |

## Step-by-step build

1. **Console shells (1 day for both).** Build two lectern-style desks. Monitor recessed
   behind an acrylic window; joystick + dome button on the sloped face; PC and ESP32
   inside on a shelf; ventilation slots; lockable rear door.
2. **Wire the controls (¼ day).** Joystick microswitches and dome button → GPIO with
   pull-ups. Dome LED → MOSFET.
3. **Firmware (¼ day).** The S3 enumerates as a USB keyboard:
   joystick → arrow-key press/release; dome → SPACE press/release (**must send keydown
   on press and keyup on release** — the handoff is hold-based, see `handleKeyUp` in
   `DroneMap.jsx`). Also mirror every input to MQTT `loop/console1|2/event` so Node-RED
   can observe activity, and subscribe to `loop/consoleN/cmd` for
   `{"cmd":"led","mode":"on|off|pulse"}` on the dome.
4. **Node-RED (¼ day).** Light the dome **pulsing** on the console that currently has
   nothing to do (i.e., its partner holds control) — subtly teaching the mechanic.
   On `capture_sequence_initiated`, flash both domes + play `infiltration_apprehended.mp3`.
5. **Dress (¼ day).** Screen bezel decals matching the "HARMONICS TERMINAL" header bar,
   laminated mini-manual ("HOLD TRANSFER TO GRANT REMOTE PILOT AUTHORITY").

## Test checklist

- [ ] Arrow inputs move the drone only when that console has control
- [ ] Holding TRANSFER grants the partner console control; releasing revokes it
- [ ] Rapid joystick wiggling never sticks a key down (test keyup on every edge)
- [ ] Goal reached → capture modal on screen + both domes flash
- [ ] Kiosk auto-recovers after `refresh_page` broadcast and after power cycle

## Stretch goals

- Rumble: a small vibration motor under each palm rest pulses on wall collisions
  (Node-RED already sees every blocked `move`).
- Altitude lever (potentiometer) as future input — commit `360a1c6` shows up/down was
  once controlled by VentMap; a lever would restore that beat physically.
