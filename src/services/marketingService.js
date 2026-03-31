import { db } from '../firebase/config';
import { 
    collection, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    setDoc
} from "firebase/firestore";

const HERO_COLLECTION = 'marketing_hero';
const FEATURES_COLLECTION = 'marketing_features';
const TESTIMONIALS_COLLECTION = 'marketing_testimonials';
const CONFIG_COLLECTION = 'marketing_config';
const SINGLE_CONFIG_ID = 'global_config';

// HERO SECTIONS
export const getHeroSections = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, HERO_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting hero sections: ", error);
        throw error;
    }
};

export const createHero = async (data) => {
    try {
        const docRef = await addDoc(collection(db, HERO_COLLECTION), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error("Error creating hero section: ", error);
        throw error;
    }
};

export const updateHero = async (id, data) => {
    try {
        const docRef = doc(db, HERO_COLLECTION, id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error("Error updating hero section: ", error);
        throw error;
    }
};

export const deleteHero = async (id) => {
    try {
        const docRef = doc(db, HERO_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting hero section: ", error);
        throw error;
    }
};

// FEATURES
export const getFeatures = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, FEATURES_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting features: ", error);
        throw error;
    }
};

export const createFeature = async (data) => {
    try {
        const docRef = await addDoc(collection(db, FEATURES_COLLECTION), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error("Error creating feature: ", error);
        throw error;
    }
};

export const updateFeature = async (id, data) => {
    try {
        const docRef = doc(db, FEATURES_COLLECTION, id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error("Error updating feature: ", error);
        throw error;
    }
};

export const deleteFeature = async (id) => {
    try {
        const docRef = doc(db, FEATURES_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting feature: ", error);
        throw error;
    }
};

// TESTIMONIALS
export const getTestimonials = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, TESTIMONIALS_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting testimonials: ", error);
        throw error;
    }
};

export const createTestimonial = async (data) => {
    try {
        const docRef = await addDoc(collection(db, TESTIMONIALS_COLLECTION), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error("Error creating testimonial: ", error);
        throw error;
    }
};

export const updateTestimonial = async (id, data) => {
    try {
        const docRef = doc(db, TESTIMONIALS_COLLECTION, id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error("Error updating testimonial: ", error);
        throw error;
    }
};

export const deleteTestimonial = async (id) => {
    try {
        const docRef = doc(db, TESTIMONIALS_COLLECTION, id);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting testimonial: ", error);
        throw error;
    }
};

// CONFIG
export const getGlobalConfig = async () => {
    try {
        // Obtenemos todos los documentos de config (normalmente debería ser solo uno)
        const querySnapshot = await getDocs(collection(db, CONFIG_COLLECTION));
        const configs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return configs.length > 0 ? configs[0] : null;
    } catch (error) {
        console.error("Error getting config: ", error);
        throw error;
    }
};

export const upsertConfig = async (id, data) => {
    try {
        // En Firestore, si no sabemos si existe, setDoc con un ID fijo funciona bien.
        // Si nos pasan un ID, lo usamos, si no, usamos uno fijo.
        const docId = id || SINGLE_CONFIG_ID;
        const docRef = doc(db, CONFIG_COLLECTION, docId);
        await setDoc(docRef, data, { merge: true });
        return { id: docId, ...data };
    } catch (error) {
        console.error("Error upserting config: ", error);
        throw error;
    }
};
