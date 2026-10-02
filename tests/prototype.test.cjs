const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'prototype/index.html'), 'utf8');

for (const file of ['prototype/index.html', 'prototype/v1-flat.html', 'brief/index.html']) {
  test(`${file}: inline scripts parse`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
      new vm.Script(match[1]);
    }
  });
}

function plan(state, request) {
  const code = source.slice(source.indexOf('function sparkPlan('), source.indexOf('const netAll'));
  return vm.runInNewContext(`${code}; sparkPlan(req)`, {
    S: state, V: () => state.value, req: request,
  });
}
test('withdrawal charges only positive gains and preserves requested net', () => {
  for (const value of [80, 100, 120]) {
    const result = plan({ P: 100, value, cut: 0.1 }, {mode: 'cash', net: 20});
    assert.ok(Math.abs(result.net - 20) < 1e-9);
    assert.ok(result.f > 0 && result.f < 1);
    assert.equal(result.fee > 0, value > 100);
  }
});
test('withdrawal rejects invalid amounts and caps to available balance', () => {
  for (const net of [0, -1, NaN, Infinity]) {
    assert.equal(plan({P: 100, value: 120, cut: 0.1}, {mode: 'cash', net}), null);
  }
  const result = plan({P: 100, value: 120, cut: 0.1}, {mode: 'cash', net: 1000});
  assert.equal(result.f, 1);
  assert.equal(result.net, 118);
});
test('closing a sheet cancels its delayed action', () => {
  const scheduled = new Map(); let id = 0;
  const host = {innerHTML: 'sheet'};
  const context = vm.createContext({
    $: () => host,
    setTimeout: fn => { scheduled.set(++id, fn); return id; },
    clearTimeout: key => scheduled.delete(key),
  });
  vm.runInContext(source.slice(source.indexOf("const host = $('#sheetHost');"), source.indexOf('function openSheet(')) +
    source.slice(source.indexOf('function closeSheet()'), source.indexOf("window.addEventListener('keydown', e => { if (e.key === 'Escape')")), context);
  vm.runInContext('afterSheet(1800, () => { throw new Error("Stale payment"); }); closeSheet();', context);
  assert.equal(scheduled.size, 0);
  assert.equal(host.innerHTML, '');
});
