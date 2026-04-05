import { useState, useEffect } from 'react'
import axios from 'axios'

function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/stats')
      setStats(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load stats: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-text">Loading stats...</div>
      </div>
    )
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  const statItems = [
    { key: 'totalPosts', label: 'Posts', icon: '📝', color: 'var(--accent-blue)' },
    { key: 'totalComments', label: 'Comments', icon: '💬', color: 'var(--accent-green)' },
    { key: 'totalUsers', label: 'Users', icon: '👥', color: 'var(--accent-purple)' },
    { key: 'totalViews', label: 'Views', icon: '👁️', color: 'var(--accent-orange)' },
    { key: 'totalLikes', label: 'Likes', icon: '❤️', color: 'var(--accent-red)' },
  ]

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">stats.json</span>
      </div>
      
      <div className="terminal-body">
        <div className="section-header">
          <h2>数据统计</h2>
        </div>

        <div className="stats-grid">
          {statItems.map(item => (
            <div key={item.key} className="stat-card">
              <div className="stat-icon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="stat-info">
                <div className="stat-number" style={{ color: item.color }}>
                  {stats?.[item.key] || 0}
                </div>
                <div className="stat-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        {stats?.tags && Object.keys(stats.tags).length > 0 && (
          <div className="stats-section">
            <h3>
              <span className="code-keyword">Tags</span>
            </h3>
            <div className="stats-tags">
              {Object.entries(stats.tags)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([tag, count]) => (
                  <span key={tag} className="stats-tag">
                    <span className="code-string">"{tag}"</span>
                    <span className="tag-count">: {count}</span>
                  </span>
                ))}
            </div>
          </div>
        )}

        {stats?.archive && Object.keys(stats.archive).length > 0 && (
          <div className="stats-section">
            <h3>
              <span className="code-keyword">Archive</span>
            </h3>
            <div className="stats-archive">
              {Object.entries(stats.archive)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 12)
                .map(([month, count]) => (
                  <div key={month} className="archive-bar-item">
                    <span className="archive-bar-label">{month}</span>
                    <div className="archive-bar">
                      <div 
                        className="archive-bar-fill"
                        style={{ 
                          width: `${Math.min((count / Math.max(...Object.values(stats.archive))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="archive-bar-value">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Stats
