import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/projects/teamdesk/script.js', import.meta.url), 'utf8');
const employees = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1, firstName: `Employee${index}`, lastName: 'Test',
  email: `employee${index}@example.com`, phone: '+201234567890', age: 20 + index,
  role: index % 2 ? 'admin' : 'user', gender: 'female',
}));

// Run the shipped dashboard with a minimal DOM and a controlled API/storage boundary.
async function dashboard({ stored = {}, storageBlocked = false, apiFailure = false } = {}) {
  const nodes = new Map();
  const documentEvents = new Map();
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      value: selector === '#roleFilter' ? 'all' : selector === '#sortSelect' ? 'name-asc' : '',
      hidden: false, innerHTML: '', textContent: '', style: {}, disabled: false,
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, addEventListener() {}, querySelectorAll: () => [], prepend() {},
      close() {}, showModal() {}, focus() {},
    });
    return nodes.get(selector);
  }
  const context = vm.createContext({
    document: {
      querySelector: node, querySelectorAll: () => [], createElement: node,
      addEventListener: (event, handler) => documentEvents.set(event, handler),
      activeElement: { closest: () => false },
    },
    localStorage: {
      getItem(key) { if (storageBlocked) throw Error('Blocked'); return stored[key] ?? null; },
      setItem(key, value) { if (storageBlocked) throw Error('Blocked'); stored[key] = value; },
    },
    fetch: async () => ({ ok: !apiFailure, status: apiFailure ? 503 : 200,
      json: async () => ({ users: structuredClone(employees) }) }),
    AbortSignal, console: { error() {} }, setTimeout: () => 0, clearTimeout() {},
  });
  vm.runInContext(source, context);
  await new Promise(setImmediate);
  return { node, stored, documentEvents, run: (code) => vm.runInContext(code, context) };
}

test('loads employees, filters to zero, and reports the actual visible count', async () => {
  const app = await dashboard();
  assert.equal(app.node('#resultSummary').textContent, 'Showing 23 of 23 employees');
  app.node('#searchInput').value = 'no-such-employee';
  app.run('applyFilters()');
  assert.equal(app.node('#visibleReport').textContent, 0);
  assert.equal(app.node('#emptyState').hidden, false);
  assert.equal(app.node('#tableView').hidden, true);
});

test('filters roles, sorts by age, paginates, and renders only the active view', async () => {
  const app = await dashboard();
  assert.equal((app.node('#usersBody').innerHTML.match(/<tr>/g) || []).length, 10);
  assert.equal(app.node('#gridView').innerHTML, '');
  app.run('currentPage = 3; render()');
  assert.equal(app.node('#pageSummary').textContent, '21–23 of 23');
  app.node('#roleFilter').value = 'admin';
  app.node('#sortSelect').value = 'age-desc';
  app.run('applyFilters(); setView("grid")');
  assert.equal(app.run('filteredUsers.length'), 11);
  assert.equal(app.run('filteredUsers[0].age'), 41);
  assert.equal(app.node('#usersBody').innerHTML, '');
  assert.equal(app.node('#gridView').hidden, false);
});

test('invalid or inaccessible storage cannot prevent startup', async () => {
  for (const value of ['{', '{}', '[]', '{"added":[null],"updated":{},"deleted":[]}']) {
    const app = await dashboard({ stored: { 'teamdesk-employee-changes-v1': value, 'teamdesk-view': 'invalid' } });
    assert.equal(app.node('#apiStatus').textContent, 'API connected');
    assert.equal(app.node('#tableView').hidden, false);
  }
  const app = await dashboard({ storageBlocked: true });
  assert.equal(app.node('#apiStatus').textContent, 'API connected');
  app.run('setView("grid")');
  assert.equal(app.node('#gridView').hidden, false);
  await assert.rejects(app.run('createUser({firstName:"New"})'), /Could not save locally/);
  await assert.rejects(app.run('updateUser(1, {firstName:"Changed"})'), /Could not save locally/);
  assert.equal(app.run('users.length'), 23);
  assert.equal(app.run('users.find(user => user.id === 1).firstName'), 'Employee0');
  await app.run('pendingDeleteId = 1; deleteUser()');
  assert.equal(app.run('users.length'), 23);
  assert.equal(app.run('pendingDeleteId'), 1);
  assert.equal(app.node('#confirmDelete').disabled, false);
});

test('local create, edit, delete persist across reloads', async () => {
  const app = await dashboard();
  await app.run('createUser({firstName:"New",lastName:"Employee",role:"user"})');
  const id = app.run('users[0].id');
  await app.run(`updateUser(${id}, {firstName:"Updated"})`);
  const reloaded = await dashboard({ stored: app.stored });
  assert.equal(reloaded.run(`users.find(user => user.id === ${id}).firstName`), 'Updated');
  await reloaded.run(`pendingDeleteId = ${id}; deleteUser()`);
  const final = await dashboard({ stored: app.stored });
  assert.equal(final.run(`users.some(user => user.id === ${id})`), false);
});

test('API failure exposes retry state and stops loading', async () => {
  const app = await dashboard({ apiFailure: true });
  assert.equal(app.node('#errorState').hidden, false);
  assert.equal(app.node('#loadingState').hidden, true);
  assert.equal(app.node('#addBtn').disabled, true);
});

test('CSV escapes quotes and prevents spreadsheet formulas', async () => {
  const app = await dashboard();
  assert.equal(app.run(`csvCell('A "quote"')`), '"A ""quote"""');
  for (const text of ['=1+1', '+20123456789', '-1+2', '@SUM(1)', '  =1+1']) {
    assert.equal(app.run(`csvCell(${JSON.stringify(text)})`), `"'${text}"`);
  }
});

test('search shortcut leaves editing fields and dialogs alone', async () => {
  const app = await dashboard();
  app.run('document.activeElement.closest = () => true');
  let prevented = false;
  app.documentEvents.get('keydown')({ key: '/', preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
});
