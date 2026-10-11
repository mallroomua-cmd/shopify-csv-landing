import assert from 'node:assert';
import { generateGoogleMerchantXml } from '../src/lib/merchant-xml.ts';
import { SAMPLE_PRODUCTS } from '../src/lib/sample-data.ts';

function runTests() {
  console.log('Testing generateGoogleMerchantXml...');
  const xml = generateGoogleMerchantXml(SAMPLE_PRODUCTS, 'https://example.com');
  
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Must have XML declaration');
  assert.ok(xml.includes('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">'), 'Must have RSS 2.0 namespace');
  assert.ok(xml.includes('<channel>'), 'Must have channel tag');
  
  // Test each product has required Google Merchant fields
  SAMPLE_PRODUCTS.forEach((product) => {
    assert.ok(xml.includes(`<g:id>${product.id}</g:id>`), `XML must include id for ${product.id}`);
    assert.ok(xml.includes(`<g:price>${product.price.toFixed(2)} UAH</g:price>`), `XML must include formatted price`);
    assert.ok(xml.includes('<g:availability>in_stock</g:availability>'), 'XML must include availability');
  });

  // Test XML escaping
  const productWithSpecialChars = [
    {
      ...SAMPLE_PRODUCTS[0],
      id: 'special-1',
      title: 'Title with & < > " and \' characters',
      bodyHtml: '<p>Body with <b>html</b> & entities</p>',
    },
  ];
  const specialXml = generateGoogleMerchantXml(productWithSpecialChars, 'https://example.com');
  assert.ok(specialXml.includes('Title with &amp; &lt; &gt; &quot; and &apos; characters'), 'Special characters must be properly escaped in title');
  assert.ok(!specialXml.includes('<p>'), 'HTML tags must be stripped from description');

  console.log('✓ All Google Merchant XML tests passed successfully!');
}

runTests();
