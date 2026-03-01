import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Star, Package, ArrowLeft, Clock, MessageCircle, Share2, BadgeCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import ProductCard from '@/components/products/ProductCard';
import { ProductsGridSkeleton } from '@/components/ui/skeleton';

function SellerStore() {
  const { id } = useParams();
  const sellerId = id && id !== 'undefined' && id !== 'null' ? id : null;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ['seller', sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      const response = await api.get(`/users/seller/${sellerId}`);
      return response.data;
    },
    enabled: !!sellerId,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await api.get(`/products/seller/${sellerId}`);
      return response.data;
    },
    enabled: !!sellerId,
  });

  const shareStore = async () => {
    if (!seller?.location?.coordinates) return;

    const [lng, lat] = seller.location.coordinates;
    const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;
    const shareText = `Check out ${seller.businessName || seller.name}!\n${mapUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: seller.businessName || seller.name,
          text: shareText,
        });
        return;
      } catch {
        // Fall back to clipboard.
      }
    }

    await navigator.clipboard.writeText(shareText);
    alert('Store link copied to clipboard!');
  };

  if (sellerLoading) {
    return (
      <>
        <div className="container py-8 md:py-10">
          <ProductsGridSkeleton count={8} />
        </div>
      </>
    );
  }

  if (!seller) {
    return (
      <>
        <div className="container py-8 md:py-10">
          <div className="endfield-card p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Store Not Found</h2>
            <p className="text-muted-foreground mb-4">This seller does not exist or is no longer available.</p>
            <Link to="/nearby" className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              Find Nearby Sellers
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container py-8 md:py-10">
        <Link to="/nearby" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
          Back to Nearby Sellers
        </Link>

        <div className="endfield-card endfield-gradient flex flex-col md:flex-row gap-8 mb-10 p-6 md:p-8">
          <div className="shrink-0">
            {seller.profileImage ? (
              <img src={seller.profileImage} alt={seller.businessName} className="w-32 h-32 rounded-full object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold text-primary-foreground bg-primary">
                {(seller.businessName || seller.name || 'S')
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Seller Store</p>
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize">{seller.businessType} Enterprise</span>
              {seller.isVerified && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full inline-flex items-center gap-1">
                  <BadgeCheck size={14} />
                  Verified
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-1">{seller.businessName || seller.name}</h1>
            <p className="text-muted-foreground mb-4">by {seller.name}</p>

            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {seller.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={16} fill="#f59e0b" className="text-yellow-500" />
                  <span>{seller.rating.toFixed(1)}</span>
                </div>
              )}
              {seller.location?.city && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin size={16} />
                  <span>{seller.location.city}, {seller.location.state}</span>
                </div>
              )}
              {seller.location?.address && (
                <div className="hidden md:flex items-center gap-1 text-muted-foreground">
                  <span>{seller.location.address}</span>
                </div>
              )}
            </div>

            <div className="flex gap-6 text-sm mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Package size={16} />
                <span>{products?.length || 0} Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Member since {new Date(seller.createdAt).getFullYear()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {user && user.role === 'buyer' && (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  onClick={() => navigate(`/chat?seller=${sellerId}`)}
                >
                  <MessageCircle size={18} />
                  Chat with Store
                </button>
              )}

              {seller.location?.coordinates && (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  onClick={shareStore}
                >
                  <Share2 size={18} />
                  Share Location
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="endfield-card p-5 md:p-7">
          <h2 className="text-2xl font-bold mb-6">Products from this Store</h2>

          {productsLoading ? (
            <div className="text-muted-foreground">Loading products...</div>
          ) : products?.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">This seller hasn't listed any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default SellerStore;
