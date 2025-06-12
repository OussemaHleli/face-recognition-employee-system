import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Si l'utilisateur n'est pas connecté, redirige vers la page de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Sinon, affiche les enfants (composants protégés)
  return children;
};

export default PrivateRoute;