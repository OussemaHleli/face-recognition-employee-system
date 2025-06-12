import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmployeePage = () => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const db = getDatabase();

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const employeesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setEmployees(employeesArray);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleMarkPresence = (employee) => {
    if (employee.anomaly && user?.role !== 'admin') {
      toast.warning("Présence nécessite validation admin");
    } else {
      toast.success(`Présence enregistrée pour ${employee.firstName}`);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        const employeeRef = ref(db, `employees/${employeeId}`);
        await remove(employeeRef);
        toast.success('Employé supprimé avec succès');
      } catch (error) {
        toast.error(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  const filteredEmployees = employees.filter(employee => 
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-page">
      <Navbar />
      
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Gestion des Employés</h2>
          
          <div className="d-flex">
            <input
              type="text"
              placeholder="Rechercher..."
              className="form-control me-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/employes/ajouter')}
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Ajouter un employé
              </button>
            )}
          </div>
        </div>

        <div className="card shadow">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nom Complet</th>
                    <th>Département</th>
                    <th>Poste</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(employee => (
                      <tr key={employee.id}>
                        <td>
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td>{employee.department}</td>
                        <td>{employee.position}</td>
                        <td>
                          <span className={`badge ${employee.anomaly ? 'bg-warning' : 'bg-success'}`}>
                            {employee.anomaly ? 'Anomalie' : 'Actif'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              onClick={() => handleMarkPresence(employee)}
                              className={`btn btn-sm ${employee.anomaly && user?.role !== 'admin' ? 'btn-secondary' : 'btn-success'}`}
                              disabled={employee.anomaly && user?.role !== 'admin'}
                            >
                              Marquer présence
                            </button>
                            
                            <Link
                              to={`/employes/details/${employee.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Détails
                            </Link>

                            {user?.role === 'admin' && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteEmployee(employee.id)}
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        Aucun employé trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;