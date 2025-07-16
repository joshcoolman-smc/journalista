import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Type
} from 'lucide-react';

interface FormattingToolbarProps {
  onFormat: (type: string, level?: number) => void;
  position: { x: number; y: number };
  visible: boolean;
}

export const FormattingToolbar = ({ onFormat, position, visible }: FormattingToolbarProps) => {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowHeadingMenu(false);
    }
  }, [visible]);

  if (!visible) return null;

  const formatButtons = [
    { icon: Bold, action: 'bold', tooltip: 'Bold' },
    { icon: Italic, action: 'italic', tooltip: 'Italic' },
    { icon: List, action: 'unordered-list', tooltip: 'Bullet List' },
    { icon: ListOrdered, action: 'ordered-list', tooltip: 'Numbered List' },
  ];

  const headingButtons = [
    { icon: Heading1, level: 1, tooltip: 'Heading 1' },
    { icon: Heading2, level: 2, tooltip: 'Heading 2' },
    { icon: Heading3, level: 3, tooltip: 'Heading 3' },
    { icon: Heading4, level: 4, tooltip: 'Heading 4' },
    { icon: Heading5, level: 5, tooltip: 'Heading 5' },
    { icon: Heading6, level: 6, tooltip: 'Heading 6' },
  ];

  return (
    <div
      className="fixed z-50 flex items-center rounded-lg shadow-lg border transition-zen"
      style={{
        left: position.x,
        top: position.y - 50,
        backgroundColor: 'var(--zen-bg-secondary)',
        borderColor: 'var(--zen-border)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Format buttons */}
      {formatButtons.map(({ icon: Icon, action, tooltip }) => (
        <Button
          key={action}
          variant="ghost"
          size="sm"
          onClick={() => onFormat(action)}
          className="h-8 w-8 p-1.5 hover:bg-opacity-20 transition-zen"
          style={{ color: 'var(--zen-text-secondary)' }}
          title={tooltip}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}

      {/* Heading dropdown */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className="h-8 w-8 p-1.5 hover:bg-opacity-20 transition-zen"
          style={{ color: 'var(--zen-text-secondary)' }}
          title="Headings"
        >
          <Type className="h-4 w-4" />
        </Button>

        {showHeadingMenu && (
          <div
            className="absolute top-full mt-1 right-0 rounded-lg border shadow-lg p-1 min-w-32"
            style={{
              backgroundColor: 'var(--zen-bg-secondary)',
              borderColor: 'var(--zen-border)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            {headingButtons.map(({ icon: Icon, level, tooltip }) => (
              <Button
                key={level}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onFormat('heading', level);
                  setShowHeadingMenu(false);
                }}
                className="w-full justify-start h-8 p-2 hover:bg-opacity-20 transition-zen"
                style={{ color: 'var(--zen-text-secondary)' }}
                title={tooltip}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="text-xs">{tooltip}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};