import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

const RealTimePresence = () => {
  const [presences, setPresences] = useState([]);
  const db = getDatabase();

  useEffect(() => {
    const presencesRef = ref(db, 'presences');
    
    const unsubscribe = onValue(presencesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const presenceList = Object.entries(data).map(([key, value]) => ({
          id: key,
          employeeId: value.employeeId,
          firstName: value.firstName || 'Inconnu',
          lastName: value.lastName || 'Inconnu',
          time: new Date(value.timestamp).toLocaleTimeString('fr-FR'),
          type: value.type === 'in' ? 'Entrée' : 'Sortie'
        }));
        
        setPresences(presenceList.reverse()); // Les plus récents en premier
      }
    });

    return () => unsubscribe();
  }, [db]);

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID Employé</th>
            <th>Prénom</th>
            <th>Nom</th>
            <th>Heure</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {presences.map(presence => (
            <tr key={presence.id}>
              <td>{presence.employeeId}</td>
              <td>{presence.firstName}</td>
              <td>{presence.lastName}</td>
              <td>{presence.time}</td>
              <td>
                <span className={`badge bg-${presence.type === 'Entrée' ? 'success' : 'danger'}`}>
                  {presence.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RealTimePresence;