/**
 * @file GlobalSpinner.jsx
 * @description Componente de indicador de carga global.
 * Muestra un spinner animado con overlay cuando hay operaciones en curso.
 * Se controla mediante el LoadingContext y se renderiza condicionalmente.
 */

import { useLoading } from "../context/LoadingContext";
import "../styles/GlobalSpinner.css";

/**
 * Componente de spinner de carga global.
 * 
 * @function GlobalSpinner
 * @description
 * Renderiza un indicador de carga visual que cubre toda la pantalla cuando está activo.
 * Se muestra/oculta automáticamente según el estado del LoadingContext.
 * 
 * **Características:**
 * - Renderizado condicional: Solo se muestra cuando isLoading es true
 * - Overlay de pantalla completa que bloquea la interacción del usuario
 * - Spinner animado usando Font Awesome (fa-spinner fa-spin)
 * - Texto personalizable que se muestra debajo del spinner
 * - Diseño centrado vertical y horizontalmente
 * 
 * **Comportamiento:**
 * - Si isLoading es false, retorna null (no renderiza nada)
 * - Si isLoading es true, muestra el overlay con el spinner
 * - El texto es opcional y solo se muestra si loadingText tiene valor
 * 
 * **Integración:**
 * Este componente debe estar dentro del LoadingProvider para funcionar.
 * Se controla mediante las funciones showLoading() y hideLoading() del contexto.
 * 
 * **Estructura visual:**
 * - Overlay semitransparente de pantalla completa
 * - Contenedor centrado con el spinner
 * - Icono de spinner animado (Font Awesome)
 * - Texto descriptivo opcional debajo del spinner
 * 
 * @returns {JSX.Element|null} 
 *   - null: Si isLoading es false (no hay carga en curso)
 *   - JSX.Element: Overlay con spinner si isLoading es true
 * 
 * @example
 * Uso en App.jsx
 * <LoadingProvider>
 *   <AuthProvider>
 *     <BrowserRouter>
 *       <Auth />
 *       <GlobalSpinner />
 *     </BrowserRouter>
 *   </AuthProvider>
 * </LoadingProvider>
 * 
 * @example
 * Control desde cualquier componente
 * function MiComponente() {
 *   const { showLoading, hideLoading } = useLoading();
 *   
 *   async function cargarDatos() {
 *     showLoading('Cargando datos...');
 *     await fetchData();
 *     hideLoading();
 *   }
 * }
 */
const GlobalSpinner = () => {
    // Obtener estado de carga del contexto global
    const { isLoading, loadingText } = useLoading();

    // Renderizado condicional: No mostrar nada si no hay carga en curso
    if (!isLoading) return null;

    return (
        // Overlay de pantalla completa que bloquea la interacción
        <div className="global-spinner-overlay">
            {/* Contenedor centrado del spinner */}
            <div className="spinner-container">
                {/* Icono de spinner animado de Font Awesome */}
                <i className="fa-solid fa-spinner fa-spin fa-3x"></i>

                {/* Texto descriptivo opcional */}
                {loadingText && <p className="loading-text">{loadingText}</p>}
            </div>
        </div>
    );
};

export default GlobalSpinner;


export const LOADING_CONFIG = {

    DELAYS: {
        PAGINATION: 500,    // Paso de página en tablas
        MODAL_OPEN: 1000,   // Apertura de formularios
        CRUD_ACTION: 800,   // Guardar/Eliminar
        MODAL_WAIT: 500     // Avisos de confirmación
    },


    TEXTS: {
        LOADING: "Cargando datos...",
        SAVING: "Guardando cambios...",
        DELETING: "Eliminando registro...",
        PREPARING: "Preparando información...",
        RECORD_PREP: "Preparando registro...",
        DELETE_PREP: "Preparando eliminación..."
    }
};
