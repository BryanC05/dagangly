import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Package, Plus, Trash2 } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { ProductsGridSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';

function SavedProducts() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { wishlists, loading, fetchWishlists, createWishlist, deleteWishlist } = useWishlistStore();
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      openLogin('/saved-products');
      return;
    }
    fetchWishlists();
  }, [isAuthenticated, navigate, fetchWishlists]);

  const handleCreateWishlist = async (e) => {
    e.preventDefault();
    if (!newWishlistName.trim()) return;
    await createWishlist(newWishlistName.trim());
    setNewWishlistName('');
    setShowCreateForm(false);
  };

  const getAllWishlistProducts = () => {
    const products = [];
    wishlists.forEach(wishlist => {
      wishlist.items?.forEach(item => {
        if (item.productId && !products.find(p => p._id === item.productId._id || p._id === item.productId)) {
          products.push(item.productId);
        }
      });
    });
    return products;
  };

  const savedProducts = getAllWishlistProducts();

  return (
    <>
      <div className="container py-8">
        {/* Header */}
        <div 
          className="flex items-center gap-4 mb-8 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t('wishlist.myWishlists')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('wishlist.emptyDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Create New Wishlist */}
        <div className="mb-6">
          {!showCreateForm ? (
            <Button variant="outline" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('wishlist.createNew')}
            </Button>
          ) : (
            <form onSubmit={handleCreateWishlist} className="flex gap-2 items-center">
              <input
                type="text"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                placeholder={t('wishlist.title')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
              <Button type="submit">{t('common.add')}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>{t('common.cancel')}</Button>
            </form>
          )}
        </div>

        {/* Wishlists */}
        {loading && <ProductsGridSkeleton count={8} />}

        {!loading && wishlists.length === 0 && (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{t('wishlist.empty')}</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('wishlist.emptyDesc')}
            </p>
            <Button onClick={() => navigate('/products')}>
              <Package className="h-4 w-4 mr-2" />
              {t('wishlist.browseProducts')}
            </Button>
          </div>
        )}

        {/* Wishlists List */}
        {!loading && wishlists.length > 0 && (
          <div className="space-y-8">
            {wishlists.map((wishlist) => (
              <div key={wishlist._id} className="wishlist-section">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {wishlist.name}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({(wishlist.items?.length || 0)} {(wishlist.items?.length || 0) === 1 ? t('wishlist.item') : t('wishlist.items')})
                      </span>
                    </h2>
                    {wishlist.isPublic && (
                      <span className="text-xs text-muted-foreground">{t('wishlist.public')}</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWishlist(wishlist._id)}
                    className="text-destructive hover:text-destructive/80"
                    aria-label="Delete wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {wishlist.items?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlist.items.map((item) => (
                      item.productId && (
                        <ProductCard 
                          key={item.productId._id || item.productId} 
                          product={item.productId} 
                        />
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4">
                    No items in this wishlist yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default SavedProducts;