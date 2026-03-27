from flask import Flask, jsonify, request, send_from_directory
import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "applications.json")
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

STATUS_OPTIONS = ["Applied", "Phone Screen", "Technical Interview", "Offer", "Rejected"]


def load_applications():
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_applications(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_next_id(applications):
    if not applications:
        return 1
    return max(item.get("id", 0) for item in applications) + 1


def parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date().isoformat()
    except ValueError:
        return None


@app.route("/api/applications", methods=["GET"])
def list_applications():
    applications = load_applications()
    return jsonify(applications)


@app.route("/api/applications", methods=["POST"])
def create_application():
    payload = request.get_json() or {}
    applications = load_applications()
    new_app = {
        "id": get_next_id(applications),
        "company": payload.get("company", "").strip(),
        "position": payload.get("position", "").strip(),
        "status": payload.get("status", "Applied"),
        "appliedDate": parse_date(payload.get("appliedDate")) or datetime.today().date().isoformat(),
        "deadline": parse_date(payload.get("deadline")) or None,
        "interviewScore": payload.get("interviewScore") or 0,
        "notes": payload.get("notes", "").strip(),
        "lastUpdated": datetime.utcnow().isoformat() + "Z"
    }
    applications.insert(0, new_app)
    save_applications(applications)
    return jsonify(new_app), 201


@app.route("/api/applications/<int:application_id>", methods=["PUT"])
def update_application(application_id):
    payload = request.get_json() or {}
    applications = load_applications()
    for item in applications:
        if item.get("id") == application_id:
            item["company"] = payload.get("company", item["company"]).strip()
            item["position"] = payload.get("position", item["position"]).strip()
            item["status"] = payload.get("status", item["status"])
            item["appliedDate"] = parse_date(payload.get("appliedDate")) or item["appliedDate"]
            item["deadline"] = parse_date(payload.get("deadline")) or item["deadline"]
            item["interviewScore"] = payload.get("interviewScore", item["interviewScore"])
            item["notes"] = payload.get("notes", item["notes"]).strip()
            item["lastUpdated"] = datetime.utcnow().isoformat() + "Z"
            save_applications(applications)
            return jsonify(item)
    return jsonify({"error": "Application not found"}), 404


@app.route("/api/applications/<int:application_id>", methods=["DELETE"])
def delete_application(application_id):
    applications = load_applications()
    updated = [item for item in applications if item.get("id") != application_id]
    if len(updated) == len(applications):
        return jsonify({"error": "Application not found"}), 404
    save_applications(updated)
    return jsonify({"success": True})


@app.route("/api/analytics", methods=["GET"])
def analytics():
    applications = load_applications()
    total = len(applications)
    status_counts = {status: 0 for status in STATUS_OPTIONS}
    interview_scores = [item.get("interviewScore", 0) for item in applications if item.get("interviewScore") is not None]
    upcoming = []
    today = datetime.today().date()

    for item in applications:
        status_counts[item.get("status", "Applied")] = status_counts.get(item.get("status", "Applied"), 0) + 1
        deadline = item.get("deadline")
        if deadline:
            try:
                deadline_date = datetime.fromisoformat(deadline).date()
                days_left = (deadline_date - today).days
                if days_left >= 0 and days_left <= 14:
                    upcoming.append({
                        "company": item.get("company"),
                        "position": item.get("position"),
                        "deadline": deadline,
                        "daysLeft": days_left
                    })
            except ValueError:
                pass

    average_score = round(sum(interview_scores) / len(interview_scores), 1) if interview_scores else 0
    offers = status_counts.get("Offer", 0)
    interviews = status_counts.get("Technical Interview", 0) + status_counts.get("Phone Screen", 0)

    return jsonify({
        "totalApplications": total,
        "statusCounts": status_counts,
        "averageInterviewScore": average_score,
        "offers": offers,
        "activeInterviews": interviews,
        "upcomingDeadlines": sorted(upcoming, key=lambda x: x["daysLeft"])[:5]
    })


@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


if __name__ == "__main__":
    app.run(debug=True, port=5000)
