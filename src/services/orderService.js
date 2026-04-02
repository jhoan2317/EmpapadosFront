import { db } from '../firebase/config';
import { getProductRecipes } from './productService';
import { registerInventoryExit } from './inventoryService';
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
    orderBy,
    collectionGroup
} from "firebase/firestore";

const ORDERS_COLLECTION = 'pedidos';

export const getOrders = async (date = null, page = 1, type = 'todas', status = null) => {
    try {
        // Para eficiencia, solo filtramos por fecha en la base de datos si se proporciona
        let q = collection(db, ORDERS_COLLECTION);
        let firestoreQuery = query(q, orderBy('fecha', 'desc'));

        if (date) {
            firestoreQuery = query(firestoreQuery, where('fecha', '==', date));
        }

        const querySnapshot = await getDocs(firestoreQuery);
        
        // Realizamos el filtrado de estado y tipo en JS para evitar problemas de mayúsculas/minúsculas e índices
        let filteredOrders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter(order => {
            // Filtro de Estado (ej: 'pagado')
            if (status && order.estado?.toLowerCase() !== status.toLowerCase()) return false;
            
            // Filtro de Tipo (local/domicilio)
            if (type && type !== 'todas') {
                const orderType = order.tipo_pedido || "";
                if (orderType.toLowerCase() !== type.toLowerCase()) return false;
            }
            
            return true;
        });

        // Ordenamos por tiempo de creación (más reciente primero)
        filteredOrders.sort((a, b) => {
            const dateA = a.createdAt || a.fecha || "";
            const dateB = b.createdAt || b.fecha || "";
            return dateB.localeCompare(dateA);
        });

        // Calcular el monto total de todos los pedidos filtrados (global)
        const totalAmount = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

        const pageSize = 10;
        const startIndex = (page - 1) * pageSize;
        const paginatedResults = filteredOrders.slice(startIndex, startIndex + pageSize);

        return {
            results: paginatedResults,
            count: filteredOrders.length,
            totalAmount: totalAmount
        };
    } catch (error) {
        console.error("Error getting orders: ", error);
        throw error;
    }
};

export const getOrder = async (id) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("Order not found");
        }
    } catch (error) {
        console.error("Error getting order: ", error);
        throw error;
    }
};

export const updateOrderStatus = async (id, status) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, id);
        await updateDoc(docRef, { estado: status });
        return { id, estado: status };
    } catch (error) {
        console.error("Error updating order status: ", error);
        throw error;
    }
};

export const updateOrder = async (id, orderData) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, id);
        await updateDoc(docRef, orderData);
        return { id, ...orderData };
    } catch (error) {
        console.error("Error updating order: ", error);
        throw error;
    }
};

export const deleteOrder = async (id) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting order: ", error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
            ...orderData,
            fecha: orderData.fecha || (() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })(),
            createdAt: new Date().toISOString(),
            inventario_descontado: false // Flag para evitar doble descuento
        });
        return { id: docRef.id, ...orderData };
    } catch (error) {
        console.error("Error creating order: ", error);
        throw error;
    }
};

export const deductInventoryFromOrder = async (orderId) => {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) throw new Error("Order not found");
        
        const orderData = orderSnap.data();
        
        // Evitar doble descuento
        if (orderData.inventario_descontado) {
            console.log("Inventario ya descontado para este pedido");
            return { success: true, alreadyDeducted: true };
        }

        const details = orderData.detalles || [];
        
        for (const item of details) {
            // Buscamos la receta del producto
            const recipes = await getProductRecipes(item.producto);
            
            for (const row of recipes) {
                // Cantidad total a descontar = receta_unitario * cantidad_pedido
                const totalDeduction = parseFloat(row.cantidad) * parseInt(item.cantidad);
                
                await registerInventoryExit({
                    ingrediente_id: row.ingrediente,
                    cantidad: totalDeduction,
                    motivo: `Venta Pedido #${orderId.slice(-5)}`
                });
            }
        }

        // Marcamos como descontado
        await updateDoc(orderRef, { inventario_descontado: true });
        
        return { success: true };
    } catch (error) {
        console.error("Error deducting inventory from order:", error);
        throw error;
    }
};
