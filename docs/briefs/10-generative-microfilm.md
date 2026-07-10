# Brief 10 — Generative Microfilm & Document Pipeline

**Difficulty:** ⚙⚙ · **Bench time:** ~2 days (software) · **Stage:** microfilm + tube

## Mission

Make the paper trail *per-team*. Today the microfilm reader serves static art
(`/public/pdfs/recalibrate_1.png`, `undoctored_1..3.png`). Add a pre-game pipeline that
generates personalized documents — the team's names in the facility's staff manifest, a
"previous loop incident report" dated to their booking, a doctored-vs-undoctored photo
pair — rendered as period-correct microfilm frames and printed handouts (which the
pneumatic tube, Brief 06, can deliver mid-game).

## Game context

- `Microfilm.tsx` loads documents by filename from `/public/pdfs/`; the code lock maps
  `iukac` → Project Alpha docs, `xhjym` (any order) → Admin Manual. A `?code=` query
  param exists for GM bypass/testing.
- The doctored/undoctored comparison is already a designed beat (`undoctored*` assets,
  `admin undoctored 2 (dragged).pdf`).
- **Constraint:** codes can only use letters with glyphs in `/public/keys/` (no d, no p).

## Approach — templates first, image gen for garnish

Documents that carry *puzzle information* must be deterministic: build them as HTML
templates rendered to PNG (Playwright/Puppeteer screenshot at 1600 px wide, grain +
scanline CSS filter). Use an **image-generation API** only for non-load-bearing art:
staff portraits, incident photos, the "doctored" photo variant. Never let a generative
model produce the code or clue text — hallucinated clues brick the room.

## Materials / accounts

| Item | Notes |
|---|---|
| Node.js "docgen" service beside Node-RED | same box as Brief 09's service |
| Playwright (HTML→PNG) | deterministic layout |
| Image-gen API of choice (e.g. OpenAI `gpt-image-1`, Google Imagen, or local SDXL) for portraits/photos | budget ~$0.05–0.30/game |
| Claude API (`claude-opus-4-8`, @anthropic-ai/sdk) for flavor text | reuse Brief 09's client |
| 58/80 mm thermal printer at the GM desk (or the tube's printer) | physical handouts |

## Step-by-step build

1. **Template kit (1 day).** Three HTML templates styled like the existing PDFs
   (typewriter font, stamps, redaction bars, 70s memo layout):
   `staff-manifest`, `incident-report`, `photo-exhibit` (side-by-side doctored pair).
   Add a `film()` CSS class: sepia, vignette, grain, slight rotation — instant microfilm.
2. **Docgen service (½ day).** Endpoint `POST /generate {teamName, players[], slot}`:
   - Claude writes flavor text (incident narrative referencing player names, dry
     facility tone). Fixed clue lines are injected verbatim by the template, not by the model.
   - Image API generates 1 portrait per player ("1970s laminated staff ID photo, …") and
     the incident photo; the "doctored" variant is the same photo re-prompted with the
     anomaly added (or a simple compositing step for reliability).
   - Playwright renders each template → `out/<sessionId>/<doc>.png`.
3. **Wire into the game (¼ day).** Copy outputs into `public/pdfs/generated/<sessionId>/`
   and have Node-RED tell the microfilm kiosk which set to load (simplest: serve a
   `manifest.json` the kiosk fetches on `refresh_page`; requires a small `Microfilm.tsx`
   patch to read the manifest instead of hard-coded names — keep the hard-coded set as
   fallback).
4. **Print path (¼ day).** `POST /print {doc}` → thermal printer at GM desk / tube
   printer. GM slips the printout into a reply capsule (Brief 06) for mid-game delivery.
5. **Booking hook (¼ day).** Small GM form (Node-RED dashboard) — team name + first
   names, hit Generate during the pre-game briefing. Target < 90 s end-to-end.

## Test checklist

- [ ] Generated docs are legible on the microfilm screen at 50–300 % zoom
- [ ] Clue text is byte-identical across 10 generations (templates, not model output)
- [ ] Pipeline completes < 90 s; failure falls back to the stock document set silently
- [ ] Player names with emoji/accents don't break layout
- [ ] Generated sets are purged after each session (privacy + disk)

## Stretch goals

- Ambient "security camera stills" of the *players* (GM webcam snap during briefing,
  style-transferred to CCTV grain) appearing on a wall monitor late-game.
- End-of-game souvenir: auto-printed "TIMELINE STABILIZED" certificate with team names
  and their loop count (`game_loops`).
