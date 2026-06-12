import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator,
    TextInput, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';
import ProductCard from '../../components/ProductCard';
import ForumPostCard from '../../components/ForumPostCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { HomeScreenSkeleton } from '../../components/LoadingSkeleton';
import { CATEGORIES_EN, CATEGORIES_ID, OFFLINE_TESTING_MODE } from '../../config';
import { DEFAULT_LOCATION } from '../../utils/constants';
import * as Location from 'expo-location';
import { useResponsive } from '../../hooks/useResponsive';
import { getProducts, getRecommendations, getTrendingProducts } from '../../data/mockApi';
import productImages from '../../assets/productImages';
import { createStyles } from './styles';

export default function HomeScreen({ navigation }) {
    const { colors, isDarkMode } = useThemeStore();
    const { t, language } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width: screenWidth, isMobile, isTablet, isDesktop } = useResponsive();
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ sellers: 0, products: 0 });
    const [categoryCounts, setCategoryCounts] = useState({});
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [dailyDeals, setDailyDeals] = useState([]);
    const [forumPosts, setForumPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nearbySellers, setNearbySellers] = useState([]);
    const [nearbyLoading, setNearbyLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const slideInterval = useRef(null);

    const heroSlides = [
        {
            image: "nasi_goreng.webp",
            title: "Nasi Goreng Special",
            desc: "Bumbu rahasia pilihan untuk rasa yang tak terlupakan",
        },
        {
            image: "bakmi.png",
            title: "Mie Ayam Bakso",
            desc: "Mie ayam dengan bakso daging sapi pilihan",
        },
        {
            image: "kopi-susu.jpg",
            title: "Kopi Susu Gula Aren",
            desc: "Racikan kopi susu manis khas Indonesia",
        },
        {
            image: "brownies.webp",
            title: "Brownies Premium",
            desc: "Brownies cokelat dengan topping pilihan",
        },
        {
            image: "sate-ayam.webp",
            title: "Sate Ayam Khas Solo",
            desc: "Sate ayam dengan bumbu kacang spesial",
        },
    ];

    // Auto-advance slideshow
    useEffect(() => {
        slideInterval.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => {
            if (slideInterval.current) clearInterval(slideInterval.current);
        };
    }, [heroSlides.length]);

    // Collapsible sections state
    const [collapsedSections, setCollapsedSections] = useState({
        nearby: false,
        categories: false,
        featured: false,
        forum: false,
    });

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const allCategories = language === 'id' ? CATEGORIES_ID : CATEGORIES_EN;
    const categories = allCategories.filter((c) => c.id !== 'all');

    const fetchData = useCallback(async () => {
        if (OFFLINE_TESTING_MODE) {
            setLoading(true);
            try {
                const newProducts = getProducts({ limit: 6 });
                const trending = getTrendingProducts();
                const recommended = getRecommendations();

                setFeaturedProducts(newProducts.products || []);
                setTrendingProducts(trending.products || []);
                setDailyDeals(recommended.products || []);
                setStats({ sellers: 3, products: newProducts.total });
                setCategoryCounts({ food: 14, beverages: 9, snacks: 5 });
                setNearbySellers([]);
                setForumPosts([]);
            } catch (error) {
                console.error('Error loading mock data:', error);
            } finally {
                setLoading(false);
                setNearbyLoading(false);
            }
            return;
        }

        let coords = userLocation;

        if (!coords) {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };
                    setUserLocation(coords);
                }
            } catch (error) {
                console.log('Location error:', error);
            }
        }

        if (!coords) {
            coords = { latitude: DEFAULT_LOCATION.Bekasi.lat, longitude: DEFAULT_LOCATION.Bekasi.lng };
        }

        try {

            const [productsRes, trendingRes, dealsRes, forumRes, countsRes, sellersRes, nearbyRes] = await Promise.allSettled([
                api.get('/products?limit=6&sort=newest'),
                api.get('/products?limit=6&sort=trending'),
                api.get('/products?limit=6&sort=deals'),
                api.get('/forum?limit=3'),
                api.get('/products/categories/counts'),
                api.get('/users/sellers/count'),
                api.get('/users/nearby-sellers', {
                    params: {
                        lat: coords.latitude,
                        lng: coords.longitude,
                        radius: 25000,
                        limit: 5,
                    },
                }),
            ]);

            if (productsRes.status === 'fulfilled') {
                setFeaturedProducts(productsRes.value.data.products || []);
                setStats((p) => ({ ...p, products: productsRes.value.data.pagination?.total || 0 }));
            }
            if (trendingRes.status === 'fulfilled') {
                setTrendingProducts(trendingRes.value.data.products || []);
            }
            if (dealsRes.status === 'fulfilled') {
                setDailyDeals(dealsRes.value.data.products || []);
            }
            if (forumRes.status === 'fulfilled') {
                setForumPosts(forumRes.value.data.threads || []);
            }
            if (countsRes.status === 'fulfilled') {
                setCategoryCounts(countsRes.value.data || {});
            }
            if (sellersRes.status === 'fulfilled') {
                setStats((p) => ({ ...p, sellers: sellersRes.value.data.count || 0 }));
            }
            if (nearbyRes.status === 'fulfilled') {
                const payload = nearbyRes.value.data;
                const sellersData = Array.isArray(payload) ? payload : (payload?.sellers || []);
                setNearbySellers(sellersData.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching home data:', error);
        } finally {
            setLoading(false);
            setNearbyLoading(false);
        }
    }, [userLocation]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleSearch = () => {
        navigation.navigate('Browse', { screen: 'Products', params: { search: searchQuery } });
    };

    const styles = useMemo(() => createStyles(colors, isDarkMode, isMobile, isTablet), [colors, isDarkMode, isMobile, isTablet]);

    if (loading) {
        return <HomeScreenSkeleton />;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.hero}>
                {/* Slideshow Background */}
                {heroSlides.map((slide, index) => (
                    <ImageBackground
                        key={index}
                        source={productImages[slide.image] || {}}
                        style={styles.heroBackground}
                        imageStyle={{ opacity: index === currentSlide ? 1 : 0 }}
                        resizeMode="cover"
                    />
                ))}
                <View style={styles.heroOverlay} />

                {/* Slide Indicators */}
                <View style={styles.slideIndicatorContainer}>
                    {heroSlides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.slideIndicator,
                                {
                                    width: index === currentSlide ? 24 : 8,
                                    backgroundColor: index === currentSlide ? '#fff' : 'rgba(255,255,255,0.5)',
                                },
                            ]}
                        />
                    ))}
                </View>

                <View style={[styles.heroBadge, { marginTop: insets.top + 20 }]}>
                    <View style={styles.heroBadgeDot} />
                    <Text style={styles.heroBadgeText}>MARKETPLACE UMKM INDONESIA</Text>
                </View>

                <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>
                        {heroSlides[currentSlide].title}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        {heroSlides[currentSlide].desc}
                    </Text>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchInput}>
                        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchTextInput}
                            placeholder={t('searchProductsPlaceholder')}
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.searchBtn}
                        onPress={handleSearch}
                    >
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.sellers}+</Text>
                        <Text style={styles.statLabel}>Seller aktif</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.products}+</Text>
                        <Text style={styles.statLabel}>Produk tercatat</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{nearbySellers.length}</Text>
                        <Text style={styles.statLabel}>Terdekat</Text>
                    </View>
                </View>


            </View>

            {/* Nearby Sellers Section - Collapsible */}
            <View style={styles.nearbyMapSection}>
                <TouchableOpacity
                    style={styles.collapsibleHeader}
                    onPress={() => toggleSection('nearby')}
                >
                    <View style={styles.nearbyMapTitleRow}>
                        <Ionicons name="location" size={18} color={colors.primary} />
                        <Text style={styles.collapsibleTitle}>{t('nearbySellersTitle')}</Text>
                    </View>
                    <View style={styles.collapsibleToggle}>
                        <Text style={styles.collapsibleToggleText}>
                            {collapsedSections.nearby ? t('expand') : t('collapse')}
                        </Text>
                        <Ionicons
                            name={collapsedSections.nearby ? 'chevron-down' : 'chevron-up'}
                            size={16}
                            color={colors.textSecondary}
                        />
                    </View>
                </TouchableOpacity>

                {!collapsedSections.nearby && (
                    <View style={styles.nearbyMapCard}>
                        <View style={styles.nearbyMapHeader}>
                            <View>
                                <Text style={styles.nearbyMapSubtitle}>
                                    {nearbySellers.length} {t('nearbySellersCount')}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.nearbyMapBtn}
                                onPress={() => navigation.navigate('NearbySellers')}
                            >
                                <Text style={styles.nearbyMapBtnText}>{t('seeAll')}</Text>
                                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {nearbyLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        ) : nearbySellers.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.nearbySellersRow}
                            >
                                {nearbySellers.slice(0, 5).map((seller) => (
                                    <TouchableOpacity
                                        key={seller._id || seller.id}
                                        style={styles.nearbySellerItem}
                                        onPress={() => navigation.navigate('Home', {
                                            screen: 'BusinessDetails',
                                            params: { sellerId: seller._id || seller.id }
                                        })}
                                    >
                                        <View style={styles.nearbySellerIcon}>
                                            <Ionicons name="storefront" size={20} color={colors.primary} />
                                        </View>
                                        <View style={styles.nearbySellerInfo}>
                                            <Text style={styles.nearbySellerName} numberOfLines={1}>
                                                {seller.businessName || seller.name}
                                            </Text>
                                            <Text style={styles.nearbySellerLocation} numberOfLines={1}>
                                                {seller.location?.city || t('nearby')}
                                            </Text>
                                        </View>
                                        {seller.distanceKm && (
                                            <View style={styles.nearbySellerDistance}>
                                                <Ionicons name="navigate" size={10} color={colors.primary} />
                                                <Text style={styles.nearbySellerDistanceText}>
                                                    {seller.distanceKm.toFixed(1)} km
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                    {t('noNearbySellersFound')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {categories.filter((cat) => (categoryCounts[cat.id] || 0) > 0).length > 0 && (
                <View style={styles.sectionFrame}>
                <View style={styles.categorySection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('categories')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                            <Text style={styles.seeAll}>{t('seeAllLower')}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                        {categories
                            .filter((cat) => (categoryCounts[cat.id] || 0) > 0)
                            .slice(0, 8)
                            .map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={styles.catCard}
                                    onPress={() => navigation.navigate('Browse', { screen: 'Products', params: { category: cat.id, reset: true } })}
                                >
                                    <Text style={styles.catIcon}>{cat.icon}</Text>
                                    <Text style={styles.catName}>{cat.name}</Text>
                                    <Text style={styles.catCount}>{categoryCounts[cat.id]}</Text>
                                </TouchableOpacity>
                            ))}
                    </ScrollView>
                </View>
                </View>
            )}

            <View style={styles.sectionFrame}>
            <View style={styles.productsSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('featuredProducts')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                        <Text style={styles.seeAll}>{t('seeAllLower')}</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>
                    {featuredProducts.map((item) => (
                        <View key={item._id || item.id} style={{ width: (screenWidth - 56) / 2, marginRight: 12 }}>
                            <ProductCard
                                product={item}
                                onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
                            />
                        </View>
                    ))}
                </ScrollView>
            </View>
            </View>

            {/* Trending Products Section */}
            {trendingProducts.length > 0 && (
                <View style={styles.sectionFrame}>
                <View style={styles.productsSection}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="trending-up" size={20} color="#ef4444" />
                            <Text style={styles.sectionTitle}>{t('trendingProducts')}</Text>
                        </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>
                        {trendingProducts.map((item) => (
                            <View key={item._id || item.id} style={{ width: (screenWidth - 56) / 2, marginRight: 12 }}>
                                <ProductCard
                                    product={item}
                                    onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
                </View>
            )}

            {/* Daily Deals Section */}
            {dailyDeals.length > 0 && (
                <View style={styles.sectionFrame}>
                <View style={styles.productsSection}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="flash" size={20} color="#f59e0b" />
                            <Text style={styles.sectionTitle}>{t('dailyDeals')}</Text>
                        </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>
                        {dailyDeals.map((item) => (
                            <View key={item._id || item.id} style={{ width: (screenWidth - 56) / 2, marginRight: 12 }}>
                                <ProductCard
                                    product={item}
                                    onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>
                </View>
            )}

            <View style={styles.nearbySection}>
                <View style={styles.nearbyCard}>
                    <View style={styles.nearbyHeader}>
                        <Ionicons name="location" size={16} color={colors.primary} />
                        <Text style={styles.nearbyLabel}>{t('nearbySellersLabel')}</Text>
                    </View>
                    <Text style={styles.nearbyTitle}>{t('discoverNearbyTitle')}</Text>
                    <Text style={styles.nearbyDesc}>
                        {t('discoverNearbyDesc')}
                    </Text>
                    <TouchableOpacity
                        style={styles.nearbyBtn}
                        onPress={() => navigation.navigate('NearbySellers')}
                    >
                        <Text style={styles.nearbyBtnText}>{t('openMap')}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.ctaSection}>
                <View style={styles.ctaCard}>
                    <Text style={styles.ctaTitle}>
                        {t('startSellingOn')} <Text style={styles.ctaHighlight}>Dagangly</Text>
                    </Text>
                    <Text style={styles.ctaDesc}>
                        {t('registerBusinessDesc')}
                    </Text>
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
                    >
                        <Text style={styles.ctaBtnText}>{t('registerNow')}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}
