// authService.js
export const login = async (email, password) => {
  // Simulation d'un appel API
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Validation basique de l'email
      if (!email.includes('@') || !email.includes('.')) {
        reject(new Error('Veuillez entrer une adresse email valide'));
        return;
      }

      // Vérification des identifiants
      if (email === 'admin@example.com' && password === 'admin123') {
        resolve({ 
          email, 
          role: 'admin',
          token: 'simulated-token-12345' // Ajout d'un token simulé
        });
      } else {
        reject(new Error('Identifiants incorrects'));
      }
    }, 500); // Simule un délai réseau
  });
};

export const logout = async () => {
  // Nettoyage côté serveur si nécessaire
  return Promise.resolve();
};

// Optionnel : Fonction pour vérifier si l'utilisateur est authentifié
export const isAuthenticated = () => {
  // Vérification simulée
  return localStorage.getItem('authToken') !== null;
};