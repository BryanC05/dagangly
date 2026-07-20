import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ArrowLeft, ShoppingBag, MapPin, Plus, Minus, CreditCard, Check, Store, ChevronDown, ChevronUp, Truck, Clock, Navigation, AlertCircle, RefreshCw } from 'lucide-react';
import { useCartStore, useAuthStore } from '../store/authStore';
import { useAuthModalStore } from '../store/authModalStore';
import { useTranslation } from '../hooks/useTranslation';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resolveImageUrl } from '@/utils/imageUrl';
import ProgressSteps from '@/components/ui/ProgressSteps';
import DeliveryMapPicker from '@/components/DeliveryMapPicker';
import { showError, showSuccess, showInfo } from '../utils/toast';
import { resolveOrderId, formatScheduledPickup } from '../utils/orderStatus';

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

function Cart() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { items, updateQuantity, removeFromCart, clearSellerCart, getTotalPrice, getItemsBySeller, getSellerTotal } = useCartStore();
    const { user, isAuthenticated } = useAuthStore();
    const { openLogin } = useAuthModalStore();
    const { t } = useTranslation();

    const [expandedSellers, setExpandedSellers] = useState({});
    const [checkoutSeller, setCheckoutSeller] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [address, setAddress] = useState({
        address: user?.location?.address || '',
        city: user?.location?.city || '',
        state: user?.location?.state || '',
        pincode: user?.location?.pincode || '',
        coordinates: user?.location?.coordinates || [0, 0],
    });
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [deliveryType, setDeliveryType] = useState('pickup');
    const [preorderTime, setPreorderTime] = useState('');
    const [preorderDate, setPreorderDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [distanceError, setDistanceError] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(null);

    const [shippingRates, setShippingRates] = useState([]);
    const [loadingRates, setLoadingRates] = useState(false);
    const [selectedCourier, setSelectedCourier] = useState(null);

    const subtotal = checkoutSeller ? getSellerTotal(checkoutSeller.sellerId) : 0;
    const totalWeight = checkoutSeller?.items.reduce((sum, item) => {
        const itemWeight = item.product.weight || 0.5; // Default 0.5kg if not specified
        return sum + (itemWeight * item.quantity);
    }, 0) || 0;
    const deliveryFee = deliveryType === 'delivery' && selectedCourier ? (selectedCourier.price !== undefined ? selectedCourier.price : selectedCourier.amount) : 0;
    const total = subtotal + deliveryFee;

    // Get seller location from first product (memoized to keep reference stable)
    const sellerLocation = useMemo(() => {
        if (!checkoutSeller || !checkoutSeller.items.length) return null;
        const firstItem = checkoutSeller.items[0];
        const seller = firstItem.product.seller;
        if (seller?.location?.coordinates && seller.location.coordinates.length >= 2) {
            return {
                lat: seller.location.coordinates[1],
                lng: seller.location.coordinates[0]
            };
        }
        return null;
    }, [checkoutSeller]);

    const steps = [
        { label: t('checkout.step1') },
        { label: t('checkout.step2') },
        { label: t('checkout.step3') },
        { label: t('checkout.step4') },
    ];

    const paymentMethods = [
        { id: 'cash', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
        { id: 'qris', label: 'QRIS', icon: '📱', desc: 'Scan QR code at seller place' },
        { id: 'midtrans', label: 'Online Payment (Midtrans)', icon: '💳', desc: 'Pay instantly with QRIS/VA/Gopay via Midtrans' }
    ];

    const deliveryTypes = [
        { id: 'delivery', label: 'Delivery', icon: '🚗', desc: 'Delivered by driver to your address' },
        { id: 'pickup', label: 'Pickup', icon: '🏪', desc: 'Pick up at store yourself' },
    ];

    const toggleSeller = (sellerId) => {
        setExpandedSellers(prev => ({
            ...prev,
            [sellerId]: !prev[sellerId]
        }));
    };

    const startCheckout = (sellerGroup) => {
        setCheckoutSeller(sellerGroup);
        setCurrentStep(1);
        setDistanceError(null);
    };

    const cancelCheckout = () => {
        setCheckoutSeller(null);
        setCurrentStep(1);
        setDeliveryLocation(null);
        setDistanceError(null);
    };

    const handleDeliveryTypeChange = (typeId) => {
        setDeliveryType(typeId);
        setDistanceError(null);
        if (typeId === 'pickup') {
            setDeliveryLocation(null);
        }
    };

    const handleLocationSelect = (location) => {
        setDeliveryLocation(location);
        setAddress({
            ...address,
            address: location.address,
            coordinates: [location.lng, location.lat]
        });
        setDistanceError(null);
    };

    const nextStep = () => {
        // Validate delivery location before proceeding
        if (currentStep === 2 && deliveryType === 'delivery' && !deliveryLocation) {
            setDistanceError('Please select a delivery location on the map');
            return;
        }
        setDistanceError(null);
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    useEffect(() => {
        if (deliveryType === 'delivery' && deliveryLocation && checkoutSeller) {
            const fetchRates = async () => {
                setLoadingRates(true);
                try {
                    const response = await api.post('/shipping/rates', {
                        deliverFrom: {
                            latitude: checkoutSeller.location?.lat || -6.2088,
                            longitude: checkoutSeller.location?.lng || 106.8456,
                            address: checkoutSeller.address || '',
                            cityName: checkoutSeller.city || '',
                            stateName: checkoutSeller.province || '',
                            zipCode: checkoutSeller.postalCode || ''
                        },
                        deliverTo: {
                            latitude: deliveryLocation.lat,
                            longitude: deliveryLocation.lng,
                            address: deliveryLocation.address || '',
                            cityName: deliveryLocation.city || '',
                            stateName: deliveryLocation.province || '',
                            zipCode: deliveryLocation.postalCode || ''
                        },
                        courierCodes: ['jne', 'jnt', 'sicepat', 'ninja', 'antaraja'],
                        package: {
                            weight: totalWeight || 1.0,
                            length: 30,
                            width: 20,
                            height: 15
                        }
                    });
                    const ratesList = response.data.data?.rates || response.data.rates || [];
                    setShippingRates(ratesList);
                    if (ratesList.length > 0) {
                        setSelectedCourier(ratesList[0]);
                    }
                } catch (err) {
                    showError('Failed to fetch delivery rates', err.response?.data?.error || err.message);
                } finally {
                    setLoadingRates(false);
                }
            };
            fetchRates();
        } else {
            setShippingRates([]);
            setSelectedCourier(null);
        }
    }, [deliveryLocation, deliveryType, checkoutSeller]);

    const prevStep = () => {
        setDistanceError(null);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            showInfo('Login required', t('cart.loginRequired'));
            openLogin('/cart');
            return;
        }

        // Validate delivery location
        if (deliveryType === 'delivery' && !deliveryLocation) {
            setDistanceError('Please select a delivery location on the map');
            return;
        }

        setLoading(true);
        setDistanceError(null);

        try {
            const orderData = {
                products: checkoutSeller.items.map(item => ({
                    productId: item.product._id,
                    quantity: item.quantity,
                    variantName: item.variant?.name || null,
                    selectedOptions: (item.selectedOptions || []).map(o => ({
                        groupName: o.groupName,
                        chosen: o.chosen
                    }))
                })),
                deliveryAddress: {
                    address: address.address,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    coordinates: address.coordinates,
                },
                notes,
                paymentMethod,
                deliveryType,
                deliveryCourierCode: selectedCourier?.courierCode || selectedCourier?.courier_code || selectedCourier?.vendor || null,
                deliveryServiceCode: selectedCourier?.serviceCode || selectedCourier?.service_code || selectedCourier?.service || null,
                deliveryRateId: selectedCourier?.rateId || null,
                deliveryFee: deliveryFee,
                isPreorder: !!preorderTime || !!preorderDate,
                preorderTime: preorderTime || null,
                deliveryDate: preorderDate || null
            };

            const res = await api.post('/orders', orderData);
            const created = res.data;
            const orderIdStr = created._id || created.id;
            clearSellerCart(checkoutSeller.sellerId);
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            window.dispatchEvent(new CustomEvent('trigger-cart-burst', {
                detail: { x: e.clientX, y: e.clientY }
            }));

            if (paymentMethod === 'midtrans') {
                try {
                    const snapResponse = await api.post('/payments/checkout', { orderId: orderIdStr });
                    const { snap_token } = snapResponse.data;

                    if (snap_token) {
                        const loaded = await loadSnapScript();
                        if (loaded && window.snap) {
                            window.snap.pay(snap_token, {
                                onSuccess: () => {
                                    showSuccess('Payment Successful!', 'Your order has been paid and confirmed.');
                                    navigate('/orders');
                                },
                                onPending: () => {
                                    showInfo('Payment Pending', 'Awaiting transaction settlement.');
                                    navigate('/orders');
                                },
                                onError: () => {
                                    showError('Payment Failed', 'Transaction was unsuccessful. You can pay from the Orders page.');
                                    navigate('/orders');
                                },
                                onClose: () => {
                                    showInfo('Payment Window Closed', 'You can complete your payment later in the Orders page.');
                                    navigate('/orders');
                                }
                            });
                        } else {
                            showError('Error', 'Failed to load Midtrans SDK.');
                            navigate('/orders');
                        }
                    } else {
                        showError('Error', 'Failed to retrieve payment token.');
                        navigate('/orders');
                    }
                } catch (payError) {
                    showError('Payment Error', payError.response?.data?.error || payError.message);
                    navigate('/orders');
                }
            } else {
                setOrderSuccess({
                    orderId: resolveOrderId(created),
                    paymentMethod,
                    total,
                    sellerName: checkoutSeller.sellerName,
                    pickupTime: preorderTime,
                    pickupDate: preorderDate,
                });
                setCheckoutSeller(null);
                setDeliveryLocation(null);
                showSuccess('Order placed!', paymentMethod === 'qris'
                    ? 'Scan the seller QRIS on your Orders page and upload proof after paying.'
                    : 'Pay with cash when you pick up.');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to place order';
            showError('Checkout failed', errorMsg);
            setDistanceError(errorMsg);
            if (error.response?.data?.distance) {
                setDistanceError(`Location is ${error.response.data.distance.toFixed(2)}km away. Maximum allowed is 5km.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const sellerGroups = getItemsBySeller();

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <ShoppingBag className="h-6 w-6" />
                            {t('checkout.reviewCart')}
                        </h2>
                        <p className="text-muted-foreground">{checkoutSeller.sellerName}</p>
                        {checkoutSeller.items.map((item) => {
                            const unitPrice = item.variant ? item.variant.price : item.product.price;
                            const optionAdjust = (item.selectedOptions || []).reduce((sum, o) => sum + (o.priceAdjust || 0), 0);
                            const linePrice = unitPrice + optionAdjust;
                            return (
                                <Card key={`${item.product._id}-${item.variant?.name || ''}`}>
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="h-20 w-20 rounded-md overflow-hidden border shrink-0">
                                            {resolveImageUrl(item.product.images?.[0]) ? (
                                                <img
                                                    src={resolveImageUrl(item.product.images?.[0])}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            ) : null}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-base">{item.product.name}</h3>
                                                    {item.variant && (
                                                        <p className="text-sm text-primary font-medium mt-0.5">Variant: {item.variant.name}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="default"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0"
                                                    onClick={() => removeFromCart(item.product._id, item.variant, item.selectedOptions)}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="font-bold text-lg">Rp {linePrice.toLocaleString('id-ID')}</p>
                                                <div className="flex items-center gap-2 border rounded-md p-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variant, item.selectedOptions)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant, item.selectedOptions)}
                                                        disabled={item.quantity >= item.product.stock}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            {deliveryType === 'delivery' ? <Truck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
                            Fulfillment Method
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {deliveryTypes.map((type) => {
                                const isSelected = deliveryType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 text-primary shadow-sm font-semibold'
                                                : 'border-muted hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                        onClick={() => {
                                            setDeliveryType(type.id);
                                            setDistanceError(null);
                                        }}
                                    >
                                        <span className="text-2xl mb-1">{type.icon}</span>
                                        <span className="text-sm font-medium">{type.label}</span>
                                        <span className="text-xs text-muted-foreground mt-0.5">{type.desc}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <Separator />

                        {deliveryType === 'pickup' ? (
                            <>
                                <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <Store className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-emerald-900 text-base">Pickup at {checkoutSeller?.sellerName}</p>
                                            <p className="text-sm text-emerald-700 mt-0.5">
                                                Pick up your order directly from the store — no extra fees!
                                            </p>
                                        </div>
                                        <Check className="h-6 w-6 text-emerald-500 shrink-0 ml-auto" />
                                    </div>
                                </div>

                                {distanceError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{distanceError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-4">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <Navigation className="h-5 w-5 text-emerald-600" />
                                        Route to Store Location
                                    </Label>
                                    <div className="h-[280px] rounded-xl overflow-hidden border shadow-sm">
                                        <DeliveryMapPicker
                                            sellerLocation={sellerLocation}
                                            onLocationSelect={handleLocationSelect}
                                            initialLocation={deliveryLocation}
                                        />
                                    </div>
                                    {deliveryLocation && (
                                        <div className="p-4 bg-secondary/30 rounded-xl border flex items-center justify-between text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold">Your Location</p>
                                                <p className="font-medium mt-1">{address.address || deliveryLocation.address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                                            <Clock className="h-5 w-5" />
                                            Pickup Time
                                        </Label>
                                        <Input
                                            type="time"
                                            value={preorderTime}
                                            onChange={(e) => setPreorderTime(e.target.value)}
                                            className="h-12 text-base"
                                            placeholder="Select a pickup time"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            Let the seller know when you'll arrive to collect your order
                                        </p>
                                    </div>

                                    <div className="border rounded-xl p-4 bg-secondary/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <input
                                                type="checkbox"
                                                id="enablePreorder"
                                                checked={!!preorderDate}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const tomorrow = new Date();
                                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                                        setPreorderDate(tomorrow.toISOString().split('T')[0]);
                                                    } else {
                                                        setPreorderDate('');
                                                    }
                                                }}
                                                className="w-4 h-4 rounded accent-primary"
                                            />
                                            <Label htmlFor="enablePreorder" className="text-base font-semibold cursor-pointer">
                                                Schedule pickup for another day
                                            </Label>
                                        </div>
                                        {preorderDate && (
                                            <div className="space-y-3 pl-7">
                                                <div>
                                                    <Label className="text-sm">Pickup Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={preorderDate}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                                        onChange={(e) => setPreorderDate(e.target.value)}
                                                        className="h-10"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Up to 30 days in advance
                                                    </p>
                                                </div>
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription className="text-sm">
                                                        The seller will confirm your scheduled pickup before preparation.
                                                    </AlertDescription>
                                                </Alert>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Select Delivery Location
                                    </Label>
                                    
                                    <div className="h-[280px] rounded-xl overflow-hidden border">
                                        <DeliveryMapPicker
                                            sellerLocation={sellerLocation}
                                            onLocationSelect={handleLocationSelect}
                                            initialLocation={deliveryLocation}
                                        />
                                    </div>

                                    {address.address && (
                                        <div className="p-4 bg-secondary/30 rounded-xl border">
                                            <p className="text-xs text-muted-foreground uppercase font-bold">Delivery Address</p>
                                            <p className="text-sm font-medium mt-1">{address.address}</p>
                                        </div>
                                    )}

                                    {distanceError && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{distanceError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {deliveryLocation && (
                                        <div className="space-y-3 pt-2">
                                            <Label className="text-base font-semibold flex items-center gap-2">
                                                <Truck className="h-5 w-5" />
                                                Select Courier Service
                                            </Label>

                                            {loadingRates ? (
                                                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground bg-secondary/10 rounded-xl border animate-pulse">
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    Calculating shipping rates...
                                                </div>
                                            ) : shippingRates.length === 0 ? (
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>No delivery services available for this distance.</AlertDescription>
                                                </Alert>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {shippingRates.map((courier) => {
                                                        const name = courier.courier_name || courier.courierName;
                                                        const service = courier.courier_service_name || courier.serviceName;
                                                        const price = courier.price !== undefined ? courier.price : courier.amount;
                                                        const duration = courier.duration || (courier.estimatedDays !== undefined ? (courier.estimatedDays === 0 ? "Instant" : `${courier.estimatedDays} days`) : '');
                                                        
                                                        const isSelected = selectedCourier && (selectedCourier.courier_name || selectedCourier.courierName) === name;
                                                        return (
                                                            <button
                                                                key={`${name}-${service}`}
                                                                type="button"
                                                                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                                                                    isSelected
                                                                        ? 'border-primary bg-primary/5 text-primary font-semibold shadow-sm'
                                                                        : 'border-muted hover:bg-muted/50 text-muted-foreground'
                                                                }`}
                                                                onClick={() => setSelectedCourier(courier)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-2xl">🏍️</span>
                                                                    <div>
                                                                        <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                                                            {name}
                                                                            <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border border-primary/25 px-1.5 py-0.5 rounded-full">{service}</span>
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground mt-0.5">Est. time: {duration}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="font-bold text-foreground text-base">Rp {price?.toLocaleString('id-ID')}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <Separator />

                        <div>
                            <Label className="text-base font-semibold mb-2 block">Special instructions (optional)</Label>
                            <Textarea
                                placeholder="Any special requests? e.g., extra spicy, no onions, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="text-base min-h-[80px]"
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <CreditCard className="h-6 w-6" />
                            {t('checkout.selectPayment')}
                        </h2>
                        <div className="grid gap-3">
                            {paymentMethods.map((method) => (
                                <div
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentMethod === method.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{method.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-base">{method.label}</p>
                                            <p className="text-sm text-muted-foreground">{method.desc}</p>
                                        </div>
                                        {paymentMethod === method.id && (
                                            <Check className="h-6 w-6 text-primary" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Check className="h-6 w-6" />
                            {t('checkout.confirmOrder')}
                        </h2>
                        <Card>
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Store className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Pickup from</p>
                                        <p className="font-semibold">{checkoutSeller.sellerName}</p>
                                    </div>
                                </div>

                                {preorderTime && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-900">
                                                    Pickup at {preorderTime}
                                                </p>
                                                {preorderDate && (
                                                    <p className="text-xs text-amber-700 mt-0.5">
                                                        Scheduled for {new Date(preorderDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Payment</p>
                                    <p className="font-medium">
                                        {paymentMethods.find(m => m.id === paymentMethod)?.label}
                                    </p>
                                </div>
                                {notes && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Special Instructions</p>
                                            <p className="text-sm">{notes}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-base">
                                        <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-muted-foreground">Store Pickup</span>
                                        <span className="text-emerald-600 font-medium">✓ Free</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-xl pt-2">
                                        <span>{t('cart.total')}</span>
                                        <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    if (orderSuccess) {
        const schedule = formatScheduledPickup({
            preorderTime: orderSuccess.pickupTime,
            deliveryDate: orderSuccess.pickupDate,
        });
        return (
            <div className="container py-12 max-w-lg mx-auto">
                <Card className="border-emerald-200 bg-emerald-50/30">
                    <CardContent className="p-8 text-center space-y-4">
                        <Check className="h-14 w-14 text-emerald-500 mx-auto" />
                        <h2 className="text-2xl font-bold">Order placed!</h2>
                        <p className="text-muted-foreground">
                            Order #{orderSuccess.orderId?.slice(-8).toUpperCase()} from {orderSuccess.sellerName}
                        </p>
                        <p className="text-lg font-semibold text-primary">
                            Rp {orderSuccess.total?.toLocaleString('id-ID')}
                        </p>
                        {schedule && (
                            <p className="text-sm">Scheduled pickup: {schedule}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {orderSuccess.paymentMethod === 'qris'
                                ? 'Go to Orders to view the QRIS code and upload payment proof.'
                                : 'Pay with cash when you pick up at the store.'}
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button size="lg" onClick={() => navigate('/orders')}>View orders</Button>
                            <Button variant="outline" onClick={() => setOrderSuccess(null)}>Continue shopping</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (checkoutSeller) {
        return (
            <>
                <div className="container py-8">
                    <div className="max-w-4xl mx-auto grid lg:grid-cols-[1fr_320px] gap-8">
                        <div>
                        <Button variant="ghost" className="mb-4 gap-2" onClick={cancelCheckout}>
                            <ArrowLeft className="h-5 w-5" />
                            Back to Cart
                        </Button>
                        <ProgressSteps steps={steps} currentStep={currentStep} />
                        <div className="mt-8">
                            {renderStepContent()}
                        </div>
                        <div className="flex gap-4 mt-8 lg:hidden">
                            {currentStep > 1 && (
                                <Button variant="outline" size="lg" className="flex-1 gap-2 h-12" onClick={prevStep}>
                                    <ArrowLeft className="h-5 w-5" />
                                    {t('common.back')}
                                </Button>
                            )}
                            {currentStep < 4 ? (
                                <Button size="lg" className="flex-1 gap-2 h-12" onClick={nextStep}>
                                    {t('common.next')}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            ) : (
                                <Button size="lg" className="flex-1 gap-2 h-12" onClick={handleCheckout} disabled={loading}>
                                    {loading ? t('cart.processing') : t('cart.placeOrder')}
                                    {!loading && <Check className="h-5 w-5" />}
                                </Button>
                            )}
                        </div>
                        </div>
                        <aside className="hidden lg:block">
                            <Card className="sticky top-24 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Order summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">{checkoutSeller.sellerName}</p>
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                         <span>{deliveryType === 'delivery' ? 'Delivery fee' : 'Pickup'}</span>
                                         <span className={deliveryType === 'delivery' ? 'font-medium font-bold' : 'text-emerald-600 font-semibold'}>
                                             {deliveryType === 'delivery'
                                                 ? `Rp ${deliveryFee.toLocaleString('id-ID')}`
                                                 : 'Free'}
                                         </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
                                    </div>
                                    {currentStep > 1 && (
                                        <Button variant="outline" className="w-full gap-2" onClick={prevStep}>
                                            <ArrowLeft className="h-4 w-4" /> Back
                                        </Button>
                                    )}
                                    {currentStep < 4 ? (
                                        <Button className="w-full gap-2" onClick={nextStep}>
                                            Next <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button className="w-full gap-2" onClick={handleCheckout} disabled={loading}>
                                            {loading ? t('cart.processing') : t('cart.placeOrder')}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="container py-8">
                <div 
                    className="flex items-center gap-4 mb-6 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingBag className="h-7 w-7" />
                        {t('cart.title')}
                        {items.length > 0 && <span className="text-muted-foreground text-lg font-normal">({items.length} {t('cart.items')})</span>}
                    </h1>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <ShoppingBag className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-lg font-semibold mb-1">{t('cart.empty')}</h2>
                        <p className="text-sm text-muted-foreground mb-5">Your cart is empty</p>
                        <Button asChild className="gap-2">
                            <Link to="/products">
                                <ShoppingBag className="h-4 w-4" />
                                {t('cart.continueShopping')}
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sellerGroups.map((group) => {
                            const isExpanded = expandedSellers[group.sellerId] !== false;
                            const sellerTotal = getSellerTotal(group.sellerId);
                            const hasStoreName = group.sellerName !== group.sellerRealName && group.sellerRealName !== 'Unknown';

                            return (
                                <Card key={group.sellerId}>
                                    <CardHeader className="pb-3">
                                        <div
                                            className="flex items-center justify-between cursor-pointer"
                                            onClick={() => toggleSeller(group.sellerId)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <Store className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{group.sellerName}</h3>
                                                    {hasStoreName && (
                                                        <p className="text-xs text-muted-foreground">by {group.sellerRealName}</p>
                                                    )}
                                                    <p className="text-sm text-muted-foreground">{group.items.length} items</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="font-bold text-lg">Rp {sellerTotal.toLocaleString('id-ID')}</p>
                                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {isExpanded && (
                                        <CardContent className="pt-0">
                                            <Separator className="mb-4" />
                                            <div className="space-y-3 mb-4">
                                                {group.items.map((item) => {
                                                    const unitPrice = item.variant ? item.variant.price : item.product.price;
                                                    const optionAdjust = (item.selectedOptions || []).reduce((sum, o) => sum + (o.priceAdjust || 0), 0);
                                                    const linePrice = unitPrice + optionAdjust;

                                                    return (
                                                        <div key={`${item.product._id}-${item.variant?.name || ''}`} className="flex gap-3 p-3 bg-secondary/30 rounded-lg">
                                                            <div className="h-16 w-16 rounded-md overflow-hidden border shrink-0">
                                                                {resolveImageUrl(item.product.images?.[0]) ? (
                                                                    <img
                                                                        src={resolveImageUrl(item.product.images?.[0])}
                                                                        alt={item.product.name}
                                                                        className="h-full w-full object-cover"
                                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                    />
                                                                ) : null}
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                                                                        {item.variant && (
                                                                            <p className="text-xs text-primary">{item.variant.name}</p>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                                                                        onClick={() => removeFromCart(item.product._id, item.variant, item.selectedOptions)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <p className="font-semibold">Rp {linePrice.toLocaleString('id-ID')}</p>
                                                                    <div className="flex items-center gap-1 border rounded-md p-0.5">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variant, item.selectedOptions)}
                                                                            disabled={item.quantity <= 1}
                                                                        >
                                                                            <Minus className="h-3 w-3" />
                                                                        </Button>
                                                                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant, item.selectedOptions)}
                                                                            disabled={item.quantity >= item.product.stock}
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                className="w-full h-11 gap-2"
                                                onClick={() => startCheckout(group)}
                                            >
                                                <ShoppingBag className="h-5 w-5" />
                                                Checkout from {group.sellerName}
                                            </Button>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

export default Cart;
