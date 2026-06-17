import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useSavedProductsStore } from "@/store/savedProductsStore";
import { useAuthStore } from "@/store/authStore";
import { resolveImageUrl } from "@/utils/imageUrl";
import { Skeleton } from "@/components/ui/skeleton";

const ProductCard = ({ product, compact }) => {
    const productId = product._id || product.id;
    const productImage = resolveImageUrl(product.images?.[0] || product.image);
    const sellerName = product.seller?.businessName || product.seller?.name || (typeof product.seller === 'string' ? 'Store' : null);
    const productRating = product.totalReviews > 0 ? product.rating : null;
    const reviewCount = product.totalReviews || product.reviewCount || 0;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const { isProductSaved, toggleSaveProduct, isLoading } = useSavedProductsStore();
    const { isAuthenticated } = useAuthStore();
    const isSaved = isProductSaved(productId);

    const handleSaveClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) return;
        await toggleSaveProduct(productId);
    };

    if (compact) {
        return (
            <Link to={`/product/${productId}`} className="flex gap-3 bg-card border-3 border-black dark:border-[#FACC15] rounded-lg p-3 shadow-[3px_3px_0px_0px_#F97316] hover:shadow-[4px_4px_0px_0px_#F97316] hover:-translate-y-0.5 transition-all">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    {productImage ? (
                        <img src={productImage} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate not-italic">{product.name}</h3>
                    {sellerName && <p className="text-xs text-muted-foreground mt-0.5 not-italic">{sellerName}</p>}
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-primary font-bold text-sm">Rp {product.price?.toLocaleString('id-ID')}</p>
                        {hasDiscount && <p className="text-xs text-muted-foreground line-through">Rp {product.originalPrice?.toLocaleString('id-ID')}</p>}
                    </div>
                    {productRating != null && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-xs text-muted-foreground">{productRating.toFixed(1)} ({reviewCount})</span>
                        </div>
                    )}
                </div>
            </Link>
        );
    }

    return (
        <Link to={`/product/${productId}`}>
            <div className="group bg-card border-3 border-black dark:border-[#FACC15] rounded-xl overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_0px_#F97316] hover:shadow-[6px_6px_0px_0px_#F97316] hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden bg-muted/20">
                    {productImage ? (
                        <img
                            src={productImage}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                    )}
                    {hasDiscount && (
                        <div className="absolute top-2.5 left-2.5 bg-destructive text-white text-[10px] px-2 py-0.5 rounded border-2 border-black font-black italic uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                            -{discountPercent}%
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-2.5 right-2.5 bg-white/80 hover:bg-white backdrop-blur-md rounded-full h-7.5 w-7.5 shadow-sm transition-all ${isSaved ? 'text-red-500' : 'text-muted-foreground'}`}
                        onClick={handleSaveClick}
                        disabled={isLoading}
                    >
                        <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                </div>
                <div className="p-3 md:p-4">
                    {sellerName && (
                        <div className="flex items-center gap-1 mb-1 md:mb-1.5">
                            <Store className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" />
                            <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate not-italic">{sellerName}</p>
                        </div>
                    )}
                    <h3 className="font-bold text-xs md:text-sm text-card-foreground line-clamp-2 mb-1.5 min-h-[2.5em] md:min-h-[2.8em] leading-snug not-italic">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <p className="text-primary font-extrabold text-sm md:text-base">Rp {product.price?.toLocaleString('id-ID')}</p>
                        {hasDiscount && (
                            <p className="text-[9px] md:text-[11px] text-muted-foreground line-through decoration-destructive/20">Rp {product.originalPrice?.toLocaleString('id-ID')}</p>
                        )}
                    </div>
                    {productRating != null && (
                        <div className="flex items-center gap-1 mt-1.5 md:mt-2 bg-primary text-black font-black italic border-2 border-black self-start px-2 py-0.5 rounded-md w-fit shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-black text-black" />
                            <span className="text-[8px] md:text-[10px] font-bold">{productRating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
