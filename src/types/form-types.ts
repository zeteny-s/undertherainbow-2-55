export type CampusType = 'Feketerigó' | 'Torockó' | 'Levél';
export type FormStatus = 'active' | 'inactive' | 'draft';

export interface FormComponent {
  id: string;
  type: ComponentType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: ValidationRule[];
  properties?: Record<string, any>;
}

export type ComponentType = 
  | 'text-input'
  | 'textarea' 
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'file-upload'
  | 'text-block'
  | 'divider'
  | 'calendar-button';

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength';
  value?: number;
  message: string;
}

export interface Form {
  id: string;
  title: string;
  description?: string | null;
  campus: CampusType;
  status: FormStatus;
  form_components: FormComponent[];
  created_by: string;
  created_at: string;
  updated_at: string;
  capacity?: number | null;
  unlimited_capacity?: boolean | null;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  submission_data: Record<string, any>;
  submitted_at: string;
  ip_address?: string;
  family_name?: string;
}

export interface ComponentLibraryItem {
  type: ComponentType;
  name: string;
  icon: string;
  description: string;
  defaultConfig: Partial<FormComponent>;
}