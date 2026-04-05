import { useState, useEffect } from 'react'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function Calendar({ onDateClick, archiveData }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [postDates, setPostDates] = useState(new Set()) // { '2026-04-05': true }

  // 监听 archiveData 变化，根据每篇文章的 createdAt 精确标记日期
  useEffect(() => {
    if (!archiveData || Object.keys(archiveData).length === 0) return
    
    const dates = new Set()
    Object.keys(archiveData).forEach(year => {
      Object.keys(archiveData[year]).forEach(month => {
        // 遍历该月的每篇文章，提取具体日期
        archiveData[year][month].forEach(post => {
          const date = new Date(post.createdAt)
          const day = date.getDate()
          dates.add(`${year}-${month}-${String(day).padStart(2, '0')}`)
        })
      })
    })
    setPostDates(dates)
  }, [archiveData])

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
