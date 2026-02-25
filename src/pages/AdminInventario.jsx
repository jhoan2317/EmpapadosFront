import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getInventory, updateInventory, createInventoryEntry, registerInventoryExit, getInventoryItem, getMovements, deleteInventoryEntry } from "../services/inventoryService";
import { useLoading } from "../context/LoadingContext";
import { LOADING_CONFIG } from "../components/GlobalSpinner";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ModernModal from "../components/ModernModal";
import Pagination from "../components/Pagination";
import "../styles/dashboard.css";
import "../styles/admin-inventario.css";

// Iconos definidos por clases de Bootstrap Icons
const EditIcon = () => <i className="bi bi-pencil-fill" style={{ color: '#ffb703' }}></i>;
const ExitIcon = () => <i className="bi bi-box-arrow-in-right" style={{ color: '#007bff' }}></i>;
const TrashIcon = () => <i className="bi bi-trash3-fill" style={{ color: '#dc3545' }}></i>;

export default function AdminInventario() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nombre_ingrediente: "",
        stock: 0,
        stock_minimo: 0,
        unidad_medida: "unidades"
    });
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

    // Estado para Salida de Inventario
    const [exitModalOpen, setExitModalOpen] = useState(false);
    const [exitData, setExitData] = useState({
        id: null,
        nombre: "",
        cantidad: "",
        motivo: ""
    });

    // Estado para Historial de Movimientos
    const [movements, setMovements] = useState([]);
    const [movPage, setMovPage] = useState(1);
    const [movTotal, setMovTotal] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    const UNIDADES = [
        { value: 'unidades', label: 'Unidades' },
        { value: 'kg', label: 'Kilogramos' },
        { value: 'g', label: 'Gramos' },
        { value: 'l', label: 'Litros' },
        { value: 'ml', label: 'Mililitros' }
    ];

    useEffect(() => {
        loadData(currentPage);
        loadMovements(movPage);
    }, [currentPage, movPage]);

    const loadData = async (page = 1) => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const data = await getInventory(page);
            setInventory(Array.isArray(data) ? data : (data.results || []));
            setTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
        } catch (error) {
            console.error("Error cargando inventario:", error);
        } finally {
            hideLoading();
            setLoading(false);
        }
    };

    const loadMovements = async (page = 1) => {
        try {
            const data = await getMovements(page);
            setMovements(Array.isArray(data) ? data : (data.results || []));
            setMovTotal(data.count || 0);
        } catch (error) {
            console.error("Error cargando movimientos:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ nombre_ingrediente: "", stock: 0, stock_minimo: 0, unidad_medida: "unidades" });
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading(LOADING_CONFIG.TEXTS.SAVING);
            if (editingId) {
                await updateInventory(editingId, formData);
            } else {
                await createInventoryEntry(formData);
            }
            setModalConfig({ isOpen: true, title: editingId ? "¡Actualizado!" : "¡Creado!", message: editingId ? "El inventario ha sido actualizado correctamente." : "El ingrediente ha sido agregado al inventario.", type: "success" });
            resetForm();
            await loadData(currentPage);
        } catch (error) {
            console.error("Error al guardar inventario:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo procesar la solicitud.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleEdit = async (itemOrId) => {
        const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
        showLoading(LOADING_CONFIG.TEXTS.RECORD_PREP);
        try {
            const item = await getInventoryItem(id);
            setEditingId(item.id);
            setFormData({
                nombre_ingrediente: item.nombre_ingrediente,
                stock: item.stock,
                stock_minimo: item.stock_minimo,
                unidad_medida: item.unidad_medida
            });
            setShowModal(true);
        } catch (error) {
            console.error("Error al obtener ingrediente:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo cargar la información del inventario.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleOpenExitModal = async (itemOrId) => {
        const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
        showLoading(LOADING_CONFIG.TEXTS.PREPARING);
        try {
            const item = await getInventoryItem(id);
            setExitData({
                id: item.id,
                nombre: item.nombre_ingrediente,
                cantidad: "",
                motivo: ""
            });
            setExitModalOpen(true);
        } catch (error) {
            console.error("Error al obtener ingrediente:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo preparar la salida del ingrediente.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleExitSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading(LOADING_CONFIG.TEXTS.SAVING);
            await registerInventoryExit({
                ingrediente_id: exitData.id,
                cantidad: parseFloat(exitData.cantidad),
                motivo: exitData.motivo
            });
            setModalConfig({ isOpen: true, title: "Salida Registrada", message: "La salida de inventario se procesó con éxito.", type: "success" });
            setExitModalOpen(false);
            await loadData(currentPage);
            await loadMovements(1);
        } catch (error) {
            console.error("Error al registrar salida:", error);
            setModalConfig({ isOpen: true, title: "Error", message: error.response?.data?.error || "No se pudo registrar la salida.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleDelete = async (id) => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.DELETING);
            await deleteInventoryEntry(id);
            setModalConfig({ isOpen: true, title: "¡Eliminado!", message: "El ingrediente ha sido removido del inventario.", type: "success" });
            setConfirmDelete({ isOpen: false, id: null });
            await loadData(currentPage);
        } catch (error) {
            console.error("Error al eliminar ingrediente:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo eliminar el ingrediente.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    return (
        <div className={`dashboard-root ${collapsed ? "sidebar-collapsed" : ""}`}>
            <Header onToggle={() => setCollapsed(!collapsed)} />
            <Sidebar user={user} />

            <main className="app-main">
                <div className="admin-container">
                    <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Gestión de Inventario de Ingredientes</h2>
                        <button
                            className="btn"
                            style={{ background: '#ffb703', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', border: 'none' }}
                            onClick={() => setShowModal(true)}
                        >
                            Agregar
                        </button>
                    </header>



                    <section className="table-section">
                        <h3>Estado del Inventario</h3>
                        {loading ? <p>Cargando...</p> : (
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Ingrediente</th>
                                        <th>Stock Actual</th>
                                        <th>Stock Mínimo</th>
                                        <th>Unidad</th>
                                        <th>Estado</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.length > 0 ? inventory.map(item => {
                                        const isLowStock = parseFloat(item.stock) <= parseFloat(item.stock_minimo);
                                        return (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: '600' }}>{item.nombre_ingrediente}</td>
                                                <td style={{ fontWeight: '700', color: isLowStock ? '#e63946' : 'inherit' }}>{parseFloat(item.stock).toFixed(2)}</td>
                                                <td>{parseFloat(item.stock_minimo).toFixed(2)}</td>
                                                <td><span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>{item.unidad_medida}</span></td>
                                                <td>
                                                    <span className={`status-badge ${isLowStock ? 'inactive' : 'active'}`}>
                                                        {isLowStock ? "⚠️ Stock Bajo" : "✓ OK"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-btns" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                        <button onClick={() => handleEdit(item)} className="action-btn edit" title="Editar"><EditIcon /></button>
                                                        <button onClick={() => handleOpenExitModal(item)} className="action-btn exit" title="Registrar Salida"><ExitIcon /></button>
                                                        <button onClick={() => setConfirmDelete({ isOpen: true, id: item.id })} className="action-btn delete" title="Eliminar"><TrashIcon /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No hay ingredientes registrados en el inventario.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        <Pagination
                            count={totalCount}
                            currentPage={currentPage}
                            pageSize={PAGE_SIZE}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </section>

                    <section className="table-section mt-5" style={{ marginTop: '50px' }}>
                        <h3>Historial de Salidas / Movimientos</h3>
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Ingrediente</th>
                                    <th>Cantidad</th>
                                    <th>Tipo</th>
                                    <th>Motivo</th>
                                    <th>Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.length > 0 ? movements.map(mov => (
                                    <tr key={mov.id}>
                                        <td>{new Date(mov.fecha).toLocaleString()}</td>
                                        <td><strong>{mov.nombre_ingrediente}</strong></td>
                                        <td style={{ color: mov.tipo_movimiento === 'SALIDA' ? '#e63946' : '#28a745', fontWeight: 'bold' }}>
                                            {mov.tipo_movimiento === 'SALIDA' ? '-' : '+'}{parseFloat(mov.cantidad).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${mov.tipo_movimiento.toLowerCase()}`}>
                                                {mov.tipo_movimiento}
                                            </span>
                                        </td>
                                        <td>{mov.motivo}</td>
                                        <td><small>{mov.usuario}</small></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No hay movimientos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            count={movTotal}
                            currentPage={movPage}
                            pageSize={PAGE_SIZE}
                            onPageChange={(page) => setMovPage(page)}
                        />
                    </section>
                </div>
                <ModernModal
                    isOpen={modalConfig.isOpen}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                />

                {/* MODAL AGREGAR/EDITAR INGREDIENTE */}
                {showModal && (
                    <div className="modal-overlay" onClick={resetForm}>
                        <div className="modal-content" style={{ maxWidth: '500px', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 style={{ margin: 0 }}>{editingId ? "Editar Ingrediente" : "Nuevo Ingrediente"}</h3>
                                <button className="close-btn" onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#666' }}>
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            </div>
                            <div className="modal-body" style={{ paddingTop: '20px' }}>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="mb-3 text-center">
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nombre</label>
                                            <input
                                                className="form-control px-3"
                                                name="nombre_ingrediente"
                                                value={formData.nombre_ingrediente}
                                                onChange={handleInputChange}
                                                required
                                                disabled={editingId}
                                                style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }}
                                            />
                                        </div>
                                        <div className="mb-3 text-center">
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Unidad</label>
                                            <select
                                                className="form-select px-3"
                                                name="unidad_medida"
                                                value={formData.unidad_medida}
                                                onChange={handleInputChange}
                                                required
                                                disabled={editingId}
                                                style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }}
                                            >
                                                {UNIDADES.map(u => (
                                                    <option key={u.value} value={u.value}>{u.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3 text-center">
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Stock Actual</label>
                                            <input
                                                className="form-control px-3"
                                                type="number"
                                                step="0.01"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={handleInputChange}
                                                required
                                                style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }}
                                            />
                                        </div>
                                        <div className="mb-3 text-center">
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Stock Mínimo</label>
                                            <input
                                                className="form-control px-3"
                                                type="number"
                                                step="0.01"
                                                name="stock_minimo"
                                                value={formData.stock_minimo}
                                                onChange={handleInputChange}
                                                required
                                                style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '25px' }}>
                                        <button
                                            type="submit"
                                            className="btn w-100 py-3"
                                            style={{ background: '#28a745', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '10px', fontSize: '18px' }}
                                        >
                                            {editingId ? "Actualizar Ingrediente" : "Guardar Ingrediente"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL CONFIRMACIÓN ELIMINAR */}
                {confirmDelete.isOpen && (
                    <div className="modal-overlay" onClick={() => setConfirmDelete({ isOpen: false, id: null })}>
                        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-icon-container" style={{ marginBottom: '1.5rem' }}>
                                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                            </div>
                            <h3>¿Eliminar Ingrediente?</h3>
                            <p>Esta acción eliminará el ingrediente y todo su historial de movimientos. ¿Deseas continuar?</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                                <button className="btn btn-secondary w-100" onClick={() => setConfirmDelete({ isOpen: false, id: null })}>Cancelar</button>
                                <button className="btn btn-danger w-100" onClick={() => handleDelete(confirmDelete.id)}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal de Salida */}
            {exitModalOpen && (
                <div className="modal-overlay" onClick={() => setExitModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px', padding: '30px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '20px' }}>Registrar Salida: {exitData.nombre}</h3>
                        <form onSubmit={handleExitSubmit}>
                            <div className="form-group">
                                <label>Cantidad a retirar</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={exitData.cantidad}
                                    onChange={e => setExitData({ ...exitData, cantidad: e.target.value })}
                                    required
                                    min="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label>Motivo</label>
                                <textarea
                                    value={exitData.motivo}
                                    onChange={e => setExitData({ ...exitData, motivo: e.target.value })}
                                    placeholder="Ej: Merma, Uso interno, Caducidad..."
                                    rows="3"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button type="button" onClick={() => setExitModalOpen(false)} style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar Salida</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
