import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/products/ProductCard";
import { resolveImageUrl } from "@/utils/imageUrl";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useScrollReveal";
import {
  ArrowRight,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  ShoppingBag,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useTranslation } from "@/hooks/useTranslation";

const normalizeProductsPayload = (payload) => {
  if (Array.isArray(payload)) return { products: payload, pagination: { total: payload.length } };
  if (Array.isArray(payload?.products)) return payload;
  if (Array.isArray(payload?.data)) return { products: payload.data, pagination: payload.pagination || { total: payload.data.length } };
  return { products: [], pagination: { total: 0 } };
};

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);

  const categoryGrid = useStaggerReveal();
  const featuredGrid = useStaggerReveal();

  const heroSlides = [
    { image: "/images/hero/nasi-goreng.webp", title: "Nasi Goreng Special", desc: "Bumbu rahasia pilihan untuk rasa yang tak terlupakan" },
    { image: "/images/hero/rendang.webp", title: "Rendang Daging Sapi", desc: "Rendang asli Padang, masakan terenak di dunia" },
    { image: "/images/hero/sate-ayam.webp", title: "Sate Ayam Khas Solo", desc: "Sate ayam dengan bumbu kacang spesial" },
    { image: "/images/hero/kopi-susu.jpg", title: "Kopi Susu Gula Aren", desc: "Racikan kopi susu manis khas Indonesia" },
    { image: "/images/hero/bakso-malang.webp", title: "Bakso Malang Jumbo", desc: "Bakso daging sapi asli dengan kuah kaldu gurih" },
  ];

  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(slideInterval.current);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.allSettled([
          api.get('/products/categories/counts'),
          api.get('/products?limit=6&sort=newest'),
        ]);
        if (catRes.status === 'fulfilled') setCategoryCounts(catRes.value.data);
        if (prodRes.status === 'fulfilled') {
          const normalized = normalizeProductsPayload(prodRes.value.data);
          setFeaturedProducts(normalized.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const resetSlideTimer = () => {
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
  };

  const categories = [
    { id: "food", name: "Makanan", icon: "🍜" },
    { id: "fashion", name: "Fashion", icon: "👕" },
    { id: "handicrafts", name: "Kerajinan", icon: "🎨" },
    { id: "beauty", name: "Kecantikan", icon: "💄" },
    { id: "electronics", name: "Elektronik", icon: "📱" },
    { id: "home", name: "Rumah Tangga", icon: "🏠" },
    { id: "agriculture", name: "Pertanian", icon: "🌾" },
    { id: "services", name: "Jasa", icon: "🛠️" },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-background min-h-[65vh] md:min-h-[75vh]">
        <div className="absolute inset-0 -z-10">
          {heroSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            const isPrev = index === (currentSlide - 1 + heroSlides.length) % heroSlides.length;
            if (!isActive && !isPrev) return null;
            return (
              <div
                key={index}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${resolveImageUrl(slide.image)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.7s ease-in-out',
                  zIndex: isActive ? 1 : 0,
                }}
              />
            );
          })}
          <div className="absolute inset-0 bg-black/55" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 pattern-dots opacity-40" style={{ zIndex: 2 }} />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => { setCurrentSlide(index); resetSlideTimer(); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-primary w-8' : 'bg-white/40 hover:bg-white/70 w-2'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => { setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length); resetSlideTimer(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setCurrentSlide(prev => (prev + 1) % heroSlides.length); resetSlideTimer(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="container py-20 md:py-28 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              MARKETPLACE UMKM INDONESIA
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3 leading-tight">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-base md:text-lg text-gray-300 mb-8 max-w-lg mx-auto">
              {heroSlides[currentSlide].desc}
            </p>

            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari produk, toko, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-base bg-white/95 border-0 text-gray-900 placeholder:text-gray-400 rounded-xl shadow-lg"
                />
                <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 rounded-lg">
                  Cari
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="py-10 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { icon: Store, count: 28, label: "Penjual UMKM" },
              { icon: ShoppingBag, count: 350, label: "Produk Tersedia" },
              { icon: MapPin, count: 5, label: "Kota Tersedia" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="text-xl md:text-2xl font-bold text-foreground">{stat.count}+</span>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-6 geo-border-top pt-3">
            <h2 className="text-lg font-bold text-foreground">Kategori</h2>
            <Link to="/products" className="text-primary text-sm font-medium hover:underline">
              Lihat semua &rarr;
            </Link>
          </div>
          <div
            ref={categoryGrid.ref}
            className={`grid grid-cols-4 md:grid-cols-8 gap-3 stagger-container ${categoryGrid.isVisible ? 'revealed' : ''}`}
          >
            {categories.map((category, index) => {
              const count = categoryCounts[category.id] || 0;
              return (
                <Link key={category.id} to={`/products?category=${category.id}`} className="stagger-item" style={{ '--stagger-index': index }}>
                  <div className="bg-card border border-border rounded-xl p-3 md:p-4 text-center hover:border-primary/30 hover:shadow-sm transition-all">
                    <span className="text-2xl block mb-1.5">{category.icon}</span>
                    <p className="text-xs font-medium text-card-foreground">{category.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{count} produk</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 bg-card relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots-sm opacity-30 pointer-events-none" />
        <div className="container relative">
          <div className="flex items-center justify-between mb-6 geo-border-top pt-3">
            <h2 className="text-lg font-bold text-foreground">Produk Unggulan</h2>
            <Link to="/products" className="text-primary text-sm font-medium hover:underline">
              Lihat semua &rarr;
            </Link>
          </div>
          <div
            ref={featuredGrid.ref}
            className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-container ${featuredGrid.isVisible ? 'revealed' : ''}`}
          >
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => (
                <div key={product._id || product.id} className="stagger-item" style={{ '--stagger-index': index }}>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8 text-sm">Memuat produk...</p>
            )}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 md:p-10 text-center geo-accent">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">{t('home.featureNearby')}</h2>
            <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
              {t('home.featureNearbyDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="gap-2" asChild>
                <Link to="/nearby">
                  <MapPin className="h-4 w-4" />
                  {t('home.findNearby')}
                </Link>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/sell">
                  <Store className="h-4 w-4" />
                  {t('home.startSelling')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default Home;
