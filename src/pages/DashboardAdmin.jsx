import { useState, useContext } from "react";
import "../styles/dashboard.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo.png";


export default function DashboardAdmin() {
    const { user } = useContext(AuthContext);

    const [collapsed, setCollapsed] = useState(true);

    function toggleSiderbar() {
        setCollapsed(!collapsed);
    }

    return (
        <div className={`dashboard-root ${collapsed ? "sidebar-collapsed" : ""}`}>
            <Header onToggle={toggleSiderbar} />

            <Sidebar user={user} />

            <main className="app-main admin-main-centered">
                <div className="welcome-container">
                    <div className="admin-logo-wrapper">
                        <img src={logo} alt="Logo" className="admin-main-logo" />
                    </div>
                </div>
            </main>
        </div>
    );
}