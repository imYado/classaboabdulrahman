import assert from 'node:assert';
import { makeToken, checkToken, samePassword, parseRange, piece, CHUNK } from './api/_lib.js';

assert.deepStrictEqual(parseRange(null, 100), [0, 99]);
assert.deepStrictEqual(parseRange('bytes=0-', 100), [0, 99]);
assert.deepStrictEqual(parseRange('bytes=10-19', 100), [10, 19]);
assert.deepStrictEqual(parseRange('bytes=90-500', 100), [90, 99]);
assert.deepStrictEqual(parseRange('bytes=-10', 100), [90, 99]);
assert.deepStrictEqual(parseRange('bytes=100-', 100), [null]);
assert.deepStrictEqual(parseRange('bytes=0-1,5-6', 100), [null]);
assert.deepStrictEqual(piece(0, 10 * CHUNK), { n: 0, off: 0, len: CHUNK });            // capped to one piece
assert.deepStrictEqual(piece(CHUNK - 5, CHUNK + 5), { n: 0, off: CHUNK - 5, len: 5 });  // stops at piece edge
assert.deepStrictEqual(piece(CHUNK + 7, CHUNK + 9), { n: 1, off: 7, len: 3 });

const t = makeToken('k', 1000);
assert(checkToken(t, 'k', 2000), 'valid token');
assert(!checkToken(t, 'other', 2000), 'wrong key');
assert(!checkToken(t, 'k', 1000 + 8 * 864e5), 'expired');
assert(!checkToken(t.replace(/.$/, c => (c === '0' ? '1' : '0')), 'k', 2000), 'tampered');
assert(!checkToken('', 'k') && !checkToken(t, undefined, 2000), 'empty / unset');
assert(samePassword('123qwe', '123qwe') && !samePassword('123qw', '123qwe') && !samePassword('x', undefined));
console.log('ok');
