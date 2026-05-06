'use client';

import { useState, useCallback, useEffect } from 'react';
import type { SEOReport } from '@/lib/types';
import Metric from "@/components/Metric";

/* ---------------- HELPERS ---------------- */
function scoreColor(s: number) {
  return s >= 80 ? '#00f5a0' : s >= 60 ? '#ffb700' : '#ff4060';
}

function grade(s: number) {
  return s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s >= 50 ? 'D' : 'F';
}

/* ---------------- MAIN ---------------- */
export default function Page() {

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SEOReport | null>(null);
  const [error, setError] = useState('');

  // AI Ranking
  const [prompt, setPrompt] = useState('');
  const [brand, setBrand] = useState('');
  const [ranking, setRanking] = useState<any>(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Competitor
  const [compUrl, setCompUrl] = useState('');
  const [compData, setCompData] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);

  // UI
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  /* ---------------- ANALYZE ---------------- */
  const analyze = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Analysis failed');
      }

      setReport(json.data);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [url]);

  /* ---------------- AI RANKING ---------------- */
  const runAIRanking = async () => {
    if (!prompt || !brand) return;

    setRankingLoading(true);

    try {
      const res = await fetch("/api/ai-rank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          brand,
          url: report?.url,
        }),
      });

      const json = await res.json();
      setRanking(json);

    } catch (err) {
      console.error(err);
    } finally {
      setRankingLoading(false);
    }
  };

  /* ---------------- COMPETITOR ---------------- */
  const compareCompetitor = async () => {
    if (!compUrl || !report) return;

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
      setCompData(json);

    } catch (err) {
      console.error(err);
    } finally {
      setCompLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>

      <h1>Deep SEO Analyzer</h1>

      {/* THEME */}
      <button onClick={() => setIsDark(d => !d)}>
        Toggle {isDark ? 'Light' : 'Dark'}
      </button>

      {/* INPUT */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{ flex: 1 }}
        />

        <button onClick={analyze}>
          {loading ? 'Scanning...' : 'Analyze'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* REPORT */}
      {report && (
        <div style={{ marginTop: 30 }}>
          <h2>
            Score: {report.overallScore} ({grade(report.overallScore)})
          </h2>
          <p>{report.url}</p>

          <Metric title="Overall Score" value={report.overallScore} />
        </div>
      )}

      {/* AI RANKING */}
      <div style={{ marginTop: 40 }}>
        <h3>AI Ranking</h3>

        <input
          placeholder="Prompt (best CRM tools)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <input
          placeholder="Your Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />

        <button onClick={runAIRanking}>
          {rankingLoading ? "Checking..." : "Run"}
        </button>

        {ranking && (
          <div style={{ marginTop: 10 }}>
            <p>ChatGPT Rank: {ranking.chatgptRank}</p>
            <p>Claude Rank: {ranking.claudeRank}</p>
            <p>Perplexity Rank: {ranking.perplexityRank}</p>
            <p>Visibility Score: {ranking.visibilityScore}/100</p>
          </div>
        )}
      </div>

      {/* COMPETITOR */}
      {report && (
        <div style={{ marginTop: 40 }}>
          <h3>Competitor Comparison</h3>

          <input
            placeholder="Competitor URL"
            value={compUrl}
            onChange={(e) => setCompUrl(e.target.value)}
          />

          <button onClick={compareCompetitor}>
            {compLoading ? "Comparing..." : "Compare"}
          </button>

          {compData && (
            <pre style={{ marginTop: 10 }}>
              {JSON.stringify(compData, null, 2)}
            </pre>
          )}
        </div>
      )}

    </div>
  );
}
