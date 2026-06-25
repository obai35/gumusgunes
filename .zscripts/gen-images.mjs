// Image generation script for Gümüş Güneş jewelry store
// Generates 20 product/marketing images and saves them as JPEGs.

import ZAI from 'z-ai-web-dev-sdk';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/products';
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_STYLE =
  'professional studio product photography, luxury silver jewelry, soft dramatic lighting, dark navy blue gradient background, elegant, high-end jewelry brand aesthetic, ultra detailed, 8k, sharp focus';

// [filename, subjectPrompt, size]
const IMAGES = [
  ['hero-necklace.jpg', 'A stunning silver necklace with a diamond sun pendant displayed on a dark navy silk cloth, cinematic hero shot, dramatic sparkle, large centerpiece diamond', '1024x1024'],
  ['cat-rings.jpg', 'Elegant silver ring with a small diamond, single ring, top-down view on dark navy surface, minimalist composition', '1024x1024'],
  ['cat-necklaces.jpg', 'Silver chain necklace with crescent moon pendant, laid elegantly on navy fabric, soft drapes', '1024x1024'],
  ['cat-earrings.jpg', 'Pair of silver drop earrings with sun-ray design, displayed on dark navy velvet, symmetrical composition', '1024x1024'],
  ['cat-bracelets.jpg', 'Silver chain bracelet with small sun charm, displayed on dark navy surface, coiled elegantly', '1024x1024'],
  ['cat-pendants.jpg', 'Silver sun pendant with diamond center on a chain, close-up on navy silk, macro detail', '1024x1024'],
  ['cat-sets.jpg', 'Matching silver jewelry set with necklace and earrings displayed together elegantly on navy, coordinated luxury set', '1024x1024'],
  ['prod-ring-1.jpg', 'Silver solitaire ring with round diamond, side angle, navy background, brilliant cut diamond catching light', '1024x1024'],
  ['prod-ring-2.jpg', 'Silver band ring with engraved sun-ray pattern, navy background, ornate detailed engraving', '1024x1024'],
  ['prod-ring-3.jpg', 'Silver ring with blue sapphire center stone and small diamonds on shoulders, navy background, deep blue sapphire', '1024x1024'],
  ['prod-necklace-1.jpg', 'Silver pendant necklace with sunburst design, navy background, radiating sunburst motif', '1024x1024'],
  ['prod-necklace-2.jpg', 'Silver chain necklace with crescent moon and star pendant, navy background, celestial motif', '1024x1024'],
  ['prod-earring-1.jpg', 'Silver hoop earrings with sun motif, navy background, polished hoops with engraved sun', '1024x1024'],
  ['prod-earring-2.jpg', 'Silver drop earrings with pearl and diamond, navy background, lustrous white pearl drop', '1024x1024'],
  ['prod-bracelet-1.jpg', 'Silver charm bracelet with sun and moon charms, navy background, multiple delicate charms', '1024x1024'],
  ['prod-bracelet-2.jpg', 'Silver bangle bracelet with diamond accent, navy background, sleek polished bangle', '1024x1024'],
  ['prod-pendant-1.jpg', 'Silver sun pendant with diamond center, close-up, navy background, intricate sun rays around a brilliant diamond', '1024x1024'],
  ['prod-set-1.jpg', 'Silver necklace and earring set with matching sun design, navy background, coordinated luxury set', '1024x1024'],
  ['about-craft.jpg', 'Artisan jeweler hands crafting silver jewelry on a workbench, warm dramatic lighting, fine tools, silver wire and gemstones, close-up, hands at work, glowing warm tones, craftsmanship scene', '1344x768'],
  ['promo-banner.jpg', 'Wide banner of luxury silver jewelry collection displayed elegantly on dark navy background with subtle silver sparkles, multiple pieces necklace earrings rings arranged, cinematic wide composition', '1440x720'],
];

const CONCURRENCY = 3;
const MAX_ATTEMPTS = 2;

let zai;
async function init() {
  zai = await ZAI.create();
}

async function generateOne([filename, subject, size]) {
  const outPath = path.join(OUT_DIR, filename);
  const prompt = `${subject}, ${BASE_STYLE}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await zai.images.generations.create({ prompt, size });
      const b64 = resp?.data?.[0]?.base64;
      if (!b64) throw new Error('No base64 in response');
      const buf = Buffer.from(b64, 'base64');
      // Convert to JPEG via sharp, quality 90
      const jpgBuf = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
      fs.writeFileSync(outPath, jpgBuf);
      return { filename, success: true, attempts: attempt, bytes: jpgBuf.length };
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
        continue;
      }
      return { filename, success: false, attempts: attempt, error: String(err?.message || err) };
    }
  }
}

async function runPool(items, worker) {
  const results = [];
  const queue = [...items];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const item = queue.shift();
      const r = await worker(item);
      results.push(r);
      const tag = r.success ? 'OK ' : 'FAIL';
      console.log(`[${tag}] ${r.filename} (attempts=${r.attempts}${r.success ? `, ${r.bytes}B` : `, err=${r.error}`})`);
    }
  });
  await Promise.all(workers);
  return results;
}

(async () => {
  console.log(`Initializing Z-AI SDK...`);
  await init();
  console.log(`Generating ${IMAGES.length} images with concurrency=${CONCURRENCY}...`);
  const t0 = Date.now();
  const results = await runPool(IMAGES, generateOne);
  const t1 = Date.now();
  const ok = results.filter(r => r.success);
  const fail = results.filter(r => !r.success);
  console.log(`\n=== DONE in ${((t1 - t0) / 1000).toFixed(1)}s ===`);
  console.log(`Success: ${ok.length}/${results.length}`);
  if (fail.length) {
    console.log(`Failed:`);
    for (const f of fail) console.log(`  - ${f.filename}: ${f.error}`);
  }
  // Write machine-readable summary
  fs.writeFileSync('/home/z/my-project/.zscripts/gen-results.json', JSON.stringify({ ok: ok.length, fail: fail.length, failed: fail, durationMs: t1 - t0 }, null, 2));
  process.exit(fail.length ? 1 : 0);
})();
