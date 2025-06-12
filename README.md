# 🔐 Face Recognition Employee Management System

A modern, full-stack employee management system with face recognition capabilities, built with **React** (frontend) and **Flask** (backend), integrated with **Firebase** for data storage and authentication.

## 🌟 Features

### Core Functionality

- **Employee Registration**: Complete employee data management with face image capture
- **Face Recognition**: Real-time face verification using advanced ML algorithms
- **Firebase Integration**: Secure data storage and real-time synchronization
- **Fingerprint Support**: Integration with fingerprint scanning devices
- **Admin Dashboard**: Comprehensive management interface
- **Attendance Tracking**: Automated attendance logging via face recognition

### Technical Highlights

- **Modular Architecture**: Clean separation between frontend data management and backend face processing
- **Real-time Updates**: Firebase Realtime Database integration
- **Secure Storage**: Firebase Storage for face images with proper access controls
- **RESTful API**: Well-documented Flask API endpoints
- **Responsive Design**: Mobile-friendly React interface with Tailwind CSS
- **Environment-based Configuration**: Secure credential management

## 🏗️ Architecture

### Frontend (React)

- **Data Management**: Handles all employee data persistence to Firebase
- **Image Upload**: Direct Firebase Storage integration
- **User Interface**: Modern, responsive design with real-time feedback
- **State Management**: React hooks and context for efficient state handling

### Backend (Flask)

- **Face Recognition**: Specialized service for generating face vectors
- **ML Processing**: Uses `face_recognition` library for accurate face encoding
- **API Endpoints**: RESTful services for face verification and vector management
- **Firebase Admin**: Server-side Firebase operations for secure data access

### Database Structure (Firebase)

```
├── employees/          # Employee personal data
├── image_vectors/      # Face recognition vectors
├── fingerprints/       # Fingerprint device data
├── admins/            # Admin user accounts
└── attendance/        # Attendance records
```

## 📋 Prerequisites

### System Requirements

- **Node.js** 16.0 or higher
- **Python** 3.8 or higher
- **Git** for version control
- **Firebase Project** with Realtime Database and Storage enabled

### Development Tools

- **Code Editor**: VS Code, WebStorm, or similar
- **Package Managers**: npm/yarn for frontend, pip for backend
- **Terminal/Command Line** access

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/face-recognition-employee-system.git
cd face-recognition-employee-system
```

### 2. Backend Setup (Flask)

#### Install Python Dependencies

```bash
cd back
# Use the existing virtual environment
# On Windows:
venv310\Scripts\activate
# On macOS/Linux:
source venv310/bin/activate

# Requirements are already installed in venv310
# If you need to reinstall: pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Set Firebase credentials and database URLs
```

#### Setup Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Service Accounts
3. Generate new private key and download JSON file
4. Save as `back/firebase/serviceAccountKey.json`

### 3. Frontend Setup (React)

#### Install Node Dependencies

```bash
cd front
npm install
```

#### Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase configuration
# Get these values from Firebase Console → Project Settings → General
```

## ⚙️ Configuration

### Backend Configuration (`back/.env`)

```env
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000
FLASK_HOST=0.0.0.0

FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.region.firebasedatabase.app/
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

FACE_RECOGNITION_THRESHOLD=0.6
STORAGE_FOLDER=storage
LOG_LEVEL=INFO
```

### Frontend Configuration (`front/.env`)

```env
REACT_APP_API_BASE_URL=http://localhost:5000

REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.region.firebasedatabase.app
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🏃‍♂️ Running the Application

### Start Backend Server

```bash
cd back
# Activate the existing virtual environment first
# On Windows:
venv310\Scripts\activate
# On macOS/Linux:
source venv310/bin/activate

python app.py
```

Backend will be available at `http://localhost:5000`

### Start Frontend Development Server

```bash
cd front
npm start
```

Frontend will be available at `http://localhost:3000`

## 📚 API Documentation

### Core Endpoints

#### Employee Registration

```http
POST /register
Content-Type: application/json

{
  "employee_id": "string",
  "face_image_url": "string"
}
```

#### Face Verification

```http
POST /verify
Content-Type: multipart/form-data

Body: image file
```

#### Get Employees

```http
GET /employees
```

#### Health Check

```http
GET /health
```

### Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🔧 Development Workflow

### Employee Registration Process

1. **Frontend**: Collect employee data and face image
2. **Frontend**: Upload image to Firebase Storage
3. **Frontend**: Save employee data to Firebase Realtime Database
4. **Frontend**: Call backend `/register` with employee_id and face_image_url
5. **Backend**: Download image, generate face vectors, save to `image_vectors` collection

### Face Verification Process

1. **Frontend**: Capture verification image
2. **Frontend**: Send image to backend `/verify` endpoint
3. **Backend**: Process image, compare with stored vectors
4. **Backend**: Return verification result with confidence score

## 🧪 Testing

### Backend Tests

```bash
cd back
python -m pytest test_api_endpoints.py -v
```

### Frontend Tests

```bash
cd front
npm test
```

## 🚀 Deployment

### Production Environment Variables

- Set `FLASK_ENV=production`
- Set `FLASK_DEBUG=False`
- Use production Firebase project
- Configure proper CORS settings
- Set up SSL certificates

### Build Frontend for Production

```bash
cd front
npm run build
```

## 🔒 Security Considerations

### Environment Variables

- Never commit `.env` files or `serviceAccountKey.json`
- Use different Firebase projects for development/production
- Rotate Firebase service account keys regularly

### Firebase Security Rules

```javascript
// Realtime Database Rules
{
  "rules": {
    "employees": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "image_vectors": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

- **Face recognition library installation**: Install CMake and dlib dependencies
- **Firebase connection**: Verify service account key and database URL
- **Port conflicts**: Change FLASK_PORT in .env file

#### Frontend Issues

- **Firebase configuration**: Check all environment variables are set
- **CORS errors**: Ensure backend CORS is properly configured
- **Build failures**: Clear node_modules and reinstall dependencies

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=DEBUG` in backend .env file.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [face_recognition](https://github.com/ageitgey/face_recognition) library for ML capabilities
- [Firebase](https://firebase.google.com/) for backend services
- [React](https://reactjs.org/) and [Flask](https://flask.palletsprojects.com/) communities

## 📞 Support

For support and questions:

- Create an issue in this repository
- Check the troubleshooting section above
- Review the API documentation

---

**Built with ❤️ using React, Flask, and Firebase**
