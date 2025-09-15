import { CampusType } from './form-types';

export interface NewsletterComponent {
  id: string;
  type: NewsletterComponentType;
  content: any;
  position: number;
}

export type NewsletterComponentType = 
  | 'text-block'
  | 'image' 
  | 'heading'
  | 'divider'
  | 'button'
  | 'form-section'
  | 'calendar-button';

export interface NewsletterBuilderState {
  id?: string;
  title: string;
  description?: string;
  campus: CampusType;
  components: NewsletterComponent[];
  selectedFormIds: string[];
}

export interface NewsletterTextBlock {
  content: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

export interface NewsletterImage {
  url: string;
  alt: string;
  width?: string;
  height?: string;
}

export interface NewsletterHeading {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

export interface NewsletterButton {
  text: string;
  url: string;
  backgroundColor?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface NewsletterDivider {
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  thickness?: string;
}

export interface NewsletterFormSection {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonPosition?: 'left' | 'center' | 'right';
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  backgroundColor?: string;
  textColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  borderRadius?: string;
  padding?: string;
  showDescription?: boolean;
  customMessage?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}