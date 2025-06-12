import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import firebase_admin
from firebase_admin import credentials, db, storage
from datetime import datetime
import uuid
import tempfile
import logging
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import real face_recognition library
try:
    import face_recognition
    logger.info("✅ Using REAL face_recognition library")
except ImportError:
    logger.error("❌ face_recognition library not found! Please install it with: pip install face_recognition")
    raise ImportError("face_recognition library is required for production use")

# Initialize Firebase
service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH', './firebase/serviceAccountKey.json')
database_url = os.getenv('FIREBASE_DATABASE_URL', 'https://gestion-presence-cc7ef-default-rtdb.europe-west1.firebasedatabase.app/')
storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET', 'gestion-presence-cc7ef.appspot.com')

cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': database_url,
    'storageBucket': storage_bucket
})

app = Flask(__name__)
CORS(app)

# Configurations
STORAGE_FOLDER = os.getenv('STORAGE_FOLDER', 'storage')
os.makedirs(STORAGE_FOLDER, exist_ok=True)

# Face recognition threshold (lower = more strict)
# Production threshold for real face recognition
FACE_RECOGNITION_THRESHOLD = float(os.getenv('FACE_RECOGNITION_THRESHOLD', '0.6'))

def extract_face_features(image_path):
    """Extract face encoding from an image file using real face recognition"""
    try:
        logger.info(f"Processing image: {image_path}")

        # Load the image
        image = face_recognition.load_image_file(image_path)
        logger.info(f"Image loaded successfully, shape: {image.shape}")

        # Find all face locations in the image
        face_locations = face_recognition.face_locations(image)
        logger.info(f"Found {len(face_locations)} face(s) in the image")

        if not face_locations:
            raise ValueError("No face detected in the image")

        # Get face encodings for the first face found
        face_encodings = face_recognition.face_encodings(image, face_locations)
        logger.info(f"Generated {len(face_encodings)} face encoding(s)")

        if not face_encodings:
            raise ValueError("Could not encode face")

        # Return the first face encoding (128-dimensional vector)
        face_vector = face_encodings[0].tolist()
        logger.info(f"Face vector extracted successfully, length: {len(face_vector)}")
        return face_vector

    except Exception as e:
        logger.error(f"Error extracting face features from {image_path}: {e}")
        raise



def validate_employee_id(employee_id):
    """Validate employee ID format"""
    if not employee_id or not isinstance(employee_id, str):
        return False
    # Allow alphanumeric characters, hyphens, and underscores
    return bool(employee_id.strip()) and len(employee_id.strip()) <= 50

def compare_faces(known_encoding, unknown_encoding, threshold=None):
    """Compare two face encodings using real face recognition and return similarity"""
    try:
        if threshold is None:
            threshold = FACE_RECOGNITION_THRESHOLD

        # Convert to numpy arrays
        known_encoding = np.array(known_encoding)
        unknown_encoding = np.array(unknown_encoding)

        # Calculate face distance using real face_recognition library
        distance = face_recognition.face_distance([known_encoding], unknown_encoding)[0]

        # Return match result and confidence
        is_match = distance <= threshold
        confidence = max(0, (1 - distance) * 100)  # Convert to percentage

        logger.info(f"Face comparison: distance={distance:.4f}, threshold={threshold}, match={is_match}, confidence={confidence:.2f}%")
        return is_match, confidence, distance

    except Exception as e:
        logger.error(f"Error comparing faces: {e}")
        return False, 0, float('inf')

def upload_image_to_firebase_storage(local_path, employee_id):
    """Upload image to Firebase Storage and return the download URL"""
    try:
        # Get Firebase Storage bucket
        bucket = storage.bucket()

        # Create a unique filename
        file_extension = os.path.splitext(local_path)[1] or '.jpg'
        storage_filename = f"faces/{uuid.uuid4()}{file_extension}"

        # Upload the file
        blob = bucket.blob(storage_filename)
        blob.upload_from_filename(local_path)

        # Make the blob publicly readable
        blob.make_public()

        # Get the public URL
        public_url = blob.public_url

        logger.info(f"Uploaded image for employee {employee_id} to Firebase Storage: {storage_filename}")
        return public_url

    except Exception as e:
        logger.error(f"Error uploading image to Firebase Storage: {e}")
        return None

def download_image_from_url(url, local_path):
    """Download image from Firebase Storage URL"""
    try:
        import requests
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        with open(local_path, 'wb') as f:
            f.write(response.content)

        logger.info(f"Downloaded image from {url} to {local_path}")
        return True
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {e}")
        return False

