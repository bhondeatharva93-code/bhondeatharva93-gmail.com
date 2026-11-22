'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadIntroLogic() {
  const ctx = {
    console,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'intro.js'), 'utf8');
  vm.runInContext(code, ctx, { filename: 'intro.js' });
  return ctx.PCS.introLogic;
}

test('shouldShowIntro returns true on fresh entry, reload, or external referrer', () => {
  const { shouldShowIntro } = loadIntroLogic();
  const origin = 'http://localhost:3000';

  assert.equal(shouldShowIntro({ search: '', referrer: '', origin }), true);
  assert.equal(shouldShowIntro({ search: '', referrer: 'https://aistudio.google.com/', origin }), true);
  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/', origin }), true);
  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/index.html', origin }), true);
});

test('shouldShowIntro skips intro when returning from internal catalog/builder pages', () => {
  const { shouldShowIntro } = loadIntroLogic();
  const origin = 'http://localhost:3000';

  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/shop.html', origin }), false);
  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/product.html?id=pc-gaming-2', origin }), false);
  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/build.html', origin }), false);
  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/cart.html', origin }), false);
  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/contact.html', origin }), false);
  assert.equal(shouldShowIntro({ search: '', referrer: 'http://localhost:3000/policies.html', origin }), false);
});

test('shouldShowIntro respects nointro query parameter', () => {
  const { shouldShowIntro } = loadIntroLogic();
  const origin = 'http://localhost:3000';

  assert.equal(shouldShowIntro({ search: '?nointro=1', referrer: '', origin }), false);
  assert.equal(shouldShowIntro({ search: '?intro=0', referrer: '', origin }), false);
});
