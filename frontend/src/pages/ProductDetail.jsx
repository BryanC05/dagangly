import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store, Phone, Star, ArrowLeft, ShoppingCart, MessageCircle, Shield, Package, Heart, Share2, Flag, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore, useAuthStore } from '../store/authStore';
import { useSavedProductsStore } from '../store/savedProductsStore';
import { useTranslation } from '../hooks/useTranslation';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { resolveImageUrl } from '@/utils/imageUrl';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewSection from '../components/ReviewSection';
import SEO from '@/components/SEO';

function MarkdownContent({ content }) {
  if (!content) return null;

  const paragraphs = content.split(/\n\n+/);
  
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => {
        const formattedText = paragraph
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/__(.*?)__/g, '<strong>$1</strong>')
          .replace(/_(.*?)_/g, '<em>$1</em>');
        
        return (
          <p 
            key={index} 
            className="text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        );
      })}
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [whatsappUrl, setWhatsappUrl] = useState(null);

  const handleBack = () => {
    const returnUrl = sessionStorage.getItem('productDetailReturnUrl') || '/products';
    navigate(returnUrl);
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
  });

  const sellerId = product?.seller?._id || product?.seller?.id;

  // Fetch seller's WhatsApp
  useEffect(() => {
    const fetchWhatsApp = async () => {
      if (!sellerId) return;
      try {
        const response = await api.get(`/whatsapp/seller/${sellerId}`);
        setWhatsappUrl(response.data.whatsappUrl);
      } catch (error) {
        console.log('WhatsApp not available');
      }
    };
    fetchWhatsApp();
  }, [sellerId]);

  // Compute dynamic price
  const getUnitPrice = () => {
    if (!product) return 0;
    let price = product.hasVariants && selectedVariant ? selectedVariant.price : product.price;
    Object.values(selectedOptions).forEach(sel => {
      price += (sel.priceAdjust || 0);
    });
    return price;
  };

  const getAvailableStock = () => {
    if (!product) return 0;
    if (product.hasVariants && selectedVariant) return selectedVariant.stock;
    return product.stock;
  };

  const handleOptionSelect = (groupName, optionName, priceAdjust, isMultiple) => {
    setSelectedOptions(prev => {
      if (isMultiple) {
        const current = prev[groupName] || { chosen: [], priceAdjust: 0 };
        const isSelected = current.chosen.includes(optionName);
        const group = product.optionGroups.find(g => g.name === groupName);
        if (isSelected) {
          const newChosen = current.chosen.filter(n => n !== optionName);
          const newAdjust = newChosen.reduce((sum, n) => {
            const opt = group?.options.find(o => o.name === n);
            return sum + (opt?.priceAdjust || 0);
          }, 0);
          return { ...prev, [groupName]: { groupName, chosen: newChosen, priceAdjust: newAdjust } };
        } else {
          const newChosen = [...current.chosen, optionName];
          return { ...prev, [groupName]: { groupName, chosen: newChosen, priceAdjust: current.priceAdjust + priceAdjust } };
        }
      } else {
        return { ...prev, [groupName]: { groupName, chosen: [optionName], priceAdjust } };
      }
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.hasVariants && !selectedVariant) {
      toast.error('Please select a variant first.');
      return;
    }
    // Check required option groups
    const missingRequired = product.optionGroups?.filter(g => g.required && (!selectedOptions[g.name] || selectedOptions[g.name].chosen.length === 0));
    if (missingRequired?.length > 0) {
      toast.error(`Please select: ${missingRequired.map(g => g.name).join(', ')}`);
      return;
    }
    const variant = selectedVariant ? { name: selectedVariant.name, price: selectedVariant.price } : null;
    const optionsArr = Object.values(selectedOptions).filter(o => o.chosen.length > 0);
    addToCart(product, quantity, variant, optionsArr);
    toast.success(`Added ${quantity} ${product.name} to cart!`);
  };

  const { isProductSaved, toggleSaveProduct, isLoading: isSaveLoading } = useSavedProductsStore();
  const isSaved = product ? isProductSaved(product._id) : false;

  const handleToggleSave = async () => {
    if (!product) return;
    const success = await toggleSaveProduct(product._id);
    if (success) {
      // Optional: show toast notification
    }
  };

  if (isLoading) {
    return (
      <>
        <SEO title="Loading Product... - Dagangly" />
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full rounded-lg" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Details Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-40" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <SEO title="Product Not Found - Dagangly" />
        <div className="container py-20">
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">{t('productDetail.productNotFound')}</h2>
            <p className="text-muted-foreground mb-4">{t('productDetail.productNotFoundDesc')}</p>
            <Button onClick={() => navigate('/products')}>{t('profile.browseProducts')}</Button>
          </div>
        </div>
      </>
    );
  }

  const productImages = Array.isArray(product.images)
    ? product.images.map((img) => resolveImageUrl(img)).filter(Boolean)
    : [];
  const seller = typeof product.seller === 'object' && product.seller !== null ? product.seller : null;
  const resolvedSellerId =
    (typeof product.seller === 'string' ? product.seller : null) ||
    seller?._id ||
    seller?.id ||
    sellerId; // Fallback to the one computed at the top

  return (
    <div className="bg-background min-h-screen py-6">
      <SEO title={`${product?.name} - Dagangly`} description={product?.description} />
      <div className="container">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-3">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border">
              {productImages[selectedImage] ? (
                <img src={productImages[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 shrink-0 bg-muted rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground'}`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Link to={resolvedSellerId ? `/store/${resolvedSellerId}` : '#'} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Store className="h-4 w-4" />
                {product.business?.name || seller?.businessName || seller?.name || 'Toko'}
                {product.business?.isVerified && <Shield className="h-3 w-3 text-green-600" />}
              </Link>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-foreground">{product.name}</h1>

            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{product.rating?.toFixed(1) || '4.5'}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount || product.reviews?.length || 0} ulasan)</span>
            </div>

            <div className="text-2xl font-bold text-primary">
              Rp{getUnitPrice().toLocaleString('id-ID')}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs bg-muted border-border text-muted-foreground">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-5 space-y-5">
              {product.hasVariants && product.variants?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Variant</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selectedVariant?.name === v.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted border-border'} ${v.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                        disabled={v.stock <= 0}
                      >
                        {v.name}
                        <span className="block text-[10px] mt-0.5">Rp{v.price?.toLocaleString('id-ID')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.optionGroups?.length > 0 && product.optionGroups.map((group) => (
                <div key={group.name}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {group.name} {group.required && <span className="text-destructive">*</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions[group.name]?.chosen?.includes(opt.name);
                      return (
                        <button
                          key={opt.name}
                          onClick={() => handleOptionSelect(group.name, opt.name, opt.priceAdjust || 0, group.multiple)}
                          className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted border-border'}`}
                        >
                          {opt.name}
                          {opt.priceAdjust > 0 && <span className="text-[10px] ml-1">(+Rp{opt.priceAdjust.toLocaleString('id-ID')})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {getAvailableStock() > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center border border-border rounded-lg w-fit">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-9 h-9 flex items-center justify-center hover:bg-accent rounded-l-lg text-lg disabled:opacity-50">−</button>
                    <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(getAvailableStock(), quantity + 1))} disabled={quantity >= getAvailableStock()} className="w-9 h-9 flex items-center justify-center hover:bg-accent rounded-r-lg text-lg disabled:opacity-50">+</button>
                  </div>

                  <Button onClick={handleAddToCart} className="w-full gap-2 h-11">
                    <ShoppingCart className="h-4 w-4" />
                    Tambah ke Keranjang
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleToggleSave} disabled={isSaveLoading}>
                      <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                      Simpan
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => navigator.clipboard.writeText(window.location.href) || toast.success('Link disalin!')}>
                      <Share2 className="h-4 w-4" />
                      Bagikan
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive font-medium">Stok habis</p>
              )}

              <div className="pt-4 border-t border-border space-y-2">
                {seller?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {seller.phone}
                  </p>
                )}
                {whatsappUrl && (
                  <Button asChild variant="default" size="sm" className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-xs">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="h-3.5 w-3.5" />
                      WhatsApp Seller
                    </a>
                  </Button>
                )}
                {user && user.role === 'buyer' && resolvedSellerId && (
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => navigate(`/chat?seller=${resolvedSellerId}&from=product&productId=${product._id}`)}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    {t('productDetail.chatWithSeller')}
                  </Button>
                )}
              </div>
            </div>

            <ReviewSection productId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
