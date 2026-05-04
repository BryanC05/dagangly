import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    AppState,
    TouchableOpacity,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCartStore } from '../store/cartStore';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { useDriverStore } from '../store/driverStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { API_HOST } from '../config';
import notificationService, { usePushNotifications } from '../services/NotificationService';
import BackgroundEffect from '../components/BackgroundEffect';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import BarcodeScannerScreen from '../screens/products/BarcodeScannerScreen';
import CartScreen from '../screens/cart/CartScreen';
import MessagesScreen from '../screens/chat/MessagesScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ForumScreen from '../screens/forum/ForumScreen';
import ThreadDetailScreen from '../screens/forum/ThreadDetailScreen';
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import AddProductScreen from '../screens/seller/AddProductScreen';
import MyProductsScreen from '../screens/seller/MyProductsScreen';
import LogoGeneratorScreen from '../screens/seller/LogoGeneratorScreen';
import AutomationScreen from '../screens/seller/AutomationScreen';
import BusinessDetailsScreen from '../screens/seller/BusinessDetailsScreen';
import InstagramScreen from '../screens/seller/InstagramScreen';
import MapViewScreen from '../screens/location/MapViewScreen';
import NearbySellersScreen from '../screens/location/NearbySellersScreen';
import LiveTrackingMap from '../screens/location/LiveTrackingMap';
import DeliveryHubScreen from '../screens/delivery/DeliveryHubScreen';
import AdminMembershipScreen from '../screens/admin/AdminMembershipScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import WishlistScreen from '../screens/wishlist/WishlistScreen';
import SocialLinksScreen from '../screens/profile/SocialLinksScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import AddProjectScreen from '../screens/projects/AddProjectScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';
import GuideScreen from '../screens/guide/GuideScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import InstallmentsScreen from '../screens/installments/InstallmentsScreen';
import VideoCallScreen from '../screens/videoCall/VideoCallScreen';
import AIConsultantScreen from '../screens/seller/AIConsultantScreen';
import InventoryScreen from '../screens/seller/InventoryScreen';
import FinanceDashboardScreen from '../screens/finance/DashboardScreen';
import FinanceExpensesScreen from '../screens/finance/ExpensesScreen';
import FinanceCalculatorScreen from '../screens/finance/CalculatorScreen';
import FinanceCashFlowScreen from '../screens/finance/CashFlowScreen';
import FinanceInvoicesScreen from '../screens/finance/InvoicesScreen';
import FinanceSettingsScreen from '../screens/finance/SettingsScreen';
import ProductAnalysisScreen from '../screens/finance/ProductAnalysisScreen';
import FinanceAIScreen from '../screens/finance/AIScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProductsStack = createNativeStackNavigator();
const ProjectsStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const AddStack = createNativeStackNavigator();
const FinanceStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const DeliveryStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();

// Wrapper component to add floating cart button to HomeScreen
function HomeScreenWithCart({ navigation, route }) {
    return (
        <View style={{ flex: 1 }}>
            <HomeScreen navigation={navigation} route={route} />
            <FloatingCartButton navigation={navigation} />
        </View>
    );
}

// Stack Navigators
function HomeStackNavigator() {
    const { colors } = useThemeStore();
    return (
        <View style={{ flex: 1 }}>
            <HomeStack.Navigator
                screenOptions={{
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'slide_from_right',
                }}
            >
                <HomeStack.Screen name="HomeMain" component={HomeScreenWithCart} options={{ headerShown: false }} />
                <HomeStack.Screen
                    name="ProductDetail"
                    component={ProductDetailScreen}
                    options={{ headerShown: false }}
                />
                <HomeStack.Screen
                    name="MapView"
                    component={MapViewScreen}
                    options={{ headerShown: false }}
                />
                <HomeStack.Screen
                    name="BusinessDetails"
                    component={BusinessDetailsScreen}
                    options={{ headerShown: false }}
                />
                <HomeStack.Screen
                    name="NearbySellers"
                    component={NearbySellersScreen}
                    options={{ headerShown: false }}
                />
            </HomeStack.Navigator>
        </View>
    );
}

