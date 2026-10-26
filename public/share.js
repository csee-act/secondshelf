import { CONDITIONS } from './domain.js';
const clean = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';

// This allowlist is the entire share payload. Never serialize an inventory object.
export function publicSnapshot(listing, thumbnail = '') {
  if (!['sell', 'swap'].includes(listing.mode) || !CONDITIONS.includes(listing.condition)) throw new Error('This listing is incomplete.');
  const data = {
    v: 1, name: clean(listing.name, 100), description: clean(listing.description, 1000),
    condition: listing.condition, mode: listing.mode,
    price: listing.mode === 'sell' ? Number(listing.price) : null,
    swapFor: listing.mode === 'swap' ? clean(listing.swapFor, 250) : '',
    seller: clean(listing.seller, 40), community: clean(listing.community, 80), sample: listing.sample === true,
  };
  if (!data.name || !data.description || (data.mode === 'swap' && !data.swapFor) ||
      (data.mode === 'sell' && (listing.price == null || !Number.isFinite(data.price) || data.price < 0 || data.price > 1000000))) throw new Error('This listing is incomplete.');
  if (thumbnail && thumbnail.length <= 3200 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(thumbnail)) data.thumbnail = thumbnail;
  return data;
}
export function encodeSnapshot(listing, thumbnail = '') {
  const data = publicSnapshot(listing, thumbnail);
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const encoded = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  if (encoded.length > 10000) throw new Error('Shorten the public description before creating a share link.');
  return encoded;
}
export function decodeSnapshot(encoded) {
  try {
    if (encoded.length > 10000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error();
    const raw = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'));
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(raw, c => c.charCodeAt(0))));
    if (data.v !== 1) throw new Error();
    return publicSnapshot(data, data.thumbnail);
  } catch { throw new Error('This sharing link is incomplete or invalid. Ask the sender for a new link.'); }
}
export async function makeThumbnail(src) {
  try {
    const img = new Image(); img.src = src; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 80;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#eef0e7'; ctx.fillRect(0, 0, 80, 80);
    const scale = Math.min(80 / img.naturalWidth, 80 / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (80 - w) / 2, (80 - h) / 2, w, h);
    const value = canvas.toDataURL('image/jpeg', .4);
    return value.length <= 3200 ? value : '';
  } catch { return ''; }
}
