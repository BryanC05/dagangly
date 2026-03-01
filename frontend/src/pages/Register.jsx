import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Store, ArrowRight, Building2, Sparkles, ImageIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isSeller: true,
    businessName: '',
    businessType: 'micro',
    location: {
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
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
      let locationData = { ...formData.location };
      const response = await api.post('/auth/register', {
        ...formData,
        location: locationData,
      });

      setAuth(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t('auth.createAccount')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.createAccountDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-9"
                    placeholder={t('auth.enterName')}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-9"
                      placeholder={t('auth.enterEmail')}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('auth.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9"
                      placeholder={t('auth.enterPhone')}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Business Details - Always visible for all users */}
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30 animate-in slide-in-from-top-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Details (Optional)
                </h3>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">{t('auth.businessName')}</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="pl-9"
                        placeholder={t('auth.enterBusinessName')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('auth.businessType')}</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                    >
                      <SelectTrigger>
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
                    <Label>Business Address</Label>
                    <div className="grid gap-2">
                      <Input
                        value={formData.location.address}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: { ...formData.location, address: e.target.value }
                        })}
                        placeholder="Street Address"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={formData.location.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            location: { ...formData.location, city: e.target.value }
                          })}
                          placeholder="City"
                        />
                        <Input
                          value={formData.location.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            location: { ...formData.location, state: e.target.value }
                          })}
                          placeholder="State"
                        />
                        <Input
                          value={formData.location.pincode}
                          onChange={(e) => setFormData({
                            ...formData,
                            location: { ...formData.location, pincode: e.target.value }
                          })}
                          placeholder="Pincode"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Section */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Business Logo (Optional)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Create a professional logo for your business or upload your own
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to="/logo-generator?from=registration"
                        className="flex-1"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate Logo
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => alert('Logo upload will be available after registration')}
                      >
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-9 pr-9"
                    placeholder="Create a password (min 6 characters)"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export default Register;
