import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  ShoppingBag,
  Ticket,
  LogOut,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  raffleTitle: string;
  ticketCount: number;
}

export default function MyAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Transform the orders to match the interface
        const transformedOrders = data.data.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          raffleTitle: order.items && order.items[0] ? order.items[0].raffleTitle : "Sin título",
          ticketCount: order.items && order.items[0] ? order.items[0].quantity : 0,
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; text: string }> = {
      pending_payment: { color: "bg-yellow-100 text-yellow-800", icon: Clock, text: "Pendiente de Pago" },
      pending_verification: { color: "bg-blue-100 text-blue-800", icon: Clock, text: "Verificando Pago" },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle, text: "Aprobado" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, text: "Completado" },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle, text: "Rechazado" },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: XCircle, text: "Cancelado" },
    };

    const config = statusConfig[status] || statusConfig.pending_payment;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-raleway font-semibold ${config.color}`}>
        <Icon size={16} />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-raleway">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-[#d4af37] to-[#f0d98f] rounded-lg p-8 mb-8 text-black shadow-lg">
            <h1 className="font-oswald text-4xl font-bold mb-2">
              ¡Hola, {user?.firstName}!
            </h1>
            <p className="font-raleway text-lg">
              Bienvenido a tu cuenta de Impacto Minga
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                {/* User Info */}
                <div className="text-center mb-6 pb-6 border-b">
                  <div className="w-20 h-20 bg-[#d4af37] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-oswald font-bold text-white">
                      {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-oswald text-xl font-bold text-black">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 font-raleway">{user?.email}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-raleway font-semibold transition ${
                      activeTab === "orders"
                        ? "bg-[#d4af37] text-black"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <ShoppingBag size={20} />
                    Mis Compras
                  </button>

                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-raleway font-semibold transition ${
                      activeTab === "profile"
                        ? "bg-[#d4af37] text-black"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <User size={20} />
                    Mi Perfil
                  </button>

                  <Link
                    to="/"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-raleway font-semibold hover:bg-gray-100 text-gray-700 transition"
                  >
                    <Package size={20} />
                    Ver Sorteos
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-raleway font-semibold hover:bg-red-50 text-red-600 transition"
                  >
                    <LogOut size={20} />
                    Cerrar Sesión
                  </button>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h2 className="font-oswald text-3xl font-bold text-black mb-6">
                    Mis Compras
                  </h2>

                  {orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                        <ShoppingBag size={48} className="text-gray-400" />
                      </div>
                      <h3 className="font-oswald text-2xl font-bold text-gray-800 mb-2">
                        No tienes compras aún
                      </h3>
                      <p className="text-gray-600 font-raleway mb-6">
                        ¡Participa en nuestros sorteos y gana increíbles premios!
                      </p>
                      <Link
                        to="/"
                        className="inline-block bg-[#d4af37] text-black px-8 py-3 rounded-lg font-oswald font-bold text-lg hover:bg-[#b8941f] transition"
                      >
                        Ver Sorteos Activos
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-sm text-gray-500 font-raleway mb-1">
                                Orden #{order.orderNumber}
                              </p>
                              <h3 className="font-oswald text-xl font-bold text-black">
                                {order.raffleTitle}
                              </h3>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600 font-raleway mb-4">
                            <div className="flex items-center gap-2">
                              <Ticket size={16} />
                              <span>{order.ticketCount} boletos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <p className="text-sm text-gray-500 font-raleway">Total</p>
                              <p className="font-oswald text-2xl font-bold text-[#d4af37]">
                                ${order.total.toFixed(2)}
                              </p>
                            </div>
                            <button className="flex items-center gap-2 text-[#d4af37] font-raleway font-semibold hover:gap-3 transition-all">
                              Ver Detalles
                              <ChevronRight size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h2 className="font-oswald text-3xl font-bold text-black mb-6">
                    Mi Perfil
                  </h2>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                          Nombres
                        </label>
                        <input
                          type="text"
                          value={user?.firstName || ""}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-raleway"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                          Apellidos
                        </label>
                        <input
                          type="text"
                          value={user?.lastName || ""}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-raleway"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-raleway"
                      />
                    </div>

                    <div className="pt-6 border-t">
                      <p className="text-sm text-gray-500 font-raleway">
                        Para actualizar tu información, contacta con nuestro equipo de soporte.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
