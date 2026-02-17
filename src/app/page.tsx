'use client';

import React, { useMemo, useState } from 'react';
import type { SEOReport } from '@/lib/types';

type TabKey =
  | 'overview'
  | 'onPage'
  | 'technical'
  | 'crawl'
  | 'security'
  | 'social'
  | 'content'
  | 'rendering'
  | 'amp'
  | 'intelligence'
  | 'performance';

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

function scoreTone(score: number) {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-lime-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-rose-600';
}

function badgeTone(score: number) {
  if (score >= 85) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (score >= 70) return 'bg-lime-50 text-lime-700 ring-lime-200';
  if (score >= 55) return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-rose-50 text-rose-700 ring-rose-200';
}

function riskTone(risk: string) {
  if (risk === 'low') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (risk === 'medium') return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-rose-50 text-rose-700 ring-rose-200';
}

function Card(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-semibold text-slate-800">{props.title}</div>
        {props.right}
      </div>
      <div className="px-4 py-3">{props.children}</div>
    </div>
  );
}

function Pill(props: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        props.className
      )}
    >
      {props.children}
    </span>
  );
}

function Stat(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-medium text-slate-600">{props.label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{props.value}</div>
    </div>
  );
}

function IssuesList(props: { issues?: string[] }) {
  const issues = props.issues || [];
  if (!issues.length) return <div className="text-sm text-slate-600">No issues found.</div>;
  return (
    <ul className="space-y-2">
      {issues.map((i, idx) => (
        <li key={idx} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {i}
        </li>
      ))}
    </ul>
  );
}

