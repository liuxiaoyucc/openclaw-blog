import './Pagination.css'

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize, 
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30]
}) {
  const getPageNumbers = () => {
    const pages = []
    const showPages = 5 // 最多显示5个页码
    
    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 始终显示第一页
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // 始终显示最后一页
      pages.push(totalPages)
    }
    
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="code-comment">// </span>
        <span>每页显示</span>
        <select 
          value={pageSize} 
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="page-size-select"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>条</span>
        <span className="pagination-total">
          (共 <span className="total-count">{totalPages}</span> 页)
        </span>
      </div>

      <div className="pagination-controls">
        {/* 首页 */}
        <button 
          className="btn btn-secondary pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="首页"
        >
          <span className="code-function">first</span>()
        </button>

        {/* 上一页 */}
        <button 
          className="btn btn-secondary pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="上一页"
        >
          <span className="code-function">prev</span>()
        </button>

        {/* 页码 */}
        <div className="page-numbers">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>
            ) : (
              <button
                key={page}
                className={`btn pagination-num ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* 下一页 */}
        <button 
          className="btn btn-secondary pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="下一页"
        >
          <span className="code-function">next</span>()
        </button>

        {/* 末页 */}
        <button 
          className="btn btn-secondary pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="末页"
        >
          <span className="code-function">last</span>()
        </button>
      </div>

      {/* 跳转 */}
      <div className="pagination-jump">
        <span className="code-comment">// </span>
        <span>跳转到</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value)
            if (page >= 1 && page <= totalPages) {
              onPageChange(page)
            }
          }}
          className="page-jump-input"
        />
        <span>页</span>
      </div>
    </div>
  )
}

export default Pagination
