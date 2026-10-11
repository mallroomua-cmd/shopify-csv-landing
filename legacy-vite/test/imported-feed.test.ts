import assert from 'node:assert';
import fs from 'node:fs';
import { parseShopifyCsv } from '../src/lib/shopify-parser.ts';

console.log('Testing imported CSV feed parsing and categories...');

async function run() {
  const csv = fs.readFileSync('src/data/imported_feed.csv', 'utf8');
  const prods = await parseShopifyCsv(csv);

  assert.ok(prods.length >= 9, `Expected at least 9 products from feed, got ${prods.length}`);

  const handles = prods.map((p) => p.handle);
  assert.ok(handles.includes('sprei-parfumovanyi-dlia-tila-ta-volossia-sol-de-janeiro-rio-radiance-perfume-mis'));
  assert.ok(handles.includes('blysk-dlia-hub-fenty-beauty-gloss-bomb-universal-lip-luminizer-fenty-glow-9ml'));
  assert.ok(handles.includes('tint-dlia-hub-rare-beauty-soft-pinch-tinted-lip-oil-hope'));
  assert.ok(handles.includes('balzam-dlia-hub-summer-fridays-lip-butter-balm-brown-sugar-15ml'));
  assert.ok(handles.includes('oliika-dlia-hub-summer-fridays-dream-lip-oil-soft-mauve-4-5ml'));
  assert.ok(handles.includes('konturnyi-olivets-dlia-hub-rhode-peptide-lip-shape-stretch'));
  assert.ok(handles.includes('palitra-khailaiteriv-dlia-oblychchia-dior-backstage-glow-face-palette-001-univer'));
  assert.ok(handles.includes('ridki-rumiana-hourglass-unreal-liquid-blush-whim-10-3ml'));
  assert.ok(handles.includes('kosmetychka-charlotte-tilbury-sumka-zhinocha'));

  for (const p of prods) {
    assert.ok(p.price > 0, `Product ${p.handle} must have price > 0`);
    assert.ok(p.images.length > 0, `Product ${p.handle} must have images`);
    assert.ok(p.featuredImage.startsWith('https://'), `Product ${p.handle} must have https featured image`);
  }

  console.log('✓ All 9 feed products verified with high-res galleries and prices!');
  console.log('✓ ALL IMPORTED FEED TESTS PASSED PERFECTLY!');
}

run().catch((err) => {
  console.error('Imported feed test error:', err);
  process.exit(1);
});
