// Instructions for video wall during phase -1 (Nothing)
const instructions = [
  { "screen": 1, "sequence": "1_begin.png", highlight: true, code: "2" },
  { "screen": 2, "sequence": "2_begin.png" },
  { "screen": 3, "sequence": "3_begin.png" },
  { "screen": 4, "sequence": "4_begin.png" },
  { "screen": 5, "sequence": "5_begin.png" },
  { "screen": 6, "sequence": "6_begin.png" },
  { "screen": 7, "sequence": "7_begin.png" },
  { "screen": 8, "sequence": "8_begin.png" },
  {
    "screen": 9,
    "sequence": "9_begin.png",
    "now_playing": "Bright new day",
    "security_doors": "LOCKED",
    "security_firewall": "SECURED",
    "vents_external": "CLOSED",
    "vents_internal": "OPEN",
    "vents_flow": "INWARD",
    "last_backup": Date.now() - (1 * 1000 * 60 * 9.75),
    "game_start": Date.now(),
    "crystal_integrty": "Calibrated",
    "crystal_power": "Stable"
  },
  { "sound_type": "music", "url": "music/music_start.mp3" },
];

// Return an array of messages (one per instruction), all as JSON objects
return [instructions.map(instr => ({ payload: instr }))];