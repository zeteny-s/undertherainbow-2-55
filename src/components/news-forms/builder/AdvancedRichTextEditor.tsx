import { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Table, Palette, Plus, Minus
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface AdvancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const AdvancedRichTextEditor = ({ value, onChange, placeholder }: AdvancedRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [textColor, setTextColor] = useState('#000000');

  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
    'Calibri', 'Tahoma', 'Comic Sans MS', 'Impact', 'Trebuchet MS'
  ];

  const sizes = [
    '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'
  ];

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    
    if (editorRef.current) {
      let content = '';
      
      if (htmlData) {
        // Preserve ALL formatting like Google Docs - minimal cleaning only
        content = htmlData;
        
        // Remove document structure but keep ALL content formatting
        content = content.replace(/<\/?(?:html|head|body|title|meta)[^>]*>/gi, '');
        content = content.replace(/<!--.*?-->/gs, ''); // Remove comments
        
        // Remove potentially dangerous content but preserve all visual formatting
        content = content.replace(/<script[^>]*>.*?<\/script>/gis, '');
        content = content.replace(/<link[^>]*>/gi, '');
        content = content.replace(/javascript:/gi, '');
        content = content.replace(/on\w+\s*=\s*"[^"]*"/gi, ''); // Remove event handlers
        
        // Keep ALL other tags: p, div, span, h1-h6, ul, ol, li, br, strong, em, u, s, table, tr, td, th, etc.
        // Keep ALL style attributes for spacing, colors, fonts, margins, etc.
        
        // Extract content from body if it exists, otherwise use as-is
        const bodyMatch = content.match(/<body[^>]*>(.*?)<\/body>/is);
        if (bodyMatch) {
          content = bodyMatch[1];
        }
        
      } else if (textData) {
        // For plain text, preserve line breaks and convert to HTML
        content = textData
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n\n+/g, '</p><p>')
          .replace(/\n/g, '<br>')
          .replace(/\r\n/g, '<br>')
          .replace(/\r/g, '<br>');
        content = '<p>' + content + '</p>';
      }
      
      // Insert content preserving selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(content);
        range.insertNode(fragment);
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: append to end
        editorRef.current.innerHTML += content;
      }
      
      // Trigger change event
      handleInput();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (command: string) => {
    execCommand(command);
  };

  const alignText = (alignment: string) => {
    execCommand('justify' + alignment);
  };

  const insertList = (ordered: boolean) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (rows && cols) {
      const numRows = parseInt(rows);
      const numCols = parseInt(cols);
      
      if (numRows > 0 && numCols > 0) {
        let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
        
        for (let i = 0; i < numRows; i++) {
          tableHtml += '<tr>';
          for (let j = 0; j < numCols; j++) {
            tableHtml += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 50px;">&nbsp;</td>';
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</table>';
        
        execCommand('insertHTML', tableHtml);
      }
    }
  };

  const changeFontFamily = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    execCommand('fontName', fontFamily);
  };

  const changeFontSize = (fontSize: string) => {
    setSelectedSize(fontSize);
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const span = document.createElement('span');
          span.style.fontSize = fontSize;
          try {
            range.surroundContents(span);
          } catch {
            span.appendChild(range.extractContents());
            range.insertNode(span);
          }
          handleInput();
        }
      }
    }
  };

  const changeTextColor = (color: string) => {
    setTextColor(color);
    execCommand('foreColor', color);
  };

  const increaseFontSize = () => {
    execCommand('increaseFontSize');
  };

  const decreaseFontSize = () => {
    execCommand('decreaseFontSize');
  };

  return (
    <div className="border-2 border-border rounded-lg bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-surface">
        {/* Font Family */}
        <Select value={selectedFont} onValueChange={changeFontFamily}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map(font => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select value={selectedSize} onValueChange={changeFontSize}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {sizes.map(size => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size Controls */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={increaseFontSize}
          className="h-8 w-8 p-0"
          title="Increase Font Size"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={decreaseFontSize}
          className="h-8 w-8 p-0"
          title="Decrease Font Size"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Basic Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        {/* Text Color */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={textColor}
            onChange={(e) => changeTextColor(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Text Color"
          />
          <Palette className="h-4 w-4 text-gray-600" />
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('Left')}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('Center')}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('Right')}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList(false)}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList(true)}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Table */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTable}
          className="h-8 w-8 p-0"
          title="Insert Table"
        >
          <Table className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[200px] p-4 text-foreground focus:outline-none rich-text-editor"
        style={{ wordBreak: 'break-word' }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      <style>{`
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--foreground-muted));
          pointer-events: none;
        }

        /* Preserve ALL pasted formatting - like Google Docs */
        .rich-text-editor * {
          /* Allow all inline styles to be preserved */
        }

        .rich-text-editor ul,
        .rich-text-editor ol {
          margin: 10px 0;
          padding-left: 25px;
        }

        .rich-text-editor ul {
          list-style-type: disc;
        }

        .rich-text-editor ol {
          list-style-type: decimal;
        }

        .rich-text-editor li {
          margin: 5px 0;
          display: list-item;
          list-style-position: outside;
        }

        .rich-text-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }

        .rich-text-editor td,
        .rich-text-editor th {
          border: 1px solid #ccc;
          padding: 8px;
          min-width: 50px;
        }

        .rich-text-editor th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        .rich-text-editor p {
          margin: 8px 0;
          line-height: 1.4;
        }

        .rich-text-editor h1,
        .rich-text-editor h2,
        .rich-text-editor h3,
        .rich-text-editor h4,
        .rich-text-editor h5,
        .rich-text-editor h6 {
          margin: 12px 0 8px 0;
          font-weight: bold;
          line-height: 1.2;
        }

        .rich-text-editor h1 { font-size: 2em; }
        .rich-text-editor h2 { font-size: 1.5em; }
        .rich-text-editor h3 { font-size: 1.17em; }
        .rich-text-editor h4 { font-size: 1em; }
        .rich-text-editor h5 { font-size: 0.83em; }
        .rich-text-editor h6 { font-size: 0.67em; }

        .rich-text-editor strong,
        .rich-text-editor b {
          font-weight: bold;
        }

        .rich-text-editor em,
        .rich-text-editor i {
          font-style: italic;
        }

        .rich-text-editor u {
          text-decoration: underline;
        }

        .rich-text-editor a {
          color: #0066cc;
          text-decoration: underline;
        }

        .rich-text-editor a:hover {
          color: #0056b3;
        }

        /* Preserve white space and line breaks exactly like Google Docs */
        .rich-text-editor {
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        /* Better spacing for nested lists */
        .rich-text-editor ul ul,
        .rich-text-editor ol ol,
        .rich-text-editor ul ol,
        .rich-text-editor ol ul {
          margin: 0;
          padding-left: 20px;
        }

        /* Let pasted styles take precedence - like Google Docs */
        .rich-text-editor [style] {
          /* Preserve all inline styles from pasted content */
        }

        /* Preserve dividers and spacing */
        .rich-text-editor hr {
          margin: 12px 0;
        }

        /* Preserve table formatting from pasted content */
        .rich-text-editor table[style] {
          /* Allow pasted table styles */
        }

        .rich-text-editor td[style],
        .rich-text-editor th[style] {
          /* Allow pasted cell styles */
        }

        /* Preserve spacing and layout from pasted content */
        .rich-text-editor div,
        .rich-text-editor span {
          /* Allow all div and span styles from pasted content */
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        /* Ensure long words break to prevent overflow */
        .rich-text-editor * {
          max-width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      `}</style>
    </div>
  );
};
