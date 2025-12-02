import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Ticket, Search, Filter, Download } from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: number;
  raffleId: string;
  raffleTitle: string;
  status: string;
  userId: string | null;
  userName: string | null;
  orderId: string | null;
  orderNumber: string | null;
  assignedAt: string | null;
  isWinner: boolean;
}

export default function TicketsList() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRaffle, setFilterRaffle] = useState("all");
  const [raffles, setRaffles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalTickets, setTotalTickets] = useState(0);

  useEffect(() => {
    fetchRaffles();
    fetchTickets();
  }, []);

  async function fetchRaffles() {
    try {
      const response = await fetch("/api/raffles");
      const data = await response.json();
      if (data.success) {
        setRaffles(data.data);
      }
    } catch (error) {
      console.error("Error fetching raffles:", error);
    }
  }

  async function fetchTickets() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterRaffle !== "all") params.append("raffleId", filterRaffle);
      if (searchTerm) params.append("search", searchTerm);

      // Paginación
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTickets(data.data);
        // Siempre obtener el total
        await fetchTotalCount();
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTotalCount() {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("countOnly", "true");

      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterRaffle !== "all") params.append("raffleId", filterRaffle);

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.count !== undefined) {
        setTotalTickets(data.count);
      }
    } catch (error) {
      console.error("Error fetching total count:", error);
    }
  }

  useEffect(() => {
    setCurrentPage(1); // Reset page when filters change
  }, [filterStatus, filterRaffle, searchTerm]);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterRaffle, currentPage, itemsPerPage]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; text: string }> = {
      available: { className: "bg-green-100 text-green-800", text: "Disponible" },
      sold: { className: "bg-blue-100 text-blue-800", text: "Vendido" },
      reserved: { className: "bg-yellow-100 text-yellow-800", text: "Reservado" },
      winner: { className: "bg-purple-100 text-purple-800", text: "Ganador" },
    };

    const { className, text } = config[status] || config.available;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-raleway font-semibold ${className}`}>
        {text}
      </span>
    );
  };

  const totalPages = Math.ceil(totalTickets / itemsPerPage);
  const [pageInput, setPageInput] = useState("");

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTickets();
  };

  const goToPage = () => {
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput("");
    } else {
      alert(`Por favor ingresa un número entre 1 y ${totalPages}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">Cargando tickets...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-oswald text-4xl font-bold text-black mb-2">
                  GESTIÓN DE TICKETS
                </h1>
                <p className="text-gray-600 font-raleway">
                  {totalTickets > 0 ? `${totalTickets.toLocaleString()} tickets totales` : `${tickets.length} tickets encontrados`}
                </p>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black rounded-lg font-oswald font-bold hover:bg-[#b8941f] transition">
                <Download className="w-5 h-5" />
                EXPORTAR
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Buscar
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Número, orden, cliente..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-[#d4af37] text-black rounded-lg font-raleway font-semibold hover:bg-[#b8941f] transition"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="available">Disponible</option>
                  <option value="sold">Vendido</option>
                  <option value="reserved">Reservado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Sorteo
                </label>
                <select
                  value={filterRaffle}
                  onChange={(e) => setFilterRaffle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                >
                  <option value="all">Todos los sorteos</option>
                  {raffles.map((raffle) => (
                    <option key={raffle.id} value={raffle.id}>
                      {raffle.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      NÚMERO
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      SORTEO
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      ESTADO
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      CLIENTE
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      ORDEN
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      FECHA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-raleway text-gray-600">
                          No se encontraron tickets
                        </p>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className="font-oswald text-lg font-bold text-[#d4af37]">
                            #{ticket.ticketNumber.toString().padStart(4, "0")}
                          </span>
                          {ticket.isWinner && (
                            <span className="ml-2 text-purple-600">★</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-raleway text-sm text-gray-900">
                            {ticket.raffleTitle}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                        <td className="px-6 py-4">
                          <span className="font-raleway text-sm text-gray-700">
                            {ticket.userName || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {ticket.orderNumber ? (
                            <Link
                              to={`/dashboard/orders/${ticket.orderId}`}
                              className="font-raleway text-sm text-[#d4af37] hover:underline"
                            >
                              {ticket.orderNumber}
                            </Link>
                          ) : (
                            <span className="font-raleway text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-raleway text-sm text-gray-600">
                            {ticket.assignedAt
                              ? new Date(ticket.assignedAt).toLocaleDateString("es-EC")
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalTickets > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 font-raleway">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalTickets)} de {totalTickets.toLocaleString()} tickets
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded font-raleway text-sm"
                  >
                    <option value="50">50 por página</option>
                    <option value="100">100 por página</option>
                    <option value="200">200 por página</option>
                    <option value="500">500 por página</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded font-raleway text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Primera
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded font-raleway text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-raleway">
                      Página {currentPage} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-xs text-gray-500 font-raleway">Ir a:</span>
                      <input
                        type="number"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && goToPage()}
                        placeholder="#"
                        min="1"
                        max={totalPages}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm font-raleway"
                      />
                      <button
                        onClick={goToPage}
                        className="px-2 py-1 bg-[#d4af37] text-black rounded text-xs font-raleway font-semibold hover:bg-[#b8941f] transition"
                      >
                        Ir
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded font-raleway text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded font-raleway text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Última
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
