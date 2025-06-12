import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { listAll, getDownloadURL, ref as storageRef } from 'firebase/storage';
import { storage } from '../firebase';

const FaceCheckPage = () => {
  const videoRef = useRef(null);
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      startCamera();
    };
    loadModels();
  }, []);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Erreur caméra:", err));
  };

  const handleScan = async () => {
    setChecking(true);
    setMessage('⏳ Analyse en cours...');

    const video = videoRef.current;

    const liveDetection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!liveDetection) {
      setMessage('❌ Aucun visage détecté.');
      setChecking(false);
      return;
    }

    try {
      const folderRef = storageRef(storage, 'faces/');
      const allFiles = await listAll(folderRef);
      const urls = await Promise.all(allFiles.items.map(item => getDownloadURL(item)));

      for (const url of urls) {
        const img = await faceapi.fetchImage(url);
        const stored = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (stored) {
          const distance = faceapi.euclideanDistance(liveDetection.descriptor, stored.descriptor);
          console.log('Comparing with:', url, '| Distance:', distance);
          if (distance < 0.6) {
            setMessage(`✅ Utilisateur reconnu`);
            setChecking(false);
            return;
          }
        }
      }

      setMessage('❌ Visage inconnu.');
    } catch (err) {
      console.error(err);
      setMessage('❌ Erreur lors de la vérification.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">📷 Scanner un Visage</h1>
      <video ref={videoRef} autoPlay muted width="480" height="360" className="rounded mx-auto border" />
      <button
        onClick={handleScan}
        disabled={checking}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {checking ? 'Analyse...' : 'Analyser le Visage'}
      </button>
      <p className="mt-4 font-semibold text-lg">{message}</p>
    </div>
  );
};

export default FaceCheckPage;
