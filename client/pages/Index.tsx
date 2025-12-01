import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import useScrollTop from "@/hooks/useScrollTop";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlessedNumbers from "@/components/BlessedNumbers";

interface Raffle {
  id: string;
  title: string;
  description: string;
  activityNumber: number;
  totalTickets: number;
  ticketsSold: number;
  ticketsAvailable: number;
  bannerUrl: string;
}

interface Package {
  id: string;
  quantity: number;
  price: number;
  isMostPopular: boolean;
  discountPercentage: number;
}

interface Prize {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  unlockThreshold: number;
  unlockStatus: string;
}

export default function Index() {
  useScrollTop();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const [quantity, setQuantity] = useState(3);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultResults, setConsultResults] = useState<any>(null);
  const [consultError, setConsultError] = useState("");
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const galleryRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace("#", "");
      const element = document.getElementById(elementId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location.hash]);

  // Cargar datos del sorteo activo desde la API
  useEffect(() => {
    async function loadRaffleData() {
      try {
        // Obtener sorteo activo
        const raffleRes = await fetch("/api/raffles");
        const raffleData = await raffleRes.json();

        if (raffleData.success && raffleData.data.length > 0) {
          const activeRaffle = raffleData.data[0]; // Primer sorteo activo
          setRaffle(activeRaffle);

          // Obtener paquetes de precios
          const packagesRes = await fetch(`/api/raffles/${activeRaffle.id}/packages`);
          const packagesData = await packagesRes.json();
          if (packagesData.success) {
            setPackages(packagesData.data);
          }

          // Obtener premios
          const prizesRes = await fetch(`/api/raffles/${activeRaffle.id}/prizes`);
          const prizesData = await prizesRes.json();
          if (prizesData.success) {
            setPrizes(prizesData.data);
          }
        }
      } catch (error) {
        console.error("Error cargando datos del sorteo:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRaffleData();
  }, []);

  // Auto-play del carrusel de premios
  useEffect(() => {
    if (prizes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === prizes.length - 1 ? 0 : prev + 1));
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [prizes.length]);

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? prizes.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === prizes.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = (pkg: Package) => {
    if (!raffle) return;

    addItem({
      raffleId: raffle.id,
      raffleTitle: raffle.title,
      packageId: pkg.id,
      packageName: `${pkg.quantity} números`,
      price: pkg.price,
      ticketCount: pkg.quantity,
    });

    // Redirect to cart
    navigate("/cart");
  };

  const handleConsultTickets = async () => {
    if (!consultEmail || !consultEmail.includes('@')) {
      setConsultError("Por favor ingresa un correo válido");
      return;
    }

    setConsultLoading(true);
    setConsultError("");
    setConsultResults(null);

    try {
      const response = await fetch("/api/orders/consult-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: consultEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setConsultResults(data.data);
      } else {
        setConsultError(data.message || "No se encontraron números para este correo");
      }
    } catch (err) {
      setConsultError("Error de conexión. Intenta nuevamente.");
    } finally {
      setConsultLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-raleway">Cargando sorteo...</p>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-24 px-4">
          <div className="max-w-6xl mx-auto text-center py-16">
            <h2 className="font-oswald text-3xl font-bold text-black mb-4">
              No hay sorteos activos en este momento
            </h2>
            <p className="text-gray-600 font-raleway">
              Vuelve pronto para participar en nuestros próximos sorteos
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Main Content - accounting for header height */}
      <main className="pt-24">
        {/* Hero Section with Background Image */}
        <section
          id="juega"
          className="relative bg-cover bg-top bg-no-repeat min-h-[600px] md:min-h-[700px] flex items-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), url('/nuevaportada.png')`,
            backgroundPosition: 'bottom center',
            backgroundSize: 'cover'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-16 w-full">
            <div className="text-center text-white space-y-6">
              {/* Main Title with text shadow for better readability */}
              <h1
                className="font-oswald text-5xl md:text-7xl font-bold tracking-wider"
                style={{ textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)' }}
              >
                IMPACTO MINGA
              </h1>

              {/* Subtitle with golden color and text shadow */}
              <h2
                className="font-oswald text-2xl md:text-4xl italic text-[#d4af37] font-bold"
                style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)' }}
              >
                ¡Gana las herramientas que <span className="text-white">POTENCIARÁN</span> tú trabajo!
              </h2>

              {/* CTA Button */}
              <div className="pt-8">
                <button
                  onClick={() => {
                    const element = document.getElementById('paquetes');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#d4af37] hover:bg-[#b8941f] text-black font-oswald text-xl md:text-2xl font-bold px-12 py-4 rounded-lg transition transform hover:scale-105 shadow-2xl"
                >
                  ¡PARTICIPA Y GANA!
                </button>
              </div>

              {/* Social Media Call to Action */}
              <div className="pt-6">
                <p
                  className="font-raleway text-lg md:text-xl"
                  style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
                >
                  📱 Síguenos en nuestras <span className="font-bold text-[#d4af37]">redes sociales</span> para enterarte de todo
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CADA TICKET TE ACERCA A GANAR Section */}
        <section className="bg-gradient-to-b from-gray-800 to-gray-900 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Title */}
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-[#d4af37] mb-12 tracking-wide">
              CADA TICKET TE ACERCA A GANAR
            </h2>

            <div className="grid md:grid-cols-4 gap-8 items-center">
              {/* Ticket Card */}
              <div className="md:col-span-1 flex justify-center">
                <div className="relative">
                  {/* Ticket Design */}
                  <div className="bg-gradient-to-br from-[#d4af37] to-[#f0d98f] rounded-lg p-8 transform rotate-[-5deg] shadow-2xl border-4 border-dashed border-gray-900">
                    <div className="text-center">
                      <p className="font-oswald text-6xl font-bold text-black">$1</p>
                      <p className="font-oswald text-3xl font-bold text-black">USD</p>
                    </div>
                  </div>
                  <p className="text-white font-raleway text-center mt-6 text-sm">
                    Tu oportunidad cuesta solo <span className="font-bold text-[#d4af37]">$1 USD</span>
                  </p>
                </div>
              </div>

              {/* Category Cards */}
              <div className="md:col-span-3 grid md:grid-cols-3 gap-6">
                {/* Card 1 - Herramientas Eléctricas */}
                <div className="bg-gray-700/50 backdrop-blur-sm border-2 border-gray-600 rounded-lg p-6 hover:border-[#d4af37] transition group">
                  <div className="text-center space-y-4">
                    <div className="text-5xl mb-4">⚡</div>
                    <h3 className="font-oswald text-xl font-bold text-white group-hover:text-[#d4af37] transition">
                      Herramientas Eléctricas
                    </h3>
                    <p className="text-gray-300 font-raleway text-sm">
                      Potencia y precisión para cada proyecto
                    </p>
                  </div>
                </div>

                {/* Card 2 - Herramientas Inalámbricas */}
                <div className="bg-gray-700/50 backdrop-blur-sm border-2 border-gray-600 rounded-lg p-6 hover:border-[#d4af37] transition group">
                  <div className="text-center space-y-4">
                    <div className="text-5xl mb-4">🔋</div>
                    <h3 className="font-oswald text-xl font-bold text-white group-hover:text-[#d4af37] transition">
                      Herramientas Inalámbricas
                    </h3>
                    <p className="text-gray-300 font-raleway text-sm">
                      Libertad de movimiento sin límites
                    </p>
                  </div>
                </div>

                {/* Card 3 - Combos Profesionales */}
                <div className="bg-gray-700/50 backdrop-blur-sm border-2 border-gray-600 rounded-lg p-6 hover:border-[#d4af37] transition group">
                  <div className="text-center space-y-4">
                    <div className="text-5xl mb-4">🧰</div>
                    <h3 className="font-oswald text-xl font-bold text-white group-hover:text-[#d4af37] transition">
                      Combos Profesionales
                    </h3>
                    <p className="text-gray-300 font-raleway text-sm">
                      Optimizan tú tiempo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Image */}
        <section className="bg-white py-12 px-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-lg bg-gray-200 shadow-xl">
              <img
                src={raffle.bannerUrl}
                alt={raffle.title}
                className="w-full h-auto object-contain md:object-cover md:h-[500px] md:object-right"
              />
            </div>
          </div>
        </section>

        {/* Blessed Numbers Section */}
        {raffle && (
          <BlessedNumbers raffleId={raffle.id} />
        )}

        {/* Pricing Section */}
        <section id="paquetes" className="bg-gray-100 py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-12">
              SELECCIONA TU PAQUETE
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...packages].sort((a, b) => b.quantity - a.quantity).map((pkg, index) => (
                <div
                  key={pkg.id}
                  className={`rounded-lg overflow-hidden transition transform hover:scale-105 animate-fade-in-up ${
                    pkg.isMostPopular
                      ? "ring-2 ring-[#d4af37] shadow-xl"
                      : "bg-white shadow-md"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {pkg.isMostPopular && (
                    <div className="bg-[#d4af37] text-black text-center py-2 font-oswald font-bold text-sm">
                      ★ MÁS POPULAR ★
                    </div>
                  )}

                  <div className={`p-6 ${pkg.isMostPopular ? "bg-white" : ""}`}>
                    <h3 className="font-oswald text-3xl font-bold text-center text-black mb-4">
                      x{pkg.quantity}
                    </h3>
                    <p className="font-oswald text-2xl font-bold text-center text-[#d4af37] mb-2">
                      ${pkg.price.toFixed(2)}
                    </p>
                    {pkg.discountPercentage > 0 && (
                      <p className="text-center text-sm text-gray-500 font-raleway mb-4">
                        ¡Ahorra {pkg.discountPercentage}%!
                      </p>
                    )}

                    <button
                      onClick={() => handleAddToCart(pkg)}
                      className="w-full bg-black text-white py-3 font-oswald font-bold text-base rounded-lg hover:bg-gray-800 transition"
                    >
                      COMPRAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premios Carousel */}
        {prizes.length > 0 && (
          <section className="bg-white py-12 px-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-8">
                HERRAMIENTAS A SORTEAR
              </h2>

              <div ref={galleryRef} className="relative">
                <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={prizes[currentSlide]?.imageUrl}
                    alt={prizes[currentSlide]?.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Premio Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="font-oswald text-2xl md:text-3xl font-bold text-white mb-2">
                      {prizes[currentSlide]?.name}
                    </h3>
                    <p className="font-raleway text-white/90 mb-2">
                      {prizes[currentSlide]?.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-raleway font-semibold ${
                        prizes[currentSlide]?.unlockStatus === 'unlocked'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-black'
                      }`}>
                        {prizes[currentSlide]?.unlockStatus === 'unlocked' ? '🔓 Desbloqueado' : '🔒 Bloqueado'}
                      </span>
                      <span className="text-white/80 font-raleway text-sm">
                        Se desbloquea al vender {prizes[currentSlide]?.unlockThreshold} boletos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gallery Controls */}
                <button
                  onClick={previousSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition backdrop-blur-sm"
                  aria-label="Premio anterior"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition backdrop-blur-sm"
                  aria-label="Siguiente premio"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Slide Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {prizes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-3 rounded-full transition ${
                        index === currentSlide ? "bg-[#d4af37] w-8" : "bg-gray-300 w-3"
                      }`}
                      aria-label={`Ir al premio ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}


        {/* Limited Quantities Section */}
        <section className="bg-white py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-12">
              ¡PORCENTAJE DE AVANCE!
            </h2>

            <div className="bg-gray-50 rounded-lg p-8 mb-8">
              <div className="mb-6">
                {/* <p className="text-center font-oswald text-xl font-bold text-black mb-4">
                  Números Vendidos: {raffle.ticketsSold.toLocaleString()} / {raffle.totalTickets.toLocaleString()}
                  <span className="text-[#d4af37] ml-2">
                    ({((raffle.ticketsSold / raffle.totalTickets) * 100).toFixed(2)}%)
                  </span>
                </p> */}
                <p className="text-center font-oswald text-xl font-bold text-black mb-4">
                  Progreso del Sorteo
                  <span className="text-[#d4af37] ml-2">
                    {((raffle.ticketsSold / raffle.totalTickets) * 100).toFixed(2)}%
                  </span>
                </p>

                {/* Progress Bar */}
                <div className="relative h-8 bg-gray-300 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-pulse"></div>
                  <div
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d98f] transition-all duration-500 flex items-center relative"
                    style={{ width: `${Math.min((raffle.ticketsSold / raffle.totalTickets) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
                  </div>
                </div>
              </div>

              {/* <div className="grid md:grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 font-raleway mb-1">Total Disponibles</p>
                  <p className="text-2xl font-oswald font-bold text-[#d4af37]">{raffle.totalTickets.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 font-raleway mb-1">Ya Vendidos</p>
                  <p className="text-2xl font-oswald font-bold text-gray-900">{raffle.ticketsSold.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 font-raleway mb-1">Quedan</p>
                  <p className="text-2xl font-oswald font-bold text-green-600">{raffle.ticketsAvailable.toLocaleString()}</p>
                </div>
              </div> */}

              <div className="grid md:grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 font-raleway mb-1">🎯 Oportunidad</p>
                  <p className="text-2xl font-oswald font-bold text-[#d4af37]">Única</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 font-raleway mb-1">⚡ Velocidad</p>
                  <p className="text-2xl font-oswald font-bold text-gray-900">Se asignan rápido</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 font-raleway mb-1">🏆 Premios</p>
                  <p className="text-2xl font-oswald font-bold text-green-600">Increíbles</p>
                </div>
              </div>

              <p className="text-center text-gray-700 font-raleway text-sm md:text-base">
                Los números se asignan automáticamente al confirmar tu compra. Los números ganadores se revelan progresivamente según el avance de ventas.
                Consulta los términos y condiciones para más detalles.
              </p>
            </div>
          </div>
        </section>

        {/* How to Participate */}
        <section id="como-participar" className="bg-white py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-12">
              ¿CÓMO PARTICIPAR?
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  step: 1,
                  title: "Elige un paquete",
                  description: "Más números = Más posibilidades de ganar",
                },
                {
                  step: 2,
                  title: "Realiza el pago",
                  description: "Serás redirigido a nuestra plataforma de pago segura",
                },
                {
                  step: 3,
                  title: "Recibe tus números",
                  description: "Tus números se asignarán y recibirás un email con la confirmación",
                },
              ].map((step) => (
                <div key={step.step} className="text-center animate-fade-in-up" style={{ animationDelay: `${step.step * 0.1}s` }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#d4af37] text-black font-oswald font-bold text-2xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-oswald text-xl font-bold text-black mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 font-raleway">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mb-12">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black text-white px-8 py-3 font-oswald font-bold text-lg rounded-lg hover:bg-gray-800 transition"
              >
                VER VIDEO TUTORIAL DE COMPRA
              </a>
            </div>

            {/* Additional Purchase Form */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-8 max-w-md mx-auto border-2 border-[#d4af37] shadow-xl">
              <h3 className="font-oswald text-3xl font-bold text-black mb-2 text-center">
                Compra Personalizada
              </h3>
              {raffle && (
                <p className="font-raleway text-sm text-gray-600 mb-6 text-center">
                  de: <span className="font-bold text-[#d4af37]">{raffle.title}</span>
                </p>
              )}
              <div className="space-y-6">
                <div>
                  <label className="block font-raleway font-bold text-gray-800 mb-3 text-center text-lg">
                    👆 Selecciona la cantidad de números
                  </label>

                  {/* Selector visual con botones grandes */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={() => setQuantity(Math.max(3, quantity - 1))}
                      className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-2xl transition shadow-lg hover:shadow-xl"
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>

                    <div className="bg-white border-4 border-[#d4af37] rounded-lg px-8 py-4 min-w-[120px]">
                      <input
                        type="number"
                        min="3"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(3, parseInt(e.target.value) || 3))}
                        className="w-full text-center font-oswald text-4xl font-bold text-black bg-transparent outline-none"
                      />
                      <p className="text-center text-xs text-gray-500 font-raleway mt-1">números</p>
                    </div>

                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-2xl transition shadow-lg hover:shadow-xl"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <div className="bg-[#d4af37] bg-opacity-20 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-700 font-raleway mb-1">
                      💡 <strong>Mínimo 3 números</strong> · Cada número = $1 USD
                    </p>
                    <p className="font-oswald text-2xl font-bold text-black">
                      Total: ${(quantity * 1).toFixed(2)} USD
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!raffle) return;

                    addItem({
                      raffleId: raffle.id,
                      raffleTitle: raffle.title,
                      packageId: `custom-${quantity}`,
                      packageName: `${quantity} números (Personalizado)`,
                      price: quantity * 1,
                      ticketCount: quantity,
                    });

                    navigate("/cart");
                  }}
                  className="w-full bg-black text-white py-3 font-oswald font-bold text-lg rounded-lg hover:bg-gray-800 transition"
                >
                  AGREGAR AL CARRITO
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Consult Numbers Section */}
        <section className="bg-gray-100 py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-12">
              CONSULTA TUS NÚMEROS
            </h2>

            <div className="bg-white rounded-lg p-8 max-w-4xl mx-auto shadow-md">
              <p className="text-center text-gray-600 font-raleway mb-6">
                Ingresa tu correo para consultar tus números y ver tus compras aprobadas
              </p>

              {/* Formulario */}
              <div className="space-y-4 max-w-md mx-auto mb-6">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={consultEmail}
                  onChange={(e) => {
                    setConsultEmail(e.target.value);
                    setConsultError("");
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleConsultTickets()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway"
                />
                <button
                  onClick={handleConsultTickets}
                  disabled={consultLoading}
                  className="w-full bg-black text-white py-3 font-oswald font-bold text-lg rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                  {consultLoading ? "CONSULTANDO..." : "CONSULTAR"}
                </button>
              </div>

              {/* Error */}
              {consultError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto mb-4">
                  <p className="text-red-700 font-raleway text-sm text-center">{consultError}</p>
                </div>
              )}

              {/* Resultados */}
              {consultResults && (
                <div className="mt-8">
                  <h3 className="font-oswald text-2xl font-bold text-black text-center mb-6">
                    📧 Resultados para: {consultResults.email}
                  </h3>

                  {consultResults.orders.map((order: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-6 mb-4 border-2 border-[#d4af37]">
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-oswald text-xl font-bold text-black">
                              {order.raffleTitle}
                            </h4>
                            <p className="font-raleway text-sm text-gray-600">
                              Orden: {order.orderNumber} | Cliente: {order.customerName}
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-oswald font-bold">
                            APROBADA
                          </span>
                        </div>
                      </div>

                      <h5 className="font-oswald text-md font-bold text-black mb-3">
                        🎫 TUS NÚMEROS DE LA SUERTE ({order.tickets.length})
                      </h5>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {order.tickets.map((ticket: any) => (
                          <div
                            key={ticket.id}
                            className="relative bg-gradient-to-br from-[#d4af37] to-[#f0d98f] border-2 border-dashed border-black rounded-lg p-2 text-center"
                            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                          >
                            <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-gray-50 rounded-full transform -translate-y-1/2"></div>
                            <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-gray-50 rounded-full transform -translate-y-1/2"></div>

                            <p className="font-raleway text-[7px] font-semibold text-black uppercase">TICKET</p>
                            <p className="font-oswald text-xl font-bold text-black leading-none my-1">
                              {ticket.ticketNumber.toString().padStart(4, "0")}
                            </p>
                            <p className="font-raleway text-[6px] font-semibold text-black">IMPACTO</p>

                            {ticket.isWinner && (
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                ✓
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Winners Showcase Section - Instagram Style - COMMENTED OUT
        <section className="bg-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-oswald text-3xl md:text-4xl font-bold text-black mb-2">
                ¡GANADORES <span className="text-[#d4af37]">ANTERIORES!</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              Instagram Post 1
              <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                Instagram Header
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">@impacto.minga</p>
                    <p className="text-xs text-gray-500">Hace 2 semanas</p>
                  </div>
                  <button className="text-gray-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>

                Instagram Image
                <div className="relative bg-gray-100">
                  <img
                    src="/ganador2.png"
                    alt="Ganador con Caja de Herramientas"
                    className="w-full h-auto object-cover"
                  />
                </div>

                Instagram Actions
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button className="hover:text-gray-500 transition">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                    <button className="hover:text-gray-500 transition">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </button>
                    <button className="hover:text-gray-500 transition ml-auto">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                    </button>
                  </div>

                  Caption
                  <div className="space-y-1">
                    <p className="font-oswald font-bold text-lg text-black">¡Kit Completo!</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">@impacto.minga</span> Gracias @ImpactoMinga! 👍
                    </p>
                  </div>
                </div>
              </div>

              Instagram Post 2
              <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                Instagram Header
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">@impacto.minga</p>
                    <p className="text-xs text-gray-500">Hace 3 semanas</p>
                  </div>
                  <button className="text-gray-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>

                Instagram Image
                <div className="relative bg-gray-100">
                  <img
                    src="/ganador3.png"
                    alt="Ganador con Kit Stanley"
                    className="w-full h-auto object-cover"
                  />
                </div>

                Instagram Actions
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button className="hover:text-gray-500 transition">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                    <button className="hover:text-gray-500 transition">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </button>
                    <button className="hover:text-gray-500 transition ml-auto">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                    </button>
                  </div>

                  Caption
                  <div className="space-y-1">
                    <p className="font-oswald font-bold text-lg text-black">¡Kit Completo Stanley!</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">@impacto.minga</span> Gracias @ImpactoMinga! 👍
                    </p>
                  </div>
                </div>
              </div>

              Instagram Post 3
              <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                Instagram Header
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">@impacto.minga</p>
                    <p className="text-xs text-gray-500">Hace 1 mes</p>
                  </div>
                  <button className="text-gray-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </div>

                Instagram Image
                <div className="relative bg-gray-100">
                  <img
                    src="/ganador4.png"
                    alt="Ganador con Taladro"
                    className="w-full h-auto object-cover"
                  />
                </div>

                Instagram Actions
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button className="hover:text-gray-500 transition">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                    <button className="hover:text-gray-500 transition">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </button>
                    <button className="hover:text-gray-500 transition ml-auto">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                    </button>
                  </div>

                  Caption
                  <div className="space-y-1">
                    <p className="font-oswald font-bold text-lg text-black">¡Nuevo Taladro!</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">@impacto.minga</span> Gracias @ImpactoMinga! 👍
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* New Section - Be The Next Winner */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="font-oswald text-4xl md:text-5xl font-bold text-black mb-4">
                ¡PUEDES SER EL <span className="text-[#d4af37]">PRÓXIMO GANADOR!</span>
              </h2>
              <p className="text-xl text-gray-700 font-raleway mb-8">
                Este es nuestro primer sorteo y estamos emocionados de comenzar a entregar premios increíbles
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="font-oswald text-2xl font-bold text-black mb-3">
                  Primera Actividad
                </h3>
                <p className="text-gray-600 font-raleway">
                  Estrena nuestra primera rifa y ten la oportunidad de ganar herramientas profesionales
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="font-oswald text-2xl font-bold text-black mb-3">
                  Más Oportunidades
                </h3>
                <p className="text-gray-600 font-raleway">
                  Al ser el primer sorteo, tienes mayores probabilidades de convertirte en ganador
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="font-oswald text-2xl font-bold text-black mb-3">
                  Premios Garantizados
                </h3>
                <p className="text-gray-600 font-raleway">
                  Herramientas de calidad profesional que potenciarán tu trabajo
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#d4af37] to-[#f0d98f] rounded-lg p-8 shadow-xl">
              <p className="font-oswald text-2xl md:text-3xl font-bold text-black mb-4">
                ¡No pierdas esta oportunidad única!
              </p>
              <p className="text-lg text-gray-900 font-raleway mb-6">
                Participa ahora y forma parte de nuestra historia desde el principio
              </p>
              <a
                href="#paquetes"
                className="inline-block bg-black text-white px-12 py-4 rounded-lg font-oswald text-xl font-bold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
              >
                PARTICIPAR AHORA
              </a>
            </div>
          </div>
        </section>

        {/* Past Activities Section - Instagram Profile Style - COMMENTED FOR NOW */}
        {/* <section id="actividades" className="bg-gradient-to-b from-gray-50 to-white py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-4">
              ACTIVIDADES ANTERIORES
            </h2>
            <p className="text-center text-gray-600 font-raleway mb-12">
              Más de 38 ganadores felices han recibido sus premios
            </p>

            <div className="grid grid-cols-3 gap-1">
              {[
                {
                  name: "Ford Ranger 4x4",
                  activity: "#38",
                  winner: "Juan P.",
                  date: "Dic 2024",
                  image: "https://images.unsplash.com/photo-1494976866556-6812c080a650?w=500&h=500&fit=crop"
                },
                {
                  name: "Chevrolet Tracker",
                  activity: "#37",
                  winner: "María G.",
                  date: "Nov 2024",
                  image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&h=500&fit=crop"
                },
                {
                  name: "Yamaha MT-03",
                  activity: "#36",
                  winner: "Carlos R.",
                  date: "Nov 2024",
                  image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop"
                },
                {
                  name: "iPhone 14 Pro",
                  activity: "#35",
                  winner: "Ana L.",
                  date: "Oct 2024",
                  image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&h=500&fit=crop"
                },
                {
                  name: "Honda Navi",
                  activity: "#34",
                  winner: "Luis M.",
                  date: "Oct 2024",
                  image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=500&h=500&fit=crop"
                },
                {
                  name: "MacBook Pro M2",
                  activity: "#33",
                  winner: "Sofia T.",
                  date: "Sep 2024",
                  image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"
                },
                {
                  name: "Suzuki Swift",
                  activity: "#32",
                  winner: "Pedro V.",
                  date: "Sep 2024",
                  image: "https://images.unsplash.com/photo-1552592212-5b3e338d9efb?w=500&h=500&fit=crop"
                },
                {
                  name: "PlayStation 5",
                  activity: "#31",
                  winner: "Diego S.",
                  date: "Ago 2024",
                  image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop"
                },
                {
                  name: "Chevrolet ONIX RS",
                  activity: "#30",
                  winner: "Laura F.",
                  date: "Ago 2024",
                  image: "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=500&h=500&fit=crop"
                },
                {
                  name: "Smart TV 75\"",
                  activity: "#29",
                  winner: "Miguel A.",
                  date: "Jul 2024",
                  image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop"
                },
                {
                  name: "iPad Pro",
                  activity: "#28",
                  winner: "Carmen D.",
                  date: "Jul 2024",
                  image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop"
                },
                {
                  name: "Airpods Pro",
                  activity: "#27",
                  winner: "Roberto H.",
                  date: "Jun 2024",
                  image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500&h=500&fit=crop"
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative aspect-square group cursor-pointer overflow-hidden bg-gray-200 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-center px-4">
                      <p className="font-oswald text-white font-bold text-sm md:text-base mb-1">
                        {item.name}
                      </p>
                      <p className="font-raleway text-[#d4af37] text-xs md:text-sm font-semibold mb-2">
                        Actividad {item.activity}
                      </p>
                      <div className="space-y-1">
                        <p className="font-raleway text-white text-xs">
                          Ganador: {item.winner}
                        </p>
                        <p className="font-raleway text-gray-300 text-xs">
                          {item.date}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-2 text-green-400">
                          <Check size={14} />
                          <span className="font-raleway text-xs font-semibold">Entregado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button className="bg-gradient-to-r from-[#d4af37] to-[#f0d98f] text-black px-8 py-4 rounded-lg font-oswald font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                VER TODOS LOS GANADORES
              </button>
            </div>
          </div>
        </section> */}
      </main>

      <Footer />
    </div>
  );
}
