import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
});

export const uploadImage = (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  return API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Generate face recognition vectors for an employee (employee data should already be in Firebase)
 * @param {string} employeeId - Employee ID
 * @param {string} faceImageUrl - Firebase Storage URL of the face image
 * @returns {Promise} API response
 */
export const registerEmployee = async (employeeId, faceImageUrl) => {
  const requestData = {
    employee_id: employeeId,
    face_image_url: faceImageUrl
  };

  return API.post('/register', requestData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Verify an employee using face recognition
 * @param {File} imageFile - Face image file for verification
 * @returns {Promise} API response
 */
export const verifyEmployee = (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  return API.post('/verify', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Get all registered employees
 * @returns {Promise} API response
 */
export const getEmployees = () => {
  return API.get('/employees');
};

/**
 * Health check for the backend API
 * @returns {Promise} API response
 */
export const healthCheck = () => {
  return API.get('/health');
};