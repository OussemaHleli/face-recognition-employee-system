import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a face image to Firebase Storage
 * @param {File} imageFile - The image file to upload
 * @param {string} employeeId - Employee ID for naming
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export const uploadFaceImage = async (imageFile, employeeId) => {
  try {
    // Validate file
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Only JPEG, JPG and PNG files are allowed');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('File size must not exceed 5MB');
    }

    // Create unique filename
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const uniqueFilename = `${employeeId}_${uuidv4()}.${fileExtension}`;
    const storagePath = `faces/${uniqueFilename}`;

    // Create storage reference
    const imageRef = ref(storage, storagePath);

    // Upload file
    console.log(`Uploading image to Firebase Storage: ${storagePath}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`Image uploaded successfully: ${downloadURL}`);
    return downloadURL;

  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error;
  }
};

/**
 * Validate image file before upload
 * @param {File} file - The file to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateImageFile = (file) => {
  if (!file) {
    return 'No file selected';
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, JPG and PNG files are allowed';
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'File size must not exceed 5MB';
  }

  return null; // Valid file
};
