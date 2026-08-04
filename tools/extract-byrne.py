"""Pull Book I's definitions, postulates, axioms and proposition enunciations
out of jemmybutton/byrne-euclid's LaTeX so the app can speak Byrne's language."""

import json
import re
import sys

SRC = 'byrne/byrne-en-latex.tex'
ROMAN = {}
for i, r in enumerate(
    ('I II III IV V VI VII VIII IX X XI XII XIII XIV XV XVI XVII XVIII XIX XX '
     'XXI XXII XXIII XXIV XXV XXVI XXVII XXVIII XXIX XXX XXXI XXXII XXXIII '
     'XXXIV XXXV XXXVI XXXVII XXXVIII XXXIX XL XLI XLII XLIII XLIV XLV XLVI '
     'XLVII XLVIII').split(), 1):
    ROMAN[r] = i

text = open(SRC, encoding='utf-8').read()


def braced(s, i):
    """Read a {...} group starting at s[i] == '{'; return (contents, index after)."""
    assert s[i] == '{', s[i:i + 40]
    depth, j = 0, i
    while j < len(s):
        if s[j] == '{' and (j == 0 or s[j - 1] != '\\'):
            depth += 1
        elif s[j] == '}' and s[j - 1] != '\\':
            depth -= 1
            if depth == 0:
                return s[i + 1:j], j + 1
        j += 1
    raise ValueError('unbalanced')


LINE_MACROS = ('drawUnitLine', 'drawSizedLine', 'drawProportionalLine', 'drawLine',
               'drawNamedLine', 'drawCircleLine')


def clean(s):
    # Drop whole picture definitions and other draw-only blocks.
    for macro in ('defineNewPicture', 'drawFromCurrentPicture', 'drawCurrentPictureInMargin',
                  'offsetPicture', 'startGlobalRotation', 'stopGlobalRotation'):
        while True:
            m = re.search(r'\\' + macro + r'(\[[^\]]*\])*\s*\{', s)
            if not m:
                break
            start = m.start()
            open_brace = s.index('{', m.end() - 1)
            _, after = braced(s, open_brace)
            s = s[:start] + ' ' + s[after:]

    # \drawLine[bottom][triangleABC]{AB,CA,BC} is a picture of a named figure.
    FIGURE = r'(?:triangle|square|rectangle|parallelogram|polygon|quadrilateral)'
    GLYPH = {'triangle': '△', 'square': '□', 'rectangle': '▭', 'parallelogram': '▱', 'polygon': '', 'quadrilateral': ''}
    def figure(m):
        return GLYPH.get(m.group(1), '') + m.group(2)
    s = re.sub(r'\\drawLine(?:\[[^\]]*\])*\[' + FIGURE + r'([A-Z]+)\]\s*\{[^{}]*\}',
               lambda m: '', s) if False else s
    s = re.sub(r'\\drawLine(?:\[[^\]]*\])*\[(' + FIGURE + r')([A-Z]+)\]\s*\{[^{}]*\}', figure, s)
    # \triangleABC and friends are macros the book defines from those pictures.
    s = re.sub(r'\\(' + FIGURE + r')([A-Z]+)\b', figure, s)

    # Named quantities keep their letters: \drawUnitLine{AB} -> AB
    for macro in LINE_MACROS:
        s = re.sub(r'\\' + macro + r'(\[[^\]]*\])*\s*\{([^{}]*)\}', r'\2', s)
    s = re.sub(r'\\drawAngle\s*\{([^{}]*)\}', r'∠\1', s)
    s = re.sub(r'\\drawSector\s*\{([^{}]*)\}', r'\1', s)
    s = re.sub(r'\\emph\s*\{([^{}]*)\}', r'\1', s)
    s = re.sub(r'\\byref\s*\{[^{}]*\}', '', s)
    s = re.sub(r'\\bylabel\s*\{[^{}]*\}', '', s)
    s = re.sub(r'\\(begin|end)\{[a-zA-Z*]+\}', ' ', s)
    s = re.sub(r'\\(qed|constref|par)\b', ' ', s)
    s = s.replace('\\&', '&').replace('\\%', '%').replace('\\,', ' ')
    s = re.sub(r'\\\\', ' ', s)
    s = s.replace('$', '')
    # Anything left that looks like a bare macro goes.
    s = re.sub(r'\\[a-zA-Z]+(\[[^\]]*\])?', ' ', s)
    s = s.replace('{', ' ').replace('}', ' ')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+([,.;:)])', r'\1', s)
    s = re.sub(r'\(\s+', '(', s)
    s = re.sub(r'\[[A-Za-z0-9]*\]', '', s)
    # Lists of side names read better spaced: "BC,AC,AB" -> "BC, AC, AB".
    s = re.sub(r'\b((?:[A-Z]{2},){1,6}[A-Z]{2})\b', lambda m: m.group(1).replace(',', ', '), s)
    s = re.sub(r'\(\s*\)', '', s)
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+([,.;:)])', r'\1', s)
    return s.strip()


