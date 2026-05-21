import { useState } from 'react';
import { Upload, CheckCircle, QrCode, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/utils/api';
import { resolveImageUrl } from '@/utils/imageUrl';
import { showError, showSuccess } from '@/utils/toast';
import { resolveOrderId } from '@/utils/orderStatus';

export default function OrderPaymentPanel({
  order,
  user,
  onUpdated,
  compact = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const orderId = resolveOrderId(order);
  const buyerId = order.buyer?._id || order.buyer;
  const sellerId = order.seller?._id || order.seller;
  const isBuyer = String(buyerId) === String(user?.id);
  const isSeller = String(sellerId) === String(user?.id);
  const isQris = order.paymentMethod === 'qris';
  const isCash = order.paymentMethod === 'cash';
  const paymentStatus = order.paymentStatus || 'pending';
  const qrisUrl = order.paymentDetails?.qrisUrl || order.seller?.qrisImageUrl;
  const qrisCode = order.paymentDetails?.qrisCode || order.seller?.qrisCode;
  const proofUrl = order.paymentDetails?.transferProof;

  const uploadProof = async (file) => {
    if (!file || !orderId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('paymentProof', file);
      const res = await api.post(`/orders/${orderId}/payment-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showSuccess('Payment proof uploaded', 'The seller will verify your payment.');
      onUpdated?.(res.data);
    } catch (err) {
      showError('Upload failed', err.response?.data?.message || err.response?.data?.error);
    } finally {
      setUploading(false);
    }
  };

  const markPaid = async () => {
    setConfirming(true);
    try {
      const res = await api.put(`/orders/${orderId}/payment`, {
        paymentStatus: 'completed',
      });
      showSuccess('Payment marked as received');
      onUpdated?.(res.data);
    } catch (err) {
      showError('Failed to update', err.response?.data?.message);
    } finally {
      setConfirming(false);
    }
  };

  if (order.status !== 'payment_pending' && paymentStatus === 'completed') {
    return (
      <Alert className="border-emerald-200 bg-emerald-50">
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">Payment confirmed</AlertDescription>
      </Alert>
    );
  }

  if (order.status !== 'payment_pending') return null;

  return (
    <Card className={compact ? 'border-primary/20' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {isQris ? <QrCode className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
          {isQris ? 'Pay with QRIS' : 'Cash on pickup'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isCash && (
          <p className="text-muted-foreground">
            Pay the seller in cash when you pick up your order.
          </p>
        )}

        {isQris && (
          <>
            {qrisUrl ? (
              <div className="text-center">
                <img
                  src={resolveImageUrl(qrisUrl)}
                  alt="Seller QRIS"
                  className="mx-auto max-w-[220px] rounded-lg border"
                />
                <p className="text-xs text-muted-foreground mt-2">Scan to pay the seller</p>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Seller has not uploaded a QRIS code yet. Contact them or pay at the store.
                </AlertDescription>
              </Alert>
            )}
            {qrisCode && (
              <p className="font-mono text-center bg-muted p-2 rounded-md">{qrisCode}</p>
            )}
          </>
        )}

        {proofUrl && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Uploaded proof</p>
            <a href={resolveImageUrl(proofUrl)} target="_blank" rel="noreferrer" className="text-primary underline text-sm">
              View payment proof
            </a>
          </div>
        )}

        {isBuyer && isQris && paymentStatus !== 'proof_submitted' && (
          <div>
            <input
              id={`proof-upload-${orderId}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadProof(e.target.files?.[0])}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              disabled={uploading}
              onClick={() => document.getElementById(`proof-upload-${orderId}`)?.click()}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload payment proof'}
            </Button>
          </div>
        )}

        {isBuyer && paymentStatus === 'proof_submitted' && (
          <Alert>
            <AlertDescription>Proof sent — waiting for seller to confirm payment.</AlertDescription>
          </Alert>
        )}

        {isSeller && (isQris || isCash) && (
          <Button size="sm" className="w-full gap-2" onClick={markPaid} disabled={confirming}>
            <CheckCircle className="h-4 w-4" />
            {confirming ? 'Updating...' : 'Mark payment received'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
