import assert from 'node:assert';
import { makeToken, checkToken, samePassword, toLines } from './api/_lib.js';

const t = makeToken('k', 1000);
assert(checkToken(t, 'k', 2000), 'valid token');
assert(!checkToken(t, 'other', 2000), 'wrong key');
assert(!checkToken(t, 'k', 1000 + 8 * 864e5), 'expired');
assert(!checkToken(t.replace(/.$/, c => (c === '0' ? '1' : '0')), 'k', 2000), 'tampered');
assert(!checkToken('', 'k') && !checkToken(t, undefined, 2000), 'empty / unset');
assert(samePassword('123qwe', '123qwe') && !samePassword('123qw', '123qwe') && !samePassword('x', undefined));
assert.strictEqual(
  toLines([{ start: 0, text: ' بسم الله ' }, { start: 65.34, text: 'next' }, { start: 70, text: ' ' }]),
  '[0:00.0] بسم الله\n[1:05.3] next');
console.log('ok');
