import os
from typing import Dict
DEFAULT_WEIGHTS: Dict[str, float] = {
    "semantic_similarity": 20.0,
    "keyword_match": 15.0,
    "must_have_match": 15.0,
    "quantification_score": 12.0,
    "ai_authenticity": 3.0,
    "rag_evidence": 10.0,
    "link_verification": 8.0,
    "career_progression": 7.0,
    "skills_matrix": 5.0,
    "structure_quality": 3.0,
    "contextual_keywords": 8.0,
}

FACTOR_METADATA = {
    "semantic_similarity": {
        "label": "Semantic Similarity",
        "description": "How well the resume meaning matches the JD (deep context)",
        "advantage_phrase": "demonstrates deeper conceptual alignment with the role's mission and engineering context"
    },
    "keyword_match": {
        "label": "Keyword Match",
        "description": "How many exact skills/technologies from JD appear in the resume",
        "advantage_phrase": "matched more explicit technologies and technical stack keywords"
    },
    "must_have_match": {
        "label": "Must-Have Match",
        "description": "How many required core competencies the candidate demonstrates",
        "advantage_phrase": "demonstrates more of the critical required core skills"
    },
    "quantification_score": {
        "label": "Quantification Score",
        "description": "How much they use numbers, percentages, and metrics to validate impact",
        "advantage_phrase": "used more quantifiable metrics (numbers, percentages, scale) in their bullet points"
    },
    "ai_authenticity": {
        "label": "AI Authenticity",
        "description": "Human-written vs LLM-generated phrasing pattern indicator",
        "advantage_phrase": "shows more human-like, varied authentic writing patterns"
    },
    "rag_evidence": {
        "label": "RAG Evidence Strength",
        "description": "How much concrete supporting proof exists in resume for requirements",
        "advantage_phrase": "provided more direct verifiable evidence snippets across requirement chunks"
    },
    "link_verification": {
        "label": "Link Verification",
        "description": "Presence and validity of GitHub, LinkedIn, portfolio, live links",
        "advantage_phrase": "has more verifiable links (GitHub, LinkedIn, portfolio, live projects)"
    },
    "career_progression": {
        "label": "Career Progression",
        "description": "Consistent trajectory, upward seniority, and role growth",
        "advantage_phrase": "shows a clearer upward trajectory and increasing engineering ownership"
    },
    "skills_matrix": {
        "label": "Skills Matrix Coverage",
        "description": "Coverage across required toolsets, stacks, and libraries",
        "advantage_phrase": "covers a broader spectrum of the required technical stack"
    },
    "structure_quality": {
        "label": "Structure Quality",
        "description": "Layout organization, clean sections, consistent readability",
        "advantage_phrase": "presents a cleaner, more structured and professional layout"
    },
    "contextual_keywords": {
        "label": "Contextual Keywords",
        "description": "Skills applied in actual work experience rather than keyword stuffing",
        "advantage_phrase": "demonstrates skills embedded in real project achievements rather than isolated skill lists"
    }
}

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shortlisting.db")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
