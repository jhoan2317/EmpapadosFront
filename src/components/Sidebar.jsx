import { NavLink } from "react-router-dom";

export default function Sidebar({ user }) {
    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <h2 className="brand-text">
                    EmpapadosPop
                </h2>
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
                <NavLink className="menu-item" to="/dashboard" end>
                    <span className="menu-icon"><i className="bi bi-house-fill"></i></span>
                    <span className="menu-text">Dashboard</span>
                </NavLink>

                <NavLink className="menu-item" to="/dashboard/pedidos">
                    <span className="menu-icon"><i className="bi bi-cart4"></i></span>
                    <span className="menu-text">Pedidos</span>
                </NavLink>

                <NavLink className="menu-item" to="/dashboard/productos">
                    <span className="menu-icon"><i className="bi bi-bag-plus-fill"></i></span>
                    <span className="menu-text">Productos</span>
                </NavLink>

                <NavLink className="menu-item" to="/dashboard/galeria">
                    <span className="menu-icon"><i className="bi bi-images"></i></span>
                    <span className="menu-text">Galería</span>
                </NavLink>

                <NavLink className="menu-item" to="/dashboard/inventario">
                    <span className="menu-icon"><i className="bi bi-card-list"></i></span>
                    <span className="menu-text">Inventario</span>
                </NavLink>

                <NavLink className="menu-item" to="/dashboard/reportes">
                    <span className="menu-icon"><i className="bi bi-graph-up-arrow"></i></span>
                    <span className="menu-text">Reportes</span>
                </NavLink>

                <NavLink className="menu-item" to="/dashboard/pagos">
                    <span className="menu-icon"><i className="bi bi-cash-coin"></i></span>
                    <span className="menu-text">Pagos</span>
                </NavLink>

                <NavLink className="menu-item" to="/dashboard/marketing">
                    <span className="menu-icon"><i className="bi bi-megaphone-fill"></i></span>
                    <span className="menu-text">Marketing</span>
                </NavLink>
            </nav>
        </aside>
    );
}
