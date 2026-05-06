// page.tsx (Next.js 13+ App Router, App Directory)

// Mark this file as a Client Component (it uses useState/useEffect).
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SEOReport } from '@/lib/types';
import Metric from '@/components/Metric';
import Image from 'next/image'; // (optional) For any images if needed in future
import Link from 'next/link';   // (optional) For internal navigation

// Utility functions for scoring
function scoreColor(s: number) {
  return s >= 80 ? '#00f5a0' : s >= 60 ? '#ffb700' : '#ff4060';
}
function scoreBg(s: number) {
  return s >= 80 ? 'rgba(0,245,160,0.07)' : s >= 60 ? 'rgba(255,183,0,0.07)' : 'rgba(255,64,96,0.07)';
}
function grade(s: number) {
  return s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s >= 50 ? 'D' : 'F';
}

// Reusable components (Ring, IssueItem, etc.) are kept as defined.
// [For brevity, only the main Page component is shown; other component definitions (Ring, Card, StatBox, IssueItem, Check, MeterBar, CompareRow) remain unchanged.]

export default function Page() {
  // State variables
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState<'overview' | 'amp' | 'intelligence' | 'competitor' | 'ai'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<SEOReport | null>(null);
  const [psData, setPsData] = useState<any>(null);
  const [psLoading, setPsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // AI Ranking state
  const [prompt, setPrompt] = useState('');
  const [brand, setBrand] = useState('');
  const [ranking, setRanking] = useState<any>(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Competitor comparison state
  const [compUrl, setCompUrl] = useState('');
  const [compData, setCompData] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);

  // Theme toggle effect
  useEffect(() => {
    // Toggle light/dark class on <html>
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  // Analyze action: fetch main SEO report and pagespeed
  const analyze = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);
    setPsData(null);
    setCompData(null);
    try {
      // Call our Next.js API route
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Analysis failed');
      }
      setReport(json.data as SEOReport);
      setTab('overview');

      // Fetch PageSpeed data (separate endpoint)
      setPsLoading(true);
      try {
        const psRes = await fetch('/api/pagespeed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const psJson = await psRes.json();
        setPsData(psJson);
      } catch {
        // Ignore PageSpeed errors
      } finally {
        setPsLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [url]);

  // AI Ranking action: fetch ranking from AI
  const runAIRanking = useCallback(async () => {
    if (!prompt.trim() || !brand.trim() || !report) return;
    setRankingLoading(true);
    try {
      const res = await fetch('/api/ai-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          brand,
          url: report.url,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'AI ranking failed');
      }
      setRanking(json.data); // Save ranking result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI ranking failed');
    } finally {
      setRankingLoading(false);
    }
  }, [prompt, brand, report]);

  // Competitor comparison: fetch competitor analysis
  const compareCompetitor = useCallback(async () => {
    if (!compUrl.trim() || !report) return;
    setCompLoading(true);
    try {
      const res = await fetch('/api/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: report.url,
          competitor: compUrl,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Competitor analysis failed');
      }
      setCompData(json.data); // Save competitor data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Competitor analysis failed');
    } finally {
      setCompLoading(false);
    }
  }, [compUrl, report]);

  return (
    <>
      <div className="grid-bg" />
      <div className="glow-top" />
      <div className="scanline" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border)', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem', color: 'var(--cyan)' }}>◈</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: '1rem', color: 'var(--text)', letterSpacing: '0.05em' }}>DEEPSEO</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 3 }}>v3.0</span>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            style={{ padding: '8px 12px', borderRadius: 4, border: 'none', fontFamily: 'IBM Plex Mono', color: 'var(--text)', background: isDark ? 'var(--surface3)' : 'var(--surface2)' }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        {/* Input Form */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            placeholder="Enter URL (e.g. https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              padding: 10,
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              borderRadius: 4,
              color: 'var(--text)',
              fontFamily: 'IBM Plex Mono',
            }}
          />
          <button
            onClick={analyze}
            disabled={loading || !url.trim()}
            style={{
              padding: '10px 18px',
              background: 'var(--cyan)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 5,
              fontFamily: 'IBM Plex Mono',
              fontSize: '0.9rem',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && <div style={{ color: '#ff4060', marginBottom: 12 }}>Error: {error}</div>}

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {['overview', 'amp', 'intelligence', 'competitor', 'ai'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: tab === t ? `2px solid var(--cyan)` : '1px solid var(--border)',
                background: tab === t ? 'var(--surface2)' : 'var(--surface3)',
                fontFamily: 'IBM Plex Mono',
                color: tab === t ? 'var(--cyan)' : 'var(--text)',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* TABS CONTENT */}
        <div style={{ animation: 'fadeUp 0.25s ease' }}>
          {/* OVERVIEW TAB */}
          {tab === 'overview' && report && (
            <div style={{ display: 'grid', gap: 16 }}>
              <Card title="Overview Score" score={report.score}>
                <Metric title="Overall Score" value={`${report.score}%`} />
                <div style={{ marginTop: 12, fontFamily: 'IBM Plex Mono', color: scoreColor(report.score) }}>
                  Grade: {grade(report.score)}
                </div>
              </Card>
              {/* Example of Link usage, if navigation needed (using Next.js <Link>) */}
              {/* <Link href="/somepage"><a>Go to some page</a></Link> */}
            </div>
          )}

          {/* AI RANKING TAB */}
          {tab === 'ai' && (
            <div style={{ display: 'grid', gap: 20 }}>
              <Card title="AI Prompt Ranking Engine" accent="#9b5cff">
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <input
                    placeholder="Prompt (e.g. best CRM for small business)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    style={{
                      flex: 2,
                      padding: 10,
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text)',
                      fontFamily: 'IBM Plex Mono',
                    }}
                  />
                  <input
                    placeholder="Your Brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text)',
                      fontFamily: 'IBM Plex Mono',
                    }}
                  />
                  <button
                    onClick={runAIRanking}
                    disabled={rankingLoading || !prompt.trim() || !brand.trim()}
                    style={{
                      background: '#9b5cff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '10px 14px',
                      fontFamily: 'IBM Plex Mono',
                    }}
                  >
                    {rankingLoading ? 'Checking...' : 'Run'}
                  </button>
                </div>
              </Card>
              {ranking && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Render AI ranking results */}
                  <Metric title="Ranking" value={`${ranking.position}`} />
                  <Metric title="Confidence" value={`${ranking.confidence}%`} />
                </div>
              )}
            </div>
          )}

          {/* COMPETITOR TAB */}
          {tab === 'competitor' && report && (
            <div style={{ display: 'grid', gap: 16 }}>
              <Card title="Compare with Competitor" accent="#00f5a0">
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <input
                    placeholder="Competitor URL"
                    value={compUrl}
                    onChange={(e) => setCompUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text)',
                      fontFamily: 'IBM Plex Mono',
                    }}
                  />
                  <button
                    onClick={compareCompetitor}
                    disabled={compLoading || !compUrl.trim()}
                    style={{
                      padding: '10px 18px',
                      background: '#00f5a0',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontFamily: 'IBM Plex Mono',
                    }}
                  >
                    {compLoading ? 'Comparing...' : 'Compare'}
                  </button>
                </div>
              </Card>
              {compData && (
                <div style={{ display: 'grid', gap: 8, border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
                  <CompareRow label="Word Count" a={compData.main.wordCount} b={compData.competitor.wordCount} />
                  <CompareRow label="Images" a={compData.main.imgCount} b={compData.competitor.imgCount} />
                  <CompareRow label="Internal Links" a={compData.main.internalLinks} b={compData.competitor.internalLinks} />
                  <CompareRow label="H1 Count" a={compData.main.h1Count} b={compData.competitor.h1Count} />
                  <CompareRow label="H2 Count" a={compData.main.h2Count} b={compData.competitor.h2Count} />
                  <CompareRow label="Structured Data" a={compData.main.hasStructuredData} b={compData.competitor.hasStructuredData} />
                  <CompareRow label="Open Graph Tags" a={compData.main.hasOg} b={compData.competitor.hasOg} />
                  {/* Top keywords side-by-side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                    <div>
                      <div style={{ fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Top Keywords</div>
                      {compData.main.topKeywords.map((kw: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: 'var(--text)' }}>{kw.word}</span>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: 'var(--text2)' }}>{kw.count}x</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Competitor Top Keywords</div>
                      {compData.competitor.topKeywords.map((kw: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: 'var(--text)' }}>{kw.word}</span>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: 'var(--text2)' }}>{kw.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline global styles for animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
