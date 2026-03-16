import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Store, Star, Heart } from 'lucide-react';
import { resolveImageUrl } from '@/utils/imageUrl';
import { useWishlistStore } from '@/store/wishlistStore';
import { useEffect } from 'react';
import './ProductCard.css';

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isProductInWishlist, fetchWishlists, wishlists } = useWishlistStore();
  
  const sellerId =
    (typeof product.seller === 'string' ? product.seller : null) ||
    product.seller?._id ||
    product.seller?.id ||
    null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && wishlists.length === 0) {
      fetchWishlists();
    }
  }, []);

  const isInWishlist = isProductInWishlist(product._id);

  const handleSellerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (sellerId) {
      navigate(`/store/${sellerId}`);
    }
  };

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    
    if (isInWishlist) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  const productPrice = product.price ? `Rp ${product.price}` : 'Price not available';
  const stockStatus = product.stock > 0 ? 'In Stock' : 'Out of Stock';
  const sellerRating = product.seller?.rating > 0 ? `${product.seller.rating.toFixed(1)} out of 5 stars` : undefined;

  return (
    <article className="product-card card" aria-labelledby={`product-name-${product._id}`}>
      <Link 
        to={`/product/${product._id}`} 
        className="product-image-container"
        aria-label={`View ${product.name}, ${productPrice}, ${stockStatus}`}
      >
        {product.images?.[0] ? (
          <img 
            src={resolveImageUrl(product.images[0])} 
            alt="" 
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder" role="img" aria-label="No image available">
            <span>📷</span>
          </div>
        )}
        <span className="product-category" aria-label={`Category: ${product.category}`}>{product.category}</span>
        <button 
          className={`wishlist-overlay-btn ${isInWishlist ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={20} fill={isInWishlist ? 'currentColor' : 'none'} />
        </button>
      </Link>

      <div className="product-details">
        <h3 id={`product-name-${product._id}`} className="product-name">
          <Link to={`/product/${product._id}`} className="product-name-link">
            {product.name}
          </Link>
        </h3>

        <button 
          className="product-seller-info" 
          onClick={handleSellerClick} 
          title="View store"
          aria-label={`View store: ${product.seller?.businessName || product.seller?.name}`}
        >
          <Store size={14} aria-hidden="true" />
          <span className="seller-link">{product.seller?.businessName || product.seller?.name}</span>
          {product.seller?.rating > 0 && (
            <span className="seller-rating" aria-label={sellerRating}>
              <Star size={12} fill="#fbbf24" aria-hidden="true" />
              {product.seller.rating.toFixed(1)}
            </span>
          )}
        </button>

        {product.location?.city && (
          <div className="product-location">
            <MapPin size={14} aria-hidden="true" />
            <span>{product.location.city}</span>
          </div>
        )}

        <div className="product-footer">
          <p className="font-bold text-lg text-primary" aria-label={`Price: ${productPrice}`}>
            Rp {product.price}
          </p>
          {product.stock > 0 ? (
            <span className="stock-badge in-stock" aria-label={stockStatus}>In Stock</span>
          ) : (
            <span className="stock-badge out-of-stock" aria-label={stockStatus}>Out of Stock</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
