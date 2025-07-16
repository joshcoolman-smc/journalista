import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const processedContent = useMemo(() => {
    if (!content.trim()) return '';
    
    // Split content into lines for better processing
    const lines = content.split('\n');
    const processed: string[] = [];
    let inCodeBlock = false;
    let inList = false;
    let listType = '';
    let listItems: string[] = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        const tag = listType === 'ordered' ? 'ol' : 'ul';
        processed.push(`<${tag}>${listItems.join('')}</${tag}>`);
        listItems = [];
        inList = false;
        listType = '';
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          processed.push('</code></pre>');
          inCodeBlock = false;
        } else {
          flushList();
          processed.push('<pre><code>');
          inCodeBlock = true;
        }
        continue;
      }
      
      if (inCodeBlock) {
        processed.push(line);
        continue;
      }
      
      // Handle headers
      if (line.startsWith('###### ')) {
        flushList();
        processed.push(`<h6>${line.substring(7)}</h6>`);
        continue;
      }
      if (line.startsWith('##### ')) {
        flushList();
        processed.push(`<h5>${line.substring(6)}</h5>`);
        continue;
      }
      if (line.startsWith('#### ')) {
        flushList();
        processed.push(`<h4>${line.substring(5)}</h4>`);
        continue;
      }
      if (line.startsWith('### ')) {
        flushList();
        processed.push(`<h3>${line.substring(4)}</h3>`);
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        processed.push(`<h2>${line.substring(3)}</h2>`);
        continue;
      }
      if (line.startsWith('# ')) {
        flushList();
        processed.push(`<h1>${line.substring(2)}</h1>`);
        continue;
      }
      
      // Handle blockquotes
      if (line.startsWith('> ')) {
        flushList();
        processed.push(`<blockquote>${line.substring(2)}</blockquote>`);
        continue;
      }
      
      // Handle unordered lists
      if (line.match(/^[\s]*[-*+]\s+/)) {
        const content = line.replace(/^[\s]*[-*+]\s+/, '');
        if (!inList || listType !== 'unordered') {
          flushList();
          inList = true;
          listType = 'unordered';
        }
        listItems.push(`<li>${content}</li>`);
        continue;
      }
      
      // Handle ordered lists
      if (line.match(/^[\s]*\d+\.\s+/)) {
        const content = line.replace(/^[\s]*\d+\.\s+/, '');
        if (!inList || listType !== 'ordered') {
          flushList();
          inList = true;
          listType = 'ordered';
        }
        listItems.push(`<li>${content}</li>`);
        continue;
      }
      
      // If we were in a list and this line doesn't continue it, flush the list
      if (inList && !line.match(/^[\s]*[-*+\d]/)) {
        flushList();
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        if (!inList) {
          processed.push('<br>');
        }
        continue;
      }
      
      // Handle regular paragraphs
      if (!inList) {
        processed.push(`<p>${line}</p>`);
      }
    }
    
    // Flush any remaining list
    flushList();
    
    // Join all processed lines
    let result = processed.join('\n');
    
    // Process inline formatting
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    result = result.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return result;
  }, [content]);

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};
