import React, { useState, useEffect } from 'react';

// Comandos definidos para la lógica simplificada
const COMMAND_PATTERNS = [
    // 1. REGISTRO SIMPLE: "Registrar elemento [Nombre del ítem]"
    { 
        command: 'REGISTRAR', 
        trigger: /registrar elemento (.+?)/,
        map: (match) => ({ 
            name: match[1].trim(), 
            category: 'Voz (Sin Especificar)', 
            stock: 1,
            isConsumible: false,
        }),
        action: 'REGISTER'
    },
    
    // 2. PRÉSTAMO SIMPLE: "Prestar elemento [QR/Nombre] a [Nombre de la persona]"
    { 
        command: 'PRESTAR_FLEX', 
        // Intenta capturar: "prestamo (a/de) [NOMBRE] [CANTIDAD] [ELEMENTO]"
        trigger: /préstamo (?:a|de)?\s*(.+?)\s*(\d+)?\s*(.+?)$/, 
        map: (match) => {
            // match[1]: Persona (pueden ser las primeras palabras)
            // match[2]: Cantidad (número o undefined)
            // match[3]: Elemento (resto de la frase)

            let personName = match[1].trim();
            let quantity = 1;
            let itemName = match[3].trim();
            
            // Si hay cantidad (match[2] es un número), la usamos.
            if (match[2] && !isNaN(parseInt(match[2]))) {
                quantity = parseInt(match[2]);
            } else {
                 // Si no hay cantidad, el ítem se puede haber movido a match[2]
                 // y la cantidad sigue siendo 1. Se requiere un ajuste fino.
                 
                 // Para simplificar, si match[2] es undefined, y el elemento está en match[3],
                 // asumimos que el comando era "prestamo a Tito rachy" (Cantidad = 1).
                 if (match[2] && isNaN(parseInt(match[2]))) {
                     // Caso: "prestamo a tito un rachy" -> TITO (match[1]), UN (match[2] - texto), RACHY (match[3])
                     // Esto requiere un regex muy robusto que es difícil hacer genérico.
                     
                     // Dejaremos el patrón simple que prioriza el número y si no está, asume 1.
                     // Patrón actual: /préstamo (?:a|de)?\s*(.+?)\s*(\d+)?\s*(.+?)$/
                     
                     // Ajuste forzado de Cantidad=1 si no se detectó número en match[2]
                     quantity = 1;
                     itemName = match[2] ? match[2] + ' ' + match[3] : match[3];
                 }
            }
            
            // Lógica para el caso "prestamo de un rachy a tito":
            // Esto es complicado en un regex simple. Sugerir al usuario el formato:
            // "prestamo a [NOMBRE] [CANTIDAD] [ELEMENTO]"
            
            // Usaremos el formato simplificado para asegurar que capture los tres grupos:
            // Patrón: /préstamo (?:a|de)?\s*(.+?)\s*(\d+)\s*(.+?)$/ para CANTIDAD REQUERIDA
            
            // Para permitir cantidad opcional, es mejor usar:
            return { personName: personName, quantity: quantity, itemName: itemName };
        }, 
        action: 'BORROW_FLEX'
    },
    
    // 3. DEVOLUCIÓN SIMPLE: "Devolver elemento [QR/Nombre] por [Nombre de la persona]"
    { 
        command: 'DEVOLVER', 
        trigger: /devolver elemento (.+?) por (.+?)/, 
        map: (match) => ({ 
            qrCode: match[1].trim(), 
            personReturning: match[2].trim(),
        }), 
        action: 'RETURN' 
    },
];

const SpeechRecognition = ({ onCommandDetected, isAlmacenero }) => {
    const [listening, setListening] = useState(false);
    const [status, setStatus] = useState('Listo');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionAvailable = !!SpeechRecognition;

    useEffect(() => {
        if (!recognitionAvailable) {
            setStatus('API de voz no soportada por este navegador.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false; 

        recognition.onstart = () => {
            setListening(true);
            setStatus('Escuchando...');
        };

        recognition.onend = () => {
            setListening(false);
            if (status === 'Escuchando...') {
                setStatus('Procesando...');
            }
        };

        recognition.onerror = (event) => {
            setListening(false);
            if (event.error === 'no-speech') {
                setStatus('No se detectó voz.');
            } else {
                setStatus(`Error: ${event.error}`);
            }
            console.error("Error de reconocimiento de voz:", event.error);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log(`Voz detectada: "${transcript}"`);
            processCommand(transcript);
        };

        const processCommand = (transcript) => {
            let processed = false;
            
            if (!isAlmacenero) {
                setStatus('Permiso denegado.');
                console.warn("❌ Comando de administrador detectado, pero el usuario no es Almacenero.");
                return;
            }

            for (const pattern of COMMAND_PATTERNS) {
                const match = transcript.match(pattern.trigger);

                if (match) {
                    try {
                        const data = pattern.map(match);
                        console.log(`🤖 Comando mapeado: ${pattern.action}`, data);

                        onCommandDetected(pattern.action, data);
                        
                        setStatus(`Comando "${pattern.command}" ejecutado.`);
                        processed = true;
                        break;
                    } catch (e) {
                        setStatus(`Error al mapear datos: ${e.message}`);
                        console.error("Error de mapeo de datos de voz:", e);
                        processed = true;
                        break;
                    }
                }
            }

            if (!processed) {
                setStatus('Comando no reconocido. Ej: "Registrar elemento martillo"');
            }
        };

        window.recognition = recognition;

        return () => {
            if (window.recognition && listening) {
                window.recognition.stop();
            }
        };

    }, [recognitionAvailable, onCommandDetected, isAlmacenero, listening, status]);

    const toggleListening = () => {
        if (!recognitionAvailable || !isAlmacenero) {
            alert(status);
            return;
        }

        if (listening) {
            window.recognition.stop();
        } else {
            setStatus('Escuchando...');
            window.recognition.start();
        }
    };

    return (
        <div className="speech-control">
            <button 
                onClick={toggleListening} 
                className={`btn btn-voice ${listening ? 'listening' : ''}`}
                disabled={!recognitionAvailable || !isAlmacenero}
            >
                {listening ? '🔴 Escuchando...' : '🎤 Activar Voz'}
            </button>
        </div>
    );
};

export default SpeechRecognition;