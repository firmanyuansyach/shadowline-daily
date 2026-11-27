// Static 2D silhouette teasers for the splash card (viewBox 0 0 100 100).
// One canonical pose per object — a teaser only, NOT the target rotation
// (the game view renders the true target silhouette in 3D). Cream fill
// (#f5e9c8) on the ink-navy splash background. Hand-drawn, no assets.

export const SILHOUETTES: Record<string, string> = {
  teapot:
    '<path d="M30 45 Q30 30 50 30 Q70 30 70 45 L72 62 Q72 78 50 78 Q28 78 28 62 Z"/><path d="M70 42 L86 34 L88 42 L72 52 Z"/><path d="M30 42 Q16 44 16 56 Q16 64 28 60 L30 52 Z"/><rect x="44" y="22" width="12" height="8" rx="2"/>',
  boot:
    '<path d="M38 12 L62 12 L62 58 L84 66 Q88 70 84 74 L82 76 L38 76 Q34 76 34 70 L34 18 Q34 12 38 12 Z"/>',
  mug:
    '<rect x="30" y="30" width="34" height="44" rx="6"/><path d="M64 38 Q82 38 82 52 Q82 66 64 66 L64 58 Q74 58 74 52 Q74 46 64 46 Z"/>',
  lamp:
    '<path d="M50 12 L72 40 L28 40 Z"/><rect x="47" y="40" width="6" height="30"/><ellipse cx="50" cy="76" rx="22" ry="6"/>',
  key:
    '<circle cx="26" cy="50" r="16"/><circle cx="26" cy="50" r="7" fill="#0e1420"/><rect x="40" y="45" width="44" height="10" rx="2"/><rect x="70" y="55" width="6" height="12"/><rect x="78" y="55" width="6" height="9"/>',
  scissors:
    '<circle cx="28" cy="30" r="10"/><circle cx="28" cy="70" r="10"/><path d="M36 34 L78 62 L74 70 L32 42 Z"/><path d="M36 66 L78 38 L74 30 L32 58 Z"/>',
  pine:
    '<path d="M50 8 L68 34 L58 34 L74 56 L62 56 L80 82 L20 82 L38 56 L26 56 L42 34 L32 34 Z"/><rect x="45" y="82" width="10" height="10"/>',
  fish:
    '<path d="M14 50 Q34 28 58 34 Q74 38 78 50 Q74 62 58 66 Q34 72 14 50 Z"/><path d="M76 50 L92 36 L92 64 Z"/><circle cx="30" cy="46" r="3" fill="#0e1420"/>',
  snail:
    '<circle cx="46" cy="46" r="26"/><circle cx="46" cy="46" r="12" fill="#0e1420"/><path d="M20 68 Q20 76 30 76 L78 76 Q86 76 86 70 L86 66 L66 66 Q60 60 52 62 Q40 66 30 66 Z"/><path d="M66 34 L70 22 M74 36 L80 24" stroke="#f5e9c8" stroke-width="3" fill="none"/>',
  mushroom:
    '<path d="M12 52 Q12 22 50 22 Q88 22 88 52 Q88 58 82 58 L18 58 Q12 58 12 52 Z"/><rect x="40" y="58" width="20" height="24" rx="6"/>',
  bicycle:
    '<circle cx="26" cy="68" r="16" fill="none" stroke="#f5e9c8" stroke-width="4"/><circle cx="74" cy="68" r="16" fill="none" stroke="#f5e9c8" stroke-width="4"/><path d="M26 68 L46 44 L74 68 M46 44 L62 44 M62 44 L74 68 M46 44 L38 68 M38 68 L26 68" stroke="#f5e9c8" stroke-width="3" fill="none"/><path d="M58 40 L70 40 M42 44 L38 36" stroke="#f5e9c8" stroke-width="3" fill="none"/>',
  anchor:
    '<circle cx="50" cy="18" r="8" fill="none" stroke="#f5e9c8" stroke-width="4"/><rect x="46" y="24" width="8" height="52"/><rect x="26" y="34" width="48" height="7" rx="3"/><path d="M18 52 Q18 78 50 82 Q82 78 82 52 L72 52 Q72 68 50 70 Q28 68 28 52 Z"/>',
  guitar:
    '<circle cx="38" cy="62" r="20"/><circle cx="38" cy="62" r="8" fill="#0e1420"/><path d="M50 48 L76 18 L84 24 L58 54 Z"/><rect x="72" y="12" width="14" height="8" rx="2" transform="rotate(-38 79 16)"/>',
  lighthouse:
    '<path d="M42 22 L58 22 L62 78 L38 78 Z"/><rect x="40" y="12" width="20" height="10" rx="2"/><path d="M38 12 L50 2 L62 12 Z"/><rect x="44" y="34" width="12" height="8" fill="#0e1420"/><rect x="44" y="52" width="12" height="8" fill="#0e1420"/>',
  windmill:
    '<path d="M42 34 L58 34 L62 84 L38 84 Z"/><circle cx="50" cy="30" r="6"/><path d="M50 30 L50 6 M50 30 L74 30 M50 30 L50 54 M50 30 L26 30" stroke="#f5e9c8" stroke-width="5" fill="none"/><path d="M50 6 L58 12 M74 30 L68 38 M50 54 L42 48 M26 30 L32 22" stroke="#f5e9c8" stroke-width="5" fill="none"/>',
  crown:
    '<path d="M22 74 L22 34 L36 52 L50 26 L64 52 L78 34 L78 74 Z"/><circle cx="22" cy="30" r="4"/><circle cx="50" cy="22" r="4"/><circle cx="78" cy="30" r="4"/>',
  chair:
    '<rect x="28" y="12" width="44" height="34" rx="3"/><rect x="26" y="46" width="48" height="8" rx="2"/><rect x="30" y="54" width="6" height="26"/><rect x="64" y="54" width="6" height="26"/>',
  kettle:
    '<path d="M28 48 Q28 30 50 30 Q72 30 72 48 L74 64 Q74 80 50 80 Q26 80 26 64 Z"/><path d="M72 42 L88 26 L90 36 L74 52 Z"/><path d="M28 42 Q14 44 14 56 Q14 64 26 60 L28 52 Z"/><rect x="44" y="22" width="12" height="8" rx="2"/>',
  headphones:
    '<path d="M22 62 Q22 22 50 22 Q78 22 78 62" fill="none" stroke="#f5e9c8" stroke-width="7"/><rect x="14" y="58" width="16" height="26" rx="6"/><rect x="70" y="58" width="16" height="26" rx="6"/>',
  turtle:
    '<ellipse cx="48" cy="50" rx="30" ry="20"/><circle cx="80" cy="50" r="9"/><rect x="18" y="66" width="10" height="12" rx="3"/><rect x="58" y="66" width="10" height="12" rx="3"/><path d="M20 50 L8 56 L20 60 Z"/>',
  'watering-can':
    '<rect x="24" y="44" width="40" height="32" rx="6"/><path d="M64 52 L88 30 L92 36 L68 60 Z"/><circle cx="90" cy="30" r="8"/><path d="M24 50 Q12 52 12 62 Q12 70 22 68 L24 60 Z"/><rect x="36" y="36" width="16" height="8" rx="3"/>',
  camera:
    '<rect x="18" y="34" width="64" height="40" rx="6"/><circle cx="50" cy="54" r="16"/><circle cx="50" cy="54" r="8" fill="#0e1420"/><rect x="38" y="26" width="24" height="8" rx="2"/><rect x="66" y="38" width="10" height="8" rx="2" fill="#0e1420"/>',
  sailboat:
    '<path d="M18 62 L82 62 L72 82 L28 82 Z"/><rect x="48" y="16" width="4" height="46"/><path d="M54 20 L54 60 L78 60 Z"/><path d="M46 26 L46 60 L28 60 Z"/>',
  robot:
    '<rect x="32" y="40" width="36" height="38" rx="6"/><rect x="36" y="18" width="28" height="20" rx="4"/><circle cx="46" cy="28" r="3" fill="#0e1420"/><circle cx="54" cy="28" r="3" fill="#0e1420"/><rect x="48" y="8" width="4" height="10"/><circle cx="50" cy="7" r="3"/><rect x="22" y="46" width="8" height="24" rx="3"/><rect x="70" y="46" width="8" height="24" rx="3"/><rect x="38" y="78" width="8" height="10"/><rect x="54" y="78" width="8" height="10"/>',
  castle:
    '<rect x="20" y="44" width="60" height="40" rx="2"/><rect x="14" y="24" width="16" height="60"/><rect x="70" y="24" width="16" height="60"/><path d="M12 24 L22 12 L32 24 Z"/><path d="M68 24 L78 12 L88 24 Z"/><rect x="42" y="64" width="16" height="20" rx="6" fill="#0e1420"/><rect x="28" y="50" width="8" height="8" fill="#0e1420"/><rect x="64" y="50" width="8" height="8" fill="#0e1420"/>',
  hammer:
    '<rect x="20" y="30" width="56" height="14" rx="3"/><path d="M76 30 L88 38 L76 46 Z"/><path d="M20 30 L8 24 L12 38 Z"/><rect x="44" y="44" width="10" height="44" rx="3"/>',
  dragonfly:
    '<ellipse cx="50" cy="52" rx="26" ry="6"/><circle cx="78" cy="52" r="7"/><ellipse cx="38" cy="36" rx="20" ry="7" transform="rotate(-25 38 36)"/><ellipse cx="38" cy="68" rx="20" ry="7" transform="rotate(25 38 68)"/><ellipse cx="58" cy="36" rx="18" ry="6" transform="rotate(20 58 36)"/><ellipse cx="58" cy="68" rx="18" ry="6" transform="rotate(-20 58 68)"/>',
  crane:
    '<rect x="44" y="30" width="8" height="58"/><rect x="20" y="24" width="64" height="7"/><rect x="30" y="88" width="40" height="8" rx="2"/><rect x="72" y="31" width="3" height="24"/><rect x="66" y="55" width="14" height="10" rx="2"/><rect x="24" y="31" width="3" height="18"/><rect x="18" y="49" width="14" height="8" rx="2"/>',
  rocket:
    '<path d="M50 8 Q64 26 64 48 L64 66 L36 66 L36 48 Q36 26 50 8 Z"/><path d="M36 66 L26 84 L38 76 Z"/><path d="M64 66 L74 84 L62 76 Z"/><circle cx="50" cy="42" r="7" fill="#0e1420"/><path d="M44 66 L50 84 L56 66 Z"/>',
  violin:
    '<circle cx="50" cy="64" r="18"/><circle cx="50" cy="38" r="12"/><path d="M50 26 L50 10 L56 10 L56 28 Z"/><circle cx="53" cy="8" r="4"/><circle cx="50" cy="52" r="5" fill="#0e1420"/><rect x="38" y="48" width="24" height="3" rx="1"/>',
};

export function silhouetteFor(objectId: string): string {
  return SILHOUETTES[objectId] ?? SILHOUETTES['mug'] ?? '';
}
