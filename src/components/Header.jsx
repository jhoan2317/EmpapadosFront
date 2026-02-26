import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Header({ onToggle }) {
    const { logout } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [newNotification, setNewNotification] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        let timeoutId;
        const isUnmounted = { current: false };

        const connectWS = () => {
            if (isUnmounted.current) return;

            // Evitar crear múltiples conexiones si ya hay una abriéndose
            if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
            const wsUrl = apiUrl.replace(/^http/, "ws");
            ws.current = new WebSocket(`${wsUrl}/ws/notifications/`);

            ws.current.onopen = () => {
                if (!isUnmounted.current) {
                    console.log("🟢 WebSocket Conectado");
                }
            };

            ws.current.onmessage = (event) => {
                if (isUnmounted.current) return;
                const data = JSON.parse(event.data);

                if (data.type === "new_order" || data.type === "new_testimonial") {
                    setNotifications((prev) => {
                        const notifId = `${data.type}-${data.message.id}`;
                        if (prev.find(n => n.uniqueId === notifId)) return prev;
                        return [{ ...data.message, uniqueId: notifId, notifType: data.type }, ...prev].slice(0, 10);
                    });
                    setNewNotification(true);
                    window.dispatchEvent(new CustomEvent('new-notification', { detail: data.type }));

                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.play().catch(() => { }); // Silencioso si falla
                }
            };

            ws.current.onclose = () => {
                if (!isUnmounted.current) {
                    console.log("🟡 WebSocket Desconectado. Reintentando...");
                    timeoutId = setTimeout(connectWS, 5000);
                }
            };

            ws.current.onerror = () => {
                // No logeamos el error aquí para evitar ruido, onclose se encargará del reconectado
                ws.current.close();
            };
        };

        connectWS();

        return () => {
            isUnmounted.current = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (ws.current) {
                ws.current.onclose = null; // Quitar el handler para evitar el bucle de reconexión al desmontar
                ws.current.close();
            }
        };
    }, []);

    const toggleNotifications = () => {
        if (showNotifications) {
            setNotifications([]);
        }
        setShowNotifications(!showNotifications);
        setNewNotification(false);
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <button className="menu-btn" onClick={onToggle}>
                    ☰
                </button>
            </div>

            <div className="header-right">
                {/* Campana de Notificaciones */}
                <div className="notification-container">
                    <button
                        className="notification-btn"
                        onClick={toggleNotifications}
                        title="Notificaciones"
                    >
                        <i className="bi bi-chat-right-dots-fill"></i>
                        {notifications.length > 0 && (
                            <span className="notification-badge">{notifications.length}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <h3>Pedidos Nuevos</h3>
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <p className="no-notifications">No hay pedidos nuevos</p>
                                ) : (
                                    notifications.map((notif, index) => (
                                        <div key={index} className="notification-item">
                                            <div className="notif-info">
                                                <strong>Pedido #{notif.id}</strong>
                                                <span>{notif.cliente}</span>
                                            </div>
                                            <div className="notif-meta">
                                                <span className="notif-total">${parseFloat(notif.total).toLocaleString()}</span>
                                                <span className="notif-type">{notif.tipo}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button className="logout-btn" onClick={logout} title="Cerrar Sesión">
                    <i className="bi bi-power"></i>
                </button>
            </div>
        </header >
    );
}
