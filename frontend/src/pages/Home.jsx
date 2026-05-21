import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/products/ProductCard";
import { OnboardingPrompt } from "@/components/ui/OnboardingTour";
import { resolveImageUrl } from "@/utils/imageUrl";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useScrollReveal";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import {
  ArrowRight,
  MapPin,
  Users,
  ShoppingBag,
  Search,
  CreditCard,
  Package,
  Handshake,
  ChevronLeft,
  ChevronRight,
  Store,
  TrendingUp
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useTranslation } from "@/hooks/useTranslation";

const normalizeProductsPayload = (payload) => {
  if (Array.isArray(payload)) {
    return {
      products: payload,
      pagination: { total: payload.length },
    };
  }

  if (Array.isArray(payload?.products)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return {
      products: payload.data,
      pagination: payload.pagination || { total: payload.data.length },
    };
  }

  return { products: [], pagination: { total: 0 } };
};

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stats, setStats] = useState({ sellers: 0, products: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);

  // Scroll reveal hooks
  const categoryReveal = useScrollReveal();
  const categoryGrid = useStaggerReveal();
  const featuredReveal = useScrollReveal();
  const featuredGrid = useStaggerReveal();
  const howToReveal = useScrollReveal();
  const howToGrid = useStaggerReveal();
  const ctaReveal = useScrollReveal();
  const statsReveal = useScrollReveal();

  // Animated counters
  const sellerCounter = useAnimatedCounter(stats.sellers || 28, { duration: 1200 });
  const productCounter = useAnimatedCounter(stats.products || 350, { duration: 1400, delay: 200 });
  const orderCounter = useAnimatedCounter(1200, { duration: 1600, delay: 400 });

  const heroSlides = [
    {
      image: "/uploads/products/nasi-goreng.webp",
      title: "Nasi Goreng Special",
      desc: "Bumbu rahasia pilihan untuk rasa yang tak terlupakan"
    },
    {
      image: "/uploads/products/rendang.webp",
      title: "Rendang Daging Sapi",
      desc: "Rendang asli Padang, masakan terenak di dunia"
    },
    {
      image: "/uploads/products/sate-ayam.webp",
      title: "Sate Ayam Khas Solo",
      desc: "Sate ayam dengan bumbu kacang spesial"
    },
    {
      image: "/uploads/products/kopi-susu.jpg",
      title: "Kopi Susu Gula Aren",
      desc: "Racikan kopi susu manis khas Indonesia"
    },
    {
      image: "/uploads/products/bakso-malang.webp",
      title: "Bakso Malang Jumbo",
      desc: "Bakso daging sapi asli dengan kuah kaldu gurih"
    },
    {
      image: "/uploads/products/es-cendol.jpeg",
      title: "Es Cendol Dawet",
      desc: "Kesegaran cendol dawet santan gula merah"
    },
    {
      image: "/uploads/products/ayam-goreng-kremes.jpeg",
      title: "Ayam Goreng Kremes",
      desc: "Ayam goreng renyah dengan kremesan gurih"
    },
    {
      image: "/uploads/products/brownies.webp",
      title: "Brownies Premium",
      desc: "Brownies cokelat lembut dengan topping pilihan"
    }
  ];

  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(slideInterval.current);
  }, [heroSlides.length]);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const response = await api.get('/products/categories/counts');
        setCategoryCounts(response.data);
      } catch (error) {
        console.error('Failed to fetch category counts:', error);
      }
    };

    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products?limit=6&sort=newest');
        const normalized = normalizeProductsPayload(response.data);
        setFeaturedProducts(normalized.products || []);
        setStats(prev => ({ ...prev, products: normalized.pagination?.total || 0 }));
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        setFeaturedProducts([]);
      }
    };

    const fetchSellerCount = async () => {
      try {
        const response = await api.get('/users/sellers/count');
        setStats(prev => ({ ...prev, sellers: response.data.count || 0 }));
      } catch (error) {
        console.error('Failed to fetch seller count:', error);
      }
    };

    fetchCategoryCounts();
    fetchFeaturedProducts();
    fetchSellerCount();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const resetSlideTimer = () => {
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
  };

  const howToSteps = [
    { icon: Search, title: t('onboarding.step1Title'), desc: t('onboarding.step1Desc') },
    { icon: ShoppingBag, title: t('onboarding.step2Title'), desc: t('onboarding.step2Desc') },
    { icon: CreditCard, title: t('onboarding.step3Title'), desc: t('onboarding.step3Desc') },
    { icon: Package, title: t('onboarding.step4Title'), desc: t('onboarding.step4Desc') },
  ];

  const categories = [
    { id: "food", name: "Makanan", icon: "🍜", gradient: "from-orange-500/20 to-amber-500/10" },
    { id: "fashion", name: "Fashion", icon: "👕", gradient: "from-pink-500/20 to-rose-500/10" },
    { id: "handicrafts", name: "Kerajinan", icon: "🎨", gradient: "from-purple-500/20 to-violet-500/10" },
    { id: "beauty", name: "Kecantikan", icon: "💄", gradient: "from-rose-500/20 to-pink-500/10" },
    { id: "electronics", name: "Elektronik", icon: "📱", gradient: "from-blue-500/20 to-cyan-500/10" },
    { id: "home", name: "Rumah Tangga", icon: "🏠", gradient: "from-teal-500/20 to-emerald-500/10" },
    { id: "agriculture", name: "Pertanian", icon: "🌾", gradient: "from-green-500/20 to-lime-500/10" },
    { id: "services", name: "Jasa", icon: "🛠️", gradient: "from-slate-500/20 to-gray-500/10" },
  ];

  return (
    <>
      {/* ===== HERO SECTION with Slideshow ===== */}
      <section className="relative overflow-hidden bg-background min-h-[60vh] md:min-h-[70vh]">
        {/* Gradient Mesh Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="gradient-orb gradient-orb-1" style={{ top: '10%', left: '5%' }} />
          <div className="gradient-orb gradient-orb-2" style={{ top: '60%', right: '10%' }} />
        </div>

        {/* Slideshow Background — only render current + adjacent slides for perf */}
        <div className="absolute inset-0 -z-10">
          {heroSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            const isPrev = index === (currentSlide - 1 + heroSlides.length) % heroSlides.length;
            // Only render current and previous slide to avoid 8 stacked full-screen images
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
          <div className="absolute inset-0 bg-black/50" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" style={{ zIndex: 2 }} />
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => { setCurrentSlide(index); resetSlideTimer(); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-primary w-8'
                  : 'bg-white/50 hover:bg-white/80 w-2'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => { setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length); resetSlideTimer(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 glass-subtle rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => { setCurrentSlide(prev => (prev + 1) % heroSlides.length); resetSlideTimer(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 glass-subtle rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="container py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-white/30 text-white glass-subtle rounded-full inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              MARKETPLACE UMKM INDONESIA
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-xl mx-auto">
              {heroSlides[currentSlide].desc}
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <Input
                  type="search"
                  placeholder={t('products.searchPlaceholder') || "Cari produk, toko, atau kategori..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-white border-white text-gray-900 placeholder:text-gray-500 rounded-xl shadow-lg"
                />
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground btn-ripple rounded-lg">
                  Cari
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-6 bg-card border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="gradient-orb gradient-orb-3" style={{ top: '-50%', left: '50%' }} />
        </div>
        <div
          ref={statsReveal.ref}
          className={`container reveal ${statsReveal.isVisible ? 'revealed' : ''}`}
        >
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center" ref={sellerCounter.ref}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{sellerCounter.count}+</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Penjual UMKM</p>
            </div>
            <div className="text-center border-x border-border" ref={productCounter.ref}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{productCounter.count}+</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Produk Tersedia</p>
            </div>
            <div className="text-center" ref={orderCounter.ref}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{orderCounter.count}+</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Transaksi Berhasil</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES with Glow Cards ===== */}
      <section className="py-12 bg-background section-transition">
        <div className="container">
          <div
            ref={categoryReveal.ref}
            className={`flex items-center justify-between mb-8 reveal ${categoryReveal.isVisible ? 'revealed' : ''}`}
          >
            <h2 className="text-xl font-bold text-foreground">Kategori</h2>
            <Link to="/products" className="text-primary text-sm hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div
            ref={categoryGrid.ref}
            className={`grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4 stagger-container ${categoryGrid.isVisible ? 'revealed' : ''}`}
          >
            {categories.map((category, index) => {
              const count = categoryCounts[category.id] || 0;
              return (
                <Link key={category.id} to={`/products?category=${category.id}`}>
                  <div
                    className={`stagger-item category-glow bg-card border border-border rounded-xl p-3 md:p-4 text-center`}
                    style={{ '--stagger-index': index }}
                  >
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <p className="text-xs md:text-sm text-card-foreground font-medium mb-0.5">{category.name}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">{count} produk</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS with Stagger ===== */}
      <section className="py-12 bg-background section-transition">
        <div className="container">
          <div
            ref={featuredReveal.ref}
            className={`flex items-center justify-between mb-8 reveal ${featuredReveal.isVisible ? 'revealed' : ''}`}
          >
            <h2 className="text-xl font-bold text-foreground">Produk Unggulan</h2>
            <Link to="/products" className="text-primary text-sm hover:underline">
              Lihat semua →
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
              <p className="text-muted-foreground col-span-full text-center py-8">
                Memuat produk...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== HOW TO with Stagger ===== */}
      <section className="py-12 bg-card section-transition relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="gradient-orb gradient-orb-1" style={{ bottom: '-20%', right: '5%' }} />
        </div>
        <div className="container relative">
          <div
            ref={howToReveal.ref}
            className={`text-center mb-8 reveal ${howToReveal.isVisible ? 'revealed' : ''}`}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('home.featureEasy')}</h2>
            <p className="text-muted-foreground">{t('home.featureEasyDesc')}</p>
          </div>
          <div
            ref={howToGrid.ref}
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto stagger-container ${howToGrid.isVisible ? 'revealed' : ''}`}
          >
            {howToSteps.map((step, index) => (
              <div
                key={index}
                className="stagger-item text-center p-4 rounded-xl hover:bg-accent/50 transition-colors"
                style={{ '--stagger-index': index }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3 relative">
                  <step.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="gradient-orb" style={{ width: 400, height: 400, top: '-30%', right: '-5%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)', animation: 'drift-1 20s ease-in-out infinite', filter: 'blur(60px)' }} />
          <div className="gradient-orb" style={{ width: 300, height: 300, bottom: '-20%', left: '10%', background: 'radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%)', animation: 'drift-2 25s ease-in-out infinite', filter: 'blur(60px)' }} />
        </div>
        <div
          ref={ctaReveal.ref}
          className={`container text-center relative reveal ${ctaReveal.isVisible ? 'revealed' : ''}`}
        >
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {t('home.ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sell">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto h-12 btn-ripple">
                {t('home.startSelling')}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/nearby">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto h-12 btn-ripple">
                {t('home.findShopsNearby')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
export default Home;
