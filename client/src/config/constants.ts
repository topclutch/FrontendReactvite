// constants.ts
const getEnv = (key: string, defaultValue: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not defined. Using default: ${defaultValue}`);
    return defaultValue;
  }
  return value;
};

// Detectar si estamos en localhost o no
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Configuración de APIs
export const API_CONFIG = {
  BACKEND1_URL: isLocalhost
    ? getEnv("VITE_BACKEND1_URL_LOCAL", "http://localhost:3001")
    : getEnv("VITE_BACKEND1_URL_LAN", "http://192.168.43.62:3001"),

  BACKEND2_URL: isLocalhost
    ? getEnv("VITE_BACKEND2_URL_LOCAL", "http://localhost:5000")
    : getEnv("VITE_BACKEND2_URL_LAN", "http://192.168.43.62:5000"),

  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 15000,
};

// Roles
export const ROLES = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  CONSULTOR: "Consultor",
} as const;

// Rutas
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  USERS: "/users",
  PRODUCTS: "/products",
  SALES: "/sales",
  REPORTS: "/reports",
} as const;

// APIs externas
export const EXTERNAL_APIS = {
  FAKE_STORE: "https://fakestoreapi.com",
  WEATHER: "https://api.openweathermap.org/data/2.5",
  COUNTRIES: "https://restcountries.com/v3.1",
  JSONPLACEHOLDER: "https://jsonplaceholder.typicode.com",
};
