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
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterRaffle !== "all") params.append("raffleId", filterRaffle);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterRaffle]);

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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchTerm === "" ||
      ticket.ticketNumber.toString().includes(searchTerm) ||
      ticket.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

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
                  {filteredTickets.length} tickets encontrados
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
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Número, orden, cliente..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                />
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
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-raleway text-gray-600">
                          No se encontraron tickets
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
