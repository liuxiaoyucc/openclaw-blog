import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function Archive() {
  const [archive, setArchive] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedYears, setExpandedYears] = useState(new Set())

  useEffect(() => {
    fetchArchive()
  }, [])

  const fetchArchive = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/archive')
      setArchive(response.data)
      // Expand current year by default
      const currentYear = new Date().getFullYear().toString()
      if (response.data[currentYear]) {
        setExpandedYears(new Set([currentYear]))
      }
      setError(null)
    } catch (err) {
      setError('Failed to load archive: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleYear = (year) => {
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(year)) {
      newExpanded.delete(year)
    } else {
      newExpanded.add(year)
    }
    setExpandedYears(newExpanded)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const sortedYears = Object.keys(archive).sort((a, b) => b - a)

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-text">Loading archive...</div>
      </div>
    )
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">archive.git — log</span>
      </div>
      
      <div className="terminal-body">
        <div className="section-header">
          <h2>文章归档</h2>
        </div>

        {sortedYears.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <p>No posts yet</p>
          </div>
        ) : (
          <div className="archive-list">
            {sortedYears.map(year => (
              <div key={year} className="archive-year">
                <button 
                  className="archive-year-header"
                  onClick={() => toggleYear(year)}
                >
                  <span className="archive-toggle">
                    {expandedYears.has(year) ? '▼' : '▶'}
                  </span>
                  <span className="code-keyword">commit</span>{' '}
                  <span className="code-string">{year}</span>
                  <span className="archive-count">
                    {Object.values(archive[year]).flat().length} posts
                  </span>
                </button>
                
                {expandedYears.has(year) && (
                  <div className="archive-months">
                    {Object.keys(archive[year])
                      .sort((a, b) => b - a)
                      .map(month => (
                        <div key={month} className="archive-month">
                          <div className="archive-month-header">
                            <span className="code-comment">//</span>{' '}
                            {monthNames[parseInt(month) - 1]}
                            <span className="archive-count">
                              {archive[year][month].length} posts
                            </span>
                          </div>
                          <ul className="archive-posts">
                            {archive[year][month].map(post => (
                              <li key={post.id} className="archive-post">
                                <span className="archive-date">
                                  {new Date(post.createdAt).getDate().toString().padStart(2, '0')}
                                </span>
                                <Link to={`/post/${post.id}`} className="archive-title">
                                  {post.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Archive
