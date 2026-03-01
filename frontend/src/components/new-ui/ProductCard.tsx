import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useSavedProductsStore } from "@/store/savedProductsStore";
import { useAuthStore } from "@/store/authStore";
import { resolveImageUrl } from "@/utils/imageUrl";

interface ProductCardProps {
  product: any;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const productId = product._id || product.id;
  const productImage = resolveImageUrl(product.images?.[0] || product.image);
  const sellerName =
    product.seller?.businessName ||
    product.seller?.name ||
    (typeof product.seller === "string" ? "Store" : null);
  const productRating = product.rating || 4.5;
  const reviewCount = product.reviewCount || product.reviews?.length || 0;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const { isProductSaved, toggleSaveProduct, isLoading } = useSavedProductsStore();
  const { isAuthenticated } = useAuthStore();
  const isSaved = isProductSaved(productId);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    if (!isSaved) {
      window.dispatchEvent(
        new CustomEvent("particle-burst", {
          detail: { type: "save", x: e.clientX, y: e.clientY },
        })
      );
    }
    await toggleSaveProduct(productId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/product/${productId}`}
        className="group block endfield-card overflow-hidden bg-card hover:endfield-glow transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-display font-semibold px-2 py-0.5 rounded-sm">
              -{discountPercent}%
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSaveClick}
            disabled={isLoading}
            className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors ${isSaved ? "text-destructive" : "text-muted-foreground"
              }`}
          >
            <Heart
              className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`}
            />
          </button>

          {/* Scan line effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-hidden">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-line" />
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1">
          {sellerName && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{sellerName}</p>
          )}
          <h3 className="text-xs sm:text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto gap-1">
            <div>
              <span className="text-sm sm:text-base font-display font-bold text-primary block">
                Rp {product.price?.toLocaleString("id-ID")}
              </span>
              {hasDiscount && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                  Rp {product.originalPrice?.toLocaleString("id-ID")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:mt-0 mt-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {productRating.toFixed?.(1) || productRating} ({reviewCount})
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
