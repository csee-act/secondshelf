import { IMAGENET_CLASSES } from './vendor/imagenet-classes.js';

let modelPromise;
async function loadModel() {
  if (!modelPromise) modelPromise = (async () => {
    if (!globalThis.tf) await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('./vendor/tf.min.js', import.meta.url).href;
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(new Error('Could not load photo recognition. Check your connection and try again.')); };
      document.head.append(script);
    });
    // CPU keeps inference consistent on devices with software/low-precision GPU drivers.
    await globalThis.tf.setBackend('cpu');
    await globalThis.tf.ready();
    return globalThis.tf.loadLayersModel(new URL('./models/model.json', import.meta.url).href);
  })().catch(error => { modelPromise = null; throw error; });
  return modelPromise;
}

function categoryFor(label) {
  if (/cup|mug|pot|pan|kettle|toaster|oven|cooker|bottle|spoon|plate|dishwasher|refrigerator/.test(label)) return 'Kitchen';
  if (/camera|computer|monitor|keyboard|mouse|telephone|headphone|television|laptop|speaker|radio|printer/.test(label)) return 'Electronics';
  if (/guitar|piano|violin|ball|racket|bicycle|ski|drum|harmonica/.test(label)) return 'Hobbies';
  if (/book|comic/.test(label)) return 'Books';
  if (/lamp|chair|table|desk|pillow|vase|sofa|couch|clock|wardrobe|cabinet|rug/.test(label)) return 'Home & living';
  return 'Other';
}

export async function recognizePhoto(imageUrl, onStatus = () => {}) {
  const start = performance.now();
  onStatus('Loading photo recognition… About 6.9 MB on first use.');
  const model = await loadModel();
  const image = new Image(); image.src = imageUrl; await image.decode();
  onStatus('Recognizing the object on this device…');
  await new Promise(resolve => requestAnimationFrame(resolve));
  const tf = globalThis.tf;
  const canvas = document.createElement('canvas'); canvas.width = 224; canvas.height = 224;
  canvas.getContext('2d').drawImage(image, 0, 0, 224, 224);
  const prediction = tf.tidy(() => {
    const pixels = tf.browser.fromPixels(canvas).toFloat();
    return model.predict(pixels.sub(127.5).div(127.5).expandDims());
  });
  let values;
  try { values = await prediction.data(); } finally { prediction.dispose(); }
  const candidates = Array.from(values, (score, index) => ({ label: IMAGENET_CLASSES[index], score }))
    .sort((a, b) => b.score - a.score).slice(0, 3);
  const label = candidates[0].label.split(',')[0];
  return {
    candidates, elapsedMs: performance.now() - start, backend: tf.getBackend(),
    draft: {
      name: label[0].toUpperCase() + label.slice(1), category: categoryFor(label),
      description: '',
      uncertainty: (candidates[0].score < .4 ? 'Low confidence: try a clearer photo or enter the name yourself. ' : '') + 'MobileNet recognizes a limited set of objects. Model scores are not verified accuracy. Confirm the name and category; add condition and details yourself.',
    },
  };
}
