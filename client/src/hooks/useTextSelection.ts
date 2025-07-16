import { useState, useEffect, useCallback } from 'react';

interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export const useTextSelection = (textareaRef: React.RefObject<HTMLTextAreaElement>) => {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const updateSelection = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);

    if (start !== end || (start === end && text === '')) {
      setSelection({ start, end, text });
      
      // Calculate cursor position for toolbar placement
      const rect = textarea.getBoundingClientRect();
      const textBeforeCursor = textarea.value.substring(0, start);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const currentColumn = lines[currentLine].length;
      
      // Rough estimation of cursor position
      const lineHeight = 24; // Approximate line height
      const charWidth = 10; // Approximate character width
      
      setCursorPosition({
        x: rect.left + (currentColumn * charWidth),
        y: rect.top + (currentLine * lineHeight)
      });
    } else {
      setSelection(null);
    }
  }, [textareaRef]);

  const formatText = useCallback((type: string, level?: number) => {
    if (!textareaRef.current || !selection) return;

    const textarea = textareaRef.current;
    const { start, end, text } = selection;
    const value = textarea.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const fullLineEnd = lineEnd === -1 ? value.length : lineEnd;
    const currentLine = value.substring(lineStart, fullLineEnd);
    
    let newText = '';
    let newStart = start;
    let newEnd = end;

    switch (type) {
      case 'bold':
        newText = `**${text}**`;
        newEnd = start + newText.length;
        break;
        
      case 'italic':
        newText = `*${text}*`;
        newEnd = start + newText.length;
        break;
        
      case 'heading':
        if (level) {
          const headingPrefix = '#'.repeat(level) + ' ';
          // Remove existing heading if present
          const cleanLine = currentLine.replace(/^#+\s*/, '');
          newText = headingPrefix + cleanLine;
          const newValue = value.substring(0, lineStart) + newText + value.substring(fullLineEnd);
          textarea.value = newValue;
          textarea.setSelectionRange(lineStart + headingPrefix.length, lineStart + newText.length);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
        break;
        
      case 'unordered-list':
        if (currentLine.startsWith('- ')) {
          // Remove list formatting
          newText = currentLine.substring(2);
        } else {
          // Add list formatting
          newText = `- ${currentLine}`;
        }
        const newValue1 = value.substring(0, lineStart) + newText + value.substring(fullLineEnd);
        textarea.value = newValue1;
        textarea.setSelectionRange(lineStart, lineStart + newText.length);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
        
      case 'ordered-list':
        if (currentLine.match(/^\d+\.\s/)) {
          // Remove list formatting
          newText = currentLine.replace(/^\d+\.\s/, '');
        } else {
          // Add list formatting
          newText = `1. ${currentLine}`;
        }
        const newValue2 = value.substring(0, lineStart) + newText + value.substring(fullLineEnd);
        textarea.value = newValue2;
        textarea.setSelectionRange(lineStart, lineStart + newText.length);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
        
      default:
        return;
    }

    // Apply inline formatting (bold, italic)
    if (newText) {
      const newValue = value.substring(0, start) + newText + value.substring(end);
      textarea.value = newValue;
      textarea.setSelectionRange(newStart, newEnd);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [selection, textareaRef]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => {
      // Small delay to ensure selection is updated
      setTimeout(updateSelection, 10);
    };

    textarea.addEventListener('select', handleSelectionChange);
    textarea.addEventListener('click', handleSelectionChange);
    textarea.addEventListener('keyup', handleSelectionChange);

    return () => {
      textarea.removeEventListener('select', handleSelectionChange);
      textarea.removeEventListener('click', handleSelectionChange);
      textarea.removeEventListener('keyup', handleSelectionChange);
    };
  }, [updateSelection, textareaRef]);

  return {
    selection,
    cursorPosition,
    formatText
  };
};