import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { RichTextEditor } from '../builder/RichTextEditor';
import { NewsletterComponent } from '../../../types/newsletter-builder-types';

interface NewsletterComponentEditorProps {
  component: NewsletterComponent;
  onUpdate: (component: NewsletterComponent) => void;
  onClose: () => void;
}

export const NewsletterComponentEditor: React.FC<NewsletterComponentEditorProps> = ({
  component,
  onUpdate,
  onClose
}) => {
  const [editedComponent, setEditedComponent] = useState<NewsletterComponent>(component);

  const handleSave = () => {
    onUpdate(editedComponent);
    onClose();
  };

  const updateContent = (key: string, value: any) => {
    setEditedComponent(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [key]: value
      }
    }));
  };

  const renderEditor = () => {
    switch (editedComponent.type) {
      case 'heading':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="heading-text">Heading Text</Label>
              <Input
                id="heading-text"
                value={editedComponent.content.text}
                onChange={(e) => updateContent('text', e.target.value)}
                placeholder="Enter heading text"
              />
            </div>
            <div>
              <Label htmlFor="heading-level">Heading Level</Label>
              <Select value={editedComponent.content.level?.toString()} onValueChange={(value) => updateContent('level', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">H1 (Largest)</SelectItem>
                  <SelectItem value="2">H2</SelectItem>
                  <SelectItem value="3">H3</SelectItem>
                  <SelectItem value="4">H4</SelectItem>
                  <SelectItem value="5">H5</SelectItem>
                  <SelectItem value="6">H6 (Smallest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="heading-align">Text Alignment</Label>
              <Select value={editedComponent.content.textAlign} onValueChange={(value) => updateContent('textAlign', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="heading-color">Text Color</Label>
              <Input
                id="heading-color"
                type="color"
                value={editedComponent.content.color}
                onChange={(e) => updateContent('color', e.target.value)}
              />
            </div>
          </div>
        );

      case 'text-block':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-content">Content</Label>
              <RichTextEditor
                value={editedComponent.content.content}
                onChange={(value) => updateContent('content', value)}
                placeholder="Enter your text content"
              />
            </div>
            <div>
              <Label htmlFor="text-size">Font Size</Label>
              <Select value={editedComponent.content.fontSize} onValueChange={(value) => updateContent('fontSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">12px (Small)</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px (Default)</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px (Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="text-align">Text Alignment</Label>
              <Select value={editedComponent.content.textAlign} onValueChange={(value) => updateContent('textAlign', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={editedComponent.content.url}
                onChange={(e) => updateContent('url', e.target.value)}
                placeholder="Enter image URL or upload"
              />
            </div>
            <div>
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={editedComponent.content.alt}
                onChange={(e) => updateContent('alt', e.target.value)}
                placeholder="Describe the image"
              />
            </div>
            <div>
              <Label htmlFor="image-width">Width</Label>
              <Input
                id="image-width"
                value={editedComponent.content.width}
                onChange={(e) => updateContent('width', e.target.value)}
                placeholder="e.g., 100%, 400px"
              />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={editedComponent.content.text}
                onChange={(e) => updateContent('text', e.target.value)}
                placeholder="Enter button text"
              />
            </div>
            <div>
              <Label htmlFor="button-url">Link URL</Label>
              <Input
                id="button-url"
                value={editedComponent.content.url}
                onChange={(e) => updateContent('url', e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <Label htmlFor="button-bg">Background Color</Label>
              <Input
                id="button-bg"
                type="color"
                value={editedComponent.content.backgroundColor}
                onChange={(e) => updateContent('backgroundColor', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="button-size">Size</Label>
              <Select value={editedComponent.content.size} onValueChange={(value) => updateContent('size', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="divider-style">Style</Label>
              <Select value={editedComponent.content.style} onValueChange={(value) => updateContent('style', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="divider-color">Color</Label>
              <Input
                id="divider-color"
                type="color"
                value={editedComponent.content.color}
                onChange={(e) => updateContent('color', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="divider-thickness">Thickness</Label>
              <Select value={editedComponent.content.thickness} onValueChange={(value) => updateContent('thickness', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1px">1px (Thin)</SelectItem>
                  <SelectItem value="2px">2px</SelectItem>
                  <SelectItem value="3px">3px (Thick)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return <div>No editor available for this component type</div>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <Card className="flex-1 rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b">
          <CardTitle className="text-lg">
            Edit {editedComponent.type.replace('-', ' ')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 flex-1 overflow-y-auto">
          {renderEditor()}
          
          <div className="flex gap-2 mt-6 pt-6 border-t">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};