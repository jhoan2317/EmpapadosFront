import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
    getGastos,
    createGasto,
    updateGasto,
    deleteGasto,
    getGasto
} from "../services/gastoService";

import { getReporteHoy } from "../services/reporteService";

import { useLoading } from "../context/LoadingContext";
import { LOADING_CONFIG } from "../components/GlobalSpinner";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ModernModal from "../components/ModernModal";
import Pagination from "../components/Pagination";
import "../styles/dashboard.css";
import "../styles/admin-pagos.css";

// Iconos
const EditIcon = () => <i className="bi bi-pencil-fill" style={{ color: '#ffb703' }}></i>;
const TrashIcon = () => <i className="bi bi-trash3-fill" style={{ color: '#dc3545' }}></i>;

export default function AdminPagos() {
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [collapsed, setCollapsed] = useState(false);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [editingId, setEditingId] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });
    const [showModal, setShowModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 10;

    // REPORTE
    const [reporte, setReporte] = useState(null);

    const [formData, setFormData] = useState({
        tipo: "proveedor",
        beneficiario: "",
        cargo: "particular",
        descripcion: "",
        monto: "",
        fecha: new Date().toISOString().split('T')[0]
    });

    const TIPOS_PAGO = [
        { value: 'nomina', label: 'Nómina' },
        { value: 'proveedor', label: 'Pago a Proveedores' },
        { value: 'servicios', label: 'Servicios Públicos' },
        { value: 'arriendo', label: 'Arriendo' },
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'otros', label: 'Otros Gastos' }
    ];

    const CARGOS = [
        { value: 'cocinero', label: 'Cocinero' },
        { value: 'ayudante_cocina', label: 'Ayudante de Cocina' },
        { value: 'mesero', label: 'Mesero' },
        { value: 'pizzero', label: 'Pizzero' },
        { value: 'domiciliario', label: 'Domiciliario' },
        { value: 'particular', label: 'Particular' }
    ];

    // Normalizador seguro del reporte
    const normalizeReporte = (data) => ({
        ingresos: Number(data?.ingresos || 0),
        gastos: Number(data?.gastos || 0),
        ganancia: Number(data?.ganancia || 0),
    });


    // Un solo effect: reacciona a cambio de fecha O de página
    useEffect(() => {
        loadData(currentPage, selectedDate);
        loadReporte(selectedDate);
    }, [selectedDate, currentPage]);

    const loadReporte = async (fecha = null) => {
        try {
            const data = await getReporteHoy(fecha || null);
            setReporte(normalizeReporte(data));
        } catch (error) {
            console.error("Error cargando reporte:", error);
            // evita que el dashboard se rompa
            setReporte(normalizeReporte(null));
        }
    };



    const loadData = async (page = 1, fecha = null) => {
        try {
            showLoading(LOADING_CONFIG.TEXTS.LOADING);
            const data = await getGastos(page, fecha || null);
            setPayments(Array.isArray(data) ? data : (data.results || []));
            setTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
        } catch (error) {
            console.error("Error cargando gastos:", error);
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            tipo: "proveedor",
            beneficiario: "",
            cargo: "particular",
            descripcion: "",
            monto: "",
            fecha: new Date().toISOString().split('T')[0]
        });
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading(LOADING_CONFIG.TEXTS.SAVING);

            if (editingId) {
                await updateGasto(editingId, formData);
            } else {
                await createGasto(formData);
            }

            setModalConfig({
                isOpen: true,
                title: editingId ? "¡Actualizado!" : "¡Registrado!",
                message: editingId
                    ? "El gasto ha sido actualizado correctamente."
                    : "El gasto ha sido registrado exitosamente.",
                type: "success"
            });

            resetForm();
            await loadData(currentPage, selectedDate);
            await loadReporte(selectedDate);

        } catch (error) {
            console.error("Error al guardar pago:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo procesar la solicitud.", type: "error" });
        } finally {
            hideLoading();
        }
    };

    const handleEdit = async (paymentOrId) => {
        const id = typeof paymentOrId === 'object' ? paymentOrId.id : paymentOrId;

        showLoading(LOADING_CONFIG.TEXTS.RECORD_PREP);

        try {
            const item = await getGasto(id);

            setEditingId(item.id);
            setFormData({
                tipo: item.tipo,
                beneficiario: item.beneficiario,
                cargo: item.cargo || "particular",
                descripcion: item.descripcion,
                monto: item.monto,
                fecha: item.fecha ? item.fecha.split('T')[0] : new Date().toISOString().split('T')[0]
            });

            setShowModal(true);

        } catch (error) {
            console.error("Error al obtener pago:", error);
            setModalConfig({ isOpen: true, title: "Error", message: "No se pudo cargar la información del pago.", type: "error" });
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
        setConfirmDelete({ isOpen: false, id: null });

        showLoading(LOADING_CONFIG.TEXTS.DELETING);

        setTimeout(async () => {
            try {
                await deleteGasto(id);

                setModalConfig({
                    isOpen: true,
                    title: "Eliminado",
                    message: "El registro de pago ha sido eliminado.",
                    type: "success"
                });

                await loadData(currentPage, selectedDate);
                await loadReporte(selectedDate);

            } catch (error) {
                console.error("Error al eliminar:", error);
                setModalConfig({ isOpen: true, title: "Error", message: "No se pudo eliminar el registro.", type: "error" });
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

                    <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <h2>Gestión de Pagos y Gastos</h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            {/* Datepicker */}
                            <div className="pagos-datepicker-wrapper">
                                <input
                                    type="date"
                                    className="pagos-datepicker-input"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <span className="pagos-datepicker-icon">
                                    <i className="bi bi-calendar3" style={{ color: '#000' }}></i>
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDate("")}
                                className="btn-ver-todo"
                            >Ver Todo</button>
                            <button
                                type="button"
                                className="btn-registrar-gasto"
                                onClick={() => { resetForm(); setShowModal(true); }}
                            >
                                Registrar Gasto
                            </button>
                        </div>
                    </header>

                    {/* RESUMEN FINANCIERO */}
                    {reporte && (
                        <section style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "15px",
                            marginBottom: "20px"
                        }}>
                            <div className="card p-3">
                                <h5>Ingresos</h5>
                                <h3 style={{ color: "#28a745" }}>
                                    ${Number(reporte.ingresos).toLocaleString()}
                                </h3>
                            </div>

                            <div className="card p-3">
                                <h5>Gastos</h5>
                                <h3 style={{ color: "#dc3545" }}>
                                    ${Number(reporte.gastos).toLocaleString()}
                                </h3>
                            </div>

                            <div className="card p-3">
                                <h5>Ganancia</h5>
                                <h3 style={{ color: "#007bff" }}>
                                    ${Number(reporte.ganancia).toLocaleString()}
                                </h3>
                            </div>
                        </section>
                    )}

                    <section className="table-section">
                        <h3>Historial de Pagos</h3>

                        {loading ? <p>Cargando registros...</p> : (
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Beneficiario</th>
                                        <th>Cargo</th>
                                        <th>Descripción</th>
                                        <th>Monto</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {payments.length > 0 ? payments.map(item => (
                                        <tr key={item.id}>
                                            <td>{new Date(item.fecha).toLocaleDateString()}</td>
                                            <td><span className="status-badge" style={{ background: '#e9ecef', color: '#495057' }}>{item.tipo.toUpperCase()}</span></td>
                                            <td><strong>{item.beneficiario}</strong></td>
                                            <td><span className="badge bg-light text-dark">{item.cargo?.replace('_', ' ').toUpperCase() || 'PARTICULAR'}</span></td>
                                            <td>{item.descripcion}</td>
                                            <td style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                                - ${parseFloat(item.monto).toLocaleString()}
                                            </td>

                                            <td>
                                                <div className="action-btns" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    <button onClick={() => handleEdit(item)} className="action-btn edit"><EditIcon /></button>
                                                    <button onClick={() => handleOpenDeleteConfirm(item.id)} className="action-btn delete"><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                No hay pagos registrados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        <Pagination
                            count={totalCount}
                            currentPage={currentPage}
                            pageSize={PAGE_SIZE}
                            onPageChange={setCurrentPage}
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

                {/* MODAL REGISTRAR / EDITAR GASTO */}
                {showModal && (
                    <div className="modal-overlay" onClick={resetForm}>
                        <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingId ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
                                <button className="close-btn" onClick={resetForm}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Tipo</label>
                                            <select
                                                className="form-select"
                                                name="tipo"
                                                value={formData.tipo}
                                                onChange={handleInputChange}
                                                required
                                                style={{ height: '44px', borderRadius: '6px' }}
                                            >
                                                {TIPOS_PAGO.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Fecha</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    className="form-control pagos-datepicker-input"
                                                    type="date"
                                                    name="fecha"
                                                    value={formData.fecha}
                                                    onChange={handleInputChange}
                                                    required
                                                    style={{ height: '44px', borderRadius: '6px', width: '100%', paddingRight: '40px' }}
                                                />
                                                <i className="bi bi-calendar3" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666' }}></i>
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Beneficiario</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                name="beneficiario"
                                                value={formData.beneficiario}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Nombre del beneficiario..."
                                                style={{ height: '44px', borderRadius: '6px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Cargo</label>
                                            <select
                                                className="form-select"
                                                name="cargo"
                                                value={formData.cargo}
                                                onChange={handleInputChange}
                                                required
                                                style={{ height: '44px', borderRadius: '6px' }}
                                            >
                                                {CARGOS.map(c => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Monto ($)</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                name="monto"
                                                value={formData.monto}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                style={{ height: '44px', borderRadius: '6px' }}
                                            />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Descripción</label>
                                            <textarea
                                                className="form-control"
                                                name="descripcion"
                                                value={formData.descripcion}
                                                onChange={handleInputChange}
                                                rows="2"
                                                placeholder="Detalle del gasto..."
                                                style={{ borderRadius: '6px' }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn w-100 mt-3 py-3"
                                        style={{ background: '#ffb703', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', fontSize: '16px' }}
                                    >
                                        {editingId ? 'Actualizar Gasto' : 'Guardar Gasto'}
                                    </button>
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
                            <h3>¿Eliminar Gasto?</h3>
                            <p>Esta acción no se puede deshacer.</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                                <button className="btn btn-secondary w-100" onClick={() => setConfirmDelete({ isOpen: false, id: null })}>Cancelar</button>
                                <button className="btn btn-danger w-100" onClick={() => handleDelete(confirmDelete.id)}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
