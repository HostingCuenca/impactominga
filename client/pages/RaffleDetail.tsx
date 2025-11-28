import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Edit,
  Trash2,
  Plus,
  Package,
  Trophy,
  Info,
  DollarSign,
  Ticket,
  Calendar,
  X,
  Save,
  Star,
  Image as ImageIcon
} from "lucide-react";

interface Raffle {
  id: string;
  title: string;
  description: string;
  status: string;
  activityNumber: number;
  totalTickets: number;
  ticketPrice: number;
  startDate: string;
  endDate: string;
  drawDate: string | null;
  bannerUrl: string | null;
  ticketsSold: number;
  ticketsAvailable: number;
  createdAt: string;
  updatedAt: string;
}

interface PricingPackage {
  id: string;
  raffleId: string;
  quantity: number;
  price: number;
  isMostPopular: boolean;
  isActive: boolean;
  displayOrder: number;
  discountPercentage: number;
  originalPrice: number | null;
  createdAt: string;
}

interface Prize {
  id: string;
  raffleId: string;
  name: string;
  description: string | null;
  cashValue: number | null;
  productName: string | null;
  productDescription: string | null;
  productImageUrl: string | null;
  unlockAtPercentage: number | null;
  unlockAtTicketsSold: number | null;
  status: "locked" | "unlocked" | "claimed";
  displayOrder: number;
  createdAt: string;
}

type TabType = "info" | "packages" | "prizes";

