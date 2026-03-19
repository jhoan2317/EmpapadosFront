/**
 * Servicio de impresión para tickets térmicos
 */
export const printThermalTicket = (orderData, config) => {
    // 1. Limpiar iframe previo para evitar basura o caché
    const ticketId = `thermal-ticket-iframe-${Date.now()}`;
    const oldIframes = document.querySelectorAll('[id^="thermal-ticket-iframe"]');
    oldIframes.forEach(el => el.remove());

    const iframe = document.createElement('iframe');
    iframe.id = ticketId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // 2. Construir el HTML del ticket
    const obsLines = orderData.observaciones ? orderData.observaciones.split(' || ') : [];

    const itemsHtml = orderData.items.map((item, index) => {
        let itemSins = [];
        let itemAdiciones = [];
        let itemBebidas = [];
        let itemCambios = "";

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
            <div style="margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 3px;">
                <div style="font-weight: normal; margin-bottom: 2px;">
                    ${item.cantidad}x ${item.producto_nombre}
                </div>
                <div style="text-align: right; font-weight: normal; padding-right: 15px;">
                    $${(item.precio_total).toLocaleString()}
                </div>
                ${itemSins.length > 0 ? `<div style="font-size: 10px; font-style: italic;">${itemSins.map(s => s.toLowerCase()).join(', ')}.</div>` : ''}
                ${itemAdiciones.length > 0 ? `<div style="font-size: 10px;">ADICIONES: ${itemAdiciones.join(', ')}.</div>` : ''}
                ${itemCambios ? `<div style="font-size: 10px;">CAMBIOS: ${itemCambios}</div>` : ''}
                ${itemBebidas.length > 0 ? `<div style="font-size: 10px;">BEBIDAS: ${itemBebidas.join(', ')}.</div>` : ''}
            </div>
        `;
    }).join('');

    const htmlContent = `
        <html>
        <head>
            <style>
                @page { margin: 0; size: 58mm auto; }
                body { 
                    font-family: monospace; 
                    width: 44mm; 
                    margin: 0 auto; 
                    padding: 0; 
                    font-size: 12px;
                    line-height: 1.1;
                    -webkit-print-color-adjust: exact;
                }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 4px 0; }
                .header { font-size: 12px; text-transform: uppercase; }
            </style>
        </head>
        <body onload="window.focus(); window.print();">
            <div class="text-center">
                <div class="header">${config?.site_name || 'EMPAPADOS POP'}</div>
                <div>${config?.address || ''}</div>
                <div>Barrio la Sombrilla</div>
                <div>${config?.contact_phone || ''}</div>
                <div class="divider"></div>
                <div>ORDEN #${orderData.id || orderData.puesto || '---'}</div>
                <div>${new Date().toLocaleString()}</div>
            </div>
            
            <div class="divider"></div>
            
            <div>CLIENTE:</div>
            <div>${orderData.cliente_nombre || 'Cliente General'}</div>
            ${orderData.tipo_entrega === 'domicilio'
            ? `<div>DOM: ${orderData.direccion}</div><div>TEL: ${orderData.telefono || 'N/A'}</div>`
            : `<div>MESA: #${orderData.numero_mesa || '---'}</div>`
            }
            
            <div class="divider"></div>
            <div class="items">${itemsHtml}</div>
            <div class="divider"></div>
            
            <div style="display: flex; justify-content: space-between; padding-right: 15px;">
                <span>TOTAL:</span>
                <span>$${(orderData.total || 0).toLocaleString()}</span>
            </div>
            
            <div class="divider"></div>
            <div class="text-center" style="margin-top: 10px;">¡GRACIAS POR TU COMPRA!</div>
            <div style="height: 20px;"></div>
        </body>
        </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
};
