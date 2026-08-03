#!/usr/bin/env node
/**
 * Sitemap-driven audit: fetch every URL listed in the site's XML sitemaps,
 * extract media from each, and produce the same catalogue outputs as
 * audit.mjs. More complete and deterministic than link-discovery crawling
 * for a site that publishes a real Yoast sitemap index.
 *
 * Usage:
 *   node audit-sitemap.mjs --url https://www.atismanipolatori.com --out ./out
 *   node audit-sitemap.mjs --url https://site --exclude '/(en|fr|de)/' --out ./out
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { curlFetch } from './lib/curl-fetch.mjs';
import { extractHeadings, extractMeta, extractTitle } from './lib/html.mjs';
import { extractMedia } from './lib/media.mjs';
import { renderCsv, renderMarkdown, summarise } from './lib/report.mjs';

const USER_AGENT = 'ATIS-media-audit/1.0 (+site inventory; contact site owner)';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Recursively resolve a sitemap or sitemap-index URL into a flat page list. */
async function collectSitemapUrls(startUrl, { timeoutMs, log }) {
  const toVisit = [startUrl];
  const seen = new Set();
  const pageUrls = [];

  while (toVisit.length > 0) {
    const smUrl = toVisit.shift();
    if (seen.has(smUrl)) continue;
    seen.add(smUrl);

    const response = await curlFetch(smUrl, { headers: { 'user-agent': USER_AGENT }, timeoutMs });
    if (!response.ok) {
      log(`sitemap fetch failed: ${smUrl} (HTTP ${response.status})`);
      continue;
    }
    const body = await response.text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

    if (/<sitemapindex/.test(body)) {
      toVisit.push(...locs);
      log(`${smUrl} — sitemap index, ${locs.length} child sitemap(s)`);
    } else {
      pageUrls.push(...locs);
      log(`${smUrl} — ${locs.length} page(s)`);
    }
  }
  return pageUrls;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url || args.help) {
    console.log('Usage: node audit-sitemap.mjs --url <site> [--out ./out] [--delay 500] [--include re] [--exclude re] [--sitemap-url <url>]');
    process.exit(args.help ? 0 : 1);
  }

  const outDir = resolve(args.out || './out');
  const delayMs = Number(args.delay || 500);
  const timeoutMs = Number(args.timeout || 20000);
  const quiet = Boolean(args.quiet);
  const log = quiet ? () => {} : (m) => console.error(m);
  const includeRe = args.include ? new RegExp(args.include) : null;
  const excludeRe = args.exclude ? new RegExp(args.exclude) : null;
  const startedAt = new Date().toISOString();

  const origin = new URL(args.url).origin;
  const sitemapStart = args['sitemap-url'] || `${origin}/sitemap_index.xml`;

  log(`Resolving sitemap tree from ${sitemapStart} …`);
  let pageUrls = await collectSitemapUrls(sitemapStart, { timeoutMs, log });
  pageUrls = [...new Set(pageUrls)];

  if (includeRe) pageUrls = pageUrls.filter((u) => includeRe.test(u));
  if (excludeRe) pageUrls = pageUrls.filter((u) => !excludeRe.test(u));

  log(`\n${pageUrls.length} page(s) to fetch after filtering.\n`);

  const pages = [];
  const images = [];
  const videos = [];
  const errors = [];

  for (let i = 0; i < pageUrls.length; i += 1) {
    const url = pageUrls[i];
    let response;
    try {
      response = await curlFetch(url, { headers: { 'user-agent': USER_AGENT }, timeoutMs });
    } catch (error) {
      errors.push({ url, error: String(error.message || error) });
      log(`[${i + 1}/${pageUrls.length}] FAIL ${url} — ${error.message}`);
      if (delayMs > 0) await sleep(delayMs);
      continue;
    }

    if (!response.ok) {
      errors.push({ url, status: response.status, error: `HTTP ${response.status}` });
      log(`[${i + 1}/${pageUrls.length}] HTTP ${response.status} ${url}`);
      if (delayMs > 0) await sleep(delayMs);
      continue;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      if (delayMs > 0) await sleep(delayMs);
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

    log(`[${i + 1}/${pageUrls.length}] OK ${url} — ${pageImages.length} img, ${pageVideos.length} video`);

    if (delayMs > 0 && i < pageUrls.length - 1) await sleep(delayMs);
  }

  const result = { pages, images, videos, errors, skipped: [], truncated: false, queueRemaining: 0 };
  const meta = { site: new URL(args.url).hostname, startUrl: args.url, startedAt };

  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, 'catalogue.json'),
    JSON.stringify({ meta, summary: summarise(result), ...result }, null, 2)
  );
  await writeFile(join(outDir, 'catalogue.md'), renderMarkdown(result, meta));
  await writeFile(join(outDir, 'assets.csv'), renderCsv(result));

  const stats = summarise(result);
  console.log(
    [
      '',
      `Pages crawled:        ${stats.pages}`,
      `Images:               ${stats.images} (${stats.uniqueImages} unique)`,
      `Videos:               ${stats.videos} (${stats.uniqueVideos} unique)`,
      `Missing alt:          ${stats.missingAlt}`,
      `Needs visual review:  ${stats.needsVisualReview}`,
      `Errors:               ${stats.errors}`,
      '',
      `Written to ${outDir}`,
    ].join('\n')
  );
}

main().catch((error) => {
  console.error(`Failed: ${error.stack || error.message}`);
  process.exit(1);
});
