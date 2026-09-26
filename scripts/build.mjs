// Build runner: cleans dist once, then runs the two emit passes concurrently.
//
// The passes write disjoint outputs — tsup emits .js/.js.map, tsc emits
// .d.ts/.d.ts.map — so there is no reason to serialise them. Cleaning here
// (rather than via tsup's `clean` flag) is what makes that safe: with tsup
// clearing dist on startup, a concurrent tsc would race against the wipe.
//
// --only=js     JS only. The fast inner loop: tsup alone, no type checking.
// --only=types  Declarations only, which also type-checks the project.
// (no flag)     Both, in parallel. What pack, publish and CI run.
import { rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || 'all';
if (!['js', 'types', 'all'].includes(only)) {
  console.error(`build: unknown --only=${only} (expected js, types or all)`);
  process.exit(1);
}

// Resolve the CLI entrypoints and run them on the current node binary: no
// shell, no .cmd/.ps1 divergence on Windows, no npx resolution round-trip.
const bin = (pkg, rel) => join(dirname(require.resolve(`${pkg}/package.json`)), rel);

const ALL = [
  { id: 'js', name: 'tsup', script: bin('tsup', 'dist/cli-default.js'), args: [] },
  {
    id: 'types',
    name: 'tsc ',
    script: bin('typescript', 'bin/tsc'),
    args: ['-p', 'tsconfig.build.json'],
  },
];
const passes = only === 'all' ? ALL : ALL.filter((p) => p.id === only);

const run = ({ name, script, args }) =>
  new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Buffer each pass's output and flush it on exit. Interleaving two live
    // streams turns a build failure into a puzzle.
    let out = '';
    child.stdout.on('data', (c) => (out += c));
    child.stderr.on('data', (c) => (out += c));

    child.on('close', (code) => {
      const secs = ((Date.now() - started) / 1000).toFixed(2);
      if (out.trim()) {
        process.stdout.write(
          out
            .trimEnd()
            .split('\n')
            .map((l) => `[${name}] ${l}`)
            .join('\n') + '\n'
        );
      }
      console.log(`[${name}] ${code === 0 ? 'done' : `FAILED (exit ${code})`} in ${secs}s`);
      resolve(code ?? 1);
    });
  });

// Wipe dist and the declaration pass's incremental state as one step. tsc
// decides whether to emit by comparing buildinfo against what it believes is
// on disk, so a buildinfo that outlives its outputs makes it skip emit and
// produce a dist with no declarations at all.
//
// --only=types is the exception: it adds .d.ts beside JS that an earlier pass
// emitted, so wiping dist here would delete that JS. Release builds always go
// through the full run, which does clean.
await rm(join(root, '.tscache', 'build.tsbuildinfo'), { force: true });
if (only !== 'types') {
  await rm(join(root, 'dist'), { recursive: true, force: true });
}

const codes = await Promise.all(passes.map(run));
process.exit(codes.find((c) => c !== 0) ?? 0);
