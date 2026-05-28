import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Building2, Store } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
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

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        isSeller: showBusiness,
        ...(showBusiness && {
          businessName: formData.businessName,
          businessType: formData.businessType,
          location: formData.location,
        }),
      };

      const response = await api.post('/auth/register', payload);
      const token = response?.data?.token;
      const user = response?.data?.user;

      if (token) setAuth(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary via-primary to-emerald-400 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-display font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('auth.createAccount')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.createAccountDesc')}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-5 border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">{t('auth.name')}</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 text-sm bg-surface" placeholder={t('auth.enterName')} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">{t('auth.email')}</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-11 text-sm bg-surface" placeholder={t('auth.enterEmail')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">{t('auth.phone')}</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 text-sm bg-surface" placeholder={t('auth.enterPhone')} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">{t('auth.password')}</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-11 text-sm bg-surface pr-10" placeholder="Min 6 characters" minLength={6} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="button" onClick={() => setShowBusiness(!showBusiness)} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Building2 className="h-4 w-4" />
            {showBusiness ? 'Saya bukan penjual' : 'Saya ingin berjualan'}
          </button>

          {showBusiness && (
            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">{t('auth.businessName')}</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="h-11 text-sm bg-surface pl-9" placeholder={t('auth.enterBusinessName')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">{t('auth.businessType')}</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('auth.selectBusinessType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">{t('auth.micro')}</SelectItem>
                    <SelectItem value="small">{t('auth.small')}</SelectItem>
                    <SelectItem value="medium">{t('auth.medium')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Alamat</Label>
                <Input value={formData.location.address} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })} className="h-11 text-sm bg-surface" placeholder="Alamat" />
                <div className="grid grid-cols-3 gap-2">
                  <Input value={formData.location.city} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })} className="h-10 text-sm bg-surface" placeholder="Kota" />
                  <Input value={formData.location.state} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })} className="h-10 text-sm bg-surface" placeholder="Provinsi" />
                  <Input value={formData.location.pincode} onChange={(e) => setFormData({ ...formData, location: { ...formData.location, pincode: e.target.value } })} className="h-10 text-sm bg-surface" placeholder="Kode Pos" />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
            {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

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
