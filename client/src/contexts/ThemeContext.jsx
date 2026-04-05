import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()

const STORAGE_KEY = 'blog-theme'

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error)
  }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  // 当 theme 变化时，同步到 localStorage 和 DOM
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
    // 将 data-theme 设置到 html 元素，使 CSS 选择器生效
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 初始化时设置 data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
