const AdminModel = {
    id: '', // ID unique généré par Firebase
    firstName: '', // Prénom
    lastName: '', // Nom
    email: '', // Email (utilisé pour la connexion)
    password: '', // Mot de passe (hashé en pratique)
    role: 'admin', // Rôle fixe
    permissions: {
      manageEmployees: true, // Peut gérer les employés
      manageAttendance: true, // Peut gérer les présences
      manageSystem: true, // Accès aux paramètres système
      generateReports: true // Peut générer des rapports
    },
    createdAt: '', // Date de création (timestamp)
    lastLogin: '', // Dernière connexion (timestamp)
    isActive: true, // Compte activé/désactivé
  
    toJson() {
      return {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        role: this.role,
        permissions: this.permissions,
        createdAt: this.createdAt,
        lastLogin: this.lastLogin,
        isActive: this.isActive
      };
    },
  
    fromJson(data) {
      this.id = data.id;
      this.firstName = data.firstName;
      this.lastName = data.lastName;
      this.email = data.email;
      this.role = data.role;
      this.permissions = data.permissions || {};
      this.createdAt = data.createdAt;
      this.lastLogin = data.lastLogin;
      this.isActive = data.isActive !== undefined ? data.isActive : true;
      return this;
    }
};

export default AdminModel;