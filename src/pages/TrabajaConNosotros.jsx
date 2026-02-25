import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/home.css";


export default function TrabajaConNosotros() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            {/* HEADER */}
            <header className="main-header">
                <div className="header-left">
                    <div className="logo-container">
                        <div className="logo-placeholder" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                            EMP
                        </div>
                    </div>
                    <nav className="nav-links">
                        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: '400', cursor: 'pointer', fontSize: 'inherit', textTransform: 'uppercase' }}>
                            <i className="bi bi-house nav-icon"></i>
                            <span className="nav-text">Inicio</span>
                        </button>
                        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: '400', cursor: 'pointer', fontSize: 'inherit', textTransform: 'uppercase' }}>
                            <i className="bi bi-cart4 nav-icon"></i>
                            <span className="nav-text">Pide Aquí</span>
                        </button>
                        <button onClick={() => navigate('/trabaja-con-nosotros')} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: '800', cursor: 'pointer', fontSize: 'inherit', textTransform: 'uppercase' }}>
                            <i className="bi bi-person-fill-gear nav-icon active"></i>
                            <span className="nav-text active">Trabaja con Nosotros</span>
                        </button>
                    </nav>
                </div>

                <div className="header-right">
                    <button className="login-icon" onClick={() => navigate('/login')} title="Cerrar Sesión">
                        <i className="bi bi-box-arrow-right"></i>
                    </button>
                </div>
            </header>

            {/* TRABAJA CON NOSOTROS SECCION */}
            <main className="home-content" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
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

            <div className="social-floating">
                <a href="#" className="social-btn"><i className="bi bi-facebook" style={{ fontSize: '20px' }}></i></a>
                <a href="#" className="social-btn"><i className="bi bi-instagram" style={{ fontSize: '20px' }}></i></a>
            </div>
        </div>
    );
}