def collect(marker, label_prefix, limit_at):
    """Everything from \\startX{}\\bylabel{prefix:I.N} up to the next \\start or \\chapter."""
    out = []
    pattern = re.compile(r'\\start' + marker + r'\s*\{[^{}]*\}\s*\\bylabel\s*\{' + label_prefix + r':I\.([IVXL]+)\}')
    for m in pattern.finditer(text):
        if m.start() > limit_at:
            break
        start = m.end()
        nxt = re.search(r'\\(start[a-z]+|chapter)\b', text[start:])
        end = start + (nxt.start() if nxt else len(text) - start)
        body = clean(text[start:end])
        out.append({'n': ROMAN[m.group(1)], 'roman': m.group(1), 'text': body})
    return out


book2 = text.index('\\chapter*{Book II}') if '\\chapter*{Book II}' in text else len(text)
# Book I ends where Book II's material begins; find the second "Definitions" chapter.
chapters = [m.start() for m in re.finditer(r'\\chapter\*\{', text)]
prop_chapter = text.index('\\chapter*{Propositions}')
end_of_book_one = next((c for c in chapters if c > prop_chapter), len(text))

data = {
    'definitions': collect('definition', 'def', prop_chapter),
    'postulates': collect('postulate', 'post', prop_chapter),
    'axioms': collect('axiom', 'ax', prop_chapter),
    'propositions': [],
}

prop_re = re.compile(r'\\start(problem|theorem)\s*\{([^{}]*)\}\s*\\bylabel\s*\{prop:I\.([IVXL]+)\}')
for m in prop_re.finditer(text):
    if m.start() > end_of_book_one:
        break
    kind, heading, roman = m.group(1), m.group(2), m.group(3)
    rest = text[m.end():end_of_book_one]
    e = re.search(r'\\problem(\[[^\]]*\])?\s*\{', rest)
    enunciation = ''
    if e:
        i = rest.index('{', e.end() - 1)
        a1, i = braced(rest, i)
        a2, i = braced(rest, i)
        a3, i = braced(rest, i)
        enunciation = clean(a1 + a2 + ' ' + a3)
    if roman == 'II':
        enunciation = enunciation.replace('From a given point,', 'From a given point (A),')
    data['propositions'].append({
        'n': ROMAN[roman],
        'roman': roman,
        'kind': 'problem' if kind == 'problem' else 'theorem',
        'heading': re.sub(r'\s+', ' ', heading).strip(),
        'text': enunciation,
    })

json.dump(data, open('book1.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('definitions', len(data['definitions']))
print('postulates ', len(data['postulates']))
print('axioms     ', len(data['axioms']))
print('propositions', len(data['propositions']))
for p in data['propositions'][:4]:
    print(f"  {p['roman']} ({p['kind']}): {p['text'][:110]}")
