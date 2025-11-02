import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import DashboardLayout from "@/components/DashboardLayout";
import SalesChart from "@/components/SalesChart";
import ActivityFeed from "@/components/ActivityFeed";
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Home,
  Ticket,
  Users,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react";

interface DashboardStats {
  totalOrdersMonth: number;
  pendingOrders: number;
  revenueMonth: number;
  revenueTotal: number;
  activeRaffles: number;
  ticketsSoldToday: number;
  newUsersMonth: number;
  ordersChange: number;
  revenueChange: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>("/dashboard/stats");

  return (
    <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-oswald text-4xl font-bold text-black mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 font-raleway">
            Bienvenido de vuelta, {user?.firstName}
          </p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#d4af37]" size={48} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <ShoppingCart className="text-blue-600" size={24} />
                  </div>
                  <span className="text-3xl font-oswald font-bold text-blue-600">
                    {stats?.totalOrdersMonth || 0}
                  </span>
                </div>
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Total Órdenes
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-sm text-gray-500">Este mes</p>
                  {stats && stats.ordersChange !== 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${stats.ordersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.ordersChange > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(stats.ordersChange)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Pending Orders */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Package className="text-yellow-600" size={24} />
                  </div>
                  <span className="text-3xl font-oswald font-bold text-yellow-600">
                    {stats?.pendingOrders || 0}
                  </span>
                </div>
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Órdenes Pendientes
                </h3>
                <p className="text-sm text-gray-500 mt-1">Por verificar</p>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <span className="text-3xl font-oswald font-bold text-green-600">
                    ${stats?.revenueMonth.toFixed(2) || '0.00'}
                  </span>
                </div>
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Ingresos
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-sm text-gray-500">Este mes</p>
                  {stats && stats.revenueChange !== 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.revenueChange > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(stats.revenueChange)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Active Raffles */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Ticket className="text-purple-600" size={24} />
                  </div>
                  <span className="text-3xl font-oswald font-bold text-purple-600">
                    {stats?.activeRaffles || 0}
                  </span>
                </div>
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Sorteos Activos
                </h3>
                <p className="text-sm text-gray-500 mt-1">En curso</p>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Tickets Sold Today */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Ticket className="text-indigo-600" size={24} />
                  </div>
                  <span className="text-3xl font-oswald font-bold text-indigo-600">
                    {stats?.ticketsSoldToday || 0}
                  </span>
                </div>
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Tickets Vendidos
                </h3>
                <p className="text-sm text-gray-500 mt-1">Hoy</p>
              </div>

              {/* New Users */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <Users className="text-pink-600" size={24} />
                  </div>
                  <span className="text-3xl font-oswald font-bold text-pink-600">
                    {stats?.newUsersMonth || 0}
                  </span>
                </div>
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Nuevos Usuarios
                </h3>
                <p className="text-sm text-gray-500 mt-1">Este mes</p>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <TrendingUp className="text-emerald-600" size={24} />
                  </div>
                  <span className="text-3xl font-oswald font-bold text-emerald-600">
                    ${stats?.revenueTotal.toFixed(2) || '0.00'}
                  </span>
                </div>
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Ingresos Totales
                </h3>
                <p className="text-sm text-gray-500 mt-1">Histórico</p>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="font-oswald text-2xl font-bold text-black mb-6">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user?.role !== "contadora" && (
              <Link
                to="/dashboard/raffles/new"
                className="flex items-center gap-4 p-6 bg-gradient-to-r from-[#d4af37] to-[#f0d98f] text-black rounded-lg hover:shadow-lg transition transform hover:scale-105"
              >
                <div className="bg-white/30 p-3 rounded-lg">
                  <Package size={28} />
                </div>
                <div>
                  <p className="font-raleway font-bold text-lg">Crear Sorteo</p>
                  <p className="text-sm opacity-90">Nuevo sorteo/rifa</p>
                </div>
              </Link>
            )}

            <Link
              to="/dashboard/orders"
              className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart size={28} className="text-blue-600" />
              </div>
              <div>
                <p className="font-raleway font-bold text-lg">Ver Órdenes</p>
                <p className="text-sm text-gray-600">Gestionar compras</p>
              </div>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-4 p-6 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="bg-purple-100 p-3 rounded-lg">
                <Home size={28} className="text-purple-600" />
              </div>
              <div>
                <p className="font-raleway font-bold text-lg">Ver Sitio</p>
                <p className="text-sm text-gray-600">Ir al sitio web</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="font-oswald text-2xl font-bold text-black mb-6">
            Ventas de los Últimos 7 Días
          </h2>
          <SalesChart />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-oswald text-2xl font-bold text-black mb-6">
            Actividad Reciente
          </h2>
          <ActivityFeed />
        </div>
    </DashboardLayout>
  );
}
