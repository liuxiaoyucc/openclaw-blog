import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function Search() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState(query)
  const [lastQuery, setLastQuery] = useState('')

  useEffect(() => {
    if (query && query !== lastQuery) {
      setSearchQuery(query)
      fetchSearchResults(query)
    }
  }, [query])

  const fetchSearchResults = useCallback(async (q) => {
    if (!q || q === lastQuery) return
    try {
      setLoading(true)
      setLastQuery(q)
      const response = await axios.get(`/posts/search?q=${encodeURIComponent(q)}`)
      setPosts(response.data.posts || response.data)
      setError(null)
    } catch (err) {
      setError('搜索失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [lastQuery])

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      // 同步更新 URL（支持书签分享），但不刷新页面
      navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
      fetchSearchResults(trimmed)
    }
  }

  const highlightText = (text, keywords) => {
    if (!keywords || !text) return text
    const regex = new RegExp(`(${keywords})`, 'gi')
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <em key={i}>{part}</em> : part
    )
  }

  const stripMarkdown = (markdown) => {
    if (!markdown) return ''
    return markdown
      .replace(/```[\s\S]*?```/g, ' [代码] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' [图片] ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/^>\s*/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^---+$/gm, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="search-page">
      {/* Terminal Window */}
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="terminal-dot red"></span>
          <span className="terminal-dot yellow"></span>
          <span className="terminal-dot green"></span>
          <span className="terminal-title">search.sh — bash — 80×24</span>
        </div>
        <div className="terminal-body">
          <div className="section-header">
            <h2>搜索结果</h2>
          </div>

          {/* Search Form */}
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search_posts(query)..."
              className="geek-input search-input"
            />
            <button type="submit" className="btn btn-primary search-btn">
              <span className="code-function">search</span>()
            </button>
          </form>

          {/* Results Info */}
          {!loading && !error && query && (
            <div className="search-results-info">
              <span className="code-comment">// </span>
              找到 <span className="search-count">{posts.length}</span> 个关于 
              "<span className="search-keyword">{highlightText(query, query)}</span>" 的结果
            </div>
          )}

          {loading ? (
            <div className="loading">
              <div className="loading-text">Searching</div>
            </div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : !query ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p>输入关键词搜索文章</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>没有找到相关文章</p>
              <p className="empty-state-hint">试试其他关键词</p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map(post => (
                <article key={post.id} className="post-card search-result-card">
                  <div className="post-card-header">
                    <h3>
                      <Link to={`/post/${post.id}`}>
                        {highlightText(post.title, query)}
                      </Link>
                    </h3>
                  </div>
                  
                  <div className="post-meta">
                    <span className="author">@{post.author || 'Anonymous'}</span>
                    <span className="date">{formatDate(post.createdAt)}</span>
                  </div>

                  {/* 分类 */}
                  {post.category && (
                    <div className="post-category-inline">
                      <Link to={`/category/${post.category.id}`} className="category-link">
                        📁 {post.category.name}
                      </Link>
                    </div>
                  )}

                  {/* 标签 */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags-inline">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag-mini">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <p className="post-excerpt search-excerpt">
                    {highlightText(stripMarkdown(post.content).substring(0, 200), query)}
                    {stripMarkdown(post.content).length > 200 ? '...' : ''}
                  </p>

                  <div className="post-footer">
                    <div className="post-mini-stats">
                      <span>👁️ {post.views || 0}</span>
                      <span>❤️ {post.likes || 0}</span>
                    </div>
                    <Link to={`/post/${post.id}`} className="read-more">
                      阅读更多 →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Search
