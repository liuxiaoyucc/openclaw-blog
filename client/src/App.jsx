import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Home from './pages/Home'
import Search from './pages/Search'
import PostDetail from './pages/PostDetail'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'
import Archive from './pages/Archive'
import Tags from './pages/Tags'
import Categories from './pages/Categories'
import Stats from './pages/Stats'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import { useTheme } from './contexts/ThemeContext'
import './App.css'

// API base URL
axios.defaults.baseURL = 'http://localhost:3001/api'

// 添加请求拦截器，自动添加token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function App() {
  const [user, setUser] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <div className="app">
      {/* 菜单按钮 */}
      <button
        className="menu-btn"
        onClick={() => setIsSidebarOpen(true)}
        title="打开菜单"
      >
        ☰
      </button>

      <Sidebar
        user={user}
        setUser={setUser}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/edit/:id" element={<EditPost />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>&copy; 2026 My Blog System</p>
        <div className="tech-stack">
          <span>React</span>
          <span>Node.js</span>
          <span>Redis</span>
          <span>Vite</span>
        </div>
      </footer>
    </div>
  )
}

export default App
