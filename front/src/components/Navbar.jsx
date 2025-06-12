import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { 
  FaBell, 
  FaUserCircle, 
  FaUsers, 
  FaSignOutAlt, 
  FaExclamationTriangle, 
  FaUserShield,
  FaFingerprint,
  FaUserTimes
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'retard',
      message: 'Jean Dupont a enregistré un retard de 15 minutes',
      time: '10:30',
      read: false,
      employeeId: 101
    },
    {
      id: 2,
      type: 'intrus',
      message: 'Tentative d\'accès non autorisée détectée à l\'entrée principale',
      time: '09:15',
      read: false
    },
    {
      id: 3,
      type: 'anomalie',
      message: 'Marie Curie - Anomalie de reconnaissance d\'empreinte',
      time: '08:45',
      read: false,
      employeeId: 102
    },
    {
      id: 4,
      type: 'anomalie',
      message: 'Paul Martin - Échec de détection faciale',
      time: '08:30',
      read: false,
      employeeId: 103
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newId = Math.max(...notifications.map(n => n.id)) + 1;
        const newNotification = {
          id: newId,
          type: 'anomalie',
          message: `Employé ${Math.floor(Math.random() * 100)} - Anomalie de ${Math.random() > 0.5 ? 'empreinte' : 'reconnaissance faciale'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          employeeId: Math.floor(Math.random() * 1000) + 100
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [notifications]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? {...notif, read: true} : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({...notif, read: true})));
  };

  const handleApprovePresence = (employeeId) => {
    console.log(`Présence approuvée pour l'employé ${employeeId}`);
    setNotifications(notifications.filter(n => n.employeeId !== employeeId));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'retard':
        return <FaExclamationTriangle className="me-2 text-warning mt-1" />;
      case 'intrus':
        return <FaUserShield className="me-2 text-danger mt-1" />;
      case 'anomalie':
        return <FaFingerprint className="me-2 text-primary mt-1" />;
      default:
        return <FaUserTimes className="me-2 text-secondary mt-1" />;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">PrésenTech</Link>
        
        {user && (
          <div className="d-flex align-items-center gap-3">
            {/* Lien Employés */}
            <Link 
              to="/employes" 
              className="btn btn-link text-light d-flex align-items-center"
            >
              <FaUsers className="me-2" />
              <span className="d-none d-md-inline">Employés</span>
            </Link>

            {/* Notifications */}
            <div className="position-relative">
              <button 
                className="btn btn-link text-light position-relative"
                onClick={toggleNotifications}
              >
                <FaBell size={20} />
                {unreadCount > 0 && (
                  <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-panel position-absolute end-0 mt-2 bg-white rounded shadow-lg"
                  style={{ width: '400px', zIndex: 1000 }}>
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <h6 className="mb-0 fw-bold">Notifications</h6>
                    <button 
                      className="btn btn-sm btn-link text-primary p-0"
                      onClick={markAllAsRead}
                    >
                      Marquer tout comme lu
                    </button>
                  </div>
                  
                  <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-bottom ${!notification.read ? 'bg-light' : ''}`}
                        >
                          <div className="d-flex align-items-start">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-grow-1">
                              <p className="mb-1">{notification.message}</p>
                              <small className="text-muted">{notification.time}</small>
                              
                              {notification.type === 'anomalie' && notification.employeeId && (
                                <div className="mt-2 d-flex gap-2">
                                  <button 
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleApprovePresence(notification.employeeId)}
                                  >
                                    Valider présence
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    Ignorer
                                  </button>
                                </div>
                              )}
                            </div>
                            <button 
                              className="btn btn-sm btn-link text-muted"
                              onClick={() => markAsRead(notification.id)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted">
                        Aucune notification
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 text-center bg-light">
                    <Link to="/notifications" className="text-primary">Voir toutes les notifications</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Utilisateur simplifié - seulement déconnexion */}
            <div className="dropdown">
              <button 
                className="btn btn-link text-light"
                onClick={toggleDropdown}
              >
                <FaUserCircle size={24} />
              </button>

              <div className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? 'show' : ''}`}>
                <button 
                  className="dropdown-item text-danger" 
                  onClick={() => {
                    logout();
                    toggleDropdown();
                  }}
                >
                  <FaSignOutAlt className="me-2" /> Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;