import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../services/api';

const FaceUploadPage = () => {
  const [image, setImage] = useState(null);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('firebase'); // 'firebase' ou 'api'
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleFirebaseUpload = async () => {
    if (!image) return alert('Veuillez sélectionner une image');
    setUploading(true);

    const uniqueName = `faces/${uuidv4()}.jpg`;
    const imageRef = ref(storage, uniqueName);

    try {
      await uploadBytes(imageRef, image);
      const downloadUrl = await getDownloadURL(imageRef);
      setUrl(downloadUrl);
      localStorage.setItem('faceImageURL', downloadUrl);
      alert('✅ Image envoyée avec succès (Firebase) !');
      navigate('/addemployee');
    } catch (error) {
      console.error('Erreur Firebase :', error);
      alert('❌ Échec de l\'upload Firebase');
    } finally {
      setUploading(false);
    }
  };

  const handleApiUpload = async (e) => {
    e.preventDefault();
    if (!image) return alert('Veuillez sélectionner une image');
    setUploading(true);

    try {
      const response = await uploadImage(image);
      console.log('Réponse API:', response.data);
      setUrl(response.data.url || response.data.filename);
      alert('✅ Image envoyée avec succès (API) !');
      navigate('/addemployee');
    } catch (error) {
      console.error('Erreur API :', error);
      alert('❌ Échec de l\'upload API');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = uploadMethod === 'firebase' 
    ? handleFirebaseUpload 
    : handleApiUpload;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">📸 Téléversement du visage</h2>

        <div className="mb-4 flex justify-center space-x-4">
          <button
            onClick={() => setUploadMethod('firebase')}
            className={`px-4 py-2 rounded-lg ${
              uploadMethod === 'firebase' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Firebase
          </button>
          <button
            onClick={() => setUploadMethod('api')}
            className={`px-4 py-2 rounded-lg ${
              uploadMethod === 'api' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            API Flask
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
        />

        <button
          onClick={handleSubmit}
          disabled={!image || uploading}
          className={`w-full py-2 px-4 font-semibold rounded-lg transition ${
            uploading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading 
            ? 'Téléversement...' 
            : `Téléverser via ${uploadMethod === 'firebase' ? 'Firebase' : 'API'}`}
        </button>

        {url && (
          <div className="mt-6">
            <p className="text-sm text-green-600 mb-2">✅ {uploadMethod === 'firebase' ? 'Lien Firebase' : 'Réponse API'} :</p>
            {uploadMethod === 'firebase' ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline break-all"
              >
                {url}
              </a>
            ) : (
              <p className="text-blue-500 break-all">{JSON.stringify(url)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceUploadPage;