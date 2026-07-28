#!/usr/bin/env node
/**
 * Site media audit — crawl a site, inventory every image and video, and label
 * each one from the signals the page actually provides.
 *
 * Usage:
 *   node audit.mjs --url https://www.atismanipolatori.com --out ./out
 *   node audit.mjs --url https://example.com --max-pages 50 --delay 500
 *   node audit.mjs --from-html ./page.html --url https://example.com/page   # offline
 *
 * Outputs into --out:
 *   catalogue.json  full structured result
 *   catalogue.md    human-readable catalogue + accessibility summary
 *   assets.csv      flat asset list for bulk alt-text work
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { crawlSite } from './lib/crawl.mjs';
import { extractHeadings, extractTitle } from './lib/html.mjs';
import { extractMedia } from './lib/media.mjs';
import { renderCsv, renderMarkdown, summarise } from './lib/report.mjs';

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

function usage() {
  console.log(`
Site media audit — inventory and label every image and video on a site.

  --url <url>          Start URL (required)
  --out <dir>          Output directory (default: ./out)
  --max-pages <n>      Page cap (default: 400)
  --delay <ms>         Delay between requests (default: 800)
  --timeout <ms>       Per-request timeout (default: 20000)
  --include <regex>    Only crawl URLs matching this pattern
  --exclude <regex>    Skip URLs matching this pattern
  --ignore-robots      Crawl regardless of robots.txt (use only where entitled)
  --from-html <file>   Skip the network; extract from a saved HTML file
  --quiet              Suppress per-page logging
  --help               Show this message

Labels are derived only from what the page provides — figcaption, alt,
aria-label, title, link text, nearest heading, filename — and each label
records which signal produced it. Assets with no usable signal are reported
as needing visual review rather than being given an invented description.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.url && !args['from-html'])) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const outDir = resolve(args.out || './out');
  const log = args.quiet ? () => {} : (message) => console.error(message);
  const startedAt = new Date().toISOString();

  let result;

  if (args['from-html']) {
    // Offline mode: label a page you already have on disk.
    const pageUrl = args.url || 'https://example.invalid/';
    const html = await readFile(resolve(args['from-html']), 'utf8');
    const title = extractTitle(html);
    const headings = extractHeadings(html);
    const { images, videos } = extractMedia(html, pageUrl, { title, headings });
    result = {
      pages: [
        {
          url: pageUrl,
          finalUrl: pageUrl,
          status: 200,
          title,
          description: '',
          h1: headings.find((h) => h.level === 1)?.text || '',
          bytes: html.length,
          imageCount: images.length,
          videoCount: videos.length,
        },
      ],
      images,
      videos,
      errors: [],
      skipped: [],
      truncated: false,
      queueRemaining: 0,
    };
    log(`Parsed ${args['from-html']} — ${images.length} images, ${videos.length} videos`);
  } else {
    log(`Crawling ${args.url} …`);
    result = await crawlSite(args.url, {
      maxPages: Number(args['max-pages'] || 400),
      delayMs: Number(args.delay || 800),
      timeoutMs: Number(args.timeout || 20000),
      respectRobots: !args['ignore-robots'],
      includePattern: args.include ? new RegExp(args.include) : null,
      excludePattern: args.exclude ? new RegExp(args.exclude) : null,
      log,
    });
  }

  const meta = {
    site: args.url ? new URL(args.url).hostname : 'local file',
    startUrl: args.url || args['from-html'],
    startedAt,
  };

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
      `Unlabelled assets:    ${stats.unlabelled}`,
      `Needs visual review:  ${stats.needsVisualReview}`,
      `Errors:               ${stats.errors}`,
      '',
      `Written to ${outDir}`,
    ].join('\n')
  );

  if (stats.truncated) {
    console.log(`\n⚠️  Page cap reached — ${result.queueRemaining} URLs still queued.`);
  }
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`);
  if (/CONNECT tunnel failed|403|ENOTFOUND|EAI_AGAIN/i.test(String(error.message))) {
    console.error(
      'This looks like a network-policy block rather than a site error. ' +
        'Check that the environment allows outbound access to the target host.'
    );
  }
  process.exit(1);
});
