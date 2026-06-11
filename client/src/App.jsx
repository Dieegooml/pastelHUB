import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { auth } from "./config/firebase";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Chatbot from "./components/Chatbot";
import RateLimitToast from "./components/RateLimitToast";
import websocketService from "./services/websocketService";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import NotFound from "./pages/public/NotFound";
import ShopsList from "./pages/public/ShopsList";
import ShopDetail from "./pages/public/ShopDetail";
import ProductDetail from "./pages/public/ProductDetail";
import Footer from "./components/Footer";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import MyOrders from "./pages/customer/MyOrders";
import OrderDetail from "./pages/customer/OrderDetail";
import Profile from "./pages/customer/Profile";
import NotificationsPage from "./pages/customer/Notifications";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import Support from "./pages/customer/Support";
import SupportNew from "./pages/customer/SupportNew";
import SupportDetail from "./pages/customer/SupportDetail";
import Invoices from "./pages/customer/Invoices";
import AdminInvoices from "./pages/admin/Invoices";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Shops from "./pages/admin/Shops";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Reviews from "./pages/admin/Reviews";
import Customers from "./pages/admin/Customers";
import Reports from "./pages/admin/Reports";
import Notifications from "./pages/admin/Notifications";
import Payments from "./pages/admin/Payments";
import Promotions from "./pages/admin/Promotions";
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import AdminChat from "./pages/admin/Chat";

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

function AppContent() {
  const location = useLocation();
  const hideChat = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      <WebSocketInit />
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><ShopsList /></ProtectedRoute>} />
          <Route path="/shops/:id" element={<ProtectedRoute><ShopDetail /></ProtectedRoute>} />
          <Route path="/producto/:shop/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/my-orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/support/new" element={<ProtectedRoute><SupportNew /></ProtectedRoute>} />
          <Route path="/support/:id" element={<ProtectedRoute><SupportDetail /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/admin/invoices" element={<ProtectedRoute role="admin"><AdminInvoices /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute role={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><Users /></ProtectedRoute>} />
          <Route path="/admin/shops" element={<ProtectedRoute role="admin"><Shops /></ProtectedRoute>} />
          <Route path="/admin/shops/:shopId/products" element={<ProtectedRoute role="admin"><Products /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute role="admin"><Orders /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute role={['moderator', 'admin']}><Reviews /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute role="admin"><Customers /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role={['moderator', 'admin']}><Reports /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><Notifications /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute role="admin"><Payments /></ProtectedRoute>} />
          <Route path="/admin/promotions" element={<ProtectedRoute role="admin"><Promotions /></ProtectedRoute>} />
          <Route path="/admin/chat" element={<ProtectedRoute role="admin"><AdminChat /></ProtectedRoute>} />
          <Route path="/moderator" element={<ProtectedRoute role={['moderator', 'admin']}><ModeratorDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        {!hideChat && <Chatbot />}
        <RateLimitToast />
      </>
    );
  }

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}
