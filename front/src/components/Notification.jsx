import React, { useState, useEffect } from 'react';
import { Badge, ListGroup, Tab, Tabs } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('retards');
  const [lateEmployees, setLateEmployees] = useState([]);
  const [unauthorizedAccess, setUnauthorizedAccess] = useState([]);

  useEffect(() => {
    // Seulement les retards
    const qRetards = query(
      collection(db, 'notifications'),
      where('type', '==', 'retard')
    );
    const unsubRetards = onSnapshot(qRetards, (snapshot) => {
      setLateEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Seulement les accès non autorisés
    const qIntrus = query(
      collection(db, 'notifications'),
      where('type', '==', 'unauthorized_access')
    );
    const unsubIntrus = onSnapshot(qIntrus, (snapshot) => {
      setUnauthorizedAccess(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubRetards();
      unsubIntrus();
    };
  }, []);

  return (
    <div className="notification-dropdown shadow-lg p-3 bg-white rounded">
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="retards" title={`Retards (${lateEmployees.length})`}>
          <ListGroup variant="flush">
            {lateEmployees.map(notif => (
              <ListGroup.Item key={notif.id} className="d-flex justify-content-between align-items-start">
                <div>
                  <h6>{notif.name}</h6>
                  <small>{new Date(notif.timestamp?.toDate()).toLocaleString()}</small>
                </div>
                <Badge bg="warning" text="dark">
                  {notif.delay} min
                </Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Tab>

        <Tab eventKey="intrus" title={`Accès non autorisés (${unauthorizedAccess.length})`}>
          <ListGroup variant="flush">
            {unauthorizedAccess.map(notif => (
              <ListGroup.Item key={notif.id} className="text-danger">
                <div className="d-flex justify-content-between">
                  <span>{notif.message}</span>
                  <small>{new Date(notif.timestamp?.toDate()).toLocaleString()}</small>
                </div>
                {notif.ip && <small className="text-muted">IP: {notif.ip}</small>}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Notifications;