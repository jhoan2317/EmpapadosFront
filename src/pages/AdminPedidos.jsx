import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getOrders, updateOrderStatus, updateOrder, deleteOrder, getOrder } from "../services/orderService";
import { getGlobalConfig } from "../services/marketingService";
import { getProducts } from "../services/productService";
import { printThermalTicket } from "../services/printService";
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
const PrintIcon = () => <i className="bi bi-printer-fill" style={{ color: '#6c757d' }}></i>;
const CashIcon = () => <i className="bi bi-cash" style={{ color: '#28a745' }}></i>;
const DeliverIcon = () => <i className="bi bi-check-square" style={{ color: '#00b4d8' }}></i>;

export default function AdminPedidos() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(true);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [marketingConfig, setMarketingConfig] = useState(null);
    const [products, setProducts] = useState([]);
    
    // States for editing order
    const [editedOrderStatus, setEditedOrderStatus] = useState("");
    const [editedOrderNotes, setEditedOrderNotes] = useState("");
    const [editedOrderDetails, setEditedOrderDetails] = useState([]);
    const [newProductSelected, setNewProductSelected] = useState("");
    const [newProductQuantity, setNewProductQuantity] = useState(1);
    
    const PAGE_SIZE = 10;

    useEffect(() => {
        loadData(currentPage);
        loadConfig();
        loadProducts();
    }, [currentPage]);
    
    const loadProducts = async () => {
        try {
            const prods = await getProducts();
            setProducts(Array.isArray(prods) ? prods : (prods.results || []));
        } catch (error) {
            console.error("Error cargando productos:", error);
        }
    };

    const loadConfig = async () => {
        try {
            const config = await getGlobalConfig();
            setMarketingConfig(Array.isArray(config) ? config[0] : config);
        } catch (error) {
            console.error("Error cargando configuración:", error);
        }
    };

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

    const handleEditOrder = async (orderOrId) => {
        const id = typeof orderOrId === 'object' ? orderOrId.id : orderOrId;
        showLoading(LOADING_CONFIG.TEXTS.RECORD_PREP);
        try {
            const order = await getOrder(id);
            setEditingOrder(order);
            setEditedOrderStatus(order.estado);
            setEditedOrderNotes(order.observaciones || "");
            setEditedOrderDetails(order.detalles.map(d => ({...d})));
            setNewProductSelected("");
            setNewProductQuantity(1);
        } catch (error) {
            console.error("Error al obtener pedido:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo preparar el cambio de estado.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleSaveOrderChanges = async () => {
        if (!editingOrder) return;
        try {
            showLoading(LOADING_CONFIG.TEXTS.SAVING);
            
            const updatedData = {
                estado: editedOrderStatus,
                observaciones: editedOrderNotes,
                detalles: editedOrderDetails.map(d => ({
                    producto: d.producto,
                    cantidad: d.cantidad
                }))
            };
            
            await updateOrder(editingOrder.id, updatedData);
            setEditingOrder(null);
            setModalConfig({ isOpen: true, title: "Pedido Actualizado", message: "Los cambios en el pedido se guardaron correctamente.", type: "success" });
            await loadData(currentPage);
        } catch (error) {
            console.error("Error al actualizar pedido:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudieron guardar los cambios del pedido.", type: "error" });
        } finally {
            hideLoading();
        }
    };
    
    const handleAddProductToOrder = () => {
        if (!newProductSelected) return;
        const selectedProdObj = products.find(p => p.id === parseInt(newProductSelected));
        if (!selectedProdObj) return;
        
        const existingIndex = editedOrderDetails.findIndex(d => d.producto === selectedProdObj.id);
        
        let updatedDetails = [...editedOrderDetails];
        if (existingIndex >= 0) {
            updatedDetails[existingIndex].cantidad += parseInt(newProductQuantity);
            updatedDetails[existingIndex].subtotal = parseFloat(updatedDetails[existingIndex].precio_unitario || selectedProdObj.precio) * updatedDetails[existingIndex].cantidad;
        } else {
            updatedDetails.push({
                producto: selectedProdObj.id,
                producto_nombre: selectedProdObj.nombre,
                cantidad: parseInt(newProductQuantity),
                precio_unitario: selectedProdObj.precio,
                subtotal: parseFloat(selectedProdObj.precio) * parseInt(newProductQuantity)
            });
        }
        
        setEditedOrderDetails(updatedDetails);
        setNewProductSelected("");
        setNewProductQuantity(1);
    };

    const handleUpdateDetailQuantity = (index, newQty) => {
        if (newQty < 1) return;
        let updatedDetails = [...editedOrderDetails];
        updatedDetails[index].cantidad = newQty;
        updatedDetails[index].subtotal = parseFloat(updatedDetails[index].precio_unitario || 0) * newQty; // This is just for UI visualization
        setEditedOrderDetails(updatedDetails);
    };

    const handleRemoveDetail = (index) => {
        let updatedDetails = [...editedOrderDetails];
        updatedDetails.splice(index, 1);
        setEditedOrderDetails(updatedDetails);
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

    const handlePrint = (order) => {
        const ticketData = {
            id: order.id,
            puesto: order.puesto || order.id,
            cliente_nombre: order.nombre_cliente,
            telefono: order.telefono,
            direccion: order.direccion,
            numero_mesa: order.numero_mesa,
            tipo_entrega: order.tipo_pedido,
            total: parseFloat(order.total),
            observaciones: order.observaciones,
            items: order.detalles.map(d => ({
                cantidad: d.cantidad,
                producto_nombre: d.producto_nombre,
                precio_total: parseFloat(d.subtotal),
                adiciones: [] // Las adiciones ya están en observaciones o en el precio_unitario
            }))
        };
        printThermalTicket(ticketData, marketingConfig);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pendiente': return { backgroundColor: '#fff3cd', color: '#856404' }; // Amarillo
            case 'entregado': return { backgroundColor: '#cce5ff', color: '#004085' }; // Azul
            case 'pagado': return { backgroundColor: '#d4edda', color: '#155724' };    // Verde
            case 'cancelado': return { backgroundColor: '#f8d7da', color: '#721c24' }; // Rojo
            default: return { backgroundColor: '#f8f9fa', color: '#333' };
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
                                        <tr
                                            key={order.id}
                                            className={order.estado === 'cancelado' ? 'row-cancelled' : ''}
                                        >

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
                                                    <button onClick={() => handleEditOrder(order)} className="action-btn edit" title="Editar Pedido"><EditIcon /></button>
                                                    <button onClick={() => handleOpenDeleteConfirm(order.id)} className="action-btn delete" title="Eliminar"><TrashIcon /></button>
                                                    <button onClick={() => handlePrint(order)} className="action-btn print" title="Imprimir Ticket"><PrintIcon /></button>
                                                    {order.estado !== 'cancelado' && (
                                                        <>
                                                            <button onClick={() => handleStatusUpdate(order.id, 'entregado')} className="action-btn deliver" title="Marcar como Entregado"><DeliverIcon /></button>
                                                            <button onClick={() => handleStatusUpdate(order.id, 'pagado')} className="action-btn pay" title="Marcar como Pagado"><CashIcon /></button>
                                                        </>
                                                    )}
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

                {/* MODAL EDITAR PEDIDO */}
                {editingOrder && (
                    <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
                        <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Editar Pedido #{editingOrder.id}</h3>
                                <button className="close-btn" onClick={() => setEditingOrder(null)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    <div style={{ flex: '1 1 200px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Estado del Pedido:</label>
                                        <select
                                            value={editedOrderStatus}
                                            onChange={(e) => setEditedOrderStatus(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="procesando">Procesando</option>
                                            <option value="entregado">Entregado</option>
                                            <option value="pagado">Pagado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: '1 1 250px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notas / Observaciones:</label>
                                        <textarea
                                            value={editedOrderNotes}
                                            onChange={(e) => setEditedOrderNotes(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '38px', resize: 'vertical' }}
                                            rows="1"
                                        />
                                    </div>
                                </div>

                                <hr />
                                <h5 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Productos del Pedido</h5>
                                
                                <div className="add-product-section" style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', background: '#f8f9fa', padding: '10px', borderRadius: '8px', flexWrap: 'wrap' }}>
                                    <select 
                                        value={newProductSelected} 
                                        onChange={(e) => setNewProductSelected(e.target.value)}
                                        style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">-- Añadir Producto --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre} - ${parseFloat(p.precio).toLocaleString()}</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={newProductQuantity} 
                                        onChange={(e) => setNewProductQuantity(e.target.value)}
                                        style={{ width: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                    <button 
                                        onClick={handleAddProductToOrder}
                                        style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        Añadir
                                    </button>
                                </div>

                                <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    <table className="table table-sm align-middle">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th style={{ width: '90px', textAlign: 'center' }}>Cant.</th>
                                                <th>Subtotal</th>
                                                <th style={{ width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editedOrderDetails.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.producto_nombre}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            value={item.cantidad} 
                                                            onChange={(e) => handleUpdateDetailQuantity(i, parseInt(e.target.value) || 1)}
                                                            style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        ${parseFloat(item.subtotal || (item.precio_unitario * item.cantidad) || 0).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <button 
                                                            onClick={() => handleRemoveDetail(i)} 
                                                            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                                                            title="Eliminar producto"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {editedOrderDetails.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted" style={{ padding: '15px' }}>
                                                        No hay productos en este pedido.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '15px' }}>
                                    <h5 style={{ fontWeight: 'bold', margin: 0, color: '#e63946' }}>
                                        Total Calculado: ${editedOrderDetails.reduce((sum, item) => sum + parseFloat(item.subtotal || (item.precio_unitario * item.cantidad) || 0), 0).toLocaleString()}
                                    </h5>
                                    <div>
                                        <button
                                            onClick={() => setEditingOrder(null)}
                                            style={{ marginRight: '10px', padding: '10px 20px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveOrderChanges}
                                            style={{ padding: '10px 20px', background: '#198754', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </div>
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
