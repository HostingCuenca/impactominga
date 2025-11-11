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
                href="https://instagram.com/impacto.minga"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-[#d4af37] transition"
              >
                <Instagram size={20} />
                <span>@impacto.minga</span>
              </a>
              <a
                href="https://facebook.com/impactominga"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-[#d4af37] transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Impacto Minga</span>
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
                className="flex items-center gap-3 text-gray-300 hover:text-[#d4af37] transition mt-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Términos y Condiciones</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Partner Info */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400 mb-4 font-raleway">Una iniciativa de</p>
          <p className="font-oswald font-bold text-lg text-[#d4af37]">IMPACTO MINGA</p>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="bg-gray-950 text-center py-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm font-raleway">
          Developed with <span className="text-red-500">♥</span> by{' '}
          <a
            href="https://torisoftt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4af37] font-semibold hover:text-[#f0d98f] transition"
          >
            Torisoftt
          </a>
          {' '}- Impacto Minga © 2024
        </p>
      </div>
    </footer>
  );
}
