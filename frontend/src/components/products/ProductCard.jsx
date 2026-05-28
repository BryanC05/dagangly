import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart } from "lucide-react";
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
            <Link to={`/product/${productId}`} className="flex gap-3 bg-card border border-border rounded-lg p-3 hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    {productImage ? (
                        <img src={productImage} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    {sellerName && <p className="text-xs text-muted-foreground mt-0.5">{sellerName}</p>}
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
            <div className="group bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="relative aspect-square overflow-hidden bg-muted">
                    {productImage ? (
                        <img
                            src={productImage}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                    )}
                    {hasDiscount && (
                        <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-semibold">
                            -{discountPercent}%
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-2 right-2 bg-background/60 hover:bg-background/80 backdrop-blur-sm rounded-full h-7 w-7 ${isSaved ? 'text-red-500' : 'text-muted-foreground'}`}
                        onClick={handleSaveClick}
                        disabled={isLoading}
                    >
                        <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                </div>
                <div className="p-3">
                    {sellerName && (
                        <p className="text-[10px] text-muted-foreground mb-1 truncate">{sellerName}</p>
                    )}
                    <h3 className="font-medium text-sm text-card-foreground line-clamp-2 mb-1.5 min-h-[2.5em]">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <p className="text-primary font-bold text-sm">Rp {product.price?.toLocaleString('id-ID')}</p>
                        {hasDiscount && (
                            <p className="text-[10px] text-muted-foreground line-through">Rp {product.originalPrice?.toLocaleString('id-ID')}</p>
                        )}
                    </div>
                    {productRating != null && (
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-[10px] text-muted-foreground">{productRating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
