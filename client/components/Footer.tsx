import { Instagram, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Footer Top */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-oswald font-bold text-xl mb-6 text-[#d4af37]">Impacto Minga</h3>
            <p className="text-gray-300 font-raleway text-sm leading-relaxed mb-4">
              Premios que cambian tu manera de trabajar. Herramientas profesionales al alcance de todos por solo $1 USD.
            </p>
            <p className="text-gray-400 font-raleway text-xs">
              Organizador: Minga Aurum EC
            </p>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-oswald font-bold text-xl mb-6">Síguenos</h3>
            <div className="space-y-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-[#d4af37] transition"
              >
                <Instagram size={20} />
                <span>Adrián Flores</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-[#d4af37] transition"
              >
                <Instagram size={20} />
                <span>Alex Flores</span>
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-oswald font-bold text-xl mb-6">Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail size={20} />
                <a href="mailto:info@impactominga.com" className="hover:text-[#d4af37] transition">
                  info@impactominga.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone size={20} />
                <span>099-999-9999</span>
              </div>
              <Link
                to="/terms"
                className="flex items-center gap-2 text-gray-300 hover:text-[#d4af37] transition mt-4"
              >
                <span>📜</span>
                <span>Términos y Condiciones</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Partner Info */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400 mb-4 font-raleway">Con el respaldo de</p>
          <p className="font-oswald font-bold text-lg text-[#d4af37]">BRAAPPMOTOS</p>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="bg-gray-950 text-center py-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm font-raleway">
          Developed with <span className="text-red-500">♥</span> by <span className="text-[#d4af37] font-semibold">Torisoftt</span> - Impacto Minga © 2024
        </p>
      </div>
    </footer>
  );
}
