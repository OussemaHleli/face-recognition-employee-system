import React, { useState, useEffect } from 'react';
import { Button, Form, Table, Badge, InputGroup, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { BiExport } from 'react-icons/bi';
import { FiDownload } from 'react-icons/fi';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { getDatabase, ref, onValue } from 'firebase/database';

const PresenceTable = () => {
  const [presences, setPresences] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    date: '',
    firstName: '',
    lastName: '',
    type: ''
  });

  const db = getDatabase();

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const presencesRef = ref(db, 'presences');

    // Charger les employés
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const employeesMap = Object.entries(data).reduce((acc, [key, value]) => {
            acc[value.id || key] = value;
            return acc;
          }, {});
          setEmployees(employeesMap);
        }
      } catch (err) {
        setError("Erreur de chargement des employés");
        console.error(err);
      }
    }, (error) => {
      setError("Connexion aux employés échouée");
      console.error(error);
    });

    // Charger les présences
    const unsubscribePresences = onValue(presencesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const formattedData = Object.entries(data).map(([id, presence]) => {
            const employee = employees[presence.employeeId] || {};
            return {
              id,
              employeeId: presence.employeeId,
              firstName: employee.firstName || 'Inconnu',
              lastName: employee.lastName || 'Inconnu',
              department: employee.department || 'Non spécifié',
              date: new Date(presence.timestamp).toLocaleDateString('fr-FR'),
              entryTime: presence.type === 'in' ? 
                new Date(presence.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '-',
              exitTime: presence.type === 'out' ? 
                new Date(presence.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '-',
              status: presence.late ? 'Retard' : (presence.type === 'in' ? 'Présent' : 'Sortie')
            };
          });
          setPresences(formattedData);
        }
        setLoading(false);
      } catch (err) {
        setError("Erreur de traitement des présences");
        console.error(err);
        setLoading(false);
      }
    }, (error) => {
      setError("Connexion aux présences échouée");
      console.error(error);
      setLoading(false);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribePresences();
    };
  }, [db]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredPresences = presences.filter(presence => {
    const filterDate = filter.date ? new Date(filter.date).toLocaleDateString('fr-FR') : '';
    return (
      (filter.date === '' || presence.date === filterDate) &&
      (filter.firstName === '' || presence.firstName.toLowerCase().includes(filter.firstName.toLowerCase())) &&
      (filter.lastName === '' || presence.lastName.toLowerCase().includes(filter.lastName.toLowerCase())) &&
      (filter.type === '' || presence.status.includes(filter.type))
    );
  });

  const handleExport = (format) => {
    const exportData = filteredPresences.map(presence => ({
      ID: presence.id,
      'Prénom': presence.firstName,
      'Nom': presence.lastName,
      'Département': presence.department,
      'Date': presence.date,
      'Heure entrée': presence.entryTime,
      'Heure sortie': presence.exitTime,
      'Statut': presence.status
    }));

    if (format === 'excel') {
      exportToExcel(exportData, 'historique_presences');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'historique_presences');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Présent': return 'success';
      case 'Sortie': return 'primary';
      case 'Retard': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p>Chargement des données de présence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        <Alert.Heading>Erreur</Alert.Heading>
        <p>{error}</p>
        <p>Veuillez vérifier la console pour plus de détails.</p>
      </Alert>
    );
  }

  return (
    <div className="presence-table-container">
      {/* Filtres et export */}
      <div className="filter-export-bar mb-4 p-3 bg-light rounded">
        <Row className="align-items-center">
          <Col md={2}>
            <Form.Group>
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={filter.date}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
          
          <Col md={2}>
            <Form.Group>
              <Form.Label>Prénom</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                placeholder="Filtrer par prénom"
                value={filter.firstName}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
          
          <Col md={2}>
            <Form.Group>
              <Form.Label>Nom</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                placeholder="Filtrer par nom"
                value={filter.lastName}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
          
          <Col md={2}>
            <Form.Group>
              <Form.Label>Statut</Form.Label>
              <Form.Select
                name="type"
                value={filter.type}
                onChange={handleFilterChange}
              >
                <option value="">Tous</option>
                <option value="Présent">Présent</option>
                <option value="Sortie">Sortie</option>
                <option value="Retard">Retard</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={4} className="d-flex align-items-end">
            <InputGroup>
              <Button 
                variant="success" 
                onClick={() => handleExport('excel')}
                className="me-2"
              >
                <BiExport className="me-1" /> Excel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleExport('pdf')}
              >
                <FiDownload className="me-1" /> PDF
              </Button>
            </InputGroup>
          </Col>
        </Row>
      </div>

      {/* Tableau des présences */}
      <div className="table-responsive">
        <Table striped bordered hover className="shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Département</th>
              <th>Date</th>
              <th>Entrée</th>
              <th>Sortie</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredPresences.length > 0 ? (
              filteredPresences.map((presence) => (
                <tr key={presence.id}>
                  <td>{presence.id}</td>
                  <td>{presence.firstName}</td>
                  <td>{presence.lastName}</td>
                  <td>{presence.department}</td>
                  <td>{presence.date}</td>
                  <td>{presence.entryTime}</td>
                  <td>{presence.exitTime}</td>
                  <td>
                    <Badge bg={getStatusBadgeColor(presence.status)}>
                      {presence.status}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  {presences.length === 0 ? 
                    "Aucune donnée de présence disponible" : 
                    "Aucun résultat avec les filtres actuels"}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default PresenceTable;