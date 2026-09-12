import os
import re
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, get_db, Base
from app.models.database import JobDescription, Candidate, Evaluation
from app.models.schemas import CompareRequest, CompareResponse
from app.services.parser import ResumeParser
from app.services.jd_analyzer import JDAnalyzer
from app.services.scoring_engine import ScoringEngine
from app.services.comparison import CandidateComparator
from app.services.rag_engine import RAGEngine
from app.services.pdf_generator import generate_candidate_pdf
from app.config import DEFAULT_WEIGHTS

UPLOAD_RESUMES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "resumes"))
os.makedirs(UPLOAD_RESUMES_DIR, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Glaux - Intelligent Shortlisting Engine",
    description="Explainable 11-Factor Resume Evaluation & Matching Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "engine": "Glaux Shortlisting Engine",
        "weights": DEFAULT_WEIGHTS
    }

@app.get("/api/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobDescription).order_by(JobDescription.created_at.desc()).all()
    res = []
    for j in jobs:
        cnt = db.query(Evaluation).filter(Evaluation.job_id == j.id).count()
        res.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "candidate_count": cnt,
            "created_at": j.created_at.isoformat() if j.created_at else ""
        })
    return res

@app.post("/api/jobs/parse-jd-file")
async def parse_jd_file(file: UploadFile = File(...)):
    """Extracts text and key specifications from an uploaded Job Description document (PDF, DOCX, TXT)."""
    content = await file.read()
    filename = file.filename or "job_description.pdf"
    raw_text = ResumeParser.extract_text(content, filename)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded JD file.")

    analysis = JDAnalyzer.analyze_jd(raw_text)
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    guessed_title = "Junior Full Stack Developer Intern"
    guessed_company = "TechNova Solutions"

    for l in lines[:8]:
        if re.search(r'(?i)\b(job\s+title|role|position)\b', l):
            cleaned = re.sub(r'(?i)^.*?\b(job\s+title|role|position)\s*[:\-]\s*', '', l).strip()
            if cleaned and len(cleaned) < 60:
                guessed_title = cleaned
        elif re.search(r'(?i)\b(company|organization|employer)\b', l):
            cleaned = re.sub(r'(?i)^.*?\b(company|organization|employer)\s*[:\-]\s*', '', l).strip()
            if cleaned and len(cleaned) < 50:
                guessed_company = cleaned

    return {
        "filename": filename,
        "title": guessed_title,
        "company": guessed_company,
        "raw_text": raw_text,
        "must_haves": analysis["must_haves"],
        "nice_to_haves": analysis["nice_to_haves"],
        "bias_analysis": analysis["bias_analysis"]
    }

