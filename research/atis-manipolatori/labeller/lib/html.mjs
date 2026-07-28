/**
 * Minimal dependency-free HTML scanning helpers.
 *
 * This is deliberately not a full parser. It is a tag scanner tuned for one
 * job: finding media elements and the text that surrounds them, on ordinary
 * server-rendered marketing pages. It tolerates unclosed tags and malformed
 * attributes, which is what an older CMS-driven site tends to emit.
 */

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  igrave: 'ì',
  ograve: 'ò',
  ugrave: 'ù',
  deg: '°',
  reg: '®',
  copy: '©',
  trade: '™',
};

/** Decode the entity subset that shows up in page copy and alt text. */
export function decodeEntities(input) {
  if (!input) return '';
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? match : named;
  });
}

/** Collapse whitespace and decode entities — the standard cleanup for extracted text. */
export function normalizeText(input) {
  return decodeEntities(input || '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove script/style blocks, then all tags, leaving readable text. */
export function stripTags(html) {
  return normalizeText(
    (html || '')
      .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

const ATTR_RE = /([\w:@.\-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/** Parse a raw attribute string into a lowercased-key object. */
export function parseAttrs(raw) {
  const attrs = {};
  if (!raw) return attrs;
  ATTR_RE.lastIndex = 0;
  let match;
  while ((match = ATTR_RE.exec(raw)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = decodeEntities(value);
  }
  return attrs;
}

const TAG_RE = /<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

/** Yield every opening tag with its parsed attributes and source offsets. */
export function* iterTags(html, names) {
  const wanted = names ? new Set(names.map((n) => n.toLowerCase())) : null;
  TAG_RE.lastIndex = 0;
  let match;
  while ((match = TAG_RE.exec(html)) !== null) {
    const name = match[1].toLowerCase();
    if (wanted && !wanted.has(name)) continue;
    yield {
      name,
      attrs: parseAttrs(match[2]),
      start: match.index,
      end: match.index + match[0].length,
    };
  }
}

/** Text content of the first <title> element. */
export function extractTitle(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? normalizeText(match[1]) : '';
}

/** Content of a <meta name|property="..."> tag. */
export function extractMeta(html, key) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)\\s*=\\s*["']${key}["'][^>]*>`,
    'i'
  );
  const match = re.exec(html);
  if (!match) return '';
  return normalizeText(parseAttrs(match[0].slice(5, -1)).content || '');
}

/** All headings in document order, with their source offset. */
export function extractHeadings(html) {
  const headings = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const text = stripTags(match[2]);
    if (text) headings.push({ level: Number(match[1]), text, offset: match.index });
  }
  return headings;
}

/** The nearest heading appearing before `offset` — the media element's section. */
export function headingBefore(headings, offset) {
  let found = null;
  for (const heading of headings) {
    if (heading.offset > offset) break;
    found = heading;
  }
  return found ? found.text : '';
}

/**
 * The <figcaption> belonging to the <figure> that encloses `offset`, if any.
 * Scans a bounded window so a malformed document cannot cost us the whole page.
 */
export function figcaptionAround(html, offset, window = 1500) {
  const from = Math.max(0, offset - window);
  const to = Math.min(html.length, offset + window);
  const slice = html.slice(from, to);
  const here = offset - from;
  const figureOpen = slice.lastIndexOf('<figure', here);
  if (figureOpen === -1) return '';
  const figureClose = slice.indexOf('</figure>', figureOpen);
  // The nearest preceding <figure> may already have closed before us, in which
  // case it does not enclose this element and its caption is not ours.
  if (figureClose !== -1 && figureClose < here) return '';
  const region = slice.slice(figureOpen, figureClose === -1 ? slice.length : figureClose);
  const caption = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(region);
  return caption ? stripTags(caption[1]) : '';
}

/** Readable text immediately surrounding `offset`, for human review context. */
export function textAround(html, offset, window = 400) {
  const before = stripTags(html.slice(Math.max(0, offset - window), offset));
  const after = stripTags(html.slice(offset, Math.min(html.length, offset + window)));
  return normalizeText(`${before.slice(-200)} … ${after.slice(0, 200)}`);
}
