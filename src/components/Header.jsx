import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Header({ onToggle }) {
    const { logout } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [newNotification, setNewNotification] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const pedidosRef = collection(db, "pedidos");
        const q = query(pedidosRef, where("fecha", "==", today));
        
        let initialLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Ignoramos la carga inicial para no hacer sonar la campana 
            // con los pedidos que ya existían hoy.
            if (initialLoad) {
                initialLoad = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    
                    const notif = {
                        id: change.doc.id.slice(-5), // Usamos los ultimos 5 del ID
                        cliente: data.nombre_cliente || "Cliente",
                        tipo: (data.tipo_pedido || data.tipo || "").toUpperCase(),
                        total: data.total || data.precio || 0
                    };

                    setNotifications((prev) => {
                        // Evitar duplicados rápidos
                        if (prev.find(n => n.id === notif.id)) return prev;
                        return [notif, ...prev].slice(0, 10);
                    });
                    
                    setNewNotification(true);
                    window.dispatchEvent(new CustomEvent('new-notification', { detail: "new_order" }));

                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.play().catch(() => { }); // Silencioso si falla
                }
            });
        }, (error) => {
            console.error("Error listening to new orders:", error);
        });

        return () => unsubscribe();
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
