import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isAllowed, redirectTo = "/", children }) => {
    if (!isAllowed) {
        return <Navigate to={redirectTo} replace />;
    }
    return children ? children : <Outlet />;
};

// ESTA ES LA LÍNEA QUE TE FALTA:
export default ProtectedRoute;