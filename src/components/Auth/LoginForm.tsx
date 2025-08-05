import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
  const [profileType, setProfileType] = useState<'irodai' | 'vezetoi'>('irodai');
  const [managerPassword, setManagerPassword] = useState('');
  const [showManagerPassword, setShowManagerPassword] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Validate required fields for sign up
        if (!email.trim()) {
          throw new Error('E-mail cím megadása kötelező');
        }
        if (!password || password.length < 6) {
          throw new Error('A jelszónak legalább 6 karakter hosszúnak kell lennie');
        }
        if (!name.trim()) {
          throw new Error('Név megadása kötelező');
        }
        if (profileType === 'vezetoi' && managerPassword !== 'Finance123.') {
          throw new Error('Hibás vezetői jelszó');
        }

        console.log('Attempting to sign up user:', { email, name });
        const { error } = await signUp(email.trim(), password, name.trim(), profileType);

        if (error) {
          console.error('Sign up error:', error);
          
          // Handle specific error cases
          if (error.message.includes('User already registered') || 
              error.message.includes('user_already_exists') ||
              error.message.includes('already_registered')) {
            setError('Ez az e-mail cím már regisztrálva van. Kérjük, jelentkezzen be helyette.');
            // Automatically switch to login mode after a short delay
            setTimeout(() => {
              onToggleMode();
              setError(null);
            }, 2000);
          } else if (error.message.includes('Invalid email')) {
            setError('Érvénytelen e-mail cím formátum');
          } else if (error.message.includes('Password')) {
            setError('A jelszó nem felel meg a követelményeknek');
          } else if (error.message.includes('signup_disabled')) {
            setError('A regisztráció jelenleg nem elérhető');
          } else {
            setError(`Regisztráció sikertelen: ${error.message}`);
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
          throw new Error('E-mail cím megadása kötelező');
        }
        if (!password) {
          throw new Error('Jelszó megadása kötelező');
        }

        console.log('Attempting to sign in user:', email);
        const { error } = await signIn(email.trim(), password);

        if (error) {
          console.error('Sign in error:', error);
          
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('invalid_credentials')) {
            setError('Hibás e-mail cím vagy jelszó. Kérjük, ellenőrizze az adatokat.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Kérjük, erősítse meg e-mail címét a regisztráció befejezéséhez.');
          } else if (error.message.includes('Too many requests')) {
            setError('Túl sok próbálkozás. Kérjük, várjon egy kicsit és próbálja újra.');
          } else {
            setError(`Bejelentkezés sikertelen: ${error.message}`);
          }
        } else {
          console.log('Sign in successful');
          setError(null);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Váratlan hiba történt. Kérjük, próbálja újra.');
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
              {isSignUp ? 'Regisztráció' : 'Bejelentkezés'}
            </h1>
            <p className="text-gray-600">
              Feketerigó Alapítvány számla kezelő rendszer
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
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Teljes név *
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
                    placeholder="Kovács János"
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="profileType" className="block text-sm font-medium text-gray-700 mb-2">
                  Profil típus *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="profileType"
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value as 'irodai' | 'vezetoi')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white"
                  >
                    <option value="irodai">Irodai Profil</option>
                    <option value="vezetoi">Vezetői Profil</option>
                  </select>
                </div>
              </div>
            )}

            {isSignUp && profileType === 'vezetoi' && (
              <div>
                <label htmlFor="managerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Vezetői jelszó *
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
                    placeholder="Vezetői hozzáférési jelszó"
                  />
                  <button
                    type="button"
                    onClick={() => setShowManagerPassword(!showManagerPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showManagerPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Vezetői profil létrehozásához szükséges speciális jelszó
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail cím *
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
                  placeholder="pelda@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Jelszó *
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
                  placeholder="••••••••"
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
                  Minimum 6 karakter hosszú jelszó szükséges
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
                  <span>{isSignUp ? 'Regisztráció' : 'Bejelentkezés'}</span>
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
                ? 'Már van fiókja? Jelentkezzen be' 
                : 'Nincs még fiókja? Regisztráljon'
              }
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Feketerigó Alapítvány számla kezelő rendszer. Minden jog fenntartva.
          </p>
        </div>
      </div>
    </div>
  );
};
