/**
 * Servicio de impresión para tickets térmicos
 */

export const printThermalTicket = (orderData, config) => {
    // 1. Crear un contenedor temporal para el ticket
    const ticketId = 'thermal-ticket-iframe';
    let iframe = document.getElementById(ticketId);

    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = ticketId;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;

    // 2. Construir el HTML del ticket
    const obsLines = orderData.observaciones ? orderData.observaciones.split(' || ') : [];

    const itemsHtml = orderData.items.map((item, index) => {
        // Inicializar categorías
        let itemSins = [];
        let itemAdiciones = [];
        let itemBebidas = [];
        let itemCambios = "";

        // 1. Prioridad: Datos estructurados (si existen)
        if (item.adiciones && item.adiciones.length > 0) {
            itemSins = item.adiciones.filter(a => a.nombre.startsWith('Sin') || a.nombre.toLowerCase().startsWith('solo')).map(a => a.nombre);
            itemAdiciones = item.adiciones.filter(a => a.nombre.startsWith('Adicion')).map(a => a.nombre);
            itemBebidas = item.adiciones.filter(a => 
                !a.nombre.startsWith('Sin') && 
                !a.nombre.toLowerCase().startsWith('solo') && 
                !a.nombre.startsWith('Adicion')
            ).map(a => a.nombre);
        }

        if (item.swapOriginalText || item.swapOriginal) {
            itemCambios = `Cambiar ${item.swapOriginalText || item.swapOriginal} por ${item.swapReplacementText || item.swapReplacement}`;
        }

        // 2. Fallback/Enriquecimiento: Parsear desde observaciones (especialmente para AdminPedidos)
        const line = obsLines[index] || "";
        if (line) {
            const parts = line.split(': ');
            if (parts.length > 1) {
                const detailsFull = parts.slice(1).join(': ');
                const [persoPart, cambiosPart] = detailsFull.split(' | ');
                
                if (itemAdiciones.length === 0 && itemSins.length === 0 && itemBebidas.length === 0 && persoPart && persoPart !== "Sin personalización") {
                    const persoList = persoPart.split(', ');
                    itemSins = persoList.filter(p => p.startsWith('Sin') || p.toLowerCase().startsWith('solo'));
                    itemAdiciones = persoList.filter(p => p.startsWith('Adicion'));
                    itemBebidas = persoList.filter(p => !p.startsWith('Sin') && !p.toLowerCase().startsWith('solo') && !p.startsWith('Adicion'));
                }
                
                if (!itemCambios && cambiosPart && cambiosPart.includes('Cambios: ')) {
                    itemCambios = cambiosPart.replace('Cambios: ', '');
                }
            }
        }

        return `
            <div style="margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>${item.cantidad}x ${item.producto_nombre}</span>
                    <span>$${(item.precio_total).toLocaleString()}</span>
                </div>
                
                ${itemSins.length > 0 ? `
                    <div style="font-size: 11px; font-style: italic; color: #555; margin-left: 5px;">
                        ${itemSins.map(s => s.toLowerCase()).join(', ')}.
                    </div>
                ` : ''}

                ${itemAdiciones.length > 0 ? `
                    <div style="margin-top: 2px; margin-left: 5px;">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Adiciones:</div>
                        <div style="font-size: 11px;">${itemAdiciones.join(', ')}.</div>
                    </div>
                ` : ''}

                ${itemCambios ? `
                    <div style="margin-top: 2px; margin-left: 5px;">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Cambios:</div>
                        <div style="font-size: 11px; color: #007bff;">${itemCambios}</div>
                    </div>
                ` : ''}

                ${itemBebidas.length > 0 ? `
                    <div style="margin-top: 2px; margin-left: 5px;">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase;">Bebidas:</div>
                        <div style="font-size: 11px;">${itemBebidas.join(', ')}.</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const htmlContent = `
        <html>
        <head>
            <style>
                @page { margin: 0; size: 58mm auto; }
                body { 
                    font-family: 'Courier New', Courier, monospace; 
                    width: 58mm; 
                    margin: 0; 
                    padding: 5px; 
                    font-size: 12px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; }
                .bold { font-weight: bold; }
                .header { font-size: 16px; margin-bottom: 5px; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <div class="header bold">${config?.site_name || 'EMPAPADOS POP'}</div>
                <div>${config?.address || ''}</div>
                <div>${config?.contact_phone || ''}</div>
                <div class="divider"></div>
                <div class="bold">ORDEN #${orderData.id || orderData.puesto || '---'}</div>
                <div>${new Date().toLocaleString()}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="bold">CLIENTE:</div>
            <div>${orderData.cliente_nombre || 'Cliente General'}</div>
            ${orderData.tipo_entrega === 'domicilio'
            ? `<div>DOMICILIO: ${orderData.direccion}</div>
                   <div>TEL: ${orderData.telefono || 'N/A'}</div>`
            : `<div>MESA: #${orderData.numero_mesa || '---'}</div>`
        }
            
            <div class="divider"></div>
            
            <div class="items">
                ${itemsHtml}
            </div>
            
            <div class="divider"></div>
            
            <div style="display: flex; justify-content: space-between;" class="bold">
                <span>TOTAL:</span>
                <span>$${(orderData.total || 0).toLocaleString()}</span>
            </div>
            

            
            <div class="divider"></div>
            
            <div class="text-center" style="margin-top: 10px;">
                ¡GRACIAS POR TU COMPRA!
            </div>
            <div style="margin-bottom: 20px;"></div>
        </body>
        </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // 3. Imprimir
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 500);
};
