"""
Dental Disease Detection — Flask Inference Server
Serves YOLO model predictions via REST API.
"""
import os
import uuid
import json
import numpy as np
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    """Root endpoint to show a premium server dashboard."""
    conn = get_db_connection()
    patient_count = conn.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    treatment_count = conn.execute("SELECT COUNT(*) FROM treatments").fetchone()[0]
    conn.close()

    html_template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dental AI | Command Center</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #4f46e5;
                --secondary: #ec4899;
                --bg: #0f172a;
                --card-bg: rgba(30, 41, 59, 0.7);
                --text: #f8fafc;
                --text-dim: #94a3b8;
                --accent: #22d3ee;
            }
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: 'Outfit', sans-serif;
                background-color: var(--bg);
                color: var(--text);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                background-image: 
                    radial-gradient(circle at 20% 30%, rgba(79, 70, 229, 0.15) 0%, transparent 40%),
                    radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 40%);
            }

            .container {
                width: 100%;
                max-width: 900px;
                padding: 2rem;
                z-index: 10;
            }

            .glass-card {
                background: var(--card-bg);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 3rem;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                text-align: center;
                animation: fadeIn 0.8s ease-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .logo {
                font-size: 0.9rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.2em;
                color: var(--accent);
                margin-bottom: 1rem;
                display: inline-block;
                padding: 0.5rem 1rem;
                border: 1px solid rgba(34, 211, 238, 0.3);
                border-radius: 99px;
            }

            h1 {
                font-size: 3.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                background: linear-gradient(to right, #fff, #94a3b8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .status-tag {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(34, 197, 94, 0.1);
                color: #4ade80;
                padding: 0.5rem 1.25rem;
                border-radius: 99px;
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 2rem;
            }

            .status-pulse {
                width: 10px;
                height: 10px;
                background: #4ade80;
                border-radius: 50%;
                box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4);
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
                100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1.5rem;
                margin-bottom: 3rem;
            }

            .stat-box {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 16px;
                padding: 1.5rem;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }

            .stat-value {
                font-size: 2rem;
                font-weight: 700;
                color: #fff;
                display: block;
            }

            .stat-label {
                font-size: 0.8rem;
                color: var(--text-dim);
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }

            .endpoints {
                text-align: left;
            }

            .endpoint-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                margin-bottom: 0.75rem;
                transition: all 0.2s;
            }

            .endpoint-item:hover {
                background: rgba(255, 255, 255, 0.05);
                transform: translateX(4px);
            }

            .method {
                font-weight: 800;
                font-size: 0.75rem;
                padding: 0.25rem 0.6rem;
                border-radius: 4px;
                margin-right: 1rem;
            }

            .get { background: rgba(34, 211, 238, 0.1); color: var(--accent); }
            .post { background: rgba(168, 85, 247, 0.1); color: #a855f7; }

            .url {
                font-family: monospace;
                color: var(--text-dim);
                font-size: 0.95rem;
            }

            .link-btn {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                text-decoration: none;
                padding: 0.4rem 0.8rem;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 600;
                transition: all 0.2s;
            }

            .link-btn:hover {
                background: #fff;
                color: var(--bg);
            }

            footer {
                margin-top: 3rem;
                color: var(--text-dim);
                font-size: 0.85rem;
                display: flex;
                justify-content: center;
                gap: 2rem;
            }

            .bg-deco {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                pointer-events: none;
                opacity: 0.4;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="glass-card">
                <div class="logo">Medical Intel Engine v1.0</div>
                <h1>Dental AI Backend</h1>
                <div class="status-tag">
                    <div class="status-pulse"></div>
                    System Operational
                </div>

                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-value">""" + str(patient_count) + """</span>
                        <span class="stat-label">Patients</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">""" + str(treatment_count) + """</span>
                        <span class="stat-label">Treatments</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">AI Live</span>
                        <span class="stat-label">YOLOv8 Status</span>
                    </div>
                </div>

                <div class="endpoints">
                    <div class="endpoint-item">
                        <div>
                            <span class="method get">GET</span>
                            <span class="url">/api/health</span>
                        </div>
                        <a href="/api/health" class="link-btn">Test</a>
                    </div>
                    <div class="endpoint-item">
                        <div>
                            <span class="method get">GET</span>
                            <span class="url">/api/patients</span>
                        </div>
                        <a href="/api/patients" class="link-btn">Test</a>
                    </div>
                    <div class="endpoint-item">
                        <div>
                            <span class="method post">POST</span>
                            <span class="url">/api/scan</span>
                        </div>
                        <span style="color: var(--text-dim); font-size: 0.8rem;">Requires Image Upload</span>
                    </div>
                </div>
            </div>

            <footer>
                <div>Port: 5000</div>
                <div>Environment: Development</div>
                <div>Server Time: """ + datetime.datetime.now().strftime("%H:%M:%S") + """</div>
            </footer>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_template)

# Paths
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(PROJECT_DIR, "scan_results")
os.makedirs(RESULTS_DIR, exist_ok=True)

# Model loading — load fine-tuned model
MODEL_PATH = os.path.join(PROJECT_DIR, "best.pt")

model = None
model_error = None

if os.path.exists(MODEL_PATH):
    file_size = os.path.getsize(MODEL_PATH)
    if file_size < 1000000: # Less than 1MB means it's an LFS pointer, not the file!
        model_error = f"best.pt is an LFS pointer, not the real file! Size: {file_size} bytes."
        print(model_error)
    else:
        try:
            print(f"Loading REAL fine-tuned model from: {MODEL_PATH} ({file_size} bytes)")
            model = YOLO(MODEL_PATH)
            print("Model loaded successfully!")
        except Exception as e:
            model_error = f"Failed to load model. Exception: {e}"
            print(f"ERROR: {model_error}")
            model = None
else:
    model_error = f"best.pt file completely missing from container at {MODEL_PATH}."
    print("WARNING: " + model_error)

# Disease severity mapping
SEVERITY_MAP = {
    "Caries": "high",
    "Bone Loss": "high",
    "Fracture teeth": "high",
    "Periapical lesion": "high",
    "Cyst": "high",
    "Root resorption": "high",
    "bone defect": "high",
    "Retained root": "medium",
    "Root Piece": "medium",
    "Missing teeth": "medium",
    "Malaligned": "medium",
    "impacted tooth": "medium",
    "Supra Eruption": "medium",
    "attrition": "medium",
    "Crown": "low",
    "Filling": "low",
    "Implant": "low",
    "Root Canal Treatment": "low",
    "Mandibular Canal": "info",
    "maxillary sinus": "info",
    "Permanent Teeth": "info",
    "Primary teeth": "info",
    "TAD": "info",
    "abutment": "info",
    "gingival former": "info",
    "metal band": "info",
    "orthodontic brackets": "info",
    "permanent retainer": "info",
    "post - core": "info",
    "plating": "info",
    "wire": "info",
}


# ─── NMS Post-Processing ─────────────────────────────────────────────
def compute_iou(box1, box2):
    """Compute Intersection over Union between two [x1, y1, x2, y2] boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0


def filter_overlapping_detections(detections, iou_threshold=0.45):
    """
    Remove duplicate bounding boxes for the same class.
    If two detections of the same class overlap with IoU > threshold,
    keep only the one with the highest confidence.
    """
    if not detections:
        return detections

    # Sort by confidence descending
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    filtered = []
    for det in detections:
        should_keep = True
        for kept in filtered:
            # Only suppress if same class
            if det["class"] == kept["class"]:
                iou = compute_iou(det["bbox"], kept["bbox"])
                if iou > iou_threshold:
                    should_keep = False
                    break
        if should_keep:
            filtered.append(det)

    return filtered


# ─── Tooth Numbering (Universal 1-32) ────────────────────────────────
def assign_tooth_number(bbox, img_width, img_height):
    """
    Estimate tooth number (1-32) from bounding box position in a
    panoramic dental X-ray (OPG).

    Layout (Universal Numbering System):
      Upper jaw (top half):  1 (right back) → 16 (left back)
      Lower jaw (bottom half): 17 (left back) → 32 (right back)

    The X-ray mirrors the patient view, so left side of image = patient's right.
    """
    cx = (bbox[0] + bbox[2]) / 2  # center x
    cy = (bbox[1] + bbox[3]) / 2  # center y

    # Determine arch: top half = upper, bottom half = lower
    is_upper = cy < img_height * 0.5

    # Normalize x position (0 = left edge, 1 = right edge)
    x_norm = cx / img_width

    if is_upper:
        # Upper teeth (Right to Left in patient, but 1 to 16 Left to Right in OPG image)
        # Left side of image (x_norm=0) -> Tooth 1
        # Right side of image (x_norm=1) -> Tooth 16
        tooth_num = int(round(1 + x_norm * 15))
        tooth_num = max(1, min(16, tooth_num))
    else:
        # Lower teeth (Left to Right in patient, but 32 to 17 Left to Right in OPG image)
        # Left side of image (x_norm=0) -> Tooth 32
        # Right side of image (x_norm=1) -> Tooth 17
        tooth_num = int(round(32 - x_norm * 15))
        tooth_num = max(17, min(32, tooth_num))

    return tooth_num


@app.route("/api/scan", methods=["POST"])
def scan_xray():
    """Accept an X-ray image, run YOLO inference, return detections."""
    if model is None:
        print("WARNING: Model not loaded. Returning fallback data for UI demonstration.")
        # Return the actual error in the mock response so we can debug it on the UI!
        import time
        time.sleep(1.5)  # Simulate processing delay
        mock_scan_id = str(uuid.uuid4())[:8]
        
        # If there's an error, show it as the ONLY detection
        fallback_class = f"ERROR: {model_error}" if model_error else "ERROR: Unknown model load failure."
        
        return jsonify({
            "scan_id": mock_scan_id,
            "detections": [
                {"class": fallback_class, "confidence": 100.0, "severity": "high", "bbox": [50, 50, 400, 100], "tooth_number": 1}
            ],
            "total_detections": 1,
            "disease_score": 100.0,
            "annotated_image": None,
            "original_image": None
        })

    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    # Save uploaded image
    scan_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    input_filename = f"{scan_id}_input{ext}"
    input_path = os.path.join(RESULTS_DIR, input_filename)
    file.save(input_path)

    # Get image dimensions for tooth numbering
    img = Image.open(input_path)
    img_width, img_height = img.size

    # Run inference
    results = model.predict(
        source=input_path,
        conf=0.25,
        iou=0.45,
        device=0,
        verbose=False,
    )

    result = results[0]

    # Save annotated image
    annotated_filename = f"{scan_id}_annotated.jpg"
    annotated_path = os.path.join(RESULTS_DIR, annotated_filename)
    annotated_img = result.plot()  # numpy array with boxes drawn
    Image.fromarray(annotated_img[..., ::-1]).save(annotated_path, quality=90)

    # Build detections list
    detections = []
    if result.boxes is not None and len(result.boxes) > 0:
        for box in result.boxes:
            cls_idx = int(box.cls[0])
            conf = float(box.conf[0])
            raw_class_name = result.names[cls_idx]
            
            # Normalize class names to Title Case for UI and SEVERITY_MAP compatibility
            # e.g., 'caries' -> 'Caries', 'periapical lesion' -> 'Periapical Lesion' -> wait, SEVERITY_MAP uses 'Periapical lesion'
            # Let's map it explicitly to match SEVERITY_MAP keys
            class_name = raw_class_name.capitalize()
            # Special cases for multi-word classes to match UI and SEVERITY_MAP
            if raw_class_name.lower() == 'root canal treatment': class_name = 'Root Canal Treatment'
            elif raw_class_name.lower() == 'bone loss': class_name = 'Bone loss'
            elif raw_class_name.lower() == 'radiolucent line': class_name = 'Radiolucent line'
            elif raw_class_name.lower() == 'retained root': class_name = 'Retained root'
            elif raw_class_name.lower() == 'periapical lesion': class_name = 'Periapical lesion'

            x, y, x2, y2 = box.xyxy[0].tolist()
            w = x2 - x
            h = y2 - y
            severity = SEVERITY_MAP.get(class_name, "info")

            # Assign tooth number based on bbox position
            tooth_num = assign_tooth_number([x, y, x2, y2], img_width, img_height)

            detections.append({
                "class": class_name,
                "confidence": round(conf * 100, 1),
                "severity": severity,
                "bbox": [round(x, 1), round(y, 1), round(w, 1), round(h, 1)],
                "tooth_number": tooth_num,
            })

    # ── NMS: Remove overlapping duplicate detections ──
    detections = filter_overlapping_detections(detections, iou_threshold=0.45)

    # Sort by confidence descending
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    # Calculate overall disease score (0-100)
    severity_weights = {"high": 1.0, "medium": 0.6, "low": 0.3, "info": 0.1}
    if detections:
        disease_detections = [d for d in detections if d["severity"] in ("high", "medium")]
        if disease_detections:
            weighted_score = sum(
                d["confidence"] * severity_weights[d["severity"]] for d in disease_detections
            ) / len(disease_detections)
            disease_score = min(round(weighted_score, 1), 100)
        else:
            disease_score = 0
    else:
        disease_score = 0

    return jsonify({
        "scan_id": scan_id,
        "detections": detections,
        "total_detections": len(detections),
        "disease_score": disease_score,
        "annotated_image": f"/results/{annotated_filename}",
        "original_image": f"/results/{input_filename}",
    })


@app.route("/results/<filename>")
def serve_result(filename):
    """Serve annotated result images."""
    return send_from_directory(RESULTS_DIR, filename)


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
    })


