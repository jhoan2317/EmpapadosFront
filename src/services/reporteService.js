import { db } from '../firebase/config';
import { collection, query, where, getDocs } from "firebase/firestore";

export const getReporteHoy = async (fecha = null) => {
    try {
        const targetDate = fecha || new Date().toISOString().split('T')[0];

        // 1. Obtener Pedidos (Ventas) del día con estado "pagado"
        const pedidosRef = collection(db, 'pedidos');
        const pedidosQuery = query(pedidosRef, where('fecha', '==', targetDate));
        const pedidosSnap = await getDocs(pedidosQuery);
        
        let ingresos_efectivo = 0;
        let ingresos_nequi = 0;

        pedidosSnap.forEach((doc) => {
            const pedido = doc.data();
            // Solo sumar si está pagado o si no controlábamos el estado estrictamente
            if (pedido.estado === 'pagado' || !pedido.estado) {
                const total = parseFloat(pedido.total) || 0;
                const metodo = (pedido.metodo_pago || '').toLowerCase();
                
                if (metodo.includes('nequi')) {
                    ingresos_nequi += total;
                } else {
                    ingresos_efectivo += total;
                }
            }
        });

        const ingresos = ingresos_efectivo + ingresos_nequi;

        // 2. Obtener Gastos del día
        const gastosRef = collection(db, 'gastos');
        const gastosQuery = query(gastosRef, where('fecha', '==', targetDate));
        const gastosSnap = await getDocs(gastosQuery);

        let gastos = 0;
        gastosSnap.forEach((doc) => {
            const gasto = doc.data();
            gastos += parseFloat(gasto.monto) || 0;
        });

        // 3. Calcular ganancia
        const ganancia = ingresos - gastos;

        return {
            fecha: targetDate,
            ingresos,
            ingresos_efectivo,
            ingresos_nequi,
            gastos,
            ganancia
        };
    } catch (error) {
        console.error("Error generating report: ", error);
        throw error;
    }
};
