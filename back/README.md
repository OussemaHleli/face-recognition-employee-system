# 🔐 Employee Face Recognition System

A complete face recognition system with Flask backend, Firebase storage, and ESP32 integration for employee management.

## 🏗️ System Architecture

```
Frontend (Web/Mobile) ──┐
                        ├──► Flask Backend ──► Firebase Database
ESP32 Device ──────────┘                      ├── employees
                                               ├── image_vectors
                                               ├── admins
                                               └── fingerprints
```

### Components:

- **Frontend**: Sends employee registration data (image + details)
- **Backend**: Flask API with face recognition processing
- **ESP32**: Captures images for real-time employee verification
- **Firebase**: Stores employee data and face vectors in structured collections

## 🚀 Features

- ✅ Employee registration with face encoding
- ✅ Real-time employee verification
- ✅ Integration with existing Firebase employee database
- ✅ ESP32-ready API endpoints
- ✅ Confidence scoring and threshold management
- ✅ Duplicate employee prevention
- ✅ Health monitoring and admin statistics
- ✅ Automatic processing of existing employee images
- ✅ Mock mode for testing without face_recognition library

## 📋 API Endpoints

### 1. Employee Registration (Frontend)

```http
POST /register
Content-Type: multipart/form-data

Body:
- image: image file
- employee_id: string
- name: string (optional)
- email: string (optional)
- department: string (optional)
```

**Response:**

```json
{
  "message": "Employee registered successfully",
  "employee_id": "EMP001",
  "filename": "EMP001_uuid.jpg",
  "vector_id": "vector_key_123",
  "mock_mode": false
}
```

### 2. Face Verification (ESP32)

```http
POST /verify
Content-Type: multipart/form-data

Body:
- image: image file
```

**Response:**

```json
{
  "verified": true,
  "employee_id": "EMP001",
  "employee_name": "John Doe",
  "department": "IT",
  "confidence": 95.67,
  "distance": 0.23,
  "message": "Employee EMP001 verified successfully",
  "mock_mode": false
}
```

### 3. Get Employees

```http
GET /employees
```

### 4. Process Existing Employees

```http
POST /process_existing_employees
```

### 5. Admin Statistics

```http
GET /admin/stats
```

### 6. Health Check

```http
GET /health
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Firebase Setup

1. Create a Firebase project
2. Generate service account key
3. Place `serviceAccountKey.json` in `./firebase/` folder
4. Update database URL in `app.py`

### 3. Run the Server

```bash
python app.py
```

Server will start on `http://localhost:5000`

## 🧪 Testing

### Production System Test

```bash
python test_production_system.py
```

### Database Migration

```bash
# Migrate from old user-based structure to employee-based structure
python migrate_database.py
```

### Process Existing Employees

```bash
# Generate face vectors for existing employees with face images
curl -X POST http://localhost:5000/process_existing_employees
```

## 🔧 Configuration

### Face Recognition Settings

```python
# In app.py
FACE_RECOGNITION_THRESHOLD = 0.6  # Lower = more strict
```

### Firebase Structure

```json
{
  "employees": {
    "EMP001": {
      "id": "EMP001",
      "name": "John Doe",
      "email": "john@company.com",
      "department": "IT",
      "faceUrl": "https://storage.googleapis.com/...",
      "createdAt": "2024-01-01T12:00:00",
      "updatedAt": "2024-01-01T12:00:00",
      "lastVerified": "2024-01-01T12:30:00",
      "isActive": true
    }
  },
  "image_vectors": {
    "vector_key_123": {
      "employeeId": "EMP001",
      "vector": [128-dimensional array],
      "timestamp": "2024-01-01T12:00:00",
      "filename": "EMP001_uuid.jpg",
      "mock_mode": false
    }
  },
  "admins": {
    "admin_001": {
      "name": "Admin User",
      "email": "admin@company.com"
    }
  },
  "fingerprints": {
    "fingerprint_001": {
      "employeeId": "EMP001",
      "data": "fingerprint_data"
    }
  }
}
```

## 📱 Frontend Integration

### JavaScript Example

```javascript
// Register user
const formData = new FormData();
formData.append("image", imageFile);
formData.append("user_id", "john_doe_123");

fetch("http://localhost:5000/register", {
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## 🤖 ESP32 Integration

### Arduino Code Structure

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"

// Capture image and send for verification
bool verifyUser() {
    camera_fb_t * fb = esp_camera_fb_get();

    HTTPClient http;
    http.begin("http://your-server.com:5000/verify");

    // Create multipart form data
    // Send POST request
    // Parse JSON response

    return verified;
}
```

## 🔒 Security Considerations

- Use HTTPS in production
- Implement rate limiting
- Add authentication for admin endpoints
- Validate image file types and sizes
- Consider encrypting face vectors

## 📊 Performance

- Face encoding: ~1-2 seconds per image
- Verification: ~0.1-0.5 seconds
- Supports multiple concurrent requests
- Firebase real-time database for fast lookups

## 🐛 Troubleshooting

### Common Issues:

1. **"No face detected"**

   - Ensure good lighting
   - Face should be clearly visible
   - Try different angles

2. **Low confidence scores**

   - Adjust `FACE_RECOGNITION_THRESHOLD`
   - Ensure consistent lighting conditions
   - Use high-quality images

3. **Firebase connection errors**
   - Check service account key
   - Verify database URL
   - Ensure proper permissions

## 📈 Future Enhancements

- [ ] Multiple face support per user
- [ ] Live video stream processing
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Backup and recovery system
- [ ] Edge computing optimization for ESP32

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details
