import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { BiEnvelope, BiLock, BiLogIn } from 'react-icons/bi';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set, get, child } from "firebase/database";
import { app } from '../firebase';
import AdminModel from '../modelsbase/adminmodel';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const auth = getAuth(app);
    const db = getDatabase(app);

    try {
      // Validation basique de l'email
      if (!email.includes('@') || !email.includes('.')) {
        throw new Error('Veuillez entrer une adresse email valide');
      }

      // Authentification avec Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = userCredential.user;

      // Vérifier si le nœud admin existe déjà
      const adminRef = ref(db, `admins/${userData.uid}`);
      const snapshot = await get(adminRef);
      const now = new Date().toISOString();

      if (!snapshot.exists()) {
        // Créer un objet simple sans méthodes/fonctions
        const adminData = {
          id: userData.uid,
          firstName: '', // à remplir si besoin
          lastName: '',  // à remplir si besoin
          email: userData.email,
          role: 'admin',
          permissions: {
            manageEmployees: true,
            manageAttendance: true,
            manageSystem: true,
            generateReports: true
          },
          createdAt: now,
          lastLogin: now,
          isActive: true
        };
        await set(adminRef, adminData);
      } else {
        // Mettre à jour la date de dernière connexion
        await set(adminRef, {
          ...snapshot.val(),
          lastLogin: now
        });
      }

      // Connexion dans le contexte
      login({
        email: userData.email,
        role: 'admin',
        token: await userData.getIdToken(),
        uid: userData.uid
      });
    } catch (err) {
      // Gestion des erreurs Firebase
      let msg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Identifiants incorrects';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h2>Connexion Admin</h2>
            <p>Bienvenue, veuillez vous connecter pour continuer</p>
          </div>
          
          {error && (
            <div className="alert alert-danger">
              <span className="alert-icon">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">
                <BiEnvelope className="input-icon" />
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre adresse email"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <BiLock className="input-icon" />
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <BiLogIn className="btn-icon" />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;