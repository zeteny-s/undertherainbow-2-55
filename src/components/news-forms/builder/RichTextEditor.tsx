import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '../../ui/button';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="border-2 border-border rounded-lg bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-surface">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          className="h-8 w-8 p-0 hover:bg-surface-hover"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          className="h-8 w-8 p-0 hover:bg-surface-hover"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          className="h-8 w-8 p-0 hover:bg-surface-hover"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-2" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('Left')}
          className="h-8 w-8 p-0 hover:bg-surface-hover"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('Center')}
          className="h-8 w-8 p-0 hover:bg-surface-hover"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('Right')}
          className="h-8 w-8 p-0 hover:bg-surface-hover"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[120px] p-4 text-foreground focus:outline-none rich-text-editor"
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
      `}</style>
    </div>
  );
};