import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { PasswordGate } from './PasswordGate';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [hasCompanyAccess, setHasCompanyAccess] = useState(false);

  useEffect(() => {
    // Check if user already has company access in this session
    const companyAccess = sessionStorage.getItem('company-access');
    console.log('AuthPage: Checking company access in sessionStorage:', companyAccess);
    if (companyAccess === 'granted') {
      console.log('AuthPage: Company access granted, setting hasCompanyAccess to true');
      setHasCompanyAccess(true);
    }
  }, []);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  const handlePasswordCorrect = () => {
    console.log('AuthPage: handlePasswordCorrect called, setting hasCompanyAccess to true');
    setHasCompanyAccess(true);
  };

  // Show password gate first, then auth form
  if (!hasCompanyAccess) {
    return <PasswordGate onPasswordCorrect={handlePasswordCorrect} />;
  }

  return <LoginForm onToggleMode={toggleMode} isSignUp={isSignUp} />;
};