import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import axios from 'axios'

function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/posts/${id}`)
      setPost(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load post: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/posts/${id}/comments`)
      setComments(response.data)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

  const handleLike = async () => {
    try {
      await axios.post(`/posts/${id}/like`)
      setPost(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }))
      setLiked(true)
    } catch (err) {
      console.error('Failed to like:', err)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await axios.post(`/posts/${id}/comments`, {
        content: newComment,
        author: commentAuthor || 'Anonymous'
      })
      setNewComment('')
      fetchComments()
    } catch (err) {
      alert('Failed to add comment: ' + err.message)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await axios.delete(`/comments/${commentId}`)
      fetchComments()
    } catch (err) {
      alert('Failed to delete comment: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await axios.delete(`/posts/${id}`)
      navigate('/')
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-text">Loading post...</div>
      </div>
    )
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (!post) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <p>Post not found</p>
      </div>
    )
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">{post.title.toLowerCase().replace(/\s+/g, '_')}.md</span>
      </div>
      
      <div className="terminal-body">
        <article className="post-detail markdown-body">
          {/* 置顶标记 */}
          {post.pinned && (
            <div className="post-pinned">
              <span>📌 置顶文章</span>
            </div>
          )}

          <h1>{post.title}</h1>
          
          {/* 元信息 */}
          <div className="post-meta">
            <span className="author">@{post.author || 'Anonymous'}</span>
            <span className="date">{new Date(post.createdAt).toLocaleString('zh-CN')}</span>
            {post.status === 'draft' && <span className="draft-badge">草稿</span>}
          </div>

          {/* 分类 */}
          {post.category && (
            <div className="post-category-detail">
              <span className="category-label">分类：</span>
              <Link to={`/category/${post.category.id}`} className="category-link">
                {post.category.name}
              </Link>
            </div>
          )}

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags-detail">
              {post.tags.map(tag => (
                <Link key={tag} to={`/tags`} className="tag-link">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          
          {/* 内容 */}
          <div className="post-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''
                  const content = String(children).replace(/\n$/, '')
                  
                  // 目录树特殊渲染
                  if (language === 'tree' || content.includes('├──') || content.includes('└──')) {
                    return (
                      <pre className="tree-block">
                        {content.split('\n').map((line, i) => {
                          // 将目录树符号替换为带样式的 span
                          const parts = line.split(/([├└│├──└──])/g)
                          return (
                            <div key={i} className="tree-line">
                              {parts.map((part, j) => {
                                if (/[├└│├──└──]/.test(part)) {
                                  return <span key={j} className="tree-symbol">{part}</span>
                                }
                                return <span key={j}>{part}</span>
                              })}
                            </div>
                          )
                        })}
                      </pre>
                    )
                  }
                  
                  return !inline && match ? (
                    <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                      {content}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>{children}</code>
                  )
                },
                img({ src, alt, style, className, ...props }) {
                  return (
                    <img 
                      src={src} 
                      alt={alt} 
                      style={style} 
                      className={`markdown-image ${className || ''}`}
                      loading="lazy"
                      {...props}
                    />
                  )
                }
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* 统计和操作 */}
          <div className="post-stats-bar">
            <div className="post-stats">
              <span className="stat-item">👁️ {post.views || 0}</span>
              <button 
                className={`stat-item like-btn ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={liked}
              >
                ❤️ {post.likes || 0}
              </button>
              <span className="stat-item">💬 {comments.length}</span>
            </div>
            
            <div className="post-actions">
              <Link to={`/edit/${post.id}`} className="btn btn-edit">
                <span className="code-function">edit</span>()
              </Link>
              <button onClick={handleDelete} className="btn btn-delete">
                <span className="code-function">delete</span>()
              </button>
              <Link to="/" className="btn btn-secondary">
                <span className="code-function">back</span>()
              </Link>
            </div>
          </div>
        </article>

        {/* 评论区域 */}
        <div className="comments-section">
          <h3>
            <span className="code-keyword">Comments</span>
            <span className="comments-count">({comments.length})</span>
          </h3>

          {/* 评论列表 */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">@{comment.author}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </span>
                    <button 
                      className="comment-delete"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      ×
                    </button>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          {/* 添加评论 */}
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              type="text"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              placeholder="Your name (optional)"
              className="geek-input comment-author-input"
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="geek-input comment-textarea"
              rows="3"
            />
            <button type="submit" className="btn btn-primary">
              <span className="code-function">post_comment</span>()
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PostDetail
