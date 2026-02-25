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
    const itemsHtml = orderData.items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="flex: 1;">${item.cantidad}x ${item.producto_nombre}</span>
            <span>$${(item.precio_total).toLocaleString()}</span>
        </div>
        ${item.adiciones && item.adiciones.length > 0 ?
            `<div style="font-size: 10px; margin-left: 10px; margin-bottom: 4px;">
                + ${item.adiciones.map(a => a.nombre).join(', ')}
            </div>` : ''
        }
    `).join('');

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
            ${orderData.tipo_entrega === 'domicilio' ? `<div>DOMICILIO: ${orderData.direccion}</div>` : '<div>PARA MESA / RECOGER</div>'}
            
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
