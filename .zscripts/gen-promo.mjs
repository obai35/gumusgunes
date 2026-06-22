import ZAI from 'z-ai-web-dev-sdk';
import sharp from 'sharp';
import fs from 'fs';

const BASE_STYLE =
  'professional studio product photography, luxury silver jewelry, soft dramatic lighting, dark navy blue gradient background, elegant, high-end jewelry brand aesthetic, ultra detailed, 8k, sharp focus';

const subject = 'Wide banner of luxury silver jewelry collection displayed elegantly on dark navy background with subtle silver sparkles, multiple pieces necklace earrings rings arranged, cinematic wide composition, 16:9 banner';

const outPath = '/home/z/my-project/public/products/promo-banner.jpg';

(async () => {
  const zai = await ZAI.create();
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await zai.images.generations.create({
        prompt: `${subject}, ${BASE_STYLE}`,
        size: '1344x768',
      });
      const b64 = resp?.data?.[0]?.base64;
      if (!b64) throw new Error('No base64');
      const buf = Buffer.from(b64, 'base64');
      const jpg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
      fs.writeFileSync(outPath, jpg);
      console.log(`OK promo-banner.jpg (${jpg.length}B) attempt=${attempt}`);
      process.exit(0);
    } catch (e) {
      console.error(`Attempt ${attempt} failed: ${e?.message || e}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  process.exit(1);
})();
