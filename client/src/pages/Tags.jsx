import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function Tags() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTag, setSelectedTag] = useState(null)
  const [taggedPosts, setTaggedPosts] = useState([])

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
      setError('Failed to load tags: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTagClick = async (tag) => {
    if (selectedTag === tag) {
      setSelectedTag(null)
      setTaggedPosts([])
      return
    }
    
    try {
      const response = await axios.get(`/posts?tag=${tag}`)
      setTaggedPosts(response.data)
      setSelectedTag(tag)
    } catch (err) {
      console.error('Failed to load tagged posts:', err)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-text">Loading tags...</div>
      </div>
    )
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  const tags = stats?.tags || {}
  const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1])
  const maxCount = Math.max(...Object.values(tags), 1)

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">tags.json</span>
      </div>
      
      <div className="terminal-body">
        <div className="section-header">
          <h2>标签云</h2>
        </div>

        {sortedTags.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏷️</div>
            <p>No tags yet</p>
          </div>
        ) : (
          <>
            <div className="tags-cloud">
              {sortedTags.map(([tag, count]) => {
                const size = 0.8 + (count / maxCount) * 1.2
                return (
                  <button
                    key={tag}
                    className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
                    style={{ fontSize: `${size}rem` }}
                    onClick={() => handleTagClick(tag)}
                  >
                    <span className="code-keyword">"{tag}"</span>
                    <span className="tag-count">: {count}</span>
                  </button>
                )
              })}
            </div>

            {selectedTag && (
              <div className="tagged-posts">
                <h3 className="tagged-header">
                  <span className="code-keyword">const</span>{' '}
                  <span className="code-string">"{selectedTag}"</span>{' '}
                  <span className="code-comment">// {taggedPosts.length} posts</span>
                </h3>
                <ul className="tagged-list">
                  {taggedPosts.map(post => (
                    <li key={post.id}>
                      <Link to={`/post/${post.id}`}>{post.title}</Link>
                      <span className="tagged-date">
                        {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Tags
