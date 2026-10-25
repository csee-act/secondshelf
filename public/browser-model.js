import { CATEGORIES, CONDITIONS, today } from './domain.js';
import { sampleItems, communitySamples } from './samples.js';

const text = (value, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
function fail(message) { throw new Error(message); }
function date(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value ||
      value > today() || value < '1900-01-01') fail('Choose a valid date that is not in the future.');
  return value;
}
function amount(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1000000) fail('Enter an amount between RM 0 and RM 1,000,000.');
  return Math.round(n * 100) / 100;
}
function photo(value) {
  if (typeof value !== 'string' || !/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) fail('Add a JPEG or PNG photo.');
  if (value.length > 2800000) fail('This photo is too large. Choose a smaller one.');
  return value;
}
function itemData(body, previous = {}) {
  const d = {
    name: text(body.name, 100), category: text(body.category, 40) || 'Other',
    location: text(body.location, 120) || 'Unsorted', description: text(body.description, 1000),
    story: text(body.story, 2500), condition: text(body.condition, 30) || 'Not checked',
    attachment: Number(body.attachment) || 0, protected: body.protected === true,
    lastUsed: date(body.lastUsed), lastMoved: date(body.lastMoved),
    usedApproximate: body.usedApproximate === true, movedApproximate: body.movedApproximate === true,
    estimate: amount(body.estimate), sample: previous.sample === true,
  };
  if (!d.name) fail('Give this item a name.');
  if (!CATEGORIES.includes(d.category) || !CONDITIONS.includes(d.condition) || !Number.isInteger(d.attachment) || d.attachment < 0 || d.attachment > 5) fail('Choose a valid category, condition, and attachment level.');
  d.estimateAsOf = d.estimate == null ? null : d.estimate === previous.estimate ? previous.estimateAsOf : today();
  return d;
}
export function initialShelf() {
  return {
    version: 1, profile: { name: 'Jamie', community: 'Taman Kita' },
    items: sampleItems().map((i, n) => ({ ...i, id: crypto.randomUUID(), imageUrl: `./assets/${i.asset}.svg`, createdAt: new Date(Date.now() - n * 1000).toISOString() })),
    listings: communitySamples.map((l, n) => ({ ...l, id: `sample-${n}`, owned: false, imageUrl: `./assets/${l.asset}.svg` })),
  };
}
function itemView(shelf, item) { return { ...item, listed: shelf.listings.some(l => l.itemId === item.id) }; }
function listingView(l) {
  // Keep the preview an explicit snapshot; private inventory fields never enter it.
  const { id, name, description, condition, mode, price, swapFor, seller, community, sample, owned, createdAt, imageUrl } = l;
  return { id, name, description, condition, mode, price, swapFor, seller, community, sample, owned, createdAt, imageUrl };
}
export function shelfState(shelf) {
  return { storage: 'browser', demo: true, csrf: '', profile: { ...shelf.profile },
    items: shelf.items.map(i => itemView(shelf, i)), listings: shelf.listings.map(listingView), ai: { available: false, model: null } };
}

// Synchronous changes are applied inside one IndexedDB read/write transaction.
export function handleShelf(shelf, path, method = 'GET', body = {}) {
  const findItem = id => shelf.items.find(i => i.id === id) || fail('This item is not in your space.');
  if (path === '/api/state' && method === 'GET') return shelfState(shelf);
  if (path === '/api/analyze') fail('Photo AI needs a private server connection. Manual entry works in this browser demo.');
  if (path === '/api/items' && method === 'POST') {
    if (shelf.items.length >= 50) fail('This demo space holds up to 50 items.');
    const item = { ...itemData(body), imageUrl: photo(body.photo), id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    shelf.items.unshift(item);
    return { item: itemView(shelf, item) };
  }
  const itemRoute = path.match(/^\/api\/items\/([\w-]+)$/);
  if (itemRoute && method === 'PATCH') {
    const old = findItem(itemRoute[1]);
    const data = itemData(body, old);
    if (old.location !== data.location && body.confirmMove !== true) fail('Confirm whether changing location records a move.');
    if (old.location !== data.location && body.recordMove === true) { data.lastMoved = today(); data.movedApproximate = false; }
    const imageUrl = body.photo ? photo(body.photo) : old.imageUrl;
    Object.assign(old, data, { imageUrl, updatedAt: new Date().toISOString() });
    return { item: itemView(shelf, old) };
  }
  if (itemRoute && method === 'DELETE') {
    const item = findItem(itemRoute[1]);
    if (shelf.listings.some(l => l.itemId === item.id)) fail('Withdraw this listing before deleting the item.');
    shelf.items = shelf.items.filter(i => i.id !== item.id);
    return { ok: true };
  }
  const activity = path.match(/^\/api\/items\/([\w-]+)\/activity$/);
  if (activity && method === 'POST') {
    const item = findItem(activity[1]);
    if (body.action === 'used') { item.lastUsed = today(); item.usedApproximate = false; }
    else if (body.action === 'moved') { item.lastMoved = today(); item.movedApproximate = false; }
    else if (body.action === 'protect') item.protected = body.value === true;
    else fail('Choose a valid activity.');
    item.updatedAt = new Date().toISOString();
    return { item: itemView(shelf, item) };
  }
  if (path === '/api/listings' && method === 'POST') {
    const item = findItem(body.itemId);
    if (!['sell', 'swap'].includes(body.mode)) fail('Choose Sell or Swap.');
    const price = body.mode === 'sell' ? amount(body.price) : null;
    if (body.mode === 'sell' && price === null) fail('Set an asking price for your listing.');
    const listing = {
      id: crypto.randomUUID(), itemId: item.id, owned: true,
      name: text(body.name, 100), description: text(body.description, 1000), condition: item.condition,
      mode: body.mode, price, swapFor: body.mode === 'swap' ? text(body.swapFor, 250) : '',
      seller: shelf.profile.name, community: shelf.profile.community, sample: !!item.sample,
      imageUrl: item.imageUrl, createdAt: new Date().toISOString(),
    };
    if (!listing.name || !listing.description) fail('Add a title and a public description.');
    if (listing.mode === 'swap' && !listing.swapFor) fail('Let people know what you would like to swap for.');
    const existing = shelf.listings.find(l => l.itemId === item.id);
    if (existing) return { id: existing.id };
    shelf.listings.unshift(listing);
    return { id: listing.id };
  }
  const listingRoute = path.match(/^\/api\/listings\/([\w-]+)$/);
  if (listingRoute && method === 'DELETE') {
    const listing = shelf.listings.find(l => l.id === listingRoute[1]);
    if (!listing?.owned) fail('This listing is not yours.');
    shelf.listings = shelf.listings.filter(l => l.id !== listing.id);
    return { ok: true };
  }
  const withdraw = path.match(/^\/api\/items\/([\w-]+)\/listing$/);
  if (withdraw && method === 'DELETE') {
    const item = findItem(withdraw[1]);
    shelf.listings = shelf.listings.filter(l => l.itemId !== item.id);
    return { ok: true };
  }
  if (path === '/api/profile' && method === 'PATCH') {
    const name = text(body.name, 40);
    if (!name) fail('Enter your display name.');
    shelf.profile.name = name;
    return { ok: true };
  }
  fail('This action was not found.');
}
