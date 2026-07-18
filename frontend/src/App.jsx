import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthModalStore } from './store/authModalStore';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useLanguageStore } from './store/languageStore';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/layout/Layout';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Lazy-load ALL pages for optimal code-splitting
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SocialLinks = lazy(() => import('./pages/SocialLinks'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const AddProduct = lazy(() => import('./pages/AddProduct'));
const SellerProductTracking = lazy(() => import('./pages/SellerProductTracking'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const Cart = lazy(() => import('./pages/Cart'));
const NearbyMap = lazy(() => import('./pages/NearbyMap'));
const SellerStore = lazy(() => import('./pages/SellerStore'));
const Chat = lazy(() => import('./pages/Chat'));
const Forum = lazy(() => import('./pages/Forum'));
const ThreadDetail = lazy(() => import('./pages/ThreadDetail'));
const NewThread = lazy(() => import('./pages/NewThread'));
const EditThread = lazy(() => import('./pages/EditThread'));
const Sell = lazy(() => import('./pages/Sell'));
const Messages = lazy(() => import('./pages/Messages'));
const Forums = lazy(() => import('./pages/Forums'));
const SavedProducts = lazy(() => import('./pages/SavedProducts'));
const LogoGenerator = lazy(() => import('./pages/LogoGenerator'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const ShipmentTrackingPage = lazy(() => import('./pages/ShipmentTrackingPage'));
const AdminMembership = lazy(() => import('./pages/AdminMembership'));
const AdminPendingRegistrations = lazy(() => import('./pages/AdminPendingRegistrations'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Invoice = lazy(() => import('./pages/Invoice'));
const Guide = lazy(() => import('./pages/Guide'));
const Wallet = lazy(() => import('./pages/Wallet'));
const VideoCallPage = lazy(() => import('./pages/VideoCall'));
const InstallmentsPage = lazy(() => import('./pages/Installments'));
const InventoryPage = lazy(() => import('./pages/Inventory'));
const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard'));
const FinanceExpenses = lazy(() => import('./pages/FinanceExpenses'));
const FinanceCalculator = lazy(() => import('./pages/FinanceCalculator'));
const FinanceInvoices = lazy(() => import('./pages/FinanceInvoices'));
const ProductProfitCalc = lazy(() => import('./pages/ProductProfitCalculator'));
const FinanceAI = lazy(() => import('./pages/FinanceAI'));
const ProductExpenses = lazy(() => import('./pages/ProductExpenses'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function AuthRouteHandler() {
  const navigate = useNavigate();
  const { openLogin, openRegister } = useAuthModalStore();
  
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login') {
      openLogin();
      navigate('/');
    } else if (path === '/register') {
      openRegister();
      navigate('/');
    }
  }, [navigate, openLogin, openRegister]);
  
  return null;
}

function App() {
  const { initializeAuth } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const { initializeLanguage } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    initializeTheme();
    initializeLanguage();
    setIsLoading(false);
  }, [initializeAuth, initializeTheme, initializeLanguage]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <Router>
          <ScrollToTop />
          <AuthRouteHandler />
          <div className="min-h-screen bg-background text-foreground font-sans antialiased">
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Home /></Suspense>} />
                <Route path="/products" element={<Suspense fallback={<LoadingFallback />}><Products /></Suspense>} />
                <Route path="/product/:id" element={<Suspense fallback={<LoadingFallback />}><ProductDetail /></Suspense>} />
                <Route path="/cart" element={<Suspense fallback={<LoadingFallback />}><Cart /></Suspense>} />
                <Route path="/nearby" element={<Suspense fallback={<LoadingFallback />}><NearbyMap /></Suspense>} />
                <Route path="/store/:id" element={<Suspense fallback={<LoadingFallback />}><SellerStore /></Suspense>} />
                <Route path="/seller/dashboard" element={<Suspense fallback={<LoadingFallback />}><SellerDashboard /></Suspense>} />
                <Route path="/seller/add-product" element={<Suspense fallback={<LoadingFallback />}><AddProduct /></Suspense>} />
                <Route path="/add-product" element={<Navigate to="/seller/add-product" replace />} />
                <Route path="/seller/product-tracking" element={<Suspense fallback={<LoadingFallback />}><SellerProductTracking /></Suspense>} />
                <Route path="/orders" element={<Suspense fallback={<LoadingFallback />}><Orders /></Suspense>} />
                <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><Profile /></Suspense>} />
                <Route path="/profile/:id" element={<Suspense fallback={<LoadingFallback />}><Profile /></Suspense>} />
                <Route path="/chat" element={<Suspense fallback={<LoadingFallback />}><Chat /></Suspense>} />
                <Route path="/sell" element={<Suspense fallback={<LoadingFallback />}><Sell /></Suspense>} />
                <Route path="/messages" element={<Suspense fallback={<LoadingFallback />}><Messages /></Suspense>} />
                <Route path="/forums" element={<Suspense fallback={<LoadingFallback />}><Forums /></Suspense>} />
                <Route path="/forum" element={<Suspense fallback={<LoadingFallback />}><Forum /></Suspense>} />
                <Route path="/forum/new" element={<Suspense fallback={<LoadingFallback />}><NewThread /></Suspense>} />
                <Route path="/forum/:id/edit" element={<Suspense fallback={<LoadingFallback />}><EditThread /></Suspense>} />
                <Route path="/forum/:id" element={<Suspense fallback={<LoadingFallback />}><ThreadDetail /></Suspense>} />
                <Route path="/saved-products" element={<Suspense fallback={<LoadingFallback />}><SavedProducts /></Suspense>} />
                <Route path="/social-links" element={<Suspense fallback={<LoadingFallback />}><SocialLinks /></Suspense>} />
                <Route path="/logo-generator" element={<Suspense fallback={<LoadingFallback />}><LogoGenerator /></Suspense>} />
                <Route path="/admin/membership" element={<Suspense fallback={<LoadingFallback />}><AdminMembership /></Suspense>} />
                <Route path="/admin/registrations" element={<Suspense fallback={<LoadingFallback />}><AdminPendingRegistrations /></Suspense>} />
                <Route path="/admin/dashboard" element={<Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense>} />
                <Route path="/wallet" element={<Suspense fallback={<LoadingFallback />}><Wallet /></Suspense>} />
                <Route path="/video-call" element={<Suspense fallback={<LoadingFallback />}><VideoCallPage /></Suspense>} />
                <Route path="/installments" element={<Suspense fallback={<LoadingFallback />}><InstallmentsPage /></Suspense>} />
                <Route path="/inventory" element={<Suspense fallback={<LoadingFallback />}><InventoryPage /></Suspense>} />
                <Route path="/notifications" element={<Suspense fallback={<LoadingFallback />}><Notifications /></Suspense>} />
                <Route path="/invoice/:orderId" element={<Suspense fallback={<LoadingFallback />}><Invoice /></Suspense>} />
                <Route path="/guide" element={<Suspense fallback={<LoadingFallback />}><Guide /></Suspense>} />
                <Route path="/finance" element={<Suspense fallback={<LoadingFallback />}><FinanceDashboard /></Suspense>} />
                <Route path="/finance/expenses" element={<Suspense fallback={<LoadingFallback />}><FinanceExpenses /></Suspense>} />
                <Route path="/finance/calculator" element={<Suspense fallback={<LoadingFallback />}><FinanceCalculator /></Suspense>} />
                <Route path="/finance/profit-calculator" element={<Suspense fallback={<LoadingFallback />}><ProductProfitCalc /></Suspense>} />
                <Route path="/finance/ai" element={<Suspense fallback={<LoadingFallback />}><FinanceAI /></Suspense>} />
                <Route path="/finance/product-expenses" element={<Suspense fallback={<LoadingFallback />}><ProductExpenses /></Suspense>} />
                <Route path="/finance/invoices" element={<Suspense fallback={<LoadingFallback />}><FinanceInvoices /></Suspense>} />
                <Route path="/track/:trackingId" element={<Suspense fallback={<LoadingFallback />}><ShipmentTrackingPage /></Suspense>} />
                <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
              </Route>
            </Routes>
          </div>
        </Router>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
