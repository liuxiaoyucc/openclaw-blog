import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'
import Calendar from './Calendar'
import './Sidebar.css'

function Sidebar({ user, setUser, isOpen, setIsOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [archive, setArchive] = useState([])
  const [rankPosts, setRankPosts] = useState([])
  const [rankLoading, setRankLoading] = useState(false)
  const [rankError, setRankError] = useState(null)

  useEffect(() => {
    fetchArchive()
    fetchRankPosts()
  }, [])

  const fetchArchive = async () => {
    try {
      const res = await axios.get('/archive')
      const data = res.data
      // 转换为 [{year, month, count}] 并按日期倒序排列
      const list = []
      Object.keys(data)
        .sort((a, b) => b - a)
        .forEach(year => {
          Object.keys(data[year])
            .sort((a, b) => b - a)
            .forEach(month => {
              list.push({
                year: parseInt(year),
                month: parseInt(month),
                count: data[year][month].length
              })
            })
        })
      setArchive(list)
    } catch (err) {
      console.error('Failed to fetch archive:', err)
    }
  }

  const fetchRankPosts = async () => {
    setRankLoading(true)
    setRankError(null)
    try {
      const res = await axios.get('/posts/rank')
      console.log('[top_reads] API response:', res.data)
      if (Array.isArray(res.data)) {
        setRankPosts(res.data)
      } else {
        console.warn('[top_reads] Unexpected response format:', res.data)
        setRankPosts([])
        setRankError('数据格式异常')
      }
    } catch (err) {
      console.error('[top_reads] Failed to fetch rank posts:', err)
      setRankError(err.response?.data?.message || err.message || '加载失败')
    } finally {
      setRankLoading(false)
    }
  }

  const formatMonth = (year, month) => {
    return `${year}年${month}月`
  }

  const handleArchiveClick = (year, month) => {
    navigate(`/archive?year=${year}&month=${month}`)
    setIsOpen(false)
  }

  const handleRankPostClick = (postId) => {
    navigate(`/post/${postId}`)
    setIsOpen(false)
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  const navItems = [
    { path: '/', label: '~/home', icon: '🏠' },
    { path: '/archive', label: 'archive', icon: '📁' },
    { path: '/tags', label: 'tags', icon: '🏷️' },
    ...(user?.role === 'admin' ? [{ path: '/categories', label: 'categories', icon: '📂' }] : []),
    { path: '/stats', label: 'stats', icon: '📊' },
  ]

  return (
    <>
      {/* 遮罩层 - 点击关闭侧边栏 */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* 侧边栏 */}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        {/* 品牌区域 */}
        <div className="sidebar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-prompt">&gt;</span>
            <span className="brand-text">dev.blog</span>
          </Link>
        </div>

        {/* 可滚动内容区 */}
        <div className="sidebar-scroll">
          {/* 日历 */}
          <Calendar onDateClick={(year, month, day) => {
            navigate(`/archive?year=${year}&month=${month}&day=${day}`)
            setIsOpen(false)
          }} />

          {/* 分隔线 */}
          <div className="sidebar-divider" />

          {/* 导航菜单 */}
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* 分隔线 */}
          <div className="sidebar-divider" />

          {/* 阅读排行 */}
          <div className="sidebar-rank">
            <div className="sidebar-rank-title">
              <span className="rank-icon">🔥</span>
              <span>top_reads</span>
            </div>
            <div className="sidebar-rank-list">
              {rankLoading ? (
                <div className="sidebar-rank-loading">
                  <span className="loading-dots">loading</span>
                </div>
              ) : rankError ? (
                <div className="sidebar-rank-error">
                  <span className="error-icon">⚠</span>
                  <span className="error-text">{rankError}</span>
                </div>
              ) : rankPosts.length > 0 ? (
                rankPosts.map((post, idx) => (
                  <button
                    key={post.id}
                    className="sidebar-rank-item"
                    onClick={() => handleRankPostClick(post.id)}
                  >
                    <span className={`rank-number rank-${idx + 1}`}>{idx + 1}</span>
                    <span className="rank-title" title={post.title}>{post.title}</span>
                    <span className="rank-views">{post.views || 0}</span>
                  </button>
                ))
              ) : (
                <div className="sidebar-rank-empty">
                  <div>no data</div>
                  <div className="sidebar-rank-debug">
                    请检查控制台日志或点击菜单展开侧边栏
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="sidebar-divider" />

          {/* 按月归档 */}
          <div className="sidebar-archive">
            <div className="sidebar-archive-title">
              <span className="archive-icon">📅</span>
              <span>archives</span>
            </div>
            <div className="sidebar-archive-list">
              {archive.map((item, idx) => (
                <button
                  key={idx}
                  className="sidebar-archive-item"
                  onClick={() => handleArchiveClick(item.year, item.month)}
                >
                  <span className="archive-date">{formatMonth(item.year, item.month)}</span>
                  <span className="archive-count">({item.count})</span>
                </button>
              ))}
              {archive.length === 0 && (
                <div className="sidebar-archive-empty">no archives</div>
              )}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="sidebar-divider" />
        </div>{/* end sidebar-scroll */}

        {/* 底部操作区 */}
        <div className="sidebar-footer">
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="sidebar-btn"
            title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          >
            <span className="sidebar-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="sidebar-label">{theme === 'dark' ? 'dark' : 'light'}()</span>
          </button>

          {/* 用户操作 */}
          {user ? (
            <>
              <Link to="/create" className="sidebar-link sidebar-link-primary">
                <span className="sidebar-icon">➕</span>
                <span className="sidebar-label">new_post()</span>
              </Link>
              <div className="sidebar-user">
                <span className="user-avatar">@{user.displayName || user.username}</span>
              </div>
              <button onClick={handleLogout} className="sidebar-btn sidebar-btn-logout">
                <span className="sidebar-icon">🚪</span>
                <span className="sidebar-label">
                  <span className="code-function">logout</span>()
                </span>
              </button>
            </>
          ) : (
            <Link to="/login" className="sidebar-link sidebar-link-primary">
              <span className="sidebar-icon">🔑</span>
              <span className="sidebar-label">
                <span className="code-function">login</span>()
              </span>
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
