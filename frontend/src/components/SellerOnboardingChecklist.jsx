import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Circle, QrCode, Package, Clock, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/utils/api';
import { showError, showSuccess } from '@/utils/toast';

export default function SellerOnboardingChecklist({ user, productCount = 0, onUpdated }) {
  const [qrisCode, setQrisCode] = useState(user?.qrisCode || '');
  const [pickupHours, setPickupHours] = useState(user?.pickupHours || '');
  const [saving, setSaving] = useState(false);

  const hasProducts = productCount > 0;
  const hasQris = !!(user?.qrisImageUrl || user?.qrisCode);
  const hasHours = !!user?.pickupHours;
  const complete = hasProducts && hasQris && hasHours;

  const saveSellerSettings = async (file) => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (file) formData.append('qrisImage', file);
      if (qrisCode.trim()) formData.append('qrisCode', qrisCode.trim());
      if (pickupHours.trim()) formData.append('pickupHours', pickupHours.trim());
      const res = await api.post('/users/seller/qris', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSuccess('Store settings saved');
      onUpdated?.(res.data);
    } catch (err) {
      showError('Save failed', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    {
      done: hasProducts,
      label: 'Add your first product',
      action: <Button asChild size="sm" variant="outline"><Link to="/seller/add-product">Add product</Link></Button>,
    },
    {
      done: hasQris,
      label: 'Set up QRIS for buyers',
      action: null,
    },
    {
      done: hasHours,
      label: 'Set pickup hours',
      action: null,
    },
  ];

  if (complete) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="text-lg">Complete your store setup</CardTitle>
        <p className="text-sm text-muted-foreground">Buyers pay with cash or QRIS at pickup — finish these steps first.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {step.done ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={step.done ? 'text-muted-foreground line-through' : 'font-medium'}>{step.label}</span>
            </div>
            {!step.done && step.action}
          </div>
        ))}

        <div className="grid gap-3 pt-2 border-t">
          <div>
            <Label htmlFor="qrisCode">QRIS code (optional)</Label>
            <Input id="qrisCode" value={qrisCode} onChange={(e) => setQrisCode(e.target.value)} placeholder="e.g. merchant ID" />
          </div>
          <div>
            <Label htmlFor="pickupHours">Pickup hours</Label>
            <Input id="pickupHours" value={pickupHours} onChange={(e) => setPickupHours(e.target.value)} placeholder="e.g. 08:00 - 20:00" />
          </div>
          <div className="flex flex-wrap gap-2">
            <label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => saveSellerSettings(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" className="gap-2" disabled={saving} asChild>
                <span><Upload className="h-4 w-4" /> Upload QRIS image</span>
              </Button>
            </label>
            <Button size="sm" onClick={() => saveSellerSettings(null)} disabled={saving}>
              <QrCode className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save settings'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
