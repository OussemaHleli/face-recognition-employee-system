import React from 'react';
import StatsCards from './StatsCards';
import RealTimePresence from './RealTimePresence';
import PresenceTable from './PresenceTable';

const Dashboard = () => {
  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Tableau de bord de gestion des présences</h2>
      
      <div className="row mb-4">
        <StatsCards />
      </div>
      
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Entrées/Sorties en temps réel</h5>
            </div>
            <div className="card-body">
              <RealTimePresence />
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Historique des présences</h5>
            </div>
            <div className="card-body">
              <PresenceTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 