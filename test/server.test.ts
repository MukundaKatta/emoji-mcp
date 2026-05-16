import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { fromShortcode, toShortcode, info } from '../src/server.js';

test('fromShortcode replaces :name: with emoji', () => {
  const out = fromShortcode('hello :smile:');
  // Should have inserted at least one non-ASCII char.
  assert.notEqual(out, 'hello :smile:');
  assert.match(out, /^hello /);
});

test('unknown shortcodes are left as-is', () => {
  const out = fromShortcode('hi :totally_made_up_shortcode_xyz:');
  assert.equal(out, 'hi :totally_made_up_shortcode_xyz:');
});

test('toShortcode encodes a known emoji', () => {
  const heart = '❤'; // ❤
  const out = toShortcode(heart);
  assert.match(out, /^:.+:$/);
});

test('info returns shortcode and code points', () => {
  const heart = '❤';
  const r = info(heart);
  assert.match(r.shortcode ?? '', /:.+:/);
  assert.equal(r.codepoints[0], 'U+2764');
});

test('info returns null shortcode for plain text', () => {
  const r = info('A');
  assert.equal(r.shortcode, null);
  assert.deepEqual(r.codepoints, ['U+41']);
});

test('round trip through unemojify and emojify', () => {
  const orig = ':smile:';
  const e = fromShortcode(orig);
  const back = toShortcode(e);
  assert.equal(back, orig);
});
