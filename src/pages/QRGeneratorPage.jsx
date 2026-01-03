import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Versión más estable para React
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
        printWindow.document.write(`
            <html>
            <head>
                <style>
                    body { display: flex; flex-wrap: wrap; gap: 20px; font-family: sans-serif; }
                    .qr-card { border: 1px solid #000; padding: 10px; text-align: center; width: 120px; }
                    canvas { width: 100px !important; height: 100px !important; }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#0b141a', minHeight: '100vh' }}>
            <h1>📄 Generador de Etiquetas QR</h1>
            <button onClick={handlePrint} style={st.btnPrimary}>🖨️ Imprimir Seleccionados ({selectedItems.length})</button>

            <div style={st.grid}>
                {items.map(item => (
                    <div key={item._id} 
                         onClick={() => toggleItem(item.qrCode)}
                         style={{...st.card, borderColor: selectedItems.includes(item.qrCode) ? '#00a884' : '#2a3942'}}>
                        <QRCodeCanvas value={item.qrCode} size={80} bgColor="#ffffff" />
                        <p style={{fontSize: '12px', marginTop: '5px'}}>{item.name}</p>
                        <small>{item.qrCode}</small>
                    </div>
                ))}
            </div>

            {/* Área oculta para captura de impresión */}
            <div id="qr-print-area" style={{ display: 'none' }}>
                {items.filter(i => selectedItems.includes(i.qrCode)).map(item => (
                    <div className="qr-card" key={item._id}>
                        <QRCodeCanvas value={item.qrCode} size={128} />
                        <p>{item.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const st = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', marginTop: '20px' },
    card: { backgroundColor: '#111b21', padding: '10px', borderRadius: '8px', border: '2px solid', cursor: 'pointer', textAlign: 'center' },
    btnPrimary: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default QRGeneratorPage;