import { useState } from 'react';
import { Upload, CheckCircle, QrCode, Banknote, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/utils/api';
import { resolveImageUrl } from '@/utils/imageUrl';
import { showError, showSuccess } from '@/utils/toast';
import { resolveOrderId } from '@/utils/orderStatus';

const loadSnapScript = () => {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
    script.src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (clientKey) {
      script.setAttribute('data-client-key', clientKey);
    }
    
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function OrderPaymentPanel({
  order,
  user,
  onUpdated,
  compact = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);

  const orderId = resolveOrderId(order);
  const buyerId = order.buyer?._id || order.buyer;
  const sellerId = order.seller?._id || order.seller;
  const isBuyer = String(buyerId) === String(user?.id);
  const isSeller = String(sellerId) === String(user?.id);
  const isQris = order.paymentMethod === 'qris';
  const isCash = order.paymentMethod === 'cash';
  const isMidtrans = order.paymentMethod === 'midtrans';
  const paymentStatus = order.paymentStatus || 'pending';
  const qrisUrl = order.paymentDetails?.qrisUrl || order.seller?.qrisImageUrl;
  const qrisCode = order.paymentDetails?.qrisCode || order.seller?.qrisCode;
  const proofUrl = order.paymentDetails?.transferProof;

  const handleMidtransPay = async () => {
    setPaying(true);
    try {
      const snapResponse = await api.post('/payments/checkout', { orderId });
      const { snap_token } = snapResponse.data;

      if (snap_token) {
        const loaded = await loadSnapScript();
        if (loaded && window.snap) {
          window.snap.pay(snap_token, {
            onSuccess: () => {
              showSuccess('Payment Successful!', 'Your order has been paid and confirmed.');
              onUpdated?.();
            },
            onPending: () => {
              showSuccess('Payment Pending', 'Awaiting transaction settlement.');
              onUpdated?.();
            },
            onError: () => {
              showError('Payment Failed', 'Transaction was unsuccessful.');
            },
            onClose: () => {
              showSuccess('Payment Closed', 'You can complete your payment later.');
            }
          });
        } else {
          showError('Error', 'Failed to load Midtrans SDK.');
        }
      } else {
        showError('Error', 'Failed to retrieve payment token.');
      }
    } catch (payError) {
      showError('Payment Error', payError.response?.data?.error || payError.message);
    } finally {
      setPaying(false);
    }
  };

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
          {isQris ? <QrCode className="h-4 w-4" /> : isMidtrans ? <CreditCard className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
          {isQris ? 'Pay with QRIS' : isMidtrans ? 'Online Payment (Midtrans)' : 'Cash on pickup'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isCash && (
          <p className="text-muted-foreground">
            Pay the seller in cash when you pick up your order.
          </p>
        )}

        {isMidtrans && isBuyer && paymentStatus === 'pending' && (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Complete your payment securely online via Midtrans.
            </p>
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={handleMidtransPay}
              disabled={paying}
            >
              <CreditCard className="h-4 w-4" />
              {paying ? 'Opening Midtrans...' : 'Pay Now'}
            </Button>
          </div>
        )}

        {isMidtrans && isSeller && paymentStatus === 'pending' && (
          <p className="text-muted-foreground italic">
            Awaiting automated online payment confirmation from Midtrans.
          </p>
        )}

        {isMidtrans && paymentStatus === 'pending' && !isBuyer && !isSeller && (
          <p className="text-muted-foreground">
            Payment pending online verification.
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
          <div className="mt-3 p-3 bg-muted/40 rounded-xl border">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Uploaded Payment Proof
            </p>
            <a href={resolveImageUrl(proofUrl)} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg border max-w-[120px] aspect-[3/4] hover:border-primary transition-all">
              <img 
                src={resolveImageUrl(proofUrl)} 
                alt="Payment Proof" 
                className="w-full h-full object-cover group-hover:scale-105 transition-all"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-medium">
                Click to zoom
              </div>
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
              className="gap-2 w-full mt-3"
              disabled={uploading}
              onClick={() => document.getElementById(`proof-upload-${orderId}`)?.click()}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload payment proof'}
            </Button>
          </div>
        )}

        {isBuyer && paymentStatus === 'proof_submitted' && (
          <Alert className="mt-3">
            <AlertDescription>Proof sent — waiting for seller to confirm payment.</AlertDescription>
          </Alert>
        )}

        {isSeller && isQris && paymentStatus === 'proof_submitted' && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/30 my-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs">
              Buyer has uploaded a payment proof. Please review it above before marking as paid.
            </AlertDescription>
          </Alert>
        )}

        {isSeller && (isQris || isCash) && (
          <Button size="sm" className="w-full gap-2 mt-3" onClick={markPaid} disabled={confirming}>
            <CheckCircle className="h-4 w-4" />
            {confirming ? 'Updating...' : 'Mark payment received'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
