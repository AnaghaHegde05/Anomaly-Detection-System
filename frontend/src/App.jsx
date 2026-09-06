import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts'
import {
  Activity, ShieldAlert, CheckCircle, Globe, Link,
  Loader2, Database, Clock, TrendingUp, Plus, X, Zap
} from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────
const statusColor = (code) => {
  if (!code) return 'var(--text-muted)'
  if (code < 300) return 'var(--success)'
  if (code < 400) return '#f59e0b'
  return 'var(--danger)'
}

const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ec4899',
  '#14b8a6', '#a855f7', '#f97316', '#0ea5e9',
  '#84cc16', '#ef4444'
]

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [urls, setUrls]           = useState([''])
  const [loading, setLoading]     = useState(false)
  const [results, setResults]     = useState([])   // bulk result array
  const [anomalies, setAnomalies] = useState([])
  const [history, setHistory]     = useState([])   // chart trend data
  const [error, setError]         = useState(null)
  const [serverStats, setServerStats] = useState(null)
  const [activeTab, setActiveTab] = useState('table') // 'table' | 'charts' | 'detail'
  const [detailIdx, setDetailIdx] = useState(null)

  // ── data fetchers ──────────────────────────────────────────────────────────
  const fetchAnomalies = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/anomalies')
      if (res.ok) setAnomalies((await res.json()).reverse())
    } catch (_) {}
  }

  const fetchServerStats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/server-stats')
      if (res.ok) setServerStats(await res.json())
    } catch (_) {}
  }

  useEffect(() => {
    fetchAnomalies()
    fetchServerStats()
    const iv = setInterval(fetchServerStats, 5000)
    return () => clearInterval(iv)
  }, [])

  // ── URL list management ────────────────────────────────────────────────────
  const addUrl    = () => setUrls(prev => [...prev, ''])
  const removeUrl = (i) => setUrls(prev => prev.filter((_, idx) => idx !== i))
  const updateUrl = (i, val) => setUrls(prev => prev.map((u, idx) => idx === i ? val : u))

  const handlePaste = (i, e) => {
    const pasted = e.clipboardData.getData('text')
    const lines = pasted.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    if (lines.length > 1) {
      e.preventDefault()
      setUrls(prev => {
        const updated = [...prev]
        updated.splice(i, 1, ...lines)
        return updated.slice(0, 10)
      })
    }
  }

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleMonitor = async (e) => {
    e.preventDefault()
    const validUrls = urls.map(u => u.trim()).filter(Boolean)
    if (!validUrls.length) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const res = await fetch('http://127.0.0.1:5000/api/monitor-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to monitor URLs')

      const bulk = data.results || []
      setResults(bulk)
      setActiveTab('table')

      // Append to history chart
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      bulk.forEach(r => {
        if (r.metrics) {
          setHistory(prev => [...prev, {
            name: ts,
            url: r.url,
            latency: r.metrics.latency_ms || 0,
            throughput: r.metrics.throughput_kbps || 0,
            loadTime: r.metrics.page_load_time_ms || 0
          }].slice(-30))
        }
      })

      if (bulk.some(r => r.prediction?.consensus_anomaly)) fetchAnomalies()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── chart data: aggregate per-url latest ───────────────────────────────────
  const comparisonData = results
    .filter(r => r.metrics)
    .map((r, i) => ({
      name: r.url.replace(/https?:\/\//, '').substring(0, 20),
      latency: +(r.metrics.latency_ms?.toFixed(1) || 0),
      throughput: +(r.metrics.throughput_kbps?.toFixed(1) || 0),
      loadTime: +(r.metrics.page_load_time_ms?.toFixed(1) || 0),
      color: COLORS[i % COLORS.length]
    }))

  // ── detail view ────────────────────────────────────────────────────────────
  const detailResult = detailIdx !== null ? results[detailIdx] : null

  return (
    <div className="dashboard-container">
      <header>
        <h1>Web Sentinel</h1>
        <p className="subtitle">ML Anomaly Detection &amp; Blockchain Consensus Logging</p>
      </header>

      {/* ── Input Panel ── */}
      <div className="glass-card">
        <form onSubmit={handleMonitor}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Globe size={20} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1rem' }}>
              Website URLs <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(up to 10 — paste a list to auto-fill)</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {urls.map((u, i) => (
              <div key={i} className="url-row">
                <span className="url-index">{i + 1}</span>
                <input
                  type="text"
                  className="url-input"
                  placeholder={`https://example${i + 1}.com`}
                  value={u}
                  onChange={e => updateUrl(i, e.target.value)}
                  onPaste={e => handlePaste(i, e)}
                  disabled={loading}
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => removeUrl(i)}
                    disabled={loading}
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="input-actions">
            {urls.length < 10 && (
              <button type="button" className="btn-secondary" onClick={addUrl} disabled={loading}>
                <Plus size={14} /> Add URL
              </button>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !urls.some(u => u.trim())}
              style={{ marginLeft: 'auto' }}
            >
              {loading
                ? <><Loader2 className="spinner" /> Scanning {urls.filter(u => u.trim()).length} site{urls.filter(u => u.trim()).length !== 1 ? 's' : ''}…</>
                : <><Activity size={16} /> Analyze {urls.filter(u => u.trim()).length > 1 ? `${urls.filter(u => u.trim()).length} Sites` : 'Site'}</>
              }
            </button>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center' }}>{error}</div>
          )}
        </form>
      </div>

      {/* ── Results ── */}
      {results.length > 0 && (
        <>
          {/* Tab bar */}
          <div className="tab-bar">
            {[
              { id: 'table',  label: 'Comparison Table' },
              { id: 'charts', label: 'Performance Charts' },
              ...(detailResult ? [{ id: 'detail', label: `Detail — ${detailResult.url.replace(/https?:\/\//, '')}` }] : [])
            ].map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TABLE TAB ── */}
          {activeTab === 'table' && (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Load Time (ms)</th>
                    <th>TTFB (ms)</th>
                    <th>Latency (ms)</th>
                    <th>Throughput (KB/s)</th>
                    <th>Anomaly</th>
                    <th>Votes</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className={r.error ? 'row-error' : ''}>
                      <td>
                        <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
                      </td>
                      <td className="url-cell" title={r.url}>
                        {r.url.replace(/https?:\/\//, '').substring(0, 30)}
                        {r.url.replace(/https?:\/\//, '').length > 30 ? '…' : ''}
                      </td>
                      {r.error ? (
                        <td colSpan={7} style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                          ⚠ {r.error}
                        </td>
                      ) : (
                        <>
                          <td style={{ color: statusColor(r.metrics.status_code), fontWeight: 600 }}>
                            {r.metrics.status_code}
                          </td>
                          <td>{r.metrics.page_load_time_ms?.toFixed(0) ?? '—'}</td>
                          <td>{r.metrics.ttfb_ms?.toFixed(0) ?? '—'}</td>
                          <td>{r.metrics.latency_ms?.toFixed(0) ?? '—'}</td>
                          <td>{r.metrics.throughput_kbps?.toFixed(1) ?? '—'}</td>
                          <td>
                            {r.prediction?.consensus_anomaly
                              ? <span className="badge-anomaly">⚠ Anomaly</span>
                              : <span className="badge-normal">✓ Normal</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{r.prediction?.anomaly_votes ?? '—'} / 3</td>
                        </>
                      )}
                      <td>
                        {!r.error && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => { setDetailIdx(i); setActiveTab('detail') }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary stats row */}
              {results.filter(r => !r.error).length > 1 && (
                <div className="summary-stats">
                  {[
                    {
                      label: 'Avg Latency',
                      val: (results.filter(r => r.metrics).reduce((s, r) => s + (r.metrics.latency_ms || 0), 0) / results.filter(r => r.metrics).length).toFixed(1) + ' ms'
                    },
                    {
                      label: 'Avg Throughput',
                      val: (results.filter(r => r.metrics).reduce((s, r) => s + (r.metrics.throughput_kbps || 0), 0) / results.filter(r => r.metrics).length).toFixed(1) + ' KB/s'
                    },
                    {
                      label: 'Fastest Site',
                      val: results.filter(r => r.metrics).sort((a, b) => (a.metrics.latency_ms || 9999) - (b.metrics.latency_ms || 9999))[0]?.url.replace(/https?:\/\//, '').substring(0, 20) || '—'
                    },
                    {
                      label: 'Anomalies',
                      val: `${results.filter(r => r.prediction?.consensus_anomaly).length} / ${results.length}`
                    }
                  ].map((s, i) => (
                    <div key={i} className="summary-chip">
                      <span className="metric-label">{s.label}</span>
                      <span className="summary-val">{s.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CHARTS TAB ── */}
          {activeTab === 'charts' && comparisonData.length > 0 && (
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <TrendingUp color="var(--primary)" />
                <h2>Metric Comparison</h2>
              </div>

              <div className="charts-wrapper">
                {/* Latency Bar */}
                <div className="chart-box">
                  <h3>Latency (ms)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-30} textAnchor="end" interval={0} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                        {comparisonData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Throughput Bar */}
                <div className="chart-box">
                  <h3>Throughput (KB/s)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-30} textAnchor="end" interval={0} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Bar dataKey="throughput" radius={[4, 4, 0, 0]}>
                        {comparisonData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Load Time Bar */}
                <div className="chart-box">
                  <h3>Page Load Time (ms)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} angle={-30} textAnchor="end" interval={0} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Bar dataKey="loadTime" radius={[4, 4, 0, 0]}>
                        {comparisonData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend over runs */}
              {history.length > 1 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Latency Trend Over Runs</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="latency" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── DETAIL TAB ── */}
          {activeTab === 'detail' && detailResult && (
            <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ wordBreak: 'break-all', fontSize: '1rem' }}>{detailResult.url}</h2>
                <div className={`status-badge ${detailResult.prediction?.consensus_anomaly ? 'status-anomaly' : 'status-normal'}`}>
                  {detailResult.prediction?.consensus_anomaly ? 'Anomaly Detected' : 'System Normal'}
                </div>
              </div>

              <div className="results-grid">
                {[
                  { label: 'Page Load Time', val: `${detailResult.metrics.page_load_time_ms?.toFixed(0) ?? '—'} ms` },
                  { label: 'TTFB',           val: `${detailResult.metrics.ttfb_ms?.toFixed(0) ?? '—'} ms` },
                  { label: 'Latency',        val: `${detailResult.metrics.latency_ms?.toFixed(0) ?? '—'} ms` },
                  { label: 'Throughput',     val: `${detailResult.metrics.throughput_kbps?.toFixed(1) ?? '—'} KB/s` },
                  { label: 'Status Code',    val: detailResult.metrics.status_code },
                  { label: 'Consensus Votes', val: `${detailResult.prediction?.anomaly_votes} / 3` }
                ].map((m, i) => (
                  <div key={i} className="metric-box">
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value">{m.val}</div>
                  </div>
                ))}
              </div>

              <div className="prediction-nodes">
                {[
                  { label: 'Node 1 (RF)',   val: detailResult.prediction?.rf_prediction },
                  { label: 'Node 2 (XGB)',  val: detailResult.prediction?.xgb_prediction },
                  { label: 'Node 3 (Meta)', val: detailResult.prediction?.meta_prediction }
                ].map((n, i) => (
                  <div key={i} className="node">
                    <span className="metric-label">{n.label}</span>
                    {n.val === 1 ? <ShieldAlert color="var(--danger)" /> : <CheckCircle color="var(--success)" />}
                  </div>
                ))}
              </div>

              {detailResult.reasoning?.length > 0 && (
                <div className="reasoning-section">
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    Anomaly Drivers &amp; Transparency Report
                  </h3>
                  <div className="reasoning-grid">
                    {detailResult.reasoning.map((reason, idx) => (
                      <div key={idx} className={`reason-item severity-${reason.severity}`}>
                        <div className="reason-header">
                          <span className="reason-label">{reason.label}</span>
                          <span className="severity-tag">{reason.severity}</span>
                        </div>
                        <p className="reason-description">{reason.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailResult.blockchain_log?.status === 'success' && (
                <div className="blockchain-log">
                  <Link size={24} color="var(--success)" />
                  <div>
                    <strong>Anomaly Securely Logged to Blockchain</strong><br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      TX Hash: {detailResult.blockchain_log.tx_hash}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Resource Monitoring ── */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Database /> Resource Monitoring
          </h2>
          <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={14} /> Open Grafana
          </a>
        </div>

        <div className="results-grid">
          {[
            { label: 'CPU Usage', val: `${serverStats?.cpu || 0}%`, pct: serverStats?.cpu || 0, danger: 80 },
            { label: 'RAM Usage', val: `${serverStats?.ram || 0}%`, pct: serverStats?.ram || 0, danger: 80 },
            { label: 'Disk Usage', val: `${serverStats?.disk || 0}%`, pct: serverStats?.disk || 0, danger: 90 }
          ].map((m, i) => (
            <div key={i} className="metric-box">
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.val}</div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{
                  width: `${m.pct}%`,
                  background: m.pct > m.danger ? 'var(--danger)' : 'var(--primary)'
                }} />
              </div>
            </div>
          ))}
          <div className="metric-box">
            <div className="metric-label">Network Traffic</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sent: {(serverStats?.network?.sent / 1024 / 1024 || 0).toFixed(2)} MB<br />
              Recv: {(serverStats?.network?.recv / 1024 / 1024 || 0).toFixed(2)} MB
            </div>
          </div>
        </div>
      </div>

      {/* ── Blockchain Log ── */}
      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <ShieldAlert /> Blockchain Anomaly Log
        </h2>
        {anomalies.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No anomalies logged yet.</p>
        ) : (
          <ul className="anomaly-list">
            {anomalies.map((anomaly, idx) => (
              <li key={idx} className="anomaly-item">
                <div>
                  <strong>{anomaly.url}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Hash: {anomaly.dataHash.substring(0, 16)}...{anomaly.dataHash.substring(anomaly.dataHash.length - 4)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Clock size={16} />
                  {new Date(Number(anomaly.timestamp) * 1000).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
