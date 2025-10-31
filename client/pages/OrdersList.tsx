import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface OrderItem {
  id: string;
  raffleId: string;
  raffleTitle: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  total: number;
  status: string;
  paymentMethod: string;
  receiptUrl: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sortBy: "created_at",
        sortOrder: "DESC",
      });

      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
        setTotalPages(data.data.pagination.totalPages);
        setTotalOrders(data.data.pagination.total);
      } else {
        setError(data.message || "Error al cargar las órdenes");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<
      string,
      { icon: any; text: string; className: string }
    > = {
      pending_payment: {
        icon: Clock,
        text: "PENDIENTE PAGO",
        className: "bg-yellow-100 text-yellow-800",
      },
      pending_verification: {
        icon: Clock,
        text: "EN VERIFICACIÓN",
        className: "bg-blue-100 text-blue-800",
      },
      approved: {
        icon: CheckCircle,
        text: "APROBADA",
        className: "bg-green-100 text-green-800",
      },
      completed: {
        icon: CheckCircle,
        text: "COMPLETADA",
        className: "bg-green-100 text-green-800",
      },
      rejected: {
        icon: XCircle,
        text: "RECHAZADA",
        className: "bg-red-100 text-red-800",
      },
      cancelled: {
        icon: XCircle,
        text: "CANCELADA",
        className: "bg-gray-100 text-gray-800",
      },
    };

    const config = statusConfig[status] || statusConfig.pending_payment;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-oswald text-sm font-bold ${config.className}`}
      >
        <Icon className="w-4 h-4" />
        {config.text}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-oswald text-4xl font-bold text-black mb-2">
            GESTIÓN DE ÓRDENES
          </h1>
          <p className="text-gray-600 font-raleway">
            Administra todas las órdenes de compra y aprueba pagos.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch}>
              <label className="block font-raleway font-semibold text-gray-700 mb-2">
                Buscar orden
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Número de orden, email, o nombre..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div>
              <label className="block font-raleway font-semibold text-gray-700 mb-2">
                <Filter className="inline-block w-4 h-4 mr-1" />
                Filtrar por estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="pending_payment">Pendiente Pago</option>
                <option value="pending_verification">En Verificación</option>
                <option value="approved">Aprobada</option>
                <option value="completed">Completada</option>
                <option value="rejected">Rechazada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="font-raleway text-sm text-gray-600 mb-1">
              Total Órdenes
            </p>
            <p className="font-oswald text-2xl font-bold text-black">
              {totalOrders}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="font-raleway text-sm text-gray-600 mb-1">Pendiente Pago</p>
            <p className="font-oswald text-2xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === "pending_payment").length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="font-raleway text-sm text-gray-600 mb-1">
              En Verificación
            </p>
            <p className="font-oswald text-2xl font-bold text-blue-600">
              {orders.filter((o) => o.status === "pending_verification").length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="font-raleway text-sm text-gray-600 mb-1">Aprobadas</p>
            <p className="font-oswald text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === "approved").length}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">
              Cargando órdenes...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="font-oswald text-2xl font-bold text-black mb-2">
              ERROR
            </h2>
            <p className="text-gray-600 font-raleway">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="font-oswald text-2xl font-bold text-black mb-2">
              NO HAY ÓRDENES
            </h2>
            <p className="text-gray-600 font-raleway">
              No se encontraron órdenes con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                        ORDEN
                      </th>
                      <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                        CLIENTE
                      </th>
                      <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                        RIFA
                      </th>
                      <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                        TOTAL
                      </th>
                      <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                        ESTADO
                      </th>
                      <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                        FECHA
                      </th>
                      <th className="px-6 py-4 text-center font-oswald text-sm font-bold text-gray-700">
                        ACCIONES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-oswald font-bold text-black">
                            #{order.orderNumber}
                          </p>
                          {order.receiptUrl && (
                            <p className="text-xs text-green-600 font-raleway mt-1">
                              ✓ Con comprobante
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-raleway font-semibold text-black">
                            {order.customerFirstName} {order.customerLastName}
                          </p>
                          <p className="font-raleway text-sm text-gray-600">
                            {order.customerEmail}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-raleway text-sm text-gray-800">
                            {order.items && order.items[0]
                              ? order.items[0].raffleTitle
                              : "N/A"}
                          </p>
                          <p className="font-raleway text-xs text-gray-600">
                            {order.items && order.items[0]
                              ? `${order.items[0].quantity} números`
                              : ""}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-oswald text-lg font-bold text-[#d4af37]">
                            ${order.total.toFixed(2)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-raleway text-sm text-gray-800">
                            {new Date(order.createdAt).toLocaleDateString(
                              "es-EC",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                          <p className="font-raleway text-xs text-gray-600">
                            {new Date(order.createdAt).toLocaleTimeString(
                              "es-EC",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            to={`/dashboard/orders/${order.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-black rounded-lg font-oswald font-bold text-sm hover:bg-[#b8941f] transition"
                          >
                            <Eye className="w-4 h-4" />
                            VER DETALLES
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="font-raleway text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-oswald font-bold text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    ANTERIOR
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-oswald font-bold text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    SIGUIENTE
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