function SectionHeader(props: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <div className="text-lg font-semibold text-slate-900">{props.title}</div>
        {props.subtitle ? <div className="mt-0.5 text-sm text-slate-600">{props.subtitle}</div> : null}
      </div>
      {props.right}
    </div>
  );
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export default function Page() {
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SEOReport | null>(null);

  const tabs = useMemo(
    () =>
      [
        { k: 'overview', label: 'Overview' },
        { k: 'onPage', label: 'On-Page' },
        { k: 'technical', label: 'Technical' },
        { k: 'crawl', label: 'Crawl' },
        { k: 'security', label: 'Security' },
        { k: 'social', label: 'Social' },
        { k: 'content', label: 'Content' },
        { k: 'rendering', label: 'Rendering' },
        { k: 'amp', label: 'AMP' },
        { k: 'intelligence', label: 'Intelligence' },
        { k: 'performance', label: 'Performance' },
      ] as Array<{ k: TabKey; label: string }>,
    []
  );

  async function runAnalysis(e?: React.FormEvent) {
    e?.preventDefault();
    const u = url.trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postJSON<SEOReport>('/api/analyze', { url: u });
      setReport(data);
      setActiveTab('overview');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Analysis failed');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function runPerformance() {
    if (!report?.url) return;
    setLoading(true);
    setError(null);
    try {
      const perf = await postJSON<any>('/api/pagespeed', { url: report.url });
      setReport((prev) => (prev ? { ...prev, performance: perf } : prev));
      setActiveTab('performance');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Performance check failed');
    } finally {
      setLoading(false);
    }
  }

  const headerScore = report?.overallScore ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900">Deep SEO Analyzer</div>
                <div className="mt-1 text-sm text-slate-600">Run a deep on-page + technical + intelligence scan.</div>
              </div>
              {headerScore !== null ? (
                <div className="flex items-center gap-3">
                  <Pill className={cx('ring-1', badgeTone(headerScore))}>
                    Overall {headerScore}/100
                  </Pill>
                  <div className={cx('text-2xl font-extrabold', scoreTone(headerScore))}>{report?.grade}</div>
                </div>
              ) : null}
            </div>

            <form onSubmit={runAnalysis} className="mt-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL (e.g. https://example.com)"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={cx(
                    'rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-inset',
                    loading
                      ? 'cursor-not-allowed bg-slate-100 text-slate-500 ring-slate-200'
                      : 'bg-slate-900 text-white ring-slate-900 hover:bg-slate-800'
                  )}
                >
                  {loading ? 'Running…' : 'Analyze'}
                </button>
                <button
                  type="button"
                  disabled={loading || !report?.url}
                  onClick={runPerformance}
                  className={cx(
                    'rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-inset',
                    loading || !report?.url
                      ? 'cursor-not-allowed bg-slate-100 text-slate-500 ring-slate-200'
                      : 'bg-white text-slate-900 ring-slate-200 hover:bg-slate-50'
                  )}
                >
                  Run PageSpeed
                </button>
              </div>
            </form>

            {error ? (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}
          </div>

          {report ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 py-2">
                  {tabs.map((t) => (
                    <button
                      key={t.k}
                      onClick={() => setActiveTab(t.k)}
                      className={cx(
                        'rounded-xl px-3 py-2 text-sm font-semibold',
                        activeTab === t.k ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {activeTab === 'overview' ? (
                    <div className="space-y-4">
                      <SectionHeader
                        title="Snapshot"
                        subtitle={report.url}
                        right={
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill className={cx(badgeTone(report.onPage.score))}>On-Page {report.onPage.score}</Pill>
                            <Pill className={cx(badgeTone(report.technical.score))}>Technical {report.technical.score}</Pill>
                            <Pill className={cx(badgeTone(report.crawl.score))}>Crawl {report.crawl.score}</Pill>
                            <Pill className={cx(badgeTone(report.security.score))}>Security {report.security.score}</Pill>
                            <Pill className={cx(badgeTone(report.content.score))}>Content {report.content.score}</Pill>
                            <Pill className={cx(badgeTone(report.social.score))}>Social {report.social.score}</Pill>
                            <Pill className={cx(badgeTone(report.rendering.score))}>Rendering {report.rendering.score}</Pill>
                            <Pill className={cx(badgeTone(report.amp.score))}>AMP {report.amp.score}</Pill>
                            {report.intelligence ? (
                              <Pill className={cx(badgeTone(report.intelligence.score))}>
                                Intelligence {report.intelligence.score}
                              </Pill>
                            ) : null}
                          </div>
                        }
                      />

                      <div className="grid gap-4 md:grid-cols-3">
                        <Card title="Top priorities">
                          <div className="space-y-2 text-sm text-slate-700">
                            {(report.onPage.title.issues || []).slice(0, 2).map((x, i) => (
                              <div key={i} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                {x}
                              </div>
                            ))}
                            {(report.technical.issues || []).slice(0, 2).map((x, i) => (
                              <div key={`t-${i}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                {x}
                              </div>
                            ))}
                            {(report.crawl.issues || []).slice(0, 1).map((x, i) => (
                              <div key={`c-${i}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                {x}
                              </div>
                            ))}
                            {!report.onPage.title.issues?.length &&
                            !report.technical.issues?.length &&
                            !report.crawl.issues?.length ? (
                              <div className="text-sm text-slate-600">No major issues detected.</div>
                            ) : null}
                          </div>
                        </Card>

                        <Card title="Core metadata">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-semibold text-slate-600">Title</div>
                              <div className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                                {report.onPage.title.content || '(missing)'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-600">Meta description</div>
                              <div className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                                {report.onPage.metaDescription.content || '(missing)'}
                              </div>
                            </div>
                          </div>
                        </Card>

                        <Card title="Quick stats">
                          <div className="grid grid-cols-2 gap-3">
                            <Stat label="Words" value={report.content.wordCount} />
                            <Stat label="Paragraphs" value={report.content.paragraphCount} />
                            <Stat label="Internal links" value={report.onPage.links.internal} />
                            <Stat label="External links" value={report.onPage.links.external} />
                            <Stat label="Images" value={report.onPage.images.total} />
                            <Stat label="Missing alt" value={report.onPage.images.withoutAlt} />
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'onPage' ? (
                    <div className="space-y-4">
                      <SectionHeader title="On-Page SEO" subtitle="Titles, meta description, headings, images, keywords, links" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card
                          title="Title"
                          right={<Pill className={badgeTone(report.onPage.title.score)}>Score {report.onPage.title.score}</Pill>}
                        >
                          <div className="space-y-3">
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                              {report.onPage.title.content || '(missing)'}
                            </div>
                            <div className="text-sm text-slate-600">Length: {report.onPage.title.length}</div>
                            <IssuesList issues={report.onPage.title.issues} />
                          </div>
                        </Card>

                        <Card
                          title="Meta description"
                          right={
                            <Pill className={badgeTone(report.onPage.metaDescription.score)}>
                              Score {report.onPage.metaDescription.score}
                            </Pill>
                          }
                        >
                          <div className="space-y-3">
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                              {report.onPage.metaDescription.content || '(missing)'}
                            </div>
                            <div className="text-sm text-slate-600">Length: {report.onPage.metaDescription.length}</div>
                            <IssuesList issues={report.onPage.metaDescription.issues} />
                          </div>
                        </Card>

                        <Card
                          title="Headings"
                          right={<Pill className={badgeTone(report.onPage.headings.score)}>Score {report.onPage.headings.score}</Pill>}
                        >
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Stat label="H1" value={report.onPage.headings.h1.length} />
                              <Stat label="H2" value={report.onPage.headings.h2.length} />
                              <Stat label="H3" value={report.onPage.headings.h3.length} />
                              <Stat label="H4" value={report.onPage.headings.h4.length} />
                            </div>
                            <IssuesList issues={report.onPage.headings.issues} />
                          </div>
                        </Card>

                        <Card
                          title="Images"
                          right={<Pill className={badgeTone(report.onPage.images.score)}>Score {report.onPage.images.score}</Pill>}
                        >
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Stat label="Total" value={report.onPage.images.total} />
                              <Stat label="With alt" value={report.onPage.images.withAlt} />
                              <Stat label="Missing alt" value={report.onPage.images.withoutAlt} />
                              <Stat label="Oversized" value={report.onPage.images.largeImages} />
                            </div>
                            <IssuesList issues={report.onPage.images.issues} />
                          </div>
                        </Card>
                      </div>

                      <Card title="Top keywords">
                        {report.onPage.keywords.topKeywords?.length ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-xs text-slate-600">
                                  <th className="py-2 pr-3">Keyword</th>
                                  <th className="py-2 pr-3">Count</th>
                                  <th className="py-2 pr-3">Density</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.onPage.keywords.topKeywords.slice(0, 15).map((k) => (
                                  <tr key={k.word} className="border-t border-slate-100">
                                    <td className="py-2 pr-3 font-medium text-slate-900">{k.word}</td>
                                    <td className="py-2 pr-3 text-slate-700">{k.count}</td>
                                    <td className="py-2 pr-3 text-slate-700">{k.density}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-600">No keywords extracted.</div>
                        )}
                      </Card>
                    </div>
                  ) : null}

                  {activeTab === 'technical' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Technical SEO" subtitle="Canonicals, robots, schema, hreflang, robots.txt" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Core tags" right={<Pill className={badgeTone(report.technical.score)}>Score {report.technical.score}</Pill>}>
                          <div className="grid grid-cols-2 gap-3">
                            <Stat label="Canonical" value={report.technical.canonical ? 'Yes' : 'No'} />
                            <Stat label="Robots meta" value={report.technical.robots ? 'Yes' : 'No'} />
                            <Stat label="Viewport" value={report.technical.viewport ? 'Yes' : 'No'} />
                            <Stat label="Lang" value={report.technical.lang ? report.technical.lang : 'Missing'} />
                          </div>
                          <div className="mt-3">
                            <IssuesList issues={report.technical.issues} />
                          </div>
                        </Card>

                        <Card title="Structured data">
                          <div className="space-y-2 text-sm text-slate-700">
                            <div>
                              Found:{' '}
                              <span className="font-semibold text-slate-900">
                                {report.technical.structuredData.found ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="text-sm text-slate-700">
                              Types:{' '}
                              <span className="font-semibold text-slate-900">
                                {report.technical.structuredData.types?.length
                                  ? report.technical.structuredData.types.join(', ')
                                  : '—'}
                              </span>
                            </div>
                            <div>
                              Hreflang:{' '}
                              <span className="font-semibold text-slate-900">
                                {report.technical.hreflang?.length ? report.technical.hreflang.join(', ') : '—'}
                              </span>
                            </div>
                            <div>
                              robots.txt:{' '}
                              <span className="font-semibold text-slate-900">
                                {report.technical.robotsTxt.accessible ? 'Accessible' : 'Not found'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'crawl' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Crawl & Indexing" subtitle="Indexability, canonicals, internal links" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Signals" right={<Pill className={badgeTone(report.crawl.score)}>Score {report.crawl.score}</Pill>}>
                          <div className="grid grid-cols-2 gap-3">
                            <Stat label="Indexable" value={report.crawl.indexable ? 'Yes' : 'No'} />
                            <Stat label="Noindex" value={report.crawl.robotsBlocked ? 'Yes' : 'No'} />
                            <Stat label="Nofollow page" value={report.crawl.nofollowPage ? 'Yes' : 'No'} />
                            <Stat label="Canonical OK" value={report.crawl.canonicalCorrect ? 'Yes' : 'No'} />
                            <Stat label="Pagination tags" value={report.crawl.paginationTags ? 'Yes' : 'No'} />
                            <Stat label="AMP version" value={report.crawl.ampVersion ? 'Yes' : 'No'} />
                          </div>
                          <div className="mt-3">
                            <IssuesList issues={report.crawl.issues} />
                          </div>
                        </Card>

                        <Card title="Internal links sample">
                          {report.crawl.internalLinks?.length ? (
                            <div className="space-y-2">
                              {report.crawl.internalLinks.slice(0, 12).map((l, idx) => (
                                <div key={idx} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <div className="text-sm font-semibold text-slate-900">{l.text || '—'}</div>
                                  <div className="mt-0.5 break-all text-xs text-slate-600">{l.href}</div>
                                  {l.rel ? <div className="mt-1 text-xs text-slate-500">rel: {l.rel}</div> : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-600">No internal links captured.</div>
                          )}
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'security' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Security & Trust" subtitle="HTTPS + security headers + mixed content" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Signals" right={<Pill className={badgeTone(report.security.score)}>Score {report.security.score}</Pill>}>
                          <div className="grid grid-cols-2 gap-3">
                            <Stat label="HTTPS" value={report.security.https ? 'Yes' : 'No'} />
                            <Stat label="HSTS" value={report.security.hsts ? 'Yes' : 'No'} />
                            <Stat label="CSP" value={report.security.csp ? 'Yes' : 'No'} />
                            <Stat label="X-Frame-Options" value={report.security.xFrameOptions ? 'Yes' : 'No'} />
                            <Stat label="Mixed content" value={report.security.mixedContent ? 'Yes' : 'No'} />
                          </div>
                          <div className="mt-3">
                            <IssuesList issues={report.security.issues} />
                          </div>
                        </Card>

                        <Card title="Headers">
                          <div className="space-y-2 text-sm text-slate-700">
                            {Object.entries(report.security.safeHeaders || {}).map(([k, v]) => (
                              <div key={k} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                <div className="font-semibold text-slate-900">{k}</div>
                                <div className="max-w-[60%] break-all text-xs text-slate-600">{v || '—'}</div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'social' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Social Preview" subtitle="Open Graph + Twitter Cards" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Open Graph" right={<Pill className={badgeTone(report.social.score)}>Score {report.social.score}</Pill>}>
                          <div className="space-y-2 text-sm text-slate-700">
                            <div>
                              <span className="font-semibold text-slate-900">og:title</span>: {report.social.ogTitle || '—'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">og:description</span>: {report.social.ogDescription || '—'}
                            </div>
                            <div className="break-all">
                              <span className="font-semibold text-slate-900">og:image</span>: {report.social.ogImage || '—'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">og:type</span>: {report.social.ogType || '—'}
                            </div>
                            <div className="mt-3">
                              <IssuesList issues={report.social.issues} />
                            </div>
                          </div>
                        </Card>

                        <Card title="Twitter">
                          <div className="space-y-2 text-sm text-slate-700">
                            <div>
                              <span className="font-semibold text-slate-900">twitter:card</span>: {report.social.twitterCard || '—'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">twitter:title</span>: {report.social.twitterTitle || '—'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">twitter:description</span>: {report.social.twitterDescription || '—'}
                            </div>
                            <div className="break-all">
                              <span className="font-semibold text-slate-900">twitter:image</span>: {report.social.twitterImage || '—'}
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'content' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Content Quality" subtitle="Word count, readability, structure" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Metrics" right={<Pill className={badgeTone(report.content.score)}>Score {report.content.score}</Pill>}>
                          <div className="grid grid-cols-2 gap-3">
                            <Stat label="Word count" value={report.content.wordCount} />
                            <Stat label="Paragraphs" value={report.content.paragraphCount} />
                            <Stat label="Readability" value={`${report.content.readabilityScore}/100`} />
                            <Stat label="Grade" value={report.content.readabilityGrade} />
                            <Stat label="Avg sentence" value={report.content.avgSentenceLength} />
                            <Stat label="Text-to-code" value={`${report.content.contentToCodeRatio}%`} />
                          </div>
                          <div className="mt-3">
                            <IssuesList issues={report.content.issues} />
                          </div>
                        </Card>

                        <Card title="Notes">
                          <div className="text-sm text-slate-700">
                            Duplicate content detection is heuristic in this scan.
                            <div className="mt-2 text-sm text-slate-600">
                              For topic competitiveness, use competitor gap analysis in the competitor route.
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'rendering' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Rendering & Frontend" subtitle="Lazy-load, JS render dependency, blocking assets" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Signals" right={<Pill className={badgeTone(report.rendering.score)}>Score {report.rendering.score}</Pill>}>
                          <div className="grid grid-cols-2 gap-3">
                            <Stat label="Lazy-load images" value={report.rendering.lazyLoadImages ? 'Yes' : 'No'} />
                            <Stat label="JS render required" value={report.rendering.jsRenderRequired ? 'Yes' : 'No'} />
                            <Stat label="Iframes" value={report.rendering.iframes} />
                            <Stat label="Blocking CSS" value={report.rendering.cssBlocking} />
                            <Stat label="Blocking JS" value={report.rendering.jsBlocking} />
                            <Stat label="Inline styles" value={report.rendering.inlineStyles} />
                          </div>
                          <div className="mt-3">
                            <IssuesList issues={report.rendering.issues} />
                          </div>
                        </Card>

                        <Card title="Tip">
                          <div className="text-sm text-slate-700">
                            If key content is injected by JS, make sure it’s server-rendered or hydrated with meaningful HTML
                            fallback for crawlers.
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'amp' ? (
                    <div className="space-y-4">
                      <SectionHeader title="AMP" subtitle="AMP presence + validation heuristics" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card title="AMP summary" right={<Pill className={badgeTone(report.amp.score)}>Score {report.amp.score}</Pill>}>
                          <div className="grid grid-cols-2 gap-3">
                            <Stat label="Has AMP" value={report.amp.hasAmp ? 'Yes' : 'No'} />
                            <Stat label="AMP URL" value={report.amp.ampUrl ? 'Yes' : 'No'} />
                            <Stat label="AMP tag" value={report.amp.ampHtmlTag ? 'Yes' : 'No'} />
                           <Stat label="Canonical→AMP" value={report.amp.canonicalToAmp ? 'Yes' : 'No'} />
                          </div>
                          <div className="mt-3">
                            <IssuesList issues={report.amp.issues} />
                          </div>
                        </Card>

                        <Card title="Notes">
                          <div className="text-sm text-slate-700">
                            AMP checks here are heuristic. For strict validation, use the AMP validator as a separate step.
                          </div>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'intelligence' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Intelligence" subtitle="Intent, EEAT signals, entities, link quality, SERP preview risk" />
                      {report.intelligence ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <Card
                              title="Intelligence score"
                              right={<Pill className={badgeTone(report.intelligence.score)}>{report.intelligence.score}/100</Pill>}
                            >
                              <div className="text-sm text-slate-700">
                                A combined score from semantic richness, EEAT signals, internal link quality, and intent clarity.
                              </div>
                            </Card>

                            <Card
                              title="Intent"
                              right={
                                <Pill className={cx('ring-1', riskTone(report.intelligence.intent.mismatchRisk))}>
                                  {report.intelligence.intent.intent} • {report.intelligence.intent.mismatchRisk} risk
                                </Pill>
                              }
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <Stat label="Informational" value={report.intelligence.intent.scores.informational} />
                                <Stat label="Commercial" value={report.intelligence.intent.scores.commercial} />
                                <Stat label="Transactional" value={report.intelligence.intent.scores.transactional} />
                                <Stat label="Navigational" value={report.intelligence.intent.scores.navigational} />
                              </div>
                            </Card>

                            <Card title="EEAT" right={<Pill className={badgeTone(report.intelligence.eeat.score)}>{report.intelligence.eeat.score}/100</Pill>}>
                              <div className="grid grid-cols-2 gap-3">
                                <Stat label="Author meta" value={report.intelligence.eeat.signals.hasAuthorMeta ? 'Yes' : 'No'} />
                                <Stat label="Article schema" value={report.intelligence.eeat.signals.hasArticleSchema ? 'Yes' : 'No'} />
                                <Stat label="Org schema" value={report.intelligence.eeat.signals.hasOrgSchema ? 'Yes' : 'No'} />
                                <Stat label="Policies" value={report.intelligence.eeat.signals.hasPolicy ? 'Yes' : 'No'} />
                              </div>
                            </Card>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <Card
                              title="Entity coverage"
                              right={<Pill className={badgeTone(report.intelligence.entities.coverageScore)}>{report.intelligence.entities.coverageScore}/100</Pill>}
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <Stat label="Unique entities" value={report.intelligence.entities.uniqueCount} />
                                <Stat label="Top entities" value={report.intelligence.entities.topEntities.length} />
                              </div>

                              <div className="mt-3 space-y-2">
                                {report.intelligence.entities.topEntities.slice(0, 10).map((e) => (
                                  <div
                                    key={e.name}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                  >
                                    <div className="font-semibold text-slate-900">{e.name}</div>
                                    <div className="text-slate-700">{e.count}</div>
                                  </div>
                                ))}
                              </div>

                              {report.intelligence.entities.hints?.length ? (
                                <div className="mt-3">
                                  <div className="mb-2 text-xs font-semibold text-slate-600">Hints</div>
                                  <IssuesList issues={report.intelligence.entities.hints} />
                                </div>
                              ) : null}
                            </Card>

                            <Card
                              title="Internal link quality"
                              right={<Pill className={badgeTone(report.intelligence.linkQuality.score)}>{report.intelligence.linkQuality.score}/100</Pill>}
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <Stat label="Total links" value={report.intelligence.linkQuality.totals.total} />
                                <Stat label="Contextual" value={report.intelligence.linkQuality.totals.contextual} />
                                <Stat label="Nav/Footer" value={report.intelligence.linkQuality.totals.navFooter} />
                                <Stat label="Anchor diversity" value={`${report.intelligence.linkQuality.anchorDiversity}%`} />
                                <Stat label="Generic anchors" value={`${report.intelligence.linkQuality.genericAnchorRatio}%`} />
                              </div>

                              <div className="mt-3">
                                <div className="mb-2 text-xs font-semibold text-slate-600">Top anchors</div>
                                <div className="space-y-2">
                                  {report.intelligence.linkQuality.topAnchors.slice(0, 10).map((a) => (
                                    <div
                                      key={a.text}
                                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                    >
                                      <div className="font-semibold text-slate-900">{a.text || '—'}</div>
                                      <div className="text-slate-700">{a.count}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {report.intelligence.linkQuality.hints?.length ? (
                                <div className="mt-3">
                                  <div className="mb-2 text-xs font-semibold text-slate-600">Hints</div>
                                  <IssuesList issues={report.intelligence.linkQuality.hints} />
                                </div>
                              ) : null}
                            </Card>
                          </div>

                          <Card title="SERP preview risk">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold text-slate-900">Title</div>
                                  <Pill className={cx('ring-1', riskTone(report.intelligence.serp.titleTruncationRisk))}>
                                    {report.intelligence.serp.titleTruncationRisk} risk
                                  </Pill>
                                </div>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                  {report.intelligence.serp.title || '(missing)'}
                                </div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {report.intelligence.serp.titlePixels}px / {report.intelligence.serp.titleMaxPixels}px
                                </div>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold text-slate-900">Meta description</div>
                                  <Pill className={cx('ring-1', riskTone(report.intelligence.serp.descriptionTruncationRisk))}>
                                    {report.intelligence.serp.descriptionTruncationRisk} risk
                                  </Pill>
                                </div>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                  {report.intelligence.serp.metaDescription || '(missing)'}
                                </div>
                                <div className="mt-2 text-sm text-slate-600">
                                  {report.intelligence.serp.descriptionPixels}px / {report.intelligence.serp.descriptionMaxPixels}px
                                </div>
                              </div>
                            </div>

                            {report.intelligence.eeat.gaps?.length ? (
                              <div className="mt-4">
                                <div className="mb-2 text-sm font-semibold text-slate-900">EEAT gaps</div>
                                <IssuesList issues={report.intelligence.eeat.gaps} />
                              </div>
                            ) : null}
                          </Card>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-600">Intelligence report not available.</div>
                      )}
                    </div>
                  ) : null}

                  {activeTab === 'performance' ? (
                    <div className="space-y-4">
                      <SectionHeader title="Performance" subtitle="PageSpeed results (run PageSpeed button)" />
                      <Card title="Scores" right={<Pill className={badgeTone(report.performance?.score || 0)}>Score {report.performance?.score || 0}</Pill>}>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          <Stat label="Performance" value={report.performance?.performance ?? 0} />
                          <Stat label="Accessibility" value={report.performance?.accessibility ?? 0} />
                          <Stat label="Best Practices" value={report.performance?.bestPractices ?? 0} />
                          <Stat label="SEO" value={report.performance?.seo ?? 0} />
                          <Stat label="FCP" value={report.performance?.fcp ?? '—'} />
                          <Stat label="LCP" value={report.performance?.lcp ?? '—'} />
                          <Stat label="TBT" value={report.performance?.tbt ?? '—'} />
                          <Stat label="CLS" value={report.performance?.cls ?? '—'} />
                        </div>
                        {report.performance?.error ? (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {report.performance.error}
                          </div>
                        ) : null}
                        {report.performance?.issues?.length ? (
                          <div className="mt-3">
                            <IssuesList issues={report.performance.issues} />
                          </div>
                        ) : null}
                      </Card>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Enter a URL and run an analysis to see detailed results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
