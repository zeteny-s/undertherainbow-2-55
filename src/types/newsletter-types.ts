import { CampusType } from './form-types';

export interface Newsletter {
  id: string;
  title: string;
  description?: string | null;
  campus: CampusType;
  content_guidelines?: string | null;
  generated_html?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterForm {
  id: string;
  newsletter_id: string;
  form_id: string;
  created_at: string;
}

export interface NewsletterImage {
  id: string;
  newsletter_id: string;
  image_url: string;
  image_name: string;
  created_at: string;
}

export interface FormForSelection {
  id: string;
  title: string;
  description?: string | null;
  campus: CampusType;
  created_at: string;
}

export interface NewsletterGenerationRequest {
  newsletterId: string;
  title: string;
  campus: CampusType;
  contentGuidelines?: string;
  selectedForms: FormForSelection[];
  imageUrls: string[];
}