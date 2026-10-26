// Run explicitly to refresh the pinned, self-hosted AI assets. No runtime CDN dependency.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../public/', import.meta.url);
const provenance = [];
async function get(url, path) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(new URL(path, root), bytes);
  provenance.push({ path, source: url, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  return bytes;
}
await mkdir(new URL('vendor/', root), { recursive: true });
await mkdir(new URL('models/', root), { recursive: true });
await get('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', 'vendor/tf.min.js');
await get('https://raw.githubusercontent.com/tensorflow/tfjs/master/LICENSE', 'vendor/LICENSE.txt');
await get('https://raw.githubusercontent.com/fchollet/deep-learning-models/master/LICENSE', 'models/LICENSE.txt');
await get('https://raw.githubusercontent.com/tensorflow/tfjs-examples/master/mobilenet/imagenet_classes.js', 'vendor/imagenet-classes.js');
const base = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.50_224/';
const response = await fetch(base + 'model.json');
if (!response.ok) throw new Error('Model manifest unavailable.');
const model = await response.json();
const weights = [];
// Concatenate the original groups in manifest order, preserving the weight layout.
for (let start = 0; start < model.weightsManifest.length; start += 10) {
  const groups = model.weightsManifest.slice(start, start + 10);
  const blocks = await Promise.all(groups.map(async group => {
    const blocks = await Promise.all(group.paths.map(async path => {
      const r = await fetch(base + path);
      if (!r.ok) throw new Error('Model weights unavailable: ' + path);
      return Buffer.from(await r.arrayBuffer());
    }));
    return Buffer.concat(blocks);
  }));
  weights.push(...blocks);
}
const bytes = Buffer.concat(weights);
model.weightsManifest = [{ paths: ['weights.bin'], weights: model.weightsManifest.flatMap(g => g.weights) }];
await writeFile(new URL('models/weights.bin', root), bytes);
await writeFile(new URL('models/model.json', root), JSON.stringify(model));
provenance.push({ path: 'models/weights.bin', source: base, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
await get('https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Claw-hammer.jpg/960px-Claw-hammer.jpg', 'assets/sample-item.jpg');
await writeFile(new URL('vendor/provenance.json', root), JSON.stringify(provenance, null, 2));
console.log(provenance.map(p => `${p.path}: ${p.bytes} bytes`).join('\n'));
