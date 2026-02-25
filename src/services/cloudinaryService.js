/**
 * Servicio para subir imágenes directamente a Cloudinary desde el Frontend.
 * Esto evita saturar el servidor propio y mejora la velocidad de carga.
 */

const CLOUD_NAME = "dzcfxeuch"; 
const UPLOAD_PRESET = "empapados_preset";

export const uploadImageCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    try {
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: data
            }
        );

        const result = await res.json();

        if (!res.ok) {
            console.error("Detalle del error de Cloudinary:", result);
            throw new Error(result.error?.message || "Error al subir la imagen a Cloudinary");
        }

        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};

/**
 * Genera una URL optimizada con transformaciones inteligentes.
 * @param {string} url - URL original de Cloudinary
 * @param {string} transform - Cadena de transformaciones (default: cards optimizadas)
 */
export const getOptimizedImage = (url, transform = "w_300,h_300,c_fill,g_auto,f_auto,q_auto") => {
    if (!url) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3C/svg%3E";

    // Si no es de cloudinary, no podemos transformarla fácilmente
    if (!url.includes("cloudinary.com")) return url;

    // Insertar transformaciones después de /upload/
    return url.replace("/upload/", `/upload/${transform}/`);
};
