# LOOP — Physical Prop Build Briefs

Build briefs for the **LOOP / Tower of Time** escape room. Each numbered file in this
folder is a self-contained brief: mission, game context, materials, step-by-step build
plan, firmware/integration notes, and a test checklist. Work through them roughly in
order — the early ones establish the electronics platform everything else reuses.

> **Figma note:** These briefs were written from the codebase (screens, sounds, videos,
> WebSocket contracts, commit history). The Figma prototype
> (`Tower of Time`, node 3540-14796) could not be opened with the connected Figma
> account (patrick@ambition.inc has no access). Once access is granted, cross-check
> each brief's "Game context" section against the Figma flow and adjust set dressing.

---

## 1. The game in one page

Players are trapped in a time-looping research facility ("Harmonics Terminal #0271,
Sector Gamma"). A doom clock — the **7-minute timeline backup timer** on the security
dashboard — counts down while they clear **seven stages in order**:

`firewall → vents → plant → rhythm → maze → power → timecore`

The room's software (this repo) provides five browser kiosks:

| Route | Screen | Physical station |
|---|---|---|
| `/security` | `VideoScreen.jsx` | **9-monitor security wall** (3×3). Screens 1–8 are "camera feeds" (mp4/png loops), screen 9 is the live dashboard. Also the room's audio host (all music + SFX). |
| `/progress` | `SecurityDashboard.jsx` | Standalone dashboard (same component as screen 9). |
| `/dronemap` | `DroneMap.jsx` | **Console 2** — drone pilot (arrow keys + hold-SPACE co-op handoff). |
| `/ventmap` | `VentMap.jsx` | **Console 1** — vent control (other half of the co-op maze). |
| `/microfilm` | `Microfilm.tsx` | **Microfilm reader** — 5-letter code lock → document viewer. |

Story beats visible on the monitors: gas leak vented (1–2), raccoon in the wiring lured
with a badge/granola bar (3), drone rerouted through the maze (4), spy apprehended (5),
scientist kept dancing with music requests (6–7), sleeping guard / facility power (8),
and the Harmonics Core recalibration + finale (9). Key codes: **`iukac`** (recalibration
code, shown on dashboard phase `RCB008` and accepted by the microfilm reader) and
**`xhjym`** (any order — admin manual). Letter art for keys lives in `/public/keys/`
(note: no `d` or `p` glyphs exist — never design a code containing d or p).

## 2. Control architecture (read before building anything)

```
 ┌───────────┐   WiFi/MQTT    ┌────────────────────┐   WebSocket    ┌──────────────┐
 │  ESP32 in │ ─────────────▶ │  Node-RED "brain"  │ ─────────────▶ │ Browser kiosks│
 │ each prop │ ◀───────────── │  towerloop:1880    │ ◀───────────── │ (this repo)   │
 └───────────┘    commands    │  (+ Mosquitto MQTT)│    /ws/wall    └──────────────┘
                              └────────────────────┘    /ws/dronemaze
```

- **Node-RED at `towerloop:1880`** (Tailscale IP `100.111.79.85`) is the game master.
  It owns all game state; the browser screens and the props are dumb peripherals.
- **Screens** listen on two WebSocket channels:
  - `ws://towerloop:1880/ws/dronemaze` — typed messages: `move`, `drone_position`,
    `spacebar_down/up`, `control_update`, `capture_sequence_initiated`, `refresh_page`.
  - `ws://towerloop:1880/ws/wall` — raw objects (optionally arrays of them):
    - camera update: `{screen: 1-8, sequence: "<file in /security/>", highlight: bool, code: "1234"}`
    - dashboard update: `{screen: 9, phase, current_stage, vents_internal, vents_external,
      vents_flow, crystal_integrty, crystal_power, security_doors, security_firewall,
      now_playing, last_backup, game_loops, countdown_end_time, collapse_seconds, sequence}`
      — yes, **`crystal_integrty` is misspelled on purpose**; the client expects it.
    - audio: `{sound_type: "music"|"sound", url: "sounds/vent_open.mp3", volume: 0.5, delay: 0}`
- **Props** should speak **MQTT** to a Mosquitto broker running next to Node-RED.
  Topic convention used throughout these briefs:
  - `loop/<prop>/event` — prop → game (JSON, e.g. `{"event":"key","char":"i"}`)
  - `loop/<prop>/cmd` — game → prop (JSON, e.g. `{"cmd":"unlock"}`)
  - `loop/<prop>/status` — retained heartbeat every 10 s (`{"up":true,"rssi":-55}`)
- Maze geometry comes from `GET http://towerloop:1880/get-drone-map` (`map1` = VentMap,
  `map2` = DroneMap; glyphs `# . S D V G`).
- A broadcast of `{type:"refresh_page"}` on `/ws/dronemaze` reloads every kiosk —
  that plus prop `reset` commands is the full room reset.

## 3. Standard prop platform

Every brief assumes this base recipe so the intern only learns one stack:

- **MCU:** ESP32 DevKit-C (WROOM-32). Use ESP32-S3 where USB-HID is needed (maze consoles).
- **Firmware:** PlatformIO + Arduino framework, `PubSubClient` (MQTT), `ArduinoJson`,
  WiFi with auto-reconnect, OTA updates (`ArduinoOTA`) so props can be reflashed in-wall.
- **Power:** one 12 V 5 A supply per prop cluster; LM2596 buck → 5 V for ESP32/LEDs.
  Never drive servos/solenoids/maglocks from the ESP32 5 V pin.
- **Switching:** logic-level MOSFET boards or 4-channel relay boards for 12 V loads.
- **Common firmware behaviors:** retained status topic, `{"cmd":"reset"}` handler,
  `{"cmd":"test"}` self-test (blink/actuate everything), debounce all switches (25 ms).

### Shared parts bin (buy once)

| Item | Qty | Est. |
|---|---|---|
| ESP32 DevKit-C | 10 | $60 |
| ESP32-S3 DevKit | 3 | $30 |
| 12 V 5 A PSUs | 5 | $60 |
| LM2596 buck converters | 10 | $15 |
| 4-ch relay boards / MOSFET boards | 6 | $30 |
| WS2812B LED strip (60/m) | 5 m | $30 |
| MG996R servos + SG90 servos | 4 + 6 | $40 |
| 12 V solenoid latches (lock-style) | 4 | $40 |
| 12 V maglock 180 kg + Z-bracket | 2 | $50 |
| IR break-beam sensor pairs (5 mm) | 6 | $15 |
| RC522 RFID readers + tags/cards | 3 + 20 | $25 |
| Arcade buttons (LED, 60 mm dome + 30 mm) | 1 + 8 | $35 |
| Reed switches + magnets | 10 | $12 |
| Hall sensors (A3144), microswitches | 10 + 20 | $15 |
| Hookup wire, JST/Dupont, heat-shrink, perfboard | — | $40 |
| **Total** | | **≈ $500** |

## 4. Safety rules (non-negotiable)

1. **Maglocks and door latches must fail OPEN** — power cut = door opens. Wire every
   locked door through the room's emergency-release mushroom button AND the fire system.
   A player must always be able to exit without electricity.
2. Mains stays in the GM closet. Only 12 V and 5 V DC inside the play space.
3. Fuse every 12 V branch. No exposed conductors within player reach; players *will* yank things.
4. Smoke/haze effects: water-based hazer only, verify against the venue's smoke detectors.

## 5. Build order for the intern

| # | Brief | Why this order |
|---|---|---|
| 0 | this README | platform + conventions |
| 1 | [01-typewriter-code-console.md](01-typewriter-code-console.md) | flagship prop, teaches the whole stack |
| 2 | [02-sequence-button-panel.md](02-sequence-button-panel.md) | easy win, firewall stage |
| 3 | [03-maze-coop-consoles.md](03-maze-coop-consoles.md) | physicalizes existing screens |
| 4 | [04-vent-control-wall.md](04-vent-control-wall.md) | vents stage, servo practice |
| 5 | [05-badge-reader-raccoon.md](05-badge-reader-raccoon.md) | RFID, plant/raccoon stage |
| 6 | [06-pneumatic-tube.md](06-pneumatic-tube.md) | biggest mechanical build |
| 7 | [07-harmonics-core-crystal.md](07-harmonics-core-crystal.md) | timecore centerpiece |
| 8 | [08-sliding-door-secret-hatch.md](08-sliding-door-secret-hatch.md) | room infrastructure |
| 9 | [09-loop-ai-voice.md](09-loop-ai-voice.md) | realtime AI character (Claude API) |
| 10 | [10-generative-microfilm.md](10-generative-microfilm.md) | image-gen personalization |
| 11 | [11-gm-control-station.md](11-gm-control-station.md) | ties everything together |

Each brief lists difficulty (⚙ = easy … ⚙⚙⚙⚙ = hard) and an estimated bench time.
Demo each prop end-to-end (physical action → MQTT → Node-RED → screen/sound reaction)
before moving to the next.
