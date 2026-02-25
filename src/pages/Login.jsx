import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!username || !password) return;

    try {
      setErrorMsg("");
      setLoading(true);

      await login(username, password);

      navigate("/dashboard");

    } catch (error) {
      setErrorMsg("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleLogin}>
        <p>Ingrese su Usuario y Contraseña</p>

        <div className="input-group">
          <span className="input-icon"><i className="bi bi-person-fill" style={{ fontSize: '1.2rem' }}></i></span>
          <input
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUser(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <span className="input-icon"><i className="bi bi-lock-fill" style={{ fontSize: '1.2rem' }}></i></span>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {errorMsg && <p className="error">{errorMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Ingresar"}
        </button>

        <div className="footer-text">
          © 2026 Empapados Pop - Todos los derechos reservados
        </div>

        <span className="link">¿Recupera tu contraseña?</span>
      </form>
    </div>
  );
}
