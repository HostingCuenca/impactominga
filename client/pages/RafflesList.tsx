import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Ticket,
  DollarSign,
  TrendingUp,
  Filter,
  Search
} from "lucide-react";

interface Raffle {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: "draft" | "active" | "completed" | "cancelled";
  activityNumber: number;
  totalTickets: number;
  ticketPrice: number;
  startDate: string;
  endDate: string;
  drawDate: string | null;
  bannerUrl: string | null;
  ticketsSold: number;
  ticketsAvailable: number;
  createdAt: string;
  updatedAt: string;
}

export default function RafflesList() {
  const { user } = useAuth();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadRaffles();
  }, []);

  async function loadRaffles() {
    try {
      // Para el dashboard de admin, mostrar TODOS los sorteos (no solo activos)
      const response = await fetch("/api/raffles?all=true");
      const data = await response.json();

      if (data.success) {
        setRaffles(data.data);
      }
    } catch (error) {
      console.error("Error cargando sorteos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(raffleId: string) {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`/api/raffles/${raffleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar la lista
        setRaffles(raffles.map(r =>
          r.id === raffleId ? { ...r, status: "cancelled" as const } : r
        ));
        setDeleteConfirm(null);
        alert("Sorteo eliminado exitosamente");
      } else {
        alert(data.message || "Error al eliminar sorteo");
      }
    } catch (error) {
      console.error("Error eliminando sorteo:", error);
      alert("Error al eliminar sorteo");
    }
  }

  const filteredRaffles = raffles.filter((raffle) => {
    const matchesSearch = raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         raffle.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || raffle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: "bg-gray-200 text-gray-700",
      active: "bg-green-200 text-green-800",
      completed: "bg-blue-200 text-blue-800",
      cancelled: "bg-red-200 text-red-800",
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: "Borrador",
      active: "Activo",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto mb-4"></div>
            <p className="text-gray-600 font-raleway">Cargando sorteos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-oswald text-4xl font-bold text-black mb-2">
            Gestión de Sorteos
          </h1>
          <p className="text-gray-600 font-raleway">
            Administra todos los sorteos y rifas
          </p>
        </div>

        {(user?.role === "super_admin" || user?.role === "admin") && (
          <Link
            to="/dashboard/raffles/new"
            className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c4a037] text-black font-raleway font-semibold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Crear Sorteo
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Activos</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-green-600">
            {raffles.filter(r => r.status === "active").length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Edit className="text-gray-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Borradores</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-gray-600">
            {raffles.filter(r => r.status === "draft").length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Completados</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-blue-600">
            {raffles.filter(r => r.status === "completed").length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Ticket className="text-purple-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Total</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-purple-600">
            {raffles.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway appearance-none bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="draft">Borradores</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Raffles Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredRaffles.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <Ticket size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-raleway text-lg">
              No se encontraron sorteos
            </p>
            <p className="text-gray-400 font-raleway text-sm mt-2">
              {searchTerm || statusFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Crea tu primer sorteo para comenzar"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-raleway font-bold text-gray-700">
                    Sorteo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-raleway font-bold text-gray-700">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-raleway font-bold text-gray-700">
                    Actividad #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-raleway font-bold text-gray-700">
                    Boletos
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-raleway font-bold text-gray-700">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-raleway font-bold text-gray-700">
                    Progreso
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-raleway font-bold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRaffles.map((raffle) => {
                  const progressPercent = (raffle.ticketsSold / raffle.totalTickets) * 100;

                  return (
                    <tr key={raffle.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {raffle.bannerUrl && (
                            <img
                              src={raffle.bannerUrl}
                              alt={raffle.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="font-raleway font-semibold text-gray-900">
                              {raffle.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {raffle.description?.substring(0, 60)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-raleway font-semibold ${getStatusBadge(raffle.status)}`}>
                          {getStatusText(raffle.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-raleway text-gray-900 font-semibold">
                          #{raffle.activityNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-raleway">
                          <p className="text-gray-900 font-semibold">
                            {raffle.ticketsSold.toLocaleString()} vendidos
                          </p>
                          <p className="text-gray-500 text-xs">
                            de {raffle.totalTickets.toLocaleString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-raleway font-semibold text-gray-900">
                          <DollarSign size={16} />
                          {raffle.ticketPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full">
                          <div className="flex items-center justify-between text-xs font-raleway text-gray-600 mb-1">
                            <span>{progressPercent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#d4af37] h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/dashboard/raffles/${raffle.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver detalles y gestionar paquetes/premios"
                          >
                            <Eye size={18} />
                          </Link>

                          {(user?.role === "super_admin" || user?.role === "admin") && raffle.status !== "completed" && (
                            <>
                              <Link
                                to={`/dashboard/raffles/${raffle.id}/edit`}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </Link>

                              {raffle.status !== "cancelled" && (
                                deleteConfirm === raffle.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDelete(raffle.id)}
                                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(raffle.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
