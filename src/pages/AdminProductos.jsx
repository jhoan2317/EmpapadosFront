import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, getProduct } from "../services/productService";
import { getImages } from "../services/galleryService";
import { uploadImageCloudinary, getOptimizedImage } from "../services/cloudinaryService";
import { useLoading } from "../context/LoadingContext";
import { LOADING_CONFIG } from "../components/GlobalSpinner";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ModernModal from "../components/ModernModal";
import Pagination from "../components/Pagination";
import "../styles/dashboard.css";
import "../styles/admin-products.css";
import "../styles/admin-productos.css";

// Iconos definidos por clases de Bootstrap Icons
const ViewIcon = () => <i className="bi bi-eye-fill" style={{ color: '#007bff' }}></i>;
const EditIcon = () => <i className="bi bi-pencil-fill" style={{ color: '#ffb703' }}></i>;
const TrashIcon = () => <i className="bi bi-trash3-fill" style={{ color: '#dc3545' }}></i>;

export default function AdminProductos() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [gallery, setGallery] = useState([]);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        precio: "",
        categoria: "",
        activo: true,
        imagen: null,
        imagen_galeria: null
    });

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage]);

    const loadData = async (page = 1) => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const [prodsData, cats, imgs] = await Promise.all([getProducts(page), getCategories(), getImages()]);
            setProducts(Array.isArray(prodsData) ? prodsData : prodsData.results);
            setTotalCount(prodsData.count || (Array.isArray(prodsData) ? prodsData.length : 0));
            setCategories(cats);
            setGallery(imgs);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            showLoading("Subiendo imagen a la nube...");
            const result = await uploadImageCloudinary(file);
            setFormData({ ...formData, imagen: result.secure_url, imagen_galeria: null });
            setSelectedGalleryImg(null);
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo subir la imagen a Cloudinary.", type: "error" });
        } finally {
            setIsUploading(false);
            hideLoading();
        }
    };

    const handleSelectFromGallery = (img) => {
        setSelectedGalleryImg(img);
        setFormData({ ...formData, imagen_galeria: img.id, imagen: null });
        setShowGalleryModal(false);
    };

    const resetForm = () => {
        setFormData({ nombre: "", descripcion: "", precio: "", categoria: "", activo: true, imagen: null, imagen_galeria: null });
        setEditingId(null);
        setSelectedGalleryImg(null);
        setShowProductModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("nombre", formData.nombre);
        data.append("descripcion", formData.descripcion || "");
        data.append("precio", formData.precio);
        data.append("categoria", formData.categoria);
        data.append("activo", formData.activo);
        if (formData.imagen_galeria) {
            data.append("imagen_galeria", formData.imagen_galeria);
        }

        if (formData.imagen) {
            data.append("imagen", formData.imagen);
        }

        try {
            showLoading(editingId ? LOADING_CONFIG.TEXTS.SAVING : LOADING_CONFIG.TEXTS.SAVING);
            if (editingId) {
                await updateProduct(editingId, data);
                setModalConfig({ isOpen: true, title: "¡Éxito!", message: "El producto ha sido actualizado correctamente.", type: "success" });
            } else {
                await createProduct(data);
                setModalConfig({ isOpen: true, title: "¡Éxito!", message: "El producto ha sido creado correctamente.", type: "success" });
            }
            resetForm();
            setShowProductModal(false);
            await loadData(currentPage);
        } catch (error) {
            console.error("Error en submit:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo procesar la solicitud.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleEdit = async (prodOrId) => {
        const id = typeof prodOrId === 'object' ? prodOrId.id : prodOrId;
        showLoading(LOADING_CONFIG.TEXTS.RECORD_PREP);
        try {
            const prod = await getProduct(id);
            setEditingId(prod.id);
            setFormData({
                nombre: prod.nombre,
                descripcion: prod.descripcion,
                precio: prod.precio,
                categoria: prod.categoria,
                activo: prod.activo,
                imagen: null,
                imagen_galeria: prod.imagen_galeria
            });
            if (prod.imagen_galeria) {
                const galleryImg = gallery.find(g => g.id === prod.imagen_galeria);
                setSelectedGalleryImg(galleryImg);
            } else {
                setSelectedGalleryImg(null);
            }
            setShowProductModal(true);
        } catch (error) {
            console.error("Error al obtener producto:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo cargar la información actualizada del producto.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleView = async (prodOrId) => {
        const id = typeof prodOrId === 'object' ? prodOrId.id : prodOrId;
        showLoading(LOADING_CONFIG.TEXTS.PREPARING);
        try {
            const prod = await getProduct(id);
            setViewingProduct(prod);
        } catch (error) {
            console.error("Error al obtener producto:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo cargar el detalle del producto.", type: "error" });
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
        // Cerramos el modal de confirmación inmediatamente para que el spinner sea visible
        setConfirmDelete({ isOpen: false, id: null });

        // Iniciamos el spinner global
        showLoading(LOADING_CONFIG.TEXTS.DELETING);

        // Agregamos un pequeño retraso para asegurar que el usuario vea la acción
        setTimeout(async () => {
            try {
                await deleteProduct(id);
                setModalConfig({
                    isOpen: true,
                    title: "¡Eliminado!",
                    message: "El producto ha sido eliminado permanentemente.",
                    type: "success"
                });
                await loadData(currentPage);
            } catch (error) {
                console.error("Error al eliminar:", error);
                setModalConfig({
                    isOpen: true,
                    title: "Error",
                    message: "No se pudo completar la eliminación. Intente de nuevo.",
                    type: "error"
                });
            } finally {
                hideLoading();
            }
        }, LOADING_CONFIG.DELAYS.CRUD_ACTION);
    };

    return (
        <div className={`dashboard-root ${collapsed ? "sidebar-collapsed" : ""}`}>
            <Header onToggle={() => setCollapsed(!collapsed)} />
            <Sidebar user={user} />

            <main className="app-main">
                <div className="admin-container">
                    <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Gestión de Productos</h2>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ background: '#ffb703', border: 'none', fontWeight: 'bold', color: 'white', padding: '10px 25px' }}
                            onClick={() => { resetForm(); setShowProductModal(true); }}
                        >
                            Agregar
                        </button>
                    </header>

                    <section className="table-section">
                        <h3>Lista de Productos</h3>
                        {loading ? <p>Cargando...</p> : (
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Imagen</th>
                                        <th>Nombre</th>
                                        <th>Precio</th>
                                        <th>Estado</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(prod => {
                                        const tableImg = getOptimizedImage(prod.imagen_url || prod.imagen, "w_100,h_100,c_fill");
                                        return (
                                            <tr key={prod.id}>
                                                <td>
                                                    <div style={{ width: '100px', height: '70px', overflow: 'hidden', borderRadius: '8px', margin: '0 auto' }}>
                                                        <img src={tableImg || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E"} className="table-img" alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                </td>
                                                <td>{prod.nombre}</td>
                                                <td>${parseFloat(prod.precio).toLocaleString()}</td>
                                                <td>
                                                    <span className={`status-badge ${prod.activo ? 'active' : 'inactive'}`}>
                                                        {prod.activo ? "Activo" : "Inactivo"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-btns" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                        <button onClick={() => handleView(prod)} className="action-btn view" title="Ver"><ViewIcon /></button>
                                                        <button onClick={() => handleEdit(prod)} className="action-btn edit" title="Editar"><EditIcon /></button>
                                                        <button onClick={() => handleOpenDeleteConfirm(prod.id)} className="action-btn delete" title="Eliminar"><TrashIcon /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                </div>

                {/* MODAL VISTA PRODUCTO */}
                {viewingProduct && (
                    <div className="modal-overlay" onClick={() => setViewingProduct(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{viewingProduct.nombre}</h3>
                                <button className="close-btn" onClick={() => setViewingProduct(null)}>&times;</button>
                            </div>
                            <div className="modal-body" style={{ textAlign: 'center' }}>
                                <img src={viewingProduct.imagen_url || viewingProduct.imagen} style={{ maxWidth: '100%', borderRadius: '12px', marginBottom: '20px' }} alt="" />
                                <p style={{ fontSize: '18px', fontWeight: '800', color: '#e63946' }}>${parseFloat(viewingProduct.precio).toLocaleString()}</p>
                                <p style={{ color: '#666', marginTop: '10px' }}>{viewingProduct.descripcion || "Sin descripción"}</p>
                                <div style={{ marginTop: '15px' }}>
                                    <span className={`status-badge ${viewingProduct.activo ? 'active' : 'inactive'}`}>
                                        {viewingProduct.activo ? "Disponible" : "No disponible"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* MODAL SELECCIONAR DE GALERIA */}
                {showGalleryModal && (
                    <div className="modal-overlay" onClick={() => setShowGalleryModal(false)}>
                        <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Seleccionar de Galería</h3>
                                <button className="close-btn" onClick={() => setShowGalleryModal(false)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div className="gallery-selector-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', maxHieght: '400px', overflowY: 'auto' }}>
                                    {gallery.length > 0 ? gallery.map(img => (
                                        <div
                                            key={img.id}
                                            className="gallery-option"
                                            onClick={() => handleSelectFromGallery(img)}
                                            style={{ cursor: 'pointer', border: '2px solid #eee', borderRadius: '8px', overflow: 'hidden' }}
                                        >
                                            <img src={img.imagen} style={{ width: '100%', height: '100px', objectFit: 'cover' }} alt="" />
                                        </div>
                                    )) : <p>No hay imágenes en la galería. Sube algunas primero en el menú Galería.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL AGREGAR/EDITAR PRODUCTO */}
                {showProductModal && (
                    <div className="modal-overlay" onClick={resetForm}>
                        <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingId ? "Editar Producto" : "Nuevo Producto"}</h3>
                                <button className="close-btn" onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#666' }}>
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit} className="product-form">
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="mb-3 text-center">
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nombre</label>
                                            <input className="form-control px-3" name="nombre" value={formData.nombre} onChange={handleInputChange} required style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                                        </div>
                                        <div className="mb-3 text-center">
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Precio</label>
                                            <input className="form-control px-3" type="number" name="precio" value={formData.precio} onChange={handleInputChange} required style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                                        </div>
                                        <div className="mb-3 text-center">
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Categoría</label>
                                            <select className="form-select px-3" name="categoria" value={formData.categoria} onChange={handleInputChange} required style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                                <option value="">Seleccione una categoría</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3 text-center">
                                            <label htmlFor="formFile" className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Cargar Imagen</label>
                                            <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>Se recomienda fotos en formato 1:1 (Cuadradas)</p>
                                            <input className="form-control px-3" type="file" id="formFile" onChange={handleFileChange} accept="image/*" style={{ height: '48px', borderRadius: '6px', border: '1px solid #dee2e6', display: 'flex', alignItems: 'center', paddingTop: '10px' }} />
                                            {selectedGalleryImg && (
                                                <div className="mt-2 d-flex align-items-center justify-content-center gap-2">
                                                    <img src={selectedGalleryImg.imagen} style={{ width: '35px', height: '35px', borderRadius: '6px', objectFit: 'cover' }} alt="" />
                                                    <small style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Seleccionada</small>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mb-3 text-center" style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Descripción</label>
                                            <textarea className="form-control px-3" name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="3" style={{ borderRadius: '6px', border: '1px solid #dee2e6' }} />
                                        </div>
                                        <div className="mb-3" style={{ gridColumn: '1 / -1' }}>
                                            <div className="form-check d-flex align-items-center gap-2" style={{ paddingLeft: '0' }}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="activo"
                                                    checked={formData.activo}
                                                    onChange={handleInputChange}
                                                    id="flexCheckIndeterminate"
                                                    style={{ width: '22px', height: '22px', cursor: 'pointer', backgroundColor: formData.activo ? '#ffb703' : '#fff', borderColor: '#ffb703', float: 'none', margin: '0' }}
                                                />
                                                <label className="form-check-label fw-bold" htmlFor="flexCheckIndeterminate" style={{ cursor: 'pointer' }}>
                                                    Producto Activo
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px' }}>
                                        <button
                                            type="submit"
                                            className="btn w-100 py-3"
                                            style={{ background: '#28a745', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '10px', fontSize: '18px' }}
                                        >
                                            {editingId ? "Actualizar Producto" : "Guardar Producto"}
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
                                <i className="fa-solid fa-triangle-exclamation fa-3x" style={{ color: '#dc3545' }}></i>
                            </div>
                            <h3>¿Estás seguro?</h3>
                            <p>Esta acción no se puede deshacer. El producto será eliminado permanentemente.</p>
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
