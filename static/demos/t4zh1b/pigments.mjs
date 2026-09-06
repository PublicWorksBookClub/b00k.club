/**
 * The materials Islamic illumination was actually made of, and how they combine.
 * Generated from pigments.py, which carries the reasoning and the sources.
 *
 * The hex values are renderings chosen by eye to look like the material at
 * manuscript scale -- not measurements. The pigment *names* carry the history;
 * the numbers only carry the look.
 */

export const PIGMENTS = {
  lazurite: { name: "Lapis lazuli", colour: "#1f3f8f",
    note: "Ground lapis from Badakhshan \u2014 the prestige blue, and the one a Qur'an gets. Violet-leaning where azurite is green-leaning.",
    source: "Identified on every manuscript in the Raman surveys",
  },
  azurite: { name: "Azurite", colour: "#2f6e9e",
    note: "A copper carbonate, cheaper than lapis and greener. Grinding it fine turns it pale, so it is used coarse, which reads as slightly granular.",
    source: "Common where lapis was not affordable",
  },
  indigo: { name: "Indigo", colour: "#2b3a55",
    note: "Organic, dark and slightly grey. Often under another blue rather than beside it.",
    source: "Raman: present on several Persian manuscripts",
  },
  prussian: { name: "Prussian blue", colour: "#17384f",
    note: "A European invention of about 1706 and an import. Its presence dates a page rather than decorating it.",
    source: "Found on later manuscripts; anachronistic before the 18th century",
    caution: "Anachronistic before c. 1720 \u2014 it will read as wrong to anyone who knows",
  },
  gold: { name: "Shell gold", colour: "#b58b2a",
    note: "Powdered gold in a binder, painted rather than laid. Mamluk illumination uses it densely \u2014 gold fills every space a pattern leaves.",
    source: "Mamluk Qur'ans, 14th c. Cairo and Damascus",
  },
  goldleaf: { name: "Burnished gold leaf", colour: "#c9a227",
    note: "Laid, then burnished until it mirrors. Brighter and flatter than shell gold, and the reason a page catches light as it turns.",
  },
  silver: { name: "Silver", colour: "#8c8f92",
    note: "Used beside gold for contrast, and now almost never silver-coloured.",
    caution: "Tarnishes to brown or black; a gold-and-silver page is now gold-and-grey",
  },
  vermilion: { name: "Vermilion", colour: "#cf3b21",
    note: "Mercury sulphide, the bright opaque red. The red of rubrication and of verse markers.",
    source: "Raman: on every manuscript surveyed",
  },
  redlead: { name: "Red lead", colour: "#e2622a",
    note: "Minium \u2014 an orange-red, warmer and lighter than vermilion, and the 'burnt orange-red' that tempers gold and lapis in Mamluk work.",
    source: "Raman: on every manuscript surveyed",
    caution: "Darkens with age",
  },
  haematite: { name: "Haematite", colour: "#8c3a2e",
    note: "Iron oxide: a dull brown-red, cheap and utterly stable. The workaday red.",
    source: "Raman: on several",
  },
  carmine: { name: "Carmine", colour: "#a01a3c",
    note: "An organic crimson from scale insects \u2014 kermes, lac, cochineal \u2014 and the cool red that vermilion cannot make.",
    source: "Identified on 16th\u201317th c. Persian manuscripts",
  },
  madder: { name: "Madder lake", colour: "#c05070",
    note: "A rose from madder root. Organic reds of this family are the subject of a study of their own in al-Andalus.",
    source: "Organic red colorants in Islamic manuscripts of al-Andalus, 12th\u201315th c.",
  },
  orpiment: { name: "Orpiment", colour: "#e8b923",
    note: "Arsenic sulphide: a hot lemon-gold, and the yellow that stands in for gold where gold is too dear.",
    source: "Raman: on every manuscript surveyed",
    caution: "Arsenic; also blackens on contact with lead and copper pigments",
  },
  realgar: { name: "Realgar", colour: "#e07b28",
    note: "The orange arsenic sulphide, which converts to pale yellow pararealgar in light \u2014 so an orange that has been on display is now not.",
    source: "Raman: pararealgar found, meaning realgar was used",
    caution: "Arsenic; light-sensitive",
  },
  malachite: { name: "Malachite", colour: "#2f7d4f",
    note: "The copper carbonate green, azurite's sister mineral and equally granular.",
    source: "Raman: on several",
  },
  verdigris: { name: "Verdigris", colour: "#2e8b74",
    note: "Copper acetate: a brilliant blue-green nothing mineral matches.",
    caution: "Corrodes paper \u2014 green is often the most damaged part of a page",
  },
  atacamite: { name: "Atacamite", colour: "#46856a",
    note: "A copper chloride green, often a *degradation* product of the others rather than a choice.",
    source: "Raman: identified alongside malachite",
  },
  folium: { name: "Folium", colour: "#5b2a6e",
    note: "A plant purple, shifting toward blue or red with the pH of its preparation \u2014 so 'purple' is a range here, not a colour.",
  },
  leadwhite: { name: "Lead white", colour: "#f4f1e8",
    note: "The opaque white, and the body mixed into other colours to make them cover.",
    source: "Raman: on several",
    caution: "Blackens in sulphurous air",
  },
  carbon: { name: "Carbon black", colour: "#14100e",
    note: "Lampblack or soot. The blackest and the most permanent thing on the page.",
    source: "Raman: on every manuscript surveyed",
  },
  irongall: { name: "Iron-gall ink", colour: "#2b2118",
    note: "The text ink: brown-black rather than black, and it browns further with age.",
    caution: "Acidic; eats through paper where laid heavily",
  },
  paper: { name: "The paper", colour: "#f7f2e7",
    note: "Not a pigment. Islamic papers are rarely white \u2014 cream, buff, and often dyed or flecked.",
  },
};

