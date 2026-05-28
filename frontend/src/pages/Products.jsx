import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStaggerReveal } from "@/hooks/useScrollReveal";
import ProductCard from "@/components/products/ProductCard";
import { ProductsGridSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Package, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import api from "@/utils/api";
import { useTranslation } from "@/hooks/useTranslation";

const normalizeProductsPayload = (payload) => {
  if (Array.isArray(payload)) return { products: payload, pagination: { page: 1, total: payload.length, pages: 1 } };
  if (Array.isArray(payload?.products)) return { products: payload.products, pagination: payload.pagination || { page: 1, total: payload.products.length, pages: 1 } };
  if (Array.isArray(payload?.data)) return { products: payload.data, pagination: payload.pagination || { page: 1, total: payload.data.length, pages: 1 } };
  return { products: [], pagination: { page: 1, total: 0, pages: 1 } };
};

const Products = () => {
  const { t, language } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [viewMode, setViewMode] = useState("grid");
  const productsGrid = useStaggerReveal({ threshold: 0.02 });

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  const categories = [
    { id: "all", name: t('products.allCategories') },
    { id: "food", name: t('categories.food') },
    { id: "clothing", name: t('categories.fashion') },
    { id: "electronics", name: t('categories.electronics') },
    { id: "handicrafts", name: t('categories.handicrafts') },
    { id: "home", name: t('categories.home') },
    { id: "beauty", name: t('categories.health') },
    { id: "agriculture", name: t('categories.agriculture') },
  ];

  const sortOptions = [
    { id: "newest", name: t('products.newest') },
    { id: "price-low", name: t('products.priceLowHigh') },
    { id: "price-high", name: t('products.priceHighLow') },
    { id: "rating", name: t('products.highestRated') },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
        if (sortBy) params.append("sort", sortBy);
        if (priceRange.min) params.append("minPrice", priceRange.min);
        if (priceRange.max) params.append("maxPrice", priceRange.max);
        params.append("page", pagination.page);
        params.append("limit", "20");

        const response = await api.get(`/products?${params.toString()}`);
        const normalized = normalizeProductsPayload(response.data);
        setProducts(normalized.products);
        setPagination(normalized.pagination);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery, selectedCategory, sortBy, priceRange.min, priceRange.max, pagination.page]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    setSearchParams(params);
  }, [selectedCategory, searchQuery, setSearchParams]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
  };

  const activeFiltersCount = [selectedCategory !== "all", priceRange.min, priceRange.max].filter(Boolean).length;

  return (
    <div className="bg-background min-h-screen">
      <div className="container py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Produk UMKM</h1>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Menampilkan {products.length} dari {pagination.total} produk
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder={t('products.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id} className="text-sm">
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPriceRange(prev => ({ min: "", max: "" }))}
            className={`gap-1.5 shrink-0 ${priceRange.min || priceRange.max ? "border-primary text-primary" : ""}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Harga
          </Button>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(priceRange.min || priceRange.max) && (
              <Badge variant="secondary" className="gap-1 text-xs">
                Rp{priceRange.min || "0"} - Rp{priceRange.max || "∞"}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange({ min: "", max: "" })} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6">
              Hapus filter
            </Button>
          </div>
        )}

        {loading ? (
          <ProductsGridSkeleton count={12} />
        ) : products.length > 0 ? (
          <>
            <div
              ref={productsGrid.ref}
              className={
                viewMode === "grid"
                  ? `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-container ${productsGrid.isVisible ? "revealed" : ""}`
                  : `flex flex-col gap-3 stagger-container ${productsGrid.isVisible ? "revealed" : ""}`
              }
            >
              {products.map((product, index) => (
                <div key={product._id} className="stagger-item" style={{ "--stagger-index": index }}>
                  <ProductCard product={product} compact={viewMode === "list"} />
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                  Halaman {pagination.page} dari {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Tidak ada produk ditemukan</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Hapus filter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
