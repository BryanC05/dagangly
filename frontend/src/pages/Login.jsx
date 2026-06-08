import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore, USE_FIREBASE_AUTH } from '../store/authStore';
import api from '../utils/api';
import { signInWithGoogle, signInWithFirebaseEmail } from '../utils/firebase';
import { getFriendlyAuthError } from '../utils/errorHelpers';
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
      setError(getFriendlyAuthError(err));
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
      setError(getFriendlyAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary via-primary to-emerald-400 flex items-center justify-center shadow-2xl rotate-3">
            <span className="text-primary-foreground font-display font-black text-3xl">D</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{t('auth.welcomeBack')}</h1>
          <p className="text-base text-muted-foreground mt-2">{t('auth.loginDesc')}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-bold p-4 rounded-2xl mb-6 border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-muted-foreground ml-1">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-muted-foreground ml-1">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.enterPassword')}
                className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2 ml-1">
            <input 
              type="checkbox" 
              id="useFirebase" 
              checked={useFirebase} 
              onChange={() => setUseFirebase(!useFirebase)}
              className="w-5 h-5 accent-primary cursor-pointer rounded-lg"
            />
            <label htmlFor="useFirebase" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
              Login via Firebase Provider
            </label>
          </div>

          <Button type="submit" className="w-full h-12 gap-2 text-base font-black rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
            {isLoading ? t('auth.loggingIn') : t('auth.login')}
            {!isLoading && <ArrowRight className="h-5 w-5" />}
          </Button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted/50" />
          </div>
          <div className="relative flex justify-center text-xs font-black uppercase tracking-widest">
            <span className="bg-background px-6 text-muted-foreground">Or connect with</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          type="button" 
          className="w-full h-12 gap-3 bg-white hover:bg-muted/30 transition-all border-border rounded-xl font-bold shadow-sm" 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          <span className="font-medium text-foreground">Sign in with Google</span>
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