def get_employee_by_id(employee_id):
    """Get employee data from Firebase employees collection"""
    try:
        employees_ref = db.reference('employees')
        employee = employees_ref.child(employee_id).get()
        return employee
    except Exception as e:
        logger.error(f"Error getting employee {employee_id}: {e}")
        return None

def get_image_vector_by_employee_id(employee_id):
    """Get face vector from image_vectors collection"""
    try:
        vectors_ref = db.reference('image_vectors')
        all_vectors = vectors_ref.get()

        if not all_vectors:
            return None

        # Find vector for this employee
        for vector_id, vector_data in all_vectors.items():
            if vector_data.get('employeeId') == employee_id:
                return vector_data.get('vector')

        return None
    except Exception as e:
        logger.error(f"Error getting image vector for employee {employee_id}: {e}")
        return None

def save_image_vector(employee_id, vector, filename=None):
    """Save face vector to image_vectors collection"""
    try:
        vectors_ref = db.reference('image_vectors')
        vector_data = {
            'employeeId': employee_id,
            'vector': vector,
            'timestamp': datetime.now().isoformat(),
            'filename': filename,
            'library': 'face_recognition',
            'vector_length': len(vector)
        }

        # Push new vector entry
        new_vector_ref = vectors_ref.push(vector_data)
        logger.info(f"Saved face vector for employee {employee_id} (length: {len(vector)})")
        return new_vector_ref.key
    except Exception as e:
        logger.error(f"Error saving image vector for employee {employee_id}: {e}")
        return None

