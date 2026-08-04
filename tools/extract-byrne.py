"""Pull Book I's definitions, postulates, axioms and proposition enunciations
out of jemmybutton/byrne-euclid's LaTeX so the app can speak Byrne's language."""

import json
import math
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
    # Collapsing the whitespace can reopen a gap after a bracket that a picture
    # used to fill, so tidy that last of all.
    s = re.sub(r'\(\s+', '(', s)
    # A run of side names reads better spaced: "ABC,ACD" -> "ABC, ACD".
    s = re.sub(r'\b([A-Z]{2,4}),(?=[A-Z]{2,4}\b)', r'\1, ', s)
    return s.strip()


# --------------------------------------------------------------- the figures
#
# Byrne draws a small figure in the margin beside most definitions, declared in
# MetaPost just above the definition it belongs to. The language those pictures
# use is tiny — a few named points, some coloured lines, a circle or an arc, an
# angle — so rather than guess at the drawings we read them.
#
# MetaPost's y runs up the page; the figures are emitted in the same convention
# and flipped when drawn.

UNIT = 100.0  # Byrne's u, in figure units


class Figure:
    """One marginal picture, evaluated far enough to be drawn."""

    def __init__(self):
        self.vars = {}
        self.lines = {}   # byLineDefine registers lines; byNamedLineSeq draws them
        self.angles = []
        self.items = []


def number(expr, fig):
    """A MetaPost numeric: 2/3u, 1/2s, -u, 4/3s, s + 1/4s, r, 45."""
    expr = expr.strip()
    if '+' in expr:
        return sum(number(part, fig) for part in expr.split('+'))
    m = re.fullmatch(r'(-?)(?:(\d+)/(\d+))?\s*(\d*\.?\d*)\s*([a-zA-Z]*)', expr)
    if not m:
        raise ValueError('numeric? ' + expr)
    sign = -1 if m.group(1) else 1
    value = 1.0
    if m.group(2):
        value = int(m.group(2)) / int(m.group(3))
    if m.group(4):
        value *= float(m.group(4))
    name = m.group(5)
    if name == 'u':
        value *= UNIT
    elif name:
        value *= fig.vars[name]
    return sign * value


def split_top(s, sep=','):
    """Split on sep, ignoring anything inside parentheses."""
    out, depth, part = [], 0, ''
    for ch in s:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == sep and depth == 0:
            out.append(part)
            part = ''
        else:
            part += ch
    out.append(part)
    return [p.strip() for p in out if p.strip()]


def pair(expr, fig):
    """A MetaPost pair, as (x, y)."""
    expr = expr.strip()
    while expr.startswith('(') and expr.endswith(')') and len(split_top(expr[1:-1])) == 1 \
            and not re.fullmatch(r'\([^()]*,[^()]*\)', expr):
        expr = expr[1:-1].strip()

    m = re.match(r'^(.*?)\s+(scaled|shifted|rotated)\s+(.*)$', expr)
    if m and not m.group(1).endswith(','):
        left, how, right = pair(m.group(1), fig), m.group(2), m.group(3)
        if how == 'scaled':
            k = number(right, fig)
            return (left[0] * k, left[1] * k)
        if how == 'shifted':
            dx, dy = pair(right, fig)
            return (left[0] + dx, left[1] + dy)
        a = math.radians(number(right, fig))
        return (left[0] * math.cos(a) - left[1] * math.sin(a),
                left[0] * math.sin(a) + left[1] * math.cos(a))

    m = re.fullmatch(r'dir\s*\(([^()]*)\)', expr)
    if m:
        a = math.radians(number(m.group(1), fig))
        return (math.cos(a), math.sin(a))
    # `point k of P`, where P is always fullcircle: eight points, 45° apart.
    m = re.fullmatch(r'point\s+(\d+)\s+of\s+(\w+)', expr)
    if m:
        radius, k = fig.vars[m.group(2)], int(m.group(1))
        a = math.radians(45 * k)
        return (radius * math.cos(a), radius * math.sin(a))
    m = re.fullmatch(r'(xpart|ypart)\s*\(([^()]*)\)', expr)
    if m:
        raise ValueError('xpart/ypart is a numeric, not a pair')
    if expr.startswith('(') and expr.endswith(')'):
        parts = split_top(expr[1:-1])
        if len(parts) == 2:
            return (coordinate(parts[0], fig), coordinate(parts[1], fig))
    if expr in fig.vars:
        return fig.vars[expr]
    raise ValueError('pair? ' + expr)


