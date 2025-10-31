import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Error al enviar el correo");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in-up">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="font-oswald text-2xl font-bold text-black mb-2">
                  ¡CORREO ENVIADO!
                </h2>
                <p className="text-gray-600 font-raleway mb-6">
                  Si el correo <strong>{email}</strong> está registrado, recibirás
                  instrucciones para restablecer tu contraseña.
                </p>
                <p className="text-sm text-gray-500 font-raleway mb-6">
                  Revisa tu bandeja de entrada y carpeta de spam.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[#d4af37] hover:text-[#b8941f] font-raleway font-semibold transition"
                >
                  <ArrowLeft size={16} />
                  Volver al inicio de sesión
                </Link>
              </div>
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
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <img
                src="/logo.png"
                alt="Impacto Minga"
                className="h-16 mx-auto mb-4"
              />
              <h1 className="font-oswald text-3xl font-bold text-black mb-2">
                ¿OLVIDASTE TU CONTRASEÑA?
              </h1>
              <p className="text-gray-600 font-raleway">
                Ingresa tu correo electrónico y te enviaremos un enlace para
                restablecerla.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 font-raleway text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-oswald font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "ENVIANDO..." : "ENVIAR ENLACE DE RECUPERACIÓN"}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[#d4af37] hover:text-[#b8941f] font-raleway font-semibold text-sm transition"
                >
                  <ArrowLeft size={16} />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
