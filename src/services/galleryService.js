import { db, storage } from '../firebase/config';
import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc,
    query,
    orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const GALLERY_COLLECTION = 'galeria';

export const getImages = async () => {
    try {
        const querySnapshot = await getDocs(query(collection(db, GALLERY_COLLECTION), orderBy('fecha_subida', 'desc')));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting images: ", error);
        // Si no existe la colección o índices fallan en primer momento, retornar array vacío
        return [];
    }
};

export const uploadImage = async (formData) => {
    try {
        // En nuestro caso formData trae imagen y titulo
        const file = formData.get('imagen');
        const titulo = formData.get('titulo') || 'Sin titulo';
        
        if (!file) throw new Error("No image file provided");
        
        // 1. Subir archivo a Firebase Storage
        const fileRef = ref(storage, `galeria/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        
        // 2. Obtener URL pública
        const url = await getDownloadURL(fileRef);
        
        // 3. Crear documento en Firestore
        const imageData = {
            titulo,
            imagen: url, // La URL donde está hosteada
            fecha_subida: new Date().toISOString(),
            storagePath: fileRef.fullPath // Lo guardamos por si hay que borrarlo luego
        };
        
        const docRef = await addDoc(collection(db, GALLERY_COLLECTION), imageData);
        
        return { id: docRef.id, ...imageData };
    } catch (error) {
        console.error("Error uploading image: ", error);
        throw error;
    }
};

export const deleteImage = async (id) => {
    try {
        // Primero obtenemos el documento para saber dónde estaba guardado el archivo
        const docRef = doc(db, GALLERY_COLLECTION, id);
        
        // Asumiendo que tenemos los datos, preferiblemente solo borrar de firestore 
        // y dejar el cleanup storage para functions u otra cosa, pero por ahora:
        
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting image: ", error);
        throw error;
    }
};
