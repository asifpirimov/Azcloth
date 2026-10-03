export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  let cacheControl = 's-maxage=3600, stale-while-revalidate';

  let fallbackUsed = false;
  if (!process.env.VITE_API_URL) fallbackUsed = true;
  const API_URL = process.env.VITE_API_URL || 'https://api.azcloth.store';
  if (fallbackUsed) console.log(`[Sitemap] VITE_API_URL not found, using fallback: ${API_URL}`);
  const SITE_URL = 'https://www.azcloth.store';

  const staticPages = [
    '',
    '/stores',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/seller-terms'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
      }
    });
  };

  // Helper to append XML
  const addUrl = (path, lastmod) => {
    const safePath = escapeXml(encodeURI(path));
    xml += `
  <url>
    <loc>${SITE_URL}${safePath}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
  };

  // Add static pages
  staticPages.forEach(page => addUrl(page));

  // Fetch from API with timeout
  const fetchWithTimeout = async (url, ms = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const fetchAllPages = async (baseUrl, maxPages = 50) => {
    let results = [];
    let url = baseUrl;
    let pages = 0;
    
    while (url && pages < maxPages) {
      pages++;
      const data = await fetchWithTimeout(url);
      
      if (!data) throw new Error("Empty response");
      
      if (Array.isArray(data)) {
        results = results.concat(data);
        break; 
      } else if (data.results && Array.isArray(data.results)) {
        results = results.concat(data.results);
        url = data.next; 
      } else {
        throw new Error("Invalid payload structure");
      }
    }
    return results;
  };

  let productsSuccess = false;
  let storesSuccess = false;

  try {
    const stores = await fetchAllPages(`${API_URL}/api/stores/`);
    stores.forEach(store => {
      if (store.slug) {
        addUrl(`/store/${store.slug}`);
      }
    });
    storesSuccess = true;
  } catch (error) {
    console.error('Stores API fetch failed:', error);
  }

  try {
    const products = await fetchAllPages(`${API_URL}/api/products/`);
    products.forEach(product => {
      if (product.slug) {
        addUrl(`/product/${product.slug}`);
      }
    });
    productsSuccess = true;
  } catch (error) {
    console.error('Products API fetch failed:', error);
  }

  if (!productsSuccess || !storesSuccess) {
    console.error('One or more Sitemap API fetches failed, falling back to short cache.');
    cacheControl = 's-maxage=60, stale-while-revalidate';
  }

  res.setHeader('Cache-Control', cacheControl);
  xml += `\n</urlset>`;
  res.status(200).send(xml);
}
