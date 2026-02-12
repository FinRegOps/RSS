# AFM & DNB RSS Feeds — GitBook Integratie Gids

## Alle beschikbare AFM RSS Feeds

| Feed | URL |
|------|-----|
| **Nieuws voor de sector** | `https://www.afm.nl/nl-nl/rss-feed/nieuws-professionals` |
| **Nieuws voor consumenten** | `https://www.afm.nl/nl-nl/rss-feed/nieuws-consumenten` |
| **Waarschuwingen AFM** | `https://www.afm.nl/nl-nl/rss-feed/waarschuwingen-afm` |
| **Waarschuwingen boilerrooms** | `https://www.afm.nl/nl-nl/rss-feed/waarschuwingen-boilerroom` |
| **Waarschuwingen buitenland** | `https://www.afm.nl/nl-nl/rss-feed/waarschuwingen-buitenlandse-toezichthouders` |

### DNB, EBA & ESMA feeds

| Feed | URL |
|------|-----|
| **DNB Nieuws** | `https://www.dnb.nl/en/rss/` |
| **EBA News** | `https://www.eba.europa.eu/news-press/news/rss.xml` |
| **ESMA News** | `https://www.esma.europa.eu/press-news/esma-news/feed` |

---

## De 3 opties om dit in GitBook te krijgen

### Optie 1: Embed URL (simpelst — 5 minuten)

GitBook ondersteunt geen `<iframe>`, maar wel **Embed URL blocks**. Dit werkt het beste:

1. Host de `index.html` op GitHub Pages (zoals we al gedaan hebben)
2. In GitBook editor → typ `/embed` → kies **Embed a URL**
3. Plak je GitHub Pages URL: `https://jouw-username.github.io/regulatory-news-feed/`

**Let op:** GitBook gebruikt iFramely om URLs te embedden. Als dit niet direct werkt, gebruik dan Optie 2.

---

### Optie 2: GitBook Custom Integration (aanbevolen — 30 min)

Dit is de officiële manier om een RSS feed widget in GitBook te bouwen. Je maakt een **GitBook Integration** die een `webframe` toont met je news feed.

**Stap 1:** Installeer de GitBook CLI
```bash
npm install -g @gitbook/cli
```

**Stap 2:** Maak een nieuw integration project
```bash
npx @gitbook/create-integration afm-news-feed
cd afm-news-feed
```

**Stap 3:** Pas `src/index.tsx` aan (zie het bestand `gitbook-integration.ts` in dit pakket)

**Stap 4:** Voeg `iframe.html` toe aan je integration (zie het bestand in dit pakket)

**Stap 5:** Publiceer
```bash
npx @gitbook/cli publish
```

**Stap 6:** Installeer de integration in je GitBook space via Settings → Integrations

---

### Optie 3: GitHub Actions + GitBook API (volledig automatisch)

Dit is de meest geavanceerde optie. Een GitHub Action haalt elke dag de RSS feeds op en update automatisch een pagina in GitBook via de GitBook API.

**Stap 1:** Maak een GitHub repo met het bestand `.github/workflows/rss-update.yml` (zie dit pakket)

**Stap 2:** Sla je GitBook API key op als GitHub Secret:
- Ga naar je repo → Settings → Secrets → New repository secret
- Naam: `GITBOOK_API_TOKEN`
- Waarde: je GitBook API token (te vinden in GitBook → Settings → API)

**Stap 3:** Het script draait elke dag om 07:00 en 13:00 en update je GitBook pagina automatisch.

---

## Welke optie past bij jou?

| Criterium | Optie 1: Embed | Optie 2: Integration | Optie 3: GitHub Actions |
|-----------|---------------|---------------------|------------------------|
| Moeilijkheid | ⭐ Simpel | ⭐⭐ Gemiddeld | ⭐⭐⭐ Geavanceerd |
| Setup tijd | 5 min | 30 min | 1 uur |
| Live data | ✅ Ja (client-side) | ✅ Ja (client-side) | ✅ Ja (server-side) |
| Native GitBook look | ❌ Apart frame | ✅ Geïntegreerd | ✅ Markdown content |
| Automatisch updaten | ✅ Bij laden | ✅ Bij laden | ✅ Op schema |
| Werkt offline | ❌ | ❌ | ✅ (cached content) |
