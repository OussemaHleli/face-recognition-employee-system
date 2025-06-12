import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Card, Table, Badge, Image, Button, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaUserClock, FaTrash } from 'react-icons/fa';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthContext from '../context/AuthContext';

const EmployeeDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const db = getDatabase();

  useEffect(() => {
    const employeeRef = ref(db, `employees/${id}`);

    const unsubscribe = onValue(
      employeeRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            setEmployee({
              id: id,
              ...data,
            });
          } else {
            setError('Employé non trouvé');
          }
          setLoading(false);
        } catch (err) {
          setError('Erreur de chargement des données');
          setLoading(false);
        }
      },
      (error) => {
        setError('Erreur de connexion à la base de données');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, db]);

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await remove(ref(db, `employees/${id}`));
        toast.success('Employé supprimé avec succès');
        navigate('/employes');
      } catch (error) {
        toast.error(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Link to="/employes" className="btn btn-primary">
          <FaArrowLeft className="me-2" /> Retour à la liste
        </Link>
      </Container>
    );
  }

  if (!employee) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Employé non trouvé</Alert>
        <Link to="/employes" className="btn btn-primary">
          <FaArrowLeft className="me-2" /> Retour à la liste
        </Link>
      </Container>
    );
  }

  return (
    <div className="employee-details-page">
      <Navbar />

      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link to="/employes" className="btn btn-outline-primary">
            <FaArrowLeft className="me-2" /> Retour aux employés
          </Link>

          {user?.role === 'admin' && (
            <Button variant="danger" onClick={handleDelete}>
              <FaTrash className="me-2" /> Supprimer
            </Button>
          )}
        </div>

        <Card className="shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex flex-column flex-md-row align-items-center gap-4">
              <div className="text-center">
                <Image
                  src={
                    employee.faceUrl
                      ? employee.faceUrl
                      : (employee.photo || 'https://via.placeholder.com/150')
                  }
                  roundedCircle
                  width={150}
                  height={150}
                  className="border"
                  alt={`Photo de ${employee.firstName} ${employee.lastName}`}
                />
              </div>

              <div className="flex-grow-1">
                <h2 className="mb-3">
                  {employee.firstName} {employee.lastName}
                </h2>

                <Table bordered responsive>
                  <tbody>
                    <tr>
                      <th>Email</th>
                      <td>{employee.email || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                      <th>Téléphone</th>
                      <td>{employee.phone || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                      <th>Département</th>
                      <td>{employee.department || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                      <th>Poste</th>
                      <td>{employee.position || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                      <th>Date d'embauche</th>
                      <td>{employee.hireDate || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                      <th>ID de l'empreinte digitale</th>
                      <td>{employee.fingerprintId || 'Non défini'}</td>
                    </tr>
                    <tr>
                      <th>Statut</th>
                      <td>
                        <Badge bg={employee.anomaly ? 'danger' : 'success'}>
                          {employee.anomaly ? 'Anomalie détectée' : 'Actif'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">
              <FaUserClock className="me-2" />
              Historique et activités
            </h5>
          </Card.Header>
          <Card.Body>
            <p>
              Dernière présence :{' '}
              <strong>{employee.lastPresence || 'Non disponible'}</strong>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default EmployeeDetails;
