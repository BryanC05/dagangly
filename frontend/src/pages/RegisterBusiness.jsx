import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, FileText, Folder, ArrowLeft, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BUSINESS_CATEGORIES = [
  'Food & Beverages',
  'Fashion',
  'Electronics',
  'Home & Living',
  'Beauty',
  'Handicrafts',
  'Agriculture',
  'Other',
];

function RegisterBusiness() {
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    businessCategory: '',
    npwp: '',
  });
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await api.get('/users/registration-status');
      setStatus(response.data);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await api.post('/users/register-business', formData);
      setSuccess('Application submitted, awaiting approval');
      checkStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (status?.isSeller) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">You're a Seller!</CardTitle>
            <CardDescription>You already have seller access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
            {status.businessName && (
              <p className="text-center text-sm text-muted-foreground">
                Business: {status.businessName}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.registrationStatus === 'pending') {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Application Pending</CardTitle>
            <CardDescription>Your seller application is under review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.registrationStatus === 'denied') {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Application Denied</CardTitle>
            <CardDescription>Your seller application was not approved</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => {
              setStatus({ registrationStatus: 'none' });
              setSuccess('');
            }} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-2xl font-bold">Register as Seller</CardTitle>
            </div>
            <CardDescription>
              Fill in your business information to become a seller
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-lg mb-4 border border-destructive/20">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/15 text-green-600 text-sm p-4 rounded-lg mb-4 border border-green-500/20">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-base">
                  Business Name *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Your business name"
                    className="pl-12"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress" className="text-base">
                  Business Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="businessAddress"
                    type="text"
                    placeholder="Your business address"
                    className="pl-12"
                    value={formData.businessAddress}
                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCategory" className="text-base">
                  Business Category *
                </Label>
                <Select
                  value={formData.businessCategory}
                  onValueChange={(value) => handleChange('businessCategory', value)}
                >
                  <SelectTrigger id="businessCategory">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="npwp" className="text-base">
                  NPWP (Optional)
                </Label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="npwp"
                    type="text"
                    placeholder="Tax ID number"
                    className="pl-12"
                    value={formData.npwp}
                    onChange={(e) => handleChange('npwp', e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default RegisterBusiness;