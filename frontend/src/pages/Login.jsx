import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore, USE_FIREBASE_AUTH } from '../store/authStore';
import api from '../utils/api';
import { signInWithGoogle, signInWithFirebaseEmail } from '../utils/firebase';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useFirebase, setUseFirebase] = useState(USE_FIREBASE_AUTH);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let token, user;

      if (useFirebase) {
        // Step 1: Login to Firebase
        const idToken = await signInWithFirebaseEmail(email, password);
        // Step 2: Exchange for backend JWT
        const response = await api.post('/auth/social-login', { idToken });
        token = response?.data?.token;
        user = response?.data?.user;
      } else {
        // Standard backend login
        const response = await api.post('/auth/login', { email, password });
        token = response?.data?.token;
        user = response?.data?.user;
      }

      if (!token) {
        throw new Error("Invalid authentication token received");
      }

      setAuth(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const idToken = await signInWithGoogle();
      const response = await api.post('/auth/social-login', { idToken });
      const token = response?.data?.token;
      const user = response?.data?.user;

      if (!token) {
        throw new Error("Invalid authentication token received");
      }

      setAuth(user, token);
      navigate('/');
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.message || err.message || 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary via-primary to-emerald-400 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-display font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.loginDesc')}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-5 border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="h-11 text-sm bg-surface"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.enterPassword')}
                className="h-11 text-sm bg-surface pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input 
              type="checkbox" 
              id="useFirebase" 
              checked={useFirebase} 
              onChange={() => setUseFirebase(!useFirebase)}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="useFirebase" className="text-xs text-muted-foreground cursor-pointer">
              Login via Firebase (Optional)
            </label>
          </div>

          <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
            {isLoading ? t('auth.loggingIn') : t('auth.login')}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          type="button" 
          className="w-full h-11 gap-2 bg-surface" 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-3.23 3.28-7.76 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
