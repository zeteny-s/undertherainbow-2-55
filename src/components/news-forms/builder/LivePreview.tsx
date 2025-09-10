import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Form, FormComponent } from '../../../types/form-types';
import { FormRenderer } from '../components/FormRenderer';

interface LivePreviewProps {
  form: Form;
  components: FormComponent[];
}

export const LivePreview = ({ form, components }: LivePreviewProps) => {
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  const handleFieldChange = (fieldId: string, value: any) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="border-b p-4 bg-card">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <h3 className="font-semibold">Live Preview</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          See how users will view this form
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Mock header */}
          <div className="mb-8 text-center">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="h-16 bg-gray-200 rounded mb-4 mx-auto w-32 flex items-center justify-center">
                <span className="text-xs text-gray-500">Logo</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.campus} Campus</h1>
              <p className="text-gray-600">Child Protection Services</p>
            </div>
          </div>

          {/* Form preview */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-2xl font-bold">
                {form.title || 'Form Title'}
              </CardTitle>
              {form.description && (
                <p className="text-muted-foreground mt-2">{form.description}</p>
              )}
            </CardHeader>
            <CardContent className="p-8">
              {components.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No components on the form yet</p>
                  <p className="text-sm mt-2">Drag components from the left sidebar</p>
                </div>
              ) : (
                <form className="space-y-6">
                  <FormRenderer
                    components={components}
                    values={previewData}
                    onChange={handleFieldChange}
                  />
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};