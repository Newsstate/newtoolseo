'use client';
import { useState, useCallback } from 'react';
import type { SEOReport } from '@/lib/types';

function scoreColor(s: number) {
  return s >= 80 ? '#00f5a0' : s >= 60 ? '#ffb700' : '#ff4060';
}
function scoreBg(s: number) {
  return s >= 80 ? 'rgba(0,245,160,0.07)' : s >= 60 ? 'rgba(255,183,0,0.07)' : 'rgba(255,64,96,0.07)';
}
function grade(s: number) {
  return s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s >= 50 ? 'D' : 'F';
}

function Ring({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = scoreColor(score);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#162035" strokeWidth="5" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={c}
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: size > 70 ? '1.1rem' : '0.85rem',
              fontWeight: 600,
              color: c,
              lineHeight: 1,
            }}
          >
            {score}
          </span>
        </div>
      </div>
      <span
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: '0.6rem',
          color: '#5a7a96',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function IssueItem({ text, type = 'warn' }: { text: string; type?: 'warn' | 'ok' | 'error' }) {
  const colors = { warn: '#ffb700', ok: '#00f5a0', error: '#ff4060' };
  const bgs = { warn: 'rgba(255,183,0,0.06)', ok: 'rgba(0,245,160,0.06)', error: 'rgba(255,64,96,0.06)' };
  const icons = { warn: '⚠', ok: '✓', error: '✗' };
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 10px',
        background: bgs[type],
        borderRadius: 4,
        borderLeft: `2px solid ${colors[type]}`,
        marginBottom: 6,
      }}
    >
      <span style={{ color: colors[type], fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', flexShrink: 0 }}>
        {icons[type]}
      </span>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#cdd8e8', lineHeight: 1.5 }}>
        {text}
      </span>
    </div>
  );
}

function Card({
  title,
  score,
  children,
  accent,
}: {
  title: string;
  score?: number;
  children: React.ReactNode;
  accent?: string;
}) {
  const c = score !== undefined ? scoreColor(score) : accent || '#00d4ff';
  return (
    <div style={{ background: '#0c1422', border: '1px solid #162035', borderRadius: 8, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #162035',
          background: '#080e1a',
        }}
      >
        <span
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: '0.65rem',
            fontWeight: 600,
            color: c,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {title}
        </span>
        {score !== undefined && (
          <span
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: '0.65rem',
              color: c,
              background: scoreBg(score),
              border: `1px solid ${c}40`,
              padding: '2px 8px',
              borderRadius: 3,
            }}
          >
            {score}/100
          </span>
        )}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div
      style={{
        background: '#101b2e',
        border: '1px solid #162035',
        borderRadius: 6,
        padding: '12px 14px',
        flex: 1,
        minWidth: 90,
      }}
    >
      <div
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: '1.4rem',
          fontWeight: 600,
          color: color || '#00d4ff',
          marginBottom: 4,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: '0.58rem',
          color: '#5a7a96',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Check({ label, value, pass }: { label: string; value: string | boolean | null; pass: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        background: '#101b2e',
        borderRadius: 5,
        marginBottom: 6,
      }}
    >
      <span style={{ color: pass ? '#00f5a0' : '#ff4060', fontFamily: 'IBM Plex Mono', fontSize: '0.8rem', flexShrink: 0 }}>
        {pass ? '✓' : '✗'}
      </span>
      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#5a7a96', flexShrink: 0, minWidth: 160 }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: '0.7rem',
          color: '#cdd8e8',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || 'Not set'}
      </span>
    </div>
  );
}

function MeterBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || (pct >= 80 ? '#00f5a0' : pct >= 50 ? '#ffb700' : '#ff4060');
  return (
    <div style={{ height: 4, background: '#162035', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 2, transition: 'width 1s ease' }} />
    </div>
  );
}

function CompareRow({ label, a, b, higherBetter = true }: { label: string; a: any; b: any; higherBetter?: boolean }) {
  const aNum = typeof a === 'number' ? a : 0;
  const bNum = typeof b === 'number' ? b : 0;
  const aWins = higherBetter ? aNum >= bNum : aNum <= bNum;
  const tie = aNum === bNum;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 12,
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #162035',
      }}
    >
      <div
        style={{
          textAlign: 'right',
          fontFamily: 'IBM Plex Mono',
          fontSize: '0.78rem',
          color: tie ? '#cdd8e8' : aWins ? '#00f5a0' : '#ff4060',
          fontWeight: aWins && !tie ? 600 : 400,
        }}
      >
        {typeof a === 'boolean' ? (a ? 'Yes' : 'No') : a}
      </div>
      <div
        style={{
          fontFamily: 'IBM Plex Mono',
          fontSize: '0.6rem',
          color: '#5a7a96',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textAlign: 'center',
          minWidth: 120,
        }}
      >
        {label}
      </div>
      <div
        style={{
          textAlign: 'left',
          fontFamily: 'IBM Plex Mono',
          fontSize: '0.78rem',
          color: tie ? '#cdd8e8' : !aWins ? '#00f5a0' : '#ff4060',
          fontWeight: !aWins && !tie ? 600 : 400,
        }}
      >
        {typeof b === 'boolean' ? (b ? 'Yes' : 'No') : b}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'onpage', label: 'On-Page' },
  { id: 'technical', label: 'Technical' },
  { id: 'crawl', label: 'Crawl' },
  { id: 'security', label: 'Security' },
  { id: 'performance', label: 'Speed' },
  { id: 'rendering', label: 'Rendering' },
  { id: 'social', label: 'Social' },
  { id: 'content', label: 'Content' },
  { id: 'amp', label: '⚡ AMP' },
  { id: 'competitor', label: 'Competitor' },
];