export const PALETTES = {
  "wire": {
    label: "Wire \u2014 one ink", ink: "carbon", ground: null,
    tinctures: {argent: null, or: "carbon", azure: "carbon", gules: "carbon", vert: "carbon", purpure: "carbon", sable: "carbon"},
    note: "No colour at all. What a one-colour press gives you, and what the heraldic hatchings exist to survive.",
  },
  "mamluk": {
    label: "Mamluk \u2014 gold on lapis", ink: "gold", ground: "lazurite",
    tinctures: {argent: null, or: "gold", azure: "lazurite", gules: "vermilion", vert: "malachite", purpure: "folium", sable: "carbon"},
    note: "Deep blue, burnished gold, and touches of red and black \u2014 the palette of a 14th-century Cairo Qur'an, and the tradition this library's patterns are taken from. Gold is used densely: it fills what the pattern leaves.",
    source: "Mamluk Qur'ans, Cairo and Damascus, 14th c.",
  },
  "mamluk-red": {
    label: "Mamluk \u2014 tempered with red lead", ink: "gold", ground: "lazurite",
    tinctures: {argent: null, or: "gold", azure: "lazurite", gules: "redlead", vert: "malachite", purpure: "folium", sable: "carbon"},
    note: "The same, with the burnt orange-red that tempers the gold-and-blue contrast. A warmer page, and the commoner one.",
    source: "Mamluk Qur'ans; the 'burnt orange-red' of the descriptions",
  },
  "persian": {
    label: "Persian \u2014 the full mineral palette", ink: "goldleaf", ground: "paper",
    tinctures: {argent: null, or: "orpiment", azure: "lazurite", gules: "vermilion", vert: "malachite", purpure: "carmine", sable: "carbon"},
    note: "Everything the instruments found on 16th\u201317th century Persian manuscripts at once: lazurite, red lead, vermilion, orpiment, malachite, carbon black, lead white, indigo and carmine. The richest of these, and the least restrained.",
    source: "Raman microscopy of four 16th\u201317th c. Persian manuscripts",
  },
  "andalusi": {
    label: "Andalusi \u2014 organic reds", ink: "irongall", ground: "paper",
    tinctures: {argent: null, or: "gold", azure: "indigo", gules: "madder", vert: "verdigris", purpure: "folium", sable: "irongall"},
    note: "Quieter and more organic: iron-gall for the line, indigo rather than lapis, and the madder-family reds that are the subject of their own study in al-Andalus.",
    source: "Organic red colorants in Islamic manuscripts of al-Andalus, 12th\u201315th c.",
  },
  "qajar": {
    label: "Qajar \u2014 with Prussian blue", ink: "goldleaf", ground: "paper",
    tinctures: {argent: null, or: "orpiment", azure: "prussian", gules: "carmine", vert: "atacamite", purpure: "folium", sable: "carbon"},
    note: "Late, and knowingly so. Prussian blue is a European invention of about 1706 and arrives as an import, so its presence dates a page.",
    source: "Colourant studies of Q\u0101j\u0101r manuscripts, 1789\u20131925",
    caution: "Prussian blue is anachronistic before the 18th century",
  },
  "reversed": {
    label: "Reversed \u2014 paper on ink", ink: "paper", ground: "carbon",
    tinctures: {argent: null, or: "gold", azure: "lazurite", gules: "vermilion", vert: "malachite", purpure: "folium", sable: "leadwhite"},
    note: "Strapwork reversed out of a solid ground. Not a manuscript scheme, but Bourgoin's own panel plates do it and it is the strongest contrast available.",
    source: "Bourgoin, Les Arts arabes (1873), panel plates",
  },
};

export const DEFAULT_PALETTE = "mamluk";

/** Look up a palette by name, defaulting to the Mamluk one. */
export function palette(name) {
  const key = name || DEFAULT_PALETTE;
  if (!(key in PALETTES)) throw new Error(`unknown palette ${JSON.stringify(key)}`);
  return PALETTES[key];
}

/** The colour a palette gives a tincture, or null for the paper. */
export function tinctureColour(name, paletteName) {
  const key = palette(paletteName).tinctures[name];
  return key == null ? null : PIGMENTS[key].colour;
}

/** A palette's ink and ground as colours, with the paper as the fallback ground. */
export function scheme(paletteName) {
  const p = palette(paletteName);
  const ground = p.ground ? PIGMENTS[p.ground].colour : PIGMENTS.paper.colour;
  return { ink: PIGMENTS[p.ink].colour, ground, reverse: ground,
           label: p.label, note: p.note, source: p.source ?? "", caution: p.caution ?? "" };
}
