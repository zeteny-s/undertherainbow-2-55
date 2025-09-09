import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, User, Shield, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../contexts/SettingsContext';

interface LoginFormProps {
  onToggleMode: () => void;
  isSignUp: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<'adminisztracio' | 'pedagogus' | 'haz_vezeto' | 'vezetoi'>('adminisztracio');
  const [managerPassword, setManagerPassword] = useState('');
  const [showManagerPassword, setShowManagerPassword] = useState(false);
  const [house, setHouse] = useState<'Feketerigo' | 'Torockó' | 'Levél'>('Feketerigo');
  const [selectedLanguage, setSelectedLanguage] = useState<'hu' | 'en'>('hu');

  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const { updateSettings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Validate required fields for sign up
        if (!email.trim()) {
          throw new Error(t('auth.errors.emailRequired'));
        }
        if (!password || password.length < 6) {
          throw new Error(t('auth.errors.passwordMinLength'));
        }
        if (!name.trim()) {
          throw new Error(t('auth.errors.nameRequired'));
        }
        if (profileType === 'vezetoi' && managerPassword !== 'Finance123') {
          throw new Error(t('auth.errors.wrongManagerPassword'));
        }
        if (profileType === 'haz_vezeto' && managerPassword !== 'House123') {
          throw new Error(t('auth.errors.wrongHouseLeaderPassword'));
        }

        // Update language setting before signup
        updateSettings({ language: selectedLanguage });

        console.log('Attempting to sign up user:', { email, name });
        const { error } = await signUp(email.trim(), password, name.trim(), profileType);

        if (error) {
          console.error('Sign up error:', error);
          
          // Handle specific error cases
          if (error.message.includes('User already registered') || 
              error.message.includes('user_already_exists') ||
              error.message.includes('already_registered')) {
            setError(t('auth.errors.userAlreadyExists'));
            // Automatically switch to login mode after a short delay
            setTimeout(() => {
              onToggleMode();
              setError(null);
            }, 2000);
          } else if (error.message.includes('Invalid email')) {
            setError(t('auth.errors.invalidEmail'));
          } else if (error.message.includes('Password')) {
            setError(t('auth.errors.passwordRequirements'));
          } else if (error.message.includes('signup_disabled')) {
            setError(t('auth.errors.signupDisabled'));
          } else {
            setError(`${t('auth.errors.registrationFailed')}: ${error.message}`);
          }
        } else {
          // Registration successful
          console.log('Registration successful');
          setError(null);
          // Note: With email confirmation disabled, user should be automatically signed in
          // If not, we can show a success message and switch to login
        }
      } else {
        // Sign in
        if (!email.trim()) {
          throw new Error(t('auth.errors.emailRequired'));
        }
        if (!password) {
          throw new Error(t('auth.errors.loginRequired'));
        }

        console.log('Attempting to sign in user:', email);
        const { error } = await signIn(email.trim(), password);

        if (error) {
          console.error('Sign in error:', error);
          
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('invalid_credentials')) {
            setError(t('auth.errors.invalidCredentials'));
          } else if (error.message.includes('Email not confirmed')) {
            setError(t('auth.errors.emailNotConfirmed'));
          } else if (error.message.includes('Too many requests')) {
            setError(t('auth.errors.tooManyRequests'));
          } else {
            setError(`${t('auth.errors.loginFailed')}: ${error.message}`);
          }
        } else {
          console.log('Sign in successful');
          setError(null);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : t('auth.errors.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <LogIn className="h-8 w-8 text-blue-800" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSignUp ? t('auth.signup') : t('auth.login')}
            </h1>
            <p className="text-gray-600">
              {t('auth.companySystem')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.language')} {t('auth.required')}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      id="language"
                      value={selectedLanguage}
                      onChange={(e) => {
                        setSelectedLanguage(e.target.value as 'hu' | 'en');
                        updateSettings({ language: e.target.value as 'hu' | 'en' });
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
                    >
                      <option value="hu">{t('auth.languages.hu')}</option>
                      <option value="en">{t('auth.languages.en')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.name')} {t('auth.required')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder={t('auth.namePlaceholder')}
                    />
                  </div>
                </div>
              </>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="profileType" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.profileType')} {t('auth.required')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="profileType"
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value as 'adminisztracio' | 'pedagogus' | 'haz_vezeto' | 'vezetoi')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
                  >
                    <option value="adminisztracio">{t('auth.profileTypes.adminisztracio')}</option>
                    <option value="pedagogus">{t('auth.profileTypes.pedagogus')}</option>
                    <option value="haz_vezeto">{t('auth.profileTypes.haz_vezeto')}</option>
                    <option value="vezetoi">{t('auth.profileTypes.vezetoi')}</option>
                  </select>
                </div>
              </div>
            )}

            {isSignUp && profileType === 'haz_vezeto' && (
              <div>
                <label htmlFor="house" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.house')} {t('auth.required')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="house"
                    value={house}
                    onChange={(e) => setHouse(e.target.value as 'Feketerigo' | 'Torockó' | 'Levél')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
                  >
                    <option value="Feketerigo">{t('auth.houses.feketerigo')}</option>
                    <option value="Torockó">{t('auth.houses.torocko')}</option>
                    <option value="Levél">{t('auth.houses.level')}</option>
                  </select>
                </div>
              </div>
            )}

            {isSignUp && (profileType === 'vezetoi' || profileType === 'haz_vezeto') && (
              <div>
                <label htmlFor="managerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {profileType === 'vezetoi' ? t('auth.managerPassword') : t('auth.houseLeaderPassword')} {t('auth.required')}
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="managerPassword"
                    type={showManagerPassword ? 'text' : 'password'}
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder={profileType === 'vezetoi' ? t('auth.managerPassword') : t('auth.houseLeaderPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowManagerPassword(!showManagerPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showManagerPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')} {t('auth.required')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')} {t('auth.required')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  {t('auth.minPasswordLength')}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                  <span>{isSignUp ? t('auth.signup') : t('auth.login')}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onToggleMode}
              disabled={loading}
              className="text-sm text-blue-800 hover:text-blue-900 font-medium transition-colors disabled:opacity-50"
            >
              {isSignUp 
                ? t('auth.alreadyHaveAccount')
                : t('auth.noAccount')
              }
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {t('auth.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};
