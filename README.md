# 🔍 DeepSEO — Complete SEO Analysis Suite

A **professional-grade, free & open-source** SEO audit tool built with Next.js 14. Analyse any URL across 10 audit categories with no paid APIs required.

![DeepSEO](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Free](https://img.shields.io/badge/APIs-Free-green)

---

## ✨ Features

| Category | What's Checked |
|---|---|
| 🔤 **On-Page SEO** | Title tag, meta description, H1-H4 hierarchy, image alt text, keyword density (top 20) |
| ⚙️ **Technical SEO** | Canonical, robots.txt, sitemap, viewport, lang, charset, structured data (JSON-LD), hreflang |
| 🕷️ **Crawlability** | Indexability, noindex/nofollow detection, canonical correctness, pagination tags, AMP, internal links |
| 🔒 **Security** | HTTPS, HSTS, CSP, X-Frame-Options, mixed content, 6 security headers |
| ⚡ **Page Speed** | Google PageSpeed Insights — mobile & desktop scores + Core Web Vitals (FCP, LCP, TBT, CLS, TTI) |
| 🎨 **Rendering** | Lazy loading, JS render dependency, iframes, Flash, blocking CSS/JS, inline styles |
| 📱 **Social / OG** | All Open Graph tags, Twitter Card tags |
| 📝 **Content** | Word count, Flesch readability, text/code ratio, sentence length |
| 🔗 **Backlinks** | Outbound link profile, nofollow ratio, sponsored/UGC links |
| 🏆 **Competitor** | Side-by-side comparison of any two URLs on 8+ metrics + keyword gap |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/deep-seo-analyzer.git
cd deep-seo-analyzer

# 2. Install
npm install

# 3. Configure (optional)
cp .env.example .env.local
# Add PAGESPEED_API_KEY for higher rate limits

# 4. Run
npm run dev
```

Visit **http://localhost:3000**

---

## 📦 Deploy to Vercel

### Option A — CLI (fastest)
```bash
npm i -g vercel
vercel
```

### Option B — GitHub (recommended for CI/CD)
1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo
4. Optionally add `PAGESPEED_API_KEY` in Environment Variables
5. Click **Deploy** ✅

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PAGESPEED_API_KEY` | Optional | Free at [console.cloud.google.com](https://console.cloud.google.com) — enables higher PageSpeed rate limits |
| `ANTHROPIC_API_KEY` | Optional | Reserved for future AI-powered recommendations |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       ← Full SEO analysis (Cheerio)
│   │   ├── pagespeed/route.ts     ← Google PageSpeed (mobile + desktop)
│   │   └── competitor/route.ts   ← Competitor comparison
│   ├── globals.css                ← Design system
│   ├── layout.tsx
│   └── page.tsx                   ← Full UI (10 tabs, 50+ checks)
└── lib/
    ├── analyzer.ts                ← Core analysis engine
    └── types.ts                   ← TypeScript interfaces
```

---

## 📊 Scoring Weights

| Category | Weight |
|---|---|
| On-Page | 20% |
| Content | 15% |
| Technical | 15% |
| Crawl | 13% |
| Security | 12% |
| Rendering | 10% |
| Social | 10% |
| Backlinks | 5% |

---

## 🗺 Roadmap

- [ ] AI-powered fix recommendations (Claude API)
- [ ] Historical tracking & score trends
- [ ] Sitemap crawler (multi-page audit)
- [ ] PDF export report
- [ ] Keyword ranking tracker
- [ ] Core Web Vitals monitoring

---

## 📄 License

MIT — free to use, modify, and deploy.