def coordinate(expr, fig):
    """One half of a pair: a numeric, or xpart/ypart of a point already placed."""
    m = re.fullmatch(r'(xpart|ypart)\s*\(([^()]*)\)', expr.strip())
    if m:
        return fig.vars[m.group(2).strip()][0 if m.group(1) == 'xpart' else 1]
    return number(expr, fig)


COLOR = {'byred': 'red', 'byblue': 'blue', 'byyellow': 'yellow', 'byblack': 'black'}


def angle_of(centre, point):
    return math.degrees(math.atan2(point[1] - centre[1], point[0] - centre[0]))


def read_figure(source):
    """Evaluate one \\defineNewPicture body into a list of things to draw."""
    fig = Figure()
    for statement in source.split(';'):
        s = statement.strip()
        if not s:
            continue
        s = re.sub(r'^draw\s+', '', s)

        m = re.fullmatch(r'(?:pair|numeric|path)\s+[\w\s,]+', s)
        if m:
            continue
        m = re.fullmatch(r'(\w+)\s*:=\s*(.*)', s, re.S)
        if m:
            name, value = m.group(1), m.group(2).strip()
            if value.startswith('fullcircle'):
                # `fullcircle scaled 2r` is only ever used as a circle of that radius.
                fig.vars[name] = number(value.split('scaled')[1], fig) / 2
            else:
                try:
                    fig.vars[name] = pair(value, fig)
                except ValueError:
                    fig.vars[name] = number(value, fig)
            continue

        m = re.fullmatch(r'byLineDefine\s*\(([^()]*)\)', s)
        if m:
            a, b, colour = split_top(m.group(1))[:3]
            fig.lines[a + b] = {'k': 'seg', 'a': fig.vars[a], 'b': fig.vars[b],
                                'color': COLOR[colour]}
            continue
        m = re.fullmatch(r'byNamedLineSeq\s*\([^()]*\)\s*\(([^()]*)\)', s)
        if m:
            for name in split_top(m.group(1)):
                # The sequence may name a line either way round.
                fig.items.append(fig.lines.get(name) or fig.lines[name[::-1]])
            continue
        m = re.fullmatch(r'byLine\s*\(([^()]*)\)\s*(?:\(([^()]*)\))?', s)
        if m:
            args = split_top(m.group(1)) + split_top(m.group(2) or '')
            a, b = args[0], args[1]
            fig.items.append({'k': 'seg', 'a': fig.vars[a], 'b': fig.vars[b],
                              'color': COLOR.get(args[2], 'black') if len(args) > 2 else 'black'})
            continue
        m = re.fullmatch(r'byCircleR\s*\(([^()]*)\)', s)
        if m:
            args = split_top(m.group(1))
            fig.items.append({'k': 'circle', 'c': fig.vars[args[0]],
                              'r': number(args[1], fig), 'color': COLOR.get(args[2], 'black')})
            continue
        m = re.fullmatch(r'byArc\s*\(([^()]*)\)\s*\(([^()]*)\)', s)
        if m:
            o, a, b = split_top(m.group(1))[:3]
            rest = split_top(m.group(2))
            centre = fig.vars[o]
            fig.items.append({'k': 'arc', 'c': centre, 'r': number(rest[0], fig),
                              'from': angle_of(centre, fig.vars[a]),
                              'to': angle_of(centre, fig.vars[b]),
                              'color': COLOR.get(rest[1], 'black')})
            continue
        m = re.fullmatch(r'byAngleDefine\s*\(([^()]*)\)', s)
        if m:
            args = split_top(m.group(1))
            b, vertex, c, colour = args[0], args[1], args[2], args[3]
            at = fig.vars[vertex]
            fig.angles.append({'k': 'angle', 'v': at,
                               'from': angle_of(at, fig.vars[b]),
                               'to': angle_of(at, fig.vars[c]),
                               'color': COLOR.get(colour, 'black'),
                               'fill': 'ARC' not in (args[4] if len(args) > 4 else '')})
            continue
        if re.fullmatch(r'byNamedAngleResized\s*\(\s*\)', s):
            # Angles go under the lines, as Byrne prints them.
            fig.items = fig.angles + fig.items
            fig.angles = []
            continue
        m = re.fullmatch(r'byLabelsOnPolygon\s*\(([^()]*)\)\s*\([^()]*\)', s)
        if m:
            for name in split_top(m.group(1)):
                fig.items.append({'k': 'label', 'at': fig.vars[name], 'text': name})
            continue
        if s.startswith('byPointLabelRemove'):
            continue
        raise ValueError('unknown statement: ' + s)
    return fig.items


