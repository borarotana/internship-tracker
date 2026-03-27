# Internship Tracker

Internship Tracker is a modern full-stack web application designed to help students manage internship applications, track deadlines, evaluate interview performance, and view progress analytics.

## Features

- Add and manage internship applications
- Track application status and deadlines
- Record interview scores and notes
- View progress analytics with status counts and average scores
- Edit and delete application entries

## Tech stack

- Backend: Python + Flask
- Frontend: HTML, CSS, JavaScript
- Persistence: JSON file storage for demo purposes

## Run locally

1. Open a terminal and navigate to the project folder:
   ```bash
   cd "c:\Users\BORA ROTANA\OneDrive\文件\WEB DEV\InternshipTracker"
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r backend\requirements.txt
   ```

4. Run the backend server:
   ```bash
   python backend\app.py
   ```

5. Open your browser at `http://127.0.0.1:5000`

## API

- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/<id>`
- `DELETE /api/applications/<id>`
- `GET /api/analytics`
