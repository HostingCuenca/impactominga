import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";

// Protected Pages
import Dashboard from "./pages/Dashboard";
import MyAccount from "./pages/MyAccount";
import RafflesList from "./pages/RafflesList";
import RaffleForm from "./pages/RaffleForm";
import RaffleEdit from "./pages/RaffleEdit";
import RaffleDetail from "./pages/RaffleDetail";
import OrdersList from "./pages/OrdersList";
import OrderDetail from "./pages/OrderDetail";
import TicketsList from "./pages/TicketsList";
import UsersList from "./pages/UsersList";
import UserEdit from "./pages/UserEdit";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />

            {/* Protected Routes - Admin Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin", "contadora"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Raffles Management */}
            <Route
              path="/dashboard/raffles"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <RafflesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/raffles/new"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <RaffleForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/raffles/:id"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <RaffleDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/raffles/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <RaffleEdit />
                </ProtectedRoute>
              }
            />

            {/* Orders Management */}
            <Route
              path="/dashboard/orders"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin", "contadora"]}>
                  <OrdersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/orders/:id"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin", "contadora"]}>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />

            {/* Tickets Management */}
            <Route
              path="/dashboard/tickets"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin", "contadora"]}>
                  <TicketsList />
                </ProtectedRoute>
              }
            />

            {/* Users Management */}
            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <UsersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <UserEdit />
                </ProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Customer Account */}
            <Route
              path="/my-account"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <MyAccount />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <MyOrders />
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
