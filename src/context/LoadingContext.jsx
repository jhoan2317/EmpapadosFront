/**
 * @file LoadingContext.jsx
 * @description Contexto global para gestionar el estado de carga de la aplicación.
 * Proporciona un spinner/indicador de carga centralizado que puede ser controlado
 * desde cualquier componente de la aplicación.
 */

import { createContext, useContext, useState, useCallback, useRef } from "react";

/**
 * Contexto de estado de carga global.
 */
const LoadingContext = createContext();

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading debe usarse dentro de un LoadingProvider");
    }
    return context;
};

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Cargando...");
    const hideTimeoutRef = useRef(null);

    const showLoading = useCallback((text = "Cargando...") => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setLoadingText(text);
        setIsLoading(true);
    }, []);

    const hideLoading = useCallback(() => {
        // Regulamos la desaparición para que el usuario pueda percibir el spinner
        // y evitar parpadeos si la respuesta del servidor es muy rápida.
        hideTimeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            hideTimeoutRef.current = null;
        }, 1000); // Retraso de 1 segundo para mayor suavidad
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, loadingText, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};
