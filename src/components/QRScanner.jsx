import React, { useState, useRef, useEffect } from 'react';
import Scanner from "./Scanner/Scanner";
import EquipmentTable from "./EquipmentTable/EquipmentTable";
import ManualAddForm from "./ManualAddForm/ManualAddForm";
import SearchBar from "./SearchBar/SearchBar";
import { useEquipment } from "../hooks/useEquipment";
import { useScanner } from "../hooks/useScanner";
import "./QRScanner.css";

const QRScanner = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
    equipments, 
    loading: equipmentLoading, 
    addEquipment, 
    assignUser, 
    removeAssignment,
    fetchEquipments 
  } = useEquipment();

  const {
    isScannerActive,
    scanResult,
    loading: scanLoading,
    scanError,
    scannerRef,
    toggleScanner,
    resetScanResult
  } = useScanner();

  // Manejar resultado del escaneo
  React.useEffect(() => {
    if (scanResult) {
      console.log('Resultado del escaneo:', scanResult);
    }
  }, [scanResult]);

  const handleAssignUser = async (equipment) => {
    const personName = prompt('Ingresa el nombre de la persona:');
    if (!personName) return;

    const result = await assignUser(equipment.qrCode, personName);
    if (result.success) {
      alert('✅ ' + result.message);
    } else {
      alert('❌ ' + result.message);
    }
  };

  const handleRemoveAssignment = async (equipment) => {
    if (!confirm(`¿Estás seguro de quitar la asignación a ${equipment.currentHolder}?`)) return;

    const result = await removeAssignment(equipment.qrCode);
    if (result.success) {
      alert('✅ ' + result.message);
    } else {
      alert('❌ ' + result.message);
    }
  };

  const handleManualAdd = async (equipmentData) => {
    const result = await addEquipment(equipmentData);
    if (result.success) {
      alert('✅ ' + result.message);
    } else {
      alert('❌ ' + result.message);
    }
    return result;
  };

  return (
    <div className="qr-scanner-container">
      <header className="app-header">
        <h1>Inventario QR</h1>
        
        <Scanner 
          isActive={isScannerActive}
          loading={scanLoading}
          scannerRef={scannerRef}
          onToggle={toggleScanner}
          scanError={scanError}
        />

        <ManualAddForm 
          onAdd={handleManualAdd}
          loading={equipmentLoading}
        />
      </header>

      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <EquipmentTable 
        equipments={equipments}
        isScannerView={isScannerActive}
        onAssignUser={handleAssignUser}
        onRemoveAssignment={handleRemoveAssignment}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default QRScanner;