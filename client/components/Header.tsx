import { useState } from "react";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const handleNavClick = (sectionId: string) => {
    setIsMenuOpen(false);
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const getNavLink = (sectionId: string) => {
    if (location.pathname === "/") {
      return `#${sectionId}`;
    }
    return `/#${sectionId}`;
  };

  return (
    <>
      {/* Top Banner */}
      <div className="fixed top-0 left-0 right-0 bg-[#d4af37] text-black text-center py-2 font-oswald font-bold text-sm md:text-base z-50 shadow-lg">
        NUEVA ACTIVIDAD #001
      </div>

      {/* Header Navigation */}
      <header className="fixed top-10 left-0 right-0 bg-black border-b border-gray-800 shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition">
            <img
              src="/logo.png"
              alt="Impacto Minga"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 items-center">
            <a
              href={getNavLink("juega")}
              onClick={() => handleNavClick("juega")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Juega
            </a>
            <a
              href={getNavLink("como-participar")}
              onClick={() => handleNavClick("como-participar")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Cómo Participar
            </a>
            <a
              href={getNavLink("actividades")}
              onClick={() => handleNavClick("actividades")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Actividades
            </a>
            <a
              href={getNavLink("contacto")}
              onClick={() => handleNavClick("contacto")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Contacto
            </a>
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-white font-raleway font-semibold hover:text-[#d4af37] transition"
                  >
                    <User size={20} />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/my-account"
                    className="flex items-center gap-2 text-white font-raleway font-semibold hover:text-[#d4af37] transition"
                  >
                    <User size={20} />
                    Mi Cuenta
                  </Link>
                )}
                <Link
                  to="/cart"
                  className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-2 rounded-lg font-raleway font-semibold hover:bg-[#b8941f] transition"
                  aria-label="Shopping cart"
                >
                  <ShoppingCart size={20} />
                  <span className="hidden sm:inline">Carrito</span>
                </Link>
              </>
            ) : (
              <>
                {/* Mobile Menu Button
                <Link
                  to="/login"
                  className="text-white font-raleway font-semibold hover:text-[#d4af37] transition"
                >
                  Iniciar Sesión
                </Link>*/}
                <Link
                  to="/cart"
                  className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-2 rounded-lg font-raleway font-semibold hover:bg-[#b8941f] transition"
                  aria-label="Shopping cart"
                >
                  <ShoppingCart size={20} />
                  <span className="hidden sm:inline">Carrito</span>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {isAuthenticated && (
              <Link to={isAdmin ? "/dashboard" : "/my-account"} className="text-[#d4af37] hover:text-white transition">
                <User size={24} />
              </Link>
            )}
            <Link to="/cart" className="text-[#d4af37] hover:text-white transition">
              <ShoppingCart size={24} />
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden bg-black border-t border-gray-800 py-4 px-4 flex flex-col gap-4">
            <a
              href={getNavLink("juega")}
              onClick={() => handleNavClick("juega")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Juega
            </a>
            <a
              href={getNavLink("como-participar")}
              onClick={() => handleNavClick("como-participar")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Cómo Participar
            </a>
            <a
              href={getNavLink("actividades")}
              onClick={() => handleNavClick("actividades")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Actividades
            </a>
            <a
              href={getNavLink("contacto")}
              onClick={() => handleNavClick("contacto")}
              className="text-white font-raleway font-semibold hover:text-[#d4af37] transition cursor-pointer"
            >
              Contacto
            </a>
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="text-white font-raleway font-semibold hover:text-[#d4af37] transition"
              >
                Iniciar Sesión
              </Link>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
