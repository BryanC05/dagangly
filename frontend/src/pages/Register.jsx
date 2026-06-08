import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Building2, Store } from 'lucide-react';
import { useAuthStore, USE_FIREBASE_AUTH } from '../store/authStore';
import api from '../utils/api';
import { signInWithGoogle, registerWithFirebaseEmail } from '../utils/firebase';
import { getFriendlyAuthError } from '../utils/errorHelpers';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isSeller: false,
    businessName: '',
    businessType: 'micro',
    location: { address: '', city: '', state: '', pincode: '' },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
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
        // Step 1: Register in Firebase
        const idToken = await registerWithFirebaseEmail(formData.email, formData.password);
        
        // Step 2: Create profile in backend
        const payload = {
          idToken,
          name: formData.name,
          phone: formData.phone,
          isSeller: showBusiness,
          ...(showBusiness && {
            businessName: formData.businessName,
            businessType: formData.businessType,
            location: formData.location,
          }),
        };

        const response = await api.post('/auth/social-login', payload);
        token = response?.data?.token;
        user = response?.data?.user;
      } else {
        // Standard backend register
        const payload = {
          ...formData,
          isSeller: showBusiness,
          ...(showBusiness && {
            businessName: formData.businessName,
            businessType: formData.businessType,
            location: formData.location,
          }),
        };

        const response = await api.post('/auth/register', payload);
        token = response?.data?.token;
        user = response?.data?.user;
      }

      if (token) setAuth(user, token);
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
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary via-primary to-emerald-400 flex items-center justify-center shadow-2xl rotate-3">
            <span className="text-primary-foreground font-display font-black text-3xl">D</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{t('auth.createAccount')}</h1>
          <p className="text-base text-muted-foreground mt-2">{t('auth.createAccountDesc')}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-bold p-4 rounded-2xl mb-6 border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-muted-foreground ml-1">{t('auth.name')}</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all" placeholder={t('auth.enterName')} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-muted-foreground ml-1">{t('auth.email')}</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all" placeholder={t('auth.enterEmail')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-bold text-muted-foreground ml-1">{t('auth.phone')}</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all" placeholder={t('auth.enterPhone')} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-muted-foreground ml-1">{t('auth.password')}</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all pr-12" placeholder="Min 6 characters" minLength={6} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2 ml-1">
            <input 
              type="checkbox" 
              id="useFirebaseReg" 
              checked={useFirebase} 
              onChange={() => setUseFirebase(!useFirebase)}
              className="w-5 h-5 accent-primary cursor-pointer rounded-lg"
            />
            <label htmlFor="useFirebaseReg" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
              Register via Firebase Provider
            </label>
          </div>

          <button type="button" onClick={() => setShowBusiness(!showBusiness)} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline ml-1">
            <Building2 className="h-4 w-4" />
            {showBusiness ? 'Saya bukan penjual' : 'Saya ingin berjualan (UMKM)'}
          </button>

          {showBusiness && (
            <div className="border border-border/60 rounded-2xl p-5 space-y-4 bg-muted/20">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground ml-1">{t('auth.businessName')}</Label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all pl-11" placeholder={t('auth.enterBusinessName')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground ml-1">{t('auth.businessType')}</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                  <SelectTrigger className="h-12 rounded-xl bg-surface border-transparent">
                    <SelectValue placeholder={t('auth.selectBusinessType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">{t('auth.micro')}</SelectItem>
                    <SelectItem value="small">{t('auth.small')}</SelectItem>
                    <SelectItem value="medium">{t('auth.medium')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground ml-1">Alamat Bisnis</Label>
                <Input value={formData.location.address} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })} className="h-12 text-base bg-surface border-transparent focus:border-primary/50 rounded-xl transition-all mb-2" placeholder="Alamat Lengkap" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input value={formData.location.city} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })} className="h-11 text-sm bg-surface border-transparent rounded-xl" placeholder="Kota" />
                  <Input value={formData.location.state} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })} className="h-11 text-sm bg-surface border-transparent rounded-xl" placeholder="Provinsi" />
                  <Input value={formData.location.pincode} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, pincode: e.target.value } })} className="h-11 text-sm bg-surface border-transparent rounded-xl" placeholder="Kode Pos" />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 gap-2 text-base font-black rounded-xl shadow-lg shadow-primary/20" disabled={isLoading}>
            {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
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
          <span className="font-medium text-foreground">Sign up with Google</span>
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
