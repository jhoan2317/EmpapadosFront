import { db } from '../firebase/config';
import { 
    collection, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from "firebase/firestore";

const GASTOS_COLLECTION = 'gastos';

export const getGastos = async (page = 1, fecha = null) => {
    try {
        const querySnapshot = await getDocs(query(collection(db, GASTOS_COLLECTION), orderBy('fecha', 'desc')));
        let gastos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filtro por fecha si es necesario
        if (fecha) {
            gastos = gastos.filter(gasto => gasto.fecha && gasto.fecha.startsWith(fecha));
        }
        
        const pageSize = 10;
        const startIndex = (page - 1) * pageSize;
        const paginatedResults = gastos.slice(startIndex, startIndex + pageSize);

        return {
            results: paginatedResults,
            count: gastos.length
        };
    } catch (error) {
        console.error("Error getting gastos: ", error);
        throw error;
    }
};

export const getGasto = async (id) => {
    try {
        const docRef = doc(db, GASTOS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("Gasto no encontrado");
        }
    } catch (error) {
        console.error("Error getting gasto: ", error);
        throw error;
    }
};

export const createGasto = async (data) => {
    try {
        const docRef = await addDoc(collection(db, GASTOS_COLLECTION), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error("Error creating gasto: ", error);
        throw error;
    }
};

export const updateGasto = async (id, data) => {
    try {
        const docRef = doc(db, GASTOS_COLLECTION, id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error("Error updating gasto: ", error);
        throw error;
    }
};

export const deleteGasto = async (id) => {
    try {
        const docRef = doc(db, GASTOS_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting gasto: ", error);
        throw error;
    }
};
