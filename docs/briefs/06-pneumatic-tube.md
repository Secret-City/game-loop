# Brief 06 — Pneumatic Tube Station

**Difficulty:** ⚙⚙⚙⚙ · **Bench time:** ~4 days · **Stage:** cross-stage delivery

## Mission

A working pneumatic tube terminal: players load a capsule, close the door, hit SEND —
the capsule audibly whooshes away to "another department" (actually the GM closet) and,
minutes later, a *reply capsule* arrives carrying the next clue (optionally a freshly
printed AI-generated document — Brief 10). The game validates what players sent:
correct item, contraband, or empty.

## Game context

The repo has three purpose-built sounds and no client code — this prop is pure
Node-RED + hardware, exactly as designed:

- `tube_sent.mp3` — capsule accepted
- `tube_contraband.mp3` — wrong/forbidden item sent
- `tube_notube.mp3` — SEND pressed with no capsule

## Materials

| Item | Notes | Est. |
|---|---|---|
| 2" (50 mm) clear PVC pipe ×3 m + long-sweep bends | player-visible run goes up the wall into the ceiling | $50 |
| Capsule: 2" clear pill capsule / cut acrylic tube w/ felt bumpers ×3 | RFID coin tag epoxied in each cap | $20 |
| 120 mm 12 V centrifugal blower (or shop-vac in GM closet on a relay) | suction beats pressure for short runs | $25 |
| Station box: hinged porthole door + reed switch, capsule cradle | plywood + 3D-printed cradle | $40 |
| RC522 RFID reader | under the cradle — IDs the capsule contents' tag | bin |
| IR break-beam pair ×2 | capsule-present in cradle; capsule-arrived at GM end | bin |
| 12 V solenoid latch | locks the door during "transit" | bin |
| 60 mm illuminated SEND button, ESP32, relay board | | bin |

## Step-by-step build

1. **Route the pipe (1 day).** Station at chest height → clear pipe up the wall →
   through a ceiling/wall grommet → GM closet catch basket (foam-lined). Long-sweep
   bends only; test-roll a weighted capsule through every joint before gluing.
2. **Station box (1 day).** Porthole door (reed switch senses closed; solenoid latch
   locks it). Inside: cradle aligned with pipe mouth, RFID under cradle, IR break-beam
   across it. SEND button + two lamps ("CARRIER PRESENT", "IN TRANSIT") on the fascia.
3. **Airflow (1 day).** Blower at the GM end pulling suction. Seal the station end so
   the door gasket is the main leak. Bench-tune until the capsule reliably completes the
   run in 1–2 s. If the blower is marginal, upgrade to a relay-switched shop-vac —
   inelegant, bulletproof, and the noise is free sound design.
4. **Firmware (½ day).** `loop/tube/event`: `{"event":"send_pressed"}`,
   `{"event":"capsule","present":true}`, `{"event":"uid","uid":"..."}`,
   `{"event":"door","closed":true}`, `{"event":"arrived"}` (GM-end beam).
   `loop/tube/cmd`: `{"cmd":"lock"}`, `{"cmd":"unlock"}`, `{"cmd":"blower","secs":3}`,
   `{"cmd":"lamp","name":"transit","on":true}`, `reset`.
5. **Node-RED (½ day).** SEND pressed:
   - no capsule → `tube_notube.mp3`;
   - door open → LOOP AI: "Seal the carrier door first.";
   - contraband tag → `tube_contraband.mp3`, door stays locked 10 s (naughty);
   - correct tag → lock door, `tube_sent.mp3`, blower 3 s, IN TRANSIT lamp until the
     GM-end beam confirms arrival, then advance the stage.
   Reply direction: GM drops a capsule in the return mouth (gravity or reversed blower),
   station beam fires → CARRIER PRESENT lamp + chime, door unlocks.

## Test checklist

- [ ] 20 consecutive sends with zero stuck capsules
- [ ] All three audio outcomes (sent / contraband / notube) trigger correctly
- [ ] Door cannot be opened during transit; emergency unlock works from GM panel
- [ ] Reply capsule arrival is detected and announced
- [ ] Capsule survives 50 trips (check bumper felt wear)

## Stretch goals

- **In-line thermal printer at the GM end** auto-prints the AI-personalized reply
  document (Brief 10) so the GM just rolls it and drops it in.
- Second station in a later room for player-to-player delivery.
