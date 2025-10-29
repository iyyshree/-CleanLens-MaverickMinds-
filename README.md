CleanLens — MaverickMinds Smart Waste Classification WebApp CleanLens is an AI-powered waste classification web application developed by MaverickMinds. It allows users to capture or upload waste images and automatically classifies them into categories such as Plastic, Organic, Metal, or Paper. The app also includes a leaderboard system that rewards users who submit the most reports, promoting eco-friendly awareness and participation.

Overview: The project aims to assist in smart waste management by combining machine learning and a user-friendly web interface. When users upload or capture an image, the Python backend analyzes it using trained models and classifies the waste type. The classification results are then displayed on the frontend dashboard, along with user rankings and report analytics.

Features: Capture or upload waste images directly from your device AI-based waste classification (Plastic, Organic, etc.)
Leaderboard displaying top contributors Admin dashboard for managing user data and reports MongoDB integration for data storage Node.js backend handling APIs and authentication Python microservice handling machine learning model inference

Folder Structure: CleanLens-MaverickMinds/ │ ├── admin-dashboard/ # Frontend (HTML, CSS, JS) │ ├── index.html │ ├── app.js │ └── styles.css │ ├── backend/ # Node.js backend │ ├── src/ │ │ ├── index.js │ │ └── routes/ │ │ └── reports.js │ ├── package.json │ └── python-backend/ # Python microservice for classification │ ├── app/ │ │ ├── main.py │ │ ├── store.py │ │ ├── store_mongo.py │ │ ├── schemas.py │ │ └── pycache/ │ └── requirements.txt │ └── README.md

Developer Setup: Prerequisites Ensure the following are installed on your system: Node.js (v16 or above) Python (v3.10 or above) MongoDB (running locally or on Atlas) Git

Contact: Team MaverickMinds For questions or feedback, please create an issue or contact us via email.
