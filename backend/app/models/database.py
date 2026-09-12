import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    company = Column(String(255), default="Company")
    raw_text = Column(Text, nullable=False)
    must_have_skills = Column(JSON, default=list)
    nice_to_have_skills = Column(JSON, default=list)
    bias_analysis = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    evaluations = relationship("Evaluation", back_populates="job", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), default="")
    phone = Column(String(100), default="")
    raw_text = Column(Text, nullable=False)
    detected_links = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    evaluations = relationship("Evaluation", back_populates="candidate", cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("job_descriptions.id"), nullable=False)
    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False)
    score_semantic = Column(Float, default=0.0)
    score_keyword = Column(Float, default=0.0)
    score_must_have = Column(Float, default=0.0)
    score_quantification = Column(Float, default=0.0)
    score_ai_authenticity = Column(Float, default=0.0)
    score_rag_evidence = Column(Float, default=0.0)
    score_link_verify = Column(Float, default=0.0)
    score_career_prog = Column(Float, default=0.0)
    score_skills_matrix = Column(Float, default=0.0)
    score_structure = Column(Float, default=0.0)
    score_contextual = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    rank = Column(Integer, default=0)
    explanation = Column(Text, default="")
    skills_matched = Column(JSON, default=list)
    skills_missing = Column(JSON, default=list)
    evidence_snippets = Column(JSON, default=list)
    score_breakdown = Column(JSON, default=dict)

    job = relationship("JobDescription", back_populates="evaluations")
    candidate = relationship("Candidate", back_populates="evaluations")
