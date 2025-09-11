import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PublicFormPage } from './components/news-forms/PublicFormPage.tsx';
import './index.css';

// Simple routing based on URL path
const Router = () => {
  const path = window.location.pathname;
  const formMatch = path.match(/^\/form\/(.+)$/);
  
  if (formMatch) {
    return <PublicFormPage formId={formMatch[1]} />;
  }
  
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>
);
