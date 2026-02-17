import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/products/ProductCard";
import ForumPostCard from "@/components/forums/ForumPostCard";
import {
  ArrowRight,
  MapPin,
  Users,
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import { useTranslation } from "@/hooks/useTranslation";

// Category definitions with icons (counts fetched from API)
const categoryDefs = [
  { id: "food", key: "food", icon: "🍜" },
  { id: "handicrafts", key: "handicrafts", icon: "🎨" },
  { id: "clothing", key: "fashion", icon: "👗" },
  { id: "beauty", key: "health", icon: "🌿" },
  { id: "home", key: "home", icon: "🏠" },
  { id: "electronics", key: "electronics", icon: "📱" },
];

const Home = () => {
  const { t } = useTranslation();
  const [categoryCounts, setCategoryCounts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentForumPosts, setRecentForumPosts] = useState([]);
  const [stats, setStats] = useState({ sellers: 0, products: 0, cities: 1 });

  useEffect(() => {
    // Fetch category counts
    const fetchCategoryCounts = async () => {
      try {
        const response = await api.get('/products/categories/counts');
        setCategoryCounts(response.data);
      } catch (error) {
        console.error('Failed to fetch category counts:', error);
      }
    };

    // Fetch featured products (newest 4)
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products?limit=4&sort=newest');
        setFeaturedProducts(response.data.products || []);
        setStats(prev => ({ ...prev, products: response.data.pagination?.total || 0 }));
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      }
    };

    // Fetch forum posts
    const fetchForumPosts = async () => {
      try {
        const response = await api.get('/forum?limit=3');
        setRecentForumPosts(response.data.threads || []);
      } catch (error) {
        console.error('Failed to fetch forum posts:', error);
      }
    };

    // Fetch seller count
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
    fetchForumPosts();
    fetchSellerCount();
  }, []);
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              {t('home.heroBadge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              {t('home.heroHeading')}{" "}
              <span className="text-primary">{t('home.heroHeadingAccent')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('home.heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <ShoppingBag className="h-5 w-5" />
                  {t('home.browseProducts')}
                </Button>
              </Link>
              <Link to="/nearby">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  <MapPin className="h-5 w-5" />
                  {t('home.findNearby')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('home.activeSellers'), value: stats.sellers.toString(), icon: Users },
              { label: t('home.productsListed'), value: stats.products.toString(), icon: ShoppingBag },
              { label: t('home.citiesCovered'), value: "1", icon: MapPin },
              { label: t('home.categoriesCount'), value: categoryDefs.length.toString(), icon: TrendingUp },
            ].map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{t('home.shopByCategory')}</h2>
              <p className="text-muted-foreground mt-1">{t('home.findProductsMatch')}</p>
            </div>
            <Link to="/categories">
              <Button variant="ghost" className="gap-2">
                {t('home.viewAll')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryDefs.map((category) => (
              <Link key={category.id} to={`/products?category=${category.id}`}>
                <Card className="text-center hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                  <CardContent className="pt-6">
                    <span className="text-4xl mb-3 block">{category.icon}</span>
                    <h3 className="font-medium text-sm">{t(`categories.${category.key}`)}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{categoryCounts[category.id] || 0} {t('products.productsCount')}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{t('home.featuredProducts')}</h2>
              <p className="text-muted-foreground mt-1">{t('home.handpickedItems')}</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" className="gap-2">
                {t('home.viewAll')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">{t('home.whyChoose')}</h2>
            <p className="text-muted-foreground mt-2">{t('home.whyChooseDesc')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: t('home.featureNearby'),
                description: t('home.featureNearbyDesc'),
              },
              {
                icon: Shield,
                title: t('home.featureVerified'),
                description: t('home.featureVerifiedDesc'),
              },
              {
                icon: MessageCircle,
                title: t('home.featureChat'),
                description: t('home.featureChatDesc'),
              },
              {
                icon: Users,
                title: t('home.featureForums'),
                description: t('home.featureForumsDesc'),
              },
              {
                icon: Zap,
                title: t('home.featureEasy'),
                description: t('home.featureEasyDesc'),
              },
              {
                icon: TrendingUp,
                title: t('home.featureGrow'),
                description: t('home.featureGrowDesc'),
              },
            ].map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Community Forum Preview */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{t('home.communityDiscussions')}</h2>
              <p className="text-muted-foreground mt-1">{t('home.communityDesc')}</p>
            </div>
            <Link to="/forums">
              <Button variant="ghost" className="gap-2">
                {t('home.viewAll')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {recentForumPosts.map((post) => (
              <ForumPostCard key={post._id || post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {t('home.ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sell">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                {t('home.startSelling')}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/nearby">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto">
                {t('home.findShopsNearby')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;