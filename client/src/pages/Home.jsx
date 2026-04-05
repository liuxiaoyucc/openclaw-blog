import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Pagination from '../components/Pagination'

function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPosts, setTotalPosts] = useState(0)

  useEffect(() => {
    fetchPosts()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [currentPage, pageSize])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/posts?page=${currentPage}&limit=${pageSize}`)
      // 兼容：API 可能返回 { posts, total } 或直接是数组
      if (Array.isArray(response.data)) {
        setPosts(response.data)
        setTotalPosts(response.data.length)
      } else if (response.data.posts) {
        setPosts(response.data.posts)
        setTotalPosts(response.data.total || response.data.posts.length)
      } else {
        setPosts([])
        setTotalPosts(0)
      }
      setError(null)
    } catch (err) {
      setError('Connection failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
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

  const totalPages = Math.ceil(totalPosts / pageSize)

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1>&lt;Hello World /&gt;</h1>
        <p className="subtitle">
          <span className="code-comment">// </span>
          Welcome to my digital garden where ideas become code
        </p>
        
        {/* 搜索框 - 跳转搜索页 */}
        <form className="search-box" onSubmit={(e) => {
          e.preventDefault()
          const form = e.target
          const input = form.querySelector('input')
          if (input.value.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`
          }
        }}>
          <input
            type="text"
            name="q"
            placeholder="search_posts(query)..."
            className="geek-input search-input"
          />
          <button type="submit" className="btn btn-primary search-btn">
            <span className="code-function">search</span>()
          </button>
        </form>

        <div className="stats">
          <div className="stat-item">
            <div className="stat-value">{totalPosts}</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{currentTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</div>
            <div className="stat-label">Local Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{new Date().getFullYear()}</div>
            <div className="stat-label">Year</div>
          </div>
        </div>
      </section>

      {/* Terminal Window */}
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="terminal-dot red"></span>
          <span className="terminal-dot yellow"></span>
          <span className="terminal-dot green"></span>
          <span className="terminal-title">blog.sh — bash — 80×24</span>
        </div>
        <div className="terminal-body">
          <div className="section-header">
            <h2>最新文章</h2>
          </div>

          {loading ? (
            <div className="loading">
              <div className="loading-text">Loading data</div>
            </div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <p>还没有文章，来写第一篇吧！</p>
            </div>
          ) : (
            <>
              <div className="posts-grid">
                {posts.map(post => (
                  <article key={post.id} className={`post-card ${post.pinned ? 'pinned' : ''} ${post.status === 'draft' ? 'draft' : ''}`}>
                    {/* 置顶/草稿标记 */}
                    <div className="post-badges">
                      {post.pinned && <span className="badge pinned">📌</span>}
                      {post.status === 'draft' && <span className="badge draft">草稿</span>}
                    </div>

                    <div className="post-card-header">
                      <h3>
                        <Link to={`/post/${post.id}`}>{post.title}</Link>
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

                    <p className="post-excerpt">
                      {stripMarkdown(post.content)}
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

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 30]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
