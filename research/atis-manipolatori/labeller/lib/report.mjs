/**
 * Render a crawl result into a human-readable catalogue plus an accessibility
 * summary. The catalogue is the deliverable; the summary is what you hand to
 * whoever owns the site.
 */

/** Group items by a key, preserving first-seen order. */
function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .trim();
}

function truncate(value, max = 120) {
  const text = String(value ?? '').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Counts that describe the health of the media estate. */
export function summarise(result) {
  const { images, videos, pages } = result;
  const missingAlt = images.filter((i) => i.altState === 'missing');
  const emptyAlt = images.filter((i) => i.altState === 'empty');
  const cssBackground = images.filter((i) => i.altState === 'n/a-css-background');
  const unlabelled = [...images, ...videos].filter((m) => m.label === null);
  const needsReview = [...images, ...videos].filter((m) => m.needsVisualReview);
  const uniqueImages = new Set(images.map((i) => i.src));
  const uniqueVideos = new Set(videos.map((v) => v.src || v.watchUrl));

  const bySource = {};
  for (const item of [...images, ...videos]) {
    const key = item.labelSource || 'none';
    bySource[key] = (bySource[key] || 0) + 1;
  }

  return {
    pages: pages.length,
    images: images.length,
    uniqueImages: uniqueImages.size,
    videos: videos.length,
    uniqueVideos: uniqueVideos.size,
    missingAlt: missingAlt.length,
    emptyAlt: emptyAlt.length,
    cssBackground: cssBackground.length,
    unlabelled: unlabelled.length,
    needsVisualReview: needsReview.length,
    labelSources: bySource,
    errors: result.errors.length,
    truncated: Boolean(result.truncated),
  };
}

/** The full Markdown catalogue. */
export function renderMarkdown(result, meta = {}) {
  const stats = summarise(result);
  const lines = [];

  lines.push(`# Media catalogue — ${meta.site || 'site'}`);
  lines.push('');
  lines.push(`**Crawled:** ${meta.startedAt || new Date().toISOString()}`);
  lines.push(`**Start URL:** ${meta.startUrl || ''}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|---|---:|');
  lines.push(`| Pages crawled | ${stats.pages} |`);
  lines.push(`| Images found | ${stats.images} (${stats.uniqueImages} unique) |`);
  lines.push(`| Videos found | ${stats.videos} (${stats.uniqueVideos} unique) |`);
  lines.push(`| Images missing an \`alt\` attribute | ${stats.missingAlt} |`);
  lines.push(`| Images with empty \`alt\` (decorative) | ${stats.emptyAlt} |`);
  lines.push(`| CSS background images (no alt possible) | ${stats.cssBackground} |`);
  lines.push(`| Assets with no usable label signal | ${stats.unlabelled} |`);
  lines.push(`| Assets needing visual review | ${stats.needsVisualReview} |`);
  lines.push(`| Fetch errors | ${stats.errors} |`);
  lines.push('');

  if (stats.truncated) {
    lines.push(
      `> ⚠️ Crawl hit its page cap — ${result.queueRemaining} URLs were still queued. Raise \`--max-pages\` for full coverage.`
    );
    lines.push('');
  }

  lines.push('### Where labels came from');
  lines.push('');
  lines.push('| Signal | Assets |');
  lines.push('|---|---:|');
  for (const [source, count] of Object.entries(stats.labelSources).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${source === 'none' ? '_no signal — unlabelled_' : source} | ${count} |`);
  }
  lines.push('');
  lines.push(
    'Labels are taken from the page, never invented. `figcaption`, `alt`, `aria-label` and ' +
      '`title` are authored descriptions. `link-text` and `heading` are contextual. `filename` ' +
      'is a weak hint. Anything marked **review** needs a human or vision model to describe it.'
  );
  lines.push('');

  lines.push('## Videos');
  lines.push('');
  if (result.videos.length === 0) {
    lines.push('_No video elements or embeds found._');
    lines.push('');
  } else {
    lines.push('| Label | Source | Kind | URL | Page |');
    lines.push('|---|---|---|---|---|');
    for (const video of result.videos) {
      const label = video.label ? escapeCell(truncate(video.label)) : '**review — unlabelled**';
      const url = video.watchUrl || video.src;
      lines.push(
        `| ${label} | ${video.labelSource || '—'} | ${video.kind}${
          video.provider ? `/${video.provider}` : ''
        } | ${escapeCell(url)} | ${escapeCell(video.pageUrl)} |`
      );
    }
    lines.push('');
  }

  lines.push('## Images by page');
  lines.push('');
  const byPage = groupBy(result.images, (image) => image.pageUrl);
  for (const [pageUrl, pageImages] of byPage) {
    const page = result.pages.find((p) => p.url === pageUrl);
    lines.push(`### ${page?.title || pageUrl}`);
    lines.push('');
    lines.push(`\`${pageUrl}\` — ${pageImages.length} image(s)`);
    lines.push('');
    lines.push('| # | Label | Signal | alt | Section | File |');
    lines.push('|---:|---|---|---|---|---|');
    pageImages.forEach((image, index) => {
      const label = image.label
        ? escapeCell(truncate(image.label))
        : '**review — unlabelled**';
      const altCell =
        image.altState === 'missing'
          ? '⚠️ missing'
          : image.altState === 'empty'
            ? '_empty_'
            : escapeCell(truncate(image.alt, 60));
      const file = image.src.split('/').pop() || image.src;
      lines.push(
        `| ${index + 1} | ${label} | ${image.labelSource || '—'} | ${altCell} | ${escapeCell(
          truncate(image.section, 40)
        )} | ${escapeCell(truncate(file, 50))} |`
      );
    });
    lines.push('');
  }

  if (result.errors.length > 0) {
    lines.push('## Fetch errors');
    lines.push('');
    lines.push('| URL | Error |');
    lines.push('|---|---|');
    for (const error of result.errors) {
      lines.push(`| ${escapeCell(error.url)} | ${escapeCell(error.error)} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** Flat CSV of every asset — for spreadsheets and bulk alt-text work. */
export function renderCsv(result) {
  const rows = [
    [
      'type',
      'kind',
      'url',
      'label',
      'label_source',
      'needs_visual_review',
      'alt_state',
      'alt',
      'figcaption',
      'section',
      'page_url',
      'page_title',
    ],
  ];
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  for (const image of result.images) {
    rows.push([
      'image',
      'img',
      image.src,
      image.label ?? '',
      image.labelSource ?? '',
      image.needsVisualReview,
      image.altState,
      image.alt,
      image.figcaption,
      image.section,
      image.pageUrl,
      image.pageTitle,
    ]);
  }
  for (const video of result.videos) {
    rows.push([
      'video',
      video.kind,
      video.watchUrl || video.src,
      video.label ?? '',
      video.labelSource ?? '',
      video.needsVisualReview,
      '',
      '',
      video.figcaption,
      video.section,
      video.pageUrl,
      video.pageTitle,
    ]);
  }

  return rows.map((row) => row.map(quote).join(',')).join('\n');
}
