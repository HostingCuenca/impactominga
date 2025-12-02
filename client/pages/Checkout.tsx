import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, User, Phone, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login } = useAuth();

  // Get raffle and package from URL params
  const raffleId = searchParams.get("raffleId");
  const packageId = searchParams.get("packageId");

  const [raffle, setRaffle] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // HARDCODED PASSWORD: Para facilitar el registro, todos los usuarios tendrán la misma contraseña
  // Descomentar las siguientes líneas para reactivar el input manual de contraseña
  // const [modalPassword, setModalPassword] = useState("");
  // const [modalPasswordConfirm, setModalPasswordConfirm] = useState("");
  const [modalPassword] = useState("impactopassword");
  const [modalPasswordConfirm] = useState("impactopassword");
  const [loginPassword, setLoginPassword] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: "",
    idType: "cedula",
    idNumber: "",
    shippingAddress: "",
    shippingCity: "",
    shippingProvince: "",
    paymentMethod: "bank_transfer",
    customerNotes: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Load raffle and package data
  useEffect(() => {
    if (!raffleId || !packageId) {
      setError("Datos incompletos. Por favor selecciona un sorteo y paquete.");
      return;
    }

    async function loadData() {
      try {
        // Load raffle
        const raffleRes = await fetch(`/api/raffles/${raffleId}`);
        const raffleData = await raffleRes.json();
        if (raffleData.success) {
          setRaffle(raffleData.data);
        }

        // Check if it's a custom package (custom-X)
        if (packageId && packageId.startsWith('custom-')) {
          // Custom package - create virtual package object
          const customQuantity = parseInt(packageId.replace('custom-', ''));
          if (!isNaN(customQuantity) && customQuantity >= 3) {
            setSelectedPackage({
              id: packageId,
              quantity: customQuantity,
              price: customQuantity * 1.0, // $1 USD per ticket
              isMostPopular: false,
              discountPercentage: 0,
            });
          } else {
            setError("Cantidad personalizada inválida (mínimo 3 números)");
          }
        } else {
          // Load packages from API
          const packagesRes = await fetch(`/api/raffles/${raffleId}/packages`);
          const packagesData = await packagesRes.json();
          if (packagesData.success) {
            const pkg = packagesData.data.find((p: any) => p.id === packageId);
            setSelectedPackage(pkg);
          }
        }
      } catch (err) {
        setError("Error al cargar datos del sorteo");
      }
    }

    loadData();
  }, [raffleId, packageId]);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      }));
    }
  }, [user]);

  // Validación de cédula ecuatoriana con algoritmo módulo 10
  const validateEcuadorianCedula = (cedula: string): boolean => {
    // Debe tener 10 dígitos
    if (cedula.length !== 10) return false;

    // Los dos primeros dígitos deben estar entre 01 y 24 (provincias)
    const provincia = parseInt(cedula.substring(0, 2));
    if (provincia < 1 || provincia > 24) return false;

    // El tercer dígito debe ser menor a 6 (personas naturales)
    const tercerDigito = parseInt(cedula.charAt(2));
    if (tercerDigito > 5) return false;

    // Algoritmo módulo 10 para validar dígito verificador
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitoVerificador = parseInt(cedula.charAt(9));
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const resultado = suma % 10;
    const verificador = resultado === 0 ? 0 : 10 - resultado;

    return verificador === digitoVerificador;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Restricciones por campo
    let newValue = value;

    // Solo números para teléfono, cédula y RUC (pasaporte permite alfanumérico)
    if (name === 'phone' || (name === 'idNumber' && (formData.idType === 'cedula' || formData.idType === 'ruc'))) {
      newValue = value.replace(/[^0-9]/g, '');
    }

    // Solo letras y espacios para nombres y apellidos (sin números ni caracteres especiales)
    if (name === 'firstName' || name === 'lastName') {
      newValue = value.replace(/[0-9]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar que se aceptaron los términos y condiciones
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones para continuar con la compra.");
      return;
    }

    // Validar cédula ecuatoriana si el tipo de ID es cédula Y tiene 10 dígitos
    if (formData.idType === 'cedula' && formData.idNumber.length === 10) {
      if (!validateEcuadorianCedula(formData.idNumber)) {
        setError("La cédula ingresada no es válida. Por favor verifica el número.");
        return;
      }
    }

    // Validar longitud de cédula si es el tipo seleccionado
    if (formData.idType === 'cedula' && formData.idNumber.length !== 10) {
      setError("La cédula debe tener exactamente 10 dígitos.");
      return;
    }

    // Validar que el teléfono tenga al menos 7 dígitos
    if (formData.phone.length < 7) {
      setError("El teléfono debe tener al menos 7 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const checkoutData = {
        raffleId,
        packageId,
        ...formData,
      };

      const headers: any = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (data.success) {
        // Order created successfully (user was authenticated OR auto-created)
        navigate(`/order-confirmation?orderId=${data.data.orderId}`);
      } else if (data.requirePassword) {
        // New user - auto-create with hardcoded password (no modal)
        setLoading(true); // Mantener loading mientras se crea
        await handleCreateWithPasswordSilently();
        return; // No ejecutar setLoading(false) del finally
      } else if (data.requireLogin) {
        // Este caso ya no debería ocurrir porque el backend lo maneja automáticamente
        // Pero lo dejamos por seguridad
        setError("Ya tienes una cuenta. Por favor contáctanos si tienes problemas.");
      } else {
        setError(data.message || "Error al procesar checkout");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWithPasswordSilently = async () => {
    // Crear usuario automáticamente con contraseña hardcodeada (sin modal)
    try {
      const response = await fetch("/api/checkout/with-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId,
          packageId,
          ...formData,
          password: "impactopassword", // Contraseña hardcodeada
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-login
        login(data.data.token, data.data.user);
        navigate(`/order-confirmation?orderId=${data.data.order.orderId}`);
      } else {
        setError(data.message || "Error al crear cuenta");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error al crear cuenta automáticamente:", err);
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  const handleCreateWithPassword = async () => {
    // VALIDACIONES DESHABILITADAS - La contraseña está hardcodeada
    // Descomentar para reactivar validación manual:
    // if (modalPassword.length < 6) {
    //   setError("La contraseña debe tener al menos 6 caracteres");
    //   return;
    // }
    // if (modalPassword !== modalPasswordConfirm) {
    //   setError("Las contraseñas no coinciden");
    //   return;
    // }

    setLoading(true);
    setError("");

    try {
      console.log("Enviando checkout con contraseña:", modalPassword); // Debug

      const response = await fetch("/api/checkout/with-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId,
          packageId,
          ...formData,
          password: modalPassword, // "impactopassword" - 15 caracteres
        }),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data); // Debug

      if (data.success) {
        // Auto-login
        login(data.data.token, data.data.user);
        navigate(`/order-confirmation?orderId=${data.data.order.orderId}`);
      } else {
        setError(data.message || "Error al crear cuenta");
      }
    } catch (err) {
      console.error("Error en handleCreateWithPassword:", err); // Debug
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAndCheckout = async () => {
    if (!loginPassword) {
      setError("Ingresa tu contraseña");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout/with-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId,
          packageId,
          ...formData,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-login
        login(data.data.token, data.data.user);
        navigate(`/order-confirmation?orderId=${data.data.order.orderId}`);
      } else {
        setError(data.message || "Contraseña incorrecta");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!raffleId || !packageId) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="font-oswald text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-600 font-raleway mb-6">
              No se seleccionó un sorteo o paquete válido.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-black text-white px-6 py-3 rounded-lg font-oswald font-bold hover:bg-gray-800 transition"
            >
              VOLVER AL INICIO
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const subtotal = selectedPackage?.price || 0;
  const tax = 0; // IVA 0% - No aplica para tickets de rifa
  const total = subtotal; // Sin IVA

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="pt-24">
        {/* Header */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-oswald text-4xl md:text-5xl font-bold text-black">
              CHECKOUT
            </h1>
            <p className="text-gray-600 font-raleway mt-2">
              Completa tu compra de manera segura
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="bg-gray-100 py-16 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-raleway text-sm">
                    {error}
                  </div>
                )}

                {/* Personal Info */}
                <div className="bg-white rounded-lg p-8">
                  <h2 className="font-oswald text-2xl font-bold text-black mb-4">
                    INFORMACIÓN PERSONAL
                  </h2>

                  {/* Nota sobre información verdadera */}
                  <div className="bg-amber-50 border-amber-500 p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                      <div>
                        <p className="font-raleway text-sm text-amber-900 font-semibold mb-1">
                          Información Importante
                        </p>
                        <p className="font-raleway text-sm text-amber-800">
                          Todos los datos proporcionados deben ser <strong>verídicos y exactos</strong>. Esta información será utilizada para la identificación del ganador y la entrega del premio en caso de resultar favorecido.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Nombres *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Apellidos *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Tipo de ID *
                      </label>
                      <select
                        name="idType"
                        value={formData.idType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                      >
                        <option value="cedula">Cédula</option>
                        <option value="ruc">RUC</option>
                        <option value="pasaporte">Pasaporte</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Número de ID *
                      </label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        required
                        maxLength={
                          formData.idType === 'cedula' ? 10 :
                          formData.idType === 'ruc' ? 13 :
                          undefined
                        }
                        placeholder={
                          formData.idType === 'cedula' ? '10 dígitos' :
                          formData.idType === 'ruc' ? '13 dígitos' :
                          'Ingresa tu número de pasaporte'
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                      />
                      {formData.idType === 'cedula' && (
                        <p className="text-xs text-gray-500 mt-1 font-raleway">
                          ✓ La cédula será validada
                        </p>
                      )}
                      {formData.idType === 'ruc' && (
                        <p className="text-xs text-gray-500 mt-1 font-raleway">
                          ✓ Ingresa tu RUC de 13 dígitos
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-lg p-8">
                  <h2 className="font-oswald text-2xl font-bold text-black mb-6">
                    DIRECCIÓN
                  </h2>

                  <div className="mb-4">
                    <label className="block font-raleway font-semibold text-gray-700 mb-2">
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        name="shippingCity"
                        value={formData.shippingCity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block font-raleway font-semibold text-gray-700 mb-2">
                        Provincia
                      </label>
                      <input
                        type="text"
                        name="shippingProvince"
                        value={formData.shippingProvince}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg p-8">
                  <h2 className="font-oswald text-2xl font-bold text-black mb-6">
                    MÉTODO DE PAGO
                  </h2>

                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                    >
                      <option value="bank_transfer">Transferencia Bancaria</option>
                      <option value="cash">Efectivo</option>
                    </select>
                  </div>

                  {/* Bank Transfer Info */}
                  {/* {formData.paymentMethod === 'bank_transfer' && (
                    <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                      <h3 className="font-oswald text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                        </svg>
                        DATOS PARA LA TRANSFERENCIA
                      </h3>
                      <div className="space-y-3 font-raleway text-sm">
                        <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                          <span className="font-semibold text-blue-900">Banco:</span>
                          <span className="text-blue-800 font-bold">BANCO PICHINCHA</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                          <span className="font-semibold text-blue-900">Tipo de Cuenta:</span>
                          <span className="text-blue-800">CUENTA AHORRO</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                          <span className="font-semibold text-blue-900"># de Cuenta:</span>
                          <span className="text-blue-800 font-mono font-bold text-lg">2213830211</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                          <span className="font-semibold text-blue-900">Titular:</span>
                          <span className="text-blue-800">MINGA TIPANLUIZA RICHARD DUFFER</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-blue-900">C.I:</span>
                          <span className="text-blue-800 font-mono">1501260440</span>
                        </div>
                      </div>
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs text-yellow-800 font-raleway mb-2">
                          <strong>Importante:</strong> Después de realizar la transferencia, envía el comprobante por WhatsApp al <strong>+593 98 021 2915</strong> para corroborar la información y mayor seguridad.
                        </p>
                        <p className="text-xs text-yellow-700 font-raleway">
                           <strong>Nota:</strong> Los tickets de rifa NO gravan IVA (IVA 0%). Los valores mostrados son finales.
                        </p>
                      </div>
                    </div>
                  )} */}


                  {/* <div className="mt-4">
                     Bank Transfer Info
                    <label className="block font-raleway font-semibold text-gray-700 mb-2">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      name="customerNotes"
                      value={formData.customerNotes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Ej: Ya realicé la transferencia, comprobante enviado por WhatsApp"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                    />
                  </div>*/}

                </div>

                {/* WhatsApp CTA */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <p className="font-raleway text-sm text-gray-700 mb-3">
                      <strong className="text-green-800">¿Tienes preguntas o ya realizaste tu pago?</strong>
                    </p>
                    <p className="font-raleway text-xs text-gray-600 mb-4">
                      Envíanos tu comprobante de pago por WhatsApp para confirmación inmediata
                    </p>
                  </div>

                  <a
                    href="https://wa.me/593980212915?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20compra"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full bg-green-600 text-white py-4 px-6 font-oswald font-bold text-lg rounded-lg hover:bg-green-700 transition shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    ESCRÍBENOS POR WHATSAPP
                  </a>

                  <div className="mt-3 text-center">
                    <p className="font-raleway text-xs text-gray-600">
                      📱 <strong>+593 98 021 2915</strong>
                    </p>
                  </div>
                </div>

                {/* Disclaimer - Advertencia */}
                <div className="bg-red-50 border-red-500 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={24} />
                    <div>
                      <h3 className="font-oswald text-lg font-bold text-red-900 mb-2">
                        ADVERTENCIA IMPORTANTE
                      </h3>
                      <p className="font-raleway text-sm text-red-800 mb-2">
                        Al continuar con esta compra, confirmas que:
                      </p>
                      <ul className="font-raleway text-sm text-red-800 space-y-1 ml-4 list-disc">
                        <li>Estás completamente seguro de realizar esta compra</li>
                        <li>Toda la información proporcionada es verídica y exacta</li>
                        <li>Entiendes que esta es una compra de boletos de rifa</li>
                        <li>No habrá devoluciones una vez confirmada la orden</li>
                      </ul>
                      <p className="font-raleway text-sm text-red-900 font-bold mt-3">
                        Si tienes alguna duda, NO continúes y contáctanos primero por WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Términos y Condiciones Checkbox */}
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 text-black border-gray-300 rounded focus:ring-2 focus:ring-[#d4af37] cursor-pointer"
                      required
                    />
                    <span className="font-raleway text-sm text-gray-700">
                      He leído y estoy de acuerdo con los{" "}
                      <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d4af37] font-bold hover:underline"
                      >
                        Términos y Condiciones
                      </a>{" "}
                      de la web. Confirmo que toda la información proporcionada es verídica y acepto las políticas de la empresa. <span className="text-red-600 font-bold">*</span>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !acceptedTerms}
                  className="w-full bg-black text-white py-4 font-oswald font-bold text-lg rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "PROCESANDO..." : "CONTINUAR CON LA COMPRA"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg p-8 sticky top-32">
                <h2 className="font-oswald text-2xl font-bold text-black mb-6">
                  RESUMEN DE COMPRA
                </h2>

                {raffle && selectedPackage && (
                  <>
                    <div className="mb-6">
                      <h3 className="font-raleway font-semibold text-gray-700 mb-2">
                        {raffle.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedPackage.quantity} boletos
                      </p>
                    </div>

                    <div className="space-y-3 border-t border-gray-200 pt-4 mb-4">
                      <div className="flex justify-between">
                        <p className="text-gray-600 font-raleway">Subtotal:</p>
                        <p className="font-oswald font-bold">${subtotal.toFixed(2)}</p>
                      </div>
                      {/* <div className="flex justify-between">
                        <p className="text-gray-600 font-raleway">IVA (12%):</p>
                        <p className="font-oswald font-bold">${tax.toFixed(2)}</p>
                      </div> */}
                      <div className="flex justify-between">
                        <p className="text-gray-600 font-raleway">IVA:</p>
                        <p className="font-oswald font-bold">0%</p>
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-gray-200 pt-4 mb-6">
                      <p className="font-oswald text-lg font-bold">Total:</p>
                      <p className="font-oswald text-2xl font-bold text-[#d4af37]">
                        ${total.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-raleway">
                    ✓ Compra 100% segura
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Password Modal - AUTOMATIC PASSWORD MODE */}
      {/* Los usuarios se crearán automáticamente con la contraseña: "impactopassword" */}
      {/* Para reactivar el modal de contraseña manual, descomentar el código comentado arriba */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="font-oswald text-2xl font-bold text-black mb-2">
                ¡Confirma tu Compra!
              </h2>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="font-raleway text-sm text-gray-700 mb-3">
                <strong className="text-blue-900">📋 Pasos siguientes:</strong>
              </p>
              <ol className="font-raleway text-sm text-gray-700 space-y-2 ml-4 list-decimal">

                <li>Recibirás un correo con los detalles de tu orden</li>
                <li>Realiza la transferencia bancaria</li>
                <li>Envía el comprobante por WhatsApp al <strong className="text-blue-900">+593 98 021 2915</strong></li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="font-raleway text-sm text-yellow-800">
                <strong>📧 Importante:</strong> Recibirás tus credenciales de acceso por correo electrónico para consultar el estado de tu orden.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 font-raleway text-sm">
                {error}
              </div>
            )}

            {/* CAMPOS OCULTOS - Mantener comentados para restaurar funcionalidad manual */}
            {/* <div className="space-y-4">
              <div>
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={modalPasswordConfirm}
                    onChange={(e) => setModalPasswordConfirm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>
            </div> */}

            <div className="flex gap-3">
              <button
                onClick={handleCreateWithPassword}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-4 font-oswald font-bold text-lg rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 shadow-lg"
              >
                {loading ? "PROCESANDO..." : "✓ ACEPTAR Y CREAR ORDEN"}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setError("");
                }}
                className="px-6 bg-gray-300 text-black py-4 font-oswald font-bold rounded-lg hover:bg-gray-400 transition"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="font-oswald text-2xl font-bold text-black mb-4">
              Inicia Sesión
            </h2>
            <p className="text-gray-600 font-raleway mb-6">
              Ya tienes una cuenta registrada con este correo/cédula.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 font-raleway text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-raleway bg-gray-100"
                />
              </div>

              <div>
                <label className="block font-raleway font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                    placeholder="Ingresa tu contraseña"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleLoginAndCheckout}
                  disabled={loading}
                  className="flex-1 bg-black text-white py-3 font-oswald font-bold rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                  {loading ? "INICIANDO..." : "INICIAR SESIÓN Y COMPRAR"}
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setError("");
                  }}
                  className="flex-1 bg-gray-300 text-black py-3 font-oswald font-bold rounded-lg hover:bg-gray-400 transition"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
