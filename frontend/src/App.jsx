import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Activity, ShieldAlert, CheckCircle, Globe, Link, Loader2, Database, Clock, TrendingUp } from 'lucide-react'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)

  const [serverStats, setServerStats] = useState(null)

  const fetchAnomalies = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/anomalies')
      if (res.ok) {
        const data = await res.json()
        setAnomalies(data.reverse())
      }
    } catch (err) {
      console.error("Failed to fetch blockchain logs", err)
    }
  }

  const fetchServerStats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/server-stats')
      if (res.ok) {
        const data = await res.json()
        setServerStats(data)
      }
    } catch (err) {
      console.error("Failed to fetch server stats", err)
    }
  }

  useEffect(() => {
    fetchAnomalies()
    fetchServerStats()
    const interval = setInterval(fetchServerStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleMonitor = async (e) => {
    e.preventDefault()
    if (!url) return
    
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('http://127.0.0.1:5000/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to monitor URL")
      
      setResult(data)
      
      // Update history
      const newEntry = {
        name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latency: data.metrics.latency_ms || 0,
        throughput: data.metrics.throughput_kbps || 0,
        loadTime: data.metrics.page_load_time_ms || 0
      }
      setHistory(prev => [...prev, newEntry].slice(-15))

      if (data.prediction?.consensus_anomaly) {
        fetchAnomalies()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <header>
        <h1>Web Sentinel</h1>
        <p className="subtitle">ML Anomaly Detection & Blockchain Consensus Logging</p>
      </header>

      <div className="glass-card">
        <form onSubmit={handleMonitor} className="input-section">
          <Globe className="text-muted" size={24} />
          <input
            type="text"
            className="url-input"
            placeholder="Enter website URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading || !url}>
            {loading ? <Loader2 className="spinner" /> : <Activity />}
            Monitor
          </button>
        </form>
        {error && (
          <div style={{color: 'var(--danger)', marginTop: '1rem', textAlign: 'center'}}>
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
            <h2>Analysis Results</h2>
            <div className={`status-badge ${result.prediction.consensus_anomaly ? 'status-anomaly' : 'status-normal'}`}>
              {result.prediction.consensus_anomaly ? 'Anomaly Detected' : 'System Normal'}
            </div>
          </div>

          <div className="results-grid">
            <div className="metric-box">
              <div className="metric-label">Page Load Time</div>
              <div className="metric-value">{result.metrics.page_load_time_ms?.toFixed(0) || result.metrics.response_time_ms?.toFixed(0)} ms</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">TTFB</div>
              <div className="metric-value">{result.metrics.ttfb_ms?.toFixed(0) || 'N/A'} ms</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Latency</div>
              <div className="metric-value">{result.metrics.latency_ms?.toFixed(0) || 'N/A'} ms</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Throughput</div>
              <div className="metric-value">{result.metrics.throughput_kbps?.toFixed(1) || 'N/A'} KB/s</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Status Code</div>
              <div className="metric-value">{result.metrics.status_code}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Consensus Votes</div>
              <div className="metric-value">{result.prediction.anomaly_votes} / 3</div>
            </div>
          </div>

          <div className="prediction-nodes">
            <div className="node">
              <span className="metric-label">Node 1 (RF)</span>
              {result.prediction.rf_prediction === 1 ? <ShieldAlert color="var(--danger)" /> : <CheckCircle color="var(--success)" />}
            </div>
            <div className="node">
              <span className="metric-label">Node 2 (XGB)</span>
              {result.prediction.xgb_prediction === 1 ? <ShieldAlert color="var(--danger)" /> : <CheckCircle color="var(--success)" />}
            </div>
            <div className="node">
              <span className="metric-label">Node 3 (Meta)</span>
              {result.prediction.meta_prediction === 1 ? <ShieldAlert color="var(--danger)" /> : <CheckCircle color="var(--success)" />}
            </div>
          </div>

          {result.reasoning && result.reasoning.length > 0 && (
            <div className="reasoning-section">
              <h3 style={{fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem'}}>
                Anomaly Drivers & Transparency Report
              </h3>
              <div className="reasoning-grid">
                {result.reasoning.map((reason, idx) => (
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

          {result.blockchain_log && result.blockchain_log.status === "success" && (
            <div className="blockchain-log">
              <Link size={24} color="var(--success)" />
              <div>
                <strong>Anomaly Securely Logged to Blockchain</strong><br />
                <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                  TX Hash: {result.blockchain_log.tx_hash}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="glass-card chart-container">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'}}>
            <TrendingUp color="var(--primary)" />
            <h2>Performance Trends</h2>
          </div>
          
          <div className="charts-wrapper">
            <div className="chart-box">
              <h3>Latency (ms)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLatency)" 
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <h3>Throughput (KB/s)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="throughput" 
                    stroke="var(--success)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorThroughput)" 
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0}}>
            <Database /> Resource Monitoring
          </h2>
          <a 
            href="http://localhost:3001" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary"
            style={{fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem'}}
          >
            <TrendingUp size={14} /> Open Grafana
          </a>
        </div>
        
        <div className="results-grid">
          <div className="metric-box">
            <div className="metric-label">CPU Usage</div>
            <div className="metric-value">{serverStats?.cpu || 0}%</div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{width: `${serverStats?.cpu || 0}%`, background: (serverStats?.cpu > 80 ? 'var(--danger)' : 'var(--primary)')}}></div>
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">RAM Usage</div>
            <div className="metric-value">{serverStats?.ram || 0}%</div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{width: `${serverStats?.ram || 0}%`, background: (serverStats?.ram > 80 ? 'var(--danger)' : 'var(--primary)')}}></div>
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Disk Usage</div>
            <div className="metric-value">{serverStats?.disk || 0}%</div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{width: `${serverStats?.disk || 0}%`, background: (serverStats?.disk > 90 ? 'var(--danger)' : 'var(--primary)')}}></div>
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Network Traffic</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
              Sent: {(serverStats?.network?.sent / 1024 / 1024).toFixed(2)} MB<br/>
              Recv: {(serverStats?.network?.recv / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'}}>
          <ShieldAlert /> Blockchain Anomaly Log
        </h2>
        {anomalies.length === 0 ? (
          <p style={{color: 'var(--text-muted)', textAlign: 'center', padding: '2rem'}}>No anomalies logged yet.</p>
        ) : (
          <ul className="anomaly-list">
            {anomalies.map((anomaly, idx) => (
              <li key={idx} className="anomaly-item">
                <div>
                  <strong>{anomaly.url}</strong>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                    Hash: {anomaly.dataHash.substring(0, 16)}...{anomaly.dataHash.substring(anomaly.dataHash.length - 4)}
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
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
