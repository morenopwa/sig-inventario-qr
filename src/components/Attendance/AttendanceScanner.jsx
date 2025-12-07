// src/components/Attendance/AttendanceScanner.jsx
import React from 'react';
import  useAttendance from '../../hooks/useAttendance';
import AttendanceTabs from './AttendanceTabs/AttendanceTabs';
import './AttendanceScanner.css';

const AttendanceScanner = () => {
  const { 
    workers, 
    loading, 
    addWorker, 
    updateWorker, 
    deleteWorker 
  } = useAttendance();

  return (
    <div className="attendance-container">
      <AttendanceTabs
        workers={workers}
        addWorker={addWorker}
        loading={loading}
      />
    </div>
  );
};

export default AttendanceScanner;