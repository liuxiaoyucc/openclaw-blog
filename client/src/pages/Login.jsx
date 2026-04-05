import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        // 登录
        const response = await axios.post('/auth/login', {
          username: formData.username,
          password: formData.password
        })
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        navigate('/')
      } else {
        // 注册
        await axios.post('/auth/register', {
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName || formData.username
        })
        // 注册成功后自动登录
        const loginResponse = await axios.post('/auth/login', {
          username: formData.username,
          password: formData.password
        })
        localStorage.setItem('token', loginResponse.data.token)
        localStorage.setItem('user', JSON.stringify(loginResponse.data.user))
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed')
      setLoading(false)
    }
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot red"></span>
        <span className="terminal-dot yellow"></span>
        <span className="terminal-dot green"></span>
        <span className="terminal-title">auth.sh — login</span>
      </div>
      
      <div className="terminal-body">
        <div className="section-header">
          <h2>{isLogin ? '登录' : '注册'}</h2>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="post-form auth-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              required
              className="geek-input"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">显示名称</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Display name (optional)"
                className="geek-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="password"
              required
              className="geek-input"
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <><span className="code-comment">//</span> authenticating...</>
              ) : (
                <><span className="code-function">{isLogin ? 'login' : 'register'}</span>()</>
              )}
            </button>
            <Link to="/" className="btn btn-secondary">
              <span className="code-function">cancel</span>()
            </Link>
          </div>
        </form>

        <div className="auth-switch">
          <span className="code-comment">// </span>
          {isLogin ? 'No account? ' : 'Already have an account? '}
          <button 
            className="link-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'register()' : 'login()'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
