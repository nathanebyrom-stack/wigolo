/**
 * curl-backed HTTP client with a fetch()-shaped return value.
 *
 * Why this exists: atismanipolatori.com's WAF returns 403 to Node's native
 * `fetch`/`https` regardless of headers sent — a TLS/HTTP2 client-hello
 * fingerprint block, not a header check (confirmed: identical headers via
 * curl succeed, via Node fail). curl's handshake passes. This module shells
 * out to curl per request and adapts its output to the subset of the fetch
 * Response API the crawler uses (ok, status, url, headers.get, text()).
 */

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** Fetch one URL via curl, following redirects, returning a Response-like object. */
export async function curlFetch(url, { headers = {}, timeoutMs = 20000 } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'curl-fetch-'));
  const bodyPath = join(dir, 'body');
  const headerPath = join(dir, 'headers');

  const args = [
    '-sS',
    '-L',
    '--compressed',
    '--max-time',
    String(Math.max(1, Math.ceil(timeoutMs / 1000))),
    '-D',
    headerPath,
    '-o',
    bodyPath,
    '-w',
    '%{http_code}\n%{url_effective}',
  ];
  for (const [key, value] of Object.entries(headers)) {
    args.push('-H', `${key}: ${value}`);
  }
  args.push('--', url);

  try {
    const { stdout } = await execFileAsync('curl', args, {
      timeout: timeoutMs + 5000,
      maxBuffer: 64 * 1024 * 1024,
    });
    const [statusLine = '0', finalUrl = url] = stdout.trim().split('\n');
    const status = Number(statusLine) || 0;

    const rawHeaders = await readFile(headerPath, 'utf8').catch(() => '');
    // With -L, one header block per hop; the response we care about is the last.
    const blocks = rawHeaders.split(/\r?\n\r?\n/).filter((b) => b.trim());
    const lastBlock = blocks[blocks.length - 1] || '';
    const headerMap = new Map();
    for (const line of lastBlock.split(/\r?\n/).slice(1)) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      headerMap.set(line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim());
    }

    // Read the body into memory now — the temp dir is removed below, before
    // any caller has a chance to lazily invoke .text()/.buffer().
    const bodyBuffer = await readFile(bodyPath).catch(() => Buffer.alloc(0));

    return {
      ok: status >= 200 && status < 300,
      status,
      url: finalUrl || url,
      headers: { get: (key) => headerMap.get(String(key).toLowerCase()) ?? null },
      text: async () => bodyBuffer.toString('utf8'),
      arrayBuffer: async () =>
        bodyBuffer.buffer.slice(bodyBuffer.byteOffset, bodyBuffer.byteOffset + bodyBuffer.byteLength),
      buffer: async () => bodyBuffer,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Download a binary URL straight to a destination path via curl. */
export async function curlDownload(url, destPath, { headers = {}, timeoutMs = 30000 } = {}) {
  const args = [
    '-sS',
    '-L',
    '--max-time',
    String(Math.max(1, Math.ceil(timeoutMs / 1000))),
    '-w',
    '%{http_code} %{size_download} %{content_type}',
    '-o',
    destPath,
  ];
  for (const [key, value] of Object.entries(headers)) {
    args.push('-H', `${key}: ${value}`);
  }
  args.push('--', url);

  const { stdout } = await execFileAsync('curl', args, {
    timeout: timeoutMs + 5000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const [status, size, ...contentTypeParts] = stdout.trim().split(' ');
  return {
    status: Number(status) || 0,
    bytes: Number(size) || 0,
    contentType: contentTypeParts.join(' '),
  };
}
