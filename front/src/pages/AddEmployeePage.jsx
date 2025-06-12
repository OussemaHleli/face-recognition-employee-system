import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, get } from 'firebase/database';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { database } from '../firebase'; // assurez-vous que c’est bien votre instance
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaFingerprint, FaUserTie, FaCamera, FaUpload, FaTrash } from 'react-icons/fa';
import { registerEmployee } from '../services/api';
import { uploadFaceImage, validateImageFile } from '../services/firebaseStorage';

const AddEmployeePage = () => {
  const db = getDatabase();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    fingerprintId: '',
    faceUrl: '',
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [canSave, setCanSave] = useState(false);
  const [fingerprints, setFingerprints] = useState([]);
  const [faceImage, setFaceImage] = useState(null);
  const [faceImagePreview, setFaceImagePreview] = useState(null);

  const departments = ['IT', 'RH', 'Comptabilité', 'Ventes', 'Marketing'];
  const positions = ['Développeur', 'Manager', 'Comptable', 'Commercial'];

  useEffect(() => {
    const fetchFingerprints = async () => {
      try {
        const snapshot = await get(ref(db, 'fingerprints'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setFingerprints(list);
        } else {
          setFingerprints([]);
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des empreintes");
      }
    };

    fetchFingerprints();

    // Restaure l'état du formulaire si présent dans localStorage
    const savedEmployee = localStorage.getItem('addEmployeeForm');
    if (savedEmployee) {
      try {
        setEmployee(prev => ({ ...prev, ...JSON.parse(savedEmployee) }));
        localStorage.removeItem('addEmployeeForm');
      } catch {}
    }
    // Récupération de la photo de visage si elle existe
    const storedFaceUrl = localStorage.getItem('faceImageURL');
    if (storedFaceUrl) {
      setEmployee(prev => ({ ...prev, faceUrl: storedFaceUrl }));
      localStorage.removeItem('faceImageURL');
    }
  }, [db]);

  const validateForm = () => {
    const newErrors = {};
    if (!employee.firstName.trim()) newErrors.firstName = 'Champ requis';
    if (!employee.lastName.trim()) newErrors.lastName = 'Champ requis';
    if (!employee.email.trim()) {
      newErrors.email = 'Champ requis';
    } else if (!/^\S+@\S+\.\S+$/.test(employee.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!employee.department) newErrors.department = 'Sélectionnez un département';
    if (!employee.fingerprintId) newErrors.fingerprintId = 'Sélectionnez une empreinte';
    if (!faceImage) newErrors.faceImage = 'Photo du visage requise pour la génération des vecteurs';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee(prev => ({ ...prev, [name]: value }));
  };

  const validateImageFileLocal = (file) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      // Translate error messages to French
      const translations = {
        'No file selected': 'Aucun fichier sélectionné',
        'Only JPEG, JPG and PNG files are allowed': 'Seuls les fichiers JPEG, JPG et PNG sont autorisés',
        'File size must not exceed 5MB': 'La taille du fichier ne doit pas dépasser 5MB'
      };
      return translations[validationError] || validationError;
    }
    return null;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFaceImage(null);
      setFaceImagePreview(null);
      return;
    }

    const validationError = validateImageFileLocal(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = '';
      return;
    }

    setFaceImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFaceImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFaceUpload = () => {
    const fileInput = document.getElementById('faceImageInput');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleRemoveImage = () => {
    setFaceImage(null);
    setFaceImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('faceImageInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleEnrollAndSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Step 1: Generate a unique employee ID
      const employeesRef = ref(db, 'employees');
      const newEmployeeRef = push(employeesRef);
      const employeeId = newEmployeeRef.key;

      // Step 2: Upload face image to Firebase Storage
      toast.info('Téléchargement de l\'image...');
      const faceImageUrl = await uploadFaceImage(faceImage, employeeId);

      // Step 3: Save employee data to Firebase Realtime Database
      toast.info('Sauvegarde des données employé...');
      const employeeData = {
        id: employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        fingerprintId: employee.fingerprintId,
        faceUrl: faceImageUrl,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(newEmployeeRef, employeeData);

      // Step 4: Call Flask API to generate face recognition vectors
      toast.info('Génération des vecteurs de reconnaissance faciale...');
      const response = await registerEmployee(employeeId, faceImageUrl);

      if (response.status === 201) {
        const apiResult = response.data;
        toast.success(`Employé ajouté avec succès ! Vecteurs faciaux générés (ID: ${apiResult.vector_id})`);
        navigate('/employes');
      } else {
        throw new Error('Erreur lors de la génération des vecteurs faciaux');
      }
    } catch (error) {
      console.error('Error registering employee:', error);
      if (error.response?.data?.error) {
        toast.error(`Erreur API: ${error.response.data.error}`);
      } else {
        toast.error(`Erreur: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegisterButton = async () => {
    const newState = !canSave;
    setCanSave(newState);
    try {
      await set(ref(db, 'registerButtonState'), { enabled: newState });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'état du bouton dans la base");
    }
  };

  const isFormValid = () => {
    return (
      employee.firstName.trim() &&
      employee.lastName.trim() &&
      employee.email.trim() &&
      /^\S+@\S+\.\S+$/.test(employee.email) &&
      employee.department &&
      employee.fingerprintId &&
      faceImage
    );
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-white to-blue-300 flex items-center justify-center py-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl border border-blue-200 p-0 overflow-hidden">
          <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-sm flex items-center gap-2">
              <FaUserTie className="text-blue-700" /> Ajouter un Employé
            </h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleRegisterButton}
                className={`px-5 py-2.5 text-base font-bold rounded-lg shadow transition border-2
                  ${canSave
                    ? 'bg-green-200 text-green-900 border-green-200 hover:bg-green-300 hover:border-green-300 focus:ring-4 focus:ring-green-100'
                    : 'bg-blue-100 text-blue-900 border-blue-100 hover:bg-blue-200 hover:border-blue-200 focus:ring-4 focus:ring-blue-100'}`}
              >
                {canSave ? "Désactiver l'enregistrement" : "Activer l'enregistrement"}
              </button>
              <button
                onClick={() => navigate('/employees')}
                className="rounded-full p-2 bg-blue-100 hover:bg-blue-200 border border-blue-200 transition"
                title="Retour"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleEnrollAndSave} className="space-y-10 px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaUser className="text-blue-400" /> Prénom *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={employee.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.firstName ? 'border-red-500' : 'border-blue-200'}`}
                  placeholder="Entrez le prénom"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaUser className="text-blue-400" /> Nom *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={employee.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.lastName ? 'border-red-500' : 'border-blue-200'}`}
                  placeholder="Entrez le nom"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaEnvelope className="text-blue-400" /> Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={employee.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.email ? 'border-red-500' : 'border-blue-200'}`}
                  placeholder="exemple@email.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaPhone className="text-blue-400" /> Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={employee.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  placeholder="Numéro de téléphone"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaBuilding className="text-blue-400" /> Département *
                </label>
                <select
                  name="department"
                  value={employee.department}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.department ? 'border-red-500' : 'border-blue-200'}`}
                >
                  <option value="">Sélectionnez...</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
              </div>
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaUserTie className="text-blue-400" /> Poste
                </label>
                <select
                  name="position"
                  value={employee.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  <option value="">Sélectionnez...</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaFingerprint className="text-blue-400" /> Empreinte digitale *
                </label>
                <select
                  name="fingerprintId"
                  value={employee.fingerprintId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.fingerprintId ? 'border-red-500' : 'border-blue-200'}`}
                  required
                >
                  <option value="">Sélectionnez une empreinte...</option>
                  {fingerprints.map(fp => (
                    <option key={fp.id} value={fp.id}>
                      {fp.id} {fp.employeeId ? `(Employé: ${fp.employeeId})` : ''}
                    </option>
                  ))}
                </select>
                {errors.fingerprintId && <p className="text-red-500 text-xs mt-1">{errors.fingerprintId}</p>}
              </div>
              <div>
                <label className="block text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FaCamera className="text-blue-400" /> Photo du visage *
                </label>
                <input
                  type="file"
                  id="faceImageInput"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleFaceUpload}
                    className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
                  >
                    <FaCamera /> Importer une photo
                  </button>
                  {faceImagePreview && (
                    <div className="flex items-center gap-2">
                      <img
                        src={faceImagePreview}
                        alt="Aperçu du visage"
                        className="w-16 h-16 object-cover rounded-full border border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="bg-red-100 border border-red-300 text-red-800 px-2 py-1 rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                        title="Supprimer l'image"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  )}
                  {employee.faceUrl && !faceImagePreview && (
                    <img
                      src={employee.faceUrl}
                      alt="Visage"
                      className="w-16 h-16 object-cover rounded-full border border-blue-200"
                    />
                  )}
                </div>
                {errors.faceImage && <p className="text-red-500 text-xs mt-1">{errors.faceImage}</p>}
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-8 border-t border-blue-100 mt-8">
              <button
                type="submit"
                className={`px-7 py-3 text-lg font-bold rounded-lg shadow flex items-center transition
                  ${loading || !(canSave && isFormValid())
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300'}`}
                disabled={loading || !(canSave && isFormValid())}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement...
                  </>
                ) : (
                  <>
                    <FaUserTie className="mr-2" /> Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeePage;
