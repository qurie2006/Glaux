# 🦉 Glaux — Explainable AI Recruiter Platform

> **Precision, Bias-Free, and Explainable Candidate Evaluation Platform**  
> Powered by an 11-Factor Mathematical Scoring Matrix, Grounded RAG, and Interactive Cohort Intelligence.

---

## 🌟 Overview

**Glaux** is an AI-powered talent intelligence and candidate evaluation platform designed to eliminate black-box hiring decisions. By combining dense semantic vector embeddings (`all-MiniLM-L6-v2`), BM25 lexical token matching, regex-based metric quantification, and grounded Retrieval-Augmented Generation (RAG), Glaux transforms resume screening into an objective, explainable, and multi-dimensional evaluation process.

Every candidate score is mathematically substantiated with line-level evidence citations, career progression timelines, cohort percentiles, and head-to-head comparison differentials.

---

## 🚀 Key Features

- 🏆 **11-Factor Mathematical Scoring Engine**: Deterministic weighted evaluation matrix combining semantic similarity, mandatory must-haves, quantifiable metrics, link validation, and structural scoring.
- 🥇 **Dynamic Top 3 Executive Dossier**: Automated synthesis of top-ranked candidates with comparative scorecards, differentiator highlights, and multi-tier cohort gap analysis for any uploaded candidate pool.
- ⚖️ **Head-to-Head Candidate Comparison**: Side-by-side radar charts, factor-by-factor differentials ($S_A - S_B$), and conversational comparison summaries.
- 📊 **Cohort Analytics & Distribution Graphs**: 11-factor horizontal bar charts against pool averages, cohort tier distributions, and percentile rankings.
- 📈 **Career Progression & Growth Timeline**: Chronological milestone visualizers tracking company tenure, seniority progression, and role-relevant skill acquisition.
- 🤖 **Grounded Recruiter Copilot (RAG)**: Zero-hallucination conversational assistant backed by Ollama (Llama 3) and grounded heuristic fallback that answers nuanced recruiter queries with direct resume citations.
- 🛡️ **Job Description Bias & Inclusivity Auditor**: Real-time lexical analysis detecting masculine-coded language, unnecessary barriers, and bias indicators, complete with actionable recommendations.
- 📄 **Universal Document Ingestion**: Seamless ingestion and parsing of PDF and text Job Descriptions as well as batch multi-resume PDF uploads.
- 📑 **Interactive A4 Resume & Dossier Viewer**: Embedded PDF preview and structured dossier viewer with verified links (GitHub, LinkedIn, Portfolio) and extracted evidence snippets.

---

## 📐 11-Factor Evaluation Rubric

Glaux calculates a composite candidate score ($S_{\text{final}} \in [0, 100]$) using the following weighted distribution:

| Rubric Dimension | Weight | Mathematical Methodology |
| :--- | :---: | :--- |
| **1. Semantic Similarity** | **20.0%** | Dense cosine similarity using `all-MiniLM-L6-v2` 384-dimensional embeddings against the Job Description. |
| **2. Must-Have Mandatory Skills** | **15.0%** | Exact and fuzzy capability verification against non-negotiable role requirements. |
| **3. Lexical Keyword Match (BM25)** | **15.0%** | BM25 probabilistic token matching across resume sections and technical terminologies. |
| **4. Quantifiable Business Impact** | **12.0%** | Regex-driven detection of verified metrics ($\Delta\%$, latencies in $ms$, $\$$, user scale, database sizes). |
| **5. Grounded RAG Citation Evidence**| **10.0%** | Contextual textual depth demonstrating active implementation over passive keyword listing. |
| **6. Career Progression & Stability** | **6.0%** | Seniority trajectory (Intern $\rightarrow$ Junior $\rightarrow$ Senior), role growth, and tenure continuity. |
| **7. Skills Matrix & Toolchain Breadth**| **6.0%** | Coverage of secondary and nice-to-have engineering tools (Docker, AWS, Tailwind, Redis, etc.). |
| **8. AI Authenticity & Originality** | **5.0%** | Stylistic analysis detecting synthetic AI-generated resumes and boilerplate repetition. |
| **9. Verifiable Links & Portfolios** | **5.0%** | Verification and extraction of GitHub repositories, live LinkedIn profiles, and portfolios. |
| **10. Resume Structure & Formatting** | **3.0%** | Section hierarchy, header cleanliness, typographical balance, and document readability. |
| **11. Contextual Co-occurrence** | **3.0%** | Domain adjacency scoring (e.g., React with State Management, Node.js with SQL/NoSQL). |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS Design System, Lucide Icons
- **Backend API**: FastAPI (Python 3.11), Uvicorn, Pydantic v2
- **Data Persistence**: SQLAlchemy 2.0 ORM, PostgreSQL 16 (with SQLite local fallback)
- **Vector & NLP**: SentenceTransformers (`all-MiniLM-L6-v2`), PyTorch, Scikit-Learn
- **Document Parsers**: PyPDF2, pdfplumber, python-docx, RegExp Tokenizers
- **Generative XAI**: Ollama LLM Bridge (Llama 3) with deterministic grounded fallback
- **Containerization & Cloud**: Docker, Docker Compose, Kubernetes manifests (`k8s/`)

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### Option A: One-Click Startup (Windows)
Simply double-click or run:
```cmd
start.bat
```
This automatically boots the FastAPI backend on `http://localhost:8000`, the Vite frontend on `http://localhost:5173`, and opens your default browser.

---

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API will run at `http://localhost:8000` (Docs at `http://localhost:8000/docs`).*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend application will run at `http://localhost:5173`.*

---

## 🐳 Docker & Kubernetes Deployment

### Docker Compose
Run the entire platform (PostgreSQL, Backend, Frontend) with a single command:
```bash
docker-compose up --build
```

### Kubernetes (K8s)
Deploy to any Kubernetes cluster:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

---

## 📂 Project Structure

```
Glaux/
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy & Pydantic schemas
│   │   ├── services/         # Scoring, parser, RAG, comparison engines
│   │   ├── config.py         # App configuration & environment settings
│   │   ├── database.py       # DB engine & session management
│   │   └── main.py           # FastAPI application endpoints
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container definition
├── frontend/
│   ├── src/
│   │   ├── assets/           # Platform logos & media
│   │   ├── App.jsx           # Main recruiter dashboard & reactive views
│   │   ├── api.js            # Axios client & backend bridge
│   │   ├── index.css         # Custom design system & animations
│   │   └── main.jsx          # React DOM entry point
│   ├── nginx.conf            # Production Nginx configuration
│   ├── package.json          # Node dependencies
│   └── Dockerfile            # Frontend container definition
├── k8s/                      # Kubernetes deployment & service manifests
├── docker-compose.yml        # Multi-container orchestration
├── start.bat                 # One-click Windows launch script
├── REPORT.md                 # 2-page detailed technical evaluation report
└── README.md                 # Platform documentation
```

---

## 📄 License
This project is licensed under the MIT License.
