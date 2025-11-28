import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface OrderItem {
  id: string;
  raffleId: string;
  raffleTitle: string;
  raffleActivityNumber: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Ticket {
  id: string;
  ticketNumber: number;
  status: string;
  isWinner: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerIdType: string;
  customerIdNumber: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentReference: string | null;
  bankAccountUsed: string | null;
  receiptUrl: string | null;
  customerNotes: string;
  adminNotes: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  tickets: Ticket[];
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [bankAccountUsed, setBankAccountUsed] = useState("");

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  async function fetchOrderDetails() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
        setAdminNotes(data.data.adminNotes || "");
        setPaymentReference(data.data.paymentReference || "");
        setBankAccountUsed(data.data.bankAccountUsed || "");
      } else {
        setError(data.message || "Error al cargar la orden");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!order) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "approved",
          adminNotes,
          paymentReference,
          bankAccountUsed,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowApproveModal(false);
        await fetchOrderDetails(); // Refresh order details
        alert("Orden aprobada exitosamente");
      } else {
        alert(data.message || "Error al aprobar la orden");
      }
    } catch (err) {
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!order || !rejectionReason.trim()) {
      alert("Por favor ingresa el motivo del rechazo");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason,
          adminNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowRejectModal(false);
        await fetchOrderDetails();
        alert("Orden rechazada");
      } else {
        alert(data.message || "Error al rechazar la orden");
      }
    } catch (err) {
      alert("Error de conexión. Intenta nuevamente.");
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<
      string,
      { icon: any; text: string; className: string }
    > = {
      pending_payment: {
        icon: AlertCircle,
        text: "PENDIENTE PAGO",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      pending_verification: {
        icon: AlertCircle,
        text: "EN VERIFICACIÓN",
        className: "bg-blue-100 text-blue-800 border-blue-300",
      },
      approved: {
        icon: CheckCircle,
        text: "APROBADA",
        className: "bg-green-100 text-green-800 border-green-300",
      },
      completed: {
        icon: CheckCircle,
        text: "COMPLETADA",
        className: "bg-green-100 text-green-800 border-green-300",
      },
      rejected: {
        icon: XCircle,
        text: "RECHAZADA",
        className: "bg-red-100 text-red-800 border-red-300",
      },
      cancelled: {
        icon: XCircle,
        text: "CANCELADA",
        className: "bg-gray-100 text-gray-800 border-gray-300",
      },
    };

    const config = statusConfig[status] || statusConfig.pending_payment;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-oswald text-lg font-bold ${config.className}`}
      >
        <Icon className="w-6 h-6" />
        {config.text}
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-6xl mx-auto text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">Cargando detalles de la orden...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="font-oswald text-2xl font-bold text-black mb-2">ERROR</h2>
              <p className="text-gray-600 font-raleway mb-6">
                {error || "No se pudo cargar la información de la orden"}
              </p>
              <Link
                to="/dashboard/orders"
                className="inline-block bg-black text-white px-8 py-3 rounded-lg font-oswald font-bold hover:bg-gray-800 transition"
              >
                VOLVER A ÓRDENES
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link
                to="/dashboard/orders"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-black font-raleway mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a órdenes
              </Link>
              <h1 className="font-oswald text-4xl font-bold text-black">
                ORDEN #{order.orderNumber}
              </h1>
            </div>
            <div>{getStatusBadge(order.status)}</div>
          </div>

          {/* Action Buttons (for pending_payment status) */}
          {order.status === "pending_payment" && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-oswald text-xl font-bold text-black mb-1">
                    ORDEN PENDIENTE DE PAGO
                  </h3>
                  <p className="font-raleway text-gray-700">
                    El cliente aún no ha pagado. Puedes aprobar manualmente si confirmaste el pago por otro medio.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-oswald font-bold hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    RECHAZAR
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-oswald font-bold hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    APROBAR PAGO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons (for pending_verification status) */}
          {order.status === "pending_verification" && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-oswald text-xl font-bold text-black mb-1">
                    ACCIÓN REQUERIDA
                  </h3>
                  <p className="font-raleway text-gray-700 mb-2">
                    El cliente ha subido su comprobante de pago. Revisa y aprueba o rechaza la orden.
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-2">
                    <p className="text-xs font-raleway text-blue-800">
                      📱 <strong>Recordatorio:</strong> Verifica que el comprobante también haya sido enviado por WhatsApp al +593 98 021 2915 para doble verificación.
                    </p>
                    <p className="text-xs font-raleway text-blue-700 mt-1">
                      ℹ️ Los tickets NO gravan IVA (IVA 0%). Verifica que el monto coincida con el total sin IVA.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-oswald font-bold hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    RECHAZAR
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-oswald font-bold hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    APROBAR
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="font-oswald text-2xl font-bold text-black mb-6 flex items-center gap-2">
                <User className="w-6 h-6" />
                INFORMACIÓN DEL CLIENTE
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-raleway font-semibold text-gray-600">
                    Nombre Completo
                  </label>
                  <p className="font-raleway text-black text-lg">
                    {order.customerFirstName} {order.customerLastName}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-raleway font-semibold text-gray-600 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="font-raleway text-black">{order.customerEmail}</p>
                </div>

                {order.customerPhone && (
                  <div>
                    <label className="text-sm font-raleway font-semibold text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </label>
                    <p className="font-raleway text-black">{order.customerPhone}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-raleway font-semibold text-gray-600">
                    Identificación
                  </label>
                  <p className="font-raleway text-black">
                    {order.customerIdType}: {order.customerIdNumber}
                  </p>
                </div>

                {(order.shippingAddress || order.shippingCity || order.shippingProvince) && (
                  <div>
                    <label className="text-sm font-raleway font-semibold text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Dirección
                    </label>
                    <p className="font-raleway text-black">
                      {order.shippingAddress}
                      {order.shippingCity && `, ${order.shippingCity}`}
                      {order.shippingProvince && `, ${order.shippingProvince}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="font-oswald text-2xl font-bold text-black mb-6 flex items-center gap-2">
                <Package className="w-6 h-6" />
                DETALLES DE LA ORDEN
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-raleway font-semibold text-gray-600">
                    Fecha de Creación
                  </label>
                  <p className="font-raleway text-black">
                    {new Date(order.createdAt).toLocaleDateString("es-EC", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-raleway font-semibold text-gray-600 flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    Método de Pago
                  </label>
                  <p className="font-raleway text-black">
                    {order.paymentMethod === "bank_transfer" || order.paymentMethod === "transfer"
                      ? "Transferencia Bancaria"
                      : "Depósito Bancario"}
                  </p>
                </div>

                {order.paymentReference && (
                  <div>
                    <label className="text-sm font-raleway font-semibold text-gray-600">
                      Referencia de Pago
                    </label>
                    <p className="font-raleway text-black font-mono bg-gray-50 p-2 rounded">
                      {order.paymentReference}
                    </p>
                  </div>
                )}

                {order.bankAccountUsed && (
                  <div>
                    <label className="text-sm font-raleway font-semibold text-gray-600">
                      Cuenta Receptora
                    </label>
                    <p className="font-raleway text-black">
                      {order.bankAccountUsed}
                    </p>
                  </div>
                )}

                {order.customerNotes && (
                  <div>
                    <label className="text-sm font-raleway font-semibold text-gray-600">
                      Notas del Cliente
                    </label>
                    <p className="font-raleway text-black bg-gray-50 p-3 rounded-lg">
                      {order.customerNotes}
                    </p>
                  </div>
                )}

                {order.adminNotes && (
                  <div>
                    <label className="text-sm font-raleway font-semibold text-gray-600 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Notas del Administrador
                    </label>
                    <p className="font-raleway text-black bg-blue-50 p-3 rounded-lg">
                      {order.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="font-oswald text-2xl font-bold text-black mb-6">ARTÍCULOS</h2>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-gray-200 pb-4"
                >
                  <div>
                    <h3 className="font-raleway font-bold text-black text-lg">
                      {item.raffleTitle}
                    </h3>
                    <p className="font-raleway text-sm text-gray-600">
                      Actividad #{item.raffleActivityNumber} · {item.quantity} números
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-oswald text-xl font-bold text-black">
                      ${item.subtotal.toFixed(2)}
                    </p>
                    <p className="font-raleway text-sm text-gray-600">
                      ${item.unitPrice.toFixed(2)} c/u
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-4 space-y-2">
                <div className="flex justify-between font-raleway">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-black">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-raleway">
                  <span className="text-gray-600">IVA (12%):</span>
                  <span className="font-semibold text-black">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-oswald text-2xl pt-2 border-t-2 border-gray-300">
                  <span className="text-black">TOTAL:</span>
                  <span className="font-bold text-[#d4af37]">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt */}
          {order.receiptUrl && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h2 className="font-oswald text-2xl font-bold text-black mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                COMPROBANTE DE PAGO
              </h2>

              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <img
                    src={order.receiptUrl}
                    alt="Comprobante de pago"
                    className="w-full max-w-md rounded-lg border-2 border-gray-300 shadow-lg"
                  />
                </div>
                <div>
                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black rounded-lg font-oswald font-bold hover:bg-[#b8941f] transition"
                  >
                    <Download className="w-5 h-5" />
                    DESCARGAR
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Tickets */}
          {order.tickets && order.tickets.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h2 className="font-oswald text-2xl font-bold text-black mb-6">
                NÚMEROS ASIGNADOS
              </h2>

              <div className="flex flex-wrap gap-3">
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-[#d4af37] text-black font-oswald text-xl font-bold px-6 py-3 rounded-lg shadow"
                  >
                    {ticket.ticketNumber.toString().padStart(4, "0")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Info */}
          {order.status === "rejected" && order.rejectionReason && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mt-6">
              <h3 className="font-oswald text-xl font-bold text-red-800 mb-2">
                MOTIVO DEL RECHAZO
              </h3>
              <p className="font-raleway text-red-700">{order.rejectionReason}</p>
              {order.rejectedAt && (
                <p className="font-raleway text-sm text-red-600 mt-2">
                  Rechazada el{" "}
                  {new Date(order.rejectedAt).toLocaleDateString("es-EC", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          )}

          {/* Approval Info */}
          {order.status === "approved" && order.approvedAt && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mt-6">
              <h3 className="font-oswald text-xl font-bold text-green-800 mb-2">
                ORDEN APROBADA
              </h3>
              <p className="font-raleway text-green-700">
                Aprobada el{" "}
                {new Date(order.approvedAt).toLocaleDateString("es-EC", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                APROBAR ORDEN
              </h2>
              <p className="font-raleway text-gray-700 mb-6">
                ¿Estás seguro de que deseas aprobar esta orden? Se asignarán los números de rifa
                automáticamente y se notificará al cliente por email.
              </p>

              <div className="mb-4">
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Número de Referencia / Comprobante
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: 123456789, TRF-2024-001..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Para control contable y auditoría
                </p>
              </div>

              <div className="mb-4">
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Cuenta que Recibió el Pago (Opcional)
                </label>
                <input
                  type="text"
                  value={bankAccountUsed}
                  onChange={(e) => setBankAccountUsed(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Banco Pichincha - 2100123456"
                />
              </div>

              <div className="mb-6">
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Notas del Administrador (Opcional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Notas internas sobre esta orden..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-gray-300 text-black rounded-lg font-oswald font-bold hover:bg-gray-400 transition disabled:opacity-50"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-oswald font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    "APROBANDO..."
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      APROBAR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                RECHAZAR ORDEN
              </h2>
              <p className="font-raleway text-gray-700 mb-6">
                Por favor indica el motivo del rechazo. El cliente recibirá una notificación por
                email con esta información.
              </p>

              <div className="mb-6">
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Motivo del Rechazo *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ej: El comprobante no coincide con el monto de la orden..."
                />
              </div>

              <div className="mb-6">
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Notas del Administrador (Opcional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Notas internas..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-gray-300 text-black rounded-lg font-oswald font-bold hover:bg-gray-400 transition disabled:opacity-50"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-oswald font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    "RECHAZANDO..."
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      RECHAZAR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