export default function RaffleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [loading, setLoading] = useState(true);
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);

  // Package form
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageForm, setPackageForm] = useState({
    quantity: "",
    price: "",
    isMostPopular: false,
    discountPercentage: "0",
    originalPrice: "",
    displayOrder: "0",
  });

  // Prize form
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [prizeType, setPrizeType] = useState<"cash" | "product">("product");
  const [prizeForm, setPrizeForm] = useState({
    name: "",
    description: "",
    cashValue: "",
    productName: "",
    productDescription: "",
    productImageUrl: "",
    unlockType: "tickets" as "tickets" | "percentage",
    unlockAtTicketsSold: "",
    unlockAtPercentage: "",
    displayOrder: "0",
  });

  useEffect(() => {
    loadRaffleData();
  }, [id]);

  async function loadRaffleData() {
    try {
      setLoading(true);

      // Cargar sorteo
      const raffleRes = await fetch(`/api/raffles/${id}`);
      const raffleData = await raffleRes.json();

      if (raffleData.success) {
        setRaffle(raffleData.data);
      }

      // Cargar paquetes
      const packagesRes = await fetch(`/api/raffles/${id}/packages`);
      const packagesData = await packagesRes.json();

      if (packagesData.success) {
        setPackages(packagesData.data);
      }

      // Cargar premios
      const prizesRes = await fetch(`/api/raffles/${id}/prizes`);
      const prizesData = await prizesRes.json();

      if (prizesData.success) {
        setPrizes(prizesData.data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePackage(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const packageData = {
        quantity: parseInt(packageForm.quantity),
        price: parseFloat(packageForm.price),
        isMostPopular: packageForm.isMostPopular,
        discountPercentage: parseFloat(packageForm.discountPercentage) || 0,
        originalPrice: packageForm.originalPrice ? parseFloat(packageForm.originalPrice) : null,
        displayOrder: parseInt(packageForm.displayOrder) || 0,
      };

      let response;
      if (editingPackageId) {
        // Editar paquete existente
        response = await fetch(`/api/raffles/${id}/packages/${editingPackageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(packageData),
        });
      } else {
        // Crear nuevo paquete
        response = await fetch(`/api/raffles/${id}/packages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packages: [packageData] }),
        });
      }

      const data = await response.json();

      if (data.success) {
        alert(editingPackageId ? "Paquete actualizado exitosamente" : "Paquete creado exitosamente");
        setShowPackageForm(false);
        setEditingPackageId(null);
        setPackageForm({
          quantity: "",
          price: "",
          isMostPopular: false,
          discountPercentage: "0",
          originalPrice: "",
          displayOrder: "0",
        });
        loadRaffleData();
      } else {
        alert(data.message || "Error al guardar paquete");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar paquete");
    }
  }

  function handleEditPackage(pkg: PricingPackage) {
    setEditingPackageId(pkg.id);
    setPackageForm({
      quantity: pkg.quantity.toString(),
      price: pkg.price.toString(),
      isMostPopular: pkg.isMostPopular,
      discountPercentage: pkg.discountPercentage.toString(),
      originalPrice: pkg.originalPrice?.toString() || "",
      displayOrder: pkg.displayOrder.toString(),
    });
    setShowPackageForm(true);
  }

  async function handleDeletePackage(packageId: string) {
    if (!confirm("¿Estás seguro de eliminar este paquete?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/raffles/${id}/packages/${packageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert("Paquete eliminado exitosamente");
        loadRaffleData();
      } else {
        alert(data.message || "Error al eliminar paquete");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar paquete");
    }
  }

  async function handleCreatePrize(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const prizeData: any = {
        name: prizeForm.name,
        description: prizeForm.description || null,
        displayOrder: parseInt(prizeForm.displayOrder) || 0,
      };

      // Cash value O product name (no ambos)
      if (prizeType === "cash") {
        prizeData.cashValue = parseFloat(prizeForm.cashValue);
        prizeData.productName = null;
      } else {
        prizeData.productName = prizeForm.productName;
        prizeData.productDescription = prizeForm.productDescription || null;
        prizeData.productImageUrl = prizeForm.productImageUrl || null;
        prizeData.cashValue = null;
      }

      // Unlock condition (tickets O percentage)
      if (prizeForm.unlockType === "tickets") {
        prizeData.unlockAtTicketsSold = parseInt(prizeForm.unlockAtTicketsSold);
        prizeData.unlockAtPercentage = null;
      } else {
        prizeData.unlockAtPercentage = parseFloat(prizeForm.unlockAtPercentage);
        prizeData.unlockAtTicketsSold = null;
      }

      let response;
      if (editingPrizeId) {
        // Editar premio existente
        response = await fetch(`/api/raffles/${id}/prizes/${editingPrizeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(prizeData),
        });
      } else {
        // Crear nuevo premio (usa el formato antiguo con prizes array)
        const createData: any = {
          name: prizeForm.name,
          description: prizeForm.description || null,
          displayOrder: parseInt(prizeForm.displayOrder) || 0,
        };

        if (prizeType === "cash") {
          createData.cashValue = parseFloat(prizeForm.cashValue);
        } else {
          createData.productName = prizeForm.productName;
          createData.productDescription = prizeForm.productDescription || null;
          createData.imageUrl = prizeForm.productImageUrl || null;
        }

        if (prizeForm.unlockType === "tickets") {
          createData.unlockThreshold = parseInt(prizeForm.unlockAtTicketsSold);
        } else {
          createData.unlockPercentage = parseFloat(prizeForm.unlockAtPercentage);
        }

        response = await fetch(`/api/raffles/${id}/prizes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prizes: [createData] }),
        });
      }

      const data = await response.json();

      if (data.success) {
        alert(editingPrizeId ? "Premio actualizado exitosamente" : "Premio creado exitosamente");
        setShowPrizeForm(false);
        setEditingPrizeId(null);
        setPrizeForm({
          name: "",
          description: "",
          cashValue: "",
          productName: "",
          productDescription: "",
          productImageUrl: "",
          unlockType: "tickets",
          unlockAtTicketsSold: "",
          unlockAtPercentage: "",
          displayOrder: "0",
        });
        loadRaffleData();
      } else {
        alert(data.message || "Error al guardar premio");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar premio");
    }
  }

  function handleEditPrize(prize: Prize) {
    setEditingPrizeId(prize.id);

    // Determinar tipo de premio
    if (prize.cashValue) {
      setPrizeType("cash");
      setPrizeForm({
        name: prize.name,
        description: prize.description || "",
        cashValue: prize.cashValue.toString(),
        productName: "",
        productDescription: "",
        productImageUrl: "",
        unlockType: prize.unlockAtTicketsSold ? "tickets" : "percentage",
        unlockAtTicketsSold: prize.unlockAtTicketsSold?.toString() || "",
        unlockAtPercentage: prize.unlockAtPercentage?.toString() || "",
        displayOrder: prize.displayOrder.toString(),
      });
    } else {
      setPrizeType("product");
      setPrizeForm({
        name: prize.name,
        description: prize.description || "",
        cashValue: "",
        productName: prize.productName || "",
        productDescription: prize.productDescription || "",
        productImageUrl: prize.productImageUrl || "",
        unlockType: prize.unlockAtTicketsSold ? "tickets" : "percentage",
        unlockAtTicketsSold: prize.unlockAtTicketsSold?.toString() || "",
        unlockAtPercentage: prize.unlockAtPercentage?.toString() || "",
        displayOrder: prize.displayOrder.toString(),
      });
    }

    setShowPrizeForm(true);
  }

  async function handleDeletePrize(prizeId: string) {
    if (!confirm("¿Estás seguro de eliminar este premio?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/raffles/${id}/prizes/${prizeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert("Premio eliminado exitosamente");
        loadRaffleData();
      } else {
        alert(data.message || "Error al eliminar premio");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar premio");
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: "bg-gray-200 text-gray-700",
      active: "bg-green-200 text-green-800",
      completed: "bg-blue-200 text-blue-800",
      cancelled: "bg-red-200 text-red-800",
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: "Borrador",
      active: "Activo",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto mb-4"></div>
            <p className="text-gray-600 font-raleway">Cargando sorteo...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!raffle) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 font-raleway text-lg">Sorteo no encontrado</p>
          <Link
            to="/dashboard/raffles"
            className="text-[#d4af37] hover:underline mt-4 inline-block"
          >
            Volver al listado
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const progressPercent = (raffle.ticketsSold / raffle.totalTickets) * 100;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-oswald text-4xl font-bold text-black">
              {raffle.title}
            </h1>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-raleway font-semibold ${getStatusBadge(
                raffle.status
              )}`}
            >
              {getStatusText(raffle.status)}
            </span>
          </div>
          <p className="text-gray-600 font-raleway">
            Actividad #{raffle.activityNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(user?.role === "super_admin" || user?.role === "admin") && (
            <Link
              to={`/dashboard/raffles/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-raleway font-semibold rounded-lg transition"
            >
              <Edit size={18} />
              Editar
            </Link>
          )}
          <Link
            to="/dashboard/raffles"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-raleway transition"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Ticket className="text-purple-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Vendidos</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-purple-600">
            {raffle.ticketsSold.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            de {raffle.totalTickets.toLocaleString()}
          </p>
        </div> */}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Precio</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-green-600">
            ${raffle.ticketPrice.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">por boleto</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Paquetes</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-blue-600">
            {packages.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Trophy className="text-yellow-600" size={20} />
            </div>
            <h3 className="font-raleway font-semibold text-gray-700">Premios</h3>
          </div>
          <p className="text-3xl font-oswald font-bold text-yellow-600">
            {prizes.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-raleway font-semibold text-gray-700">Progreso de Ventas</h3>
          <span className="text-2xl font-oswald font-bold text-[#d4af37]">
            {progressPercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className="bg-[#d4af37] h-4 rounded-full transition-all"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          ></div>
        </div>
        {/* <p className="text-sm text-gray-500 text-center">
          {raffle.ticketsSold.toLocaleString()} / {raffle.totalTickets.toLocaleString()} boletos
        </p> */}
        <p className="text-sm text-gray-500 text-center">
          ¡Cada boleto te acerca más a ganar increíbles premios!
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-2 px-6 py-4 font-raleway font-semibold transition ${
                activeTab === "info"
                  ? "border-b-2 border-[#d4af37] text-[#d4af37] bg-amber-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Info size={20} />
              Información
            </button>

            <button
              onClick={() => setActiveTab("packages")}
              className={`flex items-center gap-2 px-6 py-4 font-raleway font-semibold transition ${
                activeTab === "packages"
                  ? "border-b-2 border-[#d4af37] text-[#d4af37] bg-amber-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Package size={20} />
              Paquetes ({packages.length})
            </button>

            <button
              onClick={() => setActiveTab("prizes")}
              className={`flex items-center gap-2 px-6 py-4 font-raleway font-semibold transition ${
                activeTab === "prizes"
                  ? "border-b-2 border-[#d4af37] text-[#d4af37] bg-amber-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Trophy size={20} />
              Premios ({prizes.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="space-y-6">
              {raffle.bannerUrl && (
                <div>
                  <h3 className="font-raleway font-semibold text-gray-700 mb-3">Banner</h3>
                  <img
                    src={raffle.bannerUrl}
                    alt={raffle.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div>
                <h3 className="font-raleway font-semibold text-gray-700 mb-2">Descripción</h3>
                <p className="text-gray-600 font-raleway">{raffle.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-raleway font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={18} />
                    Fecha de Inicio
                  </h3>
                  <p className="text-gray-600 font-raleway">
                    {new Date(raffle.startDate).toLocaleString("es-EC")}
                  </p>
                </div>

                <div>
                  <h3 className="font-raleway font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={18} />
                    Fecha de Fin
                  </h3>
                  <p className="text-gray-600 font-raleway">
                    {new Date(raffle.endDate).toLocaleString("es-EC")}
                  </p>
                </div>

                {raffle.drawDate && (
                  <div>
                    <h3 className="font-raleway font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={18} />
                      Fecha del Sorteo
                    </h3>
                    <p className="text-gray-600 font-raleway">
                      {new Date(raffle.drawDate).toLocaleString("es-EC")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PACKAGES TAB */}
          {activeTab === "packages" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Paquetes de Precios
                </h3>
                {(user?.role === "super_admin" || user?.role === "admin") && (
                  <button
                    onClick={() => setShowPackageForm(!showPackageForm)}
                    className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c4a037] text-black font-raleway font-semibold px-4 py-2 rounded-lg transition"
                  >
                    {showPackageForm ? <X size={18} /> : <Plus size={18} />}
                    {showPackageForm ? "Cancelar" : "Agregar Paquete"}
                  </button>
                )}
              </div>

              {/* Package Form */}
              {showPackageForm && (
                <form onSubmit={handleCreatePackage} className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-raleway font-semibold text-gray-900 mb-4">
                    Nuevo Paquete
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Cantidad de Boletos <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={packageForm.quantity}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, quantity: e.target.value })
                        }
                        required
                        min="1"
                        placeholder="Ej: 5"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Precio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={packageForm.price}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, price: e.target.value })
                        }
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="Ej: 4.50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        value={packageForm.discountPercentage}
                        onChange={(e) =>
                          setPackageForm({
                            ...packageForm,
                            discountPercentage: e.target.value,
                          })
                        }
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Precio Original (opcional)
                      </label>
                      <input
                        type="number"
                        value={packageForm.originalPrice}
                        onChange={(e) =>
                          setPackageForm({ ...packageForm, originalPrice: e.target.value })
                        }
                        min="0.01"
                        step="0.01"
                        placeholder="Ej: 5.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="isMostPopular"
                      checked={packageForm.isMostPopular}
                      onChange={(e) =>
                        setPackageForm({ ...packageForm, isMostPopular: e.target.checked })
                      }
                      className="w-5 h-5 text-[#d4af37] border-gray-300 rounded focus:ring-[#d4af37]"
                    />
                    <label
                      htmlFor="isMostPopular"
                      className="text-sm font-raleway font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <Star size={16} />
                      Marcar como "MÁS POPULAR"
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPackageForm(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-raleway rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c4a037] text-black font-raleway font-semibold px-6 py-2 rounded-lg transition"
                    >
                      <Save size={18} />
                      {editingPackageId ? "Actualizar Paquete" : "Guardar Paquete"}
                    </button>
                  </div>
                </form>
              )}

              {/* Packages List */}
              {packages.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Package size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-raleway">
                    No hay paquetes configurados
                  </p>
                  <p className="text-gray-500 font-raleway text-sm mt-2">
                    Agrega paquetes de precios para facilitar la compra
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`border-2 rounded-lg p-6 ${
                          pkg.isMostPopular
                            ? "border-[#d4af37] bg-amber-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {pkg.isMostPopular && (
                          <div className="flex items-center gap-2 text-[#d4af37] font-raleway font-bold text-sm mb-2">
                            <Star size={16} fill="currentColor" />
                            MÁS POPULAR
                          </div>
                        )}

                        <div className="text-center mb-4">
                          <p className="text-4xl font-oswald font-bold text-black">
                            {pkg.quantity}
                          </p>
                          <p className="text-gray-600 font-raleway">boletos</p>
                        </div>

                        <div className="text-center mb-4">
                          <p className="text-3xl font-oswald font-bold text-[#d4af37]">
                            ${pkg.price.toFixed(2)}
                          </p>
                          {pkg.originalPrice && (
                            <p className="text-gray-500 font-raleway line-through text-sm">
                              ${pkg.originalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>

                        {pkg.discountPercentage > 0 && (
                          <div className="bg-green-100 text-green-800 text-center py-2 rounded-lg font-raleway font-semibold text-sm mb-3">
                            ¡Ahorra {pkg.discountPercentage}%!
                          </div>
                        )}

                        {/* Action Buttons */}
                        {(user?.role === "super_admin" || user?.role === "admin") && (
                          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => handleEditPackage(pkg)}
                              className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-raleway"
                              title="Editar paquete"
                            >
                              <Edit size={16} />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-raleway"
                              title="Eliminar paquete"
                            >
                              <Trash2 size={16} />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* PRIZES TAB */}
          {activeTab === "prizes" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-raleway font-semibold text-gray-700 text-lg">
                  Premios Progresivos
                </h3>
                {(user?.role === "super_admin" || user?.role === "admin") && (
                  <button
                    onClick={() => setShowPrizeForm(!showPrizeForm)}
                    className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c4a037] text-black font-raleway font-semibold px-4 py-2 rounded-lg transition"
                  >
                    {showPrizeForm ? <X size={18} /> : <Plus size={18} />}
                    {showPrizeForm ? "Cancelar" : "Agregar Premio"}
                  </button>
                )}
              </div>

              {/* Prize Form */}
              {showPrizeForm && (
                <form onSubmit={handleCreatePrize} className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-raleway font-semibold text-gray-900 mb-4">
                    Nuevo Premio
                  </h4>

                  {/* Prize Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                      Tipo de Premio <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="prizeType"
                          value="product"
                          checked={prizeType === "product"}
                          onChange={() => setPrizeType("product")}
                          className="w-4 h-4 text-[#d4af37]"
                        />
                        <span className="font-raleway">Producto</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="prizeType"
                          value="cash"
                          checked={prizeType === "cash"}
                          onChange={() => setPrizeType("cash")}
                          className="w-4 h-4 text-[#d4af37]"
                        />
                        <span className="font-raleway">Efectivo</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Nombre del Premio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={prizeForm.name}
                        onChange={(e) =>
                          setPrizeForm({ ...prizeForm, name: e.target.value })
                        }
                        required
                        placeholder="Ej: iPhone 14 Pro"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={prizeForm.description}
                        onChange={(e) =>
                          setPrizeForm({ ...prizeForm, description: e.target.value })
                        }
                        rows={3}
                        placeholder="Descripción del premio..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway resize-none"
                      />
                    </div>

                    {/* Product or Cash Fields */}
                    {prizeType === "cash" ? (
                      <div>
                        <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                          Valor en Efectivo <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={prizeForm.cashValue}
                          onChange={(e) =>
                            setPrizeForm({ ...prizeForm, cashValue: e.target.value })
                          }
                          required={prizeType === "cash"}
                          min="0.01"
                          step="0.01"
                          placeholder="Ej: 500.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                            Nombre del Producto <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={prizeForm.productName}
                            onChange={(e) =>
                              setPrizeForm({ ...prizeForm, productName: e.target.value })
                            }
                            required={prizeType === "product"}
                            placeholder="Ej: iPhone 14 Pro 256GB"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                            Descripción del Producto
                          </label>
                          <textarea
                            value={prizeForm.productDescription}
                            onChange={(e) =>
                              setPrizeForm({
                                ...prizeForm,
                                productDescription: e.target.value,
                              })
                            }
                            rows={2}
                            placeholder="Detalles técnicos..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <ImageIcon size={16} />
                            URL de Imagen del Producto
                          </label>
                          <input
                            type="url"
                            value={prizeForm.productImageUrl}
                            onChange={(e) =>
                              setPrizeForm({
                                ...prizeForm,
                                productImageUrl: e.target.value,
                              })
                            }
                            placeholder="https://ejemplo.com/producto.jpg"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                          />
                          {prizeForm.productImageUrl && (
                            <img
                              src={prizeForm.productImageUrl}
                              alt="Preview"
                              className="mt-3 w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      </>
                    )}

                    {/* Unlock Condition */}
                    <div>
                      <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                        Condición de Desbloqueo <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="unlockType"
                            value="tickets"
                            checked={prizeForm.unlockType === "tickets"}
                            onChange={() =>
                              setPrizeForm({ ...prizeForm, unlockType: "tickets" })
                            }
                            className="w-4 h-4 text-[#d4af37]"
                          />
                          <span className="font-raleway">Por Boletos Vendidos</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="unlockType"
                            value="percentage"
                            checked={prizeForm.unlockType === "percentage"}
                            onChange={() =>
                              setPrizeForm({ ...prizeForm, unlockType: "percentage" })
                            }
                            className="w-4 h-4 text-[#d4af37]"
                          />
                          <span className="font-raleway">Por Porcentaje</span>
                        </label>
                      </div>

                      {prizeForm.unlockType === "tickets" ? (
                        <input
                          type="number"
                          value={prizeForm.unlockAtTicketsSold}
                          onChange={(e) =>
                            setPrizeForm({
                              ...prizeForm,
                              unlockAtTicketsSold: e.target.value,
                            })
                          }
                          required
                          min="1"
                          placeholder="Ej: 1000 boletos"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                        />
                      ) : (
                        <input
                          type="number"
                          value={prizeForm.unlockAtPercentage}
                          onChange={(e) =>
                            setPrizeForm({
                              ...prizeForm,
                              unlockAtPercentage: e.target.value,
                            })
                          }
                          required
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="Ej: 50 (para 50%)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent font-raleway"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPrizeForm(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-raleway rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c4a037] text-black font-raleway font-semibold px-6 py-2 rounded-lg transition"
                    >
                      <Save size={18} />
                      {editingPrizeId ? "Actualizar Premio" : "Guardar Premio"}
                    </button>
                  </div>
                </form>
              )}

              {/* Prizes List */}
              {prizes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Trophy size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-raleway">
                    No hay premios configurados
                  </p>
                  <p className="text-gray-500 font-raleway text-sm mt-2">
                    Agrega premios progresivos para incentivar la compra
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {prizes
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((prize) => (
                      <div
                        key={prize.id}
                        className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-lg transition"
                      >
                        <div className="flex items-start gap-4">
                          {prize.productImageUrl && (
                            <img
                              src={prize.productImageUrl}
                              alt={prize.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}

                          <div className="flex-1">
                            <h4 className="font-raleway font-bold text-gray-900 text-lg mb-2">
                              {prize.name}
                            </h4>

                            {prize.description && (
                              <p className="text-gray-600 font-raleway text-sm mb-3">
                                {prize.description}
                              </p>
                            )}

                            {prize.cashValue ? (
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg inline-block font-raleway font-semibold text-sm mb-2">
                                ${prize.cashValue.toFixed(2)} en efectivo
                              </div>
                            ) : (
                              prize.productName && (
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg inline-block font-raleway font-semibold text-sm mb-2">
                                  {prize.productName}
                                </div>
                              )
                            )}

                            <div className="mt-3">
                              {/* {prize.unlockAtTicketsSold ? (
                                <p className="text-gray-600 font-raleway text-sm">
                                  🔓 Se desbloquea al vender{" "}
                                  <strong>{prize.unlockAtTicketsSold.toLocaleString()}</strong>{" "}
                                  boletos
                                </p>
                              ) : ( */}
                                {prize.unlockAtPercentage && (
                                  <p className="text-gray-600 font-raleway text-sm">
                                    🔓 Se desbloquea al alcanzar{" "}
                                    <strong>{prize.unlockAtPercentage}%</strong> de ventas
                                  </p>
                                )}
                              {/* )} */}
                            </div>

                            <div className="mt-2">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-raleway font-semibold ${
                                  prize.status === "locked"
                                    ? "bg-gray-200 text-gray-700"
                                    : prize.status === "unlocked"
                                    ? "bg-green-200 text-green-800"
                                    : "bg-blue-200 text-blue-800"
                                }`}
                              >
                                {prize.status === "locked"
                                  ? "🔒 Bloqueado"
                                  : prize.status === "unlocked"
                                  ? "🔓 Desbloqueado"
                                  : "✓ Reclamado"}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            {(user?.role === "super_admin" || user?.role === "admin") && (
                              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                                <button
                                  onClick={() => handleEditPrize(prize)}
                                  className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-raleway"
                                  title="Editar premio"
                                >
                                  <Edit size={16} />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeletePrize(prize.id)}
                                  className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-raleway"
                                  title="Eliminar premio"
                                >
                                  <Trash2 size={16} />
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