@app.route('/register', methods=['POST'])
def register_employee():
    """Process face recognition vectors for an employee (employee data should already be in Firebase)"""
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Check for required fields
        if 'employee_id' not in data:
            return jsonify({'error': 'No employee_id provided'}), 400

        if 'face_image_url' not in data:
            return jsonify({'error': 'No face_image_url provided'}), 400

        employee_id = data['employee_id'].strip()
        face_image_url = data['face_image_url'].strip()

        # Validate employee ID
        if not validate_employee_id(employee_id):
            return jsonify({'error': 'Invalid employee_id format'}), 400

        # Validate face image URL
        if not face_image_url.startswith('https://'):
            return jsonify({'error': 'Invalid face_image_url format'}), 400

        # Check if employee exists in Firebase
        existing_employee = get_employee_by_id(employee_id)
        if not existing_employee:
            return jsonify({'error': 'Employee not found in database. Please save employee data first.'}), 404

        # Check if employee already has face vector
        existing_vector = get_image_vector_by_employee_id(employee_id)
        if existing_vector:
            return jsonify({'error': 'Employee already has face recognition vectors'}), 409

        # Download image from Firebase Storage URL
        temp_filename = f"register_{employee_id}_{uuid.uuid4()}.jpg"
        temp_filepath = os.path.join(STORAGE_FOLDER, temp_filename)

        try:
            if not download_image_from_url(face_image_url, temp_filepath):
                return jsonify({'error': 'Failed to download image from provided URL'}), 400

            # Extract face features from downloaded image
            face_vector = extract_face_features(temp_filepath)

            # Save face vector to image_vectors collection
            vector_id = save_image_vector(employee_id, face_vector, temp_filename)

            if not vector_id:
                return jsonify({'error': 'Failed to save face vector to database'}), 500

            logger.info(f"Generated face vector for employee {employee_id} with vector {vector_id}")

            return jsonify({
                'success': True,
                'message': 'Face recognition vectors generated successfully',
                'employee_id': employee_id,
                'vector_id': vector_id,
                'face_image_url': face_image_url,
                'face_recognition': 'real',
                'vector_length': len(face_vector),
                'timestamp': datetime.now().isoformat()
            }), 201

        except ValueError as e:
            return jsonify({'error': f'Face processing error: {str(e)}'}), 400

        finally:
            # Clean up temporary file
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)

    except Exception as e:
        logger.error(f"Error in register_employee: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/verify', methods=['POST'])
def verify_employee():
    """Verify an employee by comparing their face image with stored data"""
    try:
        # Check for required fields
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        file = request.files['image']

        # Save the verification image temporarily
        temp_filename = f"verify_{uuid.uuid4()}.jpg"
        temp_filepath = os.path.join(STORAGE_FOLDER, temp_filename)
        file.save(temp_filepath)

        try:
            # Extract face features from verification image
            verification_vector = extract_face_features(temp_filepath)

            # Get all image vectors from Firebase
            vectors_ref = db.reference('image_vectors')
            all_vectors = vectors_ref.get()

            if not all_vectors:
                return jsonify({
                    'verified': False,
                    'message': 'No registered employees found'
                }), 404

            best_match = None
            best_confidence = 0
            best_distance = float('inf')
            best_employee_data = None

            # Compare with all stored face vectors
            for vector_id, vector_data in all_vectors.items():
                if 'vector' not in vector_data or 'employeeId' not in vector_data:
                    continue

                stored_vector = vector_data['vector']
                employee_id = vector_data['employeeId']

                is_match, confidence, distance = compare_faces(stored_vector, verification_vector)

                if is_match and confidence > best_confidence:
                    best_match = employee_id
                    best_confidence = confidence
                    best_distance = distance

                    # Get employee details
                    best_employee_data = get_employee_by_id(employee_id)

            # Clean up temporary file
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)

            if best_match and best_employee_data:
                # Update employee's last verified timestamp
                employees_ref = db.reference('employees')
                employees_ref.child(best_match).child('lastVerified').set(datetime.now().isoformat())

                # Handle both old format (name) and new format (firstName, lastName)
                employee_name = best_employee_data.get('name')
                if not employee_name and best_employee_data.get('firstName') and best_employee_data.get('lastName'):
                    employee_name = f"{best_employee_data.get('firstName')} {best_employee_data.get('lastName')}"

                return jsonify({
                    'verified': True,
                    'employee_id': best_match,
                    'employee_name': employee_name or 'Unknown',
                    'department': best_employee_data.get('department', 'Unknown'),
                    'confidence': round(best_confidence, 2),
                    'distance': round(best_distance, 4),
                    'message': f'Employee {best_match} verified successfully',
                    'face_recognition': 'real',
                    'threshold': FACE_RECOGNITION_THRESHOLD
                }), 200
            else:
                return jsonify({
                    'verified': False,
                    'message': 'No matching employee found',
                    'confidence': 0,
                    'face_recognition': 'real',
                    'threshold': FACE_RECOGNITION_THRESHOLD
                }), 200

        except ValueError as e:
            # Clean up temporary file
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
            return jsonify({'error': str(e)}), 400

    except Exception as e:
        logger.error(f"Error in verify_employee: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/employees', methods=['GET'])
def get_employees():
    """Get list of all registered employees"""
    try:
        employees_ref = db.reference('employees')
        all_employees = employees_ref.get()

        if not all_employees:
            return jsonify({'employees': [], 'count': 0, 'face_recognition': 'real'}), 200

        # Return employee info without face vectors (for privacy)
        employees_list = []
        for employee_id, employee_data in all_employees.items():
            # Handle both old format (name) and new format (firstName, lastName)
            name = employee_data.get('name')
            if not name and employee_data.get('firstName') and employee_data.get('lastName'):
                name = f"{employee_data.get('firstName')} {employee_data.get('lastName')}"

            employee_info = {
                'employee_id': employee_id,
                'name': name,
                'firstName': employee_data.get('firstName'),
                'lastName': employee_data.get('lastName'),
                'email': employee_data.get('email'),
                'phone': employee_data.get('phone'),
                'department': employee_data.get('department'),
                'position': employee_data.get('position'),
                'fingerprintId': employee_data.get('fingerprintId'),
                'created_at': employee_data.get('createdAt'),
                'last_verified': employee_data.get('lastVerified'),
                'is_active': employee_data.get('isActive', True),
                'has_face_data': get_image_vector_by_employee_id(employee_id) is not None
            }
            employees_list.append(employee_info)

        return jsonify({
            'employees': employees_list,
            'count': len(employees_list),
            'face_recognition': 'real'
        }), 200

    except Exception as e:
        logger.error(f"Error in get_employees: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/process_employee/<employee_id>', methods=['POST'])
def process_single_employee(employee_id):
    """Process a single employee to generate face vector from their stored image"""
    try:
        # Get employee data
        employee_data = get_employee_by_id(employee_id)
        if not employee_data:
            return jsonify({
                'success': False,
                'error': f'Employee {employee_id} not found'
            }), 404

        # Check if employee already has face vector
        existing_vector = get_image_vector_by_employee_id(employee_id)
        if existing_vector:
            return jsonify({
                'success': False,
                'message': f'Employee {employee_id} already has a face vector',
                'employee_id': employee_id,
                'employee_name': employee_data.get('name') or f"{employee_data.get('firstName', '')} {employee_data.get('lastName', '')}".strip() or 'Unknown',
                'has_existing_vector': True
            }), 409

        # Check if employee has face URL
        face_url = employee_data.get('faceUrl')
        if not face_url:
            return jsonify({
                'success': False,
                'error': f'Employee {employee_id} has no face image URL',
                'employee_id': employee_id,
                'employee_name': employee_data.get('name') or f"{employee_data.get('firstName', '')} {employee_data.get('lastName', '')}".strip() or 'Unknown'
            }), 400

        # Download and process the image
        temp_filename = f"temp_{employee_id}_{uuid.uuid4()}.jpg"
        temp_filepath = os.path.join(STORAGE_FOLDER, temp_filename)

        try:
            if download_image_from_url(face_url, temp_filepath):
                # Extract face features
                face_vector = extract_face_features(temp_filepath)

                # Save face vector
                vector_id = save_image_vector(employee_id, face_vector, temp_filename)

                if vector_id:
                    return jsonify({
                        'success': True,
                        'message': f'Face vector generated successfully for employee {employee_id}',
                        'employee_id': employee_id,
                        'employee_name': employee_data.get('name') or f"{employee_data.get('firstName', '')} {employee_data.get('lastName', '')}".strip() or 'Unknown',
                        'department': employee_data.get('department', 'Unknown'),
                        'vector_id': vector_id,
                        'face_url': face_url,
                        'vector_length': len(face_vector),
                        'face_recognition': 'real',
                        'timestamp': datetime.now().isoformat()
                    }), 201
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Failed to save face vector to database',
                        'employee_id': employee_id
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to download face image from URL',
                    'employee_id': employee_id,
                    'face_url': face_url
                }), 400

        except ValueError as e:
            return jsonify({
                'success': False,
                'error': f'Face processing error: {str(e)}',
                'employee_id': employee_id,
                'face_url': face_url
            }), 400

        finally:
            # Clean up temporary file
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)

    except Exception as e:
        logger.error(f"Error in process_single_employee: {e}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'employee_id': employee_id
        }), 500

