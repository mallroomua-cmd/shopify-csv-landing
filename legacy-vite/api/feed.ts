import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SAMPLE_PRODUCTS } from '../src/lib/sample-data';
import { generateGoogleMerchantXml } from '../src/lib/merchant-xml';

/**
 * Serverless API endpoint for Google Merchant Center / Shopping feed.
 * Accessible at https://<domain>/api/feed or https://<domain>/api/feed.xml
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'mallroom.com.ua';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const siteUrl = `${proto}://${host}`;

  const xml = generateGoogleMerchantXml(SAMPLE_PRODUCTS, siteUrl, 'MALLROOM');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  return res.status(200).send(xml);
}
