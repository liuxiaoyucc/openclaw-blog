import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import axios from 'axios'

function MarkdownEditor({ value, onChange, placeholder = 'Write your story in Markdown...' }) {
  const [activeTab, setActiveTab] = useState('write') // 'write' | 'preview'
  const [uploading, setUploading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

  // 处理图片上传
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    // 检查文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const imageUrl = response.data.url
      insertImageMarkdown(imageUrl, file.name)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Image upload failed: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }, [value, cursorPosition])

  // 插入图片 Markdown
  const insertImageMarkdown = (url, altText = 'image') => {
    const textarea = document.getElementById('markdown-textarea')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const imageMarkdown = `\n![${altText}](${url})\n`
    
    const newValue = value.substring(0, start) + imageMarkdown + value.substring(end)
    onChange(newValue)
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + imageMarkdown.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      setCursorPosition(newCursorPos)
    }, 0)
  }

  // 处理拖放
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files[0])
    }
  }, [handleImageUpload])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // 处理粘贴
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        handleImageUpload(file)
        return
      }
    }
  }, [handleImageUpload])

  // 工具栏按钮
  const insertMarkdown = (syntax, placeholder = '') => {
    const textarea = document.getElementById('markdown-textarea')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    const insertText = selectedText || placeholder
    const newValue = value.substring(0, start) + syntax.replace('{}', insertText) + value.substring(end)
    
    onChange(newValue)
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + syntax.indexOf('{}') + insertText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const toolbarButtons = [
    { icon: '𝐁', title: 'Bold', action: () => insertMarkdown('**{}**', 'bold text') },
    { icon: '𝐼', title: 'Italic', action: () => insertMarkdown('*{}*', 'italic text') },
    { icon: 'H1', title: 'Heading 1', action: () => insertMarkdown('\n# {}\n', 'Heading') },
    { icon: 'H2', title: 'Heading 2', action: () => insertMarkdown('\n## {}\n', 'Heading') },
    { icon: 'H3', title: 'Heading 3', action: () => insertMarkdown('\n### {}\n', 'Heading') },
    { icon: '•', title: 'Bullet List', action: () => insertMarkdown('\n- {}\n', 'item') },
    { icon: '1.', title: 'Numbered List', action: () => insertMarkdown('\n1. {}\n', 'item') },
    { icon: '❝', title: 'Quote', action: () => insertMarkdown('\n> {}\n', 'quote') },
    { icon: '</>', title: 'Code', action: () => insertMarkdown('`{}`', 'code') },
    { icon: '```', title: 'Code Block', action: () => insertMarkdown('\n```\n{}\n```\n', 'code') },
    { icon: '🔗', title: 'Link', action: () => insertMarkdown('[{}](url)', 'link text') },
    { icon: '🌳', title: 'Directory Tree', action: () => insertMarkdown('\n```tree\nsrc/\n├── file1.txt\n└── folder/\n    └── file2.txt\n```\n', '') },
    { icon: '―', title: 'Horizontal Rule', action: () => insertMarkdown('\n---\n', '') },
  ]

  return (
    <div className="markdown-editor">
      {/* 工具栏 */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          {toolbarButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              className="toolbar-btn"
              title={btn.title}
              onClick={btn.action}
            >
              {btn.icon}
            </button>
          ))}
        </div>
        
        <div className="toolbar-divider"></div>
        
        <div className="toolbar-group">
          <label className="toolbar-btn upload-btn" title="Upload Image">
            {uploading ? '⏳' : '📷'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleImageUpload(e.target.files[0])}
              disabled={uploading}
            />
          </label>
        </div>
        
        <div className="toolbar-divider"></div>
        
        <div className="toolbar-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
            onClick={() => setActiveTab('write')}
          >
            Write
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="editor-body">
        {activeTab === 'write' ? (
          <div 
            className="editor-textarea-wrapper"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <textarea
              id="markdown-textarea"
              className="editor-textarea"
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                setCursorPosition(e.target.selectionStart)
              }}
              onPaste={handlePaste}
              placeholder={placeholder}
              spellCheck={false}
            />
            <div className="drop-overlay">
              <span>拖放图片到此处</span>
            </div>
          </div>
        ) : (
          <div className="editor-preview markdown-body">
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  img({ src, alt }) {
                    return (
                      <img 
                        src={src} 
                        alt={alt} 
                        className="markdown-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em">Image Error</text></svg>'
                        }}
                      />
                    )
                  }
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <div className="preview-placeholder">
                <span className="code-comment">// Nothing to preview yet...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="editor-footer">
        <span className="footer-hint">
          提示：拖拽或粘贴图片可直接上传
        </span>
        <span className="char-count">
          {value.length} 字符
        </span>
      </div>
    </div>
  )
}

export default MarkdownEditor
