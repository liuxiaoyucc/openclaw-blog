import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import MarkdownEditor from '../components/MarkdownEditor'
import '../components/MarkdownEditor.css'

function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: ''
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPost()
    fetchCategories()
  }, [id])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories')
      setCategories(response.data)
    } catch (err) {
      console.error('获取分类失败:', err)
    }
  }

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/posts/${id}`)
      setFormData({
        title: response.data.title,
        content: response.data.content,
        categoryId: response.data.categoryId || ''
      })
      setError(null)
    } catch (err) {
      setError('获取文章失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('标题和内容不能为空')
      return
    }

    try {
      setSubmitting(true)
      await axios.put(`/posts/${id}`, formData)
      navigate(`/post/${id}`)
    } catch (err) {
      setError('更新失败: ' + err.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-text">加载中...</div>
      </div>
    )
  }

  if (error && !formData.title) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">edit_post.md — vim</span>
      </div>
      
      <div className="terminal-body">
        <div className="section-header">
          <h2>编辑文章</h2>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
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

          <div className="form-group">
            <label>内容</label>
            <MarkdownEditor
              value={formData.content}
              onChange={handleContentChange}
              placeholder="编辑文章内容..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-edit"
              disabled={submitting}
            >
              {submitting ? (
                <><span className="code-comment">//</span> saving...</>
              ) : (
                <><span className="code-function">save</span>()</>
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(`/post/${id}`)}
            >
              <span className="code-function">cancel</span>()
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPost
