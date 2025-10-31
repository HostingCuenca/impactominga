import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, Save, User, Mail, Phone, FileText, Shield } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  idType: string;
  idNumber: string;
}

export default function UserEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idType: "cedula",
    idNumber: "",
    role: "customer",
    status: "active"
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setFormData({
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          email: data.data.email,
          phone: data.data.phone || "",
          idType: data.data.idType,
          idNumber: data.data.idNumber,
          role: data.data.role,
          status: data.data.status
        });
      } else {
        alert("Usuario no encontrado");
        navigate("/dashboard/users");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      alert("Error al cargar usuario");
      navigate("/dashboard/users");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      // Actualizar información básica
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          idType: formData.idType,
          idNumber: formData.idNumber,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Error al actualizar usuario");
        setSaving(false);
        return;
      }

      // Si cambió el rol, actualizarlo
      if (formData.role !== user?.role) {
        const roleResponse = await fetch(`/api/users/${id}/role`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: formData.role }),
        });

        const roleData = await roleResponse.json();
        if (!roleData.success) {
          alert(roleData.message || "Error al actualizar rol");
        }
      }

      // Si cambió el estado, actualizarlo
      if (formData.status !== user?.status) {
        const statusResponse = await fetch(`/api/users/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: formData.status }),
        });

        const statusData = await statusResponse.json();
        if (!statusData.success) {
          alert(statusData.message || "Error al actualizar estado");
        }
      }

      alert("Usuario actualizado exitosamente");
      navigate("/dashboard/users");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">Cargando usuario...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/dashboard/users")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-raleway"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a Usuarios
            </button>
            <h1 className="font-oswald text-4xl font-bold text-black mb-2">
              EDITAR USUARIO
            </h1>
            <p className="text-gray-600 font-raleway">
              Actualiza la información del usuario
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
            {/* Información Personal */}
            <div className="mb-8">
              <h2 className="font-oswald text-2xl font-bold text-black mb-4 flex items-center gap-2">
                <User className="w-6 h-6 text-[#d4af37]" />
                INFORMACIÓN PERSONAL
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="mb-8">
              <h2 className="font-oswald text-2xl font-bold text-black mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-[#d4af37]" />
                CONTACTO
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0999999999"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Identificación */}
            <div className="mb-8">
              <h2 className="font-oswald text-2xl font-bold text-black mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#d4af37]" />
                IDENTIFICACIÓN
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  >
                    <option value="cedula">Cédula</option>
                    <option value="ruc">RUC</option>
                    <option value="passport">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Permisos y Estado */}
            <div className="mb-8">
              <h2 className="font-oswald text-2xl font-bold text-black mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#d4af37]" />
                PERMISOS Y ESTADO
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    disabled={user?.role === 'super_admin'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="customer">Cliente</option>
                    <option value="contadora">Contadora</option>
                    <option value="admin">Administrador</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  {user?.role === 'super_admin' && (
                    <p className="text-xs text-gray-500 mt-1 font-raleway">
                      No se puede cambiar el rol de un Super Admin
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    disabled={user?.role === 'super_admin'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                  </select>
                  {user?.role === 'super_admin' && (
                    <p className="text-xs text-gray-500 mt-1 font-raleway">
                      No se puede cambiar el estado de un Super Admin
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/dashboard/users")}
                className="px-6 py-3 border border-gray-300 rounded-lg font-oswald font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black rounded-lg font-oswald font-bold hover:bg-[#b8941f] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
