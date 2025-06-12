import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceVerificationPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState('');

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      startVideo();
    };

    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Camera error:", err));
  };

  const handleCapture = async () => {
    const video = videoRef.current;

    // Detect face in video
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setMessage('❌ Aucune visage détecté.');
      return;
    }

    // Load reference face descriptor (uploaded face)
    const uploadedImageUrl = localStorage.getItem('faceImageURL');
    if (!uploadedImageUrl) {
      setMessage('❌ Aucune image enregistrée.');
      return;
    }

    const img = await faceapi.fetchImage(uploadedImageUrl);
    const refDetection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!refDetection) {
      setMessage('❌ Impossible de lire l\'image de référence.');
      return;
    }

    const distance = faceapi.euclideanDistance(detection.descriptor, refDetection.descriptor);
    console.log('Similarity:', distance);

    if (distance < 0.6) {
      setMessage('✅ Visage vérifié avec succès !');
    } else {
      setMessage('❌ Visage non reconnu. Veuillez réessayer.');
    }
  };

  return (
    <div className="text-center p-10">
      <h1 className="text-2xl font-bold mb-4">🎥 Vérification du Visage</h1>

      <video ref={videoRef} autoPlay muted width="480" height="360" className="mx-auto rounded border" />

      <button
        onClick={handleCapture}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Vérifier le visage
      </button>

      {message && <p className="mt-4 text-lg font-semibold">{message}</p>}
    </div>
  );
};

export default FaceVerificationPage;