function ProductsStackNavigator() {
    const { colors } = useThemeStore();
    const { t, languageVersion } = useLanguageStore();

    const ProductsWrapper = ({ navigation: nav, route }) => {
        React.useEffect(() => {
            if (route?.params?.reset) {
                nav.setParams({ reset: undefined });
                nav.popToTop();
            }
        }, [nav, route?.params?.reset]);

        return (
            <View style={{ flex: 1 }}>
                <ProductsScreen navigation={nav} route={route} />
                <FloatingCartButton navigation={nav} />
            </View>
        );
    };

    return (
        <ProductsStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <ProductsStack.Screen
                name="Products"
                component={ProductsWrapper}
                options={{
                    title: t.navProducts,
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <ProductsStack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ headerShown: false }}
            />
            <ProductsStack.Screen
                name="BarcodeScanner"
                component={BarcodeScannerScreen}
                options={{ headerShown: false }}
            />
            <ProductsStack.Screen
                name="MapView"
                component={MapViewScreen}
                options={{ headerShown: false }}
            />
            <ProductsStack.Screen
                name="BusinessDetails"
                component={BusinessDetailsScreen}
                options={{ headerShown: false }}
            />
            <ProductsStack.Screen
                name="NearbySellers"
                component={NearbySellersScreen}
                options={{ headerShown: false }}
            />
        </ProductsStack.Navigator>
    );
}

