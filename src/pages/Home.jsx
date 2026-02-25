import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getProducts } from "../services/productService";
import { createOrder } from "../services/orderService";
import { getOptimizedImage } from "../services/cloudinaryService";
import { getHeroSections, getFeatures, getTestimonials, getGlobalConfig, createTestimonial } from "../services/marketingService";
import { printThermalTicket } from "../services/printService";
import "../styles/home.css";

// Icons
const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);

const ProductCard = ({ product, onSelect }) => {
    const { nombre, precio, descripcion, imagen, imagen_url } = product;
    let imageUrl = getOptimizedImage(imagen_url || imagen);

    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        imageUrl = `http://localhost:8000${imageUrl}`;
    }

    return (
        <div className="card product-card mb-3" onClick={() => onSelect(product)} style={{ border: 'none', cursor: 'pointer' }}>
            <div className="row g-0 h-100">
                <div className="col-4 col-md-4 h-100" style={{ overflow: 'hidden' }}>
                    <img
                        src={imageUrl && !imageUrl.includes('null') ? imageUrl : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E"}
                        className="rounded-start product-img"
                        alt={nombre}
                        style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
                    />
                </div>
                <div className="col-8 col-md-8">
                    <div className="card-body d-flex flex-column justify-content-between h-100" style={{ padding: '15px' }}>
                        <div>
                            <h5 className="card-title fw-bold" style={{ fontSize: '16px', margin: 0 }}>{nombre}</h5>
                            <p className="card-text text-muted" style={{ fontSize: '12px', margin: '5px 0', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {descripcion}
                            </p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold product-price" style={{ fontSize: '14px' }}>${parseFloat(precio).toLocaleString()}</span>
                            <button className="add-btn-circle">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: TICKET PREVIEW ---
const TicketPreview = ({ orderData, config }) => {
    if (!orderData) return null;
    return (
        <div className="ticket-preview-container">
            <div className="thermal-ticket-mockup">
                <div className="text-center">
                    <h4 className="bold m-0">{config?.site_name || 'EMPAPADOS POP'}</h4>
                    <small>{config?.address || ''}</small><br />
                    <small>{config?.contact_phone || ''}</small>
                    <div className="divider-dashed"></div>
                    <div className="bold">ORDEN #{orderData.puesto || orderData.id}</div>
                    <small>{new Date().toLocaleString()}</small>
                </div>

                <div className="divider-dashed"></div>

                <div className="bold">CLIENTE:</div>
                <div>{orderData.cliente_nombre || 'Cliente General'}</div>
                {orderData.tipo_entrega === 'domicilio' ? <small> {orderData.direccion}</small> : <small>Consumo en Local</small>}

                <div className="divider-dashed"></div>

                <div className="ticket-items">
                    {orderData.items?.map((item, idx) => (
                        <div key={idx} className="mb-2">
                            <div className="d-flex justify-content-between">
                                <span>{item.cantidad}x {item.producto_nombre}</span>
                                <span>${(item.precio_total).toLocaleString()}</span>
                            </div>
                            {item.adiciones?.length > 0 && (
                                <div className="text-muted small ps-2">+ {item.adiciones.map(a => a.nombre).join(', ')}</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="divider-dashed"></div>

                <div className="d-flex justify-content-between bold ticket-total-row">
                    <span>TOTAL:</span>
                    <span>${(orderData.total || 0).toLocaleString()}</span>
                </div>

                <div className="divider-dashed"></div>

                <div className="text-center mt-3">
                    <small className="bold">¡GRACIAS POR TU COMPRA!</small>
                </div>
            </div>
        </div>
    );
};

export default function Home() {
    const navigate = useNavigate();
    const [view, setView] = useState('landing');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marketingData, setMarketingData] = useState({
        heroes: [],
        features: [],
        testimonials: [],
        config: null
    });

    // Shopping Cart State
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalQty, setModalQty] = useState(1);
    const [personalization, setPersonalization] = useState({});
    const [editingCartItemId, setEditingCartItemId] = useState(null);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [animatingCart, setAnimatingCart] = useState(false);

    // Logica de pedido
    const [orderType, setOrderType] = useState(""); // 'local' o 'domicilio'
    const [customerInfo, setCustomerInfo] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        mesa: "",
        formaPago: ""
    });

    // Modal de éxito y datos del ticket
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderResponse, setOrderResponse] = useState(null);
    const [lastTicketData, setLastTicketData] = useState(null);

    // Revisa el estado del formulario
    const [reviewForm, setReviewForm] = useState({ client_name: "", rating: 5, content: "" });
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catsData, prodsData, heroes, features, testimonials, config] = await Promise.all([
                    getCategories(),
                    getProducts(),
                    getHeroSections(),
                    getFeatures(),
                    getTestimonials(),
                    getGlobalConfig()
                ]);
                setCategories(Array.isArray(catsData) ? catsData : (catsData.results || []));
                setProducts(Array.isArray(prodsData) ? prodsData : (prodsData.results || []));
                setMarketingData({
                    heroes: Array.isArray(heroes) ? heroes : heroes.results || [],
                    features: Array.isArray(features) ? features : features.results || [],
                    testimonials: Array.isArray(testimonials) ? testimonials : testimonials.results || [],
                    config: Array.isArray(config) ? config[0] : config
                });
            } catch (error) {
                console.error("Error cargando productos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (marketingData.heroes.length > 1 && window.bootstrap) {
            const carouselEl = document.querySelector('#heroCarousel');
            if (carouselEl) {
                new window.bootstrap.Carousel(carouselEl, {
                    interval: 5000,
                    ride: 'carousel',
                    pause: 'hover'
                });
            }
        }
    }, [marketingData.heroes]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [isModalOpen]);

    const productsByCategory = categories
        .filter(cat => cat.activa !== false) // Mostramos si es true o undefined (por si acaso)
        .map(cat => ({
            ...cat,
            productos: products.filter(p => p.categoria === cat.id && p.activo !== false)
        })).filter(cat => cat.productos.length > 0);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsReviewSubmitting(true);
            await createTestimonial(reviewForm);
            setReviewSuccess(true);
            setReviewForm({ client_name: "", rating: 5, content: "" });
            setTimeout(() => setReviewSuccess(false), 5000);
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("No se pudo enviar tu comentario. Intenta de nuevo.");
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    // Modal Handlers
    const openProductModal = (product, cartItem = null) => {
        setSelectedProduct(product);
        if (cartItem) {
            setModalQty(cartItem.quantity);
            const initialPerso = {};
            cartItem.personalization.forEach(opt => initialPerso[opt] = true);
            setPersonalization(initialPerso);
            setEditingCartItemId(cartItem.id);
        } else {
            setModalQty(1);
            setPersonalization({});
            setEditingCartItemId(null);
        }
        setIsModalOpen(true);
    };

    const togglePersonalization = (option) => {
        setPersonalization(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    const addToCart = () => {
        if (editingCartItemId) {
            setCart(prev => prev.map(item =>
                item.id === editingCartItemId
                    ? { ...item, quantity: modalQty, personalization: Object.keys(personalization).filter(k => personalization[k]) }
                    : item
            ));
        } else {
            const newItem = {
                id: Date.now(),
                product: selectedProduct,
                quantity: modalQty,
                personalization: Object.keys(personalization).filter(k => personalization[k])
            };
            setCart([...cart, newItem]);

            // Animación para el carrito móvil
            setAnimatingCart(true);
            setTimeout(() => setAnimatingCart(false), 500);
        }
        setIsModalOpen(false);
        setEditingCartItemId(null);
    };

    const updateCartQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleProcessOrder = async () => {
        try {
            const orderData = {
                tipo_pedido: orderType,
                nombre_cliente: customerInfo.nombre,
                telefono: customerInfo.telefono || "N/A",
                direccion: orderType === 'domicilio' ? customerInfo.direccion : "Consumo en Local",
                numero_mesa: orderType === 'local' ? parseInt(customerInfo.mesa) : null,
                metodo_pago: orderType === 'domicilio' ? customerInfo.formaPago : 'efectivo',
                observaciones: cart.map(item =>
                    `${item.product.nombre} (x${item.quantity}): ${item.personalization.join(", ") || "Sin personalización"}`
                ).join(" | "),
                detalles: cart.map(item => ({
                    producto: item.product.id,
                    cantidad: item.quantity
                }))
            };

            const response = await createOrder(orderData);

            // Preparar datos para el ticket ANTES de limpiar el carrito
            const ticketData = {
                id: response.id,
                puesto: response.puesto,
                cliente_nombre: customerInfo.nombre,
                direccion: customerInfo.direccion,
                tipo_entrega: orderType,
                total: cart.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0),
                items: cart.map(item => ({
                    cantidad: item.quantity,
                    producto_nombre: item.product.nombre,
                    precio_total: item.product.precio * item.quantity,
                    adiciones: item.personalization.map(p => ({ nombre: p }))
                }))
            };

            // Mostrar modal moderno en lugar de alert
            setOrderResponse(response);
            setShowSuccessModal(true);

            // Imprimir automáticamente
            printThermalTicket(ticketData, marketingData.config);
            setLastTicketData(ticketData);

            // Limpiar tod@ después del éxito
            setCart([]);
            setOrderType("");
            setCustomerInfo({ nombre: "", telefono: "", direccion: "", mesa: "", formaPago: "" });
            setIsMobileCartOpen(false);
        } catch (error) {
            console.error("Error al crear el pedido:", error);
            alert("Hubo un error al procesar tu pedido. Por favor intenta de nuevo.");
        }
    };

    const customizationOptions = [
        "SIN SALSA DE PAN", "SIN PEPINILLOS", "SIN LECHUGA",
        "SIN QUESO AMERICANO", "SIN SALSA DE AJO", "SIN TOMATE",
        "SIN TOCINETA", "SIN QUESO CHEDDAR"
    ];

    const additionOptions = [
        { name: "Adición de tocineta", price: 4000 },
        { name: "Adición de jalapeños", price: 4000 },
        { name: "Adición de queso americano", price: 4000 },
        { name: "Adición de queso cheddar", price: 4000 }
    ];

    const drinkOptions = [
        { name: "Brisa con gas", price: 5000 },
        { name: "Coca cola original", price: 5000 },
        { name: "Coca cola sin azúcar", price: 5000 }
    ];

    const calculateItemTotalPrice = (product, activeOptions) => {
        const base = parseFloat(product.precio);
        const extras = activeOptions.reduce((acc, optName) => {
            const addOpt = additionOptions.find(o => o.name === optName);
            const drinkOpt = drinkOptions.find(o => o.name === optName);
            return acc + (addOpt?.price || 0) + (drinkOpt?.price || 0);
        }, 0);
        return base + extras;
    };

    const subtotal = cart.reduce((acc, item) =>
        acc + (calculateItemTotalPrice(item.product, item.personalization) * item.quantity), 0
    );

    return (
        <div className="home-container">

            {/* HEADER */}
            <header className="main-header">
                <div className="header-left">
                    <div className="logo-container">
                        <div className="logo-placeholder" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
                            EMP
                        </div>
                    </div>
                    <nav className="nav-links">
                        <button onClick={() => setView('landing')} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: view === 'landing' ? '800' : '400', cursor: 'pointer', fontSize: 'inherit', textTransform: 'uppercase' }}>
                            <i className={`bi bi-house nav-icon ${view === 'landing' ? 'active' : ''}`}></i>
                            <span className={`nav-text ${view === 'landing' ? 'active' : ''}`}>Inicio</span>
                        </button>
                        <button onClick={() => setView('order')} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: view === 'order' ? '800' : '400', cursor: 'pointer', fontSize: 'inherit', textTransform: 'uppercase' }}>
                            <i className={`bi bi-cart4 nav-icon ${view === 'order' ? 'active' : ''}`}></i>
                            <span className={`nav-text ${view === 'order' ? 'active' : ''}`}>Pide Aquí</span>
                        </button>
                        <button onClick={() => setView('work')} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: view === 'work' ? '800' : '400', cursor: 'pointer', fontSize: 'inherit', textTransform: 'uppercase' }}>
                            <i className={`bi bi-person-fill-gear nav-icon ${view === 'work' ? 'active' : ''}`}></i>
                            <span className={`nav-text ${view === 'work' ? 'active' : ''}`}>Trabaja con Nosotros</span>
                        </button>
                    </nav>
                </div>

                <div className="header-right">
                    <button className="login-icon" onClick={() => navigate('/login')} title="Iniciar Sesión">
                        <i className="bi bi-person-circle"></i>
                    </button>
                </div>
            </header>

            {view === 'order' && (
                <>
                    <div className="category-nav">
                        {productsByCategory.map(cat => (
                            <button key={cat.id} onClick={() => scrollToSection(`cat-${cat.id}`)} style={{ background: 'none', border: 'none', color: '#888', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                                {cat.nombre}
                            </button>
                        ))}
                    </div>
                    {/* Botón flotante del carrito para móviles */}
                    <div
                        className={`mobile-cart-toggle ${animatingCart ? 'bump' : ''}`}
                        onClick={() => setIsMobileCartOpen(true)}
                    >
                        <i className="bi bi-cart4"></i>
                        {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                    </div>
                </>
            )}

            {view === 'landing' && (
                <>
                    {/* HERO SECTION CARRUSEL DINÁMICO */}
                    {marketingData.heroes.length > 0 && (
                        <section className="hero-section p-0 overflow-hidden">
                            <div id="heroCarousel" className="carousel slide carousel-fade" data-bs-ride="carousel">
                                <div className="carousel-inner">
                                    {marketingData.heroes.slice(0, 4).map((hero, index) => (
                                        <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={hero.id} data-bs-interval="5000">
                                            <img
                                                src={getOptimizedImage(hero.image_url || hero.image, "f_auto,q_auto")}
                                                className="d-block w-100 hero-banner"
                                                alt={hero.title}
                                            />
                                            <div className="hero-content">
                                                <h1>{hero.title}</h1>
                                                <p>{hero.subtitle}</p>
                                                <button className="hero-cta-btn" onClick={() => setView('order')}>
                                                    {hero.button_text}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {marketingData.heroes.length > 1 && (
                                    <>
                                        <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                        </button>
                                        <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    <main className="home-content">
                        {/* Seccion Cards */}
                        <div className="section-grid">
                            {marketingData.features.length > 0 && (
                                marketingData.features.map(feat => (
                                    <div className="content-card" key={feat.id}>
                                        <img
                                            src={getOptimizedImage(feat.image_url || feat.image, "w_600,h_400,c_fill")}
                                            alt={feat.title}
                                            className="card-img"
                                        />
                                        <div className="card-body">
                                            <h3>{feat.title}</h3>
                                            <p>{feat.description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Seccion de Testimonios */}
                        {marketingData.testimonials.length > 0 && (
                            <section className="testimonials-section mt-5">
                                <h2 className="text-center mb-4">Lo que dicen nuestros clientes</h2>
                                <div className="testimonials-grid">
                                    {marketingData.testimonials.map(testi => (
                                        <div className="testimonial-card" key={testi.id}>
                                            <div className="stars">
                                                {[...Array(testi.rating)].map((_, i) => (
                                                    <i key={i} className="bi bi-star-fill text-warning"></i>
                                                ))}
                                            </div>
                                            <p className="testimonial-content">"{testi.content}"</p>
                                            <div className="client-info">
                                                {testi.image_url || testi.image ? (
                                                    <img src={getOptimizedImage(testi.image_url || testi.image, "w_100,h_100,c_fill")} alt={testi.client_name} />
                                                ) : (
                                                    <div className="client-avatar-placeholder">
                                                        {testi.client_name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h5 className="mb-0">{testi.client_name}</h5>
                                                    <small>{testi.client_role}</small>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Seccion de formulario de reseña */}
                        <section className="review-form-section mt-5 py-5">
                            <div className="container">
                                <div className="row justify-content-center">
                                    <div className="col-md-8 col-lg-6">
                                        <div className="review-card p-4 shadow-sm border-0 rounded-4">
                                            <h2 className="text-center mb-4 fw-bold">Tu opinión nos importa</h2>
                                            {reviewSuccess ? (
                                                <div className="alert alert-success text-center border-0 rounded-3">
                                                    <i className="bi bi-check-circle-fill me-2"></i>
                                                    ¡Gracias por tu comentario! Lo revisaremos pronto.
                                                </div>
                                            ) : (
                                                <form onSubmit={handleReviewSubmit}>
                                                    <div className="mb-3">
                                                        <label className="form-label fw-semibold">Nombre</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-lg border-2"
                                                            placeholder="Tu nombre"
                                                            value={reviewForm.client_name}
                                                            onChange={e => setReviewForm({ ...reviewForm, client_name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label fw-semibold">Calificación</label>
                                                        <div className="rating-selector d-flex gap-2 mb-2">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <i
                                                                    key={star}
                                                                    className={`bi star-input ${star <= reviewForm.rating ? 'bi-star-fill text-warning' : 'bi-star text-secondary'}`}
                                                                    style={{ cursor: 'pointer', fontSize: '24px' }}
                                                                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                                ></i>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="form-label fw-semibold">Comentario</label>
                                                        <textarea
                                                            className="form-control form-control-lg border-2"
                                                            rows="4"
                                                            placeholder="¿Qué tal fue tu experiencia?"
                                                            value={reviewForm.content}
                                                            onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                                                            required
                                                        ></textarea>
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-warning w-100 py-3 fw-bold text-white shadow-sm"
                                                        disabled={isReviewSubmitting}
                                                    >
                                                        {isReviewSubmitting ? 'Enviando...' : 'Enviar Comentario'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </>
            )}

            {view === 'order' && (
                <div className="order-layout">
                    <div className="products-column">
                        {loading ? <p>Cargando menú...</p> : productsByCategory.map(cat => (
                            <section className="category-section" id={`cat-${cat.id}`} key={cat.id}>
                                <h2>{cat.nombre}</h2>
                                <div className="product-grid">
                                    {cat.productos.map(prod => (
                                        <ProductCard key={prod.id} product={prod} onSelect={openProductModal} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    <aside className={`order-sidebar ${isMobileCartOpen ? 'mobile-open' : ''}`}>
                        <div className="sidebar-card cart-sidebar">
                            <div className="cart-header">
                                <span>Tu Carrito ({cart.length})</span>
                                <button className="close-cart-mobile" onClick={() => setIsMobileCartOpen(false)}>
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            </div>
                            <div className="order-type-selector" style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '800', marginBottom: '8px', display: 'block', color: '#666' }}>¿CÓMO QUIERES TU PEDIDO?</label>
                                <select
                                    className="form-select"
                                    aria-label="Default select example"
                                    value={orderType}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    style={{ fontSize: '14px', fontWeight: '600' }}
                                >
                                    <option value="">Selecciona una opción...</option>
                                    <option value="local">Pedir en Local</option>
                                    <option value="domicilio">Pedir a Domicilio</option>
                                </select>
                            </div>

                            {orderType === 'local' && (
                                <div className="order-fields" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Tu Nombre"
                                        value={customerInfo.nombre}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, nombre: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Número de Mesa"
                                        value={customerInfo.mesa}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, mesa: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' }}
                                    />
                                </div>
                            )}

                            {orderType === 'domicilio' && (
                                <div className="order-fields" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Tu Nombre"
                                        value={customerInfo.nombre}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, nombre: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Dirección de entrega"
                                        value={customerInfo.direccion}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, direccion: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Número de Teléfono"
                                        value={customerInfo.telefono}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, telefono: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px' }}
                                    />
                                    <select
                                        className="form-select"
                                        aria-label="Forma de Pago"
                                        value={customerInfo.formaPago}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, formaPago: e.target.value })}
                                        style={{ fontSize: '14px' }}
                                    >
                                        <option value="">Selecciona Forma de Pago</option>
                                        <option value="nequi">Nequi</option>
                                        {/*<option value="transferencia">Transferencia</option>*/}
                                        <option value="contra_entrega">Contra Entrega</option>
                                    </select>
                                </div>
                            )}

                            {cart.length > 0 ? (
                                <div className="cart-list">
                                    {cart.map((item) => (
                                        <div className="cart-item" key={item.id}>
                                            <img src={(item.product.imagen_url || item.product.imagen)?.startsWith('http') ? getOptimizedImage(item.product.imagen_url || item.product.imagen, "w_100,h_100,c_fill") : `http://localhost:8000${(item.product.imagen_url || item.product.imagen)}`} alt="" />
                                            <div className="cart-item-info">
                                                <div className="cart-item-row">
                                                    <span className="cart-item-name">{item.product.nombre}</span>
                                                    <span className="cart-item-price">${(calculateItemTotalPrice(item.product, item.personalization) * item.quantity).toLocaleString()}</span>
                                                </div>
                                                <div className="cart-item-row">
                                                    <div className="cart-qty-controls">
                                                        <button onClick={() => updateCartQty(item.id, -1)} disabled={item.quantity <= 1}>-</button>
                                                        <span>{item.quantity}</span>
                                                        <button onClick={() => updateCartQty(item.id, 1)}>+</button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <button className="edit-link" onClick={() => openProductModal(item.product, item)}>Editar</button>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e63946', display: 'flex' }}
                                                            title="Eliminar"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="cart-summary">
                                        <div className="summary-row">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toLocaleString()}</span>
                                        </div>
                                        <button
                                            className="continue-btn"
                                            style={{
                                                background: (orderType === 'local' && customerInfo.nombre && customerInfo.mesa) || (orderType === 'domicilio' && customerInfo.nombre && customerInfo.direccion && customerInfo.telefono && customerInfo.formaPago) ? '#ffb703' : '#f0f0f0',
                                                color: (orderType === 'local' && customerInfo.nombre && customerInfo.mesa) || (orderType === 'domicilio' && customerInfo.nombre && customerInfo.direccion && customerInfo.telefono && customerInfo.formaPago) ? '#000' : '#aaa',
                                                cursor: (orderType === 'local' && customerInfo.nombre && customerInfo.mesa) || (orderType === 'domicilio' && customerInfo.nombre && customerInfo.direccion && customerInfo.telefono && customerInfo.formaPago) ? 'pointer' : 'not-allowed',
                                                width: '100%', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '16px'
                                            }}
                                            disabled={!((orderType === 'local' && customerInfo.nombre && customerInfo.mesa) || (orderType === 'domicilio' && customerInfo.nombre && customerInfo.direccion && customerInfo.telefono && customerInfo.formaPago))}
                                            onClick={handleProcessOrder}
                                        >
                                            Finalizar Pedido
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-cart-msg">
                                    <h4>Tu carrito está vacío</h4>
                                    <p>Los productos que agregues aparecerán aquí</p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            )}

            {view === 'work' && (
                <main className="home-content" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', marginBottom: '40px', color: '#333' }}>
                        ¿Quieres hacer parte de nuestro equipo?
                    </h2>
                    <div className="section-grid">
                        <div className="content-card">
                            <img src="https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=600&auto=format&fit=crop" alt="Domiciliario" className="card-img" />
                            <div className="card-body">
                                <h3>Domiciliario</h3>
                                <p>Únete a nuestro equipo de entrega y lleva sonrisas a cada hogar.</p>
                            </div>
                        </div>
                        <div className="content-card">
                            <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=600&auto=format&fit=crop" alt="Ayudante de Cocina" className="card-img" />
                            <div className="card-body">
                                <h3>Ayudante de Cocina</h3>
                                <p>Aprende y crece en nuestra cocina preparando los mejores sabores.</p>
                            </div>
                        </div>
                        <div className="content-card">
                            <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop" alt="Meser@" className="card-img" />
                            <div className="card-body">
                                <h3>Meser@</h3>
                                <p>Brinda una experiencia excepcional a nuestros clientes.</p>
                            </div>
                        </div>
                        <div className="content-card">
                            <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop" alt="Pizzero" className="card-img" />
                            <div className="card-body">
                                <h3>Pizzero</h3>
                                <p>Domina el arte de crear las pizzas más deliciosas.</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '40px', padding: '30px', background: '#f8f8f8', borderRadius: '15px', maxWidth: '600px', margin: '40px auto 0' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', color: '#333' }}>Información de Contacto</h3>
                        <p style={{ fontSize: '16px', marginBottom: '10px', color: '#666' }}>
                            <strong>Teléfono:</strong> <a href="tel:+573001234567" style={{ color: '#ffb703', textDecoration: 'none' }}>+57 300 123 4567</a>
                        </p>
                        <p style={{ fontSize: '16px', color: '#666' }}>
                            <strong>Correo:</strong> <a href="mailto:rrhh@empapados.com" style={{ color: '#ffb703', textDecoration: 'none' }}>rrhh@empapados.com</a>
                        </p>
                    </div>
                </main>
            )}

            {isModalOpen && selectedProduct && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-product-view" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                            <i className="bi bi-x-circle"></i>
                        </button>
                        <div className="modal-product-layout">
                            <div className="modal-image-pane">
                                <img src={(selectedProduct.imagen_url || selectedProduct.imagen)?.startsWith('http') ? getOptimizedImage(selectedProduct.imagen_url || selectedProduct.imagen, "w_800,c_fit") : `http://localhost:8000${(selectedProduct.imagen_url || selectedProduct.imagen)}`} alt={selectedProduct.nombre} />
                            </div>
                            <div className="modal-details-pane">
                                <div className="modal-details-scroll">
                                    <h2 className="modal-title">{selectedProduct.nombre}</h2>
                                    <p className="modal-desc">{selectedProduct.descripcion}</p>

                                    <div className="customization-header">
                                        <h4>¿Deseas personalizar tu orden?</h4>
                                        <span className="optional-badge">Opcional</span>
                                    </div>
                                    <p className="selection-note">Seleccione al menos 1</p>

                                    <div className="options-list" style={{ marginBottom: '30px' }}>
                                        {customizationOptions.map(opt => (
                                            <div className="form-check d-flex justify-content-between align-items-center" key={opt} onClick={() => togglePersonalization(opt)} style={{ padding: '12px 0', borderBottom: '1px solid #f8f8f8', cursor: 'pointer' }}>
                                                <label className="form-check-label" style={{ fontWeight: '700', fontSize: '14px', cursor: 'pointer', flex: 1, margin: 0 }}>
                                                    {opt}
                                                </label>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={personalization[opt] || false}
                                                    readOnly
                                                    style={{ width: '22px', height: '22px', margin: 0, cursor: 'pointer', float: 'none' }}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="customization-header">
                                        <h4>Adiciones</h4>
                                        <span className="optional-badge">Opcional</span>
                                    </div>
                                    <p className="selection-note">Puedes adicionarle ingredientes a tu hamburguesa</p>

                                    <div className="options-list" style={{ marginBottom: '30px' }}>
                                        {additionOptions.map(opt => (
                                            <div className="form-check d-flex justify-content-between align-items-center" key={opt.name} onClick={() => togglePersonalization(opt.name)} style={{ padding: '12px 0', borderBottom: '1px solid #f8f8f8', cursor: 'pointer' }}>
                                                <label className="form-check-label" style={{ cursor: 'pointer', flex: 1, margin: 0 }}>
                                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{opt.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>+ ${opt.price.toLocaleString()}</div>
                                                </label>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={personalization[opt.name] || false}
                                                    readOnly
                                                    style={{ width: '22px', height: '22px', margin: 0, cursor: 'pointer', float: 'none' }}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="customization-header">
                                        <h4>Elige tu bebida</h4>
                                        <span className="optional-badge">Opcional</span>
                                    </div>
                                    <p className="selection-note">Selecciona tu bebida</p>

                                    <div className="options-list">
                                        {drinkOptions.map(opt => (
                                            <div className="form-check d-flex justify-content-between align-items-center" key={opt.name} onClick={() => togglePersonalization(opt.name)} style={{ padding: '12px 0', borderBottom: '1px solid #f8f8f8', cursor: 'pointer' }}>
                                                <label className="form-check-label" style={{ cursor: 'pointer', flex: 1, margin: 0 }}>
                                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{opt.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>+ ${opt.price.toLocaleString()}</div>
                                                </label>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={personalization[opt.name] || false}
                                                    readOnly
                                                    style={{ width: '22px', height: '22px', margin: 0, cursor: 'pointer', float: 'none' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <div className="qty-selector">
                                        <button onClick={() => setModalQty(Math.max(1, modalQty - 1))}>-</button>
                                        <span>{modalQty}</span>
                                        <button onClick={() => setModalQty(modalQty + 1)}>+</button>
                                    </div>
                                    <button className="add-to-cart-btn" onClick={addToCart}>
                                        <span>Agregar</span>
                                        <span>${(calculateItemTotalPrice(selectedProduct, Object.keys(personalization).filter(k => personalization[k])) * modalQty).toLocaleString()}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && orderResponse && (
                <div className="modal-overlay" style={{ zIndex: 3000 }}>
                    <div className="success-modal-card">
                        <div className="success-image-pane d-none d-lg-block">
                            <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop" alt="Burger Success" />
                        </div>
                        <div className="success-content-pane">
                            <div className="success-icon">
                                <i className="bi bi-check-circle-fill"></i>
                            </div>
                            <h2 className="success-title">¡Pedido Recibido!</h2>
                            <div className="success-details">
                                <p style={{ color: '#666', fontSize: '15px' }}>Tu pedido ha sido procesado con éxito. Prepárate para el mejor sabor.</p>
                                <div className="order-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Puesto</span>
                                        <span className="stat-value">#{orderResponse.puesto}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Tiempo</span>
                                        <span className="stat-value">{orderResponse.demora} min</span>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-center mt-4 mb-3" style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Previsualización de Ticket</h4>
                            <TicketPreview orderData={lastTicketData} config={marketingData.config} />

                            <button
                                className="success-close-btn mt-4"
                                onClick={() => setShowSuccessModal(false)}
                            >
                                ¡Entendido!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER DINÁMICO */}
            <footer className="main-footer">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h3>{marketingData.config?.site_name || "Empapados Pop"}</h3>
                        <p>{marketingData.config?.footer_text || "El sabor auténtico de la calle."}</p>
                        <div className="social-links">
                            {marketingData.config?.instagram_url && (
                                <a href={marketingData.config.instagram_url} target="_blank" rel="noreferrer"><i className="bi bi-instagram"></i></a>
                            )}
                            {marketingData.config?.facebook_url && (
                                <a href={marketingData.config.facebook_url} target="_blank" rel="noreferrer"><i className="bi bi-facebook"></i></a>
                            )}
                        </div>
                    </div>
                    <div className="footer-col">
                        <h3>Contacto</h3>
                        <ul>
                            {marketingData.config?.contact_phone && <li><i className="bi bi-telephone"></i> {marketingData.config.contact_phone}</li>}
                            {marketingData.config?.contact_whatsapp && <li><i className="bi bi-whatsapp"></i> {marketingData.config.contact_whatsapp}</li>}
                            {marketingData.config?.contact_email && <li><i className="bi bi-envelope"></i> {marketingData.config.contact_email}</li>}
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>Dirección</h3>
                        <p>{marketingData.config?.address || "Pereira, Colombia"}</p>
                        {marketingData.config?.opening_hours && (
                            <>
                                <h3>Horarios</h3>
                                <p style={{ whiteSpace: 'pre-line' }}>{marketingData.config.opening_hours}</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} {marketingData.config?.site_name || "Empapados Pop"}. Todos los derechos reservados.</p>
                </div>
            </footer>

            <div className="social-floating">
                <a href="#" className="social-btn"><i className="bi bi-facebook" style={{ fontSize: '20px' }}></i></a>
                <a href="#" className="social-btn"><i className="bi bi-instagram" style={{ fontSize: '20px' }}></i></a>
            </div>
        </div>
    );
}
