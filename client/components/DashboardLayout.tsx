import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Ticket,
  Settings,
  TrendingUp,
  Package,
  LogOut,
  Home
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const linkClasses = (path: string) => {
    return isActive(path)
      ? "flex items-center gap-3 px-4 py-3 rounded-lg bg-[#d4af37] text-black font-raleway font-semibold"
      : "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 font-raleway transition";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <img src="/logo.png" alt="Impacto Minga" className="h-10 w-auto" />
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <p className="font-oswald font-bold text-lg">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-400 capitalize">
            {user?.role?.replace("_", " ")}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/dashboard" className={linkClasses("/dashboard")}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>

          {(user?.role === "super_admin" || user?.role === "admin") && (
            <>
              <Link to="/dashboard/raffles" className={linkClasses("/dashboard/raffles")}>
                <Package size={20} />
                Sorteos
              </Link>

              <Link to="/dashboard/orders" className={linkClasses("/dashboard/orders")}>
                <ShoppingCart size={20} />
                Órdenes
              </Link>

              <Link to="/dashboard/tickets" className={linkClasses("/dashboard/tickets")}>
                <Ticket size={20} />
                Boletos
              </Link>

              <Link to="/dashboard/users" className={linkClasses("/dashboard/users")}>
                <Users size={20} />
                Usuarios
              </Link>
            </>
          )}

          {user?.role === "contadora" && (
            <>
              <Link to="/dashboard/orders" className={linkClasses("/dashboard/orders")}>
                <ShoppingCart size={20} />
                Órdenes
              </Link>

              <Link to="/dashboard/tickets" className={linkClasses("/dashboard/tickets")}>
                <Ticket size={20} />
                Boletos
              </Link>

              <Link to="/dashboard/reports" className={linkClasses("/dashboard/reports")}>
                <TrendingUp size={20} />
                Reportes
              </Link>
            </>
          )}

          {user?.role === "super_admin" && (
            <Link to="/dashboard/settings" className={linkClasses("/dashboard/settings")}>
              <Settings size={20} />
              Configuración
            </Link>
          )}

          {/* Divider */}
          <div className="border-t border-gray-700 my-4"></div>

          {/* Link to Home */}
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 font-raleway transition">
            <Home size={20} />
            Ver Sitio Web
          </Link>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 font-raleway transition w-full"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
