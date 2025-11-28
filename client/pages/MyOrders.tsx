import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Upload, CheckCircle, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface OrderItem {
  id: string;
  raffleId: string;
  raffleTitle: string;
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
  total: number;
  status: string;
  paymentMethod: string;
  receiptUrl: string | null;
  createdAt: string;
  items: OrderItem[];
  tickets: Ticket[];
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para ver tus compras");
        setLoading(false);
        return;
      }

      console.log("[MyOrders] Fetching orders...");

      const response = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("[MyOrders] Response:", data);

      if (data.success) {
        console.log("[MyOrders] Orders found:", data.data.length);
        setOrders(data.data);
      } else {
        console.error("[MyOrders] Error response:", data);
        setError(data.message || "Error al cargar las órdenes");
      }
    } catch (err) {
      console.error("[MyOrders] Fetch error:", err);
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReceiptUpload(orderId: string, file: File) {
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Por favor sube una imagen válida (JPG, PNG o WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La imagen no debe superar los 5MB");
      return;
    }

    setUploadingReceipt(orderId);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/${orderId}/upload-receipt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh orders to show updated status
        await fetchOrders();
        setUploadError(null);
      } else {
        setUploadError(data.message || "Error al subir el comprobante");
      }
    } catch (err) {
      setUploadError("Error de conexión. Intenta nuevamente.");
    } finally {
      setUploadingReceipt(null);
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { icon: any; text: string; className: string }> = {
      pending_payment: {
        icon: Clock,
        text: "PENDIENTE PAGO",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      pending_verification: {
        icon: Clock,
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
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-oswald text-sm font-bold ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </div>
    );
  }

  function toggleOrderExpansion(orderId: string) {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">Cargando tus compras...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="font-oswald text-2xl font-bold text-black mb-2">ERROR</h2>
              <p className="text-gray-600 font-raleway mb-6">{error}</p>
              <Link
                to="/login"
                className="inline-block bg-black text-white px-8 py-3 rounded-lg font-oswald font-bold hover:bg-gray-800 transition"
              >
                INICIAR SESIÓN
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-oswald text-4xl font-bold text-black mb-2">MIS COMPRAS</h1>
            <p className="text-gray-600 font-raleway mb-4">
              Aquí puedes ver el estado de tus órdenes y subir tus comprobantes de pago.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm font-raleway text-blue-800 mb-2">
                <strong>📱 Importante:</strong> Envía también tu comprobante por WhatsApp al <strong>+593 98 021 2915</strong> para corroborar la información y mayor seguridad.
              </p>
              <p className="text-xs font-raleway text-blue-700">
                ℹ️ <strong>Nota:</strong> Los tickets de rifa NO gravan IVA (IVA 0%). Los valores mostrados son finales.
              </p>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="font-oswald text-2xl font-bold text-black mb-2">
                NO TIENES COMPRAS AÚN
              </h2>
              <p className="text-gray-600 font-raleway mb-6">
                Participa en nuestras rifas y apoya una buena causa.
              </p>
              <Link
                to="/"
                className="inline-block bg-[#d4af37] text-black px-8 py-3 rounded-lg font-oswald font-bold hover:bg-[#b8941f] transition"
              >
                VER RIFAS DISPONIBLES
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-lg overflow-hidden animate-fade-in-up">
                  {/* Order Header - Always Visible */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-oswald text-xl font-bold text-black">
                            ORDEN #{order.orderNumber}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="font-raleway text-gray-600 mb-1">
                          <strong>Rifa:</strong> {order.items && order.items[0] ? order.items[0].raffleTitle : "N/A"}
                        </p>
                        <p className="font-raleway text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("es-EC", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-oswald text-2xl font-bold text-[#d4af37]">
                            ${order.total.toFixed(2)}
                          </p>
                          <p className="font-raleway text-sm text-gray-600">
                            {order.items && order.items[0] ? order.items[0].quantity : 0} {order.items && order.items[0] && order.items[0].quantity === 1 ? "número" : "números"}
                          </p>
                        </div>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details - Expandable */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Order Information */}
                        <div>
                          <h4 className="font-oswald text-lg font-bold text-black mb-4">
                            INFORMACIÓN DE LA ORDEN
                          </h4>
                          <div className="space-y-2 font-raleway text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cantidad:</span>
                              <span className="font-semibold text-black">
                                {order.items && order.items[0] ? order.items[0].quantity : 0} números
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Método de pago:</span>
                              <span className="font-semibold text-black">
                                {order.paymentMethod === "bank_transfer" || order.paymentMethod === "transfer" ? "Transferencia" : "Depósito"}
                              </span>
                            </div>
                            {order.tickets && order.tickets.length > 0 && (
                              <div>
                                <span className="text-gray-600 block mb-2">Números asignados:</span>
                                <div className="flex flex-wrap gap-2">
                                  {order.tickets.map((ticket) => (
                                    <span
                                      key={ticket.id}
                                      className="inline-block bg-[#d4af37] text-black font-bold px-3 py-1 rounded-lg"
                                    >
                                      {ticket.ticketNumber.toString().padStart(4, "0")}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Receipt Upload */}
                        <div>
                          <h4 className="font-oswald text-lg font-bold text-black mb-4">
                            COMPROBANTE DE PAGO
                          </h4>

                          {order.status === "pending_payment" && !order.receiptUrl && (
                            <div>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <p className="font-raleway text-sm text-yellow-800">
                                  <strong>Acción requerida:</strong> Sube tu comprobante de pago para que
                                  podamos validar tu orden.
                                </p>
                              </div>
                              <label
                                htmlFor={`receipt-${order.id}`}
                                className="block w-full bg-[#d4af37] text-black py-3 rounded-lg font-oswald font-bold text-center hover:bg-[#b8941f] transition cursor-pointer"
                              >
                                {uploadingReceipt === order.id ? (
                                  "SUBIENDO..."
                                ) : (
                                  <>
                                    <Upload className="inline-block w-5 h-5 mr-2" />
                                    SUBIR COMPROBANTE
                                  </>
                                )}
                              </label>
                              <input
                                id={`receipt-${order.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleReceiptUpload(order.id, file);
                                }}
                                disabled={uploadingReceipt === order.id}
                              />
                              {uploadError && uploadingReceipt !== order.id && (
                                <p className="mt-2 text-sm text-red-600 font-raleway">{uploadError}</p>
                              )}
                            </div>
                          )}

                          {order.status === "pending_verification" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <CheckCircle className="w-8 h-8 text-blue-600 mb-2" />
                              <p className="font-raleway text-sm text-blue-800">
                                <strong>Comprobante recibido.</strong> Estamos validando tu pago. Te
                                notificaremos por correo cuando tu orden sea aprobada.
                              </p>
                              {order.receiptUrl && (
                                <a
                                  href={order.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm mt-2 inline-block underline"
                                >
                                  Ver comprobante
                                </a>
                              )}
                            </div>
                          )}

                          {order.status === "approved" && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                              <p className="font-raleway text-sm text-green-800">
                                <strong>¡Orden aprobada!</strong> Tus números ya están asignados. ¡Mucha
                                suerte!
                              </p>
                            </div>
                          )}

                          {order.status === "rejected" && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <XCircle className="w-8 h-8 text-red-600 mb-2" />
                              <p className="font-raleway text-sm text-red-800">
                                <strong>Orden rechazada.</strong> Por favor, verifica tu comprobante y
                                vuelve a subirlo o contáctanos para más información.
                              </p>
                              <label
                                htmlFor={`receipt-retry-${order.id}`}
                                className="mt-3 block w-full bg-red-600 text-white py-2 rounded-lg font-oswald font-bold text-center hover:bg-red-700 transition cursor-pointer text-sm"
                              >
                                SUBIR NUEVO COMPROBANTE
                              </label>
                              <input
                                id={`receipt-retry-${order.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleReceiptUpload(order.id, file);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
