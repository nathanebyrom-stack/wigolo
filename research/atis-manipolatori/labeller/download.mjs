#!/usr/bin/env node
/**
 * Download every unique image and video referenced in a catalogue.json,
 * into an organised folder, with a manifest linking each local file back to
 * its label, source page and alt text.
 *
 * Usage:
 *   node download.mjs --catalogue ./out/catalogue.json --out ./media
 *   node download.mjs --catalogue ./out/catalogue.json --out ./media --videos   # include video files
 *   node download.mjs --catalogue ./out/catalogue.json --out ./media --max-bytes 20000000
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { curlDownload } from './lib/curl-fetch.mjs';

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

/** Turn a URL into a filesystem-safe, collision-resistant filename. */
function safeFilename(url, usedNames) {
  let name;
  try {
    name = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'file');
  } catch {
    name = 'file';
  }
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150) || 'file';
  if (!/\.[a-z0-9]{2,5}$/i.test(name)) name += '.bin';

  let candidate = name;
  let n = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    const dot = name.lastIndexOf('.');
    candidate = dot === -1 ? `${name}-${n}` : `${name.slice(0, dot)}-${n}${name.slice(dot)}`;
    n += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.catalogue) {
    console.log(
      'Usage: node download.mjs --catalogue <catalogue.json> --out <dir> [--videos] [--delay 300] [--max-bytes N]'
    );
    process.exit(1);
  }

  const outDir = resolve(args.out || './media');
  const imagesDir = join(outDir, 'images');
  const videosDir = join(outDir, 'videos');
  const delayMs = Number(args.delay || 300);
  const timeoutMs = Number(args.timeout || 30000);
  const includeVideos = Boolean(args.videos);
  const maxBytes = args['max-bytes'] ? Number(args['max-bytes']) : Infinity;
  const log = args.quiet ? () => {} : (m) => console.error(m);

  const catalogue = JSON.parse(await readFile(resolve(args.catalogue), 'utf8'));
  const { images = [], videos = [] } = catalogue;

  await mkdir(imagesDir, { recursive: true });
  if (includeVideos) await mkdir(videosDir, { recursive: true });

  // Dedupe by URL, keeping the richest label/context seen for that asset.
  const uniqueImages = new Map();
  for (const image of images) {
    const existing = uniqueImages.get(image.src);
    if (!existing || (!existing.label && image.label)) uniqueImages.set(image.src, image);
  }
  const uniqueVideos = new Map();
  for (const video of videos) {
    const key = video.src || video.watchUrl;
    if (!key) continue;
    if (video.kind === 'embed') continue; // nothing to download — it's hosted elsewhere
    const existing = uniqueVideos.get(key);
    if (!existing || (!existing.label && video.label)) uniqueVideos.set(key, video);
  }

  log(
    `${uniqueImages.size} unique image(s) to download` +
      (includeVideos ? `, ${uniqueVideos.size} unique video file(s)` : ', videos skipped (pass --videos to include)')
  );

  const usedImageNames = new Set();
  const usedVideoNames = new Set();
  const manifest = [];
  let downloaded = 0;
  let failed = 0;
  let skippedLarge = 0;

  const targets = [
    ...[...uniqueImages.values()].map((item) => ({ ...item, mediaType: 'image', dir: imagesDir, used: usedImageNames })),
    ...(includeVideos
      ? [...uniqueVideos.values()].map((item) => ({ ...item, mediaType: 'video', dir: videosDir, used: usedVideoNames }))
      : []),
  ];

  for (let i = 0; i < targets.length; i += 1) {
    const item = targets[i];
    const filename = safeFilename(item.src, item.used);
    const destPath = join(item.dir, filename);

    let result;
    try {
      result = await curlDownload(item.src, destPath, {
        headers: { 'user-agent': USER_AGENT },
        timeoutMs,
      });
    } catch (error) {
      failed += 1;
      log(`[${i + 1}/${targets.length}] FAIL ${item.src} — ${error.message}`);
      manifest.push({ ...baseManifestRow(item), status: 'error', error: String(error.message || error) });
      if (delayMs > 0) await sleep(delayMs);
      continue;
    }

    if (result.status < 200 || result.status >= 300) {
      failed += 1;
      log(`[${i + 1}/${targets.length}] HTTP ${result.status} ${item.src}`);
      manifest.push({ ...baseManifestRow(item), status: `http-${result.status}` });
      if (delayMs > 0) await sleep(delayMs);
      continue;
    }

    if (result.bytes > maxBytes) {
      skippedLarge += 1;
      log(`[${i + 1}/${targets.length}] SKIP (${result.bytes} bytes > cap) ${item.src}`);
      manifest.push({ ...baseManifestRow(item), status: 'skipped-too-large', bytes: result.bytes });
      if (delayMs > 0) await sleep(delayMs);
      continue;
    }

    downloaded += 1;
    log(`[${i + 1}/${targets.length}] OK ${item.mediaType} ${filename} (${result.bytes} bytes)`);
    manifest.push({
      ...baseManifestRow(item),
      status: 'downloaded',
      localPath: destPath,
      relativePath: join(item.mediaType === 'image' ? 'images' : 'videos', filename),
      bytes: result.bytes,
      contentType: result.contentType,
    });

    if (delayMs > 0 && i < targets.length - 1) await sleep(delayMs);
  }

  function baseManifestRow(item) {
    return {
      type: item.mediaType,
      url: item.src,
      label: item.label ?? '',
      labelSource: item.labelSource ?? '',
      needsVisualReview: Boolean(item.needsVisualReview),
      alt: item.alt ?? '',
      section: item.section ?? '',
      pageUrl: item.pageUrl ?? '',
      pageTitle: item.pageTitle ?? '',
    };
  }

  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const csvHeader = [
    'type', 'status', 'local_path', 'label', 'label_source', 'needs_visual_review',
    'alt', 'section', 'bytes', 'page_url', 'page_title', 'url',
  ];
  const quote = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvRows = manifest.map((row) =>
    [
      row.type, row.status, row.relativePath || '', row.label, row.labelSource,
      row.needsVisualReview, row.alt, row.section, row.bytes ?? '', row.pageUrl, row.pageTitle, row.url,
    ]
      .map(quote)
      .join(',')
  );
  await writeFile(join(outDir, 'manifest.csv'), [csvHeader.map(quote).join(','), ...csvRows].join('\n'));

  console.log(
    [
      '',
      `Downloaded: ${downloaded}`,
      `Failed:     ${failed}`,
      `Skipped (too large): ${skippedLarge}`,
      '',
      `Images: ${imagesDir}`,
      includeVideos ? `Videos: ${videosDir}` : 'Videos: skipped (pass --videos to include)',
      `Manifest: ${join(outDir, 'manifest.json')} / manifest.csv`,
    ].join('\n')
  );
}

main().catch((error) => {
  console.error(`Failed: ${error.stack || error.message}`);
  process.exit(1);
});