import sqlite3
import datetime

# ─── Database Setup ───
DATABASE = os.path.join(PROJECT_DIR, "dental_clinic.db")

def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                role TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT,
                age INTEGER,
                gender TEXT,
                phone TEXT,
                last_visit TEXT,
                risk_level INTEGER,
                notes TEXT,
                created_at TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS treatments (
                id TEXT PRIMARY KEY,
                patient_id TEXT,
                type TEXT,
                status TEXT,
                tooth_id TEXT,
                cost REAL,
                date TEXT,
                notes TEXT,
                FOREIGN KEY(patient_id) REFERENCES patients(id)
            )
        """)
        
        # Seed test user
        cursor.execute("INSERT OR IGNORE INTO users (id, name, email, role) VALUES (?, ?, ?, ?)", 
                       ("U-001", "Dr. Sarah Chen", "doctor@clinic.com", "dentist"))
                       
        # Seed dummy data if empty
        cursor.execute("SELECT COUNT(*) FROM patients")
        if cursor.fetchone()[0] == 0:
            now = datetime.datetime.now().isoformat()
            cursor.execute("""
                INSERT INTO patients (id, name, age, gender, phone, last_visit, risk_level, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("PT-2026-001", "Emily Rivera", 28, "Female", "+1 555-0202", "2026-03-08", 18, "Patient reports mild sensitivity in upper left quadrant.", now))
            
            cursor.execute("""
                INSERT INTO patients (id, name, age, gender, phone, last_visit, risk_level, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("PT-2026-002", "Marcus Johnson", 45, "Male", "+1 555-0304", "2025-11-20", 45, "History of periodontitis. Needs deep cleaning.", now))

        conn.commit()

init_db()

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# ─── Auth API ───

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "")
    password = data.get("password", "") # We ignore pure auth check for demo
    
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ? OR email = 'doctor@clinic.com'", (email,)).fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "token": "fake-jwt-token-123",
            "user": {
                "id": dict(user)["id"],
                "name": dict(user)["name"],
                "email": dict(user)["email"],
                "clinicName": "Bright Smile Dental"
            }
        })
    return jsonify({"error": "Invalid credentials"}), 401


# ─── Patients API ───

@app.route("/api/patients", methods=["GET"])
def get_patients():
    conn = get_db_connection()
    patients = conn.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()
    
    result = []
    for p in patients:
        p_dict = dict(p)
        # Fetch treatments
        treatments = conn.execute("SELECT * FROM treatments WHERE patient_id = ?", (p_dict["id"],)).fetchall()
        p_dict["treatments"] = [dict(t) for t in treatments]
        result.append(p_dict)
        
    conn.close()
    return jsonify({"patients": result})


@app.route("/api/patients/<patient_id>", methods=["GET"])
def get_patient(patient_id):
    conn = get_db_connection()
    patient = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        conn.close()
        return jsonify({"error": "Patient not found"}), 404
        
    p_dict = dict(patient)
    treatments = conn.execute("SELECT * FROM treatments WHERE patient_id = ?", (patient_id,)).fetchall()
    p_dict["treatments"] = [dict(t) for t in treatments]
    
    conn.close()
    return jsonify(p_dict)


@app.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.json
    patient_id = data.get("id", f"PT-2026-{str(uuid.uuid4())[:4]}")
    now = datetime.datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO patients (id, name, age, gender, phone, last_visit, risk_level, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        data.get("name", "New Patient"),
        data.get("age", 30),
        data.get("gender", "Unknown"),
        data.get("phone", ""),
        data.get("last_visit", ""),
        data.get("risk_level", 0),
        data.get("notes", ""),
        now
    ))
    conn.commit()
    conn.close()
    
    return jsonify({"id": patient_id, "status": "success"}), 201


@app.route("/api/patients/<patient_id>", methods=["PUT"])
def update_patient(patient_id):
    data = request.json
    conn = get_db_connection()
    
    if "notes" in data:
        conn.execute("UPDATE patients SET notes = ? WHERE id = ?", (data["notes"], patient_id))
    
    # Simple sync: if treatments list is provided, replace all
    if "treatments" in data:
        conn.execute("DELETE FROM treatments WHERE patient_id = ?", (patient_id,))
        for t in data["treatments"]:
            conn.execute("""
                INSERT INTO treatments (id, patient_id, type, status, tooth_id, cost, date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                t.get("id", str(uuid.uuid4())),
                patient_id,
                t.get("type", ""),
                t.get("status", "planned"),
                t.get("toothId", ""),
                t.get("cost", 0.0),
                t.get("date", datetime.datetime.now().isoformat()),
                t.get("notes", "")
            ))
            
    conn.commit()
    conn.close()
    return jsonify({"status": "updated"})


if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("  Dental Disease Detection API Server")
    print("  http://localhost:5000")
    print("=" * 50 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
