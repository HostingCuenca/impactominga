import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Search, Filter, UserPlus, Shield, Mail, Phone, Calendar, CheckCircle, XCircle, AlertCircle, Trash2, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalCustomers: number;
  totalStaff: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  newUsersThisMonth: number;
}

export default function UsersList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [filterRole, filterStatus]);

  async function fetchStats() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchUsers() {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filterRole !== "all") params.append("role", filterRole);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(userId: string, newStatus: string) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        fetchStats();
      } else {
        alert(data.message || "Error al actualizar estado");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar estado del usuario");
    }
  }

  async function handleDeleteUser(userId: string, userEmail: string) {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        fetchStats();
      } else {
        alert(data.message || "Error al eliminar usuario");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar usuario");
    }
  }

  const getRoleBadge = (role: string) => {
    const config: Record<string, { className: string; text: string; icon: any }> = {
      super_admin: { className: "bg-purple-100 text-purple-800", text: "Super Admin", icon: Shield },
      admin: { className: "bg-blue-100 text-blue-800", text: "Admin", icon: Shield },
      contadora: { className: "bg-green-100 text-green-800", text: "Contadora", icon: Shield },
      customer: { className: "bg-gray-100 text-gray-800", text: "Cliente", icon: Users },
    };

    const { className, text, icon: Icon } = config[role] || config.customer;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-raleway font-semibold ${className}`}>
        <Icon className="w-3 h-3" />
        {text}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; text: string; icon: any }> = {
      active: { className: "bg-green-100 text-green-800", text: "Activo", icon: CheckCircle },
      inactive: { className: "bg-gray-100 text-gray-800", text: "Inactivo", icon: XCircle },
      suspended: { className: "bg-red-100 text-red-800", text: "Suspendido", icon: AlertCircle },
    };

    const { className, text, icon: Icon } = config[status] || config.active;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-raleway font-semibold ${className}`}>
        <Icon className="w-3 h-3" />
        {text}
      </span>
    );
  };

  const filteredUsers = users.filter((userItem) => {
    const matchesSearch =
      searchTerm === "" ||
      userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.idNumber.includes(searchTerm);

    return matchesSearch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">Cargando usuarios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-oswald text-4xl font-bold text-black mb-2">
                  GESTIÓN DE USUARIOS
                </h1>
                <p className="text-gray-600 font-raleway">
                  {filteredUsers.length} usuarios encontrados
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-raleway text-gray-600 mb-1">Total Clientes</p>
                    <p className="text-3xl font-oswald font-bold text-[#d4af37]">{stats.totalCustomers}</p>
                  </div>
                  <Users className="w-12 h-12 text-[#d4af37] opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-raleway text-gray-600 mb-1">Staff</p>
                    <p className="text-3xl font-oswald font-bold text-blue-600">{stats.totalStaff}</p>
                  </div>
                  <Shield className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-raleway text-gray-600 mb-1">Activos</p>
                    <p className="text-3xl font-oswald font-bold text-green-600">{stats.activeUsers}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-raleway text-gray-600 mb-1">Nuevos (30 días)</p>
                    <p className="text-3xl font-oswald font-bold text-purple-600">{stats.newUsersThisMonth}</p>
                  </div>
                  <UserPlus className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre, email, documento..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Rol
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="customer">Clientes</option>
                  <option value="admin">Administradores</option>
                  <option value="contadora">Contadoras</option>
                  <option value="super_admin">Super Admins</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-raleway font-semibold text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="suspended">Suspendidos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      USUARIO
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      CONTACTO
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      ROL
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      ESTADO
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      REGISTRO
                    </th>
                    <th className="px-6 py-4 text-left font-oswald text-sm font-bold text-gray-700">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-raleway text-gray-600">
                          No se encontraron usuarios
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-oswald text-lg font-bold text-gray-900">
                              {userItem.firstName} {userItem.lastName}
                            </p>
                            <p className="text-sm text-gray-500 font-raleway">
                              {userItem.idType.toUpperCase()}: {userItem.idNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="font-raleway">{userItem.email}</span>
                              {userItem.emailVerified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            {userItem.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="font-raleway">{userItem.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(userItem.role)}</td>
                        <td className="px-6 py-4">{getStatusBadge(userItem.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-raleway">
                              {new Date(userItem.createdAt).toLocaleDateString("es-EC")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* Edit Button */}
                            <Link
                              to={`/dashboard/users/${userItem.id}/edit`}
                              className="p-2 text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition"
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Status Change Dropdown */}
                            {userItem.role !== 'super_admin' && user?.userId !== userItem.id && (
                              <select
                                value={userItem.status}
                                onChange={(e) => handleUpdateStatus(userItem.id, e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent"
                              >
                                <option value="active">Activar</option>
                                <option value="inactive">Desactivar</option>
                                <option value="suspended">Suspender</option>
                              </select>
                            )}

                            {/* Delete Button */}
                            {user?.role === 'super_admin' &&
                             userItem.role !== 'super_admin' &&
                             user?.userId !== userItem.id && (
                              <button
                                onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
