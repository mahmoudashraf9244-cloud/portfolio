import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const source = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');

test('portfolio starts without storage, switches RTL/LTR, and supports reduced motion', () => {
  const elements = new Map();
  const translated = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(([, key]) => ({
    dataset: { i18n: key }, innerHTML: key,
  }));
  const node = (selector) => {
    if (!elements.has(selector)) elements.set(selector, {
      textContent: '', style: {}, dataset: {}, innerHTML: '', content: '',
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, addEventListener() {}, querySelectorAll: () => [], insertBefore() {},
    });
    return elements.get(selector);
  };
  const document = {
    documentElement: { scrollHeight: 1000 },
    querySelector: node,
    querySelectorAll: (selector) => selector === '[data-i18n]' ? translated : [],
    addEventListener() {},
  };
  const context = vm.createContext({
    document, window: {}, innerHeight: 800, scrollY: 0, addEventListener() {},
    matchMedia: (query) => ({ matches: query.includes('prefers-reduced-motion'), addEventListener() {} }),
    localStorage: { getItem() { throw Error('Blocked'); }, setItem() { throw Error('Blocked'); } },
  });
  vm.runInContext(source, context);
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(node('#typedSkill').textContent, 'learning.next("React", "TypeScript");');
  vm.runInContext('setLanguage("ar")', context);
  assert.equal(document.documentElement.dir, 'rtl');
  assert.match(document.title, /محمود/);
  const missing = vm.runInContext('nodes.filter(node => !translations.ar[node.dataset.i18n]).map(node => node.dataset.i18n)', context);
  assert.equal(missing.length, 0, `Missing Arabic translations: ${missing.join(', ')}`);
  vm.runInContext('setLanguage("invalid")', context);
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(document.documentElement.dir, 'ltr');
});
