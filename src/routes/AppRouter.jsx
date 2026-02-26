import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import DashboardAdmin from "../pages/DashboardAdmin";
import AdminProductos from "../pages/AdminProductos";
import AdminPedidos from "../pages/AdminPedidos";
import AdminInventario from "../pages/AdminInventario";
import AdminReportes from "../pages/AdminReportes";
import AdminCategorias from "../pages/AdminCategorias";
import Landing from "../pages/Landing";
import Home from "../pages/Home";
import TrabajaConNosotros from "../pages/TrabajaConNosotros";
import PrivateRoute from "./PrivateRoute";
import AdminPagos from "../pages/AdminPagos";
import AdminMarketing from "../pages/AdminMarketing";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/trabaja-con-nosotros" element={<TrabajaConNosotros />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardAdmin />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/productos"
        element={
          <PrivateRoute>
            <AdminProductos />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/pedidos"
        element={
          <PrivateRoute>
            <AdminPedidos />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/inventario"
        element={
          <PrivateRoute>
            <AdminInventario />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/reportes"
        element={
          <PrivateRoute>
            <AdminReportes />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/categorias"
        element={
          <PrivateRoute>
            <AdminCategorias />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/pagos"
        element={
          <PrivateRoute>
            <AdminPagos />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/marketing"
        element={
          <PrivateRoute>
            <AdminMarketing />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
