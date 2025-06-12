import { getDatabase, ref, set, update, onValue } from "firebase/database";

const EmployeeModel = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'employee',
  department: '',
  position: '',
  // hireDate supprimé
  phone: '',
  workingDates: [
    // { date: "2025-05-26", startTime: "09:00", endTime: "17:00" }
  ],
  isActive: true,
  biometricId: null,
  timestamp: null,

  /** 🔁 Charge depuis objet brut */
  fromJson(data) {
    this.id = data.id || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.email = data.email || '';
    this.role = data.role || 'employee';
    this.department = data.department || '';
    this.position = data.position || '';
    // hireDate supprimé
    this.phone = data.phone || '';
    this.workingDates = data.workingDates || [];
    this.timestamp = data.timestamp || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.biometricId = data.biometricId !== undefined ? data.biometricId : null;
    return this;
  },

  /** 📤 Convertit l'objet en JSON pour Firebase */
  toJson() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      department: this.department,
      position: this.position,
      phone: this.phone,
      workingDates: this.workingDates,
      timestamp: this.timestamp,
      isActive: this.isActive,
      biometricId: this.biometricId
    };
  },

  /** 🔄 Met à jour biometricId dans Firebase */
  async updateBiometricId(biometricId) {
    const db = getDatabase();
    const path = `employees/${this.id}`;
    await update(ref(db, path), { biometricId });
    this.biometricId = biometricId;
  },

  /** 🔄 Mettre à jour dans Firebase toute la fiche */
  async saveToFirebase() {
    const db = getDatabase();
    await set(ref(db, `employees/${this.id}`), this.toJson());
  },

  /** 🔃 Écoute les changements depuis Firebase (optionnel) */
  listenForChanges(callback) {
    const db = getDatabase();
    const employeeRef = ref(db, `employees/${this.id}`);
    onValue(employeeRef, (snapshot) => {
      if (snapshot.exists()) {
        const updated = Object.create(EmployeeModel).fromJson(snapshot.val());
        callback(updated);
      }
    });
  }
};

export default EmployeeModel;