def round_figure(items):
    """Two decimals is plenty for a picture an inch across."""
    def r(v):
        return [round(v[0], 2), round(v[1], 2)]
    out = []
    for item in items:
        got = dict(item)
        for key in ('a', 'b', 'c', 'v', 'at'):
            if key in got:
                got[key] = r(got[key])
        for key in ('r', 'from', 'to'):
            if key in got:
                got[key] = round(got[key], 2)
        out.append(got)
    return out


def figures_for(prefix, limit_at):
    """Every \\defineNewPicture that sits immediately before a \\startX."""
    found = {}
    follows = re.compile(r'\s*\\start\w+\s*\{[^{}]*\}\s*\\bylabel\s*\{'
                         + prefix + r':I\.([IVXL]+)\}')
    for m in re.finditer(r'\\defineNewPicture\s*\{', text):
        if m.start() > limit_at:
            break
        body, after = braced(text, m.end() - 1)
        belongs = follows.match(text, after)
        if not belongs:
            continue
        try:
            found[ROMAN[belongs.group(1)]] = round_figure(read_figure(body))
        except (ValueError, KeyError) as err:
            print(f'  skipped {prefix} I.{belongs.group(1)}: {err}', file=sys.stderr)
    return found


def line_colours(source):
    """Which colour each named line is given, without working out where it goes.

    The proposition figures are far beyond this reader — they intersect paths,
    loop, and define their own macros — but the one thing wanted from them is
    flat on the surface: byLineDefine says what colour AB is, and in Byrne the
    colour is how the proof refers to a line.
    """
    found = {}
    for m in re.finditer(r'byLineDefine\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(by\w+)', source):
        a, b, colour = m.group(1), m.group(2), m.group(3)
        if len(a) == 1 and len(b) == 1 and colour in COLOR:
            found.setdefault(a + b, COLOR[colour])
    return found


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

# Byrne's own colours, from byrnebook.cls.
data_colors = {}
for m in re.finditer(r'\\definecolor\{by(\w+)\}\{rgb\}\{([^}]*)\}', open('byrne/byrnebook.cls', encoding='utf-8').read()):
    r, g, b = (float(x) for x in m.group(2).split(','))
    data_colors[m.group(1)] = '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))

MATH = {
    r'\\therefore': '∴', r'\\because': '∵', r'\\neq': '≠', r'\\ngtr': '≯', r'\\nless': '≮',
    r'\\times': '×', r'\\parallel': '∥', r'\\perp': '⊥', r'\\pm': '±',
}


def symbol_of(raw):
    out = raw.strip()
    for pattern, glyph in MATH.items():
        out = re.sub(pattern, glyph, out)
    out = out.replace('\\drawTwoRightAngles', '⌐⌐').replace('$', '').strip()
    out = re.sub(r'\\drawAngle\s*\{([^{}]*)\}', r'∠\1', out)
    out = re.sub(r'\\indefstr', 'def.', out)
    out = re.sub(r'\\inpoststr', 'post.', out)
    out = re.sub(r'\\inaxstr', 'ax.', out)
    out = re.sub(r'\\conststr', 'const.', out)
    out = re.sub(r'\\qedstr', 'Q.E.D.', out)
    out = re.sub(r'\\[a-zA-Z]+', '', out)
    return re.sub(r'\s+', ' ', out).strip()


