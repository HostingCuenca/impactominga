import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import useScrollTop from "@/hooks/useScrollTop";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Cart() {
  useScrollTop();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, tax, total, itemCount } = useCart();

  const totalNumbers = items.reduce((total, item) => total + item.ticketCount * item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) return;

    // For now, we'll use the first item to navigate to checkout
    // In a more complex scenario, you might want to handle multiple items differently
    const firstItem = items[0];
    navigate(`/checkout?raffleId=${firstItem.raffleId}&packageId=${firstItem.packageId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="pt-24">
        {/* Cart Header */}
        <section className="bg-white py-12 px-4 animate-slide-in-down">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-oswald text-4xl md:text-5xl font-bold text-black">
              TU CARRITO
            </h1>
            <p className="text-gray-600 font-raleway mt-2">
              {itemCount} {itemCount === 1 ? "item" : "items"} | {totalNumbers} números totales
            </p>
          </div>
        </section>

        {/* Cart Content */}
        <section className="bg-gray-100 py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="md:col-span-2">
              {items.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <p className="text-gray-600 font-raleway text-lg mb-6">
                    Tu carrito está vacío
                  </p>
                  <Link
                    to="/"
                    className="inline-block bg-black text-white px-8 py-3 font-oswald font-bold rounded-lg hover:bg-gray-800 transition"
                  >
                    VOLVER A COMPRAR
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.packageId}
                      className="bg-white rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-oswald text-xl font-bold text-black mb-2">
                          {item.raffleTitle}
                        </h3>
                        <p className="text-gray-600 font-raleway">
                          {item.packageName} · ${item.price.toFixed(2)} por paquete
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                          <button
                            onClick={() => updateQuantity(item.packageId, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="w-8 text-center font-oswald font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.packageId, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            aria-label="Increase quantity"
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <p className="font-oswald font-bold text-lg text-black w-24 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>

                        <button
                          onClick={() => removeItem(item.packageId)}
                          className="text-red-600 hover:text-red-800 transition p-2"
                          aria-label="Remove item"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            {items.length > 0 && (
              <div className="md:col-span-1">
                <div className="bg-white rounded-lg p-8 sticky top-32">
                  <h2 className="font-oswald text-2xl font-bold text-black mb-6">
                    RESUMEN DE COMPRA
                  </h2>

                  <div className="space-y-4 border-b border-gray-200 pb-6 mb-6">
                    <div className="flex justify-between">
                      <p className="text-gray-600 font-raleway">Subtotal:</p>
                      <p className="font-oswald font-bold">${subtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600 font-raleway">IVA (12%):</p>
                      <p className="font-oswald font-bold">${tax.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between mb-8">
                    <p className="font-oswald text-lg font-bold">Total:</p>
                    <p className="font-oswald text-2xl font-bold text-[#d4af37]">
                      ${total.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleCheckout}
                      disabled={items.length === 0}
                      className="block w-full bg-[#d4af37] text-black py-3 font-oswald font-bold text-center rounded-lg hover:bg-[#b8941f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      PROCEDER AL PAGO
                    </button>
                    <Link
                      to="/"
                      className="block w-full bg-gray-200 text-black py-3 font-oswald font-bold text-center rounded-lg hover:bg-gray-300 transition"
                    >
                      CONTINUAR COMPRANDO
                    </Link>
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 font-raleway">
                      <span className="font-bold">Total de números:</span> {totalNumbers} números en tu carrito
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
