import { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered,
  Table,
  Palette,
  Plus,
  Minus,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { FormForSelection } from '../../../types/newsletter-types';

interface AdvancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedForms?: FormForSelection[];
}

export const AdvancedRichTextEditor = ({ value, onChange, placeholder, selectedForms = [] }: AdvancedRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [textColor, setTextColor] = useState('#000000');
  const [showFormSelector, setShowFormSelector] = useState(false);

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
        // Very minimal cleaning - preserve ALL formatting like Google Docs
        content = htmlData;
        
        // Only remove potentially dangerous scripts and styles, but keep everything else
        content = content.replace(/<script[^>]*>.*?<\/script>/gis, '');
        content = content.replace(/<style[^>]*>.*?<\/style>/gis, '');
        content = content.replace(/<link[^>]*>/gi, '');
        content = content.replace(/javascript:/gi, '');
        content = content.replace(/on\w+\s*=\s*"[^"]*"/gi, ''); // Remove event handlers
        
        // Remove only the document structure tags but keep ALL content and formatting tags
        content = content.replace(/<\/?(?:html|head|body|title|meta)[^>]*>/gi, '');
        
        // Clean up any document-level styles that might interfere
        content = content.replace(/<!--.*?-->/gs, ''); // Remove comments
        
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
      
      // Insert the content directly using execCommand to maintain undo history
      if (content) {
        document.execCommand('insertHTML', false, content);
        handleInput();
      }
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

  const insertFormButton = (formId: string, formTitle: string) => {
    const buttonText = `Open ${formTitle}`;
    const buttonHtml = `<span class="inline-form-button" data-form-id="${formId}" data-button-text="${buttonText}" style="display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none; margin: 0 4px; cursor: pointer; border: none;">${buttonText}</span>`;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = buttonHtml;
        const buttonElement = tempDiv.firstChild;
        
        if (buttonElement) {
          range.insertNode(buttonElement);
          range.setStartAfter(buttonElement);
          range.setEndAfter(buttonElement);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // If no selection, insert at the end
        editorRef.current.insertAdjacentHTML('beforeend', buttonHtml);
      }
      
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    setShowFormSelector(false);
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

        {selectedForms.length > 0 && (
          <>
            <div className="h-6 w-px bg-border mx-1" />
            
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFormSelector(!showFormSelector)}
                className="h-8 px-3"
                title="Insert Form Button"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              {showFormSelector && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                  <div className="p-2 border-b text-sm font-medium text-gray-600">Insert Form Button:</div>
                  {selectedForms.map((form) => (
                    <button
                      key={form.id}
                      type="button"
                      onClick={() => insertFormButton(form.id, form.title)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      {form.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
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

        /* Preserve white space and line breaks */
        .rich-text-editor {
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        /* Better spacing for nested lists */
        .rich-text-editor ul ul,
        .rich-text-editor ol ol,
        .rich-text-editor ul ol,
        .rich-text-editor ol ul {
          margin: 0;
          padding-left: 20px;
        }

        /* Preserve font styles from pasted content */
        .rich-text-editor [style*="font-family"],
        .rich-text-editor [style*="font-size"],
        .rich-text-editor [style*="color"],
        .rich-text-editor [style*="font-weight"] {
          /* Let inline styles take precedence */
        }

        /* Better spacing for different content blocks */
        .rich-text-editor div {
          margin: 4px 0;
        }

        .rich-text-editor span {
          /* Preserve inline formatting */
        }
      `}</style>
    </div>
  );
};
