/* Allowlist sanitiser for the small amount of HTML the CMS editor produces.
 *
 * The FAQ answers are written in a rich-text editor, so what lands in the
 * database is markup: `<p>ขอใบ ร.ง.4 …</p>`. The public page printed it as
 * text, so visitors read the tags. Rendering it as HTML is the fix — but that
 * turns the CMS body into an injection point, and the FAQ is a public,
 * server-rendered page, so it has to be cleaned first.
 *
 * Hand-rolled rather than pulled from npm, matching the CSV parser: this runs
 * on every FAQ request against content from the database, and forty lines we
 * can read beats a dependency we cannot.
 *
 * The rule is allowlist, not blocklist. Anything not named here loses its
 * markup — the text inside is kept and escaped, so no content disappears
 * silently, it just stops being a tag.
 */

/** Structural and inline tags a FAQ answer legitimately needs. */
const ALLOWED = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'a', 'h3', 'h4', 'blockquote', 'code', 'pre', 'span',
]);

/** Void elements: emitted self-contained, never pushed on the close stack. */
const VOID = new Set(['br']);

/** Only `a` keeps an attribute, and only this one. */
const ALLOWED_ATTRS: Record<string, Set<string>> = { a: new Set(['href']) };

/* Elements whose *contents* are code, not text — dropping the tag alone would
   leave the script body as visible text, or worse, as markup once re-parsed. */
const DROP_WITH_CONTENT = /<\s*(script|style|iframe|object|embed|svg|math|template|noscript)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;

const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* A link may point at the web, an email, a phone number, or somewhere on this
 * site. Everything else — `javascript:`, `data:`, `vbscript:` — is dropped.
 * Control characters and entities are stripped before the check, because
 * `java\tscript:` and `java&#09;script:` are both live URLs in a browser. */
function safeHref(raw: string): string | null {
  const flat = raw
    .replace(/&#(\d+);?/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0020\u007f-\u00a0]/g, '')
    .toLowerCase();

  // no legitimate href carries a quote; one that does is trying to get out
  if (/["'<>`]/.test(raw)) return null;

  if (/^(https?:|mailto:|tel:)/.test(flat)) return raw.trim();
  // relative paths and in-page anchors carry no scheme at all
  if (/^[/#]/.test(flat) && !flat.includes(':')) return raw.trim();
  return null;
}

/** Parse the attributes of one opening tag, keeping only what is allowed. */
function keepAttrs(tag: string, rest: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return '';

  const out: string[] = [];
  const attr = /([a-z][a-z0-9-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = attr.exec(rest))) {
    const name = m[1].toLowerCase();
    if (!allowed.has(name)) continue;
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    if (name === 'href') {
      const href = safeHref(value);
      if (!href) continue;
      // an outbound link from our page should not hand over the opener
      out.push(`href="${escapeAttr(href)}" rel="noopener noreferrer"`);
    }
  }
  return out.length ? ' ' + out.join(' ') : '';
}

/**
 * Return HTML safe to pass to dangerouslySetInnerHTML.
 * Unknown tags lose their markup; their text survives, escaped.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  const src = input.replace(DROP_WITH_CONTENT, '').replace(/<!--[\s\S]*?-->/g, '');

  const open: string[] = [];
  let out = '';
  let i = 0;

  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) { out += escapeText(src.slice(i)); break; }

    out += escapeText(src.slice(i, lt));

    const gt = src.indexOf('>', lt);
    // a bare "<" that never closes is text, not a tag
    if (gt === -1) { out += escapeText(src.slice(lt)); break; }

    /* A "<" only opens a tag when a name or a slash follows it immediately.
       "5 < 10" is text, and so is "a < b" — which used to parse as <b> and
       swallow the paragraph's closing tag along with it. */
    if (!/^[a-zA-Z/]/.test(src.slice(lt + 1))) { out += escapeText('<'); i = lt + 1; continue; }

    const inner = src.slice(lt + 1, gt);
    const m = /^(\/?)\s*([a-z][a-z0-9]*)([\s\S]*)$/i.exec(inner);
    // a second "<" before the ">" means this was never a tag either
    if (!m || m[3].includes('<')) { out += escapeText('<'); i = lt + 1; continue; }

    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const rest = m[3] ?? '';

    if (!ALLOWED.has(tag)) { i = gt + 1; continue; } // drop the markup, keep the text

    if (closing) {
      const at = open.lastIndexOf(tag);
      if (at !== -1) { out += `</${tag}>`; open.splice(at, 1); }
    } else if (VOID.has(tag)) {
      out += `<${tag} />`;
    } else {
      out += `<${tag}${keepAttrs(tag, rest)}>`;
      open.push(tag);
    }
    i = gt + 1;
  }

  // close anything the editor left hanging, innermost first
  for (let k = open.length - 1; k >= 0; k--) out += `</${open[k]}>`;
  return out;
}

/** Plain text of the same content — for meta descriptions and search. */
export const htmlToText = (input: string): string =>
  sanitizeHtml(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
