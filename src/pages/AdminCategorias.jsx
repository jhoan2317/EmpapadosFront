import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/productService";
import { useLoading } from "../context/LoadingContext";
import { LOADING_CONFIG } from "../components/GlobalSpinner";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ModernModal from "../components/ModernModal";
import "../styles/dashboard.css";

const EditIcon = () => <i className="bi bi-pencil-fill" style={{ color: '#ffb703' }}></i>;
const TrashIcon = () => <i className="bi bi-trash3-fill" style={{ color: '#dc3545' }}></i>;

export default function AdminCategorias() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        activa: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error cargando categorías:", error);
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const resetForm = () => {
        setFormData({ nombre: "", activa: true });
        setEditingId(null);
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading(editingId ? LOADING_CONFIG.TEXTS.SAVING : LOADING_CONFIG.TEXTS.SAVING);
            if (editingId) {
                await updateCategory(editingId, formData);
                setModalConfig({ isOpen: true, title: "¡Éxito!", message: "Categoría actualizada.", type: "success" });
            } else {
                await createCategory(formData);
                setModalConfig({ isOpen: true, title: "¡Éxito!", message: "Categoría creada correctamente.", type: "success" });
            }
            resetForm();
            await loadData();
        } catch (error) {
            console.error("Error en submit:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo procesar la solicitud.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({
            nombre: cat.nombre,
            activa: cat.activa
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ isOpen: false, id: null });
        showLoading(LOADING_CONFIG.TEXTS.DELETING);
        try {
            await deleteCategory(id);
            setModalConfig({ isOpen: true, title: "¡Eliminado!", message: "Categoría eliminada.", type: "success" });
            await loadData();
        } catch (error) {
            console.error("Error al eliminar:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo eliminar la categoría.", type: "error" });
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
                        <h2>Gestión de Categorías</h2>
                        <button
                            className="btn btn-secondary"
                            style={{ background: '#ffb703', border: 'none', fontWeight: 'bold', color: 'white', padding: '10px 25px' }}
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            Agregar Categoría
                        </button>
                    </header>

                    <section className="table-section">
                        <h3>Lista de Categorías</h3>
                        {loading ? <p>Cargando...</p> : (
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Estado</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(cat => (
                                        <tr key={cat.id}>
                                            <td>{cat.nombre}</td>
                                            <td>
                                                <span className={`status-badge ${cat.activa ? 'active' : 'inactive'}`}>
                                                    {cat.activa ? "Activa" : "Inactiva"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btns" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button onClick={() => handleEdit(cat)} className="action-btn edit" title="Editar"><EditIcon /></button>
                                                    <button onClick={() => setConfirmDelete({ isOpen: true, id: cat.id })} className="action-btn delete" title="Eliminar"><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                </div>

                {showModal && (
                    <div className="modal-overlay" onClick={resetForm}>
                        <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingId ? "Editar Categoría" : "Nueva Categoría"}</h3>
                                <button className="close-btn" onClick={resetForm}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Nombre de la Categoría</label>
                                        <input
                                            className="form-control"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            required
                                            style={{ height: '48px' }}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="activa"
                                                checked={formData.activa}
                                                onChange={handleInputChange}
                                                id="activaCheck"
                                            />
                                            <label className="form-check-label fw-bold" htmlFor="activaCheck">Categoría Activa</label>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-success w-100 py-3 mt-3"
                                        style={{ fontWeight: 'bold', fontSize: '18px' }}
                                    >
                                        {editingId ? "Actualizar" : "Guardar"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {confirmDelete.isOpen && (
                    <div className="modal-overlay" onClick={() => setConfirmDelete({ isOpen: false, id: null })}>
                        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <h3>¿Eliminar Categoría?</h3>
                            <p>Esta acción no se puede deshacer.</p>
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
