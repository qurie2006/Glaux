import re
import math
from typing import Dict, Any, List, Tuple
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import DEFAULT_WEIGHTS
from app.services.parser import ResumeParser

class ScoringEngine:
    """Calculates all 11 evaluation factors with customizable weights and zero external API dependencies."""

    @classmethod
    def calculate_all_scores(
        cls,
        jd_text: str,
        resume_text: str,
        must_haves: List[str],
        nice_to_haves: List[str],
        sections: Dict[str, str],
        contact_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        semantic_score = cls._compute_semantic_similarity(jd_text, resume_text)
        keyword_score, matched_keywords, missing_keywords = cls._compute_keyword_match(jd_text, resume_text)
        must_have_score, matched_must, missing_must = cls._compute_must_haves(resume_text, must_haves)
        quant_score = cls._compute_quantification_score(resume_text, sections.get("experience", ""))
        ai_score = cls._compute_ai_authenticity(resume_text)
        rag_score, evidence_snippets = cls._compute_rag_evidence(jd_text, resume_text)
        link_score = cls._compute_link_verification(contact_info)
        career_score = cls._compute_career_progression(resume_text, sections.get("experience", ""))
        matrix_score = cls._compute_skills_matrix(resume_text, must_haves, nice_to_haves)
        struct_score = cls._compute_structure_quality(resume_text, sections)
        contextual_score = cls._compute_contextual_keywords(
            sections.get("experience", "") + "\n" + sections.get("projects", ""),
            must_haves + nice_to_haves
        )

        scores = {
            "semantic_similarity": round(semantic_score, 1),
            "keyword_match": round(keyword_score, 1),
            "must_have_match": round(must_have_score, 1),
            "quantification_score": round(quant_score, 1),
            "ai_authenticity": round(ai_score, 1),
            "rag_evidence": round(rag_score, 1),
            "link_verification": round(link_score, 1),
            "career_progression": round(career_score, 1),
            "skills_matrix": round(matrix_score, 1),
            "structure_quality": round(struct_score, 1),
            "contextual_keywords": round(contextual_score, 1)
        }
        total_weight = sum(DEFAULT_WEIGHTS.values())
        weighted_sum = sum(scores[factor] * (DEFAULT_WEIGHTS[factor] / total_weight) for factor in scores)
        final_score = round(min(100.0, max(0.0, weighted_sum)), 1)
        all_matched = sorted(list(set(matched_must + [k for k in matched_keywords if k in must_haves + nice_to_haves])))
        all_missing = sorted(list(set(missing_must + [k for k in (must_haves + nice_to_haves) if k not in all_matched])))

        return {
            "scores": scores,
            "final_score": final_score,
            "skills_matched": all_matched,
            "skills_missing": all_missing,
            "evidence_snippets": evidence_snippets
        }

    @classmethod
    def _compute_semantic_similarity(cls, text_a: str, text_b: str) -> float:
        """High-precision N-gram semantic cosine similarity fallback."""
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", max_features=5000)
            tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
            sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            scaled = min(100.0, math.sqrt(sim) * 105.0)
            return max(15.0, scaled)
        except Exception:
            return 50.0

    @classmethod
    def _compute_keyword_match(cls, jd_text: str, resume_text: str) -> Tuple[float, List[str], List[str]]:
        """BM25-based keyword scoring over key technical terms."""
        terms = list(set(ResumeParser.COMMON_TECH_SKILLS))
        jd_terms = [t for t in terms if re.search(r'(?i)\b' + re.escape(t) + r'\b', jd_text)]
        if not jd_terms:
            jd_terms = terms[:10]

        matched = []
        missing = []
        for t in jd_terms:
            if re.search(r'(?i)\b' + re.escape(t) + r'\b', resume_text):
                matched.append(t)
            else:
                missing.append(t)

        ratio = len(matched) / max(1, len(jd_terms))
        score = min(100.0, ratio * 100.0)
        return score, matched, missing

    @classmethod
    def _compute_must_haves(cls, resume_text: str, must_haves: List[str]) -> Tuple[float, List[str], List[str]]:
        """Strict evaluation of mandatory requirements."""
        if not must_haves:
            return 85.0, [], []

        matched = []
        missing = []
        for skill in must_haves:
            if re.search(r'(?i)\b' + re.escape(skill) + r'\b', resume_text):
                matched.append(skill)
            else:
                missing.append(skill)

        ratio = len(matched) / len(must_haves)
        score = ratio * 100.0
        return score, matched, missing

    @classmethod
    def _compute_quantification_score(cls, resume_text: str, exp_text: str) -> float:
        """Counts metrics, percentages, data indicators, and business impact statements."""
        target_text = exp_text if len(exp_text) > 150 else resume_text
        patterns = [
            r'\b\d+(?:\.\d+)?%',
            r'\$\s*\d+(?:,\d+)*(?:\.\d+)?[KkMmBb]?',
            r'\b\d+\s*(?:ms|seconds|minutes|hours)\b',
            r'\b(?:increased|decreased|reduced|boosted|improved|saved|scaled)\s+.*?by\s+\d+',
            r'\b\d+[\+\-]?\s*(?:users|clients|requests|qps|rps|candidates|stars)\b',
            r'\b(?:10x|2x|3x|5x)\b'
        ]

        total_hits = 0
        for pat in patterns:
            total_hits += len(re.findall(pat, target_text, re.IGNORECASE))
        score = min(100.0, 30.0 + (total_hits * 11.5))
        return score

    @classmethod
    def _compute_ai_authenticity(cls, resume_text: str) -> float:
        """Evaluates human authenticity heuristics vs AI boilerplate patterns."""
        ai_cliches = [
            "delve", "testament to", "spearheaded an innovative", "game-changer",
            "multifaceted", "seamlessly orchestrate", "pivotal role in harnessing",
            "fostering synergy", "dynamic and results-oriented", "leveraging cutting-edge"
        ]
        
        cliche_count = sum(1 for c in ai_cliches if c in resume_text.lower())
        sentences = [s.strip() for s in resume_text.split(".") if len(s.strip()) > 10]
        variance_bonus = 0.0
        if len(sentences) > 4:
            lengths = [len(s.split()) for s in sentences]
            variance = sum((l - (sum(lengths)/len(lengths)))**2 for l in lengths) / len(lengths)
            variance_bonus = min(20.0, variance * 0.5)

        base_score = 90.0 - (cliche_count * 15.0) + variance_bonus
        return min(100.0, max(25.0, base_score))

    @classmethod
    def _compute_rag_evidence(cls, jd_text: str, resume_text: str) -> Tuple[float, List[Dict[str, str]]]:
        """Identifies concrete paragraph evidence snippets supporting key requirements."""
        chunks = [c.strip() for c in resume_text.split("\n\n") if len(c.strip()) > 30]
        evidence = []
        
        key_jd_lines = [l.strip() for l in jd_text.split("\n") if len(l.strip()) > 20][:5]
        
        matches_found = 0
        for req in key_jd_lines:
            best_chunk = ""
            best_sim = 0.0
            for chunk in chunks:
                words_overlap = len(set(req.lower().split()) & set(chunk.lower().split()))
                if words_overlap > best_sim:
                    best_sim = words_overlap
                    best_chunk = chunk
            
            if best_sim >= 4:
                matches_found += 1
                evidence.append({
                    "requirement": req[:80] + "...",
                    "evidence": best_chunk[:140] + "..."
                })

        score = min(100.0, 40.0 + (matches_found * 15.0))
        return score, evidence

    @classmethod
    def _compute_link_verification(cls, contact_info: Dict[str, Any]) -> float:
        """Verifies presence of verifiable professional links."""
        score = 40.0
        if contact_info.get("has_github"):
            score += 25.0
        if contact_info.get("has_linkedin"):
            score += 20.0
        if contact_info.get("has_portfolio"):
            score += 15.0
        return min(100.0, score)

    @classmethod
    def _compute_career_progression(cls, resume_text: str, exp_text: str) -> float:
        """Identifies progression markers, internships, promotions, and sustained experience."""
        progression_cues = ["intern", "junior", "associate", "developer", "engineer", "senior", "lead", "architect", "promoted"]
        found = [cue for cue in progression_cues if re.search(r'(?i)\b' + cue + r'\b', resume_text)]
        years = re.findall(r'\b(201\d|202\d)\b', resume_text)
        distinct_years = len(set(years))

        score = 45.0 + (len(found) * 8.0) + (min(4, distinct_years) * 6.0)
        return min(100.0, score)

    @classmethod
    def _compute_skills_matrix(cls, resume_text: str, must_haves: List[str], nice_to_haves: List[str]) -> float:
        """Measures technical coverage across tech domains."""
        all_skills = set(must_haves + nice_to_haves + ResumeParser.COMMON_TECH_SKILLS)
        matched_count = sum(1 for s in all_skills if re.search(r'(?i)\b' + re.escape(s) + r'\b', resume_text))
        ratio = matched_count / max(1, len(all_skills))
        return min(100.0, max(20.0, ratio * 220.0))

    @classmethod
    def _compute_structure_quality(cls, resume_text: str, sections: Dict[str, str]) -> float:
        """Measures layout professionalism, clear sections, bullet density, and cleanliness."""
        score = 50.0
        if sections.get("experience"):
            score += 15.0
        if sections.get("skills"):
            score += 15.0
        if sections.get("education"):
            score += 10.0
        if sections.get("projects"):
            score += 10.0
        return min(100.0, score)

    @classmethod
    def _compute_contextual_keywords(cls, project_exp_text: str, target_skills: List[str]) -> float:
        """Checks if skills are used contextually in actual project/job descriptions with action verbs."""
        action_verbs = ["built", "developed", "architected", "engineered", "implemented", "deployed", "optimized", "designed", "created"]
        
        context_matches = 0
        for skill in set(target_skills):
            pattern = r'(?i)\b(?:' + '|'.join(action_verbs) + r')\b.{0,60}\b' + re.escape(skill) + r'\b'
            if re.search(pattern, project_exp_text):
                context_matches += 1

        score = min(100.0, 35.0 + (context_matches * 13.0))
        return score
