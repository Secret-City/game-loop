# Brief 05 — Badge Reader & Raccoon Lure

**Difficulty:** ⚙ · **Bench time:** ~1 day · **Stage:** plant/raccoon (stage 3)

## Mission

Monitor 3 shows a raccoon chewing facility wiring (`3_raccoon_countdown.mp4`). Players
must find the **staff badge** prop and a **granola bar** prop and use them at a wall
reader/feeding hatch to lure the raccoon away (`3_raccoon_win.mp4`; the "loop with
badge" video state confirms a badge is canon). RFID tells the game *which* object was
presented — wrong items get roasted by the LOOP AI.

## Game context

- Videos: `3_raccoon_countdown`, `3_raccoon_win`, `security_3_4` ("loop with badge").
- Sound: `raccoon_loss.mp3` on timeout.
- This is also the room's RFID pattern-setter: the tube (Brief 06) reuses the same
  reader + tag scheme.

## Materials

| Item | Notes | Est. |
|---|---|---|
| RC522 RFID reader ×2 | one behind badge target, one under feeding hatch floor | bin |
| RFID cards ×3 + coin tags ×5 | badge = card in printed holder; tags epoxied inside props | bin |
| Badge prop | printed "SECTOR GAMMA — MAINTENANCE" ID on lanyard, card laminated inside | $5 |
| Granola bar prop | 3D-printed/resin bar, coin tag inside, plus 2 decoy food props with different tags | $10 |
| Small servo + hatch flap | feeding hatch door | bin |
| ESP32 DevKit-C, WS2812 ring | reader glow ring | bin |

## Step-by-step build

1. **Reader stations (½ day).** Wall plate with a badge outline decal + WS2812 ring
   around it (reader hidden behind 3 mm acrylic — RC522 reads through it; verify range
   ≥ 2 cm through your material). Below, a small "WILDLIFE MITIGATION HATCH" with a
   servo flap and the second reader under its floor.
2. **Firmware (¼ day).** Two RC522s on shared SPI, distinct CS pins.
   - `loop/badge/event` → `{"event":"scan","reader":"badge","uid":"04a2..."}`.
   - `loop/badge/cmd`: ring color/pattern, `{"cmd":"hatch","open":true}`, `reset`.
3. **Node-RED (¼ day).** UID→item lookup table. Badge at badge reader → ring green +
   `doors_open.mp3`-style confirm; granola bar in hatch → hatch flap cycles, monitor 3
   switches to `3_raccoon_win.mp4`. Decoy item → ring red, LOOP AI (Brief 09) quips
   ("The raccoon has standards."). Timeout → `raccoon_loss.mp3` + loop penalty.

## Test checklist

- [ ] Both readers identify all 8 tags reliably through the fascia
- [ ] Correct item at correct reader advances the stage + video swap
- [ ] Decoys produce the failure path, not silence
- [ ] Tags survive being dropped / pocketed / sat on

## Stretch goals

- **IR break-beam in the hatch** confirms the item was physically *left* (not just
  waved), so players sacrifice the granola bar for real.
- Animatronic paw (SG90 behind slot) snatches the bar. Maximum delight per dollar.
