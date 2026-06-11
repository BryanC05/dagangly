import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [[page, direction], setPage] = useState([0, 0]);
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

  const currentSlide = Math.abs(page % heroSlides.length);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    slideInterval.current = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(slideInterval.current);
  }, [page]); // Re-run effect when page changes to reset interval correctly

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
      paginate(1);
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
      <section className="relative overflow-hidden h-[420px] md:h-[520px]">
        <div className="absolute inset-0 z-0 bg-background">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${resolveImageUrl(heroSlides[currentSlide].image)}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
              }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/50" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 pattern-dots opacity-30" style={{ zIndex: 2 }} />
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => { 
                const newDirection = index > currentSlide ? 1 : -1;
                setPage([index, newDirection]); 
                resetSlideTimer(); 
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-primary w-6' : 'bg-white/30 hover:bg-white/60 w-1.5'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => { paginate(-1); resetSlideTimer(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => { paginate(1); resetSlideTimer(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="container h-full flex items-center justify-center relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div 
              key={`badge-${currentSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white/90 text-[10px] font-bold tracking-widest mb-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              MARKETPLACE UMKM INDONESIA
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
                  {heroSlides[currentSlide].title}
                </h1>
                <p className="text-sm md:text-base text-white/80 mb-6 max-w-lg mx-auto font-medium">
                  {heroSlides[currentSlide].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari produk, toko, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-sm bg-white/95 border-0 text-gray-900 placeholder:text-gray-400 rounded-xl shadow-md"
                />
                <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-lg text-xs">
                  Cari
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="py-6 md:py-8 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-3 gap-2 md:gap-6 max-w-2xl mx-auto">
            {[
              { icon: Store, count: 28, label: "Penjual" },
              { icon: ShoppingBag, count: 350, label: "Produk" },
              { icon: MapPin, count: 5, label: "Kota" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                  <stat.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  <span className="text-lg md:text-2xl font-extrabold text-foreground">{stat.count}+</span>
                </div>
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-tight md:tracking-normal">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Kategori</h2>
            <Link to="/products" className="text-primary text-xs md:text-sm font-bold hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Link>
          </div>
          <div
            ref={categoryGrid.ref}
            className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 stagger-container ${categoryGrid.isVisible ? 'revealed' : ''}`}
          >
            {categories.map((category, index) => {
              const count = categoryCounts[category.id] || 0;
              return (
                <Link key={category.id} to={`/products?category=${category.id}`} className="stagger-item" style={{ '--stagger-index': index }}>
                  <div className="bg-card border border-border/60 rounded-xl p-3 md:p-4 text-center hover:border-primary/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <span className="text-2xl md:text-3xl block mb-1 md:mb-2">{category.icon}</span>
                    <p className="text-xs md:text-sm font-bold text-card-foreground">{category.name}</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">{count} produk</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-12 bg-surface/30 border-t border-border">
        <div className="container relative">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">Produk Unggulan</h2>
            <Link to="/products" className="text-primary text-xs md:text-sm font-bold hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
