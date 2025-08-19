"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { backend1Api, backend2Api, handleApiError } from "../services/api"
import {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  DollarSign,
  TrendingUp,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"

interface DashboardStats {
  users: number
  products: number
  sales: number
  revenue: number
}

interface RecentActivity {
  type: string
  message: string
  time: string
  icon: React.ComponentType<any>
}
const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    products: 0,
    sales: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loadingStates, setLoadingStates] = useState({
    products: false,
    sales: false,
    users: false,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      setLoadingStates({ products: true, sales: true, users: true })

      console.log("Loading dashboard data...")

      const [productsResponse, salesResponse, usersResponse] = await Promise.allSettled([
        backend2Api.get("/api/products"),
        backend1Api.get("/api/sales"),
        backend1Api.get("/api/users"),
      ])

      let products: any[] = []
      let sales: any[] = []
      let users: any[] = []
      let hasErrors = false

      if (productsResponse.status === "fulfilled") {
        if (productsResponse.value.data.success && Array.isArray(productsResponse.value.data.data)) {
          products = productsResponse.value.data.data
        } else if (Array.isArray(productsResponse.value.data)) {
          products = productsResponse.value.data
        }
        console.log(`Loaded ${products.length} products`)
        setLoadingStates((prev) => ({ ...prev, products: false }))
      } else {
        console.error("Failed to load products:", productsResponse.reason)
        hasErrors = true
        setLoadingStates((prev) => ({ ...prev, products: false }))
      }

      if (salesResponse.status === "fulfilled") {
        if (salesResponse.value.data.success && Array.isArray(salesResponse.value.data.data)) {
          sales = salesResponse.value.data.data
        } else if (Array.isArray(salesResponse.value.data)) {
          sales = salesResponse.value.data
        }
        console.log(`Loaded ${sales.length} sales`)
        setLoadingStates((prev) => ({ ...prev, sales: false }))
      } else {
        console.error("Failed to load sales:", salesResponse.reason)
        hasErrors = true
        setLoadingStates((prev) => ({ ...prev, sales: false }))
      }

      if (usersResponse.status === "fulfilled") {
        if (usersResponse.value.data.success && Array.isArray(usersResponse.value.data.data)) {
          users = usersResponse.value.data.data
        } else if (Array.isArray(usersResponse.value.data)) {
          users = usersResponse.value.data
        }
        console.log(`Loaded ${users.length} users`)
        setLoadingStates((prev) => ({ ...prev, users: false }))
      } else {
        console.error("Failed to load users:", usersResponse.reason)
        hasErrors = true
        setLoadingStates((prev) => ({ ...prev, users: false }))
      }

      const revenue = sales.reduce((total: number, sale: any) => {
        const saleTotal = sale.total || 0
        if (typeof saleTotal === "number" && !isNaN(saleTotal)) {
          return total + saleTotal
        }
        return total
      }, 0)

      setStats({
        users: users.length,
        products: products.length,
        sales: sales.length,
        revenue,
      })

      const activities: RecentActivity[] = []

      if (sales.length > 0) {
        const recentSale = sales[sales.length - 1]
        activities.push({
          type: "sale",
          message: `Venta por $${(recentSale.total || 0).toFixed(2)} registrada`,
          time: "Reciente",
          icon: ShoppingCart,
        })
      }

      if (users.length > 0) {
        activities.push({
          type: "user",
          message: `${users.length} usuarios en el sistema`,
          time: "Actualizado",
          icon: Users,
        })
      }

      if (products.length > 0) {
        const lowStockProducts = products.filter((p) => p.stock < 10).length
        if (lowStockProducts > 0) {
          activities.push({
            type: "product",
            message: `${lowStockProducts} productos con stock bajo`,
            time: "Alerta",
            icon: Package,
          })
        } else {
          activities.push({
            type: "product",
            message: `${products.length} productos disponibles`,
            time: "Actualizado",
            icon: Package,
          })
        }
      }

      setRecentActivity(activities)

      if (hasErrors) {
        const errorMessage = "Algunos datos no se pudieron cargar completamente"
        setError(errorMessage)
        toast.error(errorMessage)
      } else if (products.length === 0 && sales.length === 0 && users.length === 0) {
        const warningMessage = "No se encontraron datos en el sistema"
        setError(warningMessage)
        toast.error(warningMessage)
      } else {
        toast.success("Dashboard actualizado correctamente")
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      const errorMessage = handleApiError(error)
      setError(`Error al cargar el dashboard: ${errorMessage}`)
      toast.error(`Error al cargar el dashboard: ${errorMessage}`)
    } finally {
      setLoading(false)
      setLoadingStates({ products: false, sales: false, users: false })
    }
  }

  const statCards = [
    {
      name: "Usuarios",
      value: stats.users,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      change: "+12%",
      positive: true,
      loading: loadingStates.users,
    },
    {
      name: "Productos",
      value: stats.products,
      icon: Package,
      gradient: "from-emerald-500 to-teal-500",
      change: "+8%",
      positive: true,
      loading: loadingStates.products,
    },
    {
      name: "Ventas",
      value: stats.sales,
      icon: ShoppingCart,
      gradient: "from-orange-500 to-red-500",
      change: "+23%",
      positive: true,
      loading: loadingStates.sales,
    },
    {
      name: "Ingresos",
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-500",
      change: "+15%",
      positive: true,
      loading: loadingStates.sales,
    },
  ]

  const quickActions = [
    { name: "Gestionar Usuarios", href: "/users", icon: Users, color: "blue", roles: ["Administrador"] },
    { name: "Gestionar Productos", href: "/products", icon: Package, color: "emerald", roles: ["Administrador"] },
    { name: "Nueva Venta", href: "/sales", icon: ShoppingCart, color: "orange", roles: ["Vendedor", "Administrador"] },
    { name: "Ver Reportes", href: "/reports", icon: BarChart3, color: "purple", roles: ["Consultor", "Administrador"] },
  ]

  const userRole = user?.role_id?.name || user?.role || "Usuario"
  const filteredActions = quickActions.filter((action) => action.roles.includes(userRole))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Cargando dashboard...</p>
          <div className="flex space-x-4 text-sm text-slate-500">
            <span className={loadingStates.products ? "text-blue-600" : "text-green-600"}>
              Productos {loadingStates.products ? "⏳" : "✓"}
            </span>
            <span className={loadingStates.sales ? "text-blue-600" : "text-green-600"}>
              Ventas {loadingStates.sales ? "⏳" : "✓"}
            </span>
            <span className={loadingStates.users ? "text-blue-600" : "text-green-600"}>
              Usuarios {loadingStates.users ? "⏳" : "✓"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-red-800 font-medium">Advertencia</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
        {/* Simplified background pattern to avoid SVG parsing issues */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">¡Bienvenido, {user?.name}! 👋</h1>
              <p className="text-slate-300 text-lg">Panel de {userRole} - Sistema SOA</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Estado del Sistema</p>
                <p className={`text-lg font-semibold ${error ? "text-yellow-400" : "text-green-400"}`}>
                  {error ? "Con Advertencias" : "Activo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">{stat.name}</p>
                {stat.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                    <span className="text-slate-500">Cargando...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.positive ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className={`p-4 bg-gradient-to-r ${stat.gradient} rounded-2xl shadow-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Acciones Rápidas
          </h3>
          {filteredActions.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No hay acciones disponibles para tu rol</p>
              <p className="text-slate-400 text-sm mt-2">Contacta al administrador si necesitas más permisos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className={`p-4 bg-gradient-to-r from-${action.color}-50 to-${action.color}-100 rounded-xl border border-${action.color}-200 hover:shadow-lg transition-all duration-300 hover:scale-105 group`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 bg-${action.color}-500 rounded-lg group-hover:scale-110 transition-transform duration-200`}
                    >
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className={`font-medium text-${action.color}-700`}>{action.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
            Actividad Reciente
          </h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No hay actividad reciente</p>
              <p className="text-slate-400 text-sm mt-2">La actividad aparecerá aquí cuando haya datos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <activity.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role-specific Information */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-200/50">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Panel de {userRole}</h3>

        {userRole === "Administrador" && (
          <div className="space-y-6">
            <p className="text-slate-600 text-lg">Como administrador, tienes acceso completo al sistema:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Gestión de Sistema</h4>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Gestionar usuarios y roles
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Administrar catálogo de productos
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Supervisar todas las ventas
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Acceso completo a reportes
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Métricas Clave</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-slate-700">Total Usuarios</span>
                    <span className="font-bold text-blue-600">{stats.users}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-slate-700">Productos Activos</span>
                    <span className="font-bold text-green-600">{stats.products}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {userRole === "Vendedor" && (
          <div className="space-y-6">
            <p className="text-slate-600 text-lg">Como vendedor, puedes gestionar tus ventas eficientemente:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Tus Herramientas</h4>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Crear nuevas ventas
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Ver historial de ventas
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Consultar productos disponibles
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Gestionar estado de pedidos
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-3">Rendimiento del Mes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-orange-700">Ventas Realizadas</span>
                    <span className="font-bold text-orange-800">{stats.sales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Ingresos Generados</span>
                    <span className="font-bold text-orange-800">${stats.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {userRole === "Consultor" && (
          <div className="space-y-6">
            <p className="text-slate-600 text-lg">Como consultor, tienes acceso a análisis y reportes avanzados:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Análisis Disponibles</h4>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>Reportes de ventas detallados
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Análisis de tendencias
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Exportación de datos
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Estadísticas del sistema
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">Insights del Sistema</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Total Transacciones</span>
                    <span className="font-bold text-purple-800">{stats.sales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Valor Total</span>
                    <span className="font-bold text-purple-800">${stats.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!["Administrador", "Vendedor", "Consultor"].includes(userRole) && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Bienvenido al sistema</p>
            <p className="text-slate-400 text-sm mt-2">Tu rol: {userRole}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
