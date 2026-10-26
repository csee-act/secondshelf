import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { initialShelf, handleShelf } from '../public/browser-model.js';
import { initialJourney, changeJourney, planSummary, inDays } from '../public/journey.js';
import { publicSnapshot, encodeSnapshot, decodeSnapshot } from '../public/share.js';
import { IMAGENET_CLASSES } from '../public/vendor/imagenet-classes.js';
import { sharedMarkup } from '../public/feature-views.js';
const listing = { name: 'A useful mug ☕', description: 'Ready for a new kitchen.', condition: 'Good', mode: 'swap', swapFor: 'A book', seller: 'Jamie', community: 'Taman Kita', sample: true, location: 'PRIVATE LOCATION', story: 'PRIVATE STORY', attachment: 5, estimate: 500, lastUsed: '2020-01-01', itemId: 'private-id', imageUrl: 'private://photo' };

test('plan decisions and memories survive cloning without replacing existing inventory', () => {
  const shelf = initialShelf(), before = structuredClone(shelf);
  const journey = initialJourney(), item = shelf.items[0];
  changeJourney(journey, 'decision', { id: item.id, choice: 'rehome', saveMemory: true }, shelf.items);
  const saved = structuredClone(journey), summary = planSummary(shelf.items, saved);
  assert.equal(summary.completed.length, 1);
  assert.equal(summary.counts.rehome, 1);
  assert.ok(!summary.queue.find(i => i.id === item.id));
  assert.equal(saved.memories[item.id].story, item.story);
  assert.deepEqual(shelf, before);
  handleShelf(shelf, `/api/items/${item.id}`, 'DELETE');
  assert.equal(planSummary(shelf.items, saved).completed.length, 0);
  assert.equal(saved.memories[item.id].name, item.name);
  changeJourney(saved, 'forget-memory', { id: item.id }, shelf.items);
  assert.equal(Object.keys(saved.memories).length, 0);
});

test('meaningful rehoming requires explicit confirmation; undo is reversible', () => {
  const items = initialShelf().items, journey = initialJourney(), item = items.find(i => i.protected);
  assert.throws(() => changeJourney(journey, 'decision', { id: item.id, choice: 'rehome' }, items), /Confirm/);
  assert.equal(Object.keys(journey.decisions).length, 0);
  changeJourney(journey, 'decision', { id: item.id, choice: 'rehome', confirmMeaningful: true }, items);
  changeJourney(journey, 'undo', { id: item.id }, items);
  assert.equal(planSummary(items, journey).completed.length, 0);
  assert.throws(() => changeJourney(journey, 'decision', { id: item.id, choice: 'sold' }, items), /Choose/);
});

test('scheduled reviews return on the due date, and goals reject invalid dates and counts', () => {
  const items = initialShelf().items, journey = initialJourney(), item = items[0];
  changeJourney(journey, 'decision', { id: item.id, choice: 'revisit', reviewOn: inDays(14) }, items);
  assert.ok(!planSummary(items, journey).queue.find(i => i.id === item.id));
  assert.equal(planSummary(items, journey, inDays(14)).queue[0].id, item.id);
  assert.throws(() => changeJourney(journey, 'decision', { id: item.id, choice: 'revisit', reviewOn: '2026-02-30' }, items), /future/);
  for (const target of [0, -1, 1.5, 51, NaN]) assert.throws(() => changeJourney(journey, 'goal', { target, deadline: inDays(7) }, items));
  assert.throws(() => changeJourney(journey, 'goal', { target: 3, deadline: inDays(-1) }, items));
});

test('listing links round trip Unicode with a strict allowlist and no private image or fields', () => {
  const snapshot = decodeSnapshot(encodeSnapshot(listing));
  assert.equal(snapshot.name, listing.name);
  assert.equal(snapshot.swapFor, 'A book');
  for (const key of ['location','story','attachment','estimate','lastUsed','itemId','imageUrl']) assert.ok(!(key in snapshot));
  assert.ok(!JSON.stringify(snapshot).includes('PRIVATE'));
  assert.equal(publicSnapshot(listing, 'https://tracker.test/image.jpg').thumbnail, undefined);
  assert.equal(publicSnapshot(listing, 'data:image/svg+xml;base64,abc').thumbnail, undefined);
  assert.equal(publicSnapshot(listing, 'data:image/jpeg;base64,'+'A'.repeat(4000)).thumbnail, undefined);
  const photo = 'data:image/jpeg;base64,/9j/AA==';
  assert.equal(decodeSnapshot(encodeSnapshot(listing, photo)).thumbnail, photo);
});

test('malformed or oversized shared payloads fail closed; invalid monetary values are rejected', () => {
  for (const value of ['', '<script>', 'A'.repeat(10001), 'e30']) assert.throws(() => decodeSnapshot(value), /invalid/);
  for (const price of [null, -1, Infinity, 'nope', 1000001]) assert.throws(() => encodeSnapshot({...listing, mode:'sell', price}), /incomplete/);
  assert.throws(() => encodeSnapshot({...listing, swapFor:''}), /incomplete/);
  assert.equal(decodeSnapshot(encodeSnapshot({...listing, mode:'sell', price:0})).price, 0);
  const markup = sharedMarkup(encodeSnapshot({...listing,name:'<img src=x onerror=alert(1)>',description:'<script>alert(1)</script>'}));
  assert.ok(!markup.includes('<script>'));
  assert.ok(!markup.includes('<img src=x'));
  assert.ok(markup.includes('&lt;script&gt;'));
});

test('shipped AI weights match their checksum and class/output dimensions', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/vendor/provenance.json', import.meta.url)));
  for (const file of manifest) {
    const bytes = readFileSync(new URL('../public/' + file.path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
  assert.equal(Object.keys(IMAGENET_CLASSES).length, 1000);
  const model = JSON.parse(readFileSync(new URL('../public/models/model.json', import.meta.url)));
  const weights = readFileSync(new URL('../public/models/weights.bin', import.meta.url));
  const expected = model.weightsManifest[0].weights.reduce((sum, w) => sum + w.shape.reduce((a,b) => a*b, 1) * 4, 0);
  assert.equal(weights.length, expected);
});
