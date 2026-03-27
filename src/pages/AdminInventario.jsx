import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getInventory, updateInventory, createInventoryEntry, registerInventoryExit, getInventoryItem, getInventorySummary, getMovements, deleteInventoryEntry, registerTasting } from "../services/inventoryService";
import { getCategories, getProducts } from "../services/productService";
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
    const [collapsed, setCollapsed] = useState(true);
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nombre_ingrediente: "",
        categoria: "",
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

    // Estado para Resumen de Movimientos (Cards)
    const [summaryData, setSummaryData] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    // Estado para Degustaciones
    const [tastingModalOpen, setTastingModalOpen] = useState(false);
    const [tastingData, setTastingData] = useState({
        producto_id: "",
        cantidad: 1,
        descripcion: ""
    });
    const [productsList, setProductsList] = useState([]);
    const [tastingHistory, setTastingHistory] = useState([]);
    const [tastPage, setTastPage] = useState(1);
    const [tastTotal, setTastTotal] = useState(0);

    const UNIDADES = [
        { value: 'unidades', label: 'Unidades' },
        { value: 'kg', label: 'Kilogramos' },
        { value: 'g', label: 'Gramos' },
        { value: 'l', label: 'Litros' },
        { value: 'ml', label: 'Mililitros' }
    ];

    useEffect(() => {
        loadData(currentPage);
        loadSummary();
        loadTastingHistory(tastPage);
    }, [currentPage, tastPage]);

    const loadData = async (page = 1) => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const [data, catsData, prodsData] = await Promise.all([
                getInventory(page),
                getCategories(),
                getProducts()
            ]);
            setInventory(Array.isArray(data) ? data : (data.results || []));
            setTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
            setCategories(Array.isArray(catsData) ? catsData : (catsData.results || []));
            setProductsList(Array.isArray(prodsData) ? prodsData : (prodsData.results || []));
        } catch (error) {
            console.error("Error cargando inventario:", error);
        } finally {
            hideLoading();
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        try {
            const data = await getInventorySummary();
            setSummaryData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando resumen de inventario:", error);
        }
    };

    const loadTastingHistory = async (page = 1) => {
        try {
            const data = await getMovements(page);
            const allMovements = Array.isArray(data) ? data : (data.results || []);
            // Filtramos solo los movimientos que contengan "DEGUSTACIÓN" en el motivo
            const degustaciones = allMovements.filter(mov => mov.motivo && mov.motivo.includes("DEGUSTACIÓN"));
            
            // Agrupar por motivo, usuario y fecha aproximada para que no salga un movimiento por ingrediente
            const grouped = {};
            degustaciones.forEach(mov => {
                const fechaAprox = new Date(mov.fecha).toISOString().slice(0, 16); // Hasta los minutos
                const key = `${mov.motivo}_${mov.usuario}_${fechaAprox}`;
                
                if (!grouped[key]) {
                    // Extraer información usando regex "DEGUSTACIÓN (Cantidadx Nombre): Descripcion"
                    // Si no hace match, al menos guardamos el motivo completo
                    const match = mov.motivo.match(/^DEGUSTACI(?:Ó|O)N \((.*)\):\s*(.*)$/i);
                    let producto = "Producto";
                    let persona = mov.motivo;
                    
                    if (match) {
                        producto = match[1];
                        persona = match[2];
                    }

                    grouped[key] = {
                        id: mov.id,
                        fecha: mov.fecha,
                        producto: producto,
                        persona: persona,
                        usuario: mov.usuario
                    };
                }
            });

            // Convertir a array y ordenar por fecha más reciente
            const groupedArray = Object.values(grouped).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            setTastingHistory(groupedArray);
            setTastTotal(groupedArray.length);
        } catch (error) {
            console.error("Error cargando historial de degustaciones:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ nombre_ingrediente: "", categoria: "", stock: 0, stock_minimo: 0, unidad_medida: "unidades" });
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
                categoria: item.categoria || "",
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
            await loadSummary();
        } catch (error) {
            console.error("Error al registrar salida:", error);
            setModalConfig({ isOpen: true, title: "Error", message: error.response?.data?.error || "No se pudo registrar la salida.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleTastingSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading(LOADING_CONFIG.TEXTS.SAVING);
            await registerTasting(tastingData);
            setModalConfig({ isOpen: true, title: "Degustación Registrada", message: "Se han descontado los ingredientes correspondientes a la receta.", type: "success" });
            setTastingModalOpen(false);
            setTastingData({ producto_id: "", cantidad: 1, descripcion: "" });
            await loadData(currentPage);
            await loadSummary();
            await loadTastingHistory(1);
        } catch (error) {
            console.error("Error al registrar degustación:", error);
            setModalConfig({ isOpen: true, title: "Error", message: error.response?.data?.error || "Error registrando degustación. Asegúrate de que el producto tiene receta.", type: "error" });
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
                    <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <h2>Gestión de Inventario de Ingredientes</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn"
                                style={{ background: '#17a2b8', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', border: 'none' }}
                                onClick={() => setTastingModalOpen(true)}
                            >
                                <i className="bi bi-gift-fill me-2"></i> Registrar Degustación
                            </button>
                            <button
                                className="btn"
                                style={{ background: '#ffb703', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', border: 'none' }}
                                onClick={() => setShowModal(true)}
                            >
                                <i className="bi bi-plus-lg me-2"></i> Agregar
                            </button>
                        </div>
                    </header>



                    <section className="table-section">
                        <h3>Estado del Inventario</h3>
                        {loading ? <p>Cargando...</p> : (
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Ingrediente</th>
                                        <th>Categoría</th>
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
                                                <td><span className="badge bg-light text-dark" style={{ fontSize: '11px', border: '1px solid #ddd' }}>{item.categoria_nombre || 'General'}</span></td>
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
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No hay ingredientes registrados en el inventario.</td>
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

                    <section className="mt-5" style={{ marginTop: '50px' }}>
                        <h3>Balance por Ingrediente</h3>
                        <div className="row g-4 mt-3">
                            {summaryData.length > 0 ? summaryData.map(item => (
                                <div className="col-md-4 col-sm-6" key={item.id}>
                                    <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <div className="card-header border-bottom-0 pt-4 pb-2 text-center" style={{ backgroundColor: '#fff' }}>
                                            <h5 style={{ fontWeight: 'bold', margin: 0, color: '#333' }}>{item.nombre}</h5>
                                        </div>
                                        <div className="card-body text-center">
                                            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#6c757d', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Inicial / Ingresos</div>
                                                <div style={{ fontSize: '24px', fontWeight: '800', color: '#28a745' }}>{parseFloat(item.total_ingreso).toLocaleString()} <span style={{fontSize: '14px', fontWeight: 'normal', color: '#666'}}>{item.unidad}</span></div>
                                            </div>
                                            <div style={{ padding: '15px', backgroundColor: '#fff5f5', borderRadius: '10px' }}>
                                                <div style={{ fontSize: '13px', color: '#6c757d', textTransform: 'uppercase', fontWeight: 'bold' }}>Se Gastaron</div>
                                                <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc3545' }}>{parseFloat(item.total_salida).toLocaleString()} <span style={{fontSize: '14px', fontWeight: 'normal', color: '#666'}}>{item.unidad}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-12 text-center" style={{ padding: '40px', color: '#999' }}>Ningún ingrediente para mostrar en el balance.</div>
                            )}
                        </div>
                    </section>

                    <section className="mt-5" style={{ marginTop: '50px' }}>
                        <h3>Historial de Degustaciones</h3>
                        <div className="row g-4 mt-3">
                            {tastingHistory.length > 0 ? tastingHistory.map(mov => (
                                <div className="col-md-4 col-sm-6" key={mov.id}>
                                    <div className="card shadow-sm h-100 border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <div className="card-header border-bottom-0 pt-4 pb-2" style={{ backgroundColor: '#fff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h5 style={{ fontWeight: 'bold', margin: 0, color: '#17a2b8' }}>
                                                    <i className="bi bi-person-fill me-2"></i>
                                                    {mov.persona}
                                                </h5>
                                            </div>
                                            <p className="text-muted mb-0 mt-3" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                                <i className="bi bi-box-seam me-1"></i>
                                                Producto: <span style={{ color: '#333' }}>{mov.producto}</span>
                                            </p>
                                        </div>
                                        <div className="card-body py-2">
                                            <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                                                <i className="bi bi-calendar-event me-1"></i>
                                                Fecha: <span style={{ color: '#555' }}>{new Date(mov.fecha).toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div className="card-footer bg-white border-top-0 pb-3 pt-2" style={{ fontSize: '13px', color: '#888' }}>
                                            Autorizado por: <strong>{mov.usuario}</strong>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-12 text-center" style={{ padding: '40px', color: '#999', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                                    <i className="bi bi-info-circle display-4 d-block mb-3 text-muted"></i>
                                    Ninguna degustación registrada recientemente.
                                </div>
                            )}
                        </div>
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
                                        <div className="mb-3 text-center" style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Categoría (Vinculada a Producto)</label>
                                            <select
                                                className="form-select px-3"
                                                name="categoria"
                                                value={formData.categoria}
                                                onChange={handleInputChange}
                                                style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }}
                                            >
                                                <option value="">Seleccione una categoría</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                                ))}
                                            </select>
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
                )
                }
            </main >

            {/* Modal de Salida por Degustación */}
            {
                tastingModalOpen && (
                    <div className="modal-overlay" onClick={() => setTastingModalOpen(false)}>
                        <div className="modal-content" style={{ maxWidth: '450px', padding: '30px' }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ marginBottom: '20px', color: '#17a2b8' }}>
                                <i className="bi bi-gift-fill me-2"></i> Registro de Degustación
                            </h3>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                                Esto descontará los ingredientes del inventario base a la receta del producto, sin afectar las ventas.
                            </p>
                            <form onSubmit={handleTastingSubmit}>
                                <div className="form-group mb-3">
                                    <label style={{ fontWeight: 'bold' }}>Producto Consumido</label>
                                    <select
                                        className="form-select"
                                        value={tastingData.producto_id}
                                        onChange={e => setTastingData({ ...tastingData, producto_id: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">Seleccione el producto...</option>
                                        {productsList.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group mb-3">
                                    <label style={{ fontWeight: 'bold' }}>Cantidad de Productos</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={tastingData.cantidad}
                                        onChange={e => setTastingData({ ...tastingData, cantidad: parseInt(e.target.value) || 1 })}
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label style={{ fontWeight: 'bold' }}>Empleado / Descripción</label>
                                    <input
                                        type="text"
                                        value={tastingData.descripcion}
                                        onChange={e => setTastingData({ ...tastingData, descripcion: e.target.value })}
                                        placeholder="Ej: Degustación para Juan"
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setTastingModalOpen(false)} style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" style={{ background: '#17a2b8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Degustación</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal de Salida */}
            {
                exitModalOpen && (
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
                )
            }

        </div >
    );
}
