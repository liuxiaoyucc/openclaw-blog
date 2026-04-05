import { useState, useEffect } from 'react'
import axios from 'axios'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function Calendar({ onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [postDates, setPostDates] = useState(new Set()) // { '2026-04-05': true }

  useEffect(() => {
    fetchPostDates()
  }, [])

  // 获取有文章的日期集合
  const fetchPostDates = async () => {
    try {
      const res = await axios.get('/api/archive')
      const data = res.data
      const dates = new Set()

      Object.keys(data).forEach(year => {
        Object.keys(data[year]).forEach(month => {
          // 该月有文章，该月所有天都标记（按任务要求）
          const y = parseInt(year)
          const m = parseInt(month)
          const daysInMonth = new Date(y, m, 0).getDate()
          for (let d = 1; d <= daysInMonth; d++) {
            dates.add(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
          }
        })
      })

      setPostDates(dates)
    } catch (err) {
      console.error('Failed to fetch post dates:', err)
    }
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed

  // 当月第一天
  const firstDay = new Date(year, month, 1)
  // 当月最后一天
  const lastDay = new Date(year, month + 1, 0)
  // 月份第一天是星期几 (0=周日)
  const startWeekday = firstDay.getDay()
  // 当月天数
  const daysInMonth = lastDay.getDate()

  // 生成日历格子
  const cells = []
  // 填充空白
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null)
  }
  // 填充日期
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (day) => {
    if (!day) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const hasPost = postDates.has(dateStr)
    if (hasPost && onDateClick) {
      onDateClick(year, month + 1, day)
    }
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  const hasPost = (day) => {
    if (!day) return false
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return postDates.has(dateStr)
  }

  const monthLabel = `${year}年${month + 1}月`

  return (
    <div className="sidebar-calendar">
      <div className="sidebar-calendar-title">
        <span className="calendar-icon">📆</span>
        <span>calendar</span>
      </div>

      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={goToPrevMonth} title="上月">
          ‹
        </button>
        <button className="calendar-month-label" onClick={goToToday}>
          {monthLabel}
        </button>
        <button className="calendar-nav-btn" onClick={goToNextMonth} title="下月">
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className={`calendar-weekday ${i === 0 || i === 6 ? 'weekend' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="calendar-cell calendar-empty" />
          }

          const isClickable = hasPost(day)
          const todayClass = isToday(day) ? ' today' : ''
          const hasPostClass = hasPost(day) ? ' has-post' : ''
          const clickableClass = isClickable ? ' clickable' : ''

          return (
            <div
              key={`day-${day}`}
              className={`calendar-cell${todayClass}${hasPostClass}${clickableClass}`}
              onClick={() => handleDateClick(day)}
              title={isClickable ? `查看${month + 1}月${day}日的文章` : ''}
            >
              <span className="calendar-day">{day}</span>
              {hasPost(day) && <span className="calendar-dot" />}
            </div>
          )
        })}
      </div>

      <div className="calendar-footer">
        <span className="calendar-hint">
          <span className="calendar-dot-footer" /> 有文章
        </span>
      </div>
    </div>
  )
}

export default Calendar
