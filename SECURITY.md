# 🔒 Security Guide

This document outlines security best practices and considerations for the Face Recognition Employee Management System.

## 🚨 Critical Security Requirements

### 1. Environment Variables and Secrets Management

#### Never Commit These Files:
```
❌ back/firebase/serviceAccountKey.json
❌ back/.env
❌ front/.env
❌ Any file containing API keys, passwords, or tokens
```

#### Use Environment Variables:
```bash
# Backend (.env)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app/
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Frontend (.env)
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

### 2. Firebase Security Configuration

#### Realtime Database Rules
```json
{
  "rules": {
    "employees": {
      ".read": "auth != null && auth.token.admin == true",
      ".write": "auth != null && auth.token.admin == true",
      ".validate": "newData.hasChildren(['firstName', 'lastName', 'email'])"
    },
    "image_vectors": {
      ".read": "auth != null && auth.token.admin == true",
      ".write": "auth != null && auth.token.admin == true"
    },
    "fingerprints": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.admin == true"
    },
    "attendance": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$uid": {
        ".validate": "auth.uid == $uid || auth.token.admin == true"
      }
    }
  }
}
```

#### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Face images - admin only
    match /faces/{imageId} {
      allow read, write: if request.auth != null 
        && request.auth.token.admin == true
        && resource.size < 5 * 1024 * 1024; // 5MB limit
    }
    
    // Profile images - authenticated users
    match /profiles/{userId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && resource.size < 2 * 1024 * 1024; // 2MB limit
    }
  }
}
```

### 3. API Security

#### Rate Limiting
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register_employee():
    # Implementation
```

#### Input Validation
```python
from marshmallow import Schema, fields, validate

class EmployeeRegistrationSchema(Schema):
    employee_id = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    face_image_url = fields.Url(required=True)

@app.route('/register', methods=['POST'])
def register_employee():
    schema = EmployeeRegistrationSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Invalid input', 'details': err.messages}), 400
```

#### CORS Configuration
```python
from flask_cors import CORS

# Production CORS settings
CORS(app, origins=[
    "https://your-frontend-domain.com",
    "https://your-admin-panel.com"
], supports_credentials=True)
```

## 🛡️ Authentication and Authorization

### 1. Firebase Authentication Setup

#### Frontend Authentication
```javascript
// src/services/auth.js
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const signIn = async (email, password) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get custom claims for role-based access
    const idTokenResult = await userCredential.user.getIdTokenResult();
    const isAdmin = idTokenResult.claims.admin === true;
    
    return { user: userCredential.user, isAdmin };
  } catch (error) {
    throw new Error('Authentication failed');
  }
};
```

#### Backend Token Verification
```python
from firebase_admin import auth

def verify_token(request):
    """Verify Firebase ID token"""
    try:
        id_token = request.headers.get('Authorization', '').replace('Bearer ', '')
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        return None

def require_admin(f):
    """Decorator to require admin privileges"""
    def decorated_function(*args, **kwargs):
        token = verify_token(request)
        if not token or not token.get('admin', False):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin/stats')
@require_admin
def get_admin_stats():
    # Admin-only endpoint
```

### 2. Role-Based Access Control

#### Set Custom Claims (Admin Script)
```python
# admin_setup.py
from firebase_admin import auth

def set_admin_claims(uid):
    """Set admin claims for a user"""
    auth.set_custom_user_claims(uid, {'admin': True})
    print(f'Admin claims set for user {uid}')

# Usage
set_admin_claims('user-uid-here')
```

## 🔐 Data Protection

### 1. Encryption at Rest

#### Sensitive Data Handling
```python
from cryptography.fernet import Fernet
import os

# Generate encryption key (store securely)
encryption_key = os.getenv('ENCRYPTION_KEY')
cipher_suite = Fernet(encryption_key)

def encrypt_sensitive_data(data):
    """Encrypt sensitive data before storage"""
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data):
    """Decrypt sensitive data after retrieval"""
    return cipher_suite.decrypt(encrypted_data.encode()).decode()
```

### 2. Face Vector Security

#### Secure Vector Storage
```python
def save_image_vector(employee_id, vector, filename=None):
    """Save face vector with additional security measures"""
    try:
        # Hash employee ID for additional privacy
        import hashlib
        hashed_id = hashlib.sha256(employee_id.encode()).hexdigest()[:16]
        
        vectors_ref = db.reference('image_vectors')
        vector_data = {
            'employeeId': employee_id,
            'hashedEmployeeId': hashed_id,
            'vector': vector,
            'timestamp': datetime.now().isoformat(),
            'filename': filename,
            'library': 'face_recognition',
            'vector_length': len(vector),
            'checksum': hashlib.md5(str(vector).encode()).hexdigest()
        }
        
        new_vector_ref = vectors_ref.push(vector_data)
        logger.info(f"Saved face vector for employee {employee_id} (hashed: {hashed_id})")
        return new_vector_ref.key
    except Exception as e:
        logger.error(f"Error saving image vector: {e}")
        return None
