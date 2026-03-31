import { db, storage } from '../firebase/config';
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const CATEGORIES_COLLECTION = 'categorias';
const PRODUCTS_COLLECTION = 'productos';
const RECETAS_COLLECTION = 'recetas';

// CATEGORIAS
export const getCategories = async () => {
    try {
        const querySnapshot = await getDocs(query(collection(db, CATEGORIES_COLLECTION), orderBy('nombre', 'asc')));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting categories: ", error);
        throw error;
    }
};

export const createCategory = async (categoryData) => {
    try {
        const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), categoryData);
        return { id: docRef.id, ...categoryData };
    } catch (error) {
        console.error("Error creating category: ", error);
        throw error;
    }
};

export const updateCategory = async (id, categoryData) => {
    try {
        const docRef = doc(db, CATEGORIES_COLLECTION, id);
        await updateDoc(docRef, categoryData);
        return { id, ...categoryData };
    } catch (error) {
        console.error("Error updating category: ", error);
        throw error;
    }
};

export const deleteCategory = async (id) => {
    try {
        const docRef = doc(db, CATEGORIES_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting category: ", error);
        throw error;
    }
};

// PRODUCTOS
export const getProducts = async (page = null) => {
    try {
        const querySnapshot = await getDocs(query(collection(db, PRODUCTS_COLLECTION), orderBy('nombre', 'asc')));
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Simular respuesta paginada para mantener compatibilidad si es necesario
        if (page === null) {
            return products;
        }

        const pageSize = 10;
        const startIndex = (page - 1) * pageSize;
        const paginatedResults = products.slice(startIndex, startIndex + pageSize);

        return {
            results: paginatedResults,
            count: products.length
        };
    } catch (error) {
        console.error("Error getting products: ", error);
        throw error;
    }
};

export const getProduct = async (id) => {
    try {
        const docRef = doc(db, PRODUCTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("Product not found");
        }
    } catch (error) {
        console.error("Error getting product: ", error);
        throw error;
    }
};

export const createProduct = async (productData) => {
    try {
        const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData);
        return { id: docRef.id, ...productData };
    } catch (error) {
        console.error("Error creating product: ", error);
        throw error;
    }
};

export const updateProduct = async (id, productData) => {
    try {
        const docRef = doc(db, PRODUCTS_COLLECTION, id);
        await updateDoc(docRef, productData);
        return { id, ...productData };
    } catch (error) {
        console.error("Error updating product: ", error);
        throw error;
    }
};

export const deleteProduct = async (id) => {
    try {
        const docRef = doc(db, PRODUCTS_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw error;
    }
};

// RECETAS
export const getProductRecipes = async (productId) => {
    try {
        const q = query(collection(db, RECETAS_COLLECTION), where("producto", "==", productId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting product recipes: ", error);
        throw error;
    }
};

export const createRecipe = async (recipeData) => {
    try {
        const docRef = await addDoc(collection(db, RECETAS_COLLECTION), recipeData);
        return { id: docRef.id, ...recipeData };
    } catch (error) {
        console.error("Error creating recipe: ", error);
        throw error;
    }
};

export const updateRecipe = async (id, recipeData) => {
    try {
        const docRef = doc(db, RECETAS_COLLECTION, id);
        await updateDoc(docRef, recipeData);
        return { id, ...recipeData };
    } catch (error) {
        console.error("Error updating recipe: ", error);
        throw error;
    }
};

export const deleteRecipe = async (id) => {
    try {
        const docRef = doc(db, RECETAS_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting recipe: ", error);
        throw error;
    }
};
