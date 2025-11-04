import { useApi } from "@/hooks/useApi";
import { ShoppingCart, Gift, Ticket, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Activity {
  type: "order" | "prize" | "ticket";
  id: number;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  metadata: any;
}

export default function ActivityFeed() {
  const { data: activities, loading, error } = useApi<Activity[]>("/dashboard/recent-activity?limit=10");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#d4af37]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-raleway">Error al cargar actividad reciente</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
          <Clock size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-500 font-raleway text-lg">
          No hay actividad reciente para mostrar.
        </p>
        <p className="text-gray-400 font-raleway text-sm mt-2">
          Las órdenes y transacciones aparecerán aquí.
        </p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart size={20} className="text-blue-600" />;
      case "prize":
        return <Gift size={20} className="text-purple-600" />;
      case "ticket":
        return <Ticket size={20} className="text-green-600" />;
      default:
        return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_verification":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "unlocked":
        return "bg-purple-100 text-purple-800";
      case "sold":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending_verification: "Pendiente",
      approved: "Aprobado",
      completed: "Completado",
      rejected: "Rechazado",
      unlocked: "Desbloqueado",
      sold: "Vendido",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={`${activity.type}-${activity.id}`}
          className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {getIcon(activity.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-raleway font-semibold text-gray-900">
                  {activity.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1 font-raleway">
                  {activity.description}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-raleway font-medium whitespace-nowrap ${getStatusColor(
                  activity.status
                )}`}
              >
                {getStatusText(activity.status)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-raleway">
              {formatDistanceToNow(new Date(activity.timestamp), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
