/**
 * Media extraction and label derivation.
 *
 * Design rule that matters: a label is never invented. Every label carries the
 * signal it came from (`labelSource`). When a media element carries no usable
 * signal at all, `label` stays null and `needsVisualReview` is set — that asset
 * has to be looked at by a human or a vision model before it can be described.
 */

import {
  figcaptionAround,
  headingBefore,
  iterTags,
  normalizeText,
  stripTags,
  textAround,
} from './html.mjs';

/** Signals that can name a media asset, best first. */
const LABEL_SOURCES = [
  'figcaption',
  'alt',
  'aria-label',
  'title',
  'link-text',
  'heading',
  'filename',
];

const IMAGE_EXT = /\.(?:jpe?g|png|gif|webp|avif|bmp|svg|tiff?)(?:$|[?#])/i;
const VIDEO_EXT = /\.(?:mp4|webm|ogv|ogg|mov|m4v|avi)(?:$|[?#])/i;

/** Absolutise a URL found in markup; returns '' for unusable values. */
export function resolveUrl(raw, base) {
  const value = (raw || '').trim();
  if (!value) return '';
  if (/^(?:data|javascript|mailto|tel|about|blob):/i.test(value)) return '';
  try {
    return new URL(value, base).href;
  } catch {
    return '';
  }
}

/** First (smallest-index) candidate from a srcset attribute. */
export function firstFromSrcset(srcset, base) {
  if (!srcset) return '';
  const first = srcset.split(',')[0]?.trim().split(/\s+/)[0];
  return resolveUrl(first, base);
}

/** All candidates from a srcset, with their descriptors. */
export function parseSrcset(srcset, base) {
  if (!srcset) return [];
  return srcset
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, descriptor = ''] = part.split(/\s+/);
      return { url: resolveUrl(url, base), descriptor };
    })
    .filter((entry) => entry.url);
}

/** Turn an asset filename into a readable phrase: a weak but real signal. */
export function filenameLabel(url) {
  try {
    const name = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    const stem = name.replace(/\.[a-z0-9]+$/i, '');
    // Reject opaque names — hashes, bare numbers, CMS ids tell us nothing.
    if (!stem || stem.length < 4) return '';
    if (/^[0-9a-f]{8,}$/i.test(stem)) return '';
    if (/^[\d_\-]+$/.test(stem)) return '';
    const words = stem
      .replace(/[-_+.]+/g, ' ')
      .replace(/\b\d{2,4}x\d{2,4}\b/gi, ' ')
      .replace(/\b(?:scaled|thumb|thumbnail|small|medium|large|copy|final|img|image|foto)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // After stripping boilerplate a name like "IMG_4471" collapses to digits,
    // which describes nothing. Require at least one real word to survive.
    if (!/[a-zA-ZÀ-ÿ]{3,}/.test(words)) return '';
    return words.length >= 4 ? words : '';
  } catch {
    return '';
  }
}

/** Text of the <a> wrapping this offset, if the media sits inside a link. */
function linkTextAround(html, offset, window = 800) {
  const from = Math.max(0, offset - window);
  const slice = html.slice(from, offset);
  const open = slice.lastIndexOf('<a ');
  if (open === -1) return { text: '', href: '' };
  const closed = slice.slice(open).lastIndexOf('</a>');
  if (closed !== -1) return { text: '', href: '' }; // link already closed before us
  const tagEnd = slice.indexOf('>', open);
  if (tagEnd === -1) return { text: '', href: '' };
  const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(slice.slice(open, tagEnd));
  const after = html.slice(offset, offset + window);
  const linkClose = after.indexOf('</a>');
  const inner = linkClose === -1 ? '' : stripTags(after.slice(0, linkClose));
  return { text: inner, href: hrefMatch ? hrefMatch[1] : '' };
}

/**
 * Choose the label and record where it came from.
 * `candidates` maps a source name to its raw text.
 */
export function deriveLabel(candidates) {
  for (const source of LABEL_SOURCES) {
    const value = normalizeText(candidates[source] || '');
    if (!value) continue;
    // A filename-derived label is a hint, not a description.
    if (source === 'filename' && value.split(' ').length < 2) continue;
    return { label: value, labelSource: source };
  }
  return { label: null, labelSource: null };
}

/** True when the alt attribute is absent (vs present-but-empty, which is valid for decorative images). */
function altState(attrs) {
  if (!('alt' in attrs)) return 'missing';
  return normalizeText(attrs.alt) ? 'present' : 'empty';
}

/** Recognise an embedded video player and normalise its identity. */
export function classifyEmbed(url) {
  if (!url) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (/(?:^|\.)youtube(?:-nocookie)?\.com$/.test(host)) {
    const id = parsed.pathname.startsWith('/embed/')
      ? parsed.pathname.slice(7).split('/')[0]
      : parsed.searchParams.get('v') || '';
    return id ? { provider: 'youtube', id, watchUrl: `https://www.youtube.com/watch?v=${id}` } : null;
  }
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return id ? { provider: 'youtube', id, watchUrl: `https://www.youtube.com/watch?v=${id}` } : null;
  }
  if (/(?:^|\.)vimeo\.com$/.test(host) || host === 'player.vimeo.com') {
    const id = (parsed.pathname.match(/(\d{6,})/) || [])[1] || '';
    return id ? { provider: 'vimeo', id, watchUrl: `https://vimeo.com/${id}` } : null;
  }
  return null;
}

/**
 * Extract every image and video reference from a page, each with the context
 * needed to label it and the provenance of the label chosen.
 */
export function extractMedia(html, pageUrl, pageContext = {}) {
  const headings = pageContext.headings || [];
  const images = [];
  const videos = [];
  const seenImages = new Set();

  for (const tag of iterTags(html, ['img', 'source', 'video', 'iframe', 'embed', 'object'])) {
    const { attrs, name, start } = tag;

    if (name === 'img') {
      // Lazy-loading themes hide the real URL in a data- attribute.
      const src =
        resolveUrl(attrs.src, pageUrl) ||
        resolveUrl(attrs['data-src'] || attrs['data-lazy-src'] || attrs['data-original'], pageUrl) ||
        firstFromSrcset(attrs.srcset || attrs['data-srcset'], pageUrl);
      if (!src || seenImages.has(src)) continue;
      seenImages.add(src);

      const figcaption = figcaptionAround(html, start);
      const link = linkTextAround(html, start);
      const heading = headingBefore(headings, start);
      const state = altState(attrs);
      const { label, labelSource } = deriveLabel({
        figcaption,
        alt: attrs.alt,
        'aria-label': attrs['aria-label'],
        title: attrs.title,
        'link-text': link.text,
        heading,
        filename: filenameLabel(src),
      });

      images.push({
        type: 'image',
        src,
        srcset: parseSrcset(attrs.srcset || attrs['data-srcset'], pageUrl),
        alt: state === 'present' ? normalizeText(attrs.alt) : '',
        altState: state,
        title: normalizeText(attrs.title || ''),
        ariaLabel: normalizeText(attrs['aria-label'] || ''),
        figcaption,
        linkedTo: resolveUrl(link.href, pageUrl),
        section: heading,
        context: textAround(html, start),
        width: attrs.width || '',
        height: attrs.height || '',
        loading: attrs.loading || '',
        label,
        labelSource,
        needsVisualReview: label === null || labelSource === 'filename' || labelSource === 'heading',
        pageUrl,
        pageTitle: pageContext.title || '',
      });
      continue;
    }

    if (name === 'video') {
      const src = resolveUrl(attrs.src, pageUrl);
      const poster = resolveUrl(attrs.poster, pageUrl);
      const heading = headingBefore(headings, start);
      const figcaption = figcaptionAround(html, start);
      const { label, labelSource } = deriveLabel({
        figcaption,
        'aria-label': attrs['aria-label'],
        title: attrs.title,
        heading,
        filename: filenameLabel(src),
      });
      videos.push({
        type: 'video',
        kind: 'html5',
        src,
        sources: [],
        poster,
        figcaption,
        section: heading,
        context: textAround(html, start),
        controls: 'controls' in attrs,
        autoplay: 'autoplay' in attrs,
        loop: 'loop' in attrs,
        muted: 'muted' in attrs,
        label,
        labelSource,
        needsVisualReview: label === null || labelSource === 'filename' || labelSource === 'heading',
        pageUrl,
        pageTitle: pageContext.title || '',
      });
      continue;
    }

    if (name === 'source') {
      // Attach to the most recent <video>, else treat as a <picture> candidate.
      const src = resolveUrl(attrs.src, pageUrl) || firstFromSrcset(attrs.srcset, pageUrl);
      if (!src) continue;
      const last = videos[videos.length - 1];
      if (last && last.kind === 'html5' && VIDEO_EXT.test(src)) {
        last.sources.push({ url: src, type: attrs.type || '' });
        if (!last.src) last.src = src;
      }
      continue;
    }

    if (name === 'iframe' || name === 'embed' || name === 'object') {
      const raw = attrs.src || attrs.data || attrs['data-src'];
      const src = resolveUrl(raw, pageUrl);
      const embed = classifyEmbed(src);
      if (!embed) continue;
      const heading = headingBefore(headings, start);
      const figcaption = figcaptionAround(html, start);
      const { label, labelSource } = deriveLabel({
        figcaption,
        title: attrs.title,
        'aria-label': attrs['aria-label'],
        heading,
      });
      videos.push({
        type: 'video',
        kind: 'embed',
        provider: embed.provider,
        videoId: embed.id,
        src,
        watchUrl: embed.watchUrl,
        thumbnail:
          embed.provider === 'youtube'
            ? `https://img.youtube.com/vi/${embed.id}/hqdefault.jpg`
            : '',
        figcaption,
        section: heading,
        context: textAround(html, start),
        iframeTitle: normalizeText(attrs.title || ''),
        label,
        labelSource,
        needsVisualReview: label === null || labelSource === 'heading',
        pageUrl,
        pageTitle: pageContext.title || '',
      });
    }
  }

  // CSS background images — galleries on older themes lean on these heavily.
  const styleRe = /style\s*=\s*["'][^"']*background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi;
  let styleMatch;
  while ((styleMatch = styleRe.exec(html)) !== null) {
    const src = resolveUrl(styleMatch[2], pageUrl);
    if (!src || seenImages.has(src) || !IMAGE_EXT.test(src)) continue;
    seenImages.add(src);
    const heading = headingBefore(headings, styleMatch.index);
    const { label, labelSource } = deriveLabel({
      heading,
      filename: filenameLabel(src),
    });
    images.push({
      type: 'image',
      src,
      srcset: [],
      alt: '',
      altState: 'n/a-css-background',
      title: '',
      ariaLabel: '',
      figcaption: '',
      linkedTo: '',
      section: heading,
      context: textAround(html, styleMatch.index),
      width: '',
      height: '',
      loading: '',
      label,
      labelSource,
      needsVisualReview: true,
      pageUrl,
      pageTitle: pageContext.title || '',
    });
  }

  // Direct links to media files count as assets too.
  for (const tag of iterTags(html, ['a'])) {
    const href = resolveUrl(tag.attrs.href, pageUrl);
    if (!href) continue;
    if (VIDEO_EXT.test(href)) {
      const text = normalizeText(stripTags(html.slice(tag.end, tag.end + 300).split('</a>')[0] || ''));
      const { label, labelSource } = deriveLabel({
        'link-text': text,
        heading: headingBefore(headings, tag.start),
        filename: filenameLabel(href),
      });
      videos.push({
        type: 'video',
        kind: 'file-link',
        src: href,
        sources: [],
        poster: '',
        figcaption: '',
        section: headingBefore(headings, tag.start),
        context: textAround(html, tag.start),
        label,
        labelSource,
        needsVisualReview: label === null || labelSource === 'filename',
        pageUrl,
        pageTitle: pageContext.title || '',
      });
    }
  }

  return { images, videos };
}

export { IMAGE_EXT, VIDEO_EXT };
