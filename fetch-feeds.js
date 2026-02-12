/**
 * fetch-feeds.js
 * 
 * Fetches RSS feeds from AFM, DNB, EBA, and ESMA
 * and generates a Markdown page for GitBook.
 * 
 * Usage: node fetch-feeds.js
 * Output: docs/regulatory-news.md
 */

const https = require('https');
const http = require('http');
const { parseString } = require('xml2js');
const fs = require('fs');
const path = require('path');

// ─── RSS Feed Configuration ─────────────────────────────────────
const FEEDS = [
  {
    source: 'AFM',
    label: '🟢 AFM',
    url: 'https://www.afm.nl/nl-nl/rss-feed/nieuws-professionals',
    website: 'https://www.afm.nl/nl-nl/sector/actueel',
  },
  {
    source: 'AFM',
    label: '🟢 AFM',
    url: 'https://www.afm.nl/nl-nl/rss-feed/waarschuwingen-afm',
    website: 'https://www.afm.nl/nl-nl/consumenten/waarschuwingen',
    type: 'Warning',
  },
  {
    source: 'DNB',
    label: '🔵 DNB',
    url: 'https://www.dnb.nl/en/rss/',
    website: 'https://www.dnb.nl/algemeen-nieuws/',
  },
  {
    source: 'EBA',
    label: '🟤 EBA',
    url: 'https://www.eba.europa.eu/news-press/news/rss.xml',
    website: 'https://www.eba.europa.eu/news-press/news',
  },
  {
    source: 'ESMA',
    label: '🟣 ESMA',
    url: 'https://www.esma.europa.eu/press-news/esma-news/feed',
    website: 'https://www.esma.europa.eu/press-news/esma-news',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'RegulatoryNewsFeedBot/1.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseRSS(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false, trim: true }, (err, result) => {
      if (err) return reject(err);

      let items = [];

      // RSS 2.0
      if (result?.rss?.channel?.item) {
        const raw = result.rss.channel.item;
        items = Array.isArray(raw) ? raw : [raw];
        items = items.map(i => ({
          title: i.title || '',
          link: i.link || '',
          description: stripHtml(i.description || ''),
          date: i.pubDate ? new Date(i.pubDate) : new Date(),
        }));
      }
      // Atom
      else if (result?.feed?.entry) {
        const raw = result.feed.entry;
        items = Array.isArray(raw) ? raw : [raw];
        items = items.map(i => ({
          title: typeof i.title === 'object' ? i.title._ || i.title.$ || '' : i.title || '',
          link: i.link?.$ ? i.link.$.href : (typeof i.link === 'string' ? i.link : ''),
          description: stripHtml(i.summary?._ || i.summary || i.content?._ || i.content || ''),
          date: i.published ? new Date(i.published) : (i.updated ? new Date(i.updated) : new Date()),
        }));
      }

      resolve(items.filter(i => i.title));
    });
  });
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 200);
}

function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function guessType(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.includes('consultation') || text.includes('consultatie')) return '📋 Consultation';
  if (text.includes('warning') || text.includes('waarschuwing')) return '🔔 Warning';
  if (text.includes('enforcement') || text.includes('boete') || text.includes('fine')) return '⚖️ Enforcement';
  if (text.includes('guideline') || text.includes('guidance') || text.includes('leidraad')) return '📖 Guidance';
  if (text.includes('report') || text.includes('publication') || text.includes('rapport')) return '📊 Publication';
  if (text.includes('speech') || text.includes('toespraak')) return '🎤 Speech';
  return '📰 News';
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('🔄 Fetching regulatory news feeds...\n');

  let allItems = [];

  for (const feed of FEEDS) {
    try {
      console.log(`  Fetching ${feed.source}: ${feed.url}`);
      const xml = await fetchUrl(feed.url);
      const items = await parseRSS(xml);
      console.log(`  ✅ ${feed.source}: ${items.length} items\n`);

      allItems.push(...items.map(item => ({
        ...item,
        source: feed.source,
        label: feed.label,
        type: feed.type || guessType(item.title, item.description),
      })));
    } catch (err) {
      console.log(`  ❌ ${feed.source}: ${err.message}\n`);
    }
  }

  // Sort by date (newest first)
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Remove duplicates
  const seen = new Set();
  allItems = allItems.filter(item => {
    const key = item.title.toLowerCase().substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Limit to 30 most recent
  allItems = allItems.slice(0, 30);

  // ─── Generate Markdown ─────────────────────────────────────
  const now = new Date();
  const updated = now.toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  let md = `---
description: >-
  Automatisch bijgewerkte regulatory news feed van AFM, DNB, EBA en ESMA.
  Laatste update: ${updated}
---

# 📰 Regulatory News Feed

> **Laatste update:** ${updated}
> 
> Deze pagina wordt automatisch bijgewerkt via RSS feeds van de financiële toezichthouders.

## Directe links

| Toezichthouder | Nieuwspagina |
|---|---|
| 🟢 **AFM** | [afm.nl/sector/actueel](https://www.afm.nl/nl-nl/sector/actueel) |
| 🔵 **DNB** | [dnb.nl/algemeen-nieuws](https://www.dnb.nl/algemeen-nieuws/) |
| 🟤 **EBA** | [eba.europa.eu/news-press](https://www.eba.europa.eu/news-press/news) |
| 🟣 **ESMA** | [esma.europa.eu/esma-news](https://www.esma.europa.eu/press-news/esma-news) |

---

## Laatste nieuws

`;

  for (const item of allItems) {
    md += `### ${item.label} ${item.title}\n\n`;
    md += `**${formatDate(item.date)}** · ${item.type}\n\n`;
    if (item.description) {
      md += `${item.description}\n\n`;
    }
    if (item.link) {
      md += `🔗 [Lees meer →](${item.link})\n\n`;
    }
    md += `---\n\n`;
  }

  md += `\n*Deze pagina wordt automatisch gegenereerd. Bronnen: AFM, DNB, EBA, ESMA RSS feeds.*\n`;

  // ─── Write file ────────────────────────────────────────────
  const outDir = path.join(__dirname, 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'regulatory-news.md');
  fs.writeFileSync(outPath, md, 'utf8');

  console.log(`\n✅ Generated ${outPath} with ${allItems.length} items`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
