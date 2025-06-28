import React, { useState } from 'react';
import { LoginForm } from './LoginForm';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return <LoginForm onToggleMode={toggleMode} isSignUp={isSignUp} />;
};