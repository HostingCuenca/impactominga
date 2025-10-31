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
  const [quantity, setQuantity] = useState(1);
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
        {/* Hero Section */}
        <section id="juega" className="bg-white py-16 px-4 animate-slide-in-down">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="font-oswald text-3xl md:text-5xl font-bold text-black mb-4">
              JUEGA
            </h1>
            <h2 className="font-oswald text-xl md:text-3xl font-bold text-gray-800 mb-6">
              {raffle.title}
            </h2>
            <h3 className="font-oswald text-lg md:text-2xl font-bold text-[#d4af37] mb-8">
              ACTIVIDAD #{raffle.activityNumber}
            </h3>
            {raffle.description && (
              <p className="font-raleway text-gray-700 max-w-3xl mx-auto">
                {raffle.description}
              </p>
            )}
          </div>
        </section>

        {/* Banner Image */}
        <section className="bg-white py-12 px-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="max-w-6xl mx-auto">
            <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg bg-gray-200 shadow-xl">
              <img
                src={raffle.bannerUrl}
                alt={raffle.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Blessed Numbers Section */}
        {raffle && (
          <BlessedNumbers raffleId={raffle.id} />
        )}

        {/* Premios Carousel */}
        {prizes.length > 0 && (
          <section className="bg-white py-12 px-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-8">
                PREMIOS PROGRESIVOS
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
              ¡CANTIDADES LIMITADAS!
            </h2>

            <div className="bg-gray-50 rounded-lg p-8 mb-8">
              <div className="mb-6">
                <p className="text-center font-oswald text-xl font-bold text-black mb-4">
                  Números Vendidos: {raffle.ticketsSold.toLocaleString()} / {raffle.totalTickets.toLocaleString()}
                  <span className="text-[#d4af37] ml-2">
                    ({((raffle.ticketsSold / raffle.totalTickets) * 100).toFixed(2)}%)
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

              <div className="grid md:grid-cols-3 gap-4 text-center mb-6">
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
              </div>

              <p className="text-center text-gray-700 font-raleway text-sm md:text-base">
                Los números se asignan automáticamente al confirmar tu compra. Los números ganadores se revelan progresivamente según el avance de ventas.
                Consulta los términos y condiciones para más detalles.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-gray-100 py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-12">
              SELECCIONA TU PAQUETE
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg, index) => (
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
                    <div className="bg-[#d4af37] text-black text-center py-2 font-oswald font-bold">
                      ★ MÁS POPULAR ★
                    </div>
                  )}

                  <div className={`p-8 ${pkg.isMostPopular ? "bg-white" : ""}`}>
                    <h3 className="font-oswald text-3xl font-bold text-center text-black mb-4">
                      x{pkg.quantity}
                    </h3>
                    <p className="font-oswald text-3xl font-bold text-center text-[#d4af37] mb-2">
                      ${pkg.price.toFixed(2)}
                    </p>
                    {pkg.discountPercentage > 0 && (
                      <p className="text-center text-sm text-gray-500 font-raleway mb-4">
                        ¡Ahorra {pkg.discountPercentage}%!
                      </p>
                    )}

                    <button
                      onClick={() => handleAddToCart(pkg)}
                      className="w-full bg-black text-white py-3 font-oswald font-bold text-lg rounded-lg hover:bg-gray-800 transition"
                    >
                      COMPRAR
                    </button>
                  </div>
                </div>
              ))}
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
            <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="font-oswald text-2xl font-bold text-black mb-6 text-center">
                Compra adicional
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-raleway font-semibold text-gray-700 mb-2">
                    Cantidad de números:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway"
                  />
                </div>
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full bg-black text-white py-3 font-oswald font-bold text-lg rounded-lg hover:bg-gray-800 transition"
                >
                  COMPRAR
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

            <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-md">
              <p className="text-center text-gray-600 font-raleway mb-6">
                Ingresa tu correo para consultar tus números y ver tus compras
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={consultEmail}
                  onChange={(e) => setConsultEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway"
                />
                <button
                  onClick={() => {
                    if (consultEmail) {
                      alert(`Consulta enviada a: ${consultEmail}`);
                    }
                  }}
                  className="w-full bg-black text-white py-3 font-oswald font-bold text-lg rounded-lg hover:bg-gray-800 transition"
                >
                  CONSULTAR
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Past Activities Section - Instagram Grid Style */}
        <section id="actividades" className="bg-gradient-to-b from-gray-50 to-white py-16 px-4 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="font-oswald text-3xl md:text-4xl font-bold text-center text-black mb-4">
              ACTIVIDADES ANTERIORES
            </h2>
            <p className="text-center text-gray-600 font-raleway mb-12">
              Más de 38 ganadores felices han recibido sus premios
            </p>

            {/* Instagram-style Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {[
                {
                  name: "Ford Ranger 4x4",
                  activity: "#38",
                  image: "https://images.unsplash.com/photo-1494976866556-6812c080a650?w=500&h=500&fit=crop"
                },
                {
                  name: "Chevrolet Tracker",
                  activity: "#37",
                  image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&h=500&fit=crop"
                },
                {
                  name: "Yamaha MT-03",
                  activity: "#36",
                  image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop"
                },
                {
                  name: "iPhone 14 Pro",
                  activity: "#35",
                  image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&h=500&fit=crop"
                },
                {
                  name: "Honda Navi",
                  activity: "#34",
                  image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=500&h=500&fit=crop"
                },
                {
                  name: "MacBook Pro M2",
                  activity: "#33",
                  image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"
                },
                {
                  name: "Suzuki Swift",
                  activity: "#32",
                  image: "https://images.unsplash.com/photo-1552592212-5b3e338d9efb?w=500&h=500&fit=crop"
                },
                {
                  name: "PlayStation 5",
                  activity: "#31",
                  image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop"
                },
                {
                  name: "Chevrolet ONIX RS",
                  activity: "#30",
                  image: "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=500&h=500&fit=crop"
                },
                {
                  name: "Smart TV 75\"",
                  activity: "#29",
                  image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop"
                },
                {
                  name: "iPad Pro",
                  activity: "#28",
                  image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop"
                },
                {
                  name: "Airpods Pro",
                  activity: "#27",
                  image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500&h=500&fit=crop"
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Image */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="font-oswald text-sm md:text-base font-bold text-white mb-1">
                        {item.name}
                      </p>
                      <p className="text-[#d4af37] font-raleway text-xs md:text-sm font-semibold">
                        Actividad {item.activity}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-green-400">
                        <Check size={16} />
                        <span className="font-raleway text-xs font-semibold">Entregado</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge con número de actividad */}
                  <div className="absolute top-2 right-2 bg-[#d4af37] text-black px-2 py-1 rounded-full text-xs font-oswald font-bold shadow-lg">
                    {item.activity}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="text-center mt-12">
              <button className="bg-gradient-to-r from-[#d4af37] to-[#f0d98f] text-black px-8 py-4 rounded-lg font-oswald font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                VER TODOS LOS GANADORES
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
