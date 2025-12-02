import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Save, X, Calendar, DollarSign, Ticket, ImageIcon, PlayCircle } from "lucide-react";

interface RaffleFormData {
  title: string;
  description: string;
  status: "draft" | "active" | "completed" | "cancelled";
  activityNumber: string;
  totalTickets: string;
  ticketPrice: string;
  priceIncludesTax: boolean;
  taxRate: string;
  minPurchase: string;
  maxPurchase: string;
  startDate: string;
  endDate: string;
  drawDate: string;
  bannerUrl: string;
}

export default function RaffleEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingTickets, setGeneratingTickets] = useState(false);
  const [ticketsCount, setTicketsCount] = useState<number | null>(null);

  const [formData, setFormData] = useState<RaffleFormData>({
    title: "",
    description: "",
    status: "draft",
    activityNumber: "",
    totalTickets: "",
    ticketPrice: "1.00",
    priceIncludesTax: true,
    taxRate: "12.00",
    minPurchase: "1",
    maxPurchase: "100",
    startDate: "",
    endDate: "",
    drawDate: "",
    bannerUrl: "",
  });

  useEffect(() => {
    loadRaffleData();
    loadTicketsCount();
  }, [id]);

  async function loadRaffleData() {
    try {
      const response = await fetch(`/api/raffles/${id}`);
      const data = await response.json();

      if (data.success) {
        const raffle = data.data;

        // Convertir fechas al formato datetime-local (YYYY-MM-DDTHH:MM)
        const formatDateForInput = (dateString: string | null) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().slice(0, 16);
        };

        setFormData({
          title: raffle.title || "",
          description: raffle.description || "",
          status: raffle.status || "draft",
          activityNumber: raffle.activityNumber?.toString() || "",
          totalTickets: raffle.totalTickets?.toString() || "",
          ticketPrice: raffle.ticketPrice?.toString() || "1.00",
          priceIncludesTax: raffle.priceIncludesTax ?? true,
          taxRate: raffle.taxRate?.toString() || "12.00",
          minPurchase: raffle.minPurchase?.toString() || "1",
          maxPurchase: raffle.maxPurchase?.toString() || "100",
          startDate: formatDateForInput(raffle.startDate),
          endDate: formatDateForInput(raffle.endDate),
          drawDate: formatDateForInput(raffle.drawDate),
          bannerUrl: raffle.bannerUrl || "",
        });
      } else {
        setError("No se pudo cargar el sorteo");
      }
    } catch (err) {
      console.error("Error cargando sorteo:", err);
      setError("Error al cargar el sorteo");
    } finally {
      setLoadingData(false);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No hay sesión activa");
      }

      // Preparar datos para enviar
      const requestData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        activityNumber: parseInt(formData.activityNumber),
        totalTickets: parseInt(formData.totalTickets),
        ticketPrice: parseFloat(formData.ticketPrice),
        priceIncludesTax: formData.priceIncludesTax,
        taxRate: parseFloat(formData.taxRate),
        minPurchase: parseInt(formData.minPurchase),
        maxPurchase: parseInt(formData.maxPurchase),
        startDate: formData.startDate,
        endDate: formData.endDate,
        drawDate: formData.drawDate || null,
        bannerUrl: formData.bannerUrl || null,
      };

      const response = await fetch(`/api/raffles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Sorteo actualizado exitosamente");
        navigate("/dashboard/raffles");
      } else {
        setError(data.message || "Error al actualizar sorteo");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  async function loadTicketsCount() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/tickets?raffleId=${id}&countOnly=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTicketsCount(data.count);
      }
    } catch (err) {
      console.error("Error cargando cantidad de tickets:", err);
    }
  }

  async function handleGenerateTickets() {
    const totalTickets = parseInt(formData.totalTickets || "0");

    if (totalTickets <= 0) {
      alert("Por favor, ingresa un número válido de tickets totales antes de generar.");
      return;
    }

    const message = `¿Estás seguro de generar ${totalTickets.toLocaleString()} tickets para este sorteo?\n\n⚠️ IMPORTANTE: Asegúrate de haber GUARDADO los cambios primero si modificaste el "Total de Boletos".\n\nEsta acción creará todos los boletos en la base de datos según el valor guardado en la BD.`;

    if (!confirm(message)) {
      return;
    }

    setGeneratingTickets(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(`/api/raffles/${id}/generate-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(`¡Éxito! ${data.data.ticketsCreated.toLocaleString()} tickets generados correctamente`);
        await loadTicketsCount(); // Recargar contador
      } else {
        setError(data.message || "Error al generar tickets");
      }
    } catch (err) {
      console.error("Error al generar tickets:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGeneratingTickets(false);
    }
  }

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto mb-4"></div>
            <p className="text-gray-600 font-raleway">Cargando sorteo...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-oswald text-4xl font-bold text-black mb-2">
              Editar Sorteo
            </h1>
            <p className="text-gray-600 font-raleway">
              Actualiza la información del sorteo
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard/raffles")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-raleway transition"
          >
            <X size={20} />
            Cancelar
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 font-raleway">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-oswald text-2xl font-bold text-black mb-4">
              Información Básica
            </h2>

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Título del Sorteo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Ej: SORTEO TOYOTA COROLLA 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe el sorteo y sus detalles..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estado */}
                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                  >
                    <option value="draft">Borrador</option>
                    <option value="active">Activo</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                {/* Número de Actividad */}
                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Número de Actividad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="activityNumber"
                    value={formData.activityNumber}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Ej: 42"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                  />
                </div>
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ImageIcon size={16} />
                  URL del Banner
                </label>
                <input
                  type="url"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
                {formData.bannerUrl && (
                  <img
                    src={formData.bannerUrl}
                    alt="Preview"
                    className="mt-3 w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Configuración de Boletos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-oswald text-2xl font-bold text-black flex items-center gap-2">
                <Ticket size={24} />
                Configuración de Boletos
              </h2>

              {/* Indicador de tickets y botón de generar */}
              <div className="flex items-center gap-4">
                {ticketsCount !== null && (
                  <div className="text-sm font-raleway">
                    {ticketsCount > 0 ? (
                      <span className="text-green-600 font-semibold">
                        ✓ {ticketsCount.toLocaleString()} / {parseInt(formData.totalTickets || "0").toLocaleString()} tickets generados
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        ⚠ 0 / {parseInt(formData.totalTickets || "0").toLocaleString()} tickets generados
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateTickets}
                  disabled={generatingTickets}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-raleway font-semibold px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Generará ${parseInt(formData.totalTickets || "0").toLocaleString()} tickets según el total guardado en la BD`}
                >
                  {generatingTickets ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <PlayCircle size={18} />
                      Generar Tickets
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Aviso importante */}
            {ticketsCount === 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-sm font-raleway text-yellow-800">
                  <strong>⚠️ Importante:</strong> Este sorteo no tiene tickets generados.
                  Para generarlos, sigue estos pasos:
                </p>
                <ol className="mt-2 ml-4 text-sm font-raleway text-yellow-800 list-decimal space-y-1">
                  <li>Ingresa el "Total de Boletos" deseado (ej: 10000)</li>
                  <li>Haz clic en "Guardar Cambios" al final del formulario</li>
                  <li>Luego haz clic en el botón "Generar Tickets" arriba</li>
                </ol>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total de Boletos */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Total de Boletos <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalTickets"
                  value={formData.totalTickets}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="Ej: 10000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>

              {/* Precio por Boleto */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  Precio por Boleto <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="ticketPrice"
                  value={formData.ticketPrice}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="1.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>

              {/* Mínimo de Compra */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Mínimo de Compra
                </label>
                <input
                  type="number"
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleChange}
                  min="1"
                  placeholder="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>

              {/* Máximo de Compra */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Máximo de Compra
                </label>
                <input
                  type="number"
                  name="maxPurchase"
                  value={formData.maxPurchase}
                  onChange={handleChange}
                  min="1"
                  placeholder="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>

              {/* Incluye Impuestos */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="priceIncludesTax"
                  id="priceIncludesTax"
                  checked={formData.priceIncludesTax}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
                />
                <label
                  htmlFor="priceIncludesTax"
                  className="text-sm font-raleway font-semibold text-gray-700"
                >
                  Precio incluye impuestos
                </label>
              </div>

              {/* Tasa de Impuesto */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Tasa de Impuesto (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="12.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-oswald text-2xl font-bold text-black mb-4 flex items-center gap-2">
              <Calendar size={24} />
              Fechas del Sorteo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha de Inicio */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Fecha de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>

              {/* Fecha de Fin */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Fecha de Fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>

              {/* Fecha del Sorteo */}
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Fecha del Sorteo
                </label>
                <input
                  type="datetime-local"
                  name="drawDate"
                  value={formData.drawDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/raffles")}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-raleway font-semibold rounded-lg transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c4a037] text-black font-raleway font-semibold px-6 py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