export default function Page() {
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SEOReport | null>(null);
  const [psData, setPsData] = useState<any>(null);
  const [psLoading, setPsLoading] = useState(false);
  const [error, setError] = useState('');
  const [compUrl, setCompUrl] = useState('');
  const [compData, setCompData] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);

  const analyze = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);
    setPsData(null);
    setCompData(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReport(data);
      setTab('overview');
      setPsLoading(true);
      fetch('/api/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
        .then((r) => r.json())
        .then(setPsData)
        .catch(() => {})
        .finally(() => setPsLoading(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const compareCompetitor = useCallback(async () => {
    if (!compUrl.trim() || !report) return;
    setCompLoading(true);
    try {
      const res = await fetch('/api/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: report.url, competitor: compUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Competitor analysis failed');
    } finally {
      setCompLoading(false);
    }
  }, [compUrl, report]);

  const derivedCanonicalToAmp = (r: SEOReport | null) => {
    if (!r?.amp) return false;
    return !!r.amp.ampUrl;
  };

  return (
    <>
      <div className="grid-bg" />
      <div className="glow-top" />
      <div className="scanline" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 0',
            borderBottom: '1px solid #162035',
            marginBottom: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem', color: '#00d4ff' }}>◈</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: '1rem', color: '#cdd8e8', letterSpacing: '0.05em' }}>
              DEEPSEO
            </span>
            <span
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: '0.6rem',
                color: '#2a4560',
                background: '#101b2e',
                border: '1px solid #162035',
                padding: '2px 6px',
                borderRadius: 3,
              }}
            >
              v2.0
            </span>
          </div>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#2a4560', letterSpacing: '0.1em' }}>
            COMPLETE SEO ANALYSIS SUITE
          </span>
        </header>

        <section style={{ textAlign: 'center', marginBottom: 50 }}>
          <h1
            style={{
              fontFamily: 'Barlow',
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            <span style={{ color: '#2a4560' }}>Deep</span>
            <span style={{ color: '#00d4ff', textShadow: '0 0 40px rgba(0,212,255,0.5)' }}> SEO</span>
            <span style={{ color: '#cdd8e8' }}> Analysis</span>
          </h1>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.8rem', color: '#5a7a96', marginBottom: 32 }}>
            On-page · Technical · Crawl · Security · Speed · Rendering · Social · Content · Competitor
          </p>

          <div style={{ display: 'flex', gap: 8, maxWidth: 680, margin: '0 auto' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#2a4560',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '0.85rem',
                  pointerEvents: 'none',
                }}
              >
                ↗
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                placeholder="https://example.com"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 36px',
                  background: '#080e1a',
                  border: '1px solid #1e2f4a',
                  borderRadius: 6,
                  color: '#cdd8e8',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '0.88rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00d4ff';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#1e2f4a';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading || !url.trim()}
              style={{
                padding: '13px 24px',
                background: loading ? '#101b2e' : '#00d4ff',
                color: loading ? '#5a7a96' : '#04080f',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'Barlow',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {loading && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid #5a7a96',
                    borderTopColor: '#00d4ff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }}
                />
              )}
              {loading ? 'Scanning…' : 'Analyse Site'}
            </button>
          </div>
          {error && <p style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: '#ff4060', marginTop: 12 }}>✗ {error}</p>}
        </section>

        {report && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div
              style={{
                background: '#080e1a',
                border: '1px solid #162035',
                borderRadius: 10,
                padding: '24px 28px',
                marginBottom: 20,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 28,
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Barlow', fontWeight: 900, fontSize: '4.5rem', lineHeight: 1, color: scoreColor(report.overallScore) }}>
                    {grade(report.overallScore)}
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.55rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Grade
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Barlow', fontWeight: 800, fontSize: '2.5rem', lineHeight: 1, color: '#cdd8e8' }}>
                    {report.overallScore}
                    <span style={{ fontSize: '1rem', color: '#2a4560' }}>/100</span>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: '#5a7a96', marginTop: 4 }}>{report.url}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.58rem', color: '#2a4560', marginTop: 2 }}>
                    {new Date(report.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, flex: 1, justifyContent: 'flex-end' }}>
                {[
                  { score: report.onPage.score, label: 'On-Page' },
                  { score: report.technical.score, label: 'Technical' },
                  { score: report.crawl.score, label: 'Crawl' },
                  { score: report.security.score, label: 'Security' },
                  { score: report.rendering.score, label: 'Rendering' },
                  { score: report.social.score, label: 'Social' },
                  { score: report.content.score, label: 'Content' },
                  { score: report.amp?.score ?? 0, label: '⚡ AMP' },
                ].map((s) => (
                  <Ring key={s.label} score={s.score} label={s.label} size={72} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 2, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '8px 16px',
                    background: tab === t.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                    border: tab === t.id ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                    borderRadius: 5,
                    color: tab === t.id ? '#00d4ff' : '#5a7a96',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '0.7rem',
                    fontWeight: tab === t.id ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t.label.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ animation: 'fadeUp 0.25s ease' }}>
              {tab === 'overview' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <StatBox label="Words" value={report.content.wordCount.toLocaleString()} />
                    <StatBox label="Images" value={report.onPage.images.total} />
                    <StatBox label="Internal Links" value={report.onPage.links.internal} color="#00f5a0" />
                    <StatBox label="External Links" value={report.onPage.links.external} color="#ffb700" />
                    <StatBox label="H1 Tags" value={report.onPage.headings.h1.length} color={report.onPage.headings.h1.length === 1 ? '#00f5a0' : '#ff4060'} />
                    <StatBox label="H2 Tags" value={report.onPage.headings.h2.length} />
                    <StatBox label="Structured Data" value={report.technical.structuredData.found ? 'Yes' : 'No'} color={report.technical.structuredData.found ? '#00f5a0' : '#ff4060'} />
                    <StatBox label="HTTPS" value={report.security.https ? 'Yes' : 'No'} color={report.security.https ? '#00f5a0' : '#ff4060'} />
                    <StatBox
                      label="AMP"
                      value={report.amp?.hasAmp ? (report.amp.isAmpPage ? '⚡ Is AMP' : '⚡ Linked') : 'None'}
                      color={report.amp?.hasAmp ? '#00f5a0' : '#ffb700'}
                    />
                    <StatBox
                      label="Canonical→AMP"
                      value={report.amp?.hasAmp ? (derivedCanonicalToAmp(report) ? 'Yes' : 'No') : '—'}
                      color={report.amp?.hasAmp ? (derivedCanonicalToAmp(report) ? '#00f5a0' : '#ff4060') : '#5a7a96'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    <Card title="All Issues Found">
                      {[
                        ...report.onPage.title.issues,
                        ...report.onPage.metaDescription.issues,
                        ...report.onPage.headings.issues,
                        ...report.technical.issues,
                        ...report.crawl.issues,
                        ...report.security.issues,
                        ...report.rendering.issues,
                        ...report.content.issues,
                        ...report.social.issues,
                      ].length === 0 ? (
                        <IssueItem text="No critical issues found — great job!" type="ok" />
                      ) : (
                        [
                          ...report.onPage.title.issues,
                          ...report.onPage.metaDescription.issues,
                          ...report.onPage.headings.issues,
                          ...report.technical.issues,
                          ...report.crawl.issues,
                          ...report.security.issues,
                          ...report.rendering.issues,
                          ...report.content.issues,
                          ...report.social.issues,
                        ].map((iss, i) => (
                          <IssueItem
                            key={i}
                            text={iss}
                            type={
                              iss.toLowerCase().includes('critical') ||
                              iss.toLowerCase().includes('not found') ||
                              iss.toLowerCase().includes('noindex')
                                ? 'error'
                                : 'warn'
                            }
                          />
                        ))
                      )}
                    </Card>

                    <Card title="Top Keywords">
                      {report.onPage.keywords.topKeywords.slice(0, 10).map((kw) => (
                        <div key={kw.word} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: '#cdd8e8', minWidth: 100 }}>{kw.word}</span>
                          <MeterBar value={kw.density} max={5} color={kw.density > 3 ? '#ff4060' : '#00d4ff'} />
                          <span
                            style={{
                              fontFamily: 'IBM Plex Mono',
                              fontSize: '0.65rem',
                              color: kw.density > 3 ? '#ff4060' : '#5a7a96',
                              minWidth: 45,
                              textAlign: 'right',
                            }}
                          >
                            {kw.count}x {kw.density}%
                          </span>
                        </div>
                      ))}
                    </Card>
                  </div>
                </div>
              )}

              {tab === 'onpage' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <Card title="Title Tag" score={report.onPage.title.score}>
                      <div
                        style={{
                          fontFamily: 'IBM Plex Mono',
                          fontSize: '0.8rem',
                          color: '#cdd8e8',
                          background: '#101b2e',
                          padding: 12,
                          borderRadius: 5,
                          marginBottom: 10,
                          wordBreak: 'break-word',
                          lineHeight: 1.5,
                        }}
                      >
                        {report.onPage.title.content || <span style={{ color: '#ff4060', fontStyle: 'italic' }}>Not found</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <MeterBar value={report.onPage.title.length} max={60} />
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#5a7a96', whiteSpace: 'nowrap' }}>
                          {report.onPage.title.length}/60
                        </span>
                      </div>
                      {report.onPage.title.issues.map((i, idx) => (
                        <IssueItem key={idx} text={i} />
                      ))}
                      {!report.onPage.title.issues.length && <IssueItem text="Title looks good!" type="ok" />}
                    </Card>

                    <Card title="Meta Description" score={report.onPage.metaDescription.score}>
                      <div
                        style={{
                          fontFamily: 'IBM Plex Mono',
                          fontSize: '0.78rem',
                          color: '#cdd8e8',
                          background: '#101b2e',
                          padding: 12,
                          borderRadius: 5,
                          marginBottom: 10,
                          lineHeight: 1.6,
                        }}
                      >
                        {report.onPage.metaDescription.content || <span style={{ color: '#ff4060', fontStyle: 'italic' }}>Not found</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <MeterBar value={report.onPage.metaDescription.length} max={160} />
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#5a7a96', whiteSpace: 'nowrap' }}>
                          {report.onPage.metaDescription.length}/160
                        </span>
                      </div>
                      {report.onPage.metaDescription.issues.map((i, idx) => (
                        <IssueItem key={idx} text={i} />
                      ))}
                      {!report.onPage.metaDescription.issues.length && <IssueItem text="Meta description looks good!" type="ok" />}
                    </Card>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <Card title="Heading Structure" score={report.onPage.headings.score}>
                      {[['H1', report.onPage.headings.h1], ['H2', report.onPage.headings.h2], ['H3', report.onPage.headings.h3]].map(([tagName, items]) => (
                        <div key={tagName as string} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span
                              style={{
                                fontFamily: 'IBM Plex Mono',
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                color: '#00d4ff',
                                background: 'rgba(0,212,255,0.08)',
                                border: '1px solid rgba(0,212,255,0.2)',
                                padding: '1px 6px',
                                borderRadius: 3,
                              }}
                            >
                              {tagName as string}
                            </span>
                            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560' }}>{(items as string[]).length} found</span>
                          </div>
                          {(items as string[]).slice(0, 3).map((h, i) => (
                            <div
                              key={i}
                              style={{
                                fontFamily: 'IBM Plex Mono',
                                fontSize: '0.72rem',
                                color: '#5a7a96',
                                background: '#101b2e',
                                padding: '5px 8px',
                                borderRadius: 4,
                                marginBottom: 3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {h}
                            </div>
                          ))}
                        </div>
                      ))}
                      {report.onPage.headings.issues.map((i, idx) => (
                        <IssueItem key={idx} text={i} />
                      ))}
                    </Card>

                    <Card title="Image Analysis" score={report.onPage.images.score}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <StatBox label="Total" value={report.onPage.images.total} />
                        <StatBox label="With Alt" value={report.onPage.images.withAlt} color="#00f5a0" />
                        <StatBox
                          label="Missing Alt"
                          value={report.onPage.images.withoutAlt}
                          color={report.onPage.images.withoutAlt > 0 ? '#ff4060' : '#00f5a0'}
                        />
                      </div>
                      {report.onPage.images.issues.map((i, idx) => (
                        <IssueItem key={idx} text={i} />
                      ))}
                      {!report.onPage.images.issues.length && <IssueItem text="All images have alt text!" type="ok" />}
                    </Card>
                  </div>

                  <Card title="Keyword Density (Top 20)">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6 }}>
                      {report.onPage.keywords.topKeywords.map((kw) => (
                        <div key={kw.word} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #162035' }}>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#cdd8e8', minWidth: 80 }}>{kw.word}</span>
                          <MeterBar value={kw.density} max={4} />
                          <span
                            style={{
                              fontFamily: 'IBM Plex Mono',
                              fontSize: '0.62rem',
                              color: kw.density > 3 ? '#ff4060' : '#5a7a96',
                              minWidth: 40,
                              textAlign: 'right',
                            }}
                          >
                            {kw.density}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {tab === 'technical' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <Card title="Technical SEO Checks" score={report.technical.score}>
                    {report.technical.issues.map((i, idx) => (
                      <IssueItem key={idx} text={i} type="warn" />
                    ))}
                    {!report.technical.issues.length && <IssueItem text="All technical checks passed!" type="ok" />}
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Check label="Canonical URL" value={report.technical.canonical} pass={!!report.technical.canonical} />
                      <Check label="HTTPS" value={report.technical.httpToHttps} pass={report.technical.httpToHttps} />
                      <Check label="Viewport Meta" value={report.technical.viewport} pass={!!report.technical.viewport} />
                      <Check label="HTML lang" value={report.technical.lang} pass={!!report.technical.lang} />
                      <Check label="Robots.txt" value={report.technical.robotsTxt.accessible ? 'Accessible' : 'Not found'} pass={report.technical.robotsTxt.accessible} />
                      <Check label="Sitemap linked" value={report.technical.sitemapLinked} pass={report.technical.sitemapLinked} />
                      <Check
                        label="Structured Data"
                        value={report.technical.structuredData.found ? report.technical.structuredData.types.join(', ') : 'None'}
                        pass={report.technical.structuredData.found}
                      />
                      <Check label="Hreflang" value={report.technical.hreflang.length > 0 ? report.technical.hreflang.join(', ') : 'None'} pass={report.technical.hreflang.length > 0} />
                      <Check label="Charset" value={report.technical.charset} pass={!!report.technical.charset} />
                      <Check label="Robots meta" value={report.technical.robots || 'Not set (defaults to index)'} pass={true} />
                      <Check label="WWW version" value={report.technical.www ? 'www.' : 'non-www'} pass={true} />
                    </div>
                  </Card>

                  {report.technical.robotsTxt.content && (
                    <Card title="robots.txt Content">
                      <pre
                        style={{
                          fontFamily: 'IBM Plex Mono',
                          fontSize: '0.72rem',
                          color: '#5a7a96',
                          background: '#080e1a',
                          padding: 12,
                          borderRadius: 5,
                          overflow: 'auto',
                          maxHeight: 250,
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {report.technical.robotsTxt.content}
                      </pre>
                    </Card>
                  )}
                </div>
              )}

              {tab === 'crawl' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <Card title="Crawlability Status" score={report.crawl.score}>
                      {report.crawl.issues.map((i, idx) => (
                        <IssueItem key={idx} text={i} type={i.toLowerCase().includes('noindex') ? 'error' : 'warn'} />
                      ))}
                      {!report.crawl.issues.length && <IssueItem text="Page is fully crawlable!" type="ok" />}
                      <div style={{ marginTop: 12 }}>
                        <Check label="Indexable" value={report.crawl.indexable} pass={report.crawl.indexable} />
                        <Check label="Noindex blocked" value={!report.crawl.robotsBlocked} pass={!report.crawl.robotsBlocked} />
                        <Check label="Nofollow page" value={!report.crawl.nofollowPage} pass={!report.crawl.nofollowPage} />
                        <Check label="Canonical correct" value={report.crawl.canonicalCorrect} pass={report.crawl.canonicalCorrect} />
                        <Check label="Pagination tags" value={report.crawl.paginationTags} pass={true} />
                        <Check label="AMP version" value={report.crawl.ampVersion} pass={true} />
                      </div>
                    </Card>
                    <Card title="Link Distribution">
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <StatBox label="Internal" value={report.onPage.links.internal} color="#00d4ff" />
                        <StatBox label="External" value={report.onPage.links.external} color="#00f5a0" />
                        <StatBox label="Nofollow" value={report.onPage.links.nofollow} color="#ffb700" />
                      </div>
                    </Card>
                  </div>

                  <Card title={`Internal Links (${report.crawl.internalLinks.length} found)`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflow: 'auto' }}>
                      {report.crawl.internalLinks.slice(0, 25).map((link, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 8px', background: '#101b2e', borderRadius: 4, alignItems: 'center' }}>
                          <span
                            style={{
                              fontFamily: 'IBM Plex Mono',
                              fontSize: '0.65rem',
                              color: '#00d4ff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {link.href}
                          </span>
                          {link.text && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.62rem', color: '#5a7a96', whiteSpace: 'nowrap' }}>{link.text.slice(0, 30)}</span>}
                          {link.rel && (
                            <span
                              style={{
                                fontFamily: 'IBM Plex Mono',
                                fontSize: '0.58rem',
                                color: '#ffb700',
                                background: 'rgba(255,183,0,0.1)',
                                padding: '1px 5px',
                                borderRadius: 3,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {link.rel}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {tab === 'security' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <Card title="Security Headers & HTTPS" score={report.security.score}>
                    {report.security.issues.map((i, idx) => (
                      <IssueItem key={idx} text={i} type={i.toLowerCase().includes('https') && !report.security.https ? 'error' : 'warn'} />
                    ))}
                    {!report.security.issues.length && <IssueItem text="Security headers look good!" type="ok" />}
                    <div style={{ marginTop: 12 }}>
                      <Check label="HTTPS" value={report.security.https} pass={report.security.https} />
                      <Check label="HSTS" value={report.security.hsts} pass={report.security.hsts} />
                      <Check label="Content-Security-Policy" value={report.security.csp} pass={report.security.csp} />
                      <Check label="X-Frame-Options" value={report.security.xFrameOptions} pass={report.security.xFrameOptions} />
                      <Check label="Mixed Content" value={!report.security.mixedContent ? 'Clean' : 'Detected'} pass={!report.security.mixedContent} />
                    </div>
                  </Card>
                  <Card title="HTTP Security Headers">
                    {Object.entries(report.security.safeHeaders).map(([key, val]) => (
                      <Check key={key} label={key} value={val || 'Not set'} pass={!!val} />
                    ))}
                  </Card>
                </div>
              )}

              {tab === 'performance' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  {psLoading && (
                    <Card title="Google PageSpeed — Loading">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20, color: '#5a7a96', fontFamily: 'IBM Plex Mono', fontSize: '0.78rem' }}>
                        <span style={{ width: 16, height: 16, border: '2px solid #162035', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                        Fetching Google PageSpeed Insights for mobile & desktop…
                      </div>
                    </Card>
                  )}
                  {psData && !psData.error && (
                    <>
                      {['mobile', 'desktop'].map((strategy) => {
                        const d = psData[strategy];
                        if (!d) return null;
                        return (
                          <div key={strategy}>
                            <Card title={`PageSpeed — ${strategy.charAt(0).toUpperCase() + strategy.slice(1)}`}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #162035' }}>
                                {[
                                  { label: 'Performance', value: d.performance },
                                  { label: 'Accessibility', value: d.accessibility },
                                  { label: 'Best Practices', value: d.bestPractices },
                                  { label: 'SEO Score', value: d.seo },
                                ].map((s) => (
                                  <Ring key={s.label} score={s.value} label={s.label} size={88} />
                                ))}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                                {[
                                  { label: 'FCP', value: d.fcp, desc: 'First Contentful Paint' },
                                  { label: 'LCP', value: d.lcp, desc: 'Largest Contentful Paint' },
                                  { label: 'TBT', value: d.tbt, desc: 'Total Blocking Time' },
                                  { label: 'CLS', value: d.cls, desc: 'Cumulative Layout Shift' },
                                  { label: 'TTI', value: d.tti, desc: 'Time to Interactive' },
                                  { label: 'Speed Index', value: d.speedIndex, desc: 'Speed Index' },
                                ].map((v) => (
                                  <div key={v.label} style={{ background: '#101b2e', border: '1px solid #162035', borderRadius: 6, padding: '12px 14px' }}>
                                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '1.1rem', fontWeight: 500, color: '#00d4ff', marginBottom: 3 }}>{v.value}</div>
                                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase' }}>{v.desc}</div>
                                  </div>
                                ))}
                              </div>
                              {d.opportunities?.length > 0 && (
                                <div>
                                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                    Top Opportunities
                                  </div>
                                  {d.opportunities.map((opp: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #162035' }}>
                                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: scoreBg(opp.score), border: `2px solid ${scoreColor(opp.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: scoreColor(opp.score), fontWeight: 600 }}>{opp.score}</span>
                                      </div>
                                      <div>
                                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#cdd8e8' }}>{opp.title}</div>
                                        {opp.displayValue && <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.62rem', color: '#5a7a96' }}>{opp.displayValue}</div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Card>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {psData?.error && <IssueItem text={`PageSpeed error: ${psData.error}`} type="error" />}
                  {!psLoading && !psData && (
                    <Card title="PageSpeed">
                      <p style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: '#5a7a96' }}>PageSpeed data loading in background…</p>
                    </Card>
                  )}
                </div>
              )}

              {tab === 'rendering' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <Card title="Rendering & Page Load" score={report.rendering.score}>
                    {report.rendering.issues.map((i, idx) => (
                      <IssueItem key={idx} text={i} />
                    ))}
                    {!report.rendering.issues.length && <IssueItem text="Rendering looks good!" type="ok" />}
                    <div style={{ marginTop: 12 }}>
                      <Check label="Lazy Loading Images" value={report.rendering.lazyLoadImages} pass={report.rendering.lazyLoadImages} />
                      <Check label="JS Render Required" value={!report.rendering.jsRenderRequired ? 'Static' : 'JS required'} pass={!report.rendering.jsRenderRequired} />
                      <Check label="Flash / Object" value={!report.rendering.flashContent ? 'None' : 'Found'} pass={!report.rendering.flashContent} />
                      <Check label="iFrames" value={`${report.rendering.iframes} found`} pass={report.rendering.iframes === 0} />
                      <Check label="Blocking CSS files" value={`${report.rendering.cssBlocking} files`} pass={report.rendering.cssBlocking <= 3} />
                      <Check label="Blocking JS scripts" value={`${report.rendering.jsBlocking} scripts`} pass={report.rendering.jsBlocking <= 3} />
                      <Check label="Inline styles" value={`${report.rendering.inlineStyles} elements`} pass={report.rendering.inlineStyles < 20} />
                    </div>
                  </Card>
                  <Card title="Rendering Recommendations">
                    <IssueItem text="Use loading='lazy' on all below-the-fold images" type={report.rendering.lazyLoadImages ? 'ok' : 'warn'} />
                    <IssueItem text="Add async or defer to all non-critical JavaScript" type={report.rendering.jsBlocking <= 3 ? 'ok' : 'warn'} />
                    <IssueItem text="Inline critical CSS, defer the rest" type={report.rendering.cssBlocking <= 3 ? 'ok' : 'warn'} />
                    <IssueItem text="Ensure content is visible without JavaScript" type={report.rendering.jsRenderRequired ? 'error' : 'ok'} />
                    <IssueItem text="Use WebP/AVIF image formats for faster rendering" type="warn" />
                    <IssueItem text="Minify and compress all CSS/JS assets" type="warn" />
                  </Card>
                </div>
              )}

              {tab === 'social' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    <Card title="Open Graph Tags" score={report.social.score}>
                      {report.social.issues.map((i, idx) => (
                        <IssueItem key={idx} text={i} />
                      ))}
                      {!report.social.issues.length && <IssueItem text="All OG tags present!" type="ok" />}
                      <div style={{ marginTop: 12 }}>
                        <Check label="og:title" value={report.social.ogTitle} pass={!!report.social.ogTitle} />
                        <Check label="og:description" value={report.social.ogDescription} pass={!!report.social.ogDescription} />
                        <Check label="og:image" value={report.social.ogImage} pass={!!report.social.ogImage} />
                        <Check label="og:type" value={report.social.ogType} pass={!!report.social.ogType} />
                      </div>
                    </Card>
                    <Card title="Twitter Card Tags">
                      <Check label="twitter:card" value={report.social.twitterCard} pass={!!report.social.twitterCard} />
                      <Check label="twitter:title" value={report.social.twitterTitle} pass={!!report.social.twitterTitle} />
                      <Check label="twitter:description" value={report.social.twitterDescription} pass={!!report.social.twitterDescription} />
                      <Check label="twitter:image" value={report.social.twitterImage} pass={!!report.social.twitterImage} />
                    </Card>
                  </div>
                </div>
              )}

              {tab === 'content' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <StatBox label="Total Words" value={report.content.wordCount.toLocaleString()} />
                    <StatBox label="Paragraphs" value={report.content.paragraphCount} />
                    <StatBox label="Readability" value={`${report.content.readabilityScore}%`} color={report.content.readabilityScore >= 60 ? '#00f5a0' : '#ffb700'} />
                    <StatBox label="Grade Level" value={report.content.readabilityGrade} />
                    <StatBox label="Avg Sentence" value={`${report.content.avgSentenceLength}w`} />
                    <StatBox label="Text/Code Ratio" value={`${report.content.contentToCodeRatio}%`} color={report.content.contentToCodeRatio >= 20 ? '#00f5a0' : '#ffb700'} />
                  </div>
                  <Card title="Content Quality" score={report.content.score}>
                    {report.content.issues.map((i, idx) => (
                      <IssueItem key={idx} text={i} />
                    ))}
                    {!report.content.issues.length && <IssueItem text="Content quality checks passed!" type="ok" />}
                    <div style={{ marginTop: 12 }}>
                      <IssueItem
                        text={`Word count: ${report.content.wordCount}. Aim for 600+ words for competitive pages.`}
                        type={report.content.wordCount >= 600 ? 'ok' : report.content.wordCount >= 300 ? 'warn' : 'error'}
                      />
                      <IssueItem
                        text={`Readability: ${report.content.readabilityGrade} — ${report.content.readabilityScore >= 60 ? 'Good readability' : 'Consider simpler sentences'}`}
                        type={report.content.readabilityScore >= 60 ? 'ok' : 'warn'}
                      />
                      <IssueItem
                        text={`Backlinks data: ${report.backlinks.externalLinksOut} outbound links, ${report.backlinks.nofollowRatio}% nofollow — ${report.backlinks.note}`}
                        type="warn"
                      />
                    </div>
                  </Card>
                </div>
              )}

              {tab === 'amp' && report.amp && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div
                    style={{
                      background: report.amp.hasAmp ? 'rgba(0,245,160,0.04)' : 'rgba(255,183,0,0.04)',
                      border: `1px solid ${report.amp.hasAmp ? 'rgba(0,245,160,0.2)' : 'rgba(255,183,0,0.2)'}`,
                      borderRadius: 10,
                      padding: '20px 24px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 24,
                    }}
                  >
                    <div style={{ fontSize: '2.5rem' }}>{report.amp.hasAmp ? '⚡' : '○'}</div>
                    <div>
                      <div style={{ fontFamily: 'Barlow', fontWeight: 800, fontSize: '1.3rem', color: report.amp.hasAmp ? '#00f5a0' : '#ffb700', marginBottom: 4 }}>
                        {report.amp.isAmpPage ? 'This IS an AMP Page' : report.amp.hasAmp ? 'AMP Version Detected' : 'No AMP Version Found'}
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#5a7a96' }}>
                        {report.amp.ampUrl ? `AMP URL: ${report.amp.ampUrl}` : 'No amphtml link found on this page'}
                      </div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#5a7a96', marginTop: 6 }}>
                        Canonical→AMP: {derivedCanonicalToAmp(report) ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginLeft: 'auto' }}>
                      {[
                        { score: report.amp.validation.score, label: 'Validation' },
                        { score: report.amp.technical.score, label: 'Technical' },
                        { score: report.amp.content.score, label: 'Content' },
                        { score: report.amp.performance.score, label: 'Performance' },
                      ].map((s) => (
                        <Ring key={s.label} score={s.score} label={s.label} size={68} />
                      ))}
                    </div>
                  </div>

                  {!report.amp.hasAmp && (
                    <Card title="AMP Recommendations" accent="#ffb700">
                      {report.amp.recommendations.map((r, i) => (
                        <IssueItem key={i} text={r} type="warn" />
                      ))}
                      <div style={{ marginTop: 16, padding: 14, background: '#080e1a', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#5a7a96', lineHeight: 1.8 }}>
                        <div style={{ color: '#00d4ff', marginBottom: 8, fontWeight: 600 }}>Quick Start — Add AMP to your page:</div>
                        {'1. Create /amp/ version of each page\n2. Add ⚡ attribute to <html amp lang="en">\n3. Include AMP boilerplate + runtime script\n4. Add <link rel="canonical"> pointing to original\n5. On original page add <link rel="amphtml" href="/amp/">'
                          .split('\n')
                          .map((line, i2) => (
                            <div key={i2} style={{ padding: '3px 0' }}>
                              {line}
                            </div>
                          ))}
                      </div>
                    </Card>
                  )}

                  {report.amp.hasAmp && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        <Card title="AMP Validation Checks" score={report.amp.validation.score}>
                          {report.amp.validation.issues.map((i, idx) => (
                            <IssueItem key={idx} text={i} type={i.toLowerCase().includes('missing') ? 'error' : 'warn'} />
                          ))}
                          {!report.amp.validation.issues.length && <IssueItem text="AMP validation passed all checks!" type="ok" />}
                          <div style={{ marginTop: 12 }}>
                            <Check label="⚡ HTML attribute" value={report.amp.validation.hasAmpHtmlAttribute} pass={report.amp.validation.hasAmpHtmlAttribute} />
                            <Check label="charset=utf-8" value={report.amp.validation.hasCharsetUtf8} pass={report.amp.validation.hasCharsetUtf8} />
                            <Check label="Viewport meta" value={report.amp.validation.hasViewport} pass={report.amp.validation.hasViewport} />
                            <Check label="AMP Boilerplate CSS" value={report.amp.validation.hasAmpBoilerplate} pass={report.amp.validation.hasAmpBoilerplate} />
                            <Check label="AMP Runtime JS" value={report.amp.validation.hasAmpRuntime} pass={report.amp.validation.hasAmpRuntime} />
                            <Check label="Canonical link" value={report.amp.validation.hasCanonicalLink} pass={report.amp.validation.hasCanonicalLink} />
                            <Check label="No custom JS" value={report.amp.validation.noCustomJs} pass={report.amp.validation.noCustomJs} />
                            <Check label="No inline styles" value={report.amp.validation.noInlineStyles} pass={report.amp.validation.noInlineStyles} />
                            <Check label="Uses <amp-img>" value={report.amp.validation.usesAmpImg} pass={report.amp.validation.usesAmpImg} />
                            <Check label="Uses <amp-video>" value={report.amp.validation.usesAmpVideo} pass={report.amp.validation.usesAmpVideo} />
                            <Check label="No <form> (use amp-form)" value={report.amp.validation.noFormElements} pass={report.amp.validation.noFormElements} />
                          </div>
                        </Card>

                        <Card title="AMP Technical SEO" score={report.amp.technical.score}>
                          {report.amp.technical.issues.map((i, idx) => (
                            <IssueItem key={idx} text={i} type={i.toLowerCase().includes('noindex') || i.toLowerCase().includes('missing') ? 'error' : 'warn'} />
                          ))}
                          {!report.amp.technical.issues.length && <IssueItem text="AMP technical checks passed!" type="ok" />}
                          <div style={{ marginTop: 12 }}>
                            <Check label="Indexable" value={report.amp.technical.isIndexable} pass={report.amp.technical.isIndexable} />
                            <Check label="Canonical set" value={report.amp.technical.canonicalUrl} pass={!!report.amp.technical.canonicalUrl} />
                            <Check label="Points to non-AMP" value={report.amp.technical.canonicalPointsToNonAmp} pass={report.amp.technical.canonicalPointsToNonAmp} />
                            <Check label="Self-canonical" value={!report.amp.technical.selfCanonical ? 'No (correct)' : 'Yes (wrong!)'} pass={!report.amp.technical.selfCanonical} />
                            <Check
                              label="Structured data"
                              value={report.amp.technical.structuredData.found ? report.amp.technical.structuredData.types.join(', ') : 'None'}
                              pass={report.amp.technical.structuredData.found}
                            />
                            <Check label="Hreflang tags" value={report.amp.technical.hreflang.length > 0 ? report.amp.technical.hreflang.join(', ') : 'None'} pass={true} />
                            <Check label="Robots meta" value={report.amp.technical.robotsMeta || 'Not set (default: index)'} pass={true} />
                            <Check label="AMP Runtime src" value={report.amp.technical.ampRuntimeSrc} pass={!!report.amp.technical.ampRuntimeSrc} />
                          </div>
                        </Card>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        <Card title="AMP Components Used">
                          {report.amp.technical.ampComponents.length === 0 && report.amp.technical.ampExtensions.length === 0 ? (
                            <IssueItem text="No AMP components detected" type="warn" />
                          ) : (
                            <>
                              {report.amp.technical.ampComponents.length > 0 && (
                                <div style={{ marginBottom: 12 }}>
                                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                    In-page Components
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {report.amp.technical.ampComponents.map((c, i) => (
                                      <span
                                        key={i}
                                        style={{
                                          fontFamily: 'IBM Plex Mono',
                                          fontSize: '0.65rem',
                                          color: '#00d4ff',
                                          background: 'rgba(0,212,255,0.08)',
                                          border: '1px solid rgba(0,212,255,0.2)',
                                          padding: '2px 8px',
                                          borderRadius: 3,
                                        }}
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {report.amp.technical.ampExtensions.length > 0 && (
                                <div>
                                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                    Extension Scripts
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {report.amp.technical.ampExtensions.map((e, i) => (
                                      <span
                                        key={i}
                                        style={{
                                          fontFamily: 'IBM Plex Mono',
                                          fontSize: '0.65rem',
                                          color: '#00f5a0',
                                          background: 'rgba(0,245,160,0.08)',
                                          border: '1px solid rgba(0,245,160,0.2)',
                                          padding: '2px 8px',
                                          borderRadius: 3,
                                        }}
                                      >
                                        {e}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </Card>

                        <Card title="AMP Content & Media" score={report.amp.content.score}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            <StatBox label="Words" value={report.amp.content.wordCount.toLocaleString()} />
                            <StatBox label="amp-img" value={report.amp.content.ampImgCount} color="#00f5a0" />
                            <StatBox label="<img> (bad)" value={report.amp.content.regularImgCount} color={report.amp.content.regularImgCount > 0 ? '#ff4060' : '#00f5a0'} />
                            <StatBox label="amp-video" value={report.amp.content.ampVideoCount} color="#00d4ff" />
                            <StatBox label="amp-iframe" value={report.amp.content.ampIframeCount} />
                            <StatBox label="Has Ads" value={report.amp.content.hasAd ? 'Yes' : 'No'} color={report.amp.content.hasAd ? '#ffb700' : '#5a7a96'} />
                          </div>

                          {report.amp.content.hasSocialEmbed && (
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                                Social Embeds
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {report.amp.content.socialEmbedComponents.map((s, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontFamily: 'IBM Plex Mono',
                                      fontSize: '0.65rem',
                                      color: '#ffb700',
                                      background: 'rgba(255,183,0,0.08)',
                                      border: '1px solid rgba(255,183,0,0.2)',
                                      padding: '2px 8px',
                                      borderRadius: 3,
                                    }}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {report.amp.content.issues.map((i, idx) => (
                            <IssueItem key={idx} text={i} />
                          ))}
                          {!report.amp.content.issues.length && <IssueItem text="AMP content is properly structured!" type="ok" />}
                        </Card>
                      </div>

                      <Card title="AMP Performance Analysis" score={report.amp.performance.score}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                          <StatBox
                            label="Custom CSS"
                            value={`${report.amp.performance.customCssKb}KB`}
                            color={report.amp.performance.customCssKb > 50 ? '#ff4060' : report.amp.performance.customCssKb > 30 ? '#ffb700' : '#00f5a0'}
                          />
                          <StatBox label="Total Scripts" value={report.amp.performance.scriptTagsCount} />
                          <StatBox label="Allowed Scripts" value={report.amp.performance.allowedScriptCount} color="#00f5a0" />
                          <StatBox
                            label="Blocked Scripts"
                            value={report.amp.performance.externalScriptsBlocked}
                            color={report.amp.performance.externalScriptsBlocked > 0 ? '#ff4060' : '#00f5a0'}
                          />
                          <StatBox label="Inline Styles" value={report.amp.performance.inlineStylesCount} color={report.amp.performance.inlineStylesCount > 0 ? '#ffb700' : '#00f5a0'} />
                          <StatBox label="Critical Path" value={report.amp.performance.criticalPathOptimized ? '✓ OK' : '✗ Fix'} color={report.amp.performance.criticalPathOptimized ? '#00f5a0' : '#ff4060'} />
                        </div>

                        {report.amp.performance.issues.map((i, idx) => (
                          <IssueItem key={idx} text={i} />
                        ))}
                        {!report.amp.performance.issues.length && <IssueItem text="AMP performance optimizations look good!" type="ok" />}

                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                            CSS Budget ({report.amp.performance.customCssKb}KB / 75KB limit)
                          </div>
                          <div style={{ height: 6, background: '#162035', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 3,
                                transition: 'width 1s ease',
                                width: `${Math.min(100, (report.amp.performance.customCssKb / 75) * 100)}%`,
                                background: report.amp.performance.customCssKb > 50 ? '#ff4060' : report.amp.performance.customCssKb > 30 ? '#ffb700' : '#00f5a0',
                              }}
                            />
                          </div>
                        </div>
                      </Card>

                      {report.amp.comparison ? (
                        <Card title="⚡ AMP vs Canonical — Content Parity" accent="#00d4ff">
                          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                            <div style={{ flex: 1, background: '#080e1a', borderRadius: 6, padding: 14 }}>
                              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                Content Parity
                              </div>
                              <div style={{ fontFamily: 'Barlow', fontWeight: 800, fontSize: '2rem', color: scoreColor(report.amp.comparison.contentParity) }}>
                                {report.amp.comparison.contentParity}%
                              </div>
                              <div style={{ height: 4, background: '#162035', borderRadius: 2, marginTop: 8 }}>
                                <div
                                  style={{
                                    height: '100%',
                                    borderRadius: 2,
                                    width: `${report.amp.comparison.contentParity}%`,
                                    background: scoreColor(report.amp.comparison.contentParity),
                                    transition: 'width 1s ease',
                                  }}
                                />
                              </div>
                            </div>
                            <div style={{ flex: 1, background: '#080e1a', borderRadius: 6, padding: 14 }}>
                              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                SEO Equivalence
                              </div>
                              <div style={{ fontFamily: 'Barlow', fontWeight: 800, fontSize: '2rem', color: scoreColor(report.amp.comparison.seoEquivalence) }}>
                                {report.amp.comparison.seoEquivalence}%
                              </div>
                              <div style={{ height: 4, background: '#162035', borderRadius: 2, marginTop: 8 }}>
                                <div
                                  style={{
                                    height: '100%',
                                    borderRadius: 2,
                                    width: `${report.amp.comparison.seoEquivalence}%`,
                                    background: scoreColor(report.amp.comparison.seoEquivalence),
                                    transition: 'width 1s ease',
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 16 }}>
                            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#00d4ff', fontWeight: 600, textAlign: 'right', textTransform: 'uppercase' }}>
                              CANONICAL
                            </div>
                            <div />
                            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#ffb700', fontWeight: 600, textTransform: 'uppercase' }}>
                              AMP
                            </div>
                          </div>

                          {[
                            { field: 'Title', a: report.amp.comparison.canonical.title, b: report.amp.comparison.amp.title },
                            { field: 'Word Count', a: report.amp.comparison.canonical.wordCount, b: report.amp.comparison.amp.wordCount },
                            { field: 'H1', a: report.amp.comparison.canonical.h1, b: report.amp.comparison.amp.h1 },
                            { field: 'Images', a: report.amp.comparison.canonical.imgCount, b: report.amp.comparison.amp.imgCount },
                            { field: 'Internal Links', a: report.amp.comparison.canonical.internalLinks, b: report.amp.comparison.amp.internalLinks },
                            { field: 'Structured Data', a: report.amp.comparison.canonical.structuredData, b: report.amp.comparison.amp.structuredData },
                          ].map((row, i) => (
                            <CompareRow key={i} label={row.field} a={row.a} b={row.b} />
                          ))}

                          {report.amp.comparison.differences.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#2a4560', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                Detected Differences
                              </div>
                              {report.amp.comparison.differences.map((diff, i) => (
                                <IssueItem
                                  key={i}
                                  text={`[${diff.field}] ${diff.message}`}
                                  type={diff.severity === 'critical' ? 'error' : diff.severity === 'warning' ? 'warn' : 'warn'}
                                />
                              ))}
                            </div>
                          )}

                          {report.amp.comparison.differences.length === 0 && (
                            <IssueItem text="AMP and canonical pages are in perfect parity — no differences detected!" type="ok" />
                          )}
                        </Card>
                      ) : report.amp.hasAmp ? (
                        <Card title="AMP vs Canonical Comparison" accent="#5a7a96">
                          <IssueItem text="Comparison not available — AMP URL is same as canonical URL (this IS the AMP page)" type="warn" />
                        </Card>
                      ) : null}

                      {report.amp.recommendations.length > 0 && (
                        <Card title="AMP Recommendations" accent="#00d4ff">
                          {report.amp.recommendations.map((r, i) => (
                            <IssueItem key={i} text={r} type="warn" />
                          ))}
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}

              {tab === 'competitor' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <Card title="Competitor Comparison">
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: '#5a7a96', marginBottom: 12 }}>
                      Enter a competitor URL to compare key SEO metrics side by side.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={compUrl}
                        onChange={(e) => setCompUrl(e.target.value)}
                        placeholder="https://competitor.com"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          background: '#080e1a',
                          border: '1px solid #1e2f4a',
                          borderRadius: 5,
                          color: '#cdd8e8',
                          fontFamily: 'IBM Plex Mono',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#00d4ff';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#1e2f4a';
                        }}
                      />
                      <button
                        onClick={compareCompetitor}
                        disabled={compLoading || !compUrl.trim()}
                        style={{
                          padding: '10px 18px',
                          background: '#00d4ff',
                          color: '#04080f',
                          border: 'none',
                          borderRadius: 5,
                          fontFamily: 'Barlow',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          opacity: compLoading ? 0.6 : 1,
                        }}
                      >
                        {compLoading ? 'Comparing…' : 'Compare'}
                      </button>
                    </div>
                  </Card>

                  {compData && (
                    <Card title="Head-to-Head Comparison">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 12 }}>
                        <div style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#00d4ff', fontWeight: 600 }}>
                          YOUR SITE
                        </div>
                        <div></div>
                        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#ffb700', fontWeight: 600 }}>COMPETITOR</div>
                      </div>
                      <CompareRow label="Word Count" a={compData.main.wordCount} b={compData.competitor.wordCount} />
                      <CompareRow label="Images" a={compData.main.imgCount} b={compData.competitor.imgCount} />
                      <CompareRow label="Internal Links" a={compData.main.internalLinks} b={compData.competitor.internalLinks} />
                      <CompareRow label="H1 Count" a={compData.main.h1Count} b={compData.competitor.h1Count} />
                      <CompareRow label="H2 Count" a={compData.main.h2Count} b={compData.competitor.h2Count} />
                      <CompareRow label="Structured Data" a={compData.main.hasStructuredData} b={compData.competitor.hasStructuredData} />
                      <CompareRow label="Open Graph Tags" a={compData.main.hasOg} b={compData.competitor.hasOg} />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                        <div>
                          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                            Your Top Keywords
                          </div>
                          {compData.main.topKeywords.map((kw: any, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #162035' }}>
                              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: '#cdd8e8', flex: 1 }}>{kw.word}</span>
                              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#5a7a96' }}>{kw.count}x</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', color: '#ffb700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                            Competitor Top Keywords
                          </div>
                          {compData.competitor.topKeywords.map((kw: any, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #162035' }}>
                              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: '#cdd8e8', flex: 1 }}>{kw.word}</span>
                              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#5a7a96' }}>{kw.count}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!report && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#2a4560' }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '3rem', marginBottom: 12, opacity: 0.3 }}>◈</div>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', letterSpacing: '0.1em' }}>ENTER A URL ABOVE TO BEGIN ANALYSIS</p>
          </div>
        )}

        <footer style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #162035', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#2a4560' }}>DEEPSEO</span>
          <span style={{ color: '#162035' }}>·</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#2a4560' }}>Next.js + Vercel</span>
          <span style={{ color: '#162035' }}>·</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: '#2a4560' }}>Free & Open Source</span>
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
