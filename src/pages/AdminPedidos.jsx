import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getOrders, updateOrderStatus, deleteOrder, getOrder } from "../services/orderService";
import { useLoading } from "../context/LoadingContext";
import { LOADING_CONFIG } from "../components/GlobalSpinner";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ModernModal from "../components/ModernModal";
import Pagination from "../components/Pagination";
import "../styles/dashboard.css";
import "../styles/admin-products.css";
import "../styles/admin-pedidos.css";

// Iconos definidos por clases de Bootstrap Icons
const ViewIcon = () => <i className="bi bi-eye-fill" style={{ color: '#007bff' }}></i>;
const EditIcon = () => <i className="bi bi-pencil-fill" style={{ color: '#ffb703' }}></i>;
const TrashIcon = () => <i className="bi bi-trash3-fill" style={{ color: '#dc3545' }}></i>;

export default function AdminPedidos() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage]);

    // Bloquear scroll del body cuando hay un modal abierto
    useEffect(() => {
        const isAnyModalOpen = selectedOrder || editingOrder || confirmDelete.isOpen || modalConfig.isOpen;
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedOrder, editingOrder, confirmDelete.isOpen, modalConfig.isOpen]);

    const loadData = async (page = 1) => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const data = await getOrders(null, page);
            setOrders(Array.isArray(data) ? data : (data.results || []));
            setTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
        } catch (error) {
            console.error("Error cargando pedidos:", error);
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.SAVING);
            await updateOrderStatus(id, newStatus);
            setEditingOrder(null);
            setModalConfig({ isOpen: true, title: "Estado Actualizado", message: "El estado del pedido se actualizó correctamente.", type: "success" });
            await loadData(currentPage);
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo actualizar el estado del pedido.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleView = async (orderOrId) => {
        const id = typeof orderOrId === 'object' ? orderOrId.id : orderOrId;
        showLoading(LOADING_CONFIG.TEXTS.PREPARING);
        try {
            const order = await getOrder(id);
            setSelectedOrder(order);
        } catch (error) {
            console.error("Error al obtener pedido:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo cargar el detalle del pedido.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleOpenStatusModal = async (orderOrId) => {
        const id = typeof orderOrId === 'object' ? orderOrId.id : orderOrId;
        showLoading(LOADING_CONFIG.TEXTS.RECORD_PREP);
        try {
            const order = await getOrder(id);
            setEditingOrder(order);
        } catch (error) {
            console.error("Error al obtener pedido:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo preparar el cambio de estado.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleOpenDeleteConfirm = (id) => {
        showLoading(LOADING_CONFIG.TEXTS.DELETE_PREP);
        setTimeout(() => {
            setConfirmDelete({ isOpen: true, id });
            hideLoading();
        }, LOADING_CONFIG.DELAYS.MODAL_WAIT);
    };

    const handleDelete = (id) => {
        // Cerramos el modal de confirmación inmediatamente
        setConfirmDelete({ isOpen: false, id: null });

        // Activamos el spinner
        showLoading(LOADING_CONFIG.TEXTS.DELETING);

        // Retraso para feedback visual consistente
        setTimeout(async () => {
            try {
                await deleteOrder(id);
                setModalConfig({
                    isOpen: true,
                    title: "Pedido Eliminado",
                    message: "La orden ha sido removida del sistema exitosamente.",
                    type: "success"
                });
                await loadData(currentPage);
            } catch (error) {
                console.error("Error al eliminar:", error);
                setModalConfig({
                    isOpen: true,
                    title: "Error",
                    message: "No fue posible eliminar el pedido. Verifique su conexión.",
                    type: "error"
                });
            } finally {
                hideLoading();
            }
        }, LOADING_CONFIG.DELAYS.CRUD_ACTION);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pendiente': return { backgroundColor: '#fff3cd', color: '#856404' };
          //case 'procesando': return { backgroundColor: '#cce5ff', color: '#004085'};
            case 'entregado': return { backgroundColor: '#d4edda', color: '#155724' };
            case 'cancelado': return { backgroundColor: '#f8d7da', color: '#721c24' };
            default: return {};
        }
    };

    return (
        <div className={`dashboard-root ${collapsed ? "sidebar-collapsed" : ""}`}>
            <Header onToggle={() => setCollapsed(!collapsed)} />
            <Sidebar user={user} />

            <main className="app-main">
                <div className="admin-container">
                    <header className="page-header">
                        <h2>Gestión de Pedidos</h2>
                    </header>

                    <section className="table-section">
                        <h3>Ordenes Recibidas</h3>
                        {loading ? <p>Cargando pedidos...</p> : (
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Mesa</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Fecha</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>

                                            <td>
                                                <strong>{order.nombre_cliente}</strong><br />
                                                <small>{order.telefono}</small>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {order.numero_mesa ? (
                                                    <span className="status-badge" style={{ backgroundColor: '#007bff', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                                                        MESA {order.numero_mesa}
                                                    </span>
                                                ) : (
                                                    <span className="status-badge" style={{ backgroundColor: '#6c757d', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                                                        DOMICILIO
                                                    </span>
                                                )}
                                            </td>
                                            <td>${parseFloat(order.total).toLocaleString()}</td>
                                            <td>
                                                <span
                                                    className="status-badge"
                                                    style={{ ...getStatusStyle(order.estado), fontSize: '11px' }}
                                                >
                                                    {order.estado.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>{new Date(order.fecha).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-btns" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button onClick={() => handleView(order)} className="action-btn view" title="Ver Detalle"><ViewIcon /></button>
                                                    <button onClick={() => handleOpenStatusModal(order)} className="action-btn edit" title="Cambiar Estado"><EditIcon /></button>
                                                    <button onClick={() => handleOpenDeleteConfirm(order.id)} className="action-btn delete" title="Eliminar"><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <Pagination
                            count={totalCount}
                            currentPage={currentPage}
                            pageSize={PAGE_SIZE}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                        {!loading && orders.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No hay pedidos.</p>}
                    </section>
                </div>

                {/* MODAL DETALLES */}
                {selectedOrder && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Detalle Pedido #{selectedOrder.id}</h3>
                                <button className="close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                                    <p><strong>Cliente:</strong> {selectedOrder.nombre_cliente}</p>
                                    {selectedOrder.numero_mesa && <p><strong>Mesa:</strong> <span className="badge bg-primary">#{selectedOrder.numero_mesa}</span></p>}
                                    <p><strong>Dirección:</strong> {selectedOrder.direccion || "Local"}</p>
                                    <p><strong>Método de Pago:</strong> {selectedOrder.metodo_pago ? selectedOrder.metodo_pago.replace('_', ' ').toUpperCase() : 'EFECTIVO'}</p>
                                    <p><strong>Notas:</strong> {selectedOrder.observaciones || "Ninguna"}</p>
                                </div>
                                <table className="table table-hover align-middle" style={{ fontSize: '13px' }}>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cant.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.detalles.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.producto_nombre}</td>
                                                <td>{item.cantidad}</td>
                                                <td>${parseFloat(item.subtotal).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h4 style={{ textAlign: 'right', marginTop: '15px', color: '#e63946' }}>Total: ${parseFloat(selectedOrder.total).toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL EDITAR ESTADO */}
                {editingOrder && (
                    <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
                        <div className="modal-content" style={{ maxWidth: '350px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Cambiar Estado #{editingOrder.id}</h3>
                                <button className="close-btn" onClick={() => setEditingOrder(null)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Nuevo Estado:</label>
                                <select
                                    defaultValue={editingOrder.estado}
                                    onChange={(e) => handleStatusUpdate(editingOrder.id, e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="entregado">Entregado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                                <button
                                    onClick={() => setEditingOrder(null)}
                                    style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* MODAL CONFIRMACIÓN ELIMINAR */}
                {confirmDelete.isOpen && (
                    <div className="modal-overlay" onClick={() => setConfirmDelete({ isOpen: false, id: null })}>
                        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-icon-container" style={{ marginBottom: '1.5rem' }}>
                                <i className="fa-solid fa-triangle-exclamation fa-3x" style={{ color: '#dc3545' }}></i>
                            </div>
                            <h3>¿Eliminar Pedido?</h3>
                            <p>¿Estás seguro de que deseas eliminar este pedido permanentemente del sistema?</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                                <button className="btn btn-secondary w-100" onClick={() => setConfirmDelete({ isOpen: false, id: null })}>Cancelar</button>
                                <button className="btn btn-danger w-100" onClick={() => handleDelete(confirmDelete.id)}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}

                <ModernModal
                    isOpen={modalConfig.isOpen}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                />
            </main>

        </div>
    );
}