symbols = []
sym_start = text.index('\\chapter*{Symbols and abbreviations}')
sym_end = text.index('\\chapter*{Definitions}')
for m in re.finditer(r'\\symb\s*\{', text[sym_start:sym_end]):
    at = sym_start + m.end() - 1
    raw, after = braced(text, at)
    nxt = re.search(r'\\(symb|chapter)\b', text[after:sym_end])
    body = text[after:after + (nxt.start() if nxt else sym_end - after)]
    glyph = symbol_of(raw)
    meaning = clean(body)
    if glyph and meaning:
        symbols.append({'symbol': glyph, 'text': meaning})

data = {
    'symbols': symbols,
    'colors': data_colors,
    'definitions': collect('definition', 'def', prop_chapter),
    'postulates': collect('postulate', 'post', prop_chapter),
    'axioms': collect('axiom', 'ax', prop_chapter),
    'propositions': [],
    'figures': {'definitions': figures_for('def', prop_chapter)},
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
    # The proposition's own figure is declared between its heading and its
    # enunciation, and says what colour each line of it is.
    picture = re.search(r'\\defineNewPicture(?:\[[^\]]*\])?\s*\{', rest)
    colours = {}
    if picture and (not e or picture.start() < e.start()):
        body, _ = braced(rest, picture.end() - 1)
        colours = line_colours(body)
    data['propositions'].append({
        'n': ROMAN[roman],
        'roman': roman,
        'kind': 'problem' if kind == 'problem' else 'theorem',
        'heading': re.sub(r'\s+', ' ', heading).strip(),
        'text': enunciation,
        'lines': colours,
    })

json.dump(data, open('book1.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

FIGURES_JS = '''/**
 * What Byrne's own drawings say, read out of their MetaPost.
 *
 * Taken from jemmybutton/byrne-euclid, so these are his figures rather than an
 * imitation of them; CC-BY-SA 4.0 like the rest of that edition.
 *
 * Regenerate with tools/extract-byrne.py rather than editing by hand.
 */

/**
 * The small figure Byrne sets in the margin beside a definition, keyed by
 * definition number.
 *
 * Coordinates are in figure units, a hundred to Byrne's u, and y runs UP the
 * page as it does in MetaPost. Angles are in degrees, counter-clockwise from
 * east. Nothing here knows how large it will be drawn.
 *
 *   seg     a line from a to b
 *   circle  centre c, radius r
 *   arc     part of that circle, from one bearing to another
 *   angle   the wedge at v between two bearings; filled unless fill is false
 *   label   a letter naming the point at
 */
export const DEFINITION_FIGURES = {
%s}

/**
 * The colour each line of a proposition's figure is drawn in, keyed by
 * proposition number and then by the line's two letters.
 *
 * The proposition figures themselves are past this reader — they intersect
 * paths, loop, and define macros — but the colours are the argument: when
 * Byrne writes that AB equals DE he prints both in red, and the eye does the
 * work the letters would otherwise have to. Colouring the letters is the least
 * we can do until the figures themselves can be drawn.
 */
export const PROPOSITION_LINES = {
%s}
'''


def js_value(v):
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, float):
        return repr(int(v)) if v == int(v) else repr(v)
    if isinstance(v, list):
        return '[' + ', '.join(js_value(x) for x in v) + ']'
    return "'" + str(v) + "'"


rows = []
for n, items in sorted(data['figures']['definitions'].items()):
    body = ',\n'.join(
        '    { ' + ', '.join(f'{k}: {js_value(val)}' for k, val in item.items()) + ' }'
        for item in items)
    rows.append(f'  {n}: [\n{body},\n  ],\n')

lines = []
for p in data['propositions']:
    if not p['lines']:
        continue
    named = ', '.join(f"{k}: '{v}'" for k, v in p['lines'].items())
    lines.append(f"  {p['n']}: {{ {named} }},\n")

open('book1-figures.js', 'w', encoding='utf-8').write(
    FIGURES_JS % (''.join(rows), ''.join(lines)))
print('symbols   ', len(data['symbols']), [x['symbol'] for x in data['symbols']][:8])
print('colors    ', data['colors'])
print('definitions', len(data['definitions']))
print('postulates ', len(data['postulates']))
print('axioms     ', len(data['axioms']))
print('propositions', len(data['propositions']))
print('figures    ', len(data['figures']['definitions']), 'beside definitions',
      sorted(data['figures']['definitions']))
for p in data['propositions'][:4]:
    print(f"  {p['roman']} ({p['kind']}): {p['text'][:110]}")
