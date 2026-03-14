import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { guideCategories } from '../data/guideData';

const GuideScreen = () => {
    const { width } = useWindowDimensions();
    const { colors, isDarkMode, toggleTheme } = useThemeStore();
    const { language, toggleLanguage } = useLanguageStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);

    const isRTL = false;
    const isMobile = width < 768;

    const getTitle = (obj) => obj?.[language] || obj?.en || '';

    const filteredCategories = guideCategories.map(category => ({
        ...category,
        articles: category.articles.filter(article => {
            const title = getTitle(article.title).toLowerCase();
            const query = searchQuery.toLowerCase();
            return title.includes(query);
        })
    })).filter(category => category.articles.length > 0);

    const currentCategory = selectedCategory 
        ? filteredCategories.find(c => c.id === selectedCategory)
        : null;

    const getIconName = (iconName) => {
        const icons = {
            'rocket': 'rocket-outline',
            'cart': 'cart-outline',
            'storefront': 'storefront-outline',
            'map': 'map-outline',
            'person': 'person-outline',
            'star': 'star-outline',
        };
        return icons[iconName] || 'book-outline';
    };

    const handleBack = () => {
        if (selectedArticle) {
            setSelectedArticle(null);
        } else if (selectedCategory) {
            setSelectedCategory(null);
        }
    };

    const renderContent = (content) => {
        return content.map((item, index) => {
            if (item.type === 'text') {
                return (
                    <Text key={index} style={[styles.contentText, { color: colors.textSecondary }]}>
                        {item.text}
                    </Text>
                );
            }
            if (item.type === 'step') {
                return (
                    <View key={index} style={styles.stepContainer}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[styles.stepNumberText, { color: colors.primary }]}>{index}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.text }]}>{item.text}</Text>
                    </View>
                );
            }
            if (item.type === 'tip') {
                return (
                    <View key={index} style={[styles.tipContainer, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
                        <Ionicons name="bulb" size={20} color="#d97706" />
                        <Text style={[styles.tipText, { color: '#92400e' }]}>{item.text}</Text>
                    </View>
                );
            }
            return null;
        });
    };

    const renderCategoryList = () => (
        <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
                <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setSelectedCategory(category.id)}
                >
                    <View style={[styles.categoryIcon, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name={getIconName(category.icon)} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.categoryContent}>
                        <Text style={[styles.categoryTitle, { color: colors.text }]}>
                            {getTitle(category.title)}
                        </Text>
                        <Text style={[styles.categoryDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {getTitle(category.description)}
                        </Text>
                        <Text style={[styles.articleCount, { color: colors.primary }]}>
                            {category.articles.length} articles
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderArticleList = () => (
        <View style={styles.articlesList}>
            {currentCategory?.articles.map((article) => (
                <TouchableOpacity
                    key={article.id}
                    style={[styles.articleItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setSelectedArticle(article.id)}
                >
                    <Text style={[styles.articleTitle, { color: colors.text }]}>
                        {getTitle(article.title)}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderArticleDetail = () => {
        const article = currentCategory?.articles.find(a => a.id === selectedArticle);
        if (!article) return null;

        return (
            <View style={styles.articleDetail}>
                <View style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {renderContent(article.content[language] || article.content.en)}
                </View>
                
                <View style={styles.relatedSection}>
                    <Text style={[styles.relatedTitle, { color: colors.text }]}>
                        {language === 'id' ? 'Artikel Terkait' : 'Related Articles'}
                    </Text>
                    {currentCategory.articles
                        .filter(a => a.id !== selectedArticle)
                        .slice(0, 3)
                        .map((relatedArticle) => (
                            <TouchableOpacity
                                key={relatedArticle.id}
                                style={[styles.relatedItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => setSelectedArticle(relatedArticle.id)}
                            >
                                <Text style={[styles.relatedItemText, { color: colors.text }]}>
                                    {getTitle(relatedArticle.title)}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                            </TouchableOpacity>
                        ))}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <View style={styles.headerTop}>
                    {(selectedCategory || selectedArticle) && (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {selectedArticle 
                                ? getTitle(currentCategory?.articles?.find(a => a.id === selectedArticle)?.title)
                                : selectedCategory
                                    ? getTitle(currentCategory?.title)
                                    : (language === 'id' ? 'Pusat Bantuan' : 'Help Center')
                            }
                        </Text>
                        {!selectedCategory && (
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                {language === 'id' ? 'Pelajari cara menggunakan semua fitur' : 'Learn how to use all features'}
                            </Text>
                        )}
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={toggleLanguage} style={styles.iconButton}>
                            <Ionicons name="language" size={20} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                            <Ionicons 
                                name={isDarkMode ? 'sunny' : 'moon'} 
                                size={20} 
                                color={colors.text} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {!selectedArticle && (
                    <View style={[styles.searchContainer, { backgroundColor: colors.input }]}>
                        <Ionicons name="search" size={20} color={colors.textTertiary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder={language === 'id' ? 'Cari panduan...' : 'Search guides...'}
                            placeholderTextColor={colors.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                )}
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {!selectedCategory && renderCategoryList()}
                {selectedCategory && !selectedArticle && renderArticleList()}
                {selectedArticle && renderArticleDetail()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    categoriesGrid: {
        gap: 12,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryContent: {
        flex: 1,
        marginLeft: 12,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    articleCount: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    articlesList: {
        gap: 8,
    },
    articleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    articleTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    articleDetail: {
        gap: 16,
    },
    articleCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    contentText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '600',
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 16,
        gap: 10,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    relatedSection: {
        marginTop: 8,
    },
    relatedTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    relatedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    relatedItemText: {
        fontSize: 14,
    },
});

export default GuideScreen;
