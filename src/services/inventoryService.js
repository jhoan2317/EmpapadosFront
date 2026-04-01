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
    where, 
    orderBy 
} from "firebase/firestore";
import { getProduct, getProductRecipes } from './productService';

const INVENTORY_COLLECTION = 'inventario';
const MOVEMENTS_COLLECTION = 'movimientos_inventario';

export const getInventory = async (page = 1) => {
    try {
        const querySnapshot = await getDocs(query(collection(db, INVENTORY_COLLECTION), orderBy('nombre_ingrediente', 'asc')));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (page === null) {
            return items;
        }

        const pageSize = 10;
        const startIndex = (page - 1) * pageSize;
        const paginatedResults = items.slice(startIndex, startIndex + pageSize);

        // Simular paginación para mantener compatibilidad
        return {
            results: paginatedResults,
            count: items.length
        };
    } catch (error) {
        console.error("Error getting inventory: ", error);
        throw error;
    }
};

export const getInventoryItem = async (id) => {
    try {
        const docRef = doc(db, INVENTORY_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("Item not found");
        }
    } catch (error) {
        console.error("Error getting inventory item: ", error);
        throw error;
    }
};

export const updateInventory = async (id, data) => {
    try {
        const docRef = doc(db, INVENTORY_COLLECTION, id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error("Error updating inventory item: ", error);
        throw error;
    }
};

export const createInventoryEntry = async (data) => {
    try {
        const docRef = await addDoc(collection(db, INVENTORY_COLLECTION), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error("Error creating inventory entry: ", error);
        throw error;
    }
};

export const deleteInventoryEntry = async (id) => {
    try {
        const docRef = doc(db, INVENTORY_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting inventory entry: ", error);
        throw error;
    }
};

export const registerInventoryExit = async (data) => {
    try {
        // Obtenemos el item
        const docRef = doc(db, INVENTORY_COLLECTION, data.ingrediente_id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) throw new Error("Ingredient not found");
        
        const currentData = docSnap.data();
        const currentStock = currentData.stock || 0;
        
        // Calculamos la nueva cantidad (restamos stock)
        const quantityToSubtract = data.cantidad || 0;
        if (currentStock < quantityToSubtract) {
            throw new Error("Stock insuficiente");
        }
        
        const newStock = currentStock - quantityToSubtract;
        
        // Actualizamos el stock
        await updateDoc(docRef, { stock: newStock });
        
        // Registramos el movimiento
        const movementData = {
            ingrediente_id: data.ingrediente_id,
            ingrediente_nombre: currentData.nombre_ingrediente,
            tipo: 'salida',
            cantidad: quantityToSubtract,
            fecha: new Date().toISOString(),
            motivo: data.motivo || 'Salida manual',
            usuario: data.usuario || 'admin'
        };
        
        await addDoc(collection(db, MOVEMENTS_COLLECTION), movementData);
        
        return { id: docRef.id, stock: newStock };
    } catch (error) {
        console.error("Error registering inventory exit: ", error);
        throw error;
    }
};

export const registerTasting = async (data) => {
    try {
        const { producto_id, cantidad, descripcion } = data;
        
        // 1. Obtener info del producto
        const product = await getProduct(producto_id);
        
        // 2. Obtener receta
        const recipes = await getProductRecipes(producto_id);
        
        if (!recipes || recipes.length === 0) {
            throw new Error(`El producto "${product.nombre}" no tiene una receta configurada para descontar ingredientes.`);
        }
        
        // 3. Descontar cada ingrediente
        for (const item of recipes) {
            const totalDeduction = parseFloat(item.cantidad) * parseInt(cantidad);
            
            await registerInventoryExit({
                ingrediente_id: item.ingrediente,
                cantidad: totalDeduction,
                motivo: `DEGUSTACIÓN (${cantidad}x ${product.nombre}): ${descripcion}`,
                usuario: data.usuario
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error registering tasting: ", error);
        throw error;
    }
};

export const deleteTastingMovements = async (tasting) => {
    try {
        if (!tasting.motivo) throw new Error("No se puede identificar la degustación (motivo faltante)");
        
        // Buscar todos los movimientos con el mismo motivo
        // Agregamos el filtro de motivo directamente en la consulta para mayor precisión y evitar errores
        let q = query(
            collection(db, MOVEMENTS_COLLECTION), 
            where('motivo', '==', tasting.motivo)
        );

        const querySnapshot = await getDocs(q);
        const fechaAprox = new Date(tasting.fecha).toISOString().slice(0, 16);
        
        const movementsToDelete = querySnapshot.docs.filter(docSnap => {
            const d = docSnap.data();
            // Verificación adicional de fecha para asegurar que borramos el grupo correcto
            return new Date(d.fecha).toISOString().slice(0, 16) === fechaAprox &&
                   (tasting.usuario ? d.usuario === tasting.usuario : true);
        });
        
        // Restaurar stock de cada ingrediente y borrar el movimiento
        for (const docSnap of movementsToDelete) {
            const movData = docSnap.data();
            const ingredRef = doc(db, INVENTORY_COLLECTION, movData.ingrediente_id);
            const ingredSnap = await getDoc(ingredRef);
            if (ingredSnap.exists()) {
                const currentStock = ingredSnap.data().stock || 0;
                await updateDoc(ingredRef, { stock: currentStock + movData.cantidad });
            }
            await deleteDoc(doc(db, MOVEMENTS_COLLECTION, docSnap.id));
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting tasting movements: ", error);
        throw error;
    }
};

export const getMovements = async (page = 1) => {
    try {
        const querySnapshot = await getDocs(query(collection(db, MOVEMENTS_COLLECTION), orderBy('fecha', 'desc')));
        const movements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const pageSize = 10;
        const startIndex = (page - 1) * pageSize;
        const paginatedResults = movements.slice(startIndex, startIndex + pageSize);

        return {
            results: paginatedResults,
            count: movements.length
        };
    } catch (error) {
        console.error("Error getting movements: ", error);
        throw error;
    }
};

export const getInventorySummary = async () => {
    try {
        // En un backend real haríamos agregación, aquí enviamos un resumen básico
        const querySnapshot = await getDocs(collection(db, INVENTORY_COLLECTION));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let totalItems = items.length;
        let totalStock = items.reduce((acc, current) => acc + (Number(current.stock) || 0), 0);
        let lowStockItems = items.filter(i => (Number(i.stock) || 0) < (Number(i.stockMinimo) || 5)).length;

        return {
            totalItems,
            totalStock,
            lowStockItems
        };
    } catch (error) {
        console.error("Error getting inventory summary: ", error);
        throw error; // En modo local / test fallará silenciosamente si no hay data
    }
};
