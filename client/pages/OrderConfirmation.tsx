import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Package, CreditCard, Upload, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface OrderDetails {
  orderId: string;
  orderNumber: string;
  raffleTitle: string;
  packageName: string;
  quantity: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  customerName: string;
  customerEmail: string;
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No se encontró el ID de la orden");
      setLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  async function fetchOrderDetails() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para ver esta orden");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.message || "Error al cargar la orden");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">Cargando información de la orden...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="font-oswald text-2xl font-bold text-black mb-2">
                ERROR
              </h2>
              <p className="text-gray-600 font-raleway mb-6">
                {error || "No se pudo cargar la información de la orden"}
              </p>
              <Link
                to="/"
                className="inline-block bg-black text-white px-8 py-3 rounded-lg font-oswald font-bold hover:bg-gray-800 transition"
              >
                VOLVER AL INICIO
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
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center animate-fade-in-up">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="font-oswald text-3xl font-bold text-black mb-2">
              ¡ORDEN CREADA EXITOSAMENTE!
            </h1>
            <p className="text-gray-600 font-raleway text-lg mb-4">
              Gracias por tu compra, <span className="font-semibold">{order.customerName}</span>
            </p>
            <div className="inline-block bg-[#d4af37] text-black px-6 py-3 rounded-lg font-oswald text-xl font-bold">
              ORDEN #{order.orderNumber}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="font-oswald text-2xl font-bold text-black mb-6 flex items-center gap-2">
              <Package className="w-6 h-6" />
              DETALLES DE LA ORDEN
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-raleway text-gray-600">Rifa:</span>
                <span className="font-raleway font-bold text-black">{order.raffleTitle}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-raleway text-gray-600">Paquete:</span>
                <span className="font-raleway font-bold text-black">{order.packageName}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-raleway text-gray-600">Cantidad de números:</span>
                <span className="font-raleway font-bold text-black">{order.quantity}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-raleway text-gray-600">Subtotal:</span>
                <span className="font-raleway font-bold text-black">${order.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="font-raleway text-gray-600">IVA (12%):</span>
                <span className="font-raleway font-bold text-black">${order.tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-4 bg-gray-50 rounded-lg px-4">
                <span className="font-oswald text-xl text-black">TOTAL:</span>
                <span className="font-oswald text-2xl font-bold text-[#d4af37]">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-oswald text-2xl font-bold text-black mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              INSTRUCCIONES DE PAGO
            </h2>

            <div className="bg-[#d4af37] bg-opacity-10 border-l-4 border-[#d4af37] p-6 mb-6">
              <p className="font-raleway text-gray-800 mb-4">
                <strong>Método de pago seleccionado:</strong> {order.paymentMethod === "transfer" ? "Transferencia Bancaria" : "Depósito Bancario"}
              </p>
              <p className="font-raleway text-gray-700">
                Por favor realiza el pago a la siguiente cuenta bancaria:
              </p>
            </div>

            <div className="space-y-3 bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-raleway font-semibold text-gray-700">Banco:</span>
                <span className="font-raleway text-black">Banco Pichincha</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-raleway font-semibold text-gray-700">Tipo de cuenta:</span>
                <span className="font-raleway text-black">Cuenta Corriente</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-raleway font-semibold text-gray-700">Número de cuenta:</span>
                <span className="font-raleway font-mono font-bold text-black">2100123456</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="font-raleway font-semibold text-gray-700">Titular:</span>
                <span className="font-raleway text-black">Impacto Minga</span>
              </div>
              <div className="flex justify-between">
                <span className="font-raleway font-semibold text-gray-700">RUC:</span>
                <span className="font-raleway font-mono text-black">1234567890001</span>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-raleway text-sm text-blue-800">
                <strong>Importante:</strong> Una vez realizado el pago, debes subir el comprobante en la sección "Mis Compras" para que podamos validar tu orden y asignarte tus números de rifa.
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="font-oswald text-2xl font-bold text-black mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6" />
              PRÓXIMOS PASOS
            </h2>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center font-oswald font-bold text-black">
                  1
                </span>
                <div>
                  <h3 className="font-raleway font-bold text-black mb-1">Realiza el pago</h3>
                  <p className="font-raleway text-gray-600 text-sm">
                    Transfiere el monto de <strong>${order.total.toFixed(2)}</strong> a la cuenta bancaria indicada arriba.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center font-oswald font-bold text-black">
                  2
                </span>
                <div>
                  <h3 className="font-raleway font-bold text-black mb-1">Sube tu comprobante</h3>
                  <p className="font-raleway text-gray-600 text-sm">
                    Ve a "Mis Compras" y sube la foto o captura del comprobante de pago.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center font-oswald font-bold text-black">
                  3
                </span>
                <div>
                  <h3 className="font-raleway font-bold text-black mb-1">Espera la validación</h3>
                  <p className="font-raleway text-gray-600 text-sm">
                    Nuestro equipo validará tu pago y te asignará tus números de rifa. Recibirás un correo de confirmación.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center font-oswald font-bold text-black">
                  4
                </span>
                <div>
                  <h3 className="font-raleway font-bold text-black mb-1">¡Listo para participar!</h3>
                  <p className="font-raleway text-gray-600 text-sm">
                    Una vez aprobado, podrás ver tus números asignados en "Mis Compras".
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Link
              to="/my-orders"
              className="flex-1 bg-[#d4af37] text-black py-4 rounded-lg font-oswald font-bold text-lg hover:bg-[#b8941f] transition text-center flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              IR A MIS COMPRAS
            </Link>

            <Link
              to="/"
              className="flex-1 bg-black text-white py-4 rounded-lg font-oswald font-bold text-lg hover:bg-gray-800 transition text-center"
            >
              VOLVER AL INICIO
            </Link>
          </div>

          {/* Confirmation Email Notice */}
          <div className="mt-6 text-center animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <p className="font-raleway text-sm text-gray-600">
              Hemos enviado un correo de confirmación a <strong>{order.customerEmail}</strong>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