// Finance Stack Navigator
function FinanceStackNavigator() {
    const { colors } = useThemeStore();
    const { t, language } = useLanguageStore();

    return (
        <FinanceStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <FinanceStack.Screen
                name="FinanceDashboard"
                component={FinanceDashboardScreen}
                options={{
                    title: t.finance || 'Finance',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <FinanceStack.Screen
                name="FinanceExpenses"
                component={FinanceExpensesScreen}
                options={{
                    title: t.expenses || 'Expenses',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <FinanceStack.Screen
                name="FinanceCalculator"
                component={FinanceCalculatorScreen}
                options={{
                    title: t.calculator || 'Calculator',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <FinanceStack.Screen
                name="FinanceCashFlow"
                component={FinanceCashFlowScreen}
                options={{
                    title: t.cashFlow || 'Cash Flow',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <FinanceStack.Screen
                name="FinanceInvoices"
                component={FinanceInvoicesScreen}
                options={{
                    title: t.invoices || 'Invoices',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <FinanceStack.Screen
                name="FinanceSettings"
                component={FinanceSettingsScreen}
                options={{
                    title: language === 'id' ? 'Pengaturan' : 'Settings',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <FinanceStack.Screen
                name="ProductAnalysis"
                component={ProductAnalysisScreen}
                options={{
                    title: language === 'id' ? 'Analisis Produk' : 'Product Analysis',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <FinanceStack.Screen
                name="FinanceAI"
                component={FinanceAIScreen}
                options={{
                    title: language === 'id' ? 'Konsultan AI' : 'AI Consultant',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
        </FinanceStack.Navigator>
    );
}

// Separate Projects Stack Navigator (kept for reference but not used in tabs)
function ProjectsStackNavigator() {
    const { colors } = useThemeStore();
    const { t } = useLanguageStore();

    return (
        <ProjectsStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <ProjectsStack.Screen
                name="ProjectsMain"
                component={ProjectsScreen}
                options={{
                    title: t.projects,
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <ProjectsStack.Screen
                name="ProjectDetail"
                component={ProjectDetailScreen}
                options={{ headerShown: false }}
            />
        </ProjectsStack.Navigator>
    );
}

function CartStackNavigator() {
    const { colors } = useThemeStore();
    const { t, languageVersion } = useLanguageStore();
    return (
        <CartStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <CartStack.Screen
                name="CartScreen"
                component={CartScreen}
                options={({ navigation }) => ({
                    title: t.navCart || 'Cart',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ paddingHorizontal: 16, marginLeft: -16 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                })}
            />
        </CartStack.Navigator>
    );
}

function AddStackNavigator() {
    const { colors } = useThemeStore();
    return (
        <AddStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <AddStack.Screen
                name="AddProduct"
                component={AddProductScreen}
                options={{ headerShown: false }}
            />
            <AddStack.Screen
                name="Instagram"
                component={InstagramScreen}
                options={{ headerShown: false }}
            />
        </AddStack.Navigator>
    );
}

function DeliveryStackNavigator() {
    const { colors } = useThemeStore();
    const { t, languageVersion } = useLanguageStore();
    return (
        <DeliveryStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <DeliveryStack.Screen
                name="DeliveryHub"
                component={DeliveryHubScreen}
                options={{ headerShown: false }}
            />
        </DeliveryStack.Navigator>
    );
}

function MessagesStackNavigator() {
    const { colors } = useThemeStore();
    const { t, languageVersion } = useLanguageStore();
    return (
        <MessagesStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <MessagesStack.Screen
                name="MessagesList"
                component={MessagesScreen}
                options={({
                    title: t.navMessages || 'Messages',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                    headerLeft: () => null,
                    headerBackVisible: false,
                })}
            />
            <MessagesStack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '600', fontSize: 16, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
        </MessagesStack.Navigator>
    );
}

function ProfileStackNavigator() {
    const { colors } = useThemeStore();
    const { t, languageVersion } = useLanguageStore();
    return (
        <ProfileStack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <ProfileStack.Screen
                name="ProfileMain"
                component={ProfileScreen}
                options={({ route }) => ({
                    title: route.params?.userId ? t.navProfile : t.navProfile,
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                })}
            />
            <ProfileStack.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    title: t.navOrders,
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <ProfileStack.Screen
                name="Forum"
                component={ForumScreen}
                options={{
                    title: t.navForum,
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <ProfileStack.Screen
                name="ThreadDetail"
                component={ThreadDetailScreen}
                options={{
                    title: t.navDiscussion,
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '600', fontSize: 16, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />

            {/* Seller Screens */}
            <ProfileStack.Screen
                name="SellerDashboard"
                component={SellerDashboardScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="AddProduct"
                component={AddProductScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="MyProducts"
                component={MyProductsScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="LogoGenerator"
                component={LogoGeneratorScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="Automation"
                component={AutomationScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="SocialLinks"
                component={SocialLinksScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="StoreSocialLinks"
                component={SocialLinksScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="Instagram"
                component={InstagramScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="MapView"
                component={MapViewScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="NearbySellers"
                component={NearbySellersScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="BusinessDetails"
                component={BusinessDetailsScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="Wishlist"
                component={WishlistScreen}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="LiveTracking"
                component={LiveTrackingMap}
                options={{
                    headerShown: false,
                }}
            />
            <ProfileStack.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    title: t.navMessages,
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <ProfileStack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '600', fontSize: 16, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <ProfileStack.Screen
                name="AdminMembership"
                component={AdminMembershipScreen}
                options={{
                    title: 'Membership Approvals',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
                    headerShadowVisible: false,
                    headerTintColor: colors.text,
                }}
            />
            <ProfileStack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Guide"
                component={GuideScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Wallet"
                component={WalletScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Installments"
                component={InstallmentsScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="VideoCall"
                component={VideoCallScreen}
                options={{ headerShown: false }}
            />

            <ProfileStack.Screen
                name="AIConsultant"
                component={AIConsultantScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Inventory"
                component={InventoryScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="FinanceDashboard"
                component={FinanceDashboardScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="FinanceAI"
                component={FinanceAIScreen}
                options={{ headerShown: false }}
            />
        </ProfileStack.Navigator>
    );
}

// Cart badge component
function CartBadge() {
    const items = useCartStore((s) => s.items);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    if (count === 0) return null;
    return (
        <View style={badgeStyles.badge}>
            <Text style={badgeStyles.text}>{count > 9 ? '9+' : count}</Text>
        </View>
    );
}

// Floating Cart Button - appears on Home and Products screens
function FloatingCartButton({ navigation }) {
    const items = useCartStore((s) => s.items);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const { colors } = useThemeStore();

    return (
        <TouchableOpacity
            style={{
                position: 'absolute',
                bottom: 90,
                right: 20,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
            }}
            onPress={() => navigation.navigate('Cart', { screen: 'CartScreen' })}
        >
            <Ionicons name="cart" size={24} color={colors.white} />
            {count > 0 && (
                <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: colors.danger,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                }}>
                    <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>
                        {count > 9 ? '9+' : count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// Browse Tab Button (Combined Products/Projects)
function BrowseTabButton({ navigation, isFocused, route }) {
    const { colors } = useThemeStore();
    const { t } = useLanguageStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const [lastVisited, setLastVisited] = useState('products');
    const [currentPage, setCurrentPage] = useState('products');
    const parentNav = useNavigation();
    const nav = navigation || parentNav;

    const navigateToScreen = (screenName) => {
        // Navigate to nested screen using: TabName -> ScreenName
        nav.navigate({
            name: 'Browse',
            params: { screen: screenName }
        });
    };

    const menuItems = [
        {
            key: 'products',
            label: t.tabProducts || 'Products',
            icon: 'grid-outline',
            target: 'products',
            screen: 'Products'
        },
        {
            key: 'projects',
            label: t.projects || 'Projects',
            icon: 'folder-outline',
            target: 'projects',
            targetTab: 'Projects'
        },
    ];

    const handleSelect = (item) => {
        setShowDropdown(false);
        setLastVisited(item.target);
        const screenName = item.target === 'projects' ? 'Projects' : 'Products';
        navigateToScreen(screenName);
    };

    const getLabel = () => {
        if (isFocused) {
            return currentPage === 'projects' ? (t.projects || 'Projects') : (t.tabProducts || 'Products');
        }
        return lastVisited === 'projects' ? (t.projects || 'Projects') : (t.tabProducts || 'Products');
    };

    const getIcon = () => {
        const iconName = lastVisited === 'projects' ? 'folder' : 'grid';
        const iconNameOutline = lastVisited === 'projects' ? 'folder-outline' : 'grid-outline';
        return isFocused ? iconName : iconNameOutline;
    };

    React.useEffect(() => {
        const state = nav?.getState();
        if (state) {
            const currentRoute = state.routes[state.index];
            if (currentRoute?.name === 'Projects') {
                setCurrentPage('projects');
            } else if (currentRoute?.name === 'Products') {
                setCurrentPage('products');
            }
        }
    }, [nav]);

    return (
        <>
            <TouchableOpacity
                style={styles.productsTabButton}
                onLongPress={() => setShowDropdown(true)}
                delayLongPress={500}
                onPress={() => {
                    if (lastVisited === 'projects') {
                        navigateToScreen('Projects');
                    } else {
                        navigateToScreen('Products');
                    }
                }}
            >
                <Ionicons
                    name={getIcon()}
                    size={22}
                    color={isFocused ? colors.primary : colors.textSecondary}
                />
                <Text
                    style={[
                        styles.productsTabLabel,
                        { color: isFocused ? colors.primary : colors.textSecondary }
                    ]}
                    numberOfLines={1}
                >
                    {getLabel()}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={showDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDropdown(false)}
            >
                <TouchableOpacity
                    style={styles.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDropdown(false)}
                >
                    <View style={[styles.dropdownMenu, { backgroundColor: colors.card }]}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                style={styles.dropdownItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Ionicons name={item.icon} size={20} color={colors.text} />
                                <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

// Delivery badge component
function DeliveryBadge() {
    const { isDriverMode, activeDelivery } = useDriverStore();
    if (!isDriverMode || !activeDelivery) return null;
    return (
        <View style={[badgeStyles.badge, { backgroundColor: '#10b981' }]}>
            <Text style={badgeStyles.text}>1</Text>
        </View>
    );
}

// Notification badge for profile tab
function NotificationBadge() {
    const unreadCount = useNotificationStore((s) => s.unreadCount);
    if (unreadCount === 0) return null;
    return (
        <View style={[badgeStyles.badge, { backgroundColor: '#f43f5e' }]}>
            <Text style={badgeStyles.text}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
    );
}

// WebSocket listener for real-time notifications
function NotificationListener() {
    const { token, isAuthenticated } = useAuthStore();
    const { addNotification, fetchUnreadCount } = useNotificationStore();
    const wsRef = useRef(null);
    const reconnectRef = useRef(null);
    const pingRef = useRef(null);

    // Request permissions and setup listeners for push/local notifications
    usePushNotifications();

    useEffect(() => {
        if (!isAuthenticated || !token) return;

        fetchUnreadCount();

        function connect() {
            // Clean up existing connection
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }

            const wsProtocol = API_HOST.startsWith('https') ? 'wss' : 'ws';
            // Remove any trailing slashes and protocol
            const wsHost = API_HOST.replace(/^https?:\/\//, '').replace(/\/+$/, '');
            const wsUrl = `${wsProtocol}://${wsHost}/ws?token=${token}`;

            console.log('🔌 [WebSocket] Attempting to connect to:', `${wsProtocol}://${wsHost}/ws`);

            // First test if server is reachable
            fetch(`${API_HOST}/api/health`, { method: 'GET' })
                .then(res => {
                    console.log('✅ [WebSocket] Server reachable:', res.status);
                })
                .catch(err => {
                    console.log('❌ [WebSocket] Server not reachable:', err.message);
                });

            try {
                const ws = new WebSocket(wsUrl);

                // Add connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        console.log('⏱️ [WebSocket] Connection timeout, closing...');
                        ws.close();
                    }
                }, 10000);

                ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log('🟢 [WebSocket] Connected successfully');
                    pingRef.current = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'ping' }));
                        }
                    }, 30000);
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'pong' || message.type === 'ping') return;

                        console.log('🔵 [WebSocket] Message received:', event.data);

                        // Handle notification type
                        if (message.type === 'notification' && message.data) {
                            // Handle both camelCase and PascalCase from backend
                            const title = message.data.title || message.data.Title || 'New Notification';
                            const body = message.data.message || message.data.Message || message.data.body || 'You have a new notification';
                            const notifType = message.data.type || message.data.Type || 'notification';

                            console.log('🔔 [Notification] Received:', notifType, title, body);

                            // Add to store first (this updates the UI)
                            addNotification(message.data);

                            // Then show popup notification
                            notificationService.initialize()
                                .then(() => {
                                    console.log('🔔 [Notification] Service initialized, scheduling...');
                                    return notificationService.scheduleLocalNotification(
                                        title,
                                        body,
                                        message.data.data || message.data.Data || { type: notifType },
                                        1
                                    );
                                })
                                .then(() => {
                                    console.log('🔔 [Notification] Scheduled successfully');
                                })
                                .catch((err) => {
                                    console.error('🔔 [Notification] Failed:', err.message, err);
                                });
                        }

                        // Handle new_order type
                        if (message.type === 'new_order' && message.data) {
                            const title = 'New Order Received!';
                            const body = message.data.message || `New order #${message.data.orderId?.slice(-8) || ''}`;
                            const notifType = 'new_order';

                            console.log('🔔 [NewOrder] Received:', title, body);

                            // Add to store
                            addNotification({
                                ...message.data,
                                title,
                                message: body,
                                type: 'new_order',
                            });

                            // Show popup notification
                            notificationService.initialize()
                                .then(() => {
                                    console.log('🔔 [NewOrder] Service initialized, scheduling...');
                                    return notificationService.scheduleLocalNotification(
                                        title,
                                        body,
                                        { type: notifType, orderId: message.data.orderId },
                                        1
                                    );
                                })
                                .then(() => {
                                    console.log('🔔 [NewOrder] Scheduled successfully');
                                })
                                .catch((err) => {
                                    console.error('🔔 [NewOrder] Failed:', err.message, err);
                                });
                        }
                    } catch (e) {
                        console.error('🔴 [WebSocket] Parse error:', e);
                    }
                };

                ws.onclose = (event) => {
                    clearInterval(pingRef.current);
                    clearTimeout(connectionTimeout);
                    console.log('🔌 [WebSocket] Closed:', event.code, event.reason);

                    if (wsRef.current === ws) {
                        // Only reconnect if not a normal closure
                        if (event.code !== 1000) {
                            console.log('🔄 [WebSocket] Reconnecting in 5s...');
                            reconnectRef.current = setTimeout(() => {
                                if (isAuthenticated && token) connect();
                            }, 5000);
                        }
                    }
                };

                ws.onerror = (error) => {
                    clearTimeout(connectionTimeout);
                    console.log('⚠️ [WebSocket] Error - readyState:', ws.readyState);
                    console.log('⚠️ [WebSocket] Error details:', error);
                };

                wsRef.current = ws;
            } catch (e) {
                console.error('🔴 [WebSocket] Failed to create:', e);
            }
        }

        connect();

        // Handle App going to background / foreground
        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
                    console.log('🔄 [WebSocket] App returned to foreground, forcing reconnect...');
                    clearInterval(pingRef.current);
                    clearTimeout(reconnectRef.current);
                    connect();
                }
                // Also fetch fresh notifications when app becomes active
                fetchUnreadCount();
            }
        });

        return () => {
            appStateSubscription.remove();
            clearInterval(pingRef.current);
            clearTimeout(reconnectRef.current);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [isAuthenticated, token, addNotification, fetchUnreadCount]);

    // Fallback: Poll for notifications every 30 seconds if WebSocket fails
    useEffect(() => {
        if (!isAuthenticated) return;

        const pollInterval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [isAuthenticated, fetchUnreadCount]);

    return null;
}

const badgeStyles = StyleSheet.create({
    badge: {
        position: 'absolute', top: -4, right: -8,
        backgroundColor: '#ef4444', borderRadius: 10,
        minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 4,
    },
    text: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

const styles = StyleSheet.create({
    productsTabButton: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        minWidth: 60,
    },
    productsTabLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
    },
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 85,
    },
    dropdownMenu: {
        borderRadius: 16,
        padding: 8,
        minWidth: 200,
        marginBottom: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    dropdownItemText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    fabButton: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#14b8a6',
        shadowColor: '#14b8a6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
        marginTop: -24,
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    fabOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    fabMenu: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    fabMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    fabMenuText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
});

// Floating Action Button Component
function FloatingActionButton({ navigation }) {
    const { colors } = useThemeStore();
    const [isPressed, setIsPressed] = useState(false);
    const { user } = useAuthStore();
    const parentNav = useNavigation();
    const nav = navigation || parentNav;

    const handlePress = () => {
        // If not a seller, navigate to register
        if (!user?.isSeller) {
            if (nav?.navigate) {
                nav.navigate('Profile', { screen: 'RegisterBusiness' });
            }
            return;
        }
        
        if (nav?.navigate) {
            nav.navigate('Add', { screen: 'AddProduct', params: { reset: true } });
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.fabButton,
                { backgroundColor: colors.primary, shadowColor: colors.primary, borderColor: colors.card },
                { transform: [{ scale: isPressed ? 0.92 : 1 }] }
            ]}
            onPress={handlePress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            activeOpacity={0.9}
        >
            <Ionicons name="add" size={28} color={colors.card} />
        </TouchableOpacity>
    );
}

// Main Tab Navigator
export default function AppNavigator() {
    const { colors, isDarkMode } = useThemeStore();
    const { t, languageVersion } = useLanguageStore();
    const isDriverMode = useDriverStore((s) => s.isDriverMode);
    const { user } = useAuthStore();

    return (
        <>
            <NotificationListener />
            <Tab.Navigator
                screenOptions={({ route, navigation }) => ({
                    tabBarOnPress: ({ defaultHandler, navigation: tabNavigation }) => {
                        const state = tabNavigation.getState();
                        const currentRoute = state.routes[state.index];
                        const currentScreenName = currentRoute?.state?.routes?.[currentRoute?.state?.index]?.name;
                        const isFocused = tabNavigation.isFocused();

                        // If on Products tab and tapping when already focused, reset to Products
                        if (route.name === 'Products') {
                            if (isFocused && currentScreenName !== 'Products') {
                                tabNavigation.navigate('Products', {
                                    screen: 'Products',
                                    params: { reset: true },
                                    merge: true
                                });
                            } else if (isFocused) {
                                tabNavigation.navigate('Products', { screen: 'Products', params: { reset: true } });
                            } else {
                                defaultHandler();
                            }
                        // If on Profile tab and tapping when already focused, reset to Profile
                        } else if (route.name === 'Profile') {
                            if (isFocused && currentScreenName !== 'ProfileMain') {
                                tabNavigation.navigate('Profile', {
                                    screen: 'ProfileMain',
                                    params: { reset: true },
                                    merge: true
                                });
                            } else if (isFocused) {
                                tabNavigation.navigate('Profile', { screen: 'ProfileMain', params: { reset: true } });
                            } else {
                                defaultHandler();
                            }
                        } else if (isFocused) {
                            defaultHandler();
                        } else {
                            defaultHandler();
                        }
                    },
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        switch (route.name) {
                            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
                            case 'Products': iconName = focused ? 'grid' : 'grid-outline'; break;
                            case 'Projects': iconName = focused ? 'folder' : 'folder-outline'; break;
                            case 'AddProject': iconName = focused ? 'add' : 'add-outline'; break;
                            case 'Delivery': iconName = focused ? 'bicycle' : 'bicycle-outline'; break;
                            case 'Add': iconName = focused ? 'add-circle' : 'add-circle-outline'; break;
                            case 'Messages': iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; break;
                            case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
                            case 'Finance': iconName = focused ? 'wallet' : 'wallet-outline'; break;
                            case 'Spacer': iconName = 'ellipse'; break;
                            default: iconName = 'ellipse';
                        }
                        // Don't show icon for Spacer
                        if (route.name === 'Spacer') {
                            return null;
                        }
                        return (
                            <View>
                                <Ionicons name={iconName} size={22} color={color} />
                                {route.name === 'Delivery' && <DeliveryBadge />}
                                {route.name === 'Profile' && <NotificationBadge />}
                            </View>
                        );
                    },
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textSecondary,
                    tabBarStyle: {
                        backgroundColor: colors.card,
                        borderTopWidth: 0,
                        height: 82,
                        paddingTop: 10,
                        paddingBottom: 10,
                        borderTopLeftRadius: 26,
                        borderTopRightRadius: 26,
                        shadowColor: isDarkMode ? colors.primary : '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: isDarkMode ? 0.15 : 0.08,
                        shadowRadius: 12,
                        elevation: 8,
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                    },
                    tabBarItemStyle: {
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: 4,
                    },
                })}
                sceneContainerStyle={{ backgroundColor: colors.background }}
            >
                <Tab.Screen name="Home" component={HomeStackNavigator} options={{ tabBarLabel: t.tabHome }} />
                <Tab.Screen
                    name="Products"
                    component={ProductsStackNavigator}
                    options={{
                        tabBarLabel: t.tabProducts,
                    }}
                />
                {/* Center FAB - Only show for sellers */}
                {user?.isSeller && (
                    <Tab.Screen
                        name="Add"
                        component={AddStackNavigator}
                        options={{
                            tabBarLabel: '',
                            tabBarButton: (props) => (
                                <View style={[props.style, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <FloatingActionButton navigation={props.navigation} />
                                </View>
                            ),
                        }}
                    />
                )}
                <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: t.tabProfile }} />
                <Tab.Screen
                    name="Messages"
                    component={MessagesStackNavigator}
                    options={{
                        tabBarLabel: t.tabMessages || 'Messages',
                    }}
                />
                
                {/* Hidden Cart - not shown in tab bar */}
                <Tab.Screen
                    name="Cart"
                    component={CartStackNavigator}
                    options={{
                        tabBarLabel: t.tabCart,
                        tabBarItemStyle: { display: 'none' },
                        tabBarButton: () => null,
                    }}
                />
            </Tab.Navigator>
            {/* Global background: floating food icons + particle bursts */}
            <BackgroundEffect />
        </>
    );
}
