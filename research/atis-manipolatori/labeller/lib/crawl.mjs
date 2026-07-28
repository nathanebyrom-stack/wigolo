/**
 * Polite same-host crawler.
 *
 * Defaults are conservative on purpose: one request at a time with a delay,
 * robots.txt respected, and a page cap. This tool is for auditing a site you
 * are entitled to audit, not for hammering it.
 */

import { extractHeadings, extractMeta, extractTitle, iterTags } from './html.mjs';
import { extractMedia, resolveUrl } from './media.mjs';

const SKIP_EXT =
  /\.(?:pdf|zip|rar|7z|gz|tgz|doc|docx|xls|xlsx|ppt|pptx|dwg|dxf|step|stp|exe|dmg|css|js|json|xml|rss|jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mov|avi|mp3|wav|woff2?|ttf|eot)(?:$|[?#])/i;

/** Strip the fragment and normalise so the same page is not queued twice. */
export function canonicalise(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    // Common tracking params add nothing and split the queue.
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(?:utm_|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) parsed.searchParams.delete(key);
    }
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.href;
  } catch {
    return '';
  }
}

/** Parse the Disallow rules that apply to our user-agent. */
export function parseRobots(text, userAgent = '*') {
  const disallow = [];
  const allow = [];
  let applies = false;
  for (const rawLine of (text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      const agent = value.toLowerCase();
      applies = agent === '*' || userAgent.toLowerCase().includes(agent);
    } else if (applies && key === 'disallow' && value) {
      disallow.push(value);
    } else if (applies && key === 'allow' && value) {
      allow.push(value);
    }
  }
  return { disallow, allow };
}

/** Longest-match wins, as per the de-facto robots rules. */
export function robotsAllows(rules, pathname) {
  if (!rules) return true;
  const match = (patterns) =>
    patterns.reduce((best, pattern) => {
      const literal = pattern.replace(/\*$/, '');
      return pathname.startsWith(literal) && literal.length > best ? literal.length : best;
    }, 0);
  return match(rules.allow) >= match(rules.disallow) || match(rules.disallow) === 0;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Fetch with a timeout and bounded retries on transient failures. */
export async function fetchWithRetry(url, { userAgent, timeoutMs, retries, onRetry }) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (response.status >= 500 && attempt < retries) {
        lastError = new Error(`HTTP ${response.status}`);
        await sleep(2 ** attempt * 1000);
        onRetry?.(url, attempt + 1, lastError);
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await sleep(2 ** attempt * 1000);
        onRetry?.(url, attempt + 1, error);
      }
    }
  }
  throw lastError;
}

/**
 * Breadth-first crawl of one host, collecting media as it goes.
 * Returns { pages, images, videos, errors, skipped }.
 */
export async function crawlSite(startUrl, options = {}) {
  const {
    maxPages = 400,
    delayMs = 800,
    timeoutMs = 20000,
    retries = 2,
    userAgent = 'ATIS-media-audit/1.0 (+site inventory; contact site owner)',
    respectRobots = true,
    includePattern = null,
    excludePattern = null,
    log = () => {},
  } = options;

  const origin = new URL(startUrl).origin;
  const queue = [canonicalise(startUrl)];
  const seen = new Set(queue);
  const pages = [];
  const images = [];
  const videos = [];
  const errors = [];
  const skipped = [];

  let rules = null;
  if (respectRobots) {
    try {
      const response = await fetchWithRetry(`${origin}/robots.txt`, {
        userAgent,
        timeoutMs,
        retries: 1,
      });
      if (response.ok) {
        rules = parseRobots(await response.text(), userAgent);
        log(`robots.txt: ${rules.disallow.length} disallow rules`);
      } else {
        log(`robots.txt: HTTP ${response.status} — proceeding with no restrictions`);
      }
    } catch (error) {
      log(`robots.txt: unreachable (${error.message}) — proceeding with no restrictions`);
    }
  }

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift();
    const pathname = new URL(url).pathname;

    if (respectRobots && !robotsAllows(rules, pathname)) {
      skipped.push({ url, reason: 'robots-disallow' });
      continue;
    }
    if (includePattern && !includePattern.test(url)) {
      skipped.push({ url, reason: 'not-included' });
      continue;
    }
    if (excludePattern && excludePattern.test(url)) {
      skipped.push({ url, reason: 'excluded' });
      continue;
    }

    let response;
    try {
      response = await fetchWithRetry(url, { userAgent, timeoutMs, retries, onRetry: log });
    } catch (error) {
      errors.push({ url, error: String(error.message || error) });
      log(`FAIL ${url} — ${error.message}`);
      continue;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      errors.push({ url, status: response.status, error: `HTTP ${response.status}` });
      log(`HTTP ${response.status} ${url}`);
      continue;
    }
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      skipped.push({ url, reason: `content-type:${contentType}` });
      continue;
    }

    const html = await response.text();
    const title = extractTitle(html);
    const headings = extractHeadings(html);
    const context = { title, headings };

    const { images: pageImages, videos: pageVideos } = extractMedia(html, url, context);
    images.push(...pageImages);
    videos.push(...pageVideos);

    pages.push({
      url,
      finalUrl: response.url,
      status: response.status,
      title,
      description: extractMeta(html, 'description'),
      h1: headings.find((h) => h.level === 1)?.text || '',
      bytes: html.length,
      imageCount: pageImages.length,
      videoCount: pageVideos.length,
    });
    log(`OK  ${url} — ${pageImages.length} img, ${pageVideos.length} video`);

    for (const tag of iterTags(html, ['a'])) {
      const href = resolveUrl(tag.attrs.href, url);
      if (!href) continue;
      const next = canonicalise(href);
      if (!next || seen.has(next)) continue;
      if (!next.startsWith(origin)) continue;
      if (SKIP_EXT.test(next)) continue;
      seen.add(next);
      queue.push(next);
    }

    if (delayMs > 0 && queue.length > 0) await sleep(delayMs);
  }

  return {
    pages,
    images,
    videos,
    errors,
    skipped,
    truncated: queue.length > 0,
    queueRemaining: queue.length,
  };
}
