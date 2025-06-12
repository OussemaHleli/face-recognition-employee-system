import { getDatabase, ref, set, get, update, remove, push, child } from 'firebase/database';
import { useState, useEffect } from 'react';

// Service générique pour Firebase Realtime Database
const DatabaseService = (tableName, converter) => {
  const db = getDatabase();

  const generateId = () => push(child(ref(db), tableName)).key;

  const create = async (data) => {
    try {
      const id = data.id || generateId();
      await set(ref(db, `${tableName}/${id}`), { ...data, id });
      return id;
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error);
      throw error;
    }
  };

  const getById = async (id) => {
    try {
      const snapshot = await get(ref(db, `${tableName}/${id}`));
      return snapshot.exists() ? converter(snapshot.val()) : null;
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      throw error;
    }
  };

  const updateItem = async (id, data) => {
    try {
      await update(ref(db, `${tableName}/${id}`), data);
      return true;
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      throw error;
    }
  };

  const removeItem = async (id) => {
    try {
      await remove(ref(db, `${tableName}/${id}`));
      return true;
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      throw error;
    }
  };

  const getAll = async () => {
    try {
      const snapshot = await get(ref(db, tableName));
      if (!snapshot.exists()) return [];
      
      const result = [];
      snapshot.forEach((child) => {
        result.push(converter(child.val()));
      });
      return result;
    } catch (error) {
      console.error(`Error listing ${tableName}:`, error);
      throw error;
    }
  };

  return { create, getById, update: updateItem, remove: removeItem, getAll };
};

// Services spécifiques
const EmployeeService = () => {
  const converter = (data) => ({
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role || 'employee',
    position: data.position,
    hireDate: data.hireDate,
    department: data.department,
    toJson: () => ({ ...data })
  });

  return DatabaseService('employees', converter);
};

const AdminService = () => {
  const converter = (data) => ({
    id: data.id,
    name: data.name,
    email: data.email,
    role: 'admin',
    privileges: data.privileges || [],
    toJson: () => ({ ...data })
  });

  return DatabaseService('admins', converter);
};

const AttendanceService = () => {
  const converter = (data) => ({
    id: data.id,
    employeeId: data.employeeId,
    date: data.date,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    status: data.status || 'pending',
    notes: data.notes,
    toJson: () => ({ ...data })
  });

  const service = DatabaseService('attendance', converter);

  const recordCheckIn = async (employeeId) => {
    const today = new Date().toISOString().split('T')[0];
    const checkInTime = new Date().toISOString();
    
    return service.create({
      employeeId,
      date: today,
      checkIn: checkInTime,
      status: 'present'
    });
  };

  const recordCheckOut = async (attendanceId) => {
    const checkOutTime = new Date().toISOString();
    return service.update(attendanceId, { checkOut: checkOutTime });
  };

  const getEmployeeAttendance = async (employeeId) => {
    const allAttendance = await service.getAll();
    return allAttendance.filter(a => a.employeeId === employeeId);
  };

  return {
    ...service,
    recordCheckIn,
    recordCheckOut,
    getEmployeeAttendance
  };
};

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const employeeService = EmployeeService();
  const attendanceService = AttendanceService();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [empData, attData] = await Promise.all([
          employeeService.getAll(),
          attendanceService.getAll()
        ]);
        setEmployees(empData);
        setAttendance(attData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCheckIn = async (employeeId) => {
    try {
      await attendanceService.recordCheckIn(employeeId);
      // Rafraîchir les données après le check-in
      const attData = await attendanceService.getAll();
      setAttendance(attData);
      alert('Check-in enregistré avec succès');
    } catch (error) {
      alert(`Erreur lors du check-in: ${error.message}`);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);

  return (
    <div className="admin-dashboard">
      <h1>Tableau de bord Admin</h1>
      
      <section className="employee-section">
        <h2>Employés ({employees.length})</h2>
        <ul className="employee-list">
          {employees.map(emp => (
            <li key={emp.id} className="employee-item">
              <span>{emp.name} - {emp.position}</span>
              <button 
                onClick={() => handleCheckIn(emp.id)}
                disabled={todayAttendance.some(a => a.employeeId === emp.id && a.checkIn)}
              >
                {todayAttendance.some(a => a.employeeId === emp.id && a.checkIn) 
                  ? 'Déjà check-in' 
                  : 'Check-in'}
              </button>
            </li>
          ))}
        </ul>
      </section>
      
      <section className="attendance-section">
        <h2>Présences aujourd'hui ({todayAttendance.length})</h2>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {todayAttendance.map(record => {
              const employee = employees.find(e => e.id === record.employeeId);
              return (
                <tr key={record.id}>
                  <td>{employee?.name || 'Inconnu'}</td>
                  <td>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td>
                  <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                  <td>{record.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;