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
import SEO from "@/components/SEO";

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
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stats, setStats] = useState({ sellers: 0, products: 0, cities: 0 });
  const [[page, direction], setPage] = useState([0, 0]);
  const slideInterval = useRef(null);

  const categoryGrid = useStaggerReveal();
  const featuredGrid = useStaggerReveal();

  const heroSlides = [
    {
      image: "/images/hero/nasi-goreng.webp",
      title: language === 'id' ? "Nasi Goreng Spesial" : "Special Fried Rice",
      desc: language === 'id' ? "Bumbu rahasia pilihan untuk rasa yang tak terlupakan" : "Select secret seasoning for an unforgettable taste"
    },
    {
      image: "/images/hero/rendang.webp",
      title: language === 'id' ? "Rendang Daging Sapi" : "Beef Rendang",
      desc: language === 'id' ? "Rendang asli Padang, masakan terenak di dunia" : "Authentic Padang rendang, the most delicious dish in the world"
    },
    {
      image: "/images/hero/sate-ayam.webp",
      title: language === 'id' ? "Sate Ayam Khas Solo" : "Solo Style Chicken Satay",
      desc: language === 'id' ? "Sate ayam dengan bumbu kacang spesial" : "Chicken satay with special peanut sauce"
    },
    {
      image: "/images/hero/kopi-susu.jpg",
      title: language === 'id' ? "Kopi Susu Gula Aren" : "Palm Sugar Milk Coffee",
      desc: language === 'id' ? "Racikan kopi susu manis khas Indonesia" : "Sweet Indonesian milk coffee blend"
    },
    {
      image: "/images/hero/bakso-malang.webp",
      title: language === 'id' ? "Bakso Malang Jumbo" : "Jumbo Malang Meatballs",
      desc: language === 'id' ? "Bakso daging sapi asli dengan kuah kaldu gurih" : "Real beef meatballs with savory broth"
    },
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
        const [catRes, prodRes, sellerRes] = await Promise.allSettled([
          api.get('/products/categories/counts'),
          api.get('/products?limit=6&sort=newest'),
          api.get('/users/sellers/count'),
        ]);
        if (catRes.status === 'fulfilled') setCategoryCounts(catRes.value.data);
        
        let fetchedProductsCount = 0;
        if (prodRes.status === 'fulfilled') {
          const normalized = normalizeProductsPayload(prodRes.value.data);
          setFeaturedProducts(normalized.products || []);
          fetchedProductsCount = normalized.pagination?.total || 0;
        }

        let fetchedSellersCount = 0;
        let fetchedCitiesCount = 0;
        if (sellerRes.status === 'fulfilled') {
          fetchedSellersCount = sellerRes.value.data.count || 0;
          fetchedCitiesCount = sellerRes.value.data.citiesCount || 0;
        }

        setStats({
          sellers: fetchedSellersCount,
          products: fetchedProductsCount,
          cities: fetchedCitiesCount,
        });
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
    { id: "food", name: language === 'id' ? "Makanan" : "Food & Beverages", icon: "🍜" },
    { id: "fashion", name: language === 'id' ? "Fashion" : "Fashion & Apparel", icon: "👕" },
    { id: "handicrafts", name: language === 'id' ? "Kerajinan" : "Handicrafts", icon: "🎨" },
    { id: "beauty", name: language === 'id' ? "Kecantikan" : "Health & Beauty", icon: "💄" },
    { id: "electronics", name: language === 'id' ? "Elektronik" : "Electronics", icon: "📱" },
    { id: "home", name: language === 'id' ? "Rumah Tangga" : "Home & Living", icon: "🏠" },
    { id: "agriculture", name: language === 'id' ? "Pertanian" : "Agriculture", icon: "🌾" },
    { id: "services", name: language === 'id' ? "Jasa" : "Services", icon: "🛠️" },
  ];

  return (
    <>
      <SEO title="Dagangly - Indonesian MSME Marketplace" description="Buy and sell authentic local products near you." />
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
            <div 
              className="inline-flex items-center gap-2 px-4 py-1.5 border-3 border-black bg-black text-primary text-[10px] font-black italic uppercase tracking-widest mb-4 shadow-[2px_2px_0px_0px_#fff]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {language === 'id' ? 'MARKETPLACE UMKM INDONESIA' : 'INDONESIAN MSME MARKETPLACE'}
            </div>
            <div className="h-[180px] sm:h-[190px] md:h-[210px] flex flex-col justify-center mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="inline-block bg-white border-4 border-black dark:border-[#FACC15] text-black font-display font-black italic uppercase text-2xl sm:text-3xl md:text-4xl px-6 py-4 rounded-lg shadow-[6px_6px_0px_0px_#F97316] rotate-[-1.5deg] mb-4 max-w-full">
                    {heroSlides[currentSlide].title}
                  </div>
                  <p className="text-sm md:text-base text-white font-black italic uppercase tracking-wider max-w-lg mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {heroSlides[currentSlide].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-black font-black z-10" />
                <input
                  type="search"
                  placeholder={language === 'id' ? "Cari produk, toko, atau kategori..." : "Search products, stores, or categories..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 h-12 text-sm bg-white border-3 border-black dark:border-[#FACC15] text-black placeholder:text-gray-400 placeholder:italic placeholder:font-black rounded-full shadow-[3px_3px_0px_0px_#F97316] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[4px_4px_0px_0px_#F97316] font-black italic tracking-wide transition-all"
                />
              </div>
              <button 
                type="submit" 
                className="persona-pill-btn shrink-0"
              >
                {language === 'id' ? 'Cari!' : 'Search!'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="py-6 md:py-8 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-3 gap-2 md:gap-6 max-w-2xl mx-auto">
            {[
              { icon: Store, count: stats.sellers, label: t("home.activeSellers") },
              { icon: ShoppingBag, count: stats.products, label: t("home.productsListed") },
              { icon: MapPin, count: stats.cities, label: t("home.citiesCovered") },
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

      <section className="py-10 md:py-12 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots-sm opacity-[0.08] pointer-events-none" />
        <div className="container relative z-10">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">{t("home.categoriesCount") || "Categories"}</h2>
            <Link to="/products" className="text-primary text-xs md:text-sm font-bold hover:underline flex items-center gap-1">
              {t("home.viewAll") || "View all"} <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
                  <div className="bg-card/75 backdrop-blur-md border border-border/50 shadow-sm rounded-xl p-3 md:p-4 text-center hover:border-primary/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <span className="text-2xl md:text-3xl block mb-1 md:mb-2">{category.icon}</span>
                    <p className="text-xs md:text-sm font-bold text-card-foreground">{category.name}</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">{count} {language === 'id' ? 'produk' : 'products'}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-12 bg-surface/30 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-[0.03] pointer-events-none" />
        <div className="container relative z-10">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">{t("home.featuredProducts") || "Featured Products"}</h2>
            <Link to="/products" className="text-primary text-xs md:text-sm font-bold hover:underline flex items-center gap-1">
              {t("home.viewAll") || "View all"} <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
              <p className="text-muted-foreground col-span-full text-center py-8 text-sm">{language === 'id' ? 'Memuat produk...' : 'Loading products...'}</p>
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
