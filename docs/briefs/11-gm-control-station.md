# Brief 11 — Game Master Control Station

**Difficulty:** ⚙⚙ · **Bench time:** ~2 days · **Stage:** meta (ships last)

## Mission

One place from which a single GM can run, rescue, and reset the whole room: a Node-RED
dashboard plus a small physical panel in the GM closet. If a prop dies mid-game the GM
must be able to fake its output in two clicks — that rule drives the whole design.

## What it controls (everything built in Briefs 01–10)

- **Room state:** current stage, all dashboard screen-9 fields, both timers
  (7-min backup clock via `last_backup`, `countdown_end_time`), `game_loops` counter.
- **Screens:** send any camera message `{screen, sequence, highlight, code}`; trigger
  phases `RCB008` / `FNL009`; broadcast `{type:"refresh_page"}`.
- **Audio:** soundboard of every file in `/public/sounds` + `/public/music` via the
  `/ws/wall` audio message (`{sound_type, url, volume}`); master music duck button.
- **Props:** per-prop tiles showing the retained `loop/<prop>/status` heartbeat
  (green/red), with `test`, `reset`, and **simulate** buttons that inject the prop's
  success event into the game flow (the two-click rescue).
- **AI:** hint-level selector (0/1/2) for LOOP (Brief 09), bark mute, transcript view.
- **Docgen:** team-name form + Generate/Print (Brief 10).

## Materials

| Item | Notes | Est. |
|---|---|---|
| Node-RED `node-red-dashboard` (or FlowFuse dashboard 2) | on the existing towerloop box | — |
| Spare monitor + cheap keyboard at the GM desk | | — |
| Physical panel: 8 toggle guards + emergency mushroom | the mushroom is the hard-wired door release — NOT software | $40 |
| ESP32 for the panel toggles | publishes `loop/gm/event` | bin |
| UPS for the towerloop box + broker | a brownout must not corrupt a running game | $60 |

## Step-by-step build

1. **State model first (½ day).** In Node-RED, consolidate all game state into one
   `flow`-context object with a single `advanceStage()` path. Every prop event and every
   GM simulate button goes through the same function — no parallel logic.
2. **Dashboard tabs (1 day).** `RUN` (stage stepper, timers, hint level, big
   NEXT-STAGE and RESET-ROOM buttons) · `PROPS` (status tiles + test/reset/simulate) ·
   `AV` (soundboard, screen sender, music volume) · `SETUP` (team form → docgen).
3. **Room reset choreography (½ day).** One RESET button executes, in order: all props
   `{"cmd":"reset"}` → wait for status acks → reset state object + timers →
   `refresh_page` broadcast → play `welcome_message.mp3` armed for next team. Target:
   room turnaround < 5 min.
4. **Physical panel (½ day).** Guarded toggles for: door open, hatch release, maglock
   drop, blower kill, audio mute, lights. These publish MQTT but the mushroom button is
   hard-wired into the maglock circuit (README §4).
5. **Observability (¼ day).** Every MQTT event → a scrolling game log with timestamps;
   auto-export per session. This is also your debugging tool for every other brief.

## Test checklist

- [ ] Full dress rehearsal run start→finish driven only from this station
- [ ] Kill a random prop's power mid-game → GM rescues via simulate in < 30 s
- [ ] RESET produces a clean idle room from any mid-game state, twice in a row
- [ ] Broker/Node-RED reboot mid-game → props reconnect, retained status repopulates
- [ ] Mushroom button releases the maglocks with Node-RED stopped

## Stretch goals

- Session replay: re-run a game log against the screens for marketing footage.
- Push notification to the GM's phone when any prop heartbeat goes stale > 30 s.