@app.post("/api/jobs")
async def create_job(
    title: str = Form("Junior Full Stack Developer Intern"),
    company: str = Form("TechNova Solutions"),
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    final_text = (jd_text or "").strip()
    if jd_file and (not final_text or len(final_text) < 15):
        content = await jd_file.read()
        final_text = ResumeParser.extract_text(content, jd_file.filename or "jd.pdf")

    if not final_text:
        raise HTTPException(status_code=400, detail="Job description text or a valid JD PDF/DOCX file is required.")

    analysis = JDAnalyzer.analyze_jd(final_text)

    job = JobDescription(
        title=title,
        company=company,
        raw_text=final_text,
        must_have_skills=analysis["must_haves"],
        nice_to_have_skills=analysis["nice_to_haves"],
        bias_analysis=analysis["bias_analysis"]
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "raw_text": job.raw_text,
        "must_have_skills": job.must_have_skills,
        "nice_to_have_skills": job.nice_to_have_skills,
        "bias_analysis": job.bias_analysis
    }

@app.get("/api/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    evals = (
        db.query(Evaluation)
        .filter(Evaluation.job_id == job_id)
        .order_by(Evaluation.final_score.desc())
        .all()
    )

    total_count = len(evals)
    pool_scores = [e.final_score for e in evals]
    pool_avg = round(sum(pool_scores) / max(1, total_count), 1) if pool_scores else 0.0
    sorted_scores = sorted(pool_scores)
    pool_median = round(sorted_scores[total_count // 2], 1) if sorted_scores else 0.0
    pool_must_avg = round(sum([e.score_must_have for e in evals]) / max(1, total_count), 1) if evals else 0.0
    pool_semantic_avg = round(sum([e.score_semantic for e in evals]) / max(1, total_count), 1) if evals else 0.0

    eval_list = []
    for idx, e in enumerate(evals, 1):
        cand = db.query(Candidate).filter(Candidate.id == e.candidate_id).first()
        resume_raw = cand.raw_text if cand else ""
        percentile = max(5, min(99, round(((total_count - idx + 0.8) / max(1, total_count)) * 100)))
        career_prog = ResumeParser.extract_career_progression(
            resume_text=resume_raw,
            must_haves=job.must_have_skills or [],
            nice_to_haves=job.nice_to_have_skills or []
        )

        cohort_analytics = {
            "percentile": percentile,
            "rank": idx,
            "total_candidates": total_count,
            "pool_avg_score": pool_avg,
            "pool_median_score": pool_median,
            "diff_from_avg": round(e.final_score - pool_avg, 1),
            "diff_from_median": round(e.final_score - pool_median, 1),
            "must_have_diff": round(e.score_must_have - pool_must_avg, 1),
            "semantic_diff": round(e.score_semantic - pool_semantic_avg, 1),
            "pool_must_avg": pool_must_avg,
            "pool_semantic_avg": pool_semantic_avg,
            "tier_label": (
                "Top 2% Elite Match" if idx == 1 else
                "Top 5% Outstanding" if idx <= 3 else
                "Upper Quartile (Top 25%)" if idx <= max(4, total_count // 4) else
                "Median Applicant Pool" if idx <= total_count // 2 else
                "Lower Quartile / Adjacent" if idx <= (total_count * 3) // 4 else
                "Low Fit / Non-Technical"
            ),
            "recruiter_recommendation": (
                "Immediate Interview Recommended" if e.final_score >= 85 else
                "High Priority Contender" if e.final_score >= 75 else
                "Secondary Pool Review" if e.final_score >= 60 else
                "Skills Mismatch / Not Recommended"
            )
        }

        eval_list.append({
            "id": e.id,
            "candidate_id": e.candidate_id,
            "candidate_name": cand.name if cand else "Unknown",
            "candidate_email": cand.email if cand else "",
            "candidate_links": cand.detected_links if cand else [],
            "candidate_resume_text": resume_raw,
            "rank": idx,
            "final_score": e.final_score,
            "scores": {
                "semantic_similarity": e.score_semantic,
                "keyword_match": e.score_keyword,
                "must_have_match": e.score_must_have,
                "quantification_score": e.score_quantification,
                "ai_authenticity": e.score_ai_authenticity,
                "rag_evidence": e.score_rag_evidence,
                "link_verification": e.score_link_verify,
                "career_progression": e.score_career_prog,
                "skills_matrix": e.score_skills_matrix,
                "structure_quality": e.score_structure,
                "contextual_keywords": e.score_contextual,
            },
            "explanation": e.explanation,
            "skills_matched": e.skills_matched,
            "skills_missing": e.skills_missing,
            "evidence_snippets": e.evidence_snippets or [],
            "career_progression_timeline": career_prog,
            "cohort_analytics": cohort_analytics
        })

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "raw_text": job.raw_text,
        "must_have_skills": job.must_have_skills,
        "nice_to_have_skills": job.nice_to_have_skills,
        "bias_analysis": job.bias_analysis,
        "candidate_count": len(eval_list),
        "candidates": eval_list,
        "pool_stats": {
            "total_candidates": total_count,
            "avg_score": pool_avg,
            "median_score": pool_median,
            "must_have_avg": pool_must_avg,
            "semantic_avg": pool_semantic_avg
        }
    }


@app.post("/api/jobs/{job_id}/upload-resumes")
async def upload_resumes(
    job_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    new_evaluations = []

    for file in files:
        content = await file.read()
        filename = file.filename or "resume.pdf"
        raw_text = ResumeParser.extract_text(content, filename)

        if not raw_text.strip():
            continue

        name = ResumeParser.extract_name(raw_text, filename)
        contact = ResumeParser.extract_contact_info(raw_text)
        sections = ResumeParser.extract_sections(raw_text)

        candidate = Candidate(
            name=name,
            email=contact.get("email", ""),
            phone=contact.get("phone", ""),
            raw_text=raw_text,
            detected_links=contact.get("links", [])
        )
        db.add(candidate)
        db.flush()
        if filename.lower().endswith(".pdf") or content.startswith(b"%PDF"):
            uploaded_pdf_path = os.path.join(UPLOAD_RESUMES_DIR, f"{candidate.id}.pdf")
            try:
                with open(uploaded_pdf_path, "wb") as f_out:
                    f_out.write(content)
            except Exception as e:
                print(f"Notice: could not save uploaded pdf file: {e}")

        scoring = ScoringEngine.calculate_all_scores(
            jd_text=job.raw_text,
            resume_text=raw_text,
            must_haves=job.must_have_skills or [],
            nice_to_haves=job.nice_to_have_skills or [],
            sections=sections,
            contact_info=contact
        )

        scores = scoring["scores"]
        
        explanation = (
            f"Demonstrates strong coverage in {', '.join(scoring['skills_matched'][:4]) or 'core technical concepts'}. "
            f"Quantification score: {scores['quantification_score']}/100 with {scores['must_have_match']}% must-have match. "
            f"Missing explicit verification for: {', '.join(scoring['skills_missing'][:3]) or 'None'}."
        )

        evaluation = Evaluation(
            job_id=job.id,
            candidate_id=candidate.id,
            score_semantic=scores["semantic_similarity"],
            score_keyword=scores["keyword_match"],
            score_must_have=scores["must_have_match"],
            score_quantification=scores["quantification_score"],
            score_ai_authenticity=scores["ai_authenticity"],
            score_rag_evidence=scores["rag_evidence"],
            score_link_verify=scores["link_verification"],
            score_career_prog=scores["career_progression"],
            score_skills_matrix=scores["skills_matrix"],
            score_structure=scores["structure_quality"],
            score_contextual=scores["contextual_keywords"],
            final_score=scoring["final_score"],
            explanation=explanation,
            skills_matched=scoring["skills_matched"],
            skills_missing=scoring["skills_missing"],
            evidence_snippets=scoring["evidence_snippets"]
        )
        db.add(evaluation)
        new_evaluations.append(evaluation)

    db.commit()
    return {"status": "success", "processed_count": len(new_evaluations)}

@app.get("/api/resumes/{candidate_id}/pdf")
@app.get("/api/candidates/{candidate_id}/pdf")
def get_candidate_pdf(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    original_pdf_path = os.path.join(UPLOAD_RESUMES_DIR, f"{candidate_id}.pdf")
    clean_filename = f"{candidate.name.replace(' ', '_')}_Resume.pdf"
    if os.path.exists(original_pdf_path):
        return FileResponse(
            path=original_pdf_path,
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{clean_filename}"'}
        )
    evaluation = db.query(Evaluation).filter(Evaluation.candidate_id == candidate_id).first()
    pdf_bytes = generate_candidate_pdf(candidate, evaluation)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{clean_filename}"',
            "Content-Type": "application/pdf"
        }
    )

@app.post("/api/compare")
def compare_candidates(req: CompareRequest, db: Session = Depends(get_db)):
    eval_a = db.query(Evaluation).filter(Evaluation.job_id == req.job_id, Evaluation.candidate_id == req.candidate_a_id).first()
    eval_b = db.query(Evaluation).filter(Evaluation.job_id == req.job_id, Evaluation.candidate_id == req.candidate_b_id).first()

    if not eval_a or not eval_b:
        raise HTTPException(status_code=404, detail="Candidate evaluations not found for comparison")

    cand_a = db.query(Candidate).filter(Candidate.id == req.candidate_a_id).first()
    cand_b = db.query(Candidate).filter(Candidate.id == req.candidate_b_id).first()

    cand_a_dict = {
        "name": cand_a.name if cand_a else "Candidate A",
        "rank": eval_a.rank or 1,
        "final_score": eval_a.final_score,
        "skills_matched": eval_a.skills_matched or [],
        "skills_missing": eval_a.skills_missing or [],
        "candidate_links": cand_a.detected_links if cand_a else [],
        "evidence_snippets": eval_a.evidence_snippets or [],
        "scores": {
            "semantic_similarity": eval_a.score_semantic,
            "keyword_match": eval_a.score_keyword,
            "must_have_match": eval_a.score_must_have,
            "quantification_score": eval_a.score_quantification,
            "ai_authenticity": eval_a.score_ai_authenticity,
            "rag_evidence": eval_a.score_rag_evidence,
            "link_verification": eval_a.score_link_verify,
            "career_progression": eval_a.score_career_prog,
            "skills_matrix": eval_a.score_skills_matrix,
            "structure_quality": eval_a.score_structure,
            "contextual_keywords": eval_a.score_contextual
        }
    }

    cand_b_dict = {
        "name": cand_b.name if cand_b else "Candidate B",
        "rank": eval_b.rank or 2,
        "final_score": eval_b.final_score,
        "skills_matched": eval_b.skills_matched or [],
        "skills_missing": eval_b.skills_missing or [],
        "candidate_links": cand_b.detected_links if cand_b else [],
        "evidence_snippets": eval_b.evidence_snippets or [],
        "scores": {
            "semantic_similarity": eval_b.score_semantic,
            "keyword_match": eval_b.score_keyword,
            "must_have_match": eval_b.score_must_have,
            "quantification_score": eval_b.score_quantification,
            "ai_authenticity": eval_b.score_ai_authenticity,
            "rag_evidence": eval_b.score_rag_evidence,
            "link_verification": eval_b.score_link_verify,
            "career_progression": eval_b.score_career_prog,
            "skills_matrix": eval_b.score_skills_matrix,
            "structure_quality": eval_b.score_structure,
            "contextual_keywords": eval_b.score_contextual
        }
    }

    return CandidateComparator.compare_candidates(cand_a_dict, cand_b_dict)

@app.post("/api/rag/ask")
async def ask_rag(
    job_id: str = Form(...),
    query: str = Form(...),
    db: Session = Depends(get_db)
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    evals = db.query(Evaluation).filter(Evaluation.job_id == job_id).order_by(Evaluation.final_score.desc()).all()
    candidates_context = []
    for idx, e in enumerate(evals, 1):
        cand = db.query(Candidate).filter(Candidate.id == e.candidate_id).first()
        candidates_context.append({
            "name": cand.name if cand else "Candidate",
            "rank": idx,
            "final_score": e.final_score,
            "explanation": e.explanation,
            "candidate_links": cand.detected_links if cand else [],
            "scores": {
                "semantic_similarity": e.score_semantic,
                "keyword_match": e.score_keyword,
                "must_have_match": e.score_must_have,
                "quantification_score": e.score_quantification,
                "ai_authenticity": e.score_ai_authenticity,
                "contextual_keywords": e.score_contextual,
                "link_verification": e.score_link_verify
            },
            "skills_matched": e.skills_matched or [],
            "skills_missing": e.skills_missing or []
        })

    jd_info = {
        "title": job.title,
        "company": job.company,
        "must_haves": job.must_have_skills or [],
        "nice_to_haves": job.nice_to_have_skills or []
    }

    answer = await RAGEngine.ask_recruiter_agent(query, candidates_context, jd_info)
    return {"query": query, "answer": answer}

@app.post("/api/seed-full-dataset")
def seed_full_dataset(db: Session = Depends(get_db)):
    db.query(Evaluation).delete()
    db.query(Candidate).delete()
    db.query(JobDescription).delete()
    db.commit()

    sample_jd_text = """Job Title: Junior Full Stack Developer Intern
Company: TechNova Solutions
Location: Remote / Hybrid

About Us:
TechNova Solutions builds scalable cloud-native web applications for modern enterprises. We are seeking a passionate, high-energy Junior Full Stack Developer Intern to join our core product engineering team.

Required Qualifications (Must-Have):
- Strong proficiency in JavaScript / TypeScript and modern frontend frameworks (React.js preferred).
- Hands-on experience building backend RESTful APIs using Node.js and Express.
- Solid foundational understanding of relational or document databases (MongoDB, PostgreSQL).
- Familiarity with version control using Git and GitHub workflows.
- Ability to write clean, modular, and testable code with good error handling.

Preferred Qualifications (Nice-to-Have):
- Experience with containerization technologies such as Docker.
- Basic understanding of CI/CD pipelines and cloud deployments (AWS, GCP).
- Familiarity with state management libraries like Redux or modern CSS frameworks like Tailwind.
- Open-source contributions or demonstrable deployed personal projects.

Responsibilities:
- Collaborate with senior engineers to implement responsive UI components and backend endpoints.
- Optimize database queries and API response latencies.
- Actively participate in sprint ceremonies, code reviews, and architectural discussions.
"""

    analysis = JDAnalyzer.analyze_jd(sample_jd_text)
    
    job = JobDescription(
        title="Junior Full Stack Developer Intern",
        company="TechNova Solutions",
        raw_text=sample_jd_text,
        must_have_skills=analysis["must_haves"],
        nice_to_have_skills=analysis["nice_to_haves"],
        bias_analysis=analysis["bias_analysis"]
    )
    db.add(job)
    db.flush()
    candidates_data = [
        {
            "name": "Sarah Chen",
            "email": "sarah.chen@cs.edu",
            "links": ["https://github.com/sarahchen-dev", "https://linkedin.com/in/sarahchen", "https://sarahchen.io"],
            "resume_text": "Education: BS Computer Science (2024)\nExperience: Full Stack Intern at CloudScale. Built REST APIs in Node.js/Express, deployed PostgreSQL database handling 10k daily requests. Reduced latency by 35%.\nProjects: E-Commerce MERN App with React, Express, MongoDB. Dockerized with CI/CD GitHub Actions.\nSkills: React, Node.js, Express, MongoDB, PostgreSQL, Docker, Git, TypeScript, REST API.",
            "scores": {"semantic_similarity": 92.5, "keyword_match": 91.0, "must_have_match": 100.0, "quantification_score": 92.5, "ai_authenticity": 88.0, "rag_evidence": 88.0, "link_verification": 98.0, "career_progression": 82.0, "skills_matrix": 90.0, "structure_quality": 95.0, "contextual_keywords": 90.0},
            "matched": ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git", "typescript", "rest api"],
            "missing": ["aws"],
            "summary": "Outstanding full-stack fit with 100% must-have coverage and proven 35% latency reduction metrics."
        },
        {
            "name": "Ananya Subramanian",
            "email": "ananya.subramanian@techmail.org",
            "links": ["https://github.com/ananya-sub", "https://linkedin.com/in/ananya-sub"],
            "resume_text": "Full Stack & AI Developer. Developed React frontend and FastAPI/Express backend. Integrated PostgreSQL and MongoDB. Containerized 4 microservices with Docker.\nMetrics: Scaled user base to 5,000+ active users, improved query speeds by 28%.\nSkills: JavaScript, TypeScript, React, Express, Node.js, PostgreSQL, Docker, Git.",
            "scores": {"semantic_similarity": 90.0, "keyword_match": 88.0, "must_have_match": 95.0, "quantification_score": 88.0, "ai_authenticity": 86.0, "rag_evidence": 85.0, "link_verification": 95.0, "career_progression": 78.0, "skills_matrix": 88.0, "structure_quality": 92.0, "contextual_keywords": 87.0},
            "matched": ["react", "node.js", "express", "postgresql", "docker", "typescript", "git"],
            "missing": ["mongodb"],
            "summary": "High-caliber developer with TypeScript, Docker, and demonstrated 5,000+ user scalability metrics."
        },
        {
            "name": "Rohan Mehta",
            "email": "rohan.mehta@devlabs.io",
            "links": ["https://github.com/rohanm-code", "https://linkedin.com/in/rohanmehta"],
            "resume_text": "Software Engineer Intern. Implemented backend microservices using Node.js, Express, MongoDB. Built React dashboard with responsive UI. Automated unit tests with Jest.\nMetrics: Cut API response time by 40ms, managed 1.2M records database.\nSkills: Node.js, Express, React, MongoDB, Git, REST API, Jest.",
            "scores": {"semantic_similarity": 89.0, "keyword_match": 87.0, "must_have_match": 95.0, "quantification_score": 85.0, "ai_authenticity": 85.0, "rag_evidence": 84.0, "link_verification": 92.0, "career_progression": 76.0, "skills_matrix": 85.0, "structure_quality": 90.0, "contextual_keywords": 86.0},
            "matched": ["node.js", "express", "react", "mongodb", "git", "rest api"],
            "missing": ["docker", "postgresql"],
            "summary": "Proven backend and API mastery with measurable query optimizations and clean React component hierarchy."
        },
        {
            "name": "Arjun Desai",
            "email": "arjun.desai@cs.univ.edu",
            "links": ["https://github.com/arjundesai", "https://linkedin.com/in/arjundesai"],
            "resume_text": "Software Engineering Student. Built full-stack collaborative editor using React, Node.js, Express, WebSockets, PostgreSQL. Maintained 99.8% uptime on personal AWS instance.\nSkills: React, Node.js, Express, PostgreSQL, Git, AWS, Docker.",
            "scores": {"semantic_similarity": 87.5, "keyword_match": 85.0, "must_have_match": 90.0, "quantification_score": 82.0, "ai_authenticity": 84.0, "rag_evidence": 82.0, "link_verification": 90.0, "career_progression": 75.0, "skills_matrix": 84.0, "structure_quality": 88.0, "contextual_keywords": 84.0},
            "matched": ["react", "node.js", "express", "postgresql", "docker", "git", "aws"],
            "missing": ["mongodb"],
            "summary": "Versatile engineer with deployed AWS projects and solid understanding of full-stack data flow."
        },
        {
            "name": "Sneha Iyer",
            "email": "sneha.iyer@eng.in",
            "links": ["https://github.com/snehaiyer", "https://linkedin.com/in/snehaiyer"],
            "resume_text": "SDE Intern. Engineered scalable REST APIs using Express and Node.js. Designed MongoDB schema for fast lookups. Built React UI components.\nMetrics: 95% test coverage, refactored 20+ legacy endpoints.\nSkills: JavaScript, Node.js, Express, React, MongoDB, Git.",
            "scores": {"semantic_similarity": 86.0, "keyword_match": 85.0, "must_have_match": 90.0, "quantification_score": 80.0, "ai_authenticity": 87.0, "rag_evidence": 81.0, "link_verification": 90.0, "career_progression": 74.0, "skills_matrix": 82.0, "structure_quality": 88.0, "contextual_keywords": 82.0},
            "matched": ["javascript", "node.js", "express", "react", "mongodb", "git"],
            "missing": ["docker", "postgresql"],
            "summary": "Strong core fundamentals across the MERN stack with high test coverage commitment."
        },
        {
            "name": "Elena Rostova",
            "email": "elena.r@devmail.org",
            "links": ["https://github.com/erostova", "https://linkedin.com/in/erostova"],
            "resume_text": "Backend Developer. Deep experience in Node.js, Express, PostgreSQL, and Docker. Implemented authentication and caching with Redis.\nSkills: Node.js, Express, PostgreSQL, Docker, Git, Redis, Linux.",
            "scores": {"semantic_similarity": 84.0, "keyword_match": 80.0, "must_have_match": 85.0, "quantification_score": 75.0, "ai_authenticity": 84.0, "rag_evidence": 80.0, "link_verification": 88.0, "career_progression": 72.0, "skills_matrix": 80.0, "structure_quality": 85.0, "contextual_keywords": 78.0},
            "matched": ["node.js", "express", "postgresql", "docker", "git"],
            "missing": ["react", "mongodb"],
            "summary": "Strong backend and Docker proficiency, but lacks verified frontend React experience."
        },
        {
            "name": "Rahul Kumar",
            "email": "rahul.k@example.com",
            "links": ["https://github.com/rahulkumar99", "https://linkedin.com/in/rahulkumar"],
            "resume_text": "Frontend Web Developer. Created multiple interactive web apps using React, JavaScript, HTML5, CSS3, Tailwind. Built MongoDB integration for personal blog.\nSkills: React, JavaScript, HTML, CSS, Tailwind, MongoDB, Git.",
            "scores": {"semantic_similarity": 82.0, "keyword_match": 78.0, "must_have_match": 75.0, "quantification_score": 65.0, "ai_authenticity": 72.0, "rag_evidence": 76.0, "link_verification": 85.0, "career_progression": 70.0, "skills_matrix": 75.0, "structure_quality": 82.0, "contextual_keywords": 70.0},
            "matched": ["react", "javascript", "mongodb", "git", "html", "css"],
            "missing": ["express", "node.js", "docker", "postgresql"],
            "summary": "Solid frontend developer, but lacks hands-on Node.js/Express backend server experience."
        },
        {
            "name": "Karan Verma",
            "email": "karan.verma@pymail.com",
            "links": ["https://github.com/karanverma", "https://linkedin.com/in/karanverma"],
            "resume_text": "Python & Backend Developer. Built REST APIs using FastAPI and Django. Used PostgreSQL and Docker. Familiar with JavaScript basics.\nSkills: Python, FastAPI, Django, PostgreSQL, Docker, Git, SQL.",
            "scores": {"semantic_similarity": 79.0, "keyword_match": 72.0, "must_have_match": 65.0, "quantification_score": 72.0, "ai_authenticity": 82.0, "rag_evidence": 74.0, "link_verification": 85.0, "career_progression": 68.0, "skills_matrix": 72.0, "structure_quality": 84.0, "contextual_keywords": 68.0},
            "matched": ["postgresql", "docker", "git", "sql"],
            "missing": ["react", "node.js", "express", "mongodb"],
            "summary": "Competent backend developer with Python/PostgreSQL, but JD strictly requires JavaScript/Node.js."
        },
        {
            "name": "Sneha Reddy",
            "email": "sneha.reddy@student.in",
            "links": ["https://linkedin.com/in/snehareddy"],
            "resume_text": "Computer Science undergrad. Academic projects in React and basic Node.js. Built a task tracker with MongoDB.\nSkills: React, Node.js, MongoDB, JavaScript, Git.",
            "scores": {"semantic_similarity": 77.0, "keyword_match": 75.0, "must_have_match": 75.0, "quantification_score": 58.0, "ai_authenticity": 80.0, "rag_evidence": 70.0, "link_verification": 70.0, "career_progression": 62.0, "skills_matrix": 70.0, "structure_quality": 78.0, "contextual_keywords": 64.0},
            "matched": ["react", "node.js", "mongodb", "javascript", "git"],
            "missing": ["express", "docker", "postgresql"],
            "summary": "Junior academic developer with basic concepts, but low quantifiable metrics and no deployed links."
        },
        {
            "name": "Ishaan Kapoor",
            "email": "ishaan.k@codebase.net",
            "links": ["https://github.com/ishaankapoor"],
            "resume_text": "Junior SDE. Built Java Spring Boot and React web portal. Handled MySQL databases and Git workflow.\nSkills: Java, Spring Boot, React, MySQL, Git, HTML, CSS.",
            "scores": {"semantic_similarity": 75.0, "keyword_match": 70.0, "must_have_match": 60.0, "quantification_score": 68.0, "ai_authenticity": 80.0, "rag_evidence": 70.0, "link_verification": 75.0, "career_progression": 66.0, "skills_matrix": 70.0, "structure_quality": 80.0, "contextual_keywords": 65.0},
            "matched": ["react", "git", "html", "css"],
            "missing": ["node.js", "express", "mongodb", "postgresql", "docker"],
            "summary": "Strong Java background with React, but lacks Node.js and Express backend experience."
        },
        {
            "name": "Aditya Joshi",
            "email": "aditya.joshi@devmail.in",
            "links": ["https://linkedin.com/in/adityajoshi"],
            "resume_text": "Web Development Intern. Created landing pages in React and HTML/CSS. Used Git for team collaboration.\nSkills: React, JavaScript, HTML5, CSS3, Git.",
            "scores": {"semantic_similarity": 72.0, "keyword_match": 68.0, "must_have_match": 55.0, "quantification_score": 50.0, "ai_authenticity": 78.0, "rag_evidence": 65.0, "link_verification": 65.0, "career_progression": 60.0, "skills_matrix": 62.0, "structure_quality": 76.0, "contextual_keywords": 58.0},
            "matched": ["react", "javascript", "git", "html", "css"],
            "missing": ["node.js", "express", "mongodb", "postgresql", "docker"],
            "summary": "Primarily a frontend UI builder without backend API or database integration experience."
        },
        {
            "name": "Meera Pillai",
            "email": "meera.pillai@tech.org",
            "links": ["https://github.com/meerapillai"],
            "resume_text": "Junior Developer. Basic exposure to JavaScript, Node.js scripts, and relational SQL queries.\nSkills: JavaScript, Node.js, SQL, Git.",
            "scores": {"semantic_similarity": 70.0, "keyword_match": 64.0, "must_have_match": 55.0, "quantification_score": 48.0, "ai_authenticity": 81.0, "rag_evidence": 64.0, "link_verification": 68.0, "career_progression": 58.0, "skills_matrix": 60.0, "structure_quality": 75.0, "contextual_keywords": 52.0},
            "matched": ["javascript", "node.js", "git", "sql"],
            "missing": ["react", "express", "mongodb", "postgresql", "docker"],
            "summary": "Has scripting knowledge but lacks modern frontend React and Express framework experience."
        },
        {
            "name": "Aditya Kulkarni",
            "email": "aditya.kulkarni@securesphere.org",
            "links": ["https://linkedin.com/in/adityakulkarni-sec"],
            "resume_text": "Cybersecurity Analyst. Conducted network penetration testing, Wireshark packet analysis, and SIEM monitoring. Configured Linux firewalls.\nSkills: Penetration Testing, Wireshark, Linux, Network Security, Python.",
            "scores": {"semantic_similarity": 52.0, "keyword_match": 35.0, "must_have_match": 20.0, "quantification_score": 60.0, "ai_authenticity": 85.0, "rag_evidence": 40.0, "link_verification": 70.0, "career_progression": 65.0, "skills_matrix": 40.0, "structure_quality": 82.0, "contextual_keywords": 25.0},
            "matched": ["linux", "python"],
            "missing": ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git"],
            "summary": "Security analyst profile. Minimal overlap with web development requirements."
        },
        {
            "name": "David Miller",
            "email": "dmiller@college.edu",
            "links": ["https://linkedin.com/in/davidmiller"],
            "resume_text": "Student. Introductory coursework in HTML and CSS. Created simple personal static webpage.\nSkills: HTML, CSS.",
            "scores": {"semantic_similarity": 48.0, "keyword_match": 30.0, "must_have_match": 15.0, "quantification_score": 35.0, "ai_authenticity": 82.0, "rag_evidence": 35.0, "link_verification": 50.0, "career_progression": 45.0, "skills_matrix": 30.0, "structure_quality": 68.0, "contextual_keywords": 25.0},
            "matched": ["html", "css"],
            "missing": ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git"],
            "summary": "Beginner hobbyist with only basic static markup knowledge; missing all core engineering requirements."
        },
        {
            "name": "Manav Chopra",
            "email": "manav.chopra@creatives.in",
            "links": ["https://behance.net/manavchopra", "https://youtube.com/c/manavvfx"],
            "resume_text": "Video Editor & Motion Designer. 3+ years editing videos using Adobe Premiere Pro, After Effects, and DaVinci Resolve. Managed YouTube channel with 100k views.\nSkills: Video Editing, Premiere Pro, After Effects, Color Grading, Storyboarding.",
            "scores": {"semantic_similarity": 32.0, "keyword_match": 12.0, "must_have_match": 0.0, "quantification_score": 65.0, "ai_authenticity": 88.0, "rag_evidence": 15.0, "link_verification": 75.0, "career_progression": 60.0, "skills_matrix": 15.0, "structure_quality": 80.0, "contextual_keywords": 10.0},
            "matched": [],
            "missing": ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git", "javascript"],
            "summary": "Video editing and motion graphics creative. Completely non-technical for software development."
        },
        {
            "name": "Sara Khan",
            "email": "sara.khan@growthmedia.com",
            "links": ["https://instagram.com/sarakhan_media", "https://linkedin.com/in/sarakhan"],
            "resume_text": "Social Media Intern. Managed Instagram and Twitter engagement for lifestyle brands. Grew followers by 45%. Coordinated influencer outreach campaigns.\nSkills: Social Media Marketing, Copywriting, Canva, Content Scheduling, Community Management.",
            "scores": {"semantic_similarity": 28.0, "keyword_match": 10.0, "must_have_match": 0.0, "quantification_score": 55.0, "ai_authenticity": 85.0, "rag_evidence": 12.0, "link_verification": 65.0, "career_progression": 52.0, "skills_matrix": 12.0, "structure_quality": 78.0, "contextual_keywords": 8.0},
            "matched": [],
            "missing": ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git", "javascript"],
            "summary": "Marketing and social media background with no programming or engineering qualifications."
        },
        {
            "name": "Aman Tiwari",
            "email": "aman.tiwari@salescorp.in",
            "links": ["https://linkedin.com/in/amatiwari-sales"],
            "resume_text": "Sales Executive. Generated B2B outbound sales leads. Exceeded quarterly revenue targets by 18%. Proficient in Salesforce CRM and cold calling.\nSkills: B2B Sales, Lead Generation, Salesforce, Cold Calling, Negotiation.",
            "scores": {"semantic_similarity": 24.0, "keyword_match": 8.0, "must_have_match": 0.0, "quantification_score": 60.0, "ai_authenticity": 86.0, "rag_evidence": 10.0, "link_verification": 60.0, "career_progression": 55.0, "skills_matrix": 10.0, "structure_quality": 75.0, "contextual_keywords": 6.0},
            "matched": [],
            "missing": ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git", "javascript"],
            "summary": "Direct sales professional without any software development or technical background."
        },
        {
            "name": "Pooja Malhotra",
            "email": "pooja.m@designstudio.in",
            "links": ["https://behance.net/poojamalhotra"],
            "resume_text": "Graphic Designer & Content Producer. Designed brochures, banners, and digital creatives. Proficient in Photoshop and Illustrator.\nSkills: Photoshop, Illustrator, InDesign, Figma, Branding.",
            "scores": {"semantic_similarity": 26.0, "keyword_match": 8.0, "must_have_match": 0.0, "quantification_score": 40.0, "ai_authenticity": 85.0, "rag_evidence": 10.0, "link_verification": 55.0, "career_progression": 50.0, "skills_matrix": 10.0, "structure_quality": 72.0, "contextual_keywords": 5.0},
            "matched": [],
            "missing": ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git", "javascript"],
            "summary": "Graphic designer with no coding experience. Fails all core engineering criteria."
        }
    ]

    total_weight = sum(DEFAULT_WEIGHTS.values())

    for cdata in candidates_data:
        cand = Candidate(
            name=cdata["name"],
            email=cdata["email"],
            phone="+1 (555) 019-2834",
            raw_text=cdata["resume_text"],
            detected_links=cdata["links"]
        )
        db.add(cand)
        db.flush()

        scores = cdata["scores"]
        weighted_sum = sum(scores[f] * (DEFAULT_WEIGHTS[f] / total_weight) for f in scores)
        final_score = round(weighted_sum, 1)

        evaluation = Evaluation(
            job_id=job.id,
            candidate_id=cand.id,
            score_semantic=scores["semantic_similarity"],
            score_keyword=scores["keyword_match"],
            score_must_have=scores["must_have_match"],
            score_quantification=scores["quantification_score"],
            score_ai_authenticity=scores["ai_authenticity"],
            score_rag_evidence=scores["rag_evidence"],
            score_link_verify=scores["link_verification"],
            score_career_prog=scores["career_progression"],
            score_skills_matrix=scores["skills_matrix"],
            score_structure=scores["structure_quality"],
            score_contextual=scores["contextual_keywords"],
            final_score=final_score,
            explanation=cdata["summary"],
            skills_matched=cdata["matched"],
            skills_missing=cdata["missing"]
        )
        db.add(evaluation)

    db.commit()
    return {"status": "seeded", "job_id": job.id, "candidates_count": len(candidates_data)}

@app.post("/api/reset-all")
def reset_database(db: Session = Depends(get_db)):
    """Clears all jobs, candidates, and evaluations to start fresh."""
    db.query(Evaluation).delete()
    db.query(Candidate).delete()
    db.query(JobDescription).delete()
    db.commit()
    return {"status": "cleared"}
