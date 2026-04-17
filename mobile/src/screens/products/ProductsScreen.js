import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, RefreshControl, Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';
import ProductCard from '../../components/ProductCard';
import { ProductsListSkeleton } from '../../components/LoadingSkeleton';
import { CATEGORIES_EN, CATEGORIES_ID, SORT_OPTIONS_EN, SORT_OPTIONS_ID } from '../../config';

const { width } = Dimensions.get('window');

export default function ProductsScreen({ navigation, route }) {
    const { colors, isDarkMode } = useThemeStore();
    const { t, language } = useTranslation();
    const initialCategory = route?.params?.category || 'all';
    const initialSearch = route?.params?.search || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [category, setCategory] = useState(initialCategory);
    const [sortBy, setSortBy] = useState('newest');
    const [showSort, setShowSort] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isListening, setIsListening] = useState(false);
    const searchTimeoutRef = useRef(null);

    const categories = language === 'id' ? CATEGORIES_ID : CATEGORIES_EN;
    const sortOptions = language === 'id' ? SORT_OPTIONS_ID : SORT_OPTIONS_EN;

    // Quick filter options
    const filterOptions = [
        { id: 'all', name: language === 'id' ? 'Semua' : 'All', icon: 'apps' },
        { id: 'price-low', name: language === 'id' ? 'Harga Rendah' : 'Price ↑', icon: 'arrow-down' },
        { id: 'price-high', name: language === 'id' ? 'Harga Tinggi' : 'Price ↓', icon: 'arrow-up' },
        { id: 'rating', name: language === 'id' ? 'Rating 4+' : '⭐ 4+', icon: 'star' },
        { id: 'nearby', name: language === 'id' ? 'Dekat Saya' : '📍 Near Me', icon: 'location' },
        { id: 'new', name: language === 'id' ? 'Terbaru' : 'New', icon: 'time' },
    ];

    const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
        try {
            const params = {
                sort: sortBy,
                page: pageNum,
                limit: 20,
            };
            if (searchQuery) params.search = searchQuery;
            if (category && category !== 'all') params.category = category;

            // Apply quick filters
            if (activeFilter === 'price-low') params.sort = 'price-low';
            else if (activeFilter === 'price-high') params.sort = 'price-high';
            else if (activeFilter === 'rating') params.sort = 'rating';
            else if (activeFilter === 'new') params.sort = 'newest';
            else if (activeFilter === 'nearby') { 
                // Nearby requires location coordinates
            }

            const response = await api.get('/products', { params });
            const newProducts = response.data.products || [];
            const pagination = response.data.pagination || {};

            if (append) {
                setProducts((prev) => [...prev, ...newProducts]);
            } else {
                setProducts(newProducts);
            }
            setTotalPages(pagination.pages || 1);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchQuery, category, sortBy, activeFilter]);

    useEffect(() => {
        setLoading(true);
        fetchProducts(1);
    }, [fetchProducts]);

    useEffect(() => {
        if (route?.params?.category) {
            setCategory(route.params.category);
        }
    }, [route?.params?.category]);

    useEffect(() => {
        if (route?.params?.search !== undefined) {
            setSearchInput(route.params.search);
            setSearchQuery(route.params.search);
        }
    }, [route?.params?.search]);

    const handleSearchChange = (text) => {
        setSearchInput(text);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(text);
            setLoading(true);
            fetchProducts(1);
        }, 500);
    };

    const handleSearchClear = () => {
        setSearchInput('');
        setSearchQuery('');
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        setLoading(true);
        fetchProducts(1);
    };

    const handleVoiceSearch = async () => {
        if (isListening) {
            setIsListening(false);
            return;
        }
        
        setIsListening(true);
        
        Speech.stop();
        
        Speech.speak(language === 'id' ? 'Mendengarkan...' : 'Listening...', {
            language: language === 'id' ? 'id-ID' : 'en-US',
            onDone: () => {
                setTimeout(() => {
                    setIsListening(false);
                }, 500);
            },
            onError: () => {
                setIsListening(false);
            }
        });
        
        setTimeout(() => {
            setIsListening(false);
            const demoQuery = language === 'id' ? 'Produk contoh' : 'Example product';
            handleSearchChange(demoQuery);
        }, 2000);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProducts(1);
        setRefreshing(false);
    };

    const onEndReached = () => {
        if (!loadingMore && page < totalPages) {
            setLoadingMore(true);
            fetchProducts(page + 1, true);
        }
    };

    const styles = {
        container: { flex: 1, backgroundColor: colors.background },
        list: { paddingBottom: 20 },
        row: { paddingHorizontal: 16, gap: 12 },
        searchRow: { 
            flexDirection: 'row', 
            paddingHorizontal: 16, 
            paddingTop: 12, 
            paddingBottom: 8, 
            gap: 10 
        },
        searchWrap: {
            flex: 1, 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 10,
            backgroundColor: colors.card, 
            borderRadius: 10, 
            paddingHorizontal: 14, 
            height: 44,
            borderWidth: 1, 
            borderColor: colors.border,
        },
        searchInput: { 
            flex: 1, 
            fontSize: 14, 
            color: colors.text,
        },
        sortBtn: {
            width: 44, 
            height: 44, 
            borderRadius: 10,
            backgroundColor: colors.primary + '15', 
            justifyContent: 'center', 
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary + '30',
        },
        sortDropdown: {
            position: 'absolute',
            top: 56,
            right: 16,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            zIndex: 100,
            minWidth: 160,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        sortOption: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        sortOptionText: {
            fontSize: 14,
            color: colors.text,
        },
        sortOptionTextActive: {
            color: colors.primary,
            fontWeight: '600',
        },
        filterDropdownRow: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 10,
        },
        filterDropdownBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            height: 42,
            backgroundColor: colors.card,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
        },
        filterDropdownText: {
            fontSize: 13,
            color: colors.text,
        },
        filterDropdown: {
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
        },
        overlay: {
            ...StyleSheet.absoluteFillObject,
            zIndex: 200,
        },
        filterDropdownOverlay: {
            position: 'absolute',
            top: 100,
            left: 16,
            right: 16,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
        },
        sortDropdownOverlay: {
            position: 'absolute',
            top: 100,
            right: 16,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 180,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
        },
        filterOption: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        filterOptionText: {
            flex: 1,
            marginLeft: 10,
            fontSize: 14,
            color: colors.text,
        },
        empty: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
        },
        emptyIconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        emptyTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        emptyText: {
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 20,
        },
        emptyBtn: {
            paddingVertical: 10,
            paddingHorizontal: 24,
            backgroundColor: colors.primary + '15',
            borderRadius: 8,
        },
        emptyBtnText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary,
        },
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ padding: 8 }}
                    onPress={() => navigation.navigate('BarcodeScanner')}
                >
                    <Ionicons name="qr-code" size={24} color={colors.text} />
                </TouchableOpacity>
            ),
        });
}, [navigation, colors]);

    const renderHeader = () => (
        <View>
            <View style={styles.searchRow}>
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('searchProducts')}
                        placeholderTextColor={colors.textSecondary}
                        value={searchInput}
                        onChangeText={handleSearchChange}
                        returnKeyType="search"
                        blurOnSubmit={false}
                    />
                    {searchInput.length > 0 && (
                        <TouchableOpacity onPress={handleSearchClear}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleVoiceSearch}>
                        <Ionicons 
                            name={isListening ? "mic" : "mic-outline"} 
                            size={20} 
                            color={isListening ? colors.primary : colors.textSecondary} 
                        />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity 
                    style={styles.sortBtn} 
                    onPress={() => setShowSort(!showSort)}
                >
                    <Ionicons name="funnel-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            

            <View style={styles.filterDropdownRow}>
                <TouchableOpacity 
                    style={styles.filterDropdownBtn}
                    onPress={() => setShowFilter(!showFilter)}
                >
                    <Ionicons name="filter" size={16} color={colors.primary} />
                    <Text style={styles.filterDropdownText}>
                        {activeFilter === 'all' ? (language === 'id' ? 'Filter' : 'Filter') : filterOptions.find(f => f.id === activeFilter)?.name}
                    </Text>
                    <Ionicons name={showFilter ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.filterDropdownBtn}
                    onPress={() => setShowSort(!showSort)}
                >
                    <Ionicons name="swap-vertical" size={16} color={colors.primary} />
                    <Text style={styles.filterDropdownText}>
                        {sortOptions.find(s => s.id === sortBy)?.name || (language === 'id' ? 'Urutkan' : 'Sort')}
                    </Text>
                    <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="cube-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('noProducts')}</Text>
            <Text style={styles.emptyText}>{t('adjustFilters')}</Text>
            {(searchQuery || activeCategory || minPrice || maxPrice) && (
                <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => {
                        setSearchQuery('');
                        setActiveCategory(null);
                        setMinPrice(null);
                        setMaxPrice(null);
                    }}
                >
                    <Text style={styles.emptyBtnText}>{t('clearFilters')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {loading && products.length === 0 ? (
                <ProductsListSkeleton count={8} />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={!loading ? renderEmpty : null}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor={colors.primary} 
                        />
                    }
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator 
                                style={{ padding: 16 }} 
                                color={colors.primary} 
                            />
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                        />
                    )}
                />
            )}
            
            {/* Filter Dropdown Overlay */}
            {showFilter && (
                <TouchableOpacity 
                    style={styles.overlay} 
                    activeOpacity={1} 
                    onPress={() => setShowFilter(false)}
                >
                    <View style={styles.filterDropdownOverlay}>
                        {filterOptions.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.filterOption, 
                                    activeFilter === item.id && { backgroundColor: colors.primary + '10' },
                                ]}
                                onPress={() => { setActiveFilter(item.id); setShowFilter(false); setLoading(true); fetchProducts(1); }}
                            >
                                <Ionicons name={item.icon} size={18} color={activeFilter === item.id ? colors.primary : colors.textSecondary} />
                                <Text style={[
                                    styles.filterOptionText, 
                                    activeFilter === item.id && { color: colors.primary, fontWeight: '600' }
                                ]}>
                                    {item.name}
                                </Text>
                                {activeFilter === item.id && (
                                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            )}

            {/* Sort Dropdown Overlay */}
            {showSort && (
                <TouchableOpacity 
                    style={styles.overlay} 
                    activeOpacity={1} 
                    onPress={() => setShowSort(false)}
                >
                    <View style={styles.sortDropdownOverlay}>
                        {sortOptions.map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[
                                    styles.sortOption, 
                                    sortBy === opt.id && { backgroundColor: colors.primary + '10' },
                                ]}
                                onPress={() => { setSortBy(opt.id); setShowSort(false); }}
                            >
                                <Text style={[
                                    styles.sortOptionText, 
                                    sortBy === opt.id && styles.sortOptionTextActive
                                ]}>
                                    {opt.name}
                                </Text>
                                {sortBy === opt.id && (
                                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}
