import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MarkdownEditor from '../components/MarkdownEditor'
import '../components/MarkdownEditor.css'

function CreatePost() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    tags: [],
    status: 'published',
    pinned: false,
    categoryId: ''
  })
  const [categories, setCategories] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // 检查是否登录
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/categories')
        setCategories(response.data)
      } catch (err) {
        console.error('获取分类失败:', err)
      }
    }
    fetchCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }))
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }))
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      setSubmitting(true)
      const response = await axios.post('/posts', formData)
      navigate(`/post/${response.data.id}`)
    } catch (err) {
      setError('Publish failed: ' + err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">new_post.md — vim</span>
      </div>
      
      <div className="terminal-body">
        <div className="section-header">
          <h2>写文章</h2>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="post-form">
          {/* 标题和作者 */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="title">标题</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="输入文章标题"
                required
                className="geek-input"
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="author">作者</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="匿名"
                className="geek-input"
              />
            </div>
          </div>

          {/* 分类选择 */}
          <div className="form-group">
            <label htmlFor="categoryId">分类</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="geek-input"
            >
              <option value="">选择分类</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 标签输入 */}
          <div className="form-group">
            <label>标签</label>
            <div className="tags-input-container">
              <div className="tags-list">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag-item-selected">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="输入标签后按回车"
                className="geek-input tags-input"
              />
            </div>
          </div>

          {/* 内容编辑器 */}
          <div className="form-group">
            <label>内容</label>
            <MarkdownEditor
              value={formData.content}
              onChange={handleContentChange}
              placeholder="# 在这里开始写作..."
            />
          </div>

          {/* 选项：草稿、置顶 */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="pinned"
                checked={formData.pinned}
                onChange={handleChange}
              />
              <span>置顶文章</span>
            </label>
            
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.status === 'published'}
                  onChange={handleChange}
                />
                <span>立即发布</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === 'draft'}
                  onChange={handleChange}
                />
                <span>保存为草稿</span>
              </label>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <><span className="code-comment">//</span> saving...</>
              ) : (
                <><span className="code-function">{formData.status === 'draft' ? 'save_draft' : 'publish'}</span>()</>
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              <span className="code-function">cancel</span>()
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost
