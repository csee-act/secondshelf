import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialShelf, handleShelf, shelfState } from '../public/browser-model.js';
import { today } from '../public/domain.js';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE1sAAAAASUVORK5CYII=';
const draft = { name: 'Photo test', photo: PHOTO, description: 'A useful item.', category: 'Other', condition: 'Good', location: 'Private drawer', story: 'Private memory', attachment: 1, estimate: 45, lastUsed: '2024-01-01', lastMoved: '2025-01-01' };
const add = shelf => handleShelf(shelf, '/api/items', 'POST', draft).item;

test('browser shelves start independent, expose local mode, and keep the remote AI endpoint disabled', () => {
  const a = initialShelf(), b = initialShelf();
  assert.notEqual(a.items[0].id, b.items[0].id);
  const state = shelfState(a);
  assert.equal(state.items.length, 8);
  assert.equal(state.listings.length, 3);
  assert.equal(state.storage, 'browser');
  assert.equal(state.ai.available, false);
  assert.throws(() => handleShelf(a, '/api/analyze', 'POST'), /private server/);
});

test('photo and item data survive storage cloning; last use and movement stay separate', () => {
  const shelf = initialShelf(), item = add(shelf);
  const saved = structuredClone(shelf);
  const result = handleShelf(saved, `/api/items/${item.id}/activity`, 'POST', { action: 'used' }).item;
  assert.equal(result.lastUsed, today());
  assert.equal(result.lastMoved, '2025-01-01');
  assert.equal(result.imageUrl, PHOTO);
  handleShelf(saved, `/api/items/${item.id}`, 'PATCH', { ...result, location: 'Another drawer', confirmMove: true, recordMove: false });
  assert.equal(saved.items[0].lastMoved, '2025-01-01');
  handleShelf(saved, `/api/items/${item.id}`, 'PATCH', { ...saved.items[0], location: 'A third drawer', confirmMove: true, recordMove: true });
  assert.equal(saved.items[0].lastMoved, today());
});

test('sample-photo records and listings stay labeled without changing ordinary uploads', () => {
  const shelf=initialShelf();
  const sample=handleShelf(shelf,'/api/items','POST',{...draft,samplePhoto:true}).item;
  const {id}=handleShelf(shelf,'/api/listings','POST',{itemId:sample.id,mode:'sell',price:10,name:'Demo photo',description:'Fictional listing.'});
  assert.equal(shelfState(shelf).listings.find(l=>l.id===id).sample,true);
  const ordinary=add(shelf);
  assert.equal(ordinary.samplePhoto,false);
});

test('local listing snapshots omit private fields, survive later edits, and can be withdrawn', () => {
  const shelf = initialShelf(), item = add(shelf);
  const publish = { itemId: item.id, mode: 'sell', price: 25, name: 'Preview title', description: 'Preview description' };
  const { id } = handleShelf(shelf, '/api/listings', 'POST', publish);
  assert.equal(handleShelf(shelf, '/api/listings', 'POST', publish).id, id);
  const listing = shelfState(shelf).listings.find(l => l.id === id);
  for (const key of ['location', 'story', 'attachment', 'estimate', 'lastUsed', 'lastMoved', 'protected', 'itemId']) assert.equal(key in listing, false);
  assert.equal(listing.imageUrl, PHOTO);
  assert.equal(listing.price, 25);
  handleShelf(shelf, `/api/items/${item.id}`, 'PATCH', { ...item, name: 'Edited private name', description: 'Private description', photo: PHOTO });
  handleShelf(shelf, '/api/profile', 'PATCH', { name: 'Alex' });
  assert.equal(shelfState(shelf).listings[0].name, 'Preview title');
  assert.equal(shelfState(shelf).listings[0].seller, 'Jamie');
  assert.throws(() => handleShelf(shelf, `/api/items/${item.id}`, 'DELETE'), /Withdraw/);
  handleShelf(shelf, `/api/listings/${id}`, 'DELETE');
  assert.equal(shelfState(shelf).items[0].listed, false);
  assert.equal(shelf.items[0].imageUrl, PHOTO);
  handleShelf(shelf, `/api/items/${item.id}`, 'DELETE');
  assert.equal(shelf.items.some(i => i.id === item.id), false);
});

test('browser validation rejects invalid dates, missing photos, invalid listings, and sample withdrawal', () => {
  const shelf = initialShelf(), item = add(shelf);
  for (const patch of [{ lastUsed: '2025-02-30' }, { lastUsed: '2999-01-01' }, { estimate: -1 }, { attachment: 8 }, { photo: 'javascript:alert(1)' }, { photo: null }]) {
    assert.throws(() => handleShelf(shelf, '/api/items', 'POST', { ...draft, ...patch }));
  }
  assert.throws(() => handleShelf(shelf, `/api/items/${item.id}`, 'PATCH', { ...draft, location: 'New location' }), /Confirm/);
  assert.throws(() => handleShelf(shelf, '/api/listings', 'POST', { itemId: item.id, mode: 'sell', price: '', name: 'Item', description: 'Item' }), /asking price/);
  assert.throws(() => handleShelf(shelf, '/api/listings', 'POST', { itemId: item.id, mode: 'swap', name: 'Item', description: 'Item' }), /swap for/);
  assert.throws(() => handleShelf(shelf, '/api/listings/sample-0', 'DELETE'), /not yours/);
  const { id } = handleShelf(shelf, '/api/listings', 'POST', { itemId: item.id, mode: 'swap', name: 'Swap item', description: 'Useful', swapFor: 'A book' });
  assert.equal(shelfState(shelf).listings.find(l => l.id === id).price, null);
});

test('Pages build contains only public files and works under a project subpath', () => {
  execFileSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: resolve(import.meta.dirname, '..') });
  const base = resolve(import.meta.dirname, '../dist');
  const files = readdirSync(base, { recursive: true }).map(String);
  assert.equal(files.some(f => /(^|[\\/])(data|server\.mjs|\.env|output|tests)([\\/]|$)/.test(f)), false);
  assert.match(readFileSync(resolve(base, 'app-mode.js'), 'utf8'), /'browser'/);
  assert.match(readFileSync(resolve(base, 'index.html'), 'utf8'), /src="\.\/app\.js"/);
  assert.doesNotMatch(readFileSync(resolve(base, 'index.html'), 'utf8'), /(?:src|href)="\//);
  assert.doesNotMatch(readFileSync(resolve(base, 'app.js'), 'utf8'), /src="\/assets\//);
  assert.match(readFileSync(resolve(base, 'samples.js'), 'utf8'), /from '\.\/domain.js'/);
  assert.match(readFileSync(resolve(import.meta.dirname, '../public/app-mode.js'), 'utf8'), /'server'/);
});
