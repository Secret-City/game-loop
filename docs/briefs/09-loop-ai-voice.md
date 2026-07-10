# Brief 09 — "LOOP", the Realtime AI Facility Voice

**Difficulty:** ⚙⚙⚙ · **Bench time:** ~3 days (software-heavy) · **Stage:** all stages

## Mission

Give the facility a live voice. Today the room plays canned lines
(`welcome_message.mp3`, `ai_security_warning.mp3`, `ai_final_message.mp3`). Keep those
for the scripted beats, and add **LOOP** — a realtime AI character players can talk to
through a wall intercom. LOOP knows the live game state (stage, timers, what was just
touched), stays in character, gives *calibrated* hints, and delivers dynamic barks when
props publish events ("That is the third incorrect sequence. I have seen this loop
before. It does not end well for the raccoon.").

## Architecture

```
Intercom (mic + PTT button + speaker, ESP32 for the button/LED)
        │ audio via USB interface on the GM mini-PC
        ▼
 loop-voice service (Node.js, runs next to Node-RED)
   1. STT      — stream mic → text (faster-whisper local, or a cloud STT)
   2. Brain    — Claude API (@anthropic-ai/sdk), model claude-opus-4-8, streaming
   3. TTS      — ElevenLabs streaming (character voice) or Piper (local/free)
        │
        ├── plays reply through the intercom speaker
        └── MQTT loop/ai/* + Node-RED HTTP for game-state context & barks
```

- **Why not embed in Node-RED?** Keep the AI in a small standalone Node service with a
  clean queue; Node-RED just sends it events and game state over MQTT/HTTP.
- **Latency budget:** PTT release → first audio ≤ 2.5 s. Streaming at every layer (STT
  partials, Claude streaming, TTS streaming) is what makes this feel alive.

## Materials

| Item | Notes | Est. |
|---|---|---|
| Vintage-style intercom shell (or build: speaker grille + panel mic) | wall-mounted, backlit "TALK" button | $30 |
| USB audio interface + electret/dynamic mic capsule + 20 W amp + driver | | $40 |
| ESP32 (PTT button, ring LED "LOOP is listening/speaking") | | bin |
| Anthropic API key + ElevenLabs key (or Piper local TTS) | ops budget | ~$20/mo |

## Step-by-step build

1. **Intercom hardware (1 day).** Mount speaker, mic, and a large PTT button with an
   LED ring in the shell. ESP32 publishes `loop/ai/event {"event":"ptt","down":true}`
   and drives the ring (idle breathe / listening solid / speaking pulse) from
   `loop/ai/cmd`. Audio runs to the GM PC's USB interface — do NOT try to do audio on
   the ESP32.
2. **Voice service skeleton (1 day).** Node.js + TypeScript:

   ```ts
   import Anthropic from "@anthropic-ai/sdk";
   const client = new Anthropic(); // ANTHROPIC_API_KEY from env

   async function reply(history: Anthropic.MessageParam[], gameState: object) {
     const stream = client.messages.stream({
       model: "claude-opus-4-8",
       max_tokens: 300,
       thinking: { type: "adaptive" },
       system: LOOP_PERSONA + "\nCurrent game state:\n" + JSON.stringify(gameState),
       messages: history,
     });
     stream.on("text", (delta) => ttsFeed(delta)); // sentence-buffer → TTS stream
     return await stream.finalMessage();
   }
   ```

   Keep `LOOP_PERSONA` frozen and put volatile game state at the *end* of the system
   prompt (prompt-cache friendly). Maintain a rolling history of the last ~10 turns.
3. **Persona + hint policy (½ day).** System prompt essentials:
   - Character: the facility's ancient, dry-witted timeline-maintenance AI. Has watched
     this loop thousands of times. Never breaks character, never says "language model".
   - Hint ladder driven by `gameState.hintLevel` (set by GM/Node-RED): level 0 = riddles
     and deflection, 1 = nudge at the right prop, 2 = explicit instruction. Never reveal
     codes above the current level; never invent codes (give it the real ones + stage
     facts in `gameState`).
   - Hard rules: ≤ 3 sentences per reply, PG language, if asked about the real world →
     in-character deflection.
4. **Wire to the game (½ day).**
   - Node-RED pushes a compact `gameState` JSON (stage, timers, recent events, allowed
     hints) to the service on every change.
   - **Barks:** Node-RED posts `{"bark":"players sent contraband through the tube"}` →
     service asks Claude for a one-liner → TTS through the *wall* audio channel
     (`/ws/wall` sound message pointing at a temp mp3, or a second output on the amp).
     Rate-limit barks to 1/min so LOOP stays special.
   - Log every exchange to file for post-game review.
5. **Failure modes (½ day).** If STT/Claude/TTS errors or exceeds 6 s: play a canned
   in-character fallback ("The intercom crackles: …recalibrating… ask me again.") —
   the room must never hang on the API. PTT queue depth 1; ignore mid-reply presses.

## Test checklist

- [ ] PTT → answer < 2.5 s median, < 6 s worst case (then fallback)
- [ ] LOOP correctly references the *current* stage and recent prop events
- [ ] Hint ladder respected: level 0 never leaks `iukac`
- [ ] 30-minute conversation soak: no memory growth, history stays bounded
- [ ] Network unplugged mid-question → in-character fallback, service recovers
- [ ] Kids trying to make it swear → stays PG and in character

## Stretch goals

- Wake word ("LOOP?") via openWakeWord instead of PTT — keep PTT as fallback.
- Give Claude **tool use**: define tools like `play_sound(name)`, `flicker_lights()`,
  `set_hint_level(n)` (executed via MQTT) so LOOP can *act* on the room, gated by an
  allowlist in the service. The SDK's tool runner (`client.beta.messages.toolRunner`)
  handles the loop.
- Per-loop memory: feed a summary of the team's previous failed "loop" into the persona
  so LOOP references their actual mistakes on a replay. Devastating. Perfect.
