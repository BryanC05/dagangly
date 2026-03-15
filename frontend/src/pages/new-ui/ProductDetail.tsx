import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Star, Heart, Share2, ShoppingCart, ChevronRight, Flag, ArrowLeft,
  MessageCircle, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useCartStore, useAuthStore } from "@/store/authStore";
import { useSavedProductsStore } from "@/store/savedProductsStore";
import { resolveImageUrl } from "@/utils/imageUrl";
import api from "@/utils/api";
import ReviewSection from "@/components/ReviewSection";
import { useTranslation } from "@/hooks/useTranslation";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

  const { addToCart } = useCartStore();
  const { user } = useAuthStore();
  const { isProductSaved, toggleSaveProduct, isLoading: isSaveLoading } = useSavedProductsStore();

  useEffect(() => {
    const chatReturnUrl = sessionStorage.getItem("chatReturnUrl");
    if (!chatReturnUrl || chatReturnUrl !== location.pathname) {
      const referrer = document.referrer;
      if (referrer && referrer.includes("/products")) {
        sessionStorage.setItem("productDetailReturnUrl", "/products");
      } else if (!sessionStorage.getItem("productDetailReturnUrl")) {
        sessionStorage.setItem("productDetailReturnUrl", "/products");
      }
    }
  }, [location.pathname]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
  });

  const isSaved = product ? isProductSaved(product._id) : false;

  const handleToggleSave = async () => {
    if (!product) return;
    await toggleSaveProduct(product._id);
  };

  const getUnitPrice = () => {
    if (!product) return 0;
    let price = product.hasVariants && selectedVariant ? selectedVariant.price : product.price;
    Object.values(selectedOptions).forEach((sel: any) => {
      price += sel.priceAdjust || 0;
    });
    return price;
  };

  const getAvailableStock = () => {
    if (!product) return 0;
    if (product.hasVariants && selectedVariant) return selectedVariant.stock;
    return product.stock;
  };

  const handleOptionSelect = (groupName: string, optionName: string, priceAdjust: number, isMultiple: boolean) => {
    setSelectedOptions((prev) => {
      if (isMultiple) {
        const current = prev[groupName] || { chosen: [], priceAdjust: 0 };
        const isSelected = current.chosen.includes(optionName);
        const group = product.optionGroups?.find((g: any) => g.name === groupName);
        if (isSelected) {
          const newChosen = current.chosen.filter((n: string) => n !== optionName);
          const newAdjust = newChosen.reduce((sum: number, n: string) => {
            const opt = group?.options.find((o: any) => o.name === n);
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
      alert(t("productDetail.selectRequired") + ": " + t("productDetail.selectVariant"));
      return;
    }
    const missingRequired = product.optionGroups?.filter(
      (g: any) => g.required && (!selectedOptions[g.name] || selectedOptions[g.name].chosen.length === 0)
    );
    if (missingRequired?.length > 0) {
      alert(`${t("productDetail.selectRequired")}: ${missingRequired.map((g: any) => g.name).join(", ")}`);
      return;
    }
    const variant = selectedVariant ? { name: selectedVariant.name, price: selectedVariant.price } : null;
    const optionsArr = Object.values(selectedOptions).filter((o: any) => o.chosen.length > 0);
    addToCart(product, quantity, variant, optionsArr);
    alert(t("productDetail.addedToCart"));
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
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
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <div 
          className="flex items-center gap-4 justify-center mb-6 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{t("productDetail.productNotFound")}</h1>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("productDetail.backToProducts")}
        </Button>
      </div>
    );
  }

  const productImages = Array.isArray(product.images)
    ? product.images.map((img: string) => resolveImageUrl(img)).filter(Boolean)
    : [];
  const seller = typeof product.seller === "object" && product.seller !== null ? product.seller : null;
  const sellerId =
    (typeof product.seller === "string" ? product.seller : null) ||
    seller?._id ||
    seller?.id ||
    null;

  return (
    <div className="container py-8">
      {/* Clickable Back Header */}
      <div 
        className="flex items-center gap-4 mb-6 cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="endfield-card overflow-hidden bg-card mb-3">
            <div className="aspect-square bg-muted">
              {productImages[selectedImage] ? (
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
          </div>
          {productImages.length > 1 && (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2 scrollbar-hide">
              {productImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 flex-shrink-0 snap-start rounded-sm overflow-hidden border-2 transition-colors
                    ${i === selectedImage ? "border-primary" : "border-border"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          {/* Seller */}
          <Link
            to={sellerId ? `/store/${sellerId}` : "#"}
            className="text-sm text-primary hover:underline mb-1"
          >
            {seller?.businessName || seller?.name || t("productDetail.store")}
          </Link>

          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{product.rating?.toFixed(1) || "4.5"}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount || product.reviews?.length || 0} {t("productDetail.reviews")})
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="font-display text-3xl font-bold text-primary">
              Rp{getUnitPrice().toLocaleString("id-ID")}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through ml-3">
                Rp{product.originalPrice.toLocaleString("id-ID")}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="font-mono">
                #{tag}
              </Badge>
            )) || (
                <>
                  <Badge variant="outline" className="font-mono">#produk-lokal</Badge>
                  <Badge variant="outline" className="font-mono">#umkm</Badge>
                </>
              )}
          </div>

          {/* Variant Selector */}
          {product.hasVariants && product.variants?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-3">{t("productDetail.selectVariant")}</h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedVariant?.name === v.name
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted border-border"
                      } ${v.stock <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={v.stock <= 0}
                  >
                    <span>{v.name}</span>
                    <span className="block text-xs mt-0.5">Rp{v.price?.toLocaleString("id-ID")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option Groups */}
          {product.optionGroups?.length > 0 && product.optionGroups.map((group: any) => (
            <div key={group.name} className="mb-4">
              <h4 className="text-sm font-medium mb-2">
                {group.name} {group.required && <span className="text-destructive">*</span>}
                {group.multiple && <span className="text-xs text-muted-foreground ml-1">({t("productDetail.selectMultiple")})</span>}
              </h4>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt: any) => {
                  const isSelected = selectedOptions[group.name]?.chosen?.includes(opt.name);
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => handleOptionSelect(group.name, opt.name, opt.priceAdjust || 0, group.multiple)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted border-border"
                        }`}
                    >
                      {opt.name}
                      {opt.priceAdjust > 0 && (
                        <span className="text-xs ml-1">(+Rp{opt.priceAdjust.toLocaleString("id-ID")})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity + Actions */}
          {getAvailableStock() > 0 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-border rounded-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-sm hover:bg-muted" disabled={quantity <= 1}>−</button>
                  <span className="px-4 py-2 text-sm font-display border-x border-border">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(getAvailableStock(), quantity + 1))} className="px-3 py-2 text-sm hover:bg-muted" disabled={quantity >= getAvailableStock()}>+</button>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <Button
                  className="flex-1 font-display tracking-wide"
                  size="lg"
                  onClick={(e) => {
                    handleAddToCart();
                    window.dispatchEvent(new CustomEvent("particle-burst", {
                      detail: { type: "add-to-cart", x: e.clientX, y: e.clientY },
                    }));
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t("productDetail.addToCart")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={async (e) => {
                    if (!isSaved) {
                      window.dispatchEvent(new CustomEvent("particle-burst", {
                        detail: { type: "save", x: e.clientX, y: e.clientY },
                      }));
                    }
                    await handleToggleSave();
                  }}
                  disabled={isSaveLoading}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.share) {
                      navigator.share({ title: product.name, url });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert(t("productDetail.linkCopied"));
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Contact */}
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {seller?.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{t("productDetail.contact")}: {seller.phone}</span>
              </div>
            )}
            {user && user.role === "buyer" && sellerId && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate(`/chat?seller=${sellerId}&from=product&productId=${product._id}`)}
              >
                <MessageCircle className="h-4 w-4" />
                {t("productDetail.chatWithSeller")}
              </Button>
            )}
            {user && (
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  const reason = prompt(t("productDetail.reportReason"));
                  if (!reason) return;
                  try {
                    const { getApiUrl } = await import("@/config");
                    await fetch(`${getApiUrl()}/reports/`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                      },
                      body: JSON.stringify({ targetType: "product", targetId: product._id, reason }),
                    });
                    alert(t("productDetail.reportSubmitted"));
                  } catch {
                    alert(t("productDetail.reportFailed"));
                  }
                }}
              >
                <Flag className="h-3 w-3" /> {t("productDetail.reportProduct")}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <section className="endfield-card bg-card p-6 mb-12">
        <ReviewSection productId={id} />
      </section>
    </div>
  );
}
