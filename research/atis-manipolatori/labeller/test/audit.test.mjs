import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalise, parseRobots, robotsAllows } from '../lib/crawl.mjs';
import { decodeEntities, extractHeadings, extractTitle, stripTags } from '../lib/html.mjs';
import { classifyEmbed, deriveLabel, extractMedia, filenameLabel } from '../lib/media.mjs';
import { renderCsv, renderMarkdown, summarise } from '../lib/report.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PAGE_URL = 'https://www.atismanipolatori.com/Applicazioni/Applicazioni-Foto/08.-Bobine/Bobine';

async function loadFixture() {
  const html = await readFile(join(here, 'fixtures', 'gallery.html'), 'utf8');
  const context = { title: extractTitle(html), headings: extractHeadings(html) };
  return { html, context, ...extractMedia(html, PAGE_URL, context) };
}

test('html: entities and tag stripping', () => {
  assert.equal(decodeEntities('Bobine &amp; rotoli &#8211; ATIS'), 'Bobine & rotoli – ATIS');
  assert.equal(stripTags('<p>Ciao <b>mondo</b></p><script>x=1</script>'), 'Ciao mondo');
});

test('html: title and headings', async () => {
  const { html, context } = await loadFixture();
  assert.equal(context.title, 'Movimentazione di bobine - soluzioni sicure con ATIS');
  assert.equal(context.headings[0].text, 'Bobine');
  assert.ok(context.headings.some((h) => h.text === 'Video applicazione'));
  assert.ok(html.length > 0);
});

test('filenameLabel rejects opaque names and humanises real ones', () => {
  assert.equal(filenameLabel('https://x.test/IMG_4471.jpg'), '');
  assert.equal(filenameLabel('https://x.test/a1b2c3d4e5f6.png'), '');
  assert.equal(filenameLabel('https://x.test/1200.jpg'), '');
  assert.equal(
    filenameLabel('https://x.test/manipolatore-bobine-verticale.jpg'),
    'manipolatore bobine verticale'
  );
});

test('deriveLabel prefers authored descriptions over context', () => {
  const authored = deriveLabel({ figcaption: 'Presa di bobina', alt: 'bobina', heading: 'Bobine' });
  assert.deepEqual(authored, { label: 'Presa di bobina', labelSource: 'figcaption' });

  const contextual = deriveLabel({ heading: 'Bobine', filename: 'manipolatore bobine' });
  assert.equal(contextual.labelSource, 'heading');

  const none = deriveLabel({});
  assert.deepEqual(none, { label: null, labelSource: null });
});

test('extractMedia: authored alt is captured and marked as authored', async () => {
  const { images } = await loadFixture();
  const withAlt = images.find((i) => i.src.endsWith('manipolatore-bobine-01.jpg'));
  assert.ok(withAlt, 'image with alt should be found');
  assert.equal(withAlt.altState, 'present');
  assert.equal(withAlt.labelSource, 'alt');
  assert.equal(withAlt.label, 'Manipolatore ATISmirus con pinza pneumatica per bobine di carta');
  assert.equal(withAlt.needsVisualReview, false);
  assert.equal(withAlt.width, '800');
});

test('extractMedia: figcaption outranks a weak alt', async () => {
  const { images } = await loadFixture();
  const figure = images.find((i) => i.src.endsWith('bobina-verticale.jpg'));
  assert.equal(figure.labelSource, 'figcaption');
  assert.equal(figure.label, 'Presa e rotazione di bobina in verticale con pinza a espansione');
  assert.equal(figure.alt, 'bobina');
});

test('extractMedia: distinguishes missing alt from decorative empty alt', async () => {
  const { images } = await loadFixture();
  const missing = images.find((i) => i.src.endsWith('atis-rotoli-magazzino.jpg'));
  const empty = images.find((i) => i.src.endsWith('spacer.gif'));
  assert.equal(missing.altState, 'missing');
  assert.equal(empty.altState, 'empty');
});

test('extractMedia: an asset with no signal is flagged, never invented', async () => {
  const { images } = await loadFixture();
  const opaque = images.find((i) => i.src.endsWith('IMG_4471.jpg'));
  assert.ok(opaque, 'opaque image should still be inventoried');
  // Only signal available is the nearest heading — contextual, so review is required.
  assert.ok(opaque.needsVisualReview, 'must be marked for visual review');
  assert.notEqual(opaque.labelSource, 'alt');
  assert.ok(
    opaque.label === null || opaque.labelSource === 'heading',
    'label must come from context or be absent'
  );
});

test('extractMedia: resolves lazy-loaded data-src and srcset', async () => {
  const { images } = await loadFixture();
  const lazy = images.find((i) => i.src.includes('manipolatore-forche-integrate'));
  assert.ok(lazy, 'lazy image should be found via data-src');
  assert.ok(lazy.src.startsWith('https://www.atismanipolatori.com/'), 'src must be absolute');
  assert.equal(lazy.labelSource, 'title');
  assert.equal(lazy.srcset.length, 2);
  assert.equal(lazy.srcset[0].descriptor, '480w');
});

