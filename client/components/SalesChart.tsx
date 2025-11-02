import { useApi } from "@/hooks/useApi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

interface SalesData {
  date: string;
  ordersCount: number;
  revenue: number;
}

export default function SalesChart() {
  const { data, loading, error } = useApi<SalesData[]>("/dashboard/sales-chart?days=7");

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
        <p className="text-red-500 font-raleway">Error al cargar datos del gráfico</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-raleway">No hay datos disponibles</p>
      </div>
    );
  }

  // Formatear datos para el gráfico
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric"
    }),
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            style={{ fontSize: '12px', fontFamily: 'Raleway' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#3b82f6"
            style={{ fontSize: '12px', fontFamily: 'Raleway' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#10b981"
            style={{ fontSize: '12px', fontFamily: 'Raleway' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontFamily: 'Raleway'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Ingresos') {
                return [`$${value.toFixed(2)}`, name];
              }
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontFamily: 'Raleway', fontSize: '14px' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ordersCount"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Órdenes"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            name="Ingresos"
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
