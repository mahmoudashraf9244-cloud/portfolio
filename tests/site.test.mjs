import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const pages = ['index.html', 'projects/teamdesk/index.html'];

test('both pages have unique IDs and valid local assets and anchor links', async () => {
  for (const page of pages) {
    const html = await readFile(path.join(root, page), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate ID in ${page}`);
    for (const [, reference] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
      const [file, anchor] = reference.split('#');
      const target = file ? path.resolve(root, path.dirname(page), file) : path.join(root, page);
      assert.ok((await stat(target)).isFile(), `${page}: missing ${reference}`);
      if (anchor) {
        const targetHTML = file ? await readFile(target, 'utf8') : html;
        assert.ok(targetHTML.includes(`id="${anchor}"`), `${page}: missing anchor ${reference}`);
      }
    }
  }
});

test('preview serves pages, assets, redirects, HEAD requests and error responses', { timeout: 10000 }, async () => {
  const server = spawn(process.execPath, ['preview.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const output = await Promise.race([
      once(server.stdout, 'data').then(([data]) => String(data)),
      once(server, 'error').then(([error]) => { throw error; }),
    ]);
    const base = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    assert.ok(base, output);
    for (const [route, expected] of [
      ['/', 200], ['/projects/teamdesk/', 200], ['/projects/teamdesk?demo=1', 301],
      ['/assets/mahmoud-portrait.webp', 200], ['/missing', 404], ['/%ZZ', 400],
      ['/%2e%2e%2fREADME.md', 403],
    ]) {
      const response = await fetch(base + route, { redirect: 'manual' });
      assert.equal(response.status, expected, route);
      if (expected === 301) assert.equal(response.headers.get('location'), '/projects/teamdesk/?demo=1');
      await response.arrayBuffer();
    }
    const head = await fetch(base, { method: 'HEAD' });
    assert.match(head.headers.get('content-type'), /text\/html/);
    assert.equal(await head.text(), '');
  } finally {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
});