@app.route('/regenerate_employee/<employee_id>', methods=['POST'])
def regenerate_employee_vector(employee_id):
    """Regenerate face vector for an employee (force regeneration, clears existing vector)"""
    try:
        # Get employee data
        employee_data = get_employee_by_id(employee_id)
        if not employee_data:
            return jsonify({
                'success': False,
                'error': f'Employee {employee_id} not found'
            }), 404

        # Clear existing face vector if it exists
        vectors_ref = db.reference('image_vectors')
        all_vectors = vectors_ref.get()

        if all_vectors:
            for vector_id, vector_data in all_vectors.items():
                if vector_data.get('employeeId') == employee_id:
                    vectors_ref.child(vector_id).delete()
                    logger.info(f"Deleted existing vector {vector_id} for employee {employee_id}")

        # Check if employee has face URL
        face_url = employee_data.get('faceUrl')
        if not face_url:
            return jsonify({
                'success': False,
                'error': f'Employee {employee_id} has no face image URL',
                'employee_id': employee_id,
                'employee_name': employee_data.get('name') or f"{employee_data.get('firstName', '')} {employee_data.get('lastName', '')}".strip() or 'Unknown'
            }), 400

        # Download and process the image
        temp_filename = f"regen_{employee_id}_{uuid.uuid4()}.jpg"
        temp_filepath = os.path.join(STORAGE_FOLDER, temp_filename)

        try:
            if download_image_from_url(face_url, temp_filepath):
                # Extract face features
                face_vector = extract_face_features(temp_filepath)

                # Save new face vector
                vector_id = save_image_vector(employee_id, face_vector, temp_filename)

                if vector_id:
                    return jsonify({
                        'success': True,
                        'message': f'Face vector regenerated successfully for employee {employee_id}',
                        'employee_id': employee_id,
                        'employee_name': employee_data.get('name') or f"{employee_data.get('firstName', '')} {employee_data.get('lastName', '')}".strip() or 'Unknown',
                        'department': employee_data.get('department', 'Unknown'),
                        'vector_id': vector_id,
                        'face_url': face_url,
                        'vector_length': len(face_vector),
                        'face_recognition': 'real',
                        'regenerated': True,
                        'timestamp': datetime.now().isoformat()
                    }), 201
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Failed to save regenerated face vector to database',
                        'employee_id': employee_id
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to download face image from URL',
                    'employee_id': employee_id,
                    'face_url': face_url
                }), 400

        except ValueError as e:
            return jsonify({
                'success': False,
                'error': f'Face processing error: {str(e)}',
                'employee_id': employee_id,
                'face_url': face_url
            }), 400

        finally:
            # Clean up temporary file
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)

    except Exception as e:
        logger.error(f"Error in regenerate_employee_vector: {e}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'employee_id': employee_id
        }), 500

@app.route('/process_existing_employees', methods=['POST'])
def process_existing_employees():
    """Process existing employees to generate face vectors from their stored images"""
    try:
        employees_ref = db.reference('employees')
        all_employees = employees_ref.get()

        if not all_employees:
            return jsonify({'message': 'No employees found'}), 404

        processed_count = 0
        skipped_count = 0
        error_count = 0
        results = []

        for employee_id, employee_data in all_employees.items():
            try:
                # Check if employee already has face vector
                existing_vector = get_image_vector_by_employee_id(employee_id)
                if existing_vector:
                    skipped_count += 1
                    results.append({
                        'employee_id': employee_id,
                        'status': 'skipped',
                        'reason': 'Face vector already exists'
                    })
                    continue

                # Check if employee has face URL
                face_url = employee_data.get('faceUrl')
                if not face_url:
                    skipped_count += 1
                    results.append({
                        'employee_id': employee_id,
                        'status': 'skipped',
                        'reason': 'No face URL found'
                    })
                    continue

                # Download and process the image
                temp_filename = f"temp_{employee_id}_{uuid.uuid4()}.jpg"
                temp_filepath = os.path.join(STORAGE_FOLDER, temp_filename)

                if download_image_from_url(face_url, temp_filepath):
                    try:
                        # Extract face features
                        face_vector = extract_face_features(temp_filepath)

                        # Save face vector
                        vector_id = save_image_vector(employee_id, face_vector, temp_filename)

                        if vector_id:
                            processed_count += 1
                            results.append({
                                'employee_id': employee_id,
                                'status': 'processed',
                                'vector_id': vector_id
                            })
                        else:
                            error_count += 1
                            results.append({
                                'employee_id': employee_id,
                                'status': 'error',
                                'reason': 'Failed to save face vector'
                            })

                    except ValueError as e:
                        error_count += 1
                        results.append({
                            'employee_id': employee_id,
                            'status': 'error',
                            'reason': str(e)
                        })

                    finally:
                        # Clean up temporary file
                        if os.path.exists(temp_filepath):
                            os.remove(temp_filepath)
                else:
                    error_count += 1
                    results.append({
                        'employee_id': employee_id,
                        'status': 'error',
                        'reason': 'Failed to download image'
                    })

            except Exception as e:
                error_count += 1
                results.append({
                    'employee_id': employee_id,
                    'status': 'error',
                    'reason': str(e)
                })

        return jsonify({
            'message': 'Processing completed',
            'summary': {
                'total_employees': len(all_employees),
                'processed': processed_count,
                'skipped': skipped_count,
                'errors': error_count
            },
            'results': results,
            'face_recognition': 'real'
        }), 200

    except Exception as e:
        logger.error(f"Error in process_existing_employees: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Get counts from database
        employees_ref = db.reference('employees')
        vectors_ref = db.reference('image_vectors')

        employees_count = len(employees_ref.get() or {})
        vectors_count = len(vectors_ref.get() or {})

        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '3.0.0',
            'python_version': '3.10',
            'database': {
                'employees_count': employees_count,
                'face_vectors_count': vectors_count
            },
            'face_recognition': {
                'library': 'real',
                'threshold': FACE_RECOGNITION_THRESHOLD,
                'status': 'production'
            }
        }), 200
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }), 500

@app.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get administrative statistics"""
    try:
        employees_ref = db.reference('employees')
        vectors_ref = db.reference('image_vectors')

        all_employees = employees_ref.get() or {}
        all_vectors = vectors_ref.get() or {}

        # Count employees with face vectors
        employees_with_vectors = 0
        for employee_id in all_employees.keys():
            if get_image_vector_by_employee_id(employee_id):
                employees_with_vectors += 1

        return jsonify({
            'total_employees': len(all_employees),
            'employees_with_face_vectors': employees_with_vectors,
            'total_face_vectors': len(all_vectors),
            'employees_without_vectors': len(all_employees) - employees_with_vectors,
            'face_recognition': 'real',
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error in get_admin_stats: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    # Get configuration from environment variables
    flask_host = os.getenv('FLASK_HOST', '0.0.0.0')
    flask_port = int(os.getenv('FLASK_PORT', '5000'))
    flask_debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    logger.info("🚀 Starting Face Recognition System (Production)")
    logger.info("📊 Face recognition mode: REAL (Python 3.10)")
    logger.info(f"🔧 Recognition threshold: {FACE_RECOGNITION_THRESHOLD}")
    logger.info(f"🌐 Server will be available at http://{flask_host}:{flask_port}")

    app.run(debug=flask_debug, port=flask_port, host=flask_host)