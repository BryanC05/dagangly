import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useTranslation } from '../hooks/useTranslation';

function WishlistButton({ productId, size = 'default', showLabel = false }) {
  const [loading, setLoading] = useState(false);
  const { addToWishlist, removeFromWishlist, isProductInWishlist, wishlists } = useWishlistStore();
  const { t } = useTranslation();
  
  const isInWishlist = isProductInWishlist(productId);
  
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 28 : 20;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`wishlist-btn ${isInWishlist ? 'in-wishlist' : ''} size-${size}`}
      aria-label={isInWishlist ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')}
      title={isInWishlist ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Heart 
          size={iconSize} 
          fill={isInWishlist ? 'currentColor' : 'none'}
          stroke={isInWishlist ? 'currentColor' : 'currentColor'}
        />
      )}
      {showLabel && (
        <span className="wishlist-label">
          {isInWishlist ? t('wishlist.inWishlist') : t('wishlist.addToWishlist')}
        </span>
      )}
    </button>
  );
}

export default WishlistButton;
