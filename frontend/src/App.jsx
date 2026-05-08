import { useState, useEffect } from 'react'
import { Activity, ShieldAlert, CheckCircle, Globe, Link, Loader2, Database, Clock } from 'lucide-react'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [error, setError] = useState(null)

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

  useEffect(() => {
    fetchAnomalies()
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

      <div className="glass-card">
        <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'}}>
          <Database /> Blockchain Anomaly Log
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
