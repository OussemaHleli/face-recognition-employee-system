// Service pour gérer la table des empreintes digitales dans Firebase Realtime Database

import { getDatabase, ref, push, set, get, remove, update } from "firebase/database";

const db = getDatabase();

export const addFingerprint = async (employeeId, fingerprintData) => {
  // fingerprintData peut contenir { template, date, etc. }
  const fingerprintsRef = ref(db, 'fingerprints');
  const newRef = push(fingerprintsRef);
  await set(newRef, {
    id: newRef.key,
    employeeId,
    ...fingerprintData,
    createdAt: new Date().toISOString()
  });
  return newRef.key;
};

export const getFingerprintsByEmployee = async (employeeId) => {
  const fingerprintsRef = ref(db, 'fingerprints');
  const snapshot = await get(fingerprintsRef);
  if (!snapshot.exists()) return [];
  const all = snapshot.val();
  return Object.values(all).filter(fp => fp.employeeId === employeeId);
};

export const removeFingerprint = async (fingerprintId) => {
  await remove(ref(db, `fingerprints/${fingerprintId}`));
};

export const updateFingerprint = async (fingerprintId, data) => {
  await update(ref(db, `fingerprints/${fingerprintId}`), data);
};
