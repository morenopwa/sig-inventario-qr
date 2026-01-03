const SalaryCalculator = ({ user }) => {
    // Ejemplo: Supongamos que el backend nos da los días asistidos
    const daysWorked = 6; 
    const dailyRate = user.dailyRate || 50; // Ejemplo 50 soles/día

    return (
        <div style={s.salaryCard}>
            <h3>Monto Estimado Semanal 💰</h3>
            <div style={s.row}>
                <span>Días laborados:</span>
                <span>{daysWorked}</span>
            </div>
            <div style={s.row}>
                <span>Tarifa por día:</span>
                <span>S/ {dailyRate}</span>
            </div>
            <hr style={{borderColor: '#2a3942'}} />
            <div style={{...s.row, fontSize: '20px', color: '#00a884', fontWeight: 'bold'}}>
                <span>Total a cobrar:</span>
                <span>S/ {daysWorked * dailyRate}</span>
            </div>
        </div>
    );
};