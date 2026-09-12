from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class JobDescriptionCreate(BaseModel):
    title: str
    company: Optional[str] = "TechNova Solutions"
    raw_text: str

class CandidateCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    raw_text: str

class CompareRequest(BaseModel):
    job_id: str
    candidate_a_id: str
    candidate_b_id: str

class CompareResponse(BaseModel):
    candidate_a_name: str
    candidate_a_score: float
    candidate_b_name: str
    candidate_b_score: float
    difference: float
    formatted_comparison: str
    top_differences: List[Dict[str, Any]]
    radar_comparison: Dict[str, Any]

class EvaluationOut(BaseModel):
    id: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    final_score: float
    rank: int
    score_semantic: float
    score_keyword: float
    score_must_have: float
    score_quantification: float
    score_ai_authenticity: float
    score_rag_evidence: float
    score_link_verify: float
    score_career_prog: float
    score_skills_matrix: float
    score_structure: float
    score_contextual: float
    explanation: str
    skills_matched: List[str]
    skills_missing: List[str]
    score_breakdown: Dict[str, Any]

class JobDescriptionOut(BaseModel):
    id: str
    title: str
    company: str
    raw_text: str
    must_have_skills: List[str]
    nice_to_have_skills: List[str]
    bias_analysis: Dict[str, Any]
    candidate_count: int
    evaluations: List[EvaluationOut]
