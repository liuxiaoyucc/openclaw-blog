import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // 检查管理员权限
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setIsAdmin(userData.role === 'admin')
    }
  }, [])

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/categories')
      setCategories(response.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAdmin) {
      setError('Permission denied: Admin access required')
      return
    }

    try {
      if (editingCategory) {
        // 更新分类
        await axios.put(`/categories/${editingCategory.id}`, formData)
      } else {
        // 创建分类
        await axios.post('/categories', formData)
      }
      
      // 重置表单
      setFormData({ name: '', description: '' })
      setEditingCategory(null)
      setShowForm(false)
      
      // 刷新列表
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!isAdmin) {
      setError('Permission denied: Admin access required')
      return
    }

    try {
      await axios.delete(`/categories/${id}`)
      setDeleteConfirm(null)
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', description: '' })
    setEditingCategory(null)
    setShowForm(false)
    setError(null)
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="terminal-dot red"></span>
          <span className="terminal-dot yellow"></span>
          <span className="terminal-dot green"></span>
          <span className="terminal-title">categories.sh — loading</span>
        </div>
        <div className="terminal-body">
          <div className="loading">
            <span className="loading-text">Loading categories</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">categories.sh — manage</span>
      </div>
      
      <div className="terminal-body">
        <div className="section-header">
          <h2>分类管理</h2>
          {isAdmin && !showForm && (
            <button onClick={handleAddNew} className="btn btn-primary">
              <span className="code-function">+ new_category</span>()
            </button>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        {/* 添加/编辑表单 */}
        {showForm && isAdmin && (
          <div className="category-form-container" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }}>
              {editingCategory ? '编辑分类' : '添加新分类'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  分类名称 <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="输入分类名称"
                  required
                  className="geek-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  描述
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="输入分类描述（可选）"
                  className="geek-input"
                />
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  <span className="code-function">{editingCategory ? 'update' : 'create'}</span>()
                </button>
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  <span className="code-function">cancel</span>()
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 分类列表 */}
        <div className="categories-list">
          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <p>暂无分类</p>
              {isAdmin && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <span className="code-comment">// </span>
                  点击上方按钮添加第一个分类
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>
                        #{category.name}
                      </span>
                      {category.postCount !== undefined && (
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-tertiary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {category.postCount} 篇文章
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.9rem',
                        margin: 0
                      }}>
                        <span className="code-comment">// </span>
                        {category.description}
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(category)}
                        className="btn btn-edit"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <span className="code-function">edit</span>()
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category)}
                        className="btn btn-delete"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <span className="code-function">delete</span>()
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 删除确认对话框 */}
        {deleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--accent-red)',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>
                确认删除
              </h3>
              <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                确定要删除分类 <strong style={{ color: 'var(--accent-purple)' }}>#{deleteConfirm.name}</strong> 吗？
                <br />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  此操作不可撤销。
                </span>
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-secondary"
                >
                  <span className="code-function">cancel</span>()
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="btn btn-delete"
                >
                  <span className="code-function">confirm_delete</span>()
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 非管理员提示 */}
        {!isAdmin && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(255, 166, 87, 0.1)', 
            border: '1px solid var(--accent-orange)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <span style={{ color: 'var(--accent-orange)' }}>
              <span className="code-comment">// </span>
              需要管理员权限才能管理分类
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Categories
