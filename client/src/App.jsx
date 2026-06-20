import { lazy, Suspense, useEffect, useRef } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { auth } from './config/firebase';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/Layout/PublicLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Chatbot from './components/Chatbot';
import Layout from './components/Layout/Layout';
import websocketService from './services/websocketService';
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const NotFound = lazy(() => import('./pages/public/NotFound'));
const ShopsList = lazy(() => import('./pages/public/ShopsList'));
const ShopDetail = lazy(() => import('./pages/public/ShopDetail'));
const ProductDetail = lazy(() => import('./pages/public/ProductDetail'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const MyOrders = lazy(() => import('./pages/customer/MyOrders'));
const OrderDetail = lazy(() => import('./pages/customer/OrderDetail'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const NotificationsPage = lazy(() => import('./pages/customer/Notifications'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const Support = lazy(() => import('./pages/customer/Support'));
const SupportNew = lazy(() => import('./pages/customer/SupportNew'));
const SupportDetail = lazy(() => import('./pages/customer/SupportDetail'));
const Invoices = lazy(() => import('./pages/customer/Invoices'));
const AdminInvoices = lazy(() => import('./pages/admin/Invoices'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Users = lazy(() => import('./pages/admin/Users'));
const Shops = lazy(() => import('./pages/admin/Shops'));
const Products = lazy(() => import('./pages/admin/Products'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Reviews = lazy(() => import('./pages/admin/Reviews'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Notifications = lazy(() => import('./pages/admin/Notifications'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Promotions = lazy(() => import('./pages/admin/Promotions'));
const ModeratorDashboard = lazy(() => import('./pages/moderator/ModeratorDashboard'));
const ModeratorUsers = lazy(() => import('./pages/moderator/ModeratorUsers'));
const AdminChat = lazy(() => import('./pages/admin/Chat'));
import Footer from './components/Footer';
import PastelToast from './components/UI/PastelToast';

function WebSocketInit() {
  const { user } = useAuth();
  const initRef = useRef(false);

  useEffect(() => {
    if (user && !initRef.current) {
      initRef.current = true;
      auth.currentUser?.getIdToken().then(token => {
        websocketService.connect(token);
      }).catch(() => {});
    }
    if (!user) {
      initRef.current = false;
      websocketService.disconnect();
    }
  }, [user]);

  return null;
}

function WrappedPage({ children, role }) {
  return (
    <ProtectedRoute role={role}>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
}

function PublicPage({ children }) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  );
}

function AppContent() {
  const location = useLocation();
  const hideChat = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      <WebSocketInit />
      <PastelToast />
      <AnimatePresence mode="wait">
      <Suspense fallback={<Box p={8} textAlign="center"><Spinner size="xl" color="brand.500" /></Box>}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PublicPage><ShopsList /></PublicPage>} />
        <Route path="/shops/:id" element={<PublicPage><ShopDetail /></PublicPage>} />
        <Route path="/producto/:shop/:id" element={<PublicPage><ProductDetail /></PublicPage>} />
        <Route path="/cart" element={<WrappedPage><Cart /></WrappedPage>} />
        <Route path="/checkout" element={<WrappedPage><Checkout /></WrappedPage>} />
        <Route path="/my-orders" element={<WrappedPage><MyOrders /></WrappedPage>} />
        <Route path="/my-orders/:id" element={<WrappedPage><OrderDetail /></WrappedPage>} />
        <Route path="/profile" element={<WrappedPage><Profile /></WrappedPage>} />
        <Route path="/notifications" element={<WrappedPage><NotificationsPage /></WrappedPage>} />
        <Route path="/support" element={<WrappedPage><Support /></WrappedPage>} />
        <Route path="/support/new" element={<WrappedPage><SupportNew /></WrappedPage>} />
        <Route path="/support/:id" element={<WrappedPage><SupportDetail /></WrappedPage>} />
        <Route path="/invoices" element={<WrappedPage><Invoices /></WrappedPage>} />
        <Route path="/admin/invoices" element={<WrappedPage role="admin"><AdminInvoices /></WrappedPage>} />
        <Route path="/owner" element={<WrappedPage role={['owner', 'admin']}><OwnerDashboard /></WrappedPage>} />
        <Route path="/admin" element={<WrappedPage role="admin"><Dashboard /></WrappedPage>} />
        <Route path="/admin/users" element={<WrappedPage role="admin"><Users /></WrappedPage>} />
        <Route path="/admin/shops" element={<WrappedPage role="admin"><Shops /></WrappedPage>} />
        <Route path="/admin/shops/:shopId/products" element={<WrappedPage role="admin"><Products /></WrappedPage>} />
        <Route path="/admin/orders" element={<WrappedPage role="admin"><Orders /></WrappedPage>} />
        <Route path="/admin/reviews" element={<WrappedPage role={['moderator', 'admin']}><Reviews /></WrappedPage>} />
        <Route path="/admin/customers" element={<WrappedPage role="admin"><Customers /></WrappedPage>} />
        <Route path="/admin/reports" element={<WrappedPage role={['moderator', 'admin']}><Reports /></WrappedPage>} />
        <Route path="/admin/notifications" element={<WrappedPage role="admin"><Notifications /></WrappedPage>} />
        <Route path="/admin/payments" element={<WrappedPage role="admin"><Payments /></WrappedPage>} />
        <Route path="/admin/promotions" element={<WrappedPage role="admin"><Promotions /></WrappedPage>} />
        <Route path="/admin/chat" element={<WrappedPage role="admin"><AdminChat /></WrappedPage>} />
        <Route path="/moderator" element={<WrappedPage role={['moderator', 'admin']}><ModeratorDashboard /></WrappedPage>} />
        <Route path="/moderator/usuarios" element={<WrappedPage role={['moderator', 'admin']}><ModeratorUsers /></WrappedPage>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </AnimatePresence>
      <Footer />
      {!hideChat && <Chatbot />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