```

## 🌐 Network Security

### 1. HTTPS Configuration

#### Nginx SSL Setup
```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. API Security Headers

#### Flask Security Headers
```python
from flask import Flask
from flask_talisman import Talisman

app = Flask(__name__)

# Configure security headers
Talisman(app, {
    'force_https': True,
    'strict_transport_security': True,
    'content_security_policy': {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'connect-src': "'self' https://api.your-domain.com"
    }
})
```

## 📊 Monitoring and Logging

### 1. Security Logging

#### Comprehensive Logging
```python
import logging
from datetime import datetime

# Security event logging
security_logger = logging.getLogger('security')
security_handler = logging.FileHandler('logs/security.log')
security_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
security_logger.addHandler(security_handler)

def log_security_event(event_type, user_id, details):
    """Log security-related events"""
    security_logger.warning(f"SECURITY_EVENT: {event_type} | User: {user_id} | Details: {details}")

# Usage examples
log_security_event("FAILED_LOGIN", "user@example.com", "Invalid password")
log_security_event("ADMIN_ACCESS", "admin@example.com", "Accessed employee data")
log_security_event("FACE_RECOGNITION", "employee_123", "Face verification successful")
```

### 2. Intrusion Detection

#### Failed Attempt Monitoring
```python
from collections import defaultdict
from datetime import datetime, timedelta

failed_attempts = defaultdict(list)

def check_rate_limit(ip_address, max_attempts=5, window_minutes=15):
    """Check if IP has exceeded rate limit"""
    now = datetime.now()
    window_start = now - timedelta(minutes=window_minutes)
    
    # Clean old attempts
    failed_attempts[ip_address] = [
        attempt for attempt in failed_attempts[ip_address] 
        if attempt > window_start
    ]
    
    return len(failed_attempts[ip_address]) < max_attempts

def record_failed_attempt(ip_address):
    """Record a failed attempt"""
    failed_attempts[ip_address].append(datetime.now())
    log_security_event("RATE_LIMIT_VIOLATION", ip_address, "Too many failed attempts")
```

## 🚨 Incident Response

### 1. Security Breach Protocol

#### Immediate Actions
1. **Isolate affected systems**
2. **Revoke compromised credentials**
3. **Enable additional logging**
4. **Notify stakeholders**
5. **Document the incident**

#### Firebase Emergency Actions
```python
# Emergency script to disable compromised accounts
def emergency_disable_user(uid):
    """Disable user account in emergency"""
    auth.update_user(uid, disabled=True)
    log_security_event("EMERGENCY_DISABLE", uid, "Account disabled due to security incident")

# Revoke all sessions for a user
def revoke_user_sessions(uid):
    """Revoke all refresh tokens for a user"""
    auth.revoke_refresh_tokens(uid)
    log_security_event("SESSION_REVOKED", uid, "All sessions revoked")
```

### 2. Data Breach Response

#### Data Audit Script
```python
def audit_data_access(start_date, end_date):
    """Audit data access within date range"""
    # Check Firebase logs
    # Review API access logs
    # Generate security report
    pass

def check_data_integrity():
    """Verify data hasn't been tampered with"""
    vectors_ref = db.reference('image_vectors')
    all_vectors = vectors_ref.get()
    
    for vector_id, vector_data in all_vectors.items():
        # Verify checksums
        expected_checksum = hashlib.md5(str(vector_data['vector']).encode()).hexdigest()
        if vector_data.get('checksum') != expected_checksum:
            log_security_event("DATA_INTEGRITY_VIOLATION", vector_id, "Checksum mismatch detected")
```

## ✅ Security Checklist

### Development
- [ ] All sensitive data in environment variables
- [ ] .gitignore properly configured
- [ ] Input validation implemented
- [ ] Authentication required for all endpoints
- [ ] Role-based access control implemented
- [ ] Rate limiting configured
- [ ] Security headers enabled

### Production
- [ ] HTTPS enabled with valid certificates
- [ ] Firebase security rules configured
- [ ] Database access restricted
- [ ] Monitoring and logging enabled
- [ ] Regular security updates scheduled
- [ ] Backup and recovery procedures tested
- [ ] Incident response plan documented

### Ongoing
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Access review and cleanup
- [ ] Security training for team members
- [ ] Penetration testing (if applicable)

## 📞 Security Contact

For security issues:
1. **Do not** create public GitHub issues
2. Email security concerns to: security@your-domain.com
3. Use encrypted communication when possible
4. Include detailed information about the vulnerability

---

**Remember: Security is an ongoing process, not a one-time setup. Regularly review and update these measures.**
