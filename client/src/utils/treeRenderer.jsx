import React from 'react';

// 将文本中的目录树格式转换为 JSX
export function renderTree(text) {
  const lines = text.split('\n');
  
  return lines.map((line, index) => {
    // 匹配目录树行: ├──, └──, │, 等
    const treeMatch = line.match(/^[\s│]*([├└]──\s*)(.*)$/);
    
    if (treeMatch) {
      const prefix = line.substring(0, line.indexOf(treeMatch[2]));
      const content = treeMatch[2];
      
      return (
        <div key={index} className="tree-line">
          <span className="tree-prefix">{prefix}</span>
          <span className="tree-content">{content}</span>
        </div>
      );
    }
    
    return <div key={index}>{line}</div>;
  });
}

// 检查文本是否包含目录树
export function containsTree(text) {
  return /[├└│├──└──]/.test(text);
}
