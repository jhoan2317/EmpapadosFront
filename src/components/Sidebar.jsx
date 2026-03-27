import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { useEffect } from "react";

export default function Sidebar({ user }) {

    useEffect(() => {
        // Inicializar tooltips de Bootstrap
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl));

        // Limpiar al desmontar para evitar fugas de memoria y duplicados
        return () => {
            tooltipList.forEach(t => t.dispose());
        };
    }, []);

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <img src={logo} alt="Logo" className="brand-logo" />
            </div>

            <div className="user-panel">
                <div className="user-info">
                    <span className="user-icon"><i className="bi bi-person-fill"></i></span>
                    <span className="username">
                        {user?.username?.toUpperCase()}
                    </span>
                </div>
            </div>

            <nav className="sidebar-menu">
                <NavLink 
                    className="menu-item" 
                    to="/dashboard" 
                    end
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Dashboard"
                >
                    <span className="menu-icon"><i className="bi bi-house-fill"></i></span>
                    <span className="menu-text">Dashboard</span>
                </NavLink>

                <NavLink 
                    className="menu-item" 
                    to="/dashboard/pedidos"
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Pedidos"
                >
                    <span className="menu-icon"><i className="bi bi-cart4"></i></span>
                    <span className="menu-text">Pedidos</span>
                </NavLink>

                <NavLink 
                    className="menu-item" 
                    to="/dashboard/productos"
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Productos"
                >
                    <span className="menu-icon"><i className="bi bi-bag-plus-fill"></i></span>
                    <span className="menu-text">Productos</span>
                </NavLink>

                <NavLink 
                    className="menu-item" 
                    to="/dashboard/categorias"
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Categorías"
                >
                    <span className="menu-icon"><i className="bi bi-tags-fill"></i></span>
                    <span className="menu-text">Categorías</span>
                </NavLink>

                <NavLink 
                    className="menu-item" 
                    to="/dashboard/inventario"
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Inventario"
                >
                    <span className="menu-icon"><i className="bi bi-card-list"></i></span>
                    <span className="menu-text">Inventario</span>
                </NavLink>

                <NavLink 
                    className="menu-item" 
                    to="/dashboard/reportes"
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Reportes"
                >
                    <span className="menu-icon"><i className="bi bi-graph-up-arrow"></i></span>
                    <span className="menu-text">Reportes</span>
                </NavLink>

                <NavLink 
                    className="menu-item" 
                    to="/dashboard/pagos"
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Pagos"
                >
                    <span className="menu-icon"><i className="bi bi-cash-coin"></i></span>
                    <span className="menu-text">Pagos</span>
                </NavLink>

                <NavLink 
                    className="menu-item" 
                    to="/dashboard/marketing"
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    data-bs-title="Marketing"
                >
                    <span className="menu-icon"><i className="bi bi-megaphone-fill"></i></span>
                    <span className="menu-text">Marketing</span>
                </NavLink>
            </nav>
        </aside>
    );
}
