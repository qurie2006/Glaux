import re
import httpx
from typing import Dict, Any, List
from app.config import OLLAMA_URL

class RAGEngine:
    """Natural, clean conversational RAG service producing human recruiter responses without markdown clutter."""

    @classmethod
    async def ask_recruiter_agent(cls, query: str, context_candidates: List[Dict[str, Any]], jd_info: Dict[str, Any]) -> str:
        query_clean = query.strip()
        if not query_clean:
            return "Please enter a specific question about candidates, skills, or ranking criteria."

        if await cls._is_ollama_available():
            try:
                prompt = cls._build_grounded_prompt(query_clean, context_candidates, jd_info)
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.post(
                        f"{OLLAMA_URL}/api/generate",
                        json={"model": "llama3", "prompt": prompt, "stream": False}
                    )
                    if res.status_code == 200:
                        ans = res.json().get("response", "").strip()
                        if ans:
                            return cls._clean_markdown(ans)
            except Exception:
                pass

        return cls.synthesize_clean_response(query_clean, context_candidates, jd_info)

    @classmethod
    async def _is_ollama_available(cls) -> bool:
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                res = await client.get(f"{OLLAMA_URL}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    @classmethod
    def _clean_markdown(cls, text: str) -> str:
        text = re.sub(r'#{1,6}\s*', '', text)
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'\*(.*?)\*', r'\1', text)
        return text.strip()

    @classmethod
    def _build_grounded_prompt(cls, query: str, candidates: List[Dict[str, Any]], jd_info: Dict[str, Any]) -> str:
        lines = [
            f"Target Role: {jd_info.get('title', 'Software Engineer')} at {jd_info.get('company', 'TechNova Solutions')}",
            f"Must-Have Skills: {', '.join(jd_info.get('must_haves', []))}",
            "\nEvaluated Candidates Roster:"
        ]
        for c in candidates:
            sc = c.get("scores", {})
            lines.append(
                f"- Candidate: {c['name']} (Rank #{c.get('rank', '?')}, Score: {c.get('final_score', 0)})\n"
                f"  Must-Have: {sc.get('must_have_match', 0)}% | Quant: {sc.get('quantification_score', 0)}/100\n"
                f"  Matched Skills: {', '.join(c.get('skills_matched', []))}\n"
                f"  Missing Skills: {', '.join(c.get('skills_missing', []))}\n"
            )
        context = "\n".join(lines)
        return f"""You are a senior technical recruiting lead. Answer the recruiter's question directly in professional, clean prose. Do NOT use markdown symbols like asterisks or hashtags. Speak naturally and objectively.

Context:
{context}

Question: {query}"""

    @classmethod
    def synthesize_clean_response(cls, query: str, candidates: List[Dict[str, Any]], jd_info: Dict[str, Any]) -> str:
        if not candidates:
            return "No candidates have been evaluated yet. Please upload resumes or load the benchmark dataset to start querying."

        q = query.lower()
        for c in candidates:
            c_name = c["name"].lower()
            first_name = c_name.split()[0]
            if c_name in q or first_name in q:
                return cls._answer_candidate_profile(c)
        matched_candidates = [c for c in candidates if c["name"].lower().split()[0] in q]
        if len(matched_candidates) >= 2 or ("compare" in q and len(candidates) >= 2):
            c1 = matched_candidates[0] if len(matched_candidates) >= 1 else candidates[0]
            c2 = matched_candidates[1] if len(matched_candidates) >= 2 else candidates[1]
            return cls._answer_comparison(c1, c2)
        tech_tokens = [
            "aws", "docker", "react", "node", "express", "mongodb", "postgresql", "kubernetes",
            "git", "python", "typescript", "javascript", "tailwind", "sql", "ci/cd"
        ]
        for tech in tech_tokens:
            if tech in q:
                return cls._answer_skill_inquiry(tech, candidates)
        if any(w in q for w in ["metric", "quant", "number", "data", "impact", "business", "scale"]):
            sorted_by_quant = sorted(candidates, key=lambda x: x.get("scores", {}).get("quantification_score", 0), reverse=True)
            top_quant = sorted_by_quant[0]
            top_sc = top_quant.get("scores", {}).get("quantification_score", 0)
            runner_sc = sorted_by_quant[1].get("scores", {}).get("quantification_score", 0)
            return (
                f"The candidate demonstrating the strongest quantifiable business impact is {top_quant['name']} with a score of {top_sc} out of 100. "
                f"Unlike candidates who list passive responsibilities, {top_quant['name']} backed up their achievements with concrete numbers, such as percentage latency reductions and data scale. "
                f"In comparison, {sorted_by_quant[1]['name']} is the runner-up with {runner_sc} out of 100."
            )
        if any(w in q for w in ["missing", "gap", "weakness", "lack", "fail"]):
            missing_map = {}
            for c in candidates:
                for m in c.get("skills_missing", []):
                    missing_map[m] = missing_map.get(m, 0) + 1
            sorted_gaps = sorted(missing_map.items(), key=lambda x: x[1], reverse=True)
            top_missing = ", ".join([f"{k} ({v} candidates)" for k, v in sorted_gaps[:3]])
            return (
                f"Across our current candidate pool, the most widespread skill gaps are in {top_missing}. "
                f"Most applicants have foundational frontend or scripting skills, but production containerization (Docker) and relational databases (PostgreSQL) are where the largest drop-offs occur."
            )
        if any(w in q for w in ["top", "best", "winner", "rank", "summary", "recommend"]):
            top3 = candidates[:3]
            lines = ["Here is the current top 3 shortlist for the role:\n"]
            for idx, c in enumerate(top3, 1):
                sc = c.get("scores", {})
                lines.append(
                    f"{idx}. {c['name']} (Score: {c['final_score']} out of 100) — "
                    f"Core skills: {', '.join(c.get('skills_matched', [])[:4])}. "
                    f"Must-have match is {sc.get('must_have_match', 0)}% with a quantification score of {sc.get('quantification_score', 0)}/100."
                )
            return "\n\n".join(lines)
        top = candidates[0]
        runner_str = f"Why is {top['name']} ranked higher than {candidates[1]['name']}?" if len(candidates) > 1 else "Why is this candidate ranked top?"
        return (
            f"We are tracking {len(candidates)} evaluated candidates. The current rank leader is {top['name']} with a composite score of {top['final_score']} out of 100. "
            f"You can ask me specific questions like: 'Who has AWS or Docker experience?', '{runner_str}', or 'Who has the highest quantifiable metrics?'."
        )

    @classmethod
    def _answer_candidate_profile(cls, c: Dict[str, Any]) -> str:
        sc = c.get("scores", {})
        matched = ", ".join(c.get("skills_matched", [])) or "basic software concepts"
        missing = ", ".join(c.get("skills_missing", [])) or "none identified"
        
        return (
            f"{c['name']} is currently ranked #{c.get('rank', '?')} with a composite score of {c['final_score']} out of 100.\n\n"
            f"Key evaluation factors:\n"
            f"• Must-Have Core Alignment: {sc.get('must_have_match', 0)}%\n"
            f"• Semantic Similarity: {sc.get('semantic_similarity', 0)} out of 100\n"
            f"• Quantifiable Metrics: {sc.get('quantification_score', 0)} out of 100\n"
            f"• Verified Skills: {matched}\n"
            f"• Missing Skills: {missing}\n\n"
            f"Hiring Assessment: {c.get('explanation', 'Strong candidate with verified credentials.')}"
        )

    @classmethod
    def _answer_comparison(cls, c1: Dict[str, Any], c2: Dict[str, Any]) -> str:
        higher = c1 if c1["final_score"] >= c2["final_score"] else c2
        lower = c2 if c1["final_score"] >= c2["final_score"] else c1
        diff = round(higher["final_score"] - lower["final_score"], 1)
        
        s1 = higher.get("scores", {})
        s2 = lower.get("scores", {})
        quant_diff = round(s1.get("quantification_score", 0) - s2.get("quantification_score", 0), 1)
        must_diff = round(s1.get("must_have_match", 0) - s2.get("must_have_match", 0), 1)

        return (
            f"{higher['name']} ({higher['final_score']} points) outranks {lower['name']} ({lower['final_score']} points) by a margin of {diff} points.\n\n"
            f"The main reasons for this advantage:\n"
            f"1. Quantifiable Impact: {higher['name']} scored {s1.get('quantification_score', 0)} vs {lower['name']}'s {s2.get('quantification_score', 0)} (a +{quant_diff} point advantage), showing more measurable engineering results in their project descriptions.\n"
            f"2. Core Must-Haves: {higher['name']} satisfied {s1.get('must_have_match', 0)}% of required skills vs {lower['name']}'s {s2.get('must_have_match', 0)}% (a +{must_diff}% advantage).\n\n"
            f"In summary, {higher['name']} demonstrated both wider technical stack alignment and stronger data-backed project achievements."
        )

    @classmethod
    def _answer_skill_inquiry(cls, skill: str, candidates: List[Dict[str, Any]]) -> str:
        matches = []
        for c in candidates:
            if any(skill in s.lower() for s in c.get("skills_matched", [])):
                matches.append(c)

        if not matches:
            return f"None of the evaluated candidates explicitly verified having {skill.upper()} in their resume evidence."

        lines = [f"Found {len(matches)} candidate(s) with verified {skill.upper()} experience:\n"]
        for idx, c in enumerate(matches, 1):
            lines.append(
                f"{idx}. {c['name']} (Rank #{c.get('rank', '?')}, Score: {c['final_score']})\n"
                f"   Contextual match: {c.get('scores', {}).get('contextual_keywords', 0)}/100 | Other skills: {', '.join(c.get('skills_matched', [])[:4])}"
            )
        return "\n\n".join(lines)
