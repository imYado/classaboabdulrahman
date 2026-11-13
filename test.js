import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const page = {}; vm.runInNewContext(readFileSync('subs.js', 'utf8') + ';this.fromSubs=fromSubs', page);
const srt = '1\r\n00:00:01,500 --> 00:00:04,000\r\nبسم الله\r\nالرحمن الرحيم\r\n\r\n2\r\n01:02:03,250 --> 01:02:05,000\r\n<i>next</i>\r\n';
assert.strictEqual(page.fromSubs(srt), '[0:01.5] بسم الله الرحمن الرحيم\n[62:03.3] next');
const vtt = 'WEBVTT\n\n00:05.000 --> 00:07.000\nhello\n\nNOTE comment\n\n1:10.000 --> 1:12.000\nworld';
assert.strictEqual(page.fromSubs(vtt), '[0:05.0] hello\n[1:10.0] world');
assert.strictEqual(page.fromSubs('  [0:03] already timed\nplain  '), '[0:03] already timed\nplain');
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
