import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Settings as SettingsIcon, Save, DollarSign, Phone, Building, Mail, Video, Clock, Plus, Trash2 } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string | null;
  updatedAt: string;
}

interface GroupedSettings {
  [category: string]: Setting[];
}

export default function Settings() {
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);

        // Inicializar valores editables
        const initialValues: { [key: string]: string } = {};
        Object.values(data.data).flat().forEach((setting: any) => {
          initialValues[setting.key] = setting.value;
        });
        setEditingValues(initialValues);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSetting(key: string) {
    setSaving(key);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/settings/${key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: editingValues[key] }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Configuración actualizada exitosamente");
        fetchSettings();
      } else {
        alert(data.message || "Error al actualizar configuración");
      }
    } catch (error) {
      console.error("Error updating setting:", error);
      alert("Error al actualizar configuración");
    } finally {
      setSaving(null);
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      payment: DollarSign,
      contact: Phone,
      company: Building,
      content: Video,
      raffle: Clock,
    };

    return icons[category] || SettingsIcon;
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      payment: "Pagos y Facturación",
      contact: "Contacto",
      company: "Información de la Empresa",
      content: "Contenido",
      raffle: "Configuración de Sorteos",
      receipts: "Comprobantes",
    };

    return names[category] || category.toUpperCase();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-7xl mx-auto text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-raleway">Cargando configuraciones...</p>
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
            <h1 className="font-oswald text-4xl font-bold text-black mb-2">
              CONFIGURACIÓN DEL SISTEMA
            </h1>
            <p className="text-gray-600 font-raleway">
              Gestiona las configuraciones globales de la plataforma
            </p>
          </div>

          {/* Settings by Category */}
          {Object.entries(settings).map(([category, categorySettings]) => {
            const Icon = getCategoryIcon(category);

            return (
              <div key={category} className="mb-8">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-[#d4af37]" />
                      <h2 className="font-oswald text-2xl font-bold text-black">
                        {getCategoryName(category)}
                      </h2>
                    </div>
                  </div>

                  {/* Settings List */}
                  <div className="divide-y divide-gray-200">
                    {categorySettings.map((setting) => (
                      <div key={setting.key} className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Setting Info */}
                          <div>
                            <label className="block text-sm font-raleway font-semibold text-gray-700 mb-1">
                              {setting.key.split('_').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </label>
                            {setting.description && (
                              <p className="text-sm text-gray-500 font-raleway">
                                {setting.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 font-raleway mt-1">
                              Clave: <code className="bg-gray-100 px-2 py-1 rounded">{setting.key}</code>
                            </p>
                          </div>

                          {/* Setting Value */}
                          <div>
                            {setting.key.includes('_message') || setting.key.includes('notes') ? (
                              // Textarea for long text
                              <textarea
                                value={editingValues[setting.key] || ""}
                                onChange={(e) => setEditingValues({
                                  ...editingValues,
                                  [setting.key]: e.target.value
                                })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent mb-2"
                              />
                            ) : setting.key.includes('url') || setting.key === 'whatsapp_number' ? (
                              // Input for URLs and phone
                              <input
                                type="text"
                                value={editingValues[setting.key] || ""}
                                onChange={(e) => setEditingValues({
                                  ...editingValues,
                                  [setting.key]: e.target.value
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent mb-2"
                              />
                            ) : setting.key.includes('rate') || setting.key.includes('counter') || setting.key.includes('minutes') ? (
                              // Number input
                              <input
                                type="number"
                                step={setting.key.includes('rate') ? "0.01" : "1"}
                                value={editingValues[setting.key] || ""}
                                onChange={(e) => setEditingValues({
                                  ...editingValues,
                                  [setting.key]: e.target.value
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent mb-2"
                              />
                            ) : setting.key.includes('account') ? (
                              // JSON editor for bank accounts
                              <textarea
                                value={editingValues[setting.key] || ""}
                                onChange={(e) => setEditingValues({
                                  ...editingValues,
                                  [setting.key]: e.target.value
                                })}
                                rows={4}
                                placeholder='{"bank":"Nombre","account":"12345","type":"Ahorros","holder":"Titular"}'
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#d4af37] focus:border-transparent mb-2"
                              />
                            ) : (
                              // Default text input
                              <input
                                type="text"
                                value={editingValues[setting.key] || ""}
                                onChange={(e) => setEditingValues({
                                  ...editingValues,
                                  [setting.key]: e.target.value
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-raleway focus:ring-2 focus:ring-[#d4af37] focus:border-transparent mb-2"
                              />
                            )}

                            {/* Save Button */}
                            <button
                              onClick={() => handleUpdateSetting(setting.key)}
                              disabled={saving === setting.key || editingValues[setting.key] === setting.value}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#d4af37] text-black rounded-lg font-oswald font-bold hover:bg-[#b8941f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="w-4 h-4" />
                              {saving === setting.key ? "GUARDANDO..." : "GUARDAR"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {Object.keys(settings).length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-oswald text-2xl font-bold text-gray-700 mb-2">
                NO HAY CONFIGURACIONES
              </h3>
              <p className="text-gray-500 font-raleway">
                No se encontraron configuraciones en el sistema
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
