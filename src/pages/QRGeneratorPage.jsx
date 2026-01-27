import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Cambiamos Canvas por SVG
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const QRGeneratorPage = () => {
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/inventory/items`);
                setItems(res.data);
            } catch (err) { console.error("Error cargando items", err); }
        };
        fetchItems();
    }, []);

    const toggleItem = (qrCode) => {
        setSelectedItems(prev => 
            prev.includes(qrCode) ? prev.filter(i => i !== qrCode) : [...prev, qrCode]
        );
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const content = document.getElementById('qr-print-area').innerHTML;
        
        // Agregamos estilos para que los SVG se vean bien en la impresión
        printWindow.document.write(`
            <html>
            <head>
                <title>Imprimir QRs</title>
                <style>
                    body { display: flex; flex-wrap: wrap; gap: 10mm; font-family: sans-serif; padding: 10mm; }
                    .qr-card { 
                        border: 1px solid #ccc; 
                        padding: 10px; 
                        text-align: center; 
                        width: 40mm; 
                        page-break-inside: avoid;
                    }
                    svg { width: 35mm !important; height: 35mm !important; }
                    p { font-size: 10px; margin: 5px 0 0 0; word-break: break-all; }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        
        // Esperamos un momento a que el navegador procese el HTML antes de imprimir
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#0b141a', minHeight: '100vh' }}>
            <h1>📄 Generador de Etiquetas QR</h1>
            <p style={{color: '#8696a0'}}>Selecciona los elementos que deseas imprimir:</p>
            
            <button 
                onClick={handlePrint} 
                style={st.btnPrimary}
                disabled={selectedItems.length === 0}
            >
                🖨️ Imprimir Seleccionados ({selectedItems.length})
            </button>

            <div style={st.grid}>
                {items.map(item => (
                    <div key={item._id} 
                         onClick={() => toggleItem(item.qrCode)}
                         style={{...st.card, borderColor: selectedItems.includes(item.qrCode) ? '#00a884' : '#2a3942'}}>
                        {/* Usamos SVG aquí también */}
                        <QRCodeSVG value={item.qrCode} size={80} bgColor="#ffffff" />
                        <p style={{fontSize: '12px', marginTop: '8px', fontWeight: 'bold'}}>{item.name}</p>
                        <small style={{color: '#8696a0'}}>{item.qrCode}</small>
                    </div>
                ))}
            </div>

            {/* Área de impresión (Invisible en la pantalla principal) */}
            <div id="qr-print-area" style={{ display: 'none' }}>
                {items.filter(i => selectedItems.includes(i.qrCode)).map(item => (
                    <div className="qr-card" key={item._id}>
                        <QRCodeSVG value={item.qrCode} size={128} />
                        <p><strong>{item.name}</strong></p>
                        <p>{item.qrCode}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const st = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px', marginTop: '20px' },
    card: { backgroundColor: '#111b21', padding: '15px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: '0.2s' },
    btnPrimary: { 
        backgroundColor: '#00a884', 
        color: 'white', 
        border: 'none', 
        padding: '12px 25px', 
        borderRadius: '25px', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        opacity: (props) => props.disabled ? 0.5 : 1 
    }
};

export default QRGeneratorPage;