from typing import Dict, Any, List
from app.config import FACTOR_METADATA

class CandidateComparator:
    """Generates the structured recruiter comparison breakdown between Candidate A and Candidate B."""

    @classmethod
    def compare_candidates(cls, cand_a: Dict[str, Any], cand_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        cand_a and cand_b should have:
          - name: str
          - final_score: float
          - scores: dict of 11 factor scores
          - skills_matched: list of str
          - skills_missing: list of str
          - candidate_links: list of str
          - evidence_snippets: list of str
        """
        score_a = cand_a.get("final_score", 0.0)
        score_b = cand_b.get("final_score", 0.0)
        if score_b > score_a:
            first, second = cand_b, cand_a
        else:
            first, second = cand_a, cand_b

        diff = round(abs(first["final_score"] - second["final_score"]), 1)
        name_first = first["name"]
        name_second = second["name"]

        first_skills = [s.lower().strip() for s in first.get("skills_matched", [])]
        second_skills = [s.lower().strip() for s in second.get("skills_matched", [])]
        skills_a_not_b = [s for s in first.get("skills_matched", []) if s.lower().strip() not in second_skills]
        skills_b_not_a = [s for s in second.get("skills_matched", []) if s.lower().strip() not in first_skills]
        metrics_a = [snip for snip in first.get("evidence_snippets", []) if any(ch.isdigit() or ch in '%$+' for ch in snip)]
        metrics_b = [snip for snip in second.get("evidence_snippets", []) if any(ch.isdigit() or ch in '%$+' for ch in snip)]
        factor_diffs = []
        excelled_count = 0

        for factor_key, meta in FACTOR_METADATA.items():
            f_score_1 = first["scores"].get(factor_key, 0.0)
            f_score_2 = second["scores"].get(factor_key, 0.0)
            advantage = round(f_score_1 - f_score_2, 1)
            
            if advantage > 0:
                excelled_count += 1
            details = {}
            if factor_key in ["must_have_match", "keyword_match", "skills_matrix"]:
                details["exclusive_skills_to_winner"] = skills_a_not_b
                details["missing_in_loser"] = [s for s in second.get("skills_missing", []) if s.lower().strip() in first_skills]
                details["explanation"] = f"{name_first} demonstrates {len(skills_a_not_b)} skills/qualities not demonstrated by {name_second}: {', '.join(skills_a_not_b) if skills_a_not_b else 'Deeper coverage across core requirements'}."
            elif factor_key == "quantification_score":
                details["metrics_winner"] = metrics_a[:3]
                details["metrics_loser"] = metrics_b[:2]
                details["explanation"] = f"{name_first} provides verified metrics ({len(metrics_a)} quantified achievements) vs {name_second}'s ({len(metrics_b)} quantified achievements)."
            elif factor_key == "link_verification":
                details["links_winner"] = first.get("candidate_links", [])
                details["links_loser"] = second.get("candidate_links", [])
                details["explanation"] = f"{name_first} has {len(first.get('candidate_links', []))} verifiable portfolio/repo links vs {name_second}'s {len(second.get('candidate_links', []))}."
            elif factor_key == "rag_evidence":
                details["evidence_winner"] = first.get("evidence_snippets", [])[:2]
                details["evidence_loser"] = second.get("evidence_snippets", [])[:2]
                details["explanation"] = f"{name_first} has stronger cited resume evidence directly mapped to job criteria."
            elif factor_key == "ai_authenticity":
                details["explanation"] = f"{name_first}'s resume features higher human variance and genuine technical project phrasing."
            else:
                details["exclusive_skills_to_winner"] = skills_a_not_b[:3]
                details["explanation"] = f"{name_first} holds a +{advantage} point advantage in {meta['label']}."

            factor_diffs.append({
                "factor_key": factor_key,
                "label": meta["label"],
                "score_first": f_score_1,
                "score_second": f_score_2,
                "advantage": advantage,
                "advantage_phrase": meta["advantage_phrase"],
                "details": details
            })
        sorted_diffs = sorted(factor_diffs, key=lambda x: x["advantage"], reverse=True)
        top_3 = sorted_diffs[:3]
        lines = []
        lines.append(f"**{name_first}** ({first['final_score']}) ranks above **{name_second}** ({second['final_score']}) by {diff} points. Here's why:\n")

        for idx, item in enumerate(top_3, 1):
            adv_sign = f"+{item['advantage']}" if item['advantage'] >= 0 else f"{item['advantage']}"
            lines.append(f"**{idx}. {item['label']}:** {name_first} scored **{item['score_first']}** vs {name_second}'s **{item['score_second']}** ({adv_sign} advantage).")
            lines.append(f"   → {name_first} {item['advantage_phrase']}.\n")

        top_key_factor = top_3[0]["label"] if top_3 else "multiple factors"
        lines.append(f"**Summary:** {name_first} excelled in {excelled_count} out of 11 criteria, with particularly strong performance in {top_key_factor}.")

        formatted_text = "\n".join(lines)

        return {
            "candidate_a_name": name_first,
            "candidate_a_rank": first.get("rank", 1),
            "candidate_a_score": first["final_score"],
            "candidate_b_name": name_second,
            "candidate_b_rank": second.get("rank", 2),
            "candidate_b_score": second["final_score"],
            "difference": diff,
            "excelled_count": excelled_count,
            "top_differences": top_3,
            "formatted_comparison": formatted_text,
            "all_factors_comparison": sorted_diffs,
            "skills_a_not_b": skills_a_not_b,
            "skills_b_not_a": skills_b_not_a
        }

