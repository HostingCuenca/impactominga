import { useState, useEffect } from "react";

interface UseApiOptions {
  enabled?: boolean;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para hacer peticiones HTTP al API
 * @param url - URL del endpoint
 * @param options - Opciones de configuración
 * @returns Estado de la petición (data, loading, error)
 */
export function useApi<T>(url: string, options: UseApiOptions = {}) {
  const { enabled = true } = options;
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api${url}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: result.message || "Error desconocido",
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : "Error al cargar datos",
      });
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [url, enabled]);

  return { ...state, refetch: fetchData };
}
