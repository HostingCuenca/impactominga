import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Home,
  Ticket
} from "lucide-react";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeRaffles: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeRaffles: 0
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
              <span className="text-3xl font-oswald font-bold text-blue-600">
                {stats.totalOrders}
              </span>
            </div>
            <h3 className="font-raleway font-semibold text-gray-700 text-lg">
              Total Órdenes
            </h3>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Package className="text-yellow-600" size={24} />
              </div>
              <span className="text-3xl font-oswald font-bold text-yellow-600">
                {stats.pendingOrders}
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
                ${stats.totalRevenue.toFixed(2)}
              </span>
            </div>
            <h3 className="font-raleway font-semibold text-gray-700 text-lg">
              Ingresos
            </h3>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </div>

          {/* Active Raffles */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Ticket className="text-purple-600" size={24} />
              </div>
              <span className="text-3xl font-oswald font-bold text-purple-600">
                {stats.activeRaffles}
              </span>
            </div>
            <h3 className="font-raleway font-semibold text-gray-700 text-lg">
              Sorteos Activos
            </h3>
            <p className="text-sm text-gray-500 mt-1">En curso</p>
          </div>
        </div>

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

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-oswald text-2xl font-bold text-black mb-4">
            Actividad Reciente
          </h2>
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <TrendingUp size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-raleway text-lg">
              No hay actividad reciente para mostrar.
            </p>
            <p className="text-gray-400 font-raleway text-sm mt-2">
              Las órdenes y transacciones aparecerán aquí.
            </p>
          </div>
        </div>
    </DashboardLayout>
  );
}