test('extractMedia: image inside a link records the link target', async () => {
  const { images } = await loadFixture();
  const linked = images.find((i) => i.src.endsWith('bobine-gallery.jpg'));
  assert.ok(linked.linkedTo.endsWith('/Applicazioni/Applicazioni-Foto/08.-Bobine/Bobine'));
});

test('extractMedia: CSS background images are inventoried', async () => {
  const { images } = await loadFixture();
  const background = images.find((i) => i.src.endsWith('hero-officina.jpg'));
  assert.ok(background, 'background image should be found');
  assert.equal(background.altState, 'n/a-css-background');
  assert.equal(background.needsVisualReview, true);
});

test('extractMedia: html5 video collects poster and every source', async () => {
  const { videos } = await loadFixture();
  const html5 = videos.find((v) => v.kind === 'html5');
  assert.ok(html5.poster.endsWith('/video/posters/bobine-poster.jpg'));
  assert.equal(html5.sources.length, 2);
  assert.ok(html5.sources.some((s) => s.type === 'video/webm'));
  assert.equal(html5.controls, true);
});

test('extractMedia: YouTube embed is identified and titled', async () => {
  const { videos } = await loadFixture();
  const embed = videos.find((v) => v.kind === 'embed');
  assert.equal(embed.provider, 'youtube');
  assert.equal(embed.videoId, 'UXaP3EFNqt0');
  assert.equal(embed.watchUrl, 'https://www.youtube.com/watch?v=UXaP3EFNqt0');
  assert.equal(embed.thumbnail, 'https://img.youtube.com/vi/UXaP3EFNqt0/hqdefault.jpg');
  assert.equal(embed.labelSource, 'title');
});

test('extractMedia: direct links to video files are captured', async () => {
  const { videos } = await loadFixture();
  const fileLink = videos.find((v) => v.kind === 'file-link');
  assert.ok(fileLink, 'linked mp4 should be inventoried');
  assert.ok(fileLink.src.endsWith('/download/atis-presentazione.mp4'));
});

test('classifyEmbed handles the common URL shapes and rejects others', () => {
  assert.equal(classifyEmbed('https://youtu.be/abc12345678').id, 'abc12345678');
  assert.equal(classifyEmbed('https://www.youtube.com/watch?v=xyz').provider, 'youtube');
  assert.equal(classifyEmbed('https://player.vimeo.com/video/123456789').provider, 'vimeo');
  assert.equal(classifyEmbed('https://example.com/map'), null);
});

test('crawl: URL canonicalisation strips fragments, tracking and trailing slash', () => {
  assert.equal(canonicalise('https://a.test/x/?utm_source=nl#top'), 'https://a.test/x');
  assert.equal(canonicalise('https://a.test/'), 'https://a.test/');
  assert.equal(canonicalise('not a url'), '');
});

test('crawl: robots.txt rules are parsed and applied', () => {
  const rules = parseRobots(['User-agent: *', 'Disallow: /wp-admin/', 'Allow: /wp-admin/ok'].join('\n'));
  assert.deepEqual(rules.disallow, ['/wp-admin/']);
  assert.equal(robotsAllows(rules, '/Applicazioni/Foto'), true);
  assert.equal(robotsAllows(rules, '/wp-admin/secret'), false);
  assert.equal(robotsAllows(rules, '/wp-admin/ok'), true);
});

test('report: summary counts and rendering hold together', async () => {
  const { images, videos } = await loadFixture();
  const result = {
    pages: [{ url: PAGE_URL, title: 'Bobine', imageCount: images.length, videoCount: videos.length }],
    images,
    videos,
    errors: [],
    skipped: [],
    truncated: false,
    queueRemaining: 0,
  };

  const stats = summarise(result);
  assert.equal(stats.images, images.length);
  // Four fixture images carry no alt attribute at all: the bare gallery photo,
  // the opaque IMG_4471, the lazy-loaded one, and the thumbnail inside a link.
  assert.equal(stats.missingAlt, 4);
  assert.equal(stats.emptyAlt, 1, 'exactly one decorative image');
  assert.ok(stats.needsVisualReview >= 2);
  assert.ok(stats.labelSources.alt >= 1);

  const markdown = renderMarkdown(result, { site: 'atismanipolatori.com', startUrl: PAGE_URL });
  assert.ok(markdown.includes('# Media catalogue'));
  assert.ok(markdown.includes('Images missing an `alt` attribute'));
  assert.ok(markdown.includes('UXaP3EFNqt0'));
  assert.ok(markdown.includes('⚠️ missing'));

  const csv = renderCsv(result);
  const lines = csv.split('\n');
  assert.equal(lines.length, 1 + images.length + videos.length);
  assert.ok(lines[0].startsWith('"type","kind","url"'));
});
