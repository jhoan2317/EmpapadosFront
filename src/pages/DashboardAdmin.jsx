import { useState, useContext } from "react";
import "../styles/dashboard.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";


export default function DashboardAdmin() {
    const { user } = useContext(AuthContext);

    const [collapsed, setCollapsed] = useState(false);

    function toggleSiderbar() {
        setCollapsed(!collapsed);
    }

    return (
        <div className={`dashboard-root ${collapsed ? "sidebar-collapsed" : ""}`}>
            <Header onToggle={toggleSiderbar} />

            <Sidebar user={user} />

            <main className="app-main">
                <div className="welcome-container">
                    <h1 className="welcome-title">
                        Panel de <br /> Administrador
                    </h1>
                </div>
            </main>
        </div>
    );
}