import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getOrders } from "../services/orderService";
import { useLoading } from "../context/LoadingContext";
import { LOADING_CONFIG } from "../components/GlobalSpinner";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
import "../styles/dashboard.css";
import "../styles/admin-products.css";
import "../styles/admin-reportes.css";

export default function AdminReportes() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
    const [salesType, setSalesType] = useState("todas"); // todas, local, domicilio
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        setCurrentPage(1);
        loadData(selectedDay, 1, salesType);
    }, [selectedDay, salesType]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        loadData(selectedDay, page, salesType);
    };

    const loadData = async (date, page = 1, type = "todas") => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const data = await getOrders(date, page, type);
            setOrders(Array.isArray(data) ? data : data.results);
            setTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
        } catch (error) {
            console.error("Error cargando reportes:", error);
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    const getFilteredOrders = () => {
        if (salesType === "todas") return orders;
        return orders.filter(order => order.tipo_pedido === salesType);
    };

    const filteredOrders = getFilteredOrders();
    const totalSales = filteredOrders.reduce((acc, order) => acc + parseFloat(order.total), 0);

    return (
        <div className={`dashboard-root ${collapsed ? "sidebar-collapsed" : ""}`}>
            <Header onToggle={() => setCollapsed(!collapsed)} />
            <Sidebar user={user} />

            <main className="app-main">
                <div className="admin-container">
                    <header className="page-header">
                        <h2>Reportes de Ventas</h2>
                    </header>

                    <section className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Filtros de Reporte</h3>
                                <p style={{ color: '#666', fontSize: '14px' }}>Selecciona el periodo para visualizar las ventas.</p>
                            </div>
                            <div className="filter-controls" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div className="input-group" style={{ display: 'flex', width: '280px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd', position: 'relative' }}>
                                        <input
                                            type="date"
                                            className="form-control date-picker-input"
                                            value={selectedDay}
                                            onChange={(e) => setSelectedDay(e.target.value)}
                                            style={{
                                                border: 'none',
                                                padding: '10px 15px',
                                                fontWeight: '600',
                                                outline: 'none',
                                                flex: 1
                                            }}
                                        />
                                        <span className="input-group-text" style={{
                                            background: '#ffb703',
                                            borderLeft: '1px solid #ddd',
                                            color: '#333',
                                            padding: '10px 15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}>
                                            <i className="bi bi-calendar3" style={{ color: '#000' }}></i>
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDay("")}
                                        className="btn btn-warning"
                                        style={{
                                            padding: '10px 25px',
                                            fontWeight: '700',
                                            borderRadius: '6px',
                                            color: '#000'
                                        }}
                                    >Ver Todo</button>
                                </div>

                                <select
                                    className="form-select"
                                    value={salesType}
                                    onChange={(e) => setSalesType(e.target.value)}
                                    style={{
                                        width: '280px',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        padding: '10px 15px',
                                        border: '1px solid #ddd',
                                        boxShadow: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="todas">Todas las ventas</option>
                                    <option value="local">Ventas local</option>
                                    <option value="domicilio">Ventas domicilio</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div className="summary-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Ventas del Periodo</span>
                            <h3 style={{ fontSize: '32px', color: '#e63946', margin: '10px 0' }}>${totalSales.toLocaleString()}</h3>
                            <span style={{ fontSize: '13px', color: '#2da44e', fontWeight: '700' }}>{filteredOrders.length} Pedidos Procesados</span>
                        </div>
                    </div>

                    <section className="table-section">
                        <h3>Detalle de Ventas ({selectedDay ? selectedDay.split('-').reverse().join('/') : 'Historial Completo'})</h3>
                        {loading ? <p>Cargando datos...</p> : (
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Tipo</th>
                                        <th>Dirección/Mesa</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                                        <tr key={order.id}>

                                            <td>{new Date(order.fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                            <td>{order.nombre_cliente}</td>
                                            <td><span className="status-badge" style={{ backgroundColor: '#f0f0f0', color: '#333' }}>{order.tipo_pedido.toUpperCase()}</span></td>
                                            <td>{order.tipo_pedido === 'local' ? `Mesa ${order.numero_mesa}` : (order.direccion || 'Domicilio')}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '700' }}>${parseFloat(order.total).toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No se encontraron ventas en este periodo.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        <Pagination
                            count={totalCount}
                            currentPage={currentPage}
                            pageSize={PAGE_SIZE}
                            onPageChange={handlePageChange}
                        />
                    </section>
                </div>
            </main>

        </div>
    );
}
