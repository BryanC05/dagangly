import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store, Phone, Star, ArrowLeft, ShoppingCart, MessageCircle, Shield, Package, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore, useAuthStore } from '../store/authStore';
import { useSavedProductsStore } from '../store/savedProductsStore';
import api from '../utils/api';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PLACEHOLDER_IMAGE } from '@/utils/constants';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();

  // Track where user came from for back navigation
  useEffect(() => {
    const chatReturnUrl = sessionStorage.getItem('chatReturnUrl');
    if (!chatReturnUrl || chatReturnUrl !== location.pathname) {
      const referrer = document.referrer;
      if (referrer && referrer.includes('/products')) {
        sessionStorage.setItem('productDetailReturnUrl', '/products');
      } else if (!sessionStorage.getItem('productDetailReturnUrl')) {
        sessionStorage.setItem('productDetailReturnUrl', '/products');
      }
    }
  }, [location.pathname]);

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

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      alert(`Added ${quantity} ${product.name} to cart!`);
    }
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
      <Layout>
        <div className="container py-20">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse text-muted-foreground">Loading product...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Product not found</h2>
            <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const productImages = product.images?.length > 0 ? product.images : [PLACEHOLDER_IMAGE];

  return (
    <Layout>
      <div className="container py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={handleBack} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden border">
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              />
            </div>

            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-muted rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Title */}
            <div>
              <Badge variant="secondary" className="mb-3 capitalize">
                {product.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>

              {/* Seller Info Card */}
              <Link to={`/store/${product.seller?._id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{product.seller?.businessName || 'Local Store'}</span>
                          {product.seller?.isVerified && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {product.seller?.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{product.seller.rating.toFixed(1)}</span>
                            </div>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {product.location?.city || 'Bekasi'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{product.location?.address || 'Local pickup available'}</p>
                <p className="text-muted-foreground">{product.location?.city}, {product.location?.state}</p>
              </div>
            </div>

            {/* Price & Purchase Card */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-3xl font-bold text-primary">
                      Rp{product.price?.toLocaleString('id-ID')}
                    </span>
                    <span className="text-muted-foreground ml-1">/ {product.unit || 'item'}</span>
                  </div>
                  <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </Badge>
                </div>

                {product.stock > 0 && (
                  <div className="space-y-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-l-lg text-lg font-bold disabled:opacity-50 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-r-lg text-lg font-bold disabled:opacity-50 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button onClick={handleAddToCart} size="lg" className="w-full gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart - Rp{(product.price * quantity).toLocaleString('id-ID')}
                    </Button>

                    {/* Save Product Button */}
                    {user && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full gap-2"
                        onClick={handleToggleSave}
                        disabled={isSaveLoading}
                      >
                        <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                        {isSaved ? 'Saved' : 'Save Product'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Contact Section */}
                <div className="pt-4 border-t space-y-3">
                  {product.seller?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Contact: {product.seller.phone}</span>
                    </div>
                  )}

                  {user && user.role === 'buyer' && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => navigate(`/chat?seller=${product.seller?._id}&from=product&productId=${product._id}`)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat with Seller
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ProductDetail;