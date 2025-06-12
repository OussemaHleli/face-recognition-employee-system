import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

const StatsCards = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getDatabase();

  useEffect(() => {
    const fetchStats = () => {
      // Références aux données Firebase
      const employeesRef = ref(db, 'employees');
      const presencesRef = ref(db, 'presences');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      onValue(employeesRef, (employeesSnapshot) => {
        const employeesData = employeesSnapshot.val();
        const totalEmployees = employeesData ? Object.keys(employeesData).length : 0;

        onValue(presencesRef, (presencesSnapshot) => {
          const presencesData = presencesSnapshot.val();
          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;

          if (presencesData) {
            Object.values(presencesData).forEach(presence => {
              const presenceDate = new Date(presence.timestamp);
              if (presenceDate >= todayStart && presenceDate <= todayEnd) {
                if (presence.type === 'in') presentCount++;
                if (presence.late) lateCount++;
              }
            });

            absentCount = totalEmployees - presentCount;
          }

          setStats([
            { 
              title: "Présents aujourd'hui", 
              value: presentCount, 
              icon: "bi bi-people-fill", 
              color: "success" 
            },
            { 
              title: "Absents aujourd'hui", 
              value: absentCount, 
              icon: "bi bi-person-x-fill", 
              color: "danger" 
            },
            { 
              title: "Retards ce jour", 
              value: lateCount, 
              icon: "bi bi-clock-history", 
              color: "warning" 
            },
            { 
              title: "Total employés", 
              value: totalEmployees, 
              icon: "bi bi-person-badge-fill", 
              color: "info" 
            }
          ]);
          setLoading(false);
        });
      });
    };

    fetchStats();
  }, [db]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {stats.map((stat, index) => (
        <div key={index} className="col-md-3 mb-3 mb-md-0">
          <div className={`card border-left-${stat.color} shadow h-100 py-2`}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className={`text-xs font-weight-bold text-${stat.color} text-uppercase mb-1`}>
                    {stat.title}
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stat.value}</div>
                </div>
                <div className="col-auto">
                  <i className={`${stat.icon} fa-2x text-gray-300`}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default StatsCards;