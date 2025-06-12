const AttendanceModel = {
    id: '', // ID de la présence
    employeeId: '', // Référence à l'employé
    date: '', // Date de la présence (YYYY-MM-DD)
    checkIn: '', // Heure d'arrivée (timestamp)
    checkOut: '', // Heure de départ (timestamp)
    status: 'pending', // pending/present/absent/late/leftEarly
    totalHours: 0, // Heures travaillées
    notes: '', // Notes supplémentaires
    location: { // Géolocalisation
      latitude: null,
      longitude: null
    },
    approved: false, // Approuvé par l'admin
  
    toJson() {
      return {
        id: this.id,
        employeeId: this.employeeId,
        date: this.date,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        status: this.status,
        totalHours: this.totalHours,
        notes: this.notes,
        location: this.location,
        approved: this.approved
      };
    },
  
    fromJson(data) {
      this.id = data.id;
      this.employeeId = data.employeeId;
      this.date = data.date;
      this.checkIn = data.checkIn;
      this.checkOut = data.checkOut;
      this.status = data.status || 'pending';
      this.totalHours = data.totalHours || 0;
      this.notes = data.notes || '';
      this.location = data.location || {};
      this.approved = data.approved || false;
      return this;
    },
  
    calculateHours() {
      if (this.checkIn && this.checkOut) {
        const start = new Date(this.checkIn);
        const end = new Date(this.checkOut);
        this.totalHours = (end - start) / (1000 * 60 * 60); // Convertir en heures
      }
      return this.totalHours;
    }
  };