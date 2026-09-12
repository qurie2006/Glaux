import re
from typing import Dict, List, Any

class JDAnalyzer:
    """Analyzes Job Descriptions for skills classification and flags bias or exclusionary language."""

    BIAS_PATTERNS = [
        {
            "category": "Hyper-competitive / Gender-coded",
            "regex": r'\b(rockstar|ninja|guru|superhero|dominant|aggressive|crush it)\b',
            "severity": "Medium",
            "issue": "Stereotypically masculine or hyper-intense phrasing that discourages collaborative and diverse applicants.",
            "recommendation": "Replace with professional descriptors like 'dedicated engineer', 'collaborative problem solver', or 'impact-driven developer'."
        },
        {
            "category": "Degree Elitism",
            "regex": r'\b(tier[- ]?1 (?:college|university|institute)|ivy league|premier institute only)\b',
            "severity": "High",
            "issue": "Elitist educational screening that disproportionately filters out skilled non-traditional or self-taught developers.",
            "recommendation": "Use 'Degree in Computer Science or equivalent practical project experience'."
        },
        {
            "category": "Experience Inflation",
            "regex": r'\b(?:intern|junior|entry[- ]?level).*?(\b[3-9]|\b10)\+?\s*years?\b',
            "severity": "High",
            "issue": "Demanding 3+ years of professional experience for an entry-level or intern role creates unrealistic barriers.",
            "recommendation": "Adjust to '0-1 years of experience or demonstrable coursework / open-source projects'."
        },
        {
            "category": "Narrow Phrasing Trap",
            "regex": r'\b(must have (?:exact|solely|strictly) [a-zA-Z0-9\s]+ experience)\b',
            "severity": "Medium",
            "issue": "Rigid requirement for a single proprietary tool, filtering out candidates with deep transferable mastery of equivalent stacks.",
            "recommendation": "Mention transferable technologies: e.g. 'Node.js/Express or equivalent backend frameworks (Django, Spring Boot)'."
        },
        {
            "category": "Ableist / Physical Phrasing",
            "regex": r'\b(fast[- ]?paced high[- ]?stress|work around the clock|24/7 hustle|native english speaker)\b',
            "severity": "Medium",
            "issue": "Language that can discriminate against neurodivergent individuals, ESL applicants, or candidates requiring work-life accommodation.",
            "recommendation": "Specify clear team goals and communication norms rather than 'high-stress 24/7 hustle'."
        }
    ]

    TECH_VOCABULARY = [
        "python", "javascript", "typescript", "react", "react.js", "node.js", "nodejs", "express",
        "mongodb", "postgresql", "postgres", "sql", "mysql", "nosql", "docker", "kubernetes",
        "aws", "gcp", "azure", "html", "css", "html5", "css3", "tailwind", "git", "github",
        "ci/cd", "rest", "restful", "rest api", "graphql", "fastapi", "flask", "django",
        "java", "spring", "spring boot", "c++", "c#", ".net", "redis", "kafka", "linux",
        "next.js", "vue", "angular", "redux", "jest", "pytest", "data structures", "algorithms",
        "microservices", "system design"
    ]

    @classmethod
    def analyze_jd(cls, jd_text: str) -> Dict[str, Any]:
        """Extracts must-haves, nice-to-haves, and scans for inclusive language flags."""
        lines = jd_text.split("\n")
        
        must_haves = set()
        nice_to_haves = set()
        
        current_mode = "must_have"

        must_have_triggers = ["required", "must have", "qualifications", "requirements", "mandatory", "essential", "minimum qualifications"]
        nice_to_have_triggers = ["nice to have", "preferred", "bonus", "good to have", "plus", "desirable", "preferred qualifications"]

        for line in lines:
            line_lower = line.lower().strip()
            if any(trigger in line_lower for trigger in nice_to_have_triggers):
                current_mode = "nice_to_have"
                continue
            elif any(trigger in line_lower for trigger in must_have_triggers):
                current_mode = "must_have"
                continue
            for tech in cls.TECH_VOCABULARY:
                pattern = r'(?i)\b' + re.escape(tech) + r'\b'
                if re.search(pattern, line):
                    if current_mode == "must_have":
                        must_haves.add(tech)
                    else:
                        nice_to_haves.add(tech)
        if not must_haves and nice_to_haves:
            must_haves = nice_to_haves
            nice_to_haves = set()
        elif not must_haves and not nice_to_haves:
            for tech in cls.TECH_VOCABULARY:
                if re.search(r'(?i)\b' + re.escape(tech) + r'\b', jd_text):
                    must_haves.add(tech)
        nice_to_haves = nice_to_haves - must_haves
        bias_findings = cls.audit_bias(jd_text)

        return {
            "must_haves": sorted(list(must_haves)),
            "nice_to_haves": sorted(list(nice_to_haves)),
            "bias_analysis": bias_findings
        }

    @classmethod
    def audit_bias(cls, jd_text: str) -> Dict[str, Any]:
        """Scans for exclusionary phrasing, gender-coded buzzwords, and narrow traps."""
        flags = []
        for pattern in cls.BIAS_PATTERNS:
            matches = re.findall(pattern["regex"], jd_text, re.IGNORECASE)
            if matches:
                flags.append({
                    "category": pattern["category"],
                    "detected_phrases": list(set(matches)),
                    "severity": pattern["severity"],
                    "issue": pattern["issue"],
                    "recommendation": pattern["recommendation"]
                })

        overall_score = max(0, 100 - (len(flags) * 15))
        return {
            "inclusivity_score": overall_score,
            "total_flags": len(flags),
            "flags": flags,
            "is_clean": len(flags) == 0
        }
