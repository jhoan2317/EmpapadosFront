import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getImages, uploadImage, deleteImage } from "../services/galleryService";
import { useLoading } from "../context/LoadingContext";
import { LOADING_CONFIG } from "../components/GlobalSpinner";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ModernModal from "../components/ModernModal";
import "../styles/dashboard.css";
import "../styles/admin-products.css";
import "../styles/admin-galeria.css";

// Iconos definidos por clases de Bootstrap Icons
const TrashIcon = () => <i className="bi bi-trash3-fill" style={{ color: '#ffffff' }}></i>;

const UploadIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);

export default function AdminGaleria() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(false);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const data = await getImages();
            setImages(data);
        } catch (error) {
            console.error("Error cargando imágenes:", error);
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert("Selecciona una imagen primero");

        const formData = new FormData();
        formData.append("imagen", selectedFile);
        if (title) formData.append("titulo", title);

        try {
            showLoading(LOADING_CONFIG.TEXTS.SAVING);
            setUploading(true);
            await uploadImage(formData);
            setTitle("");
            setSelectedFile(null);
            // Reset input file
            e.target.reset();
            await loadImages();
            setModalConfig({ isOpen: true, title: "¡Subida!", message: "La imagen se guardó en la galería correctamente.", type: "success" });
        } catch (error) {
            console.error("Error al subir:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo subir la imagen.", type: "error" });
        } finally {
            setUploading(false);
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
        setConfirmDelete({ isOpen: false, id: null });
        showLoading(LOADING_CONFIG.TEXTS.DELETING);

        setTimeout(async () => {
            try {
                await deleteImage(id);
                setModalConfig({ isOpen: true, title: "Eliminada", message: "La imagen ha sido removida de la galería.", type: "success" });
                await loadImages();
            } catch (error) {
                console.error("Error al eliminar:", error);
                setModalConfig({ isOpen: true, title: "Error", message: "No se pudo eliminar la imagen.", type: "error" });
            } finally {
                hideLoading();
            }
        }, LOADING_CONFIG.DELAYS.CRUD_ACTION);
    };

    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url);
        setModalConfig({ isOpen: true, title: "Copiado", message: "Enlace de descarga copiado al portapapeles.", type: "info" });
    };

    return (
        <div className={`dashboard-root ${collapsed ? "sidebar-collapsed" : ""}`}>
            <Header onToggle={() => setCollapsed(!collapsed)} />
            <Sidebar user={user} />

            <main className="app-main">
                <div className="admin-container">
                    <header className="page-header">
                        <h2>Banco de Imágenes (Galería)</h2>
                    </header>

                    <section className="form-section">
                        <h3>Subir Nueva Imagen</h3>
                        <form onSubmit={handleUpload} className="product-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Título / Descripción (Opcional)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ej: Hamburguesa Especial"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Archivo de Imagen</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input type="file" onChange={handleFileChange} accept="image/*" required />
                                        <button type="submit" className="btn-save" style={{ marginTop: 0, width: 'fit-content' }} disabled={uploading}>
                                            {uploading ? "Subiendo..." : "Subir a Galería"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </section>

                    <section className="table-section">
                        <h3>Tus Imágenes</h3>
                        {loading ? <p>Cargando galería...</p> : (
                            <div className="gallery-grid">
                                {images.length > 0 ? images.map(img => (
                                    <div className="gallery-item" key={img.id}>
                                        <div className="image-wrapper">
                                            <img src={img.imagen} alt={img.titulo} />
                                            <div className="image-overlay">
                                                <button onClick={() => copyToClipboard(img.imagen)} className="overlay-btn">🔗 Link</button>
                                                <button onClick={() => handleOpenDeleteConfirm(img.id)} className="overlay-btn delete"><TrashIcon /></button>
                                            </div>
                                        </div>
                                        <div className="image-info">
                                            <p className="image-title">{img.titulo || "Sin título"}</p>
                                            <small className="image-date">{new Date(img.creado_en).toLocaleDateString()}</small>
                                        </div>
                                    </div>
                                )) : (
                                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>No hay imágenes en la galería.</p>
                                )}
                            </div>
                        )}
                    </section>
                </div>
                {/* MODAL CONFIRMACIÓN ELIMINAR */}
                {confirmDelete.isOpen && (
                    <div className="modal-overlay" onClick={() => setConfirmDelete({ isOpen: false, id: null })}>
                        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-icon-container" style={{ marginBottom: '1.5rem' }}>
                                <i className="fa-solid fa-triangle-exclamation fa-3x" style={{ color: '#dc3545' }}></i>
                            </div>
                            <h3>¿Eliminar Imagen?</h3>
                            <p>Esta acción es permanente. ¿Deseas continuar?</p>
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
