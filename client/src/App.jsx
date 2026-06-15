import { useEffect, useRef } from 'react';
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
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import NotFound from './pages/public/NotFound';
import ShopsList from './pages/public/ShopsList';
import ShopDetail from './pages/public/ShopDetail';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import Profile from './pages/customer/Profile';
import NotificationsPage from './pages/customer/Notifications';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import Support from './pages/customer/Support';
import SupportNew from './pages/customer/SupportNew';
import SupportDetail from './pages/customer/SupportDetail';
import Invoices from './pages/customer/Invoices';
import AdminInvoices from './pages/admin/Invoices';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Shops from './pages/admin/Shops';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Reviews from './pages/admin/Reviews';
import Customers from './pages/admin/Customers';
import Reports from './pages/admin/Reports';
import Notifications from './pages/admin/Notifications';
import Payments from './pages/admin/Payments';
import Promotions from './pages/admin/Promotions';
import ModeratorDashboard from './pages/moderator/ModeratorDashboard';
import ModeratorUsers from './pages/moderator/ModeratorUsers';
import AdminChat from './pages/admin/Chat';
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
