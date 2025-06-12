// Exemple de service pour les données de présence
export const getPresenceData = async () => {
    // Ici vous feriez un appel à votre API backend
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: `Employé ${i + 1}`,
          date: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          entryTime: '08:' + Math.floor(Math.random() * 30).toString().padStart(2, '0'),
          exitTime: '17:' + Math.floor(Math.random() * 30).toString().padStart(2, '0'),
          status: ['Présent', 'Absent', 'Retard'][Math.floor(Math.random() * 3)]
        }));
        resolve(mockData);
      }, 800);
    });
  };
  
  export const getRealTimePresence = async () => {
    // Pour les données en temps réel, vous utiliseriez probablement WebSockets
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = [
          { id: 1, name: 'Jean Dupont', time: new Date().toLocaleTimeString(), type: 'Entrée' },
          { id: 2, name: 'Marie Martin', time: new Date().toLocaleTimeString(), type: 'Sortie' },
        ];
        resolve(mockData);
      }, 300);
    });
  };
