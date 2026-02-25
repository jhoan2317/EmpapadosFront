import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
    getHeroSections, createHero, updateHero, deleteHero,
    getFeatures, createFeature, updateFeature, deleteFeature,
    getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
    getGlobalConfig, upsertConfig
} from "../services/marketingService";
import { uploadImageCloudinary, getOptimizedImage } from "../services/cloudinaryService";
import { useLoading } from "../context/LoadingContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ModernModal from "../components/ModernModal";
import "../styles/dashboard.css";

// Iconos
const EditIcon = () => <i className="bi bi-pencil-fill" style={{ color: '#ffb703' }}></i>;
const TrashIcon = () => <i className="bi bi-trash3-fill" style={{ color: '#dc3545' }}></i>;
const CheckIcon = () => <i className="bi bi-check-circle-fill" style={{ color: '#198754' }}></i>;
const XIcon = () => <i className="bi bi-x-circle-fill" style={{ color: '#dc3545' }}></i>;
const ViewIcon = () => <i className="bi bi-eye-fill" style={{ color: '#0d6efd' }}></i>;

export default function AdminMarketing() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const [collapsed, setCollapsed] = useState(false);
    const [data, setData] = useState({
        heroes: [],
        features: [],
        testimonials: [],
        config: null
    });
    const [activeTab, setActiveTab] = useState('hero');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = useState(null); // Para ver el mensaje completo

    // Forms State
    const [heroForm, setHeroForm] = useState({ title: "", subtitle: "", button_text: "Comprar ahora", button_link: "/order", image_url: "", is_active: true });
    const [featureForm, setFeatureForm] = useState({ title: "", description: "", image_url: "", order: 0, is_active: true });
    const [testimonialForm, setTestimonialForm] = useState({ client_name: "", client_role: "", content: "", rating: 5, image_url: "", is_active: true });
    const [configForm, setConfigForm] = useState({ site_name: "", contact_whatsapp: "", contact_phone: "", contact_email: "", address: "", instagram_url: "", facebook_url: "", footer_text: "", opening_hours: "" });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchMarketingData();

        // Escuchar notificaciones en tiempo real para refrescar datos
        const handleRefresh = (e) => {
            if (activeTab === 'testimonials' && e.detail === 'new_testimonial') {
                fetchMarketingData();
            }
        };
        window.addEventListener('new-notification', handleRefresh);
        return () => window.removeEventListener('new-notification', handleRefresh);
    }, [activeTab]);

    const fetchMarketingData = async () => {
        try {
            showLoading("Cargando marketing...");
            const [heroes, features, testimonials, configs] = await Promise.all([
                getHeroSections(),
                getFeatures(),
                getTestimonials(),
                getGlobalConfig()
            ]);

            const config = Array.isArray(configs) ? configs[0] : configs;

            setData({
                heroes: Array.isArray(heroes) ? heroes : heroes.results || [],
                features: Array.isArray(features) ? features : features.results || [],
                testimonials: Array.isArray(testimonials) ? testimonials : testimonials.results || [],
                config: config
            });

            if (config) {
                setConfigForm({
                    site_name: config.site_name || "",
                    contact_whatsapp: config.contact_whatsapp || "",
                    contact_phone: config.contact_phone || "",
                    contact_email: config.contact_email || "",
                    address: config.address || "",
                    instagram_url: config.instagram_url || "",
                    facebook_url: config.facebook_url || "",
                    footer_text: config.footer_text || "",
                    opening_hours: config.opening_hours || ""
                });
            }
        } catch (error) {
            console.error("Error fetching marketing data:", error);
        } finally {
            hideLoading();
        }
    };

    // --- SUBMIT HANDLERS ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading("Guardando cambios...");
            if (activeTab === 'hero') {
                if (editingId) await updateHero(editingId, heroForm);
                else await createHero(heroForm);
            } else if (activeTab === 'features') {
                if (editingId) await updateFeature(editingId, featureForm);
                else await createFeature(featureForm);
            } else if (activeTab === 'testimonials') {
                if (editingId) await updateTestimonial(editingId, testimonialForm);
                else await createTestimonial(testimonialForm);
            } else if (activeTab === 'config') {
                await upsertConfig(data.config?.id, configForm);
            }

            setModalConfig({ isOpen: true, title: "¡Éxito!", message: "Información guardada correctamente.", type: "success" });
            if (activeTab !== 'config') resetForm();
            fetchMarketingData();
        } catch (error) {
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo completar la acción.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleApprove = async (testimonial) => {
        try {
            showLoading("Aprobando testimonio...");
            await updateTestimonial(testimonial.id, { ...testimonial, is_active: true });
            setModalConfig({ isOpen: true, title: "Aprobado", message: "El testimonio ahora es visible en el Home.", type: "success" });
            setSelectedTestimonial(null); // <--- Regresar a la lista
            fetchMarketingData();
        } catch (error) {
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo aprobar.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleReject = async (id) => {
        if (window.confirm("¿Seguro que deseas rechazar y eliminar este comentario?")) {
            try {
                showLoading("Eliminando...");
                await deleteTestimonial(id);
                setSelectedTestimonial(null); // <--- Regresar a la lista
                fetchMarketingData();
            } catch (error) {
                setModalConfig({ isOpen: true, title: "Error", message: "No se pudo eliminar.", type: "error" });
            } finally {
                hideLoading();
            }
        }
    };

    const resetForm = () => {
        setHeroForm({ title: "", subtitle: "", button_text: "Comprar ahora", button_link: "/order", image_url: "", is_active: true });
        setFeatureForm({ title: "", description: "", image_url: "", order: 0, is_active: true });
        setTestimonialForm({ client_name: "", client_role: "", content: "", rating: 5, image_url: "", is_active: true });
        setEditingId(null);
        setShowForm(false);
        setSelectedTestimonial(null);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            showLoading("Subiendo imagen...");
            const result = await uploadImageCloudinary(file);
            if (activeTab === 'hero') setHeroForm({ ...heroForm, image_url: result.secure_url });
            else if (activeTab === 'features') setFeatureForm({ ...featureForm, image_url: result.secure_url });
            else if (activeTab === 'testimonials') setTestimonialForm({ ...testimonialForm, image_url: result.secure_url });
        } catch (error) {
            setModalConfig({ isOpen: true, title: "Error", message: "Error en la subida.", type: "error" });
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
                        <h2 className="fw-bold">Marketing: {activeTab === 'testimonials' ? 'Testimonios' : activeTab === 'config' ? 'Configuración' : activeTab.toUpperCase()}</h2>
                        {!showForm && activeTab !== 'config' && (
                            <button className="btn" style={{ background: '#ffb703', color: 'white', fontWeight: 'bold' }} onClick={() => setShowForm(true)}>
                                Nuevo {activeTab === 'hero' ? 'Hero' : activeTab === 'features' ? 'Servicio' : 'Testimonio'}
                            </button>
                        )}
                    </header>

                    <div className="mb-4">
                        <ul className="nav nav-tabs border-0">
                            <li className="nav-item">
                                <button className={`nav-link border-0 ${activeTab === 'hero' ? 'active fw-bold' : ''}`} onClick={() => { setActiveTab('hero'); resetForm(); }}>Hero Banner</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link border-0 ${activeTab === 'features' ? 'active fw-bold' : ''}`} onClick={() => { setActiveTab('features'); resetForm(); }}>Servicios</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link border-0 ${activeTab === 'testimonials' ? 'active fw-bold' : ''}`} onClick={() => { setActiveTab('testimonials'); resetForm(); }}>Testimonios</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link border-0 ${activeTab === 'config' ? 'active fw-bold' : ''}`} onClick={() => { setActiveTab('config'); resetForm(); }}>Configuración Site</button>
                            </li>
                        </ul>
                    </div>

                    <section className="table-section p-4 bg-white rounded shadow-sm">
                        {/* --- HERO TAB --- */}
                        {activeTab === 'hero' && (
                            <>
                                {showForm ? (
                                    <FormContainer title={editingId ? "Editar Hero" : "Nuevo Hero"} onCancel={resetForm} onSubmit={handleSubmit}>
                                        <div className="row mt-3">
                                            <div className="col-md-6 mb-3"><label className="form-label fw-bold">Título</label><input type="text" className="form-control" value={heroForm.title} onChange={e => setHeroForm({ ...heroForm, title: e.target.value })} required /></div>
                                            <div className="col-md-6 mb-3"><label className="form-label fw-bold">Texto Botón</label><input type="text" className="form-control" value={heroForm.button_text} onChange={e => setHeroForm({ ...heroForm, button_text: e.target.value })} /></div>
                                            <div className="col-12 mb-3"><label className="form-label fw-bold">Descripción</label><textarea className="form-control" rows="2" value={heroForm.subtitle} onChange={e => setHeroForm({ ...heroForm, subtitle: e.target.value })} required></textarea></div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-bold">Imagen</label><input type="file" className="form-control" onChange={handleFileUpload} />
                                                {heroForm.image_url && <img src={getOptimizedImage(heroForm.image_url, "w_200")} alt="Preview" className="mt-2 rounded" style={{ height: '80px' }} />}
                                            </div>
                                        </div>
                                    </FormContainer>
                                ) : (
                                    <Table headers={["Imagen", "Título", "Estado", "Acciones"]}>
                                        {data.heroes.map(h => (
                                            <tr key={h.id}>
                                                <td><img src={getOptimizedImage(h.image_url || h.image, "w_100,h_60,c_fill")} width="80" className="rounded" /></td>
                                                <td className="fw-bold">{h.title}</td>
                                                <td><span className={`status-badge ${h.is_active ? 'active' : 'inactive'}`}>{h.is_active ? 'Activo' : 'Inactivo'}</span></td>
                                                <td className="text-center"><ActionButtons onEdit={() => { setHeroForm(h); setEditingId(h.id); setShowForm(true); }} onDelete={async () => { if (window.confirm("¿Eliminar?")) { await deleteHero(h.id); fetchMarketingData(); } }} /></td>
                                            </tr>
                                        ))}
                                    </Table>
                                )}
                            </>
                        )}

                        {/* --- FEATURES TAB --- */}
                        {activeTab === 'features' && (
                            <>
                                {showForm ? (
                                    <FormContainer title={editingId ? "Editar Servicio" : "Nuevo Servicio"} onCancel={resetForm} onSubmit={handleSubmit}>
                                        <div className="row mt-3">
                                            <div className="col-md-6 mb-3"><label className="form-label fw-bold">Título</label><input type="text" className="form-control" value={featureForm.title} onChange={e => setFeatureForm({ ...featureForm, title: e.target.value })} required /></div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-bold">Imagen Card</label><input type="file" className="form-control" onChange={handleFileUpload} />
                                                {featureForm.image_url && <img src={getOptimizedImage(featureForm.image_url, "w_200")} alt="Preview" className="mt-2 rounded" style={{ height: '80px' }} />}
                                            </div>
                                            <div className="col-12 mb-3"><label className="form-label fw-bold">Descripción</label><textarea className="form-control" rows="2" value={featureForm.description} onChange={e => setFeatureForm({ ...featureForm, description: e.target.value })} required></textarea></div>
                                        </div>
                                    </FormContainer>
                                ) : (
                                    <Table headers={["Imagen", "Título", "Descripción", "Acciones"]}>
                                        {data.features.map(f => (
                                            <tr key={f.id}>
                                                <td><img src={getOptimizedImage(f.image_url || f.image, "w_100,h_60,c_fill")} width="80" className="rounded" /></td>
                                                <td className="fw-bold">{f.title}</td>
                                                <td>{f.description}</td>
                                                <td className="text-center"><ActionButtons onEdit={() => { setFeatureForm(f); setEditingId(f.id); setShowForm(true); }} onDelete={async () => { if (window.confirm("¿Eliminar?")) { await deleteFeature(f.id); fetchMarketingData(); } }} /></td>
                                            </tr>
                                        ))}
                                    </Table>
                                )}
                            </>
                        )}

                        {/* --- TESTIMONIALS TAB --- */}
                        {activeTab === 'testimonials' && (
                            <>
                                {selectedTestimonial ? (
                                    <div className="p-4 border rounded bg-light">
                                        <h4>Mensaje de: {selectedTestimonial.client_name}</h4>
                                        <p className="mt-3 fs-5 italic">"{selectedTestimonial.content}"</p>
                                        <div className="mt-4 d-flex gap-2">
                                            <button className="btn btn-success fw-bold" onClick={() => handleApprove(selectedTestimonial)}>Aceptar y Publicar</button>
                                            <button className="btn btn-danger fw-bold" onClick={() => handleReject(selectedTestimonial.id)}>Rechazar y Eliminar</button>
                                            <button className="btn btn-secondary fw-bold" onClick={() => setSelectedTestimonial(null)}>Volver</button>
                                        </div>
                                    </div>
                                ) : showForm ? (
                                    <FormContainer title={editingId ? "Editar Testimonio" : "Nuevo Testimonio"} onCancel={resetForm} onSubmit={handleSubmit}>
                                        <div className="row mt-3">
                                            <div className="col-md-6 mb-3"><label className="form-label fw-bold">Nombre del Cliente</label><input type="text" className="form-control" value={testimonialForm.client_name} onChange={e => setTestimonialForm({ ...testimonialForm, client_name: e.target.value })} required /></div>
                                            <div className="col-md-6 mb-3"><label className="form-label fw-bold">Rol/Ciudad (Opcional)</label><input type="text" className="form-control" value={testimonialForm.client_role} onChange={e => setTestimonialForm({ ...testimonialForm, client_role: e.target.value })} /></div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-bold">Calificación (1-5)</label>
                                                <select className="form-select" value={testimonialForm.rating} onChange={e => setTestimonialForm({ ...testimonialForm, rating: e.target.value })}>
                                                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-bold">Foto Cliente</label><input type="file" className="form-control" onChange={handleFileUpload} />
                                                {testimonialForm.image_url && <img src={getOptimizedImage(testimonialForm.image_url, "w_80,h_80,c_fill")} alt="Avatar" className="mt-2 rounded-circle" style={{ width: '60px', height: '60px' }} />}
                                            </div>
                                            <div className="col-12 mb-3"><label className="form-label fw-bold">Testimonio</label><textarea className="form-control" rows="3" value={testimonialForm.content} onChange={e => setTestimonialForm({ ...testimonialForm, content: e.target.value })} required></textarea></div>
                                        </div>
                                    </FormContainer>
                                ) : (
                                    <Table headers={["Cliente", "Calificación", "Estado", "Acciones"]}>
                                        {data.testimonials.map(t => (
                                            <tr key={t.id}>
                                                <td className="fw-bold">{t.client_name} <br /><small className="text-muted">{t.client_role}</small></td>
                                                <td className="text-warning">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</td>
                                                <td>
                                                    <span className={`status-badge ${t.is_active ? 'active' : 'pending'}`}>
                                                        {t.is_active ? 'Publicado' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <button className="action-btn view" title="Ver mensaje" onClick={() => setSelectedTestimonial(t)}><ViewIcon /></button>
                                                        {!t.is_active && <button className="action-btn success" title="Aceptar" onClick={() => handleApprove(t)}><CheckIcon /></button>}
                                                        <button className="action-btn delete" title="Rechazar/Borrar" onClick={() => handleReject(t.id)}><XIcon /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </Table>
                                )}
                            </>
                        )}

                        {/* --- CONFIGURATION TAB --- */}
                        {activeTab === 'config' && (
                            <div className="p-2">
                                <h4 className="mb-4">Información del Sitio y Footer</h4>
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Nombre del Negocio</label><input type="text" className="form-control" value={configForm.site_name} onChange={e => setConfigForm({ ...configForm, site_name: e.target.value })} /></div>
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">WhatsApp (Sin espacios)</label><input type="text" className="form-control" value={configForm.contact_whatsapp} onChange={e => setConfigForm({ ...configForm, contact_whatsapp: e.target.value })} placeholder="3101234567" /></div>
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Teléfono Fijo / Celular</label><input type="text" className="form-control" value={configForm.contact_phone} onChange={e => setConfigForm({ ...configForm, contact_phone: e.target.value })} /></div>
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Email de Contacto</label><input type="email" className="form-control" value={configForm.contact_email} onChange={e => setConfigForm({ ...configForm, contact_email: e.target.value })} /></div>
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Instagram URL</label><input type="url" className="form-control" value={configForm.instagram_url} onChange={e => setConfigForm({ ...configForm, instagram_url: e.target.value })} placeholder="https://instagram.com/tu_usuario" /></div>
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Facebook URL</label><input type="url" className="form-control" value={configForm.facebook_url} onChange={e => setConfigForm({ ...configForm, facebook_url: e.target.value })} placeholder="https://facebook.com/tu_pagina" /></div>
                                        <div className="col-12 mb-3"><label className="form-label fw-bold">Dirección Física</label><input type="text" className="form-control" value={configForm.address} onChange={e => setConfigForm({ ...configForm, address: e.target.value })} /></div>
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Horarios de Atención</label><textarea className="form-control" rows="4" value={configForm.opening_hours} onChange={e => setConfigForm({ ...configForm, opening_hours: e.target.value })} placeholder="Lun - Vier: 4pm - 10pm&#10;Sab: 12pm - 11pm" /></div>
                                        <div className="col-md-6 mb-3"><label className="form-label fw-bold">Texto del Footer</label><textarea className="form-control" rows="4" value={configForm.footer_text} onChange={e => setConfigForm({ ...configForm, footer_text: e.target.value })} placeholder="© 2024 Empapados Pop. Sabor auténtico." /></div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100 fw-bold py-2 mt-3">Actualizar Configuración Global</button>
                                </form>
                            </div>
                        )}
                    </section>
                </div>

                <ModernModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} type={modalConfig.type} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />
            </main>
        </div>
    );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---
function Table({ headers, children }) {
    return (
        <div className="table-responsive">
            <table className="table align-middle">
                <thead><tr>{headers.map((h, i) => <th key={i} className={h === "Acciones" ? "text-center" : ""}>{h}</th>)}</tr></thead>
                <tbody>{children}</tbody>
            </table>
            {children.length === 0 && <p className="text-center py-4 text-muted">No hay registros aún.</p>}
        </div>
    );
}

function FormContainer({ title, children, onCancel, onSubmit }) {
    return (
        <div className="mb-5 p-4 border rounded bg-light">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <h4>{title}</h4>
                <button className="btn btn-sm btn-outline-secondary" onClick={onCancel}>Cancelar</button>
            </div>
            <form onSubmit={onSubmit}>{children}<button type="submit" className="btn btn-success mt-4 w-100 fw-bold">Guardar Cambios</button></form>
        </div>
    );
}

function ActionButtons({ onEdit, onDelete }) {
    return (
        <div className="d-flex justify-content-center gap-2">
            <button className="action-btn edit" onClick={onEdit}><EditIcon /></button>
            <button className="action-btn delete" onClick={onDelete}><TrashIcon /></button>
        </div>
    );
}
