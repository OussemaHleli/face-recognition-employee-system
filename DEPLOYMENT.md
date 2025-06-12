# 🚀 Deployment Guide

This guide covers deploying the Face Recognition Employee Management System to production environments.

## 📋 Pre-deployment Checklist

### Security
- [ ] All sensitive data moved to environment variables
- [ ] Firebase service account key secured
- [ ] Production Firebase project configured
- [ ] CORS settings configured for production domains
- [ ] SSL certificates obtained
- [ ] Database security rules implemented

### Configuration
- [ ] Production environment variables set
- [ ] Firebase Storage bucket permissions configured
- [ ] Backend API endpoints tested
- [ ] Frontend build optimized
- [ ] Error logging configured

## 🌐 Production Environment Setup

### Backend Deployment (Flask)

#### Option 1: Traditional Server (Ubuntu/CentOS)

1. **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv nginx -y

# Install system dependencies for face_recognition
sudo apt install build-essential cmake libopenblas-dev liblapack-dev -y
sudo apt install libx11-dev libgtk-3-dev libboost-python-dev -y
```

2. **Application Setup**
```bash
# Clone repository
git clone https://github.com/yourusername/face-recognition-employee-system.git
cd face-recognition-employee-system/back

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with production values
```

3. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. **Systemd Service**
```ini
# /etc/systemd/system/face-recognition-api.service
[Unit]
Description=Face Recognition API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/your/app/back
Environment=PATH=/path/to/your/app/back/venv/bin
ExecStart=/path/to/your/app/back/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Option 2: Docker Deployment

1. **Create Dockerfile** (`back/Dockerfile`)
```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

2. **Build and Run**
```bash
docker build -t face-recognition-api .
docker run -d -p 5000:5000 --env-file .env face-recognition-api
```

#### Option 3: Cloud Platforms

**Google Cloud Run**
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/face-recognition-api
gcloud run deploy --image gcr.io/PROJECT-ID/face-recognition-api --platform managed
```

**AWS Elastic Beanstalk**
```bash
# Create application.py for EB
cp app.py application.py

# Deploy
eb init
eb create production
eb deploy
```

### Frontend Deployment (React)

#### Option 1: Static Hosting (Netlify/Vercel)

1. **Build for Production**
```bash
cd front
npm run build
```

2. **Deploy to Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

3. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 2: Traditional Web Server

1. **Build Application**
```bash
cd front
npm run build
```

2. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;
    root /path/to/your/app/front/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 Production Configuration

### Environment Variables

#### Backend Production Settings
```env
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_PORT=5000
FLASK_HOST=0.0.0.0

# Use production Firebase project
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/secure/path/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-prod-project-default-rtdb.region.firebasedatabase.app/
FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com

FACE_RECOGNITION_THRESHOLD=0.6
STORAGE_FOLDER=/app/storage
LOG_LEVEL=INFO
```

#### Frontend Production Settings
```env
REACT_APP_API_BASE_URL=https://api.your-domain.com

# Production Firebase configuration
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-prod-project-default-rtdb.region.firebasedatabase.app
REACT_APP_FIREBASE_PROJECT_ID=your-prod-project
REACT_APP_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
REACT_APP_FIREBASE_APP_ID=your_prod_app_id

GENERATE_SOURCEMAP=false
```

### Firebase Security Rules

#### Realtime Database Rules
```json
{
  "rules": {
    "employees": {
      ".read": "auth != null && auth.token.admin == true",
      ".write": "auth != null && auth.token.admin == true"
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
      ".write": "auth != null"
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /faces/{imageId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## 🔒 Security Best Practices

### SSL/TLS Configuration
```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# UFW setup
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Environment Security
- Store sensitive files outside web root
- Use proper file permissions (600 for service account key)
- Implement rate limiting
- Enable request logging
- Set up monitoring and alerts

## 📊 Monitoring and Logging

### Application Monitoring
```python
# Add to app.py for production logging
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
```

### Health Checks
Set up monitoring for:
- API endpoint availability (`/health`)
- Database connectivity
- Storage access
- Face recognition processing time
- Error rates

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          # Your deployment script here
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and deploy
        run: |
          cd front
          npm install
          npm run build
          # Deploy to hosting service
```

## 🆘 Troubleshooting Production Issues

### Common Problems
1. **Face recognition library issues**: Ensure all system dependencies installed
2. **Firebase connection timeouts**: Check network and firewall settings
3. **Memory issues**: Monitor RAM usage, consider upgrading server
4. **Storage permissions**: Verify Firebase Storage rules and service account permissions

### Debug Commands
```bash
# Check service status
sudo systemctl status face-recognition-api

# View logs
sudo journalctl -u face-recognition-api -f

# Test API endpoints
curl -X GET https://api.your-domain.com/health

# Check disk space
df -h

# Monitor memory usage
free -h
```

## 📈 Performance Optimization

### Backend Optimizations
- Use Gunicorn with multiple workers
- Implement Redis caching for frequent queries
- Optimize face recognition processing
- Use CDN for static assets

### Frontend Optimizations
- Enable gzip compression
- Implement lazy loading
- Optimize images and assets
- Use service workers for caching

---

For additional support, refer to the main README.md or create an issue in the repository.
