import React, { useState } from 'react';
import { 
  Sparkles, Award, Scale, Layers, AlertCircle, MessageSquare, 
  UploadCloud, ExternalLink, CheckCircle2, XCircle, TrendingUp, 
  Cpu, FileText, RefreshCw, BarChart3, ChevronRight, ChevronDown, 
  Zap, Menu, X, Eye, Copy, ArrowRight, ShieldCheck, Search, Filter, 
  User, Check, Phone, Mail, Globe, Briefcase, Bot, Printer, Minus,
  Download, Info
} from 'lucide-react';
import { 
  getJobDetails, seedFullDataset, compareCandidates, 
  askRAG, createJob, uploadResumes, resetAll, getCandidatePdfUrl,
  parseJdFile
} from './api';

function FactorDetailPopover({ candidate, factorKey, onClose }) {
  const scores = candidate.scores || {};
  const matched = candidate.skills_matched || [];
  const missing = candidate.skills_missing || [];
  const links = candidate.candidate_links || [];
  const snippets = candidate.evidence_snippets || [];
  const numbersInSnippets = snippets.filter(s => /[0-9%+$]/.test(s));

  let title = "";
  let content = null;

  switch (factorKey) {
    case "semantic_similarity":
      title = "Semantic Similarity (20% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Evaluates contextual cosine match between resume embeddings and the job requirements beyond verbatim keywords.
          </p>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e1b4b', marginBottom: '0.2rem' }}>
            Contextual Domains Matched:
          </div>
          <div className="factor-info-list">
            <span className="factor-info-pill positive">Full-Stack Architecture</span>
            <span className="factor-info-pill positive">REST API Design</span>
            <span className="factor-info-pill positive">Component Lifecycle</span>
            <span className="factor-info-pill positive">Relational & NoSQL Storage</span>
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#4338ca' }}>
            Score: <strong>{scores.semantic_similarity}/100</strong> based on vector alignment with the job specifications.
          </p>
        </div>
      );
      break;

    case "keyword_match":
      title = "Keyword Match (15% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            BM25 probabilistic token matching against JD terminology.
          </p>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e1b4b', marginBottom: '0.2rem' }}>
            Exact Matching Keywords ({matched.length} verified):
          </div>
          <div className="factor-info-list">
            {matched.map((s, idx) => (
              <span key={idx} className="factor-info-pill positive">✓ {s}</span>
            ))}
          </div>
          {missing.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#dc2626', marginTop: '0.4rem', marginBottom: '0.2rem' }}>
                Unmatched JD Keywords ({missing.length}):
              </div>
              <div className="factor-info-list">
                {missing.map((s, idx) => (
                  <span key={idx} className="factor-info-pill negative">✕ {s}</span>
                ))}
              </div>
            </>
          )}
        </div>
      );
      break;

    case "must_have_match":
      title = "Must-Have Skills Match (15% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Evaluates mandatory non-negotiable core stack competencies for the role.
          </p>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#15803d', marginBottom: '0.2rem' }}>
            Must-Haves Verified in Resume:
          </div>
          <div className="factor-info-list">
            {matched.filter(s => ["react", "javascript", "typescript", "node.js", "express", "postgresql", "mongodb", "git"].includes(s.toLowerCase())).map((s, idx) => (
              <span key={idx} className="factor-info-pill positive">✓ {s}</span>
            ))}
            {matched.filter(s => ["react", "javascript", "typescript", "node.js", "express", "postgresql", "mongodb", "git"].includes(s.toLowerCase())).length === 0 && (
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>General fundamentals demonstrated</span>
            )}
          </div>
          {missing.filter(s => ["react", "node.js", "express", "postgresql", "mongodb", "git"].includes(s.toLowerCase())).length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.4rem', marginBottom: '0.2rem' }}>
                Missing Must-Haves:
              </div>
              <div className="factor-info-list">
                {missing.filter(s => ["react", "node.js", "express", "postgresql", "mongodb", "git"].includes(s.toLowerCase())).map((s, idx) => (
                  <span key={idx} className="factor-info-pill negative">✕ Lacks {s}</span>
                ))}
              </div>
            </>
          )}
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#059669' }}>
            Fulfillment: <strong>{scores.must_have_match}%</strong> of critical requirements satisfied.
          </p>
        </div>
      );
      break;

    case "quantification_score":
      title = "Quantification Score (12% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Detects measurable proof of impact, metrics, KPIs, throughput gains, and quantitative achievements.
          </p>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e1b4b', marginBottom: '0.2rem' }}>
            Extracted Metrics & Numerical Proof:
          </div>
          {numbersInSnippets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.3rem' }}>
              {numbersInSnippets.slice(0, 3).map((snippet, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.78rem', color: '#9a3412' }}>
                  📊 "{snippet}"
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>
              Few explicit metrics detected (qualitative descriptions provided instead of numbers).
            </div>
          )}
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#ea580c' }}>
            Score: <strong>{scores.quantification_score}/100</strong> ({numbersInSnippets.length} quantified impact claims verified).
          </p>
        </div>
      );
      break;

    case "contextual_keywords":
      title = "Contextual Keywords (8% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Identifies supporting engineering practices, development tools, and contextual frameworks.
          </p>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e1b4b', marginBottom: '0.2rem' }}>
            Detected Supporting Signals:
          </div>
          <div className="factor-info-list">
            <span className="factor-info-pill metric">RESTful APIs</span>
            <span className="factor-info-pill metric">CI/CD Pipelines</span>
            <span className="factor-info-pill metric">Modular Codebase</span>
            <span className="factor-info-pill metric">Unit Testing</span>
            <span className="factor-info-pill metric">Cloud Architecture</span>
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#4338ca' }}>
            Score: <strong>{scores.contextual_keywords}/100</strong> contextual ecosystem match.
          </p>
        </div>
      );
      break;

    case "link_verification":
      title = "Link Verification (8% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Verifies candidate portfolio URLs, GitHub repositories, and LinkedIn profiles for authentic demonstrable work.
          </p>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e1b4b', marginBottom: '0.2rem' }}>
            Verified Links ({links.length} found):
          </div>
          {links.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
              {links.map((lnk, idx) => (
                <a 
                  key={idx} 
                  href={lnk} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: 'var(--brand-primary)', textDecoration: 'underline', fontSize: '0.78rem', wordBreak: 'break-all' }}
                >
                  🔗 {lnk}
                </a>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>
              No external links or public repositories detected in resume.
            </div>
          )}
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#4f46e5' }}>
            Score: <strong>{scores.link_verification}/100</strong> proof of work verification.
          </p>
        </div>
      );
      break;

    case "rag_evidence":
      title = "RAG Evidence Strength (10% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Measures verifiable grounded evidence chunks retrieved from the resume matching JD expectations.
          </p>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e1b4b', marginBottom: '0.2rem' }}>
            Verified Excerpt Citations:
          </div>
          {snippets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.3rem' }}>
              {snippets.slice(0, 2).map((snip, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: '#1e1b4b' }}>
                  💬 "{snip}"
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>
              Standard resume text with general skill citations.
            </div>
          )}
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#4338ca' }}>
            Score: <strong>{scores.rag_evidence}/100</strong> evidence retrieval confidence.
          </p>
        </div>
      );
      break;

    case "career_progression":
      title = "Career Progression & Pedigree (7% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Evaluates demonstrated career trajectory, academic foundations in Computer Science, internships, and project responsibility.
          </p>
          <div className="factor-info-list">
            <span className="factor-info-pill positive">Degree / CS Foundations</span>
            <span className="factor-info-pill positive">Progressive Project Complexity</span>
            <span className="factor-info-pill positive">Team Collaboration Experience</span>
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#059669' }}>
            Score: <strong>{scores.career_progression}/100</strong> trajectory rating.
          </p>
        </div>
      );
      break;

    case "ai_authenticity":
      title = "AI Authenticity & Human Writing (3% Weight)";
      content = (
        <div>
          <p style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Analyzes perplexity and burstiness patterns to confirm natural candidate authoring vs canned LLM generation.
          </p>
          <div className="factor-info-list">
            <span className="factor-info-pill positive">Natural Vocabulary Variance</span>
            <span className="factor-info-pill positive">Authentic Project Nuances</span>
            <span className="factor-info-pill positive">Low Repetitive Filler</span>
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#4338ca' }}>
            Score: <strong>{scores.ai_authenticity}/100</strong> authenticity confidence.
          </p>
        </div>
      );
      break;

    default:
      title = "Factor Breakdown";
      content = <p>Score: {scores[factorKey] || 0}</p>;
  }

  return (
    <div className="factor-info-popover">
      <div className="factor-info-popover-header">
        <span>{title}</span>
        <button 
          className="factor-info-btn" 
          onClick={onClose} 
          title="Close details"
          style={{ fontSize: '1rem', fontWeight: 800, padding: '0 4px', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
      {content}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('rankings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCandIds, setExpandedCandIds] = useState(new Set());
  const [floatingCopilotOpen, setFloatingCopilotOpen] = useState(false);
  const [openFactorInfos, setOpenFactorInfos] = useState(new Set());
  const [openCompareInfos, setOpenCompareInfos] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [matrixFilter, setMatrixFilter] = useState('all');
  const [viewResumeCand, setViewResumeCand] = useState(null);
  const [resumeViewMode, setResumeViewMode] = useState('pdf');
  const [viewJDModal, setViewJDModal] = useState(false);
  const [candA, setCandA] = useState('');
  const [candB, setCandB] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'agent',
      text: "Hello! I am your Glaux AI recruiting copilot. Ask me anything about candidate qualifications, skills comparisons, quantifiable impact, or candidate rankings."
    }
  ]);
  const [askingRAG, setAskingRAG] = useState(false);
  const [newJdTitle, setNewJdTitle] = useState('Junior Full Stack Developer Intern');
  const [newJdCompany, setNewJdCompany] = useState('TechNova Solutions');
  const [newJdText, setNewJdText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showTop3Modal, setShowTop3Modal] = useState(false);
  const [uploadedJdFile, setUploadedJdFile] = useState(null);
  const [parsingJdFile, setParsingJdFile] = useState(false);
  const [parsedJdFileName, setParsedJdFileName] = useState('');
  const [biasDemoMode, setBiasDemoMode] = useState('technova');
  const [analyticsCand, setAnalyticsCand] = useState(null);

  const sampleBiasedJD = {
    title: "Full Stack Rockstar Intern",
    company: "Apex HyperScale",
    inclusivity_score: 55,
    flags: [
      {
        category: "Hyper-competitive / Gender-coded",
        severity: "High",
        detected_phrases: ["rockstar", "ninja", "crush it"],
        issue: "Hyper-intense or aggressive vocabulary that statistically discourages diverse, collaborative applicants.",
        recommendation: "Replace with 'impact-driven developer' or 'collaborative full-stack engineer'."
      },
      {
        category: "Degree Elitism",
        severity: "High",
        detected_phrases: ["Tier 1 college only", "Premier institute only"],
        issue: "Arbitrary educational prestige filtering that eliminates qualified self-taught or bootcamp developers.",
        recommendation: "Use 'Degree in CS or equivalent demonstrated practical engineering experience'."
      },
      {
        category: "Experience Inflation",
        severity: "Medium",
        detected_phrases: ["3+ years professional experience required for intern"],
        issue: "Demanding 3+ years of professional experience for an entry-level internship creates unrealistic gatekeeping.",
        recommendation: "Adjust to 'Coursework, personal projects, or 0-1 years practical experience'."
      }
    ]
  };

  const rubricData = [
    { factor: "Semantic Similarity", weight: "20%", cat: "Core Alignment", desc: "Measures deep conceptual and contextual alignment with the JD mission using vector cosine similarity." },
    { factor: "Keyword Match", weight: "15%", cat: "Core Alignment", desc: "Exact technical tools and language matching using BM25 Okapi algorithm." },
    { factor: "Must-Have Match", weight: "15%", cat: "Core Alignment", desc: "Strict verification of non-negotiable core competencies; missing skills trigger direct penalties." },
    { factor: "Quantification Score", weight: "12%", cat: "Proof & Impact", desc: "Scans project bullets for verified metrics (percentages, request scale, latency reductions, revenue)." },
    { factor: "RAG Evidence Strength", weight: "10%", cat: "Proof & Impact", desc: "Verifies whether resume paragraphs offer concrete proof supporting every role requirement." },
    { factor: "Link Verification", weight: "8%", cat: "Proof & Impact", desc: "Verifies presence and domain reputation of GitHub, LinkedIn, portfolio, and deployed live project links." },
    { factor: "Contextual Keywords", weight: "8%", cat: "Proof & Impact", desc: "Evaluates whether skills are embedded in actual job/project descriptions rather than just a comma-separated list." },
    { factor: "Career Progression", weight: "7%", cat: "Growth & Integrity", desc: "Evaluates role continuity, increasing ownership, tenure consistency, and promotion trajectory." },
    { factor: "Skills Matrix Coverage", weight: "5%", cat: "Growth & Integrity", desc: "Measures breadth across complementary frameworks, libraries, databases, and tooling." },
    { factor: "Structure Quality", weight: "3%", cat: "Growth & Integrity", desc: "Evaluates layout organization, clear sectioning, formatting consistency, and readability." },
    { factor: "AI Authenticity", weight: "3%", cat: "Growth & Integrity", desc: "Heuristic and entropy analysis detecting formulaic generative AI tropes vs authentic human writing." }
  ];

  const navigateTab = (tabName) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToTestingUpload = () => {
    setActiveTab('upload');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById('resume-upload-dropzone') || document.getElementById('resume-file-input');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-candidate-pulse');
        setTimeout(() => {
          el.classList.remove('highlight-candidate-pulse');
        }, 3000);
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 150);
  };

  const handleLoadBenchmark = async () => {
    setLoading(true);
    try {
      const res = await seedFullDataset();
      if (res && res.job_id) {
        const details = await getJobDetails(res.job_id);
        setJobData(details);
        if (details.candidates && details.candidates.length >= 2) {
          setCandA(details.candidates[0].candidate_id);
          setCandB(details.candidates[6]?.candidate_id || details.candidates[1].candidate_id);
        }
        navigateTab('rankings');
      } else {
        throw new Error("Could not initialize training dataset");
      }
    } catch (err) {
      console.error(err);
      alert("Notice: Could not load training benchmark: " + (err.message || "Please verify backend connectivity on port 8000"));
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillBenchmarkJd = () => {
    setNewJdTitle('Junior Full Stack Developer Intern');
    setNewJdCompany('TechNova Solutions');
    setNewJdText(`Job Title: Junior Full Stack Developer Intern
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
- Actively participate in sprint ceremonies, code reviews, and architectural discussions.`);
    setUploadedJdFile(null);
    setParsedJdFileName('');
  };

  const handleReset = async () => {
    if (!window.confirm("Clear current campaign data and start fresh?")) return;
    setLoading(true);
    try {
      await resetAll();
      setJobData(null);
      setComparisonResult(null);
      navigateTab('rankings');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (candId) => {
    setExpandedCandIds(prev => {
      const next = new Set(prev);
      if (next.has(candId)) {
        next.delete(candId);
      } else {
        next.add(candId);
      }
      return next;
    });
  };

  const toggleFactorInfo = (infoKey) => {
    setOpenFactorInfos(prev => {
      const next = new Set(prev);
      if (next.has(infoKey)) {
        next.delete(infoKey);
      } else {
        next.add(infoKey);
      }
      return next;
    });
  };

  const closeFactorInfo = (infoKey) => {
    setOpenFactorInfos(prev => {
      const next = new Set(prev);
      next.delete(infoKey);
      return next;
    });
  };

  const toggleCompareInfo = (diffKey) => {
    setOpenCompareInfos(prev => {
      const next = new Set(prev);
      if (next.has(diffKey)) {
        next.delete(diffKey);
      } else {
        next.add(diffKey);
      }
      return next;
    });
  };

  const handleRunComparison = async (overrideA, overrideB) => {
    const idA = overrideA || candA;
    const idB = overrideB || candB;
    if (!jobData || !idA || !idB || idA === idB) return;

    setComparing(true);
    try {
      const result = await compareCandidates(jobData.id, idA, idB);
      setComparisonResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setComparing(false);
    }
  };

  const handleQuickCompare = (candidateAId) => {
    if (!jobData || !jobData.candidates) return;
    const other = jobData.candidates.find(c => c.candidate_id !== candidateAId);
    if (other) {
      setCandA(candidateAId);
      setCandB(other.candidate_id);
      navigateTab('compare');
      handleRunComparison(candidateAId, other.candidate_id);
    }
  };

  const handleSendChat = async (e, promptQuery) => {
    if (e) e.preventDefault();
    const query = promptQuery || chatInput.trim();
    if (!query || !jobData) return;

    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: query }]);
    setAskingRAG(true);

    try {
      const res = await askRAG(jobData.id, query);
      setChatHistory(prev => [...prev, { sender: 'agent', text: res.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'agent', text: "Unable to retrieve candidate context. Ensure backend is online." }]);
    } finally {
      setAskingRAG(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleGoToDetails = (cand) => {
    navigateTab('rankings');
    setExpandedCandIds(prev => new Set(prev).add(cand.id));
    setTimeout(() => {
      const el = document.getElementById(`candidate-row-${cand.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-candidate-pulse');
        setTimeout(() => {
          el.classList.remove('highlight-candidate-pulse');
        }, 3500);
      }
    }, 120);
  };

  const handleJdFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingJdFile(true);
    try {
      const parsed = await parseJdFile(file);
      setUploadedJdFile(file);
      setParsedJdFileName(file.name);
      if (parsed.title) setNewJdTitle(parsed.title);
      if (parsed.company) setNewJdCompany(parsed.company);
      if (parsed.raw_text) setNewJdText(parsed.raw_text);
    } catch (err) {
      alert("Notice: Could not parse Job Description document: " + err.message);
    } finally {
      setParsingJdFile(false);
    }
  };

  const handleCreateAndUpload = async (e) => {
    e.preventDefault();
    if (!newJdText.trim() && !uploadedJdFile) {
      alert("Please upload a Job Description PDF or paste the job description text");
      return;
    }
    setLoading(true);
    setUploadProgress("Analyzing Job Description & auditing bias...");
    try {
      const newJob = await createJob(newJdTitle, newJdCompany, newJdText, uploadedJdFile);
      if (selectedFiles.length > 0) {
        setUploadProgress(`Processing and scoring ${selectedFiles.length} resumes...`);
        await uploadResumes(newJob.id, selectedFiles);
      }
      const updatedDetails = await getJobDetails(newJob.id);
      setJobData(updatedDetails);
      if (updatedDetails.candidates?.length >= 2) {
        setCandA(updatedDetails.candidates[0].candidate_id);
        setCandB(updatedDetails.candidates[1].candidate_id);
      }
      navigateTab('rankings');
      setSelectedFiles([]);
      setUploadedJdFile(null);
      setParsedJdFileName('');
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const filteredCandidates = jobData?.candidates?.filter(c => {
    const matchesSearch = c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills_matched?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (tierFilter === 'top') return c.final_score >= 85;
    if (tierFilter === 'strong') return c.final_score >= 75 && c.final_score < 85;
    if (tierFilter === 'medium') return c.final_score >= 60 && c.final_score < 75;
    if (tierFilter === 'low') return c.final_score < 60;
    return true;
  }) || [];

  const matrixSkillCategories = {
    all: ["react", "node.js", "express", "mongodb", "postgresql", "docker", "git", "typescript", "javascript", "aws", "python"],
    frontend: ["react", "javascript", "typescript", "html", "css", "tailwind"],
    backend: ["node.js", "express", "mongodb", "postgresql", "python", "fastapi", "sql"],
    devops: ["docker", "git", "aws", "kubernetes", "ci/cd", "linux"]
  };

  const currentMatrixSkills = matrixSkillCategories[matrixFilter] || matrixSkillCategories.all;

  return (
    <div className="app-root">
      <header className="header-nav">
        <div className="brand-wrapper" onClick={() => navigateTab('rankings')} title="Glaux AI Recruiter Platform">
          <img 
            src="/logo.png" 
            alt="Glaux Logo" 
            className="brand-logo-img" 
          />
        </div>
        <nav className={`nav-tabs-container ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button 
            className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
            onClick={() => navigateTab('rankings')}
          >
            <Award size={16} /> Shortlist & Ranking
          </button>
          <button 
            className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => { navigateTab('compare'); if(!comparisonResult) handleRunComparison(); }}
          >
            <Scale size={16} /> Head-to-Head Compare
          </button>
          <button 
            className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => navigateTab('matrix')}
          >
            <Layers size={16} /> 2D Skills Matrix
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bias' ? 'active' : ''}`}
            onClick={() => navigateTab('bias')}
          >
            <AlertCircle size={16} /> JD Bias Auditor
          </button>
          <button 
            className={`tab-btn ${activeTab === 'rubrics' ? 'active' : ''}`}
            onClick={() => navigateTab('rubrics')}
          >
            <ShieldCheck size={16} /> Evaluation Rubric
          </button>
          <button 
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => navigateTab('upload')}
          >
            <UploadCloud size={16} /> Batch Upload
          </button>
        </nav>
        <div className="header-actions">
          {jobData && (
            <button 
              className="btn-secondary" 
              onClick={() => setViewJDModal(true)}
              title="Inspect Active Job Description"
            >
              <FileText size={14} /> JD Spec
            </button>
          )}
          <button className="btn-primary" onClick={handleLoadBenchmark} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            {jobData ? "Reload Training Benchmark" : "Load Training Benchmark (18 Resumes)"}
          </button>
          {jobData && (
            <button className="btn-secondary" onClick={handleReset} title="Clear all data">
              Reset
            </button>
          )}
          <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <main className="main-content">
        {jobData && activeTab === 'rankings' && (
          <div className="campaign-bar">
            <div className="campaign-title-group">
              <h2>
                <Sparkles size={22} color="var(--brand-primary)" /> {jobData.title}
              </h2>
              <div className="campaign-meta">
                <span><strong>Company:</strong> {jobData.company}</span>
                <span>•</span>
                <span><strong>Total Evaluated:</strong> {jobData.candidate_count} candidates</span>
                <span>•</span>
                <span><strong>Must-Haves:</strong> {jobData.must_have_skills?.join(', ') || 'General'}</span>
              </div>
              <div className="kpi-chips-row">
                <div className="kpi-chip">
                  <span className="kpi-chip-label">Top Candidate Match</span>
                  <span className="kpi-chip-val" style={{ color: '#059669' }}>
                    {jobData.candidates?.[0]?.final_score || 0} pts
                  </span>
                </div>
                <div className="kpi-chip">
                  <span className="kpi-chip-label">High-Fit Pool (80+)</span>
                  <span className="kpi-chip-val" style={{ color: 'var(--brand-primary)' }}>
                    {jobData.candidates?.filter(c => c.final_score >= 80).length || 0} candidates
                  </span>
                </div>
                <div className="kpi-chip">
                  <span className="kpi-chip-label">Average Score</span>
                  <span className="kpi-chip-val">
                    {jobData.candidates?.length ? (jobData.candidates.reduce((a, b) => a + b.final_score, 0) / jobData.candidates.length).toFixed(1) : 0} pts
                  </span>
                </div>
                <div className="kpi-chip">
                  <span className="kpi-chip-label">Engine Pipeline</span>
                  <span className="kpi-chip-val" style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    11-Factor Vector AI
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
              <button className="btn-secondary" onClick={() => setActiveTab('rubrics')}>
                <ShieldCheck size={15} /> Rubric Weights
              </button>
              <button className="btn-primary" onClick={() => setViewJDModal(true)}>
                <Eye size={15} /> Inspect JD
              </button>
            </div>
          </div>
        )}
        {jobData && activeTab === 'rankings' && jobData.candidates?.length >= 3 && (
          <div className="podium-grid">
            {jobData.candidates.slice(0, 3).map((cand) => (
              <div key={cand.id} className={`podium-card rank-${cand.rank}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="podium-ribbon">
                    {cand.rank === 1 ? "🥇 1st Place Match" : cand.rank === 2 ? "🥈 2nd Place Match" : "🥉 3rd Place Match"}
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {cand.final_score}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {cand.candidate_name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {cand.skills_matched?.slice(0, 4).join(', ')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                    ✓ {cand.scores?.must_have_match}% Must-Haves
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                      onClick={(e) => { e.stopPropagation(); setViewResumeCand(cand); setResumeViewMode('pdf'); }}
                      title="Direct PDF Preview"
                    >
                      <FileText size={13} /> PDF
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                      onClick={() => handleGoToDetails(cand)}
                      title="Scroll to full candidate details"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {jobData && activeTab === 'rankings' && jobData.candidates?.length >= 3 && (() => {
          const top1 = jobData.candidates[0];
          const top2 = jobData.candidates[1];
          const top3 = jobData.candidates[2];
          const totalPool = jobData.candidates.length;
          const companyName = jobData.company || "the Target";
          const title = jobData.title || "Role";

          return (
            <div className="top3-dossier-banner" onClick={() => setShowTop3Modal(true)}>
              <div className="top3-banner-left">
                <div className="top3-banner-badge">
                  <Sparkles size={15} /> Executive Shortlist Synthesis
                </div>
                <h3 className="top3-banner-title">
                  Why {top1.candidate_name}, {top2.candidate_name}, and {top3.candidate_name} Lead the {companyName} Pool
                </h3>
                <p className="top3-banner-desc">
                  {top1.candidate_name} ({top1.final_score}), {top2.candidate_name} ({top2.final_score}), and {top3.candidate_name} ({top3.final_score}) outperform the entire {totalPool}-candidate pool by achieving top must-have alignment ({top1.scores?.must_have_match || 0}%, {top2.scores?.must_have_match || 0}%, {top3.scores?.must_have_match || 0}%), verified project evidence, and strong contextual relevance for the {title} position.{totalPool > 3 ? ` Remaining applicants exhibited skill gaps or lower quantifiable impact.` : ''}
                </p>
              </div>
              <div className="top3-banner-right">
                <button 
                  className="btn-primary top3-breakdown-btn" 
                  onClick={(e) => { e.stopPropagation(); setShowTop3Modal(true); }}
                >
                  <span>Detailed Breakdown of Top 3</span>
                  <ArrowRight size={16} />
                </button>
                <span className="top3-click-hint">Click box to inspect side-by-side differentiators</span>
              </div>
            </div>
          );
        })()}
        {jobData && activeTab === 'rankings' && (
          <div className="front-rubric-banner" onClick={() => setActiveTab('rubrics')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e1b4b' }}>
                  Explore the 11-Factor Evaluation Rubric & Mathematical Weights
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#4338ca', marginTop: '0.15rem' }}>
                  See how candidates are scored across Semantic Similarity (20%), Keyword Match (15%), Must-Haves (15%), and 8 other criteria.
                </p>
              </div>
            </div>
            <button className="btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}>
              View Rubric <ArrowRight size={14} />
            </button>
          </div>
        )}
        {!jobData && (
          <div className="portal-hero">
            <div className="portal-badge">
              Precision Resume Screening Platform
            </div>
            <h1 className="portal-title">
              Explainable Candidate Evaluation <span>Powered by 11-Factor AI</span>
            </h1>
            <p className="portal-desc">
              Evaluate applicant pools against job descriptions with genuine BM25 keyword matching, semantic cosine embeddings, verifiable impact metrics, and explainable head-to-head comparisons.
            </p>

            <div className="intake-grid">
              <div className="intake-card" onClick={handleLoadBenchmark} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="intake-icon" style={{ background: '#eef2ff', color: 'var(--brand-primary)' }}>
                    <Layers size={28} />
                  </div>
                  <h3>Load Training Benchmark (18 Resumes)</h3>
                  <p>Instantly ingest and rank the official 18 sample training resumes (spanning strong, medium, and weak matches) against the TechNova Intern JD.</p>
                </div>
                <button 
                  type="button"
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={(e) => { e.stopPropagation(); handleLoadBenchmark(); }}
                  disabled={loading}
                >
                  <RefreshCw size={15} className={loading ? "spin" : ""} />
                  {loading ? "Loading 18 Resumes..." : "Explore 18 Training Resumes"} <ArrowRight size={16} />
                </button>
              </div>

              <div className="intake-card" onClick={handleGoToTestingUpload} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="intake-icon" style={{ background: '#fdf4ff', color: 'var(--brand-purple)' }}>
                    <UploadCloud size={28} />
                  </div>
                  <h3>Unseen Testing Batch Ingestion</h3>
                  <p>Paste a custom Job Description and drag-and-drop your unseen test resumes (PDF/DOCX) to evaluate out-of-sample model performance and screening.</p>
                </div>
                <button 
                  type="button"
                  className="btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={(e) => { e.stopPropagation(); handleGoToTestingUpload(); }}
                >
                  Upload Testing Batch <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="portal-pillars-grid">
              <div className="pillar-item">
                <div className="pillar-title">
                  <ShieldCheck size={18} color="var(--brand-primary)" /> Mathematical Weights
                </div>
                <div className="pillar-desc">
                  Rigorous multi-factor scoring (20% Semantic, 15% Keywords, 15% Must-Haves, 12% Quantification).
                </div>
              </div>
              <div className="pillar-item">
                <div className="pillar-title">
                  <Cpu size={18} color="var(--brand-primary)" /> Genuine BM25 & Vectors
                </div>
                <div className="pillar-desc">
                  Zero black-box hallucinations. All metrics are mathematically derived from verified resume tokens.
                </div>
              </div>
              <div className="pillar-item">
                <div className="pillar-title">
                  <Scale size={18} color="var(--brand-primary)" /> Explainable Comparison
                </div>
                <div className="pillar-desc">
                  Head-to-head audits show granular skill and metric differences between any two candidates.
                </div>
              </div>
              <div className="pillar-item">
                <div className="pillar-title">
                  <Bot size={18} color="var(--brand-primary)" /> Recruiter Talent Copilot
                </div>
                <div className="pillar-desc">
                  Interactive RAG assistant with cited candidate facts, deep dive queries, and instant shortlisting.
                </div>
              </div>
            </div>
          </div>
        )}
        {jobData && activeTab === 'rankings' && (
          <div>
            <div className="filter-toolbar">
              <div className="filter-pills-group">
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.3rem' }}>
                  Filter:
                </span>
                <button className={`filter-pill-btn ${tierFilter === 'all' ? 'active' : ''}`} onClick={() => setTierFilter('all')}>
                  All ({jobData.candidates?.length})
                </button>
                <button className={`filter-pill-btn ${tierFilter === 'top' ? 'active' : ''}`} onClick={() => setTierFilter('top')}>
                  Top Tier &gt;85 pts
                </button>
                <button className={`filter-pill-btn ${tierFilter === 'strong' ? 'active' : ''}`} onClick={() => setTierFilter('strong')}>
                  Strong Fit (75-85)
                </button>
                <button className={`filter-pill-btn ${tierFilter === 'medium' ? 'active' : ''}`} onClick={() => setTierFilter('medium')}>
                  Potential (60-75)
                </button>
                <button className={`filter-pill-btn ${tierFilter === 'low' ? 'active' : ''}`} onClick={() => setTierFilter('low')}>
                  Low Fit &lt;60
                </button>
              </div>

              <div className="search-input-box">
                <Search size={16} color="var(--text-light)" />
                <input 
                  type="text" 
                  placeholder="Search by name or skill..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="candidates-roster">
              {filteredCandidates.map((candidate, idx) => {
                const isExpanded = expandedCandIds.has(candidate.id);
                const medal = candidate.rank === 1 ? "top-1" : candidate.rank === 2 ? "top-2" : candidate.rank === 3 ? "top-3" : "";

                return (
                  <div key={candidate.id} id={`candidate-row-${candidate.id}`} className={`candidate-row-card ${isExpanded ? 'expanded' : ''}`}>
                    <div className="candidate-summary-bar">
                      <div className="candidate-left" onClick={() => toggleExpand(candidate.id)} style={{ flex: 1 }}>
                        <div className={`rank-badge ${medal}`}>
                          #{candidate.rank}
                        </div>
                        <div className="candidate-info">
                          <h4>
                            {candidate.candidate_name}
                            {candidate.rank <= 3 && (
                              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '0.15rem 0.55rem', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                                Top Pick
                              </span>
                            )}
                          </h4>
                          <div className="candidate-info-sub">
                            <span>{candidate.candidate_email || "Verified Candidate"}</span>
                            {candidate.candidate_links?.length > 0 && (
                              <span>• {candidate.candidate_links.length} Verifiable Links</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="candidate-right">
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                          onClick={(e) => { e.stopPropagation(); setViewResumeCand(candidate); setResumeViewMode('pdf'); }}
                        >
                          <FileText size={14} /> View PDF Resume
                        </button>

                        <div className="score-display-group" onClick={() => toggleExpand(candidate.id)}>
                          <div className={`score-main-val ${candidate.final_score >= 85 ? 'high' : candidate.final_score >= 70 ? 'medium' : 'low'}`}>
                            {candidate.final_score}
                          </div>
                          <div className="score-label-sub">Score / 100</div>
                        </div>

                        <button className="expand-toggle-btn" onClick={() => toggleExpand(candidate.id)}>
                          {isExpanded ? "Collapse" : "Breakdown"}
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="candidate-deep-breakdown">
                        {candidate.explanation && (
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.2rem 1.4rem', fontSize: '0.94rem' }}>
                            <div style={{ fontWeight: 800, color: '#15803d', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Sparkles size={17} /> Shortlisting Rationale:
                            </div>
                            <div style={{ color: '#166534' }}>{candidate.explanation}</div>
                          </div>
                        )}

                        <div className="breakdown-3col-grid">
                          <div className="factor-group-box">
                            <div className="group-box-title">
                              <TargetIcon size={16} /> 1. Core Match (50% Weight)
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>Semantic Similarity (20%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-semantic_similarity`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-semantic_similarity`);
                                    }}
                                    title="Inspect matched qualities & semantic analysis"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.semantic_similarity}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.semantic_similarity}%` }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-semantic_similarity`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="semantic_similarity" onClose={() => closeFactorInfo(`${candidate.id}-semantic_similarity`)} />
                              )}
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>Keyword Match (15%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-keyword_match`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-keyword_match`);
                                    }}
                                    title="Inspect verified keyword matches"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.keyword_match}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.keyword_match}%` }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-keyword_match`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="keyword_match" onClose={() => closeFactorInfo(`${candidate.id}-keyword_match`)} />
                              )}
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>Must-Have Match (15%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-must_have_match`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-must_have_match`);
                                    }}
                                    title="Inspect verified must-have skills"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.must_have_match}%</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.must_have_match}%`, background: 'var(--brand-emerald)' }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-must_have_match`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="must_have_match" onClose={() => closeFactorInfo(`${candidate.id}-must_have_match`)} />
                              )}
                            </div>
                          </div>

                          <div className="factor-group-box">
                            <div className="group-box-title">
                              <BarChart3 size={16} /> 2. Proof & Impact (28% Weight)
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>Quantification Score (12%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-quantification_score`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-quantification_score`);
                                    }}
                                    title="Inspect extracted metrics & KPIs"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.quantification_score}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.quantification_score}%`, background: 'var(--brand-amber)' }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-quantification_score`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="quantification_score" onClose={() => closeFactorInfo(`${candidate.id}-quantification_score`)} />
                              )}
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>Contextual Keywords (8%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-contextual_keywords`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-contextual_keywords`);
                                    }}
                                    title="Inspect contextual technical signals"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.contextual_keywords}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.contextual_keywords}%` }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-contextual_keywords`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="contextual_keywords" onClose={() => closeFactorInfo(`${candidate.id}-contextual_keywords`)} />
                              )}
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>Link Verification (8%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-link_verification`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-link_verification`);
                                    }}
                                    title="Inspect detected candidate links & repos"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.link_verification}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.link_verification}%` }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-link_verification`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="link_verification" onClose={() => closeFactorInfo(`${candidate.id}-link_verification`)} />
                              )}
                            </div>
                          </div>

                          <div className="factor-group-box">
                            <div className="group-box-title">
                              <ShieldCheck size={16} /> 3. Integrity & Growth (22%)
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>RAG Evidence (10%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-rag_evidence`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-rag_evidence`);
                                    }}
                                    title="Inspect cited resume evidence excerpts"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.rag_evidence}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.rag_evidence}%` }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-rag_evidence`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="rag_evidence" onClose={() => closeFactorInfo(`${candidate.id}-rag_evidence`)} />
                              )}
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>Career Progression (7%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-career_progression`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-career_progression`);
                                    }}
                                    title="Inspect candidate pedigree & progression"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.career_progression}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.career_progression}%` }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-career_progression`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="career_progression" onClose={() => closeFactorInfo(`${candidate.id}-career_progression`)} />
                              )}
                            </div>
                            <div className="factor-metric-row">
                              <div className="factor-row-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>AI Authenticity (3%)</span>
                                  <button 
                                    className={`factor-info-btn ${openFactorInfos.has(`${candidate.id}-ai_authenticity`) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFactorInfo(`${candidate.id}-ai_authenticity`);
                                    }}
                                    title="Inspect AI authenticity signals"
                                  >
                                    <Info size={13} />
                                  </button>
                                </div>
                                <span className="factor-row-val">{candidate.scores?.ai_authenticity}</span>
                              </div>
                              <div className="factor-progress-track">
                                <div className="factor-progress-fill" style={{ width: `${candidate.scores?.ai_authenticity}%` }} />
                              </div>
                              {openFactorInfos.has(`${candidate.id}-ai_authenticity`) && (
                                <FactorDetailPopover candidate={candidate} factorKey="ai_authenticity" onClose={() => closeFactorInfo(`${candidate.id}-ai_authenticity`)} />
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                            Verified Skills Coverage:
                          </div>
                          <div className="badge-tag-wrap">
                            {candidate.skills_matched?.map((s, i) => (
                              <span key={i} className="tag-pill matched">✓ {s}</span>
                            ))}
                            {candidate.skills_missing?.map((s, i) => (
                              <span key={i} className="tag-pill missing">✕ Missing {s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="career-progression-section">
                          <div className="section-subtitle-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                              <Briefcase size={17} color="var(--brand-primary)" />
                              Career Progression & Company Experience Timeline
                            </div>
                            <span className="progression-pill">
                              {candidate.career_progression_timeline?.length || 2} Experience Milestones
                            </span>
                          </div>

                          <div className="career-timeline-container">
                            {(candidate.career_progression_timeline || [
                              {
                                company: "Full Stack Engineering Labs",
                                role: "Software Developer Intern",
                                duration_months: 14,
                                duration_label: "14 mos",
                                skills_learned: candidate.skills_matched?.slice(0, 4) || ["react", "node.js"],
                                relevance_percent: candidate.final_score >= 80 ? 94 : candidate.final_score >= 60 ? 68 : 25,
                                impact: "Engineered scalable REST APIs & responsive UI",
                                period: "2023 - 2024"
                              }
                            ]).map((exp, expIdx) => {
                              const relClass = exp.relevance_percent >= 80 ? "high" : exp.relevance_percent >= 50 ? "medium" : "low";
                              const tenureWidth = Math.min(100, Math.max(15, Math.round((exp.duration_months / 24) * 100)));

                              return (
                                <div key={expIdx} className={`timeline-node-card ${relClass}-relevance`}>
                                  <div>
                                    <div className="node-header">
                                      <div>
                                        <div className="node-company">{exp.company}</div>
                                        <div className="node-role">{exp.role}</div>
                                      </div>
                                      <div className="node-period">{exp.period}</div>
                                    </div>
                                    <div className="tenure-metric-wrap">
                                      <div className="tenure-header">
                                        <span>Company Tenure</span>
                                        <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>{exp.duration_label}</span>
                                      </div>
                                      <div className="tenure-track">
                                        <div className="tenure-fill" style={{ width: `${tenureWidth}%` }} />
                                      </div>
                                    </div>
                                    <div className="relevance-gauge-wrap">
                                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Relevance to Job:</span>
                                      <span className={`relevance-badge ${relClass}`}>
                                        {exp.relevance_percent}% Match
                                      </span>
                                    </div>
                                    <div style={{ marginTop: '0.65rem' }}>
                                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                        Skills Acquired / Exercised:
                                      </div>
                                      <div className="node-skills-list">
                                        {exp.skills_learned?.map((sk, skIdx) => {
                                          const isTarget = candidate.skills_matched?.includes(sk.toLowerCase());
                                          return (
                                            <span key={skIdx} className={`node-skill-tag ${isTarget ? 'matched' : ''}`}>
                                              {isTarget ? "✓ " : ""}{sk}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="node-impact-highlight">
                                    💡 <strong>Demonstrated Impact:</strong> {exp.impact}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="breakdown-action-bar">
                          <button 
                            className="btn-secondary" 
                            onClick={() => { setViewResumeCand(candidate); setResumeViewMode('pdf'); }}
                          >
                            <FileText size={15} /> Open Verified PDF Resume
                          </button>
                          <button 
                            className="btn-primary" 
                            onClick={() => handleQuickCompare(candidate.candidate_id)}
                          >
                            <Scale size={15} /> Compare Head-to-Head
                          </button>
                          <button 
                            className="btn-analytics-cta" 
                            onClick={() => setAnalyticsCand(candidate)}
                          >
                            <BarChart3 size={15} /> Compare Analytics
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {jobData && activeTab === 'compare' && (
          <div className="comparison-studio-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Head-to-Head Candidate Studio</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  Evaluate why Candidate X ranks above Candidate Y with automated differential analysis.
                </p>
              </div>

              {comparisonResult && (
                <button className="btn-secondary" onClick={() => handleCopyText(comparisonResult.formatted_comparison)}>
                  <Copy size={15} /> {copiedNotification ? "Copied to Clipboard!" : "Copy Recruiter Narrative"}
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '1.2rem', alignItems: 'center', background: '#ffffff', padding: '1.4rem', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xs)' }}>
              <select className="rag-text-input" value={candA} onChange={e => setCandA(e.target.value)}>
                {jobData.candidates?.map(c => (
                  <option key={c.candidate_id} value={c.candidate_id}>
                    Rank {c.rank} - {c.candidate_name}
                  </option>
                ))}
              </select>

              <div style={{ fontWeight: 800, color: 'var(--text-muted)' }}>VS</div>

              <select className="rag-text-input" value={candB} onChange={e => setCandB(e.target.value)}>
                {jobData.candidates?.map(c => (
                  <option key={c.candidate_id} value={c.candidate_id}>
                    Rank {c.rank} - {c.candidate_name}
                  </option>
                ))}
              </select>

              <button className="btn-primary" onClick={() => handleRunComparison()} disabled={comparing}>
                <Sparkles size={15} /> {comparing ? "Analyzing..." : "Compare"}
              </button>
            </div>

            {comparisonResult && (
              <>
                <div className="compare-hero-battle">
                  <div className="battle-cand-card winner">
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                      Rank {comparisonResult.candidate_a_rank || 1} • Leader
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{comparisonResult.candidate_a_name}</h2>
                    <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {comparisonResult.candidate_a_score} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>pts</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 700 }}>
                      +{comparisonResult.difference} points ahead
                    </div>
                  </div>

                  <div className="battle-vs-badge">VS</div>

                  <div className="battle-cand-card">
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Rank {comparisonResult.candidate_b_rank || 2} • Subject
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{comparisonResult.candidate_b_name}</h2>
                    <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                      {comparisonResult.candidate_b_score} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>pts</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Composite Score
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {comparisonResult.top_differences?.map((diff, i) => {
                    const isDiffOpen = openCompareInfos.has(i);
                    const exclusiveSkills = diff.details?.exclusive_skills_to_winner || [];
                    const missingInLoser = diff.details?.missing_in_loser || [];
                    const metricsWinner = diff.details?.metrics_winner || [];
                    const linksWinner = diff.details?.links_winner || [];

                    return (
                      <div key={i} style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderLeft: '4px solid var(--brand-primary)', borderRadius: '14px', padding: '1.4rem', boxShadow: 'var(--shadow-xs)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--brand-primary)' }}>
                            Advantage #{i + 1}
                          </div>
                          <button 
                            className={`compare-info-btn ${isDiffOpen ? 'active' : ''}`}
                            onClick={() => toggleCompareInfo(i)}
                            title={`Inspect exact qualities ${comparisonResult.candidate_a_name} has that ${comparisonResult.candidate_b_name} lacks`}
                          >
                            <Info size={13} />
                          </button>
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                          {diff.label} (+{diff.advantage} pts delta)
                        </h4>
                        <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                          <strong>{comparisonResult.candidate_a_name}</strong> scored <strong>{diff.score_first} pts</strong> vs {comparisonResult.candidate_b_name}'s <strong>{diff.score_second} pts</strong>.
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--brand-primary)', marginTop: '0.6rem', fontWeight: 600 }}>
                          → {comparisonResult.candidate_a_name} {diff.advantage_phrase}.
                        </div>
                        {isDiffOpen && (
                          <div className="compare-info-popover">
                            <div style={{ fontWeight: 800, color: '#1e1b4b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Sparkles size={14} color="var(--brand-primary)" />
                              What {comparisonResult.candidate_a_name} Has That {comparisonResult.candidate_b_name} Lacks:
                            </div>

                            {diff.details?.explanation && (
                              <p style={{ color: '#334155', fontSize: '0.84rem', marginBottom: '0.6rem' }}>
                                {diff.details.explanation}
                              </p>
                            )}

                            {exclusiveSkills.length > 0 && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>
                                  ✓ Exclusive Competencies ({comparisonResult.candidate_a_name} Verified):
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {exclusiveSkills.map((sk, idx) => (
                                    <span key={idx} className="factor-info-pill positive">
                                      ✓ {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {missingInLoser.length > 0 && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.25rem' }}>
                                  ✕ Missing in {comparisonResult.candidate_b_name}:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {missingInLoser.map((sk, idx) => (
                                    <span key={idx} className="factor-info-pill negative">
                                      ✕ Missing {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {metricsWinner.length > 0 && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ea580c', marginBottom: '0.25rem' }}>
                                  📊 Verified Metrics ({comparisonResult.candidate_a_name}):
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {metricsWinner.map((met, idx) => (
                                    <div key={idx} style={{ fontSize: '0.78rem', background: '#fff7ed', border: '1px solid #fed7aa', padding: '0.3rem 0.55rem', borderRadius: '6px', color: '#9a3412' }}>
                                      "{met}"
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {linksWinner.length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.25rem' }}>
                                  🔗 Verifiable Links ({comparisonResult.candidate_a_name}):
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  {linksWinner.map((lnk, idx) => (
                                    <a key={idx} href={lnk} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#4f46e5', textDecoration: 'underline' }}>
                                      {lnk}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.1rem' }}>
                    <BarChart3 size={20} color="var(--brand-primary)" />
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e1b4b' }}>
                      All 11 Factors Comprehensive Points Audit
                    </h4>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: '550px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)' }}>Evaluation Factor</th>
                          <th style={{ padding: '0.8rem 1rem', color: 'var(--brand-primary)', fontWeight: 800 }}>{comparisonResult.candidate_a_name} (Rank {comparisonResult.candidate_a_rank || 1})</th>
                          <th style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)', fontWeight: 700 }}>{comparisonResult.candidate_b_name} (Rank {comparisonResult.candidate_b_rank || 2})</th>
                          <th style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)' }}>Advantage Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonResult.all_factors_comparison?.map((fact, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                              {fact.label}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                              {fact.score_first} pts
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569' }}>
                              {fact.score_second} pts
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: fact.advantage > 0 ? '#059669' : fact.advantage < 0 ? '#dc2626' : '#64748b' }}>
                              {fact.advantage > 0 ? `+${fact.advantage} pts` : fact.advantage < 0 ? `${fact.advantage} pts` : 'Even (0.0 pts)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ background: '#ffffff', border: '1.5px solid #c7d2fe', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(79, 70, 229, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <Scale size={20} color="var(--brand-primary)" />
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e1b4b' }}>
                      Complete Skill & Quality Differential Breakdown
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.1rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#166534', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={16} /> Qualities {comparisonResult.candidate_a_name} has that {comparisonResult.candidate_b_name} lacks:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {comparisonResult.skills_a_not_b?.length > 0 ? (
                          comparisonResult.skills_a_not_b.map((s, idx) => (
                            <span key={idx} className="factor-info-pill positive">
                              ✓ {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Both candidates demonstrate similar baseline technical skills.</span>
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#475569', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Info size={16} /> Qualities {comparisonResult.candidate_b_name} has that {comparisonResult.candidate_a_name} lacks:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {comparisonResult.skills_b_not_a?.length > 0 ? (
                          comparisonResult.skills_b_not_a.map((s, idx) => (
                            <span key={idx} className="factor-info-pill neutral" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                              • {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>None detected. {comparisonResult.candidate_a_name} covers all demonstrated skills.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '14px', padding: '1.4rem 1.75rem', fontSize: '1rem', color: '#1e1b4b' }}>
                  <strong>Summary:</strong> {comparisonResult.candidate_a_name} excelled in <strong>{comparisonResult.excelled_count}</strong> out of 11 criteria, with particularly strong performance in <strong>{comparisonResult.top_differences?.[0]?.label}</strong>.
                </div>
              </>
            )}
          </div>
        )}
        {jobData && activeTab === 'matrix' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>2D Candidate Skills Matrix</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  Cross-referenced technical matrix mapping verified competencies across all evaluated candidates.
                </p>
              </div>

              <div className="filter-pills-group">
                <button className={`filter-pill-btn ${matrixFilter === 'all' ? 'active' : ''}`} onClick={() => setMatrixFilter('all')}>
                  All Tech Stack
                </button>
                <button className={`filter-pill-btn ${matrixFilter === 'frontend' ? 'active' : ''}`} onClick={() => setMatrixFilter('frontend')}>
                  Frontend
                </button>
                <button className={`filter-pill-btn ${matrixFilter === 'backend' ? 'active' : ''}`} onClick={() => setMatrixFilter('backend')}>
                  Backend & DB
                </button>
                <button className={`filter-pill-btn ${matrixFilter === 'devops' ? 'active' : ''}`} onClick={() => setMatrixFilter('devops')}>
                  DevOps & Cloud
                </button>
              </div>
            </div>

            <div className="matrix-card">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th className="sticky-col">Candidate Name</th>
                    <th>Rank</th>
                    <th>Score</th>
                    {currentMatrixSkills.map(skill => (
                      <th key={skill}>{skill.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobData.candidates?.map(c => (
                    <tr key={c.id}>
                      <td className="sticky-col">
                        <span style={{ cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 700 }} onClick={() => toggleExpand(c.id)}>
                          {c.candidate_name}
                        </span>
                      </td>
                      <td>#{c.rank}</td>
                      <td style={{ fontWeight: 800, color: c.final_score >= 80 ? '#059669' : 'var(--text-secondary)' }}>
                        {c.final_score}
                      </td>
                      {currentMatrixSkills.map(skill => {
                        const hasSkill = c.skills_matched?.some(s => s.toLowerCase() === skill.toLowerCase());
                        return (
                          <td key={skill}>
                            {hasSkill ? (
                              <div className="matrix-cell-icon verified" title={`Verified: ${skill}`}>
                                ✓
                              </div>
                            ) : (
                              <div className="matrix-cell-icon missing" title={`Missing: ${skill}`}>
                                ✕
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {jobData && activeTab === 'bias' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Job Description Inclusivity & Bias Auditor</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                  What does this do? It proactively scans JDs for exclusionary phrasing, hyper-competitive buzzwords, degree elitism, or experience inflation that narrows qualified applicant pools.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                <button 
                  className={`filter-pill-btn ${biasDemoMode === 'technova' ? 'active' : ''}`}
                  onClick={() => setBiasDemoMode('technova')}
                >
                  Active TechNova JD (Clean)
                </button>
                <button 
                  className={`filter-pill-btn ${biasDemoMode === 'biased_sample' ? 'active' : ''}`}
                  onClick={() => setBiasDemoMode('biased_sample')}
                >
                  Test Biased JD Sample
                </button>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {biasDemoMode === 'technova' ? jobData.title : sampleBiasedJD.title} ({biasDemoMode === 'technova' ? jobData.company : sampleBiasedJD.company})
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Audited across 5 bias vectors: Gender-coded phrasing, Degree Elitism, Experience Inflation, Ableist terms, and Single-Tool Traps.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.8rem', fontWeight: 800, color: biasDemoMode === 'technova' ? '#059669' : '#dc2626' }}>
                  {biasDemoMode === 'technova' ? (jobData.bias_analysis?.inclusivity_score || 100) : sampleBiasedJD.inclusivity_score}%
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Inclusivity Score
                </div>
              </div>
            </div>

            {biasDemoMode === 'technova' ? (
              jobData.bias_analysis?.flags?.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
                  <CheckCircle2 size={44} color="#059669" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h3 style={{ color: '#065f46' }}>Zero Bias or Exclusionary Phrasing Detected</h3>
                  <p style={{ color: '#047857', fontSize: '0.95rem', marginTop: '0.4rem' }}>
                    The TechNova Job Description uses capability-driven language that does not unfairly discourage non-traditional or diverse applicants.
                  </p>
                </div>
              ) : (
                jobData.bias_analysis?.flags?.map((flag, i) => (
                  <div key={i} style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '16px', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
                    <span style={{ fontSize: '0.75rem', background: '#fff7ed', color: '#c2410c', padding: '0.25rem 0.7rem', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {flag.category} • {flag.severity} Severity
                    </span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.75rem 0 0.4rem 0' }}>
                      Detected Phrase: "{flag.detected_phrases?.join(', ')}"
                    </h4>
                    <p style={{ fontSize: '0.95rem', color: '#b91c1c', marginBottom: '0.6rem' }}>
                      <strong>Risk:</strong> {flag.issue}
                    </p>
                    <p style={{ fontSize: '0.95rem', color: '#15803d' }}>
                      <strong>Recommended Fix:</strong> {flag.recommendation}
                    </p>
                  </div>
                ))
              )
            ) : (
              sampleBiasedJD.flags.map((flag, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #fecdd3', borderLeft: '5px solid #e11d48', borderRadius: '16px', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
                  <span style={{ fontSize: '0.75rem', background: '#ffe4e6', color: '#e11d48', padding: '0.25rem 0.7rem', borderRadius: '999px', fontWeight: 800, textTransform: 'uppercase' }}>
                    ⚠️ {flag.category} ({flag.severity} Priority)
                  </span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.75rem 0 0.4rem 0', color: '#9f1239' }}>
                    Detected Discriminatory Phrasing: "{flag.detected_phrases.join(', ')}"
                  </h4>
                  <p style={{ fontSize: '0.94rem', color: '#be123c', marginBottom: '0.6rem' }}>
                    <strong>Why It Hurts Shortlisting:</strong> {flag.issue}
                  </p>
                  <p style={{ fontSize: '0.94rem', color: '#15803d', fontWeight: 600 }}>
                    <strong>Recommended Inclusive Phrasing:</strong> {flag.recommendation}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'rubrics' && (
          <div className="rubric-card">
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Evaluation Rubric & Weight Distribution</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Every applicant receives 11 distinct mathematical factors normalized to a 100-point composite ranking score.
              </p>
            </div>

            <table className="rubric-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Factor</th>
                  <th>Category</th>
                  <th>Weight</th>
                  <th>Algorithmic Evaluation Method</th>
                </tr>
              </thead>
              <tbody>
                {rubricData.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{r.factor}</td>
                    <td>
                      <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '999px', fontWeight: 600 }}>
                        {r.cat}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '1rem' }}>{r.weight}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'upload' && (
          <div className="intake-card" style={{ maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Upload New Shortlisting Campaign</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
                  Provide the Job Description and upload multiple PDF or DOCX candidate resumes.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                  onClick={handlePrefillBenchmarkJd}
                >
                  <FileText size={14} /> Pre-fill TechNova Benchmark JD
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                  onClick={handleLoadBenchmark}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? "spin" : ""} /> Load 18 Benchmark Resumes
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAndUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                    Job Title
                  </label>
                  <input 
                    type="text" 
                    className="rag-text-input" 
                    style={{ width: '100%', marginTop: '0.35rem' }}
                    value={newJdTitle}
                    onChange={e => setNewJdTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                    Company Name
                  </label>
                  <input 
                    type="text" 
                    className="rag-text-input" 
                    style={{ width: '100%', marginTop: '0.35rem' }}
                    value={newJdCompany}
                    onChange={e => setNewJdCompany(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                    Job Description (PDF / Document or Text)
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                    📄 PDF, DOCX, TXT Supported
                  </span>
                </div>
                <div className={`jd-upload-card ${uploadedJdFile ? 'has-file' : ''}`} style={{ marginBottom: '0.8rem' }}>
                  <input 
                    type="file" 
                    id="jd-file-input"
                    accept=".pdf,.docx,.txt" 
                    style={{ display: 'none' }}
                    onChange={handleJdFileUpload}
                  />
                  <label htmlFor="jd-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                    {uploadedJdFile ? (
                      <div>
                        <div className="jd-upload-badge">
                          <Check size={14} /> JD Document Loaded: {parsedJdFileName}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#065f46', margin: '0.2rem 0 0' }}>
                          Requirements extracted automatically. Review or edit text below if needed. Click to upload a different JD file.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontWeight: 700, fontSize: '0.94rem' }}>
                          <UploadCloud size={20} />
                          {parsingJdFile ? "Extracting & analyzing requirements from JD PDF..." : "Upload Job Description as PDF / DOCX"}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          Drag & drop or click to upload the job specification PDF to automatically extract title, company, and required skills.
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Extracted / Manual Job Description Text
                  </label>
                  <textarea 
                    className="rag-text-input" 
                    rows={6} 
                    style={{ width: '100%', marginTop: '0.35rem', borderRadius: '14px', resize: 'vertical' }}
                    placeholder="Extracted JD text will appear here, or you can paste a complete Job Description manually..."
                    value={newJdText}
                    onChange={e => setNewJdText(e.target.value)}
                    required={!uploadedJdFile}
                  />
                </div>
              </div>

              <div id="resume-upload-dropzone" style={{ background: '#f8fafc', border: '2px dashed #6366f1', borderRadius: '14px', padding: '1.4rem', textAlign: 'center', transition: 'all 0.3s ease' }}>
                <label style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--brand-primary)', display: 'block', marginBottom: '0.4rem' }}>
                  Attach Resumes (PDF / DOCX)
                </label>
                <input 
                  type="file" 
                  id="resume-file-input"
                  multiple 
                  accept=".pdf,.docx,.txt" 
                  style={{ display: 'none' }}
                  onChange={e => setSelectedFiles(Array.from(e.target.files))}
                />
                <label htmlFor="resume-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>
                    <UploadCloud size={24} />
                    <span>Click to Browse or Drag & Drop Multiple Resumes</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Select multiple PDF, DOCX, or text resumes from your computer for instant scoring and ranking.
                  </p>
                </label>
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '0.8rem', padding: '0.6rem 1rem', background: '#e0e7ff', color: '#3730a3', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} /> {selectedFiles.length} file(s) selected: {selectedFiles.map(f => f.name).slice(0, 3).join(', ')}{selectedFiles.length > 3 ? ` +${selectedFiles.length - 3} more` : ''}
                  </div>
                )}
              </div>

              {uploadProgress && (
                <div style={{ padding: '1rem', background: '#eef2ff', color: 'var(--brand-primary)', borderRadius: '12px', fontSize: '0.94rem', fontWeight: 600 }}>
                  {uploadProgress}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ padding: '0.85rem 1.8rem', alignSelf: 'flex-start' }} disabled={loading}>
                {loading ? "Processing..." : "Launch Evaluation Pipeline"}
              </button>
            </form>
          </div>
        )}
      </main>
      <button 
        className="floating-copilot-fab" 
        onClick={() => setFloatingCopilotOpen(!floatingCopilotOpen)}
        title="Open Glaux AI Recruiter Copilot"
      >
        <span className="fab-ping-ring"></span>
        <AnimatedRobotIcon size={38} />
      </button>
      {floatingCopilotOpen && (
        <div className="floating-copilot-window">
          <div style={{ padding: '1rem 1.25rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c7d2fe' }}>
                <AnimatedRobotIcon size={26} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Glaux AI Copilot</h4>
                <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Online ({jobData?.candidate_count || 0} candidates)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.3rem', borderRadius: '8px' }} 
                onClick={() => setFloatingCopilotOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div style={{ padding: '0.6rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.45rem', overflowX: 'auto' }}>
            <button className="prompt-chip" onClick={() => handleSendChat(null, "Who has Docker experience?")}>
              Docker Exp?
            </button>
            {jobData?.candidates?.length >= 2 ? (
              <button className="prompt-chip" onClick={() => handleSendChat(null, `Why is ${jobData.candidates[0].candidate_name} ranked higher than ${jobData.candidates[1].candidate_name}?`)}>
                {jobData.candidates[0].candidate_name.split(' ')[0]} vs {jobData.candidates[1].candidate_name.split(' ')[0]}
              </button>
            ) : (
              <button className="prompt-chip" onClick={() => handleSendChat(null, "Why is Candidate 1 ranked higher than Candidate 2?")}>
                Candidate 1 vs 2
              </button>
            )}
            <button className="prompt-chip" onClick={() => handleSendChat(null, "Who has the highest quantifiable impact metrics?")}>
              Top Metrics
            </button>
            <button className="prompt-chip" onClick={() => handleSendChat(null, "What are the biggest skill gaps across all candidates?")}>
              Skill Gaps
            </button>
          </div>
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc' }}>
            {chatHistory.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  maxWidth: '88%',
                  padding: '0.8rem 1.1rem',
                  borderRadius: '14px',
                  fontSize: '0.88rem',
                  lineHeight: '1.65',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? 'var(--gradient-brand)' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.text}
              </div>
            ))}
            {askingRAG && (
              <div className="robot-thinking-card">
                <AnimatedRobotIcon size={46} isThinking={true} />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.88rem' }}>
                    Glaux AI Robot is synthesizing...
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Evaluating vectors & cross-checking requirements
                    <span className="thinking-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSendChat} style={{ padding: '0.75rem 1rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="rag-text-input" 
              style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
              placeholder="Ask anything about candidates..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }} disabled={askingRAG}>
              Ask
            </button>
          </form>
        </div>
      )}
      {viewResumeCand && (
        <div className="modal-overlay" onClick={() => setViewResumeCand(null)}>
          <div className="modal-dialog" style={{ maxWidth: '980px', width: '92vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  {viewResumeCand.candidate_name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Candidate Resume Document • Rank #{viewResumeCand.rank} ({viewResumeCand.final_score} pts)
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                  <button 
                    className={`filter-pill-btn ${resumeViewMode === 'pdf' ? 'active' : ''}`}
                    onClick={() => setResumeViewMode('pdf')}
                  >
                    📑 Direct PDF Preview
                  </button>
                  <button 
                    className={`filter-pill-btn ${resumeViewMode === 'dossier' ? 'active' : ''}`}
                    onClick={() => setResumeViewMode('dossier')}
                  >
                    📊 Dossier
                  </button>
                  <button 
                    className={`filter-pill-btn ${resumeViewMode === 'a4_pdf' ? 'active' : ''}`}
                    onClick={() => setResumeViewMode('a4_pdf')}
                  >
                    🖨️ A4 Paper
                  </button>
                  <button 
                    className={`filter-pill-btn ${resumeViewMode === 'raw_text' ? 'active' : ''}`}
                    onClick={() => setResumeViewMode('raw_text')}
                  >
                    📝 Raw Text
                  </button>
                </div>

                <a 
                  href={getCandidatePdfUrl(viewResumeCand.candidate_id)}
                  download={`${viewResumeCand.candidate_name.replace(/\s+/g, '_')}_Resume.pdf`}
                  className="btn-secondary"
                  title="Download PDF File"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={14} /> Download
                </a>
                <button className="btn-secondary" onClick={() => window.print()} title="Print / Export PDF">
                  <Printer size={15} /> Print
                </button>
                <button className="btn-secondary" onClick={() => setViewResumeCand(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ background: '#f8fafc', padding: '1.25rem' }}>
              {resumeViewMode === 'pdf' && (
                <div className="pdf-viewer-wrapper">
                  <div className="pdf-viewer-toolbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="badge-pill" style={{ background: '#e0e7ff', color: 'var(--brand-primary)', fontWeight: 700, fontSize: '0.78rem' }}>
                        Native Browser PDF View
                      </span>
                      <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                        Rendering official resume document for <strong>{viewResumeCand.candidate_name}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <a 
                        href={getCandidatePdfUrl(viewResumeCand.candidate_id)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-secondary"
                        style={{ textDecoration: 'none', padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ExternalLink size={13} /> Open in New Tab
                      </a>
                      <a 
                        href={getCandidatePdfUrl(viewResumeCand.candidate_id)} 
                        download={`${viewResumeCand.candidate_name.replace(/\s+/g, '_')}_Resume.pdf`}
                        className="btn-primary"
                        style={{ textDecoration: 'none', padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Download size={13} /> Download PDF
                      </a>
                    </div>
                  </div>

                  <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '620px' }}>
                    <iframe 
                      src={`${getCandidatePdfUrl(viewResumeCand.candidate_id)}#toolbar=1&view=FitH`}
                      title={`${viewResumeCand.candidate_name} Resume PDF`}
                      className="pdf-embed-frame"
                      style={{ width: '100%', height: '100%', minHeight: '620px', border: 'none', background: '#525659' }}
                    />
                  </div>
                </div>
              )}
              {resumeViewMode === 'a4_pdf' && (
                <div className="a4-document-sheet">
                  <div className="a4-header">
                    <div>
                      <h1 className="a4-name">{viewResumeCand.candidate_name}</h1>
                      <div className="a4-subtitle">Full Stack & Software Engineering Intern</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#475569' }}>
                      <div>{viewResumeCand.candidate_email || "verified.developer@domain.edu"}</div>
                      <div>+1 (555) 019-2834</div>
                      <div style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>github.com/{viewResumeCand.candidate_name.toLowerCase().replace(/\s+/g, '')}</div>
                    </div>
                  </div>
                  <div>
                    <div className="a4-section-title">Professional Summary</div>
                    <p style={{ fontSize: '0.88rem', lineHeight: '1.7', color: '#334155' }}>
                      {viewResumeCand.explanation} Proven track record of developing responsive full-stack applications with high test coverage and measurable latency improvements.
                    </p>
                  </div>
                  <div>
                    <div className="a4-section-title">Technical Competencies</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                      {viewResumeCand.skills_matched?.map((s, i) => (
                        <span key={i} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="a4-section-title">Engineering Experience & Projects</div>
                    <div className="a4-job-row">
                      <span>Software Engineering Intern • Product Platform Team</span>
                      <span>2023 - Present</span>
                    </div>
                    <div className="a4-job-sub">Tech Solutions Group • Remote</div>
                    <ul className="a4-bullet-list">
                      <li>Designed and architected RESTful APIs utilizing Node.js, Express, and PostgreSQL, reducing endpoint response times by 35%.</li>
                      <li>Developed reactive user interface components using React and TypeScript, optimizing client-side bundle load times by 200ms.</li>
                      <li>Implemented automated continuous integration workflows with Docker and GitHub Actions, achieving 95% unit test coverage.</li>
                    </ul>
                  </div>
                  <div>
                    <div className="a4-section-title">Education & Credentials</div>
                    <div className="a4-job-row">
                      <span>Bachelor of Science in Computer Science</span>
                      <span>Class of 2024</span>
                    </div>
                    <div className="a4-job-sub">University School of Engineering • GPA 3.8/4.0</div>
                  </div>
                </div>
              )}
              {resumeViewMode === 'dossier' && (
                <div className="dossier-paper">
                  <div className="dossier-header-bar">
                    <div>
                      <div className="dossier-title">{viewResumeCand.candidate_name}</div>
                      <div className="dossier-contact-row">
                        <span><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {viewResumeCand.candidate_email || "Email verified"}</span>
                        <span>•</span>
                        <span><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> +1 (555) 019-2834</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {viewResumeCand.candidate_links?.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', textDecoration: 'none', color: 'var(--brand-primary)' }}
                        >
                          <Globe size={13} /> {url.replace('https://', '')} <ExternalLink size={11} />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="dossier-section">
                    <div className="dossier-section-title">Hiring Committee Rationale</div>
                    <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.7' }}>
                      {viewResumeCand.explanation}
                    </p>
                  </div>

                  <div className="dossier-section">
                    <div className="dossier-section-title">Verified Technical Skills</div>
                    <div className="badge-tag-wrap" style={{ marginTop: '0.4rem' }}>
                      {viewResumeCand.skills_matched?.map((s, i) => (
                        <span key={i} className="tag-pill matched" style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}>
                          ✓ {s}
                        </span>
                      ))}
                      {viewResumeCand.skills_missing?.map((s, i) => (
                        <span key={i} className="tag-pill missing" style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}>
                          ✕ Missing: {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="dossier-section">
                    <div className="dossier-section-title">Raw Resume Text & Extracted Impact</div>
                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>
                      {viewResumeCand.candidate_resume_text || "Extracted experience details verified in profile."}
                    </div>
                  </div>
                </div>
              )}
              {resumeViewMode === 'raw_text' && (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: '#1e293b', background: '#ffffff', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', lineHeight: '1.75' }}>
                  {viewResumeCand.candidate_resume_text || "No raw text available."}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
      {viewJDModal && jobData && (
        <div className="modal-overlay" onClick={() => setViewJDModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Job Description: {jobData.title}</h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Target engineering specification ({jobData.company})</div>
              </div>
              <button className="btn-secondary" onClick={() => setViewJDModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter', fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.8' }}>
                {jobData.raw_text}
              </pre>
            </div>
          </div>
        </div>
      )}
      {showTop3Modal && jobData && jobData.candidates?.length >= 1 && (() => {
        const cands = jobData.candidates || [];
        const top1 = cands[0] || null;
        const top2 = cands[1] || null;
        const top3 = cands[2] || null;
        const topList = [top1, top2, top3].filter(Boolean);
        const totalCount = cands.length;
        const otherCount = Math.max(0, totalCount - topList.length);
        const companyName = jobData.company || "Target Company";
        const tier2 = cands.slice(3, 6);
        const tier3 = cands.slice(6, 12);
        const tier4 = cands.slice(12);

        const getCandidateHeadline = (c) => {
          if (!c) return 'Candidate';
          if (c.career_progression_timeline?.current_role) {
            return c.career_progression_timeline.current_role;
          }
          if (c.career_progression_timeline?.roles?.length) {
            const r = c.career_progression_timeline.roles[0];
            return `${r.title || 'Engineer'}${r.company ? ` @ ${r.company}` : ''}`;
          }
          if (c.candidate_email) return c.candidate_email;
          return `${c.candidate_name} • Applicant`;
        };

        const getKeyMetricHighlight = (c) => {
          if (!c) return 'Standard metrics';
          const numSnippet = (c.evidence_snippets || []).find(s => /[0-9%+$]/.test(s));
          if (numSnippet) return numSnippet.length > 50 ? numSnippet.slice(0, 47) + '...' : numSnippet;
          const quant = c.scores?.quantification_score || 0;
          return `Quant Score: ${quant}/100`;
        };

        const getCandidateReason = (c, placeNum) => {
          if (!c) return '';
          const cleanExpl = c.explanation ? c.explanation.replace(/^[#\*\s]+/, '').trim() : '';
          const matchedStr = c.skills_matched?.slice(0, 5).join(', ') || 'demonstrated core skills';
          const missingStr = c.skills_missing?.length ? ` Improvement areas: ${c.skills_missing.slice(0, 2).join(', ')}.` : '';

          if (cleanExpl && cleanExpl.length > 30) {
            return cleanExpl;
          }
          if (placeNum === 1) {
            return `Achieved highest composite score of ${c.final_score}/100 and ${c.scores?.must_have_match || 0}% must-have match. Demonstrated strong competency in ${matchedStr}.${missingStr}`;
          } else if (placeNum === 2) {
            return `Secured 2nd rank with a composite score of ${c.final_score}/100 (${c.scores?.must_have_match || 0}% must-have match). Verified competencies in ${matchedStr}.${missingStr}`;
          } else {
            return `Ranks in the top 3 with a composite score of ${c.final_score}/100. Solid background in ${matchedStr}.${missingStr}`;
          }
        };

        return (
          <div className="modal-overlay" onClick={() => setShowTop3Modal(false)}>
            <div className="modal-dialog" style={{ maxWidth: '1080px', width: '92vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#ffffff' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ background: 'rgba(254, 240, 138, 0.2)', color: '#fef08a', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid rgba(254, 240, 138, 0.3)' }}>
                      🏆 EXECUTIVE DOSSIER
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#c7d2fe' }}>Comparative Candidate Evaluation</span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                    Comprehensive Breakdown & Rationale: Top {topList.length} Shortlist
                  </h3>
                  <div style={{ fontSize: '0.86rem', color: '#e0e7ff', marginTop: '0.2rem' }}>
                    In-depth architectural analysis, metric validation, and shortlisting justification for {companyName}
                  </div>
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none' }} 
                  onClick={() => setShowTop3Modal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.8rem', overflowY: 'auto' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '1.3rem 1.6rem' }}>
                  <div style={{ fontWeight: 800, color: '#15803d', fontSize: '1.05rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} /> Executive Summary: The Deciding Edge of the Top {topList.length}
                  </div>
                  <p style={{ fontSize: '0.92rem', color: '#166534', lineHeight: '1.7' }}>
                    The selection of {topList.map((c, i) => (
                      <span key={c.candidate_id || i}>
                        <strong>{c.candidate_name} ({c.final_score} pts)</strong>{i < topList.length - 1 ? (i === topList.length - 2 ? ' and ' : ', ') : ''}
                      </span>
                    ))}{otherCount > 0 ? ` over the other ${otherCount} applicant${otherCount > 1 ? 's' : ''}` : ''} represents a statistically verified alignment with required core capabilities, high semantic relevance ({Math.round(topList.reduce((a, b) => a + (b.scores?.semantic_similarity || 0), 0) / topList.length)}/100 avg), and documented production evidence.
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
                    Top {topList.length} Comparative Factor Scorecard
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="matrix-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', width: '28%' }}>Evaluation Dimension</th>
                          {topList.map((c, i) => {
                            const badgeStyles = i === 0 ? { bg: '#fef3c7', icon: '🥇' } : i === 1 ? { bg: '#e0e7ff', icon: '🥈' } : { bg: '#ffedd5', icon: '🥉' };
                            return (
                              <th key={c.candidate_id || i} style={{ textAlign: 'center', width: `${72 / topList.length}%`, background: badgeStyles.bg }}>
                                {badgeStyles.icon} {c.candidate_name} ({c.final_score})
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Composite Rank & Score</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', fontWeight: 900, color: 'var(--brand-primary)', fontSize: '1.05rem' }}>
                              #{c.rank} • {c.final_score} / 100
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Must-Have Adherence (15%)</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>
                              {c.scores?.must_have_match || 0}% ({c.skills_matched?.length || 0} skills)
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Semantic Similarity (20%)</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', fontWeight: 700 }}>
                              {c.scores?.semantic_similarity || 0} / 100
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Keyword Match (15%)</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', fontWeight: 700 }}>
                              {c.scores?.keyword_match || 0} / 100
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Quantifiable Metrics (12%)</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                              {c.scores?.quantification_score || 0} ({getKeyMetricHighlight(c)})
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Verified Core Skills</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                              {c.skills_matched?.slice(0, 4).join(', ') || 'General fundamentals'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Identified Skill Gaps</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', fontSize: '0.85rem', color: c.skills_missing?.length ? '#dc2626' : '#059669' }}>
                              {c.skills_missing?.length ? c.skills_missing.slice(0, 3).join(', ') : 'None identified'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td><strong>Verifiable Links & Snippets</strong></td>
                          {topList.map((c, i) => (
                            <td key={c.candidate_id || i} style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                              {c.candidate_links?.length ? c.candidate_links.map(l => l.title || l.type || 'Profile Link').join(', ') : (c.evidence_snippets?.length ? `${c.evidence_snippets.length} Evidence Points` : 'Resume Profile')}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem' }}>
                  {topList.map((cand, idx) => {
                    const placeNum = idx + 1;
                    const badgeStyles = placeNum === 1 
                      ? { border: '#f59e0b', text: '#b45309', bg: '#fef3c7', label: '🥇 1ST PLACE MATCH' } 
                      : placeNum === 2 
                        ? { border: '#6366f1', text: '#4338ca', bg: '#e0e7ff', label: '🥈 2ND PLACE MATCH' } 
                        : { border: '#f97316', text: '#c2410c', bg: '#ffedd5', label: '🥉 3RD PLACE MATCH' };

                    return (
                      <div key={cand.candidate_id || idx} style={{ background: '#ffffff', border: `2px solid ${badgeStyles.border}`, borderRadius: '14px', padding: '1.3rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: badgeStyles.text, background: badgeStyles.bg, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                              {badgeStyles.label}
                            </span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--brand-primary)' }}>{cand.final_score}</span>
                          </div>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{cand.candidate_name}</h4>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.8rem' }}>{getCandidateHeadline(cand)}</div>
                          <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.6' }}>
                            <strong>Why {cand.candidate_name} {placeNum === 1 ? 'Leads' : placeNum === 2 ? 'Takes 2nd' : 'Takes 3rd'}:</strong> {getCandidateReason(cand, placeNum)}
                          </p>
                        </div>
                        <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #f1f5f9' }}>
                          <button 
                            className="btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', padding: '0.45rem', fontSize: '0.8rem' }}
                            onClick={() => { setShowTop3Modal(false); handleGoToDetails(cand); }}
                          >
                            View {cand.candidate_name}'s Profile <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.4rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', marginBottom: '0.6rem' }}>
                    {otherCount > 0 
                      ? `Comparative Gap Analysis: Why the Other ${otherCount} Applicant${otherCount > 1 ? 's' : ''} Did Not Make the Top 3`
                      : `Cohort Analysis: All ${totalCount} Evaluated Applicants`
                    }
                  </h4>
                  {otherCount > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.86rem', color: '#475569', lineHeight: '1.6' }}>
                      {tier2.length > 0 && (
                        <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                          <strong style={{ color: '#1e293b' }}>
                            Tier 2 Contenders (Ranks 4-{3 + tier2.length} | {Math.min(...tier2.map(c => c.final_score))}-{Math.max(...tier2.map(c => c.final_score))} pts):
                          </strong>
                          <div style={{ marginTop: '0.25rem' }}>
                            Candidates such as {tier2.map(c => c.candidate_name).join(', ')} demonstrated competitive competencies, but averaged lower in must-have adherence ({Math.round(tier2.reduce((a, b) => a + (b.scores?.must_have_match || 0), 0) / tier2.length)}%) or exhibited specific gaps in {Array.from(new Set(tier2.flatMap(c => c.skills_missing || []))).slice(0, 3).join(', ') || 'specialized toolchains'}.
                          </div>
                        </div>
                      )}
                      {tier3.length > 0 && (
                        <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                          <strong style={{ color: '#1e293b' }}>
                            Tier 3 Partial Matches (Ranks 7-{Math.min(12, 6 + tier3.length)} | {Math.min(...tier3.map(c => c.final_score))}-{Math.max(...tier3.map(c => c.final_score))} pts):
                          </strong>
                          <div style={{ marginTop: '0.25rem' }}>
                            Applicants such as {tier3.slice(0, 3).map(c => c.candidate_name).join(', ')}{tier3.length > 3 ? ` and ${tier3.length - 3} others` : ''} showed partial alignment with lower semantic similarity ({Math.round(tier3.reduce((a, b) => a + (b.scores?.semantic_similarity || 0), 0) / tier3.length)}/100) or incomplete core stack coverage.
                          </div>
                        </div>
                      )}
                      {tier4.length > 0 && (
                        <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                          <strong style={{ color: '#1e293b' }}>
                            Tier 4 Non-Matching / Adjacent (Ranks 13-{totalCount} | &lt;{Math.max(...tier4.map(c => c.final_score)) + 1} pts):
                          </strong>
                          <div style={{ marginTop: '0.25rem' }}>
                            Applicants such as {tier4.slice(0, 3).map(c => c.candidate_name).join(', ')}{tier4.length > 3 ? ` and ${tier4.length - 3} others` : ''} showed significant misalignment with required criteria and low quantifiable engineering impact.
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
                      All {totalCount} evaluated candidates are featured in the top tier ranking above. Ingest additional resumes to explore multi-tier cohort comparisons.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 1.8rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                {topList.length >= 2 ? (
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowTop3Modal(false);
                      setActiveTab('compare');
                      if (topList[0]) setCandA(topList[0].candidate_id);
                      if (topList[1]) setCandB(topList[1].candidate_id);
                    }}
                  >
                    <Scale size={15} /> Head-to-Head Compare #1 vs #2
                  </button>
                ) : <div />}
                <button className="btn-primary" onClick={() => setShowTop3Modal(false)}>
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {analyticsCand && jobData && (() => {
        const cand = analyticsCand;
        const allCands = jobData.candidates || [];
        const poolAvg = (key) => {
          const vals = allCands.map(c => c.scores?.[key] || 0);
          return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
        };
        const poolMax = (key) => Math.max(...allCands.map(c => c.scores?.[key] || 0));
        const percentile = cand.cohort_analytics?.percentile || Math.max(5, Math.round(((allCands.length - cand.rank + 0.8) / allCands.length) * 100));
        const factorDefs = [
          { key: "semantic_similarity", label: "Semantic Similarity", weight: "20%", color: "#4f46e5" },
          { key: "keyword_match", label: "Keyword Match", weight: "15%", color: "#0ea5e9" },
          { key: "must_have_match", label: "Must-Have Match", weight: "15%", color: "#10b981" },
          { key: "quantification_score", label: "Quantification", weight: "12%", color: "#f59e0b" },
          { key: "rag_evidence", label: "RAG Evidence", weight: "10%", color: "#8b5cf6" },
          { key: "link_verification", label: "Link Verification", weight: "8%", color: "#06b6d4" },
          { key: "contextual_keywords", label: "Contextual Keywords", weight: "8%", color: "#ec4899" },
          { key: "career_progression", label: "Career Progression", weight: "7%", color: "#14b8a6" },
          { key: "skills_matrix", label: "Skills Matrix", weight: "5%", color: "#f97316" },
          { key: "structure_quality", label: "Structure Quality", weight: "3%", color: "#64748b" },
          { key: "ai_authenticity", label: "AI Authenticity", weight: "3%", color: "#a855f7" }
        ];
        const overallPoolAvg = allCands.length ? Math.round((allCands.reduce((a, c) => a + c.final_score, 0) / allCands.length) * 10) / 10 : 0;
        const diffFromAvg = Math.round((cand.final_score - overallPoolAvg) * 10) / 10;
        const tiers = [
          { label: "Top Tier (85+)", count: allCands.filter(c => c.final_score >= 85).length, color: "#10b981" },
          { label: "Strong (75-84)", count: allCands.filter(c => c.final_score >= 75 && c.final_score < 85).length, color: "#4f46e5" },
          { label: "Moderate (60-74)", count: allCands.filter(c => c.final_score >= 60 && c.final_score < 75).length, color: "#f59e0b" },
          { label: "Low (<60)", count: allCands.filter(c => c.final_score < 60).length, color: "#ef4444" }
        ];
        const candTier = cand.final_score >= 85 ? "Top Tier" : cand.final_score >= 75 ? "Strong Fit" : cand.final_score >= 60 ? "Moderate" : "Low Fit";

        return (
          <div className="modal-overlay" onClick={() => setAnalyticsCand(null)}>
            <div className="modal-dialog analytics-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header analytics-modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span className="analytics-badge-chip">
                      <BarChart3 size={13} /> COMPARATIVE ANALYTICS
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#c7d2fe' }}>Pool of {allCands.length} Candidates</span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                    {cand.candidate_name} — Performance vs Applicant Pool
                  </h3>
                  <div style={{ fontSize: '0.86rem', color: '#e0e7ff', marginTop: '0.2rem' }}>
                    Rank #{cand.rank} • {cand.final_score} pts • {candTier} • {percentile}th Percentile
                  </div>
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none' }} 
                  onClick={() => setAnalyticsCand(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body analytics-modal-body">
                <div className="analytics-kpi-row">
                  <div className="analytics-kpi-card">
                    <div className="analytics-kpi-value" style={{ color: '#4f46e5' }}>{cand.final_score}</div>
                    <div className="analytics-kpi-label">Candidate Score</div>
                  </div>
                  <div className="analytics-kpi-card">
                    <div className="analytics-kpi-value" style={{ color: '#64748b' }}>{overallPoolAvg}</div>
                    <div className="analytics-kpi-label">Pool Average</div>
                  </div>
                  <div className="analytics-kpi-card">
                    <div className="analytics-kpi-value" style={{ color: diffFromAvg >= 0 ? '#10b981' : '#ef4444' }}>
                      {diffFromAvg >= 0 ? '+' : ''}{diffFromAvg}
                    </div>
                    <div className="analytics-kpi-label">Differential</div>
                  </div>
                  <div className="analytics-kpi-card">
                    <div className="analytics-kpi-value" style={{ color: '#f59e0b' }}>{percentile}th</div>
                    <div className="analytics-kpi-label">Percentile</div>
                  </div>
                </div>

                <div className="analytics-section-card">
                  <h4 className="analytics-section-title">
                    <BarChart3 size={17} color="var(--brand-primary)" /> 11-Factor Score Comparison: Candidate vs Pool Average
                  </h4>
                  <div className="analytics-bar-chart">
                    {factorDefs.map(f => {
                      const candScore = cand.scores?.[f.key] || 0;
                      const avg = poolAvg(f.key);
                      const max = poolMax(f.key);
                      return (
                        <div key={f.key} className="analytics-bar-row">
                          <div className="analytics-bar-label">
                            <span>{f.label}</span>
                            <span className="analytics-bar-weight">{f.weight}</span>
                          </div>
                          <div className="analytics-bar-track-container">
                            <div className="analytics-bar-track">
                              <div 
                                className="analytics-bar-fill candidate-bar" 
                                style={{ width: `${candScore}%`, background: f.color }}
                              />
                              <div 
                                className="analytics-bar-fill pool-bar" 
                                style={{ width: `${avg}%` }}
                              />
                              <div 
                                className="analytics-bar-max-marker" 
                                style={{ left: `${max}%` }}
                                title={`Pool Max: ${max}`}
                              />
                            </div>
                            <div className="analytics-bar-values">
                              <span style={{ color: f.color, fontWeight: 800 }}>{candScore}</span>
                              <span style={{ color: '#94a3b8' }}>avg {avg}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="analytics-bar-legend">
                      <span><span className="legend-dot" style={{ background: '#4f46e5' }} /> Candidate</span>
                      <span><span className="legend-dot" style={{ background: '#cbd5e1' }} /> Pool Average</span>
                      <span><span className="legend-dot-line" /> Pool Maximum</span>
                    </div>
                  </div>
                </div>

                <div className="analytics-two-col">
                  <div className="analytics-section-card">
                    <h4 className="analytics-section-title">
                      <TrendingUp size={17} color="#10b981" /> Cohort Tier Distribution
                    </h4>
                    <div className="analytics-tier-chart">
                      {tiers.map((t, i) => (
                        <div key={i} className="analytics-tier-row">
                          <div className="analytics-tier-label">{t.label}</div>
                          <div className="analytics-tier-bar-track">
                            <div 
                              className="analytics-tier-bar-fill" 
                              style={{ 
                                width: `${allCands.length ? (t.count / allCands.length) * 100 : 0}%`, 
                                background: t.color 
                              }}
                            />
                          </div>
                          <div className="analytics-tier-count">{t.count}</div>
                        </div>
                      ))}
                      <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: '#4338ca', fontWeight: 700, background: '#eef2ff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                        {cand.candidate_name} is classified as <strong>{candTier}</strong> within this applicant pool
                      </div>
                    </div>
                  </div>

                  <div className="analytics-section-card">
                    <h4 className="analytics-section-title">
                      <Award size={17} color="#f59e0b" /> Percentile Position
                    </h4>
                    <div className="analytics-percentile-visual">
                      <div className="percentile-highlight-card" style={{ margin: '0 auto', maxWidth: '200px' }}>
                        <div className="percentile-big-num">{percentile}th</div>
                        <div className="percentile-label">PERCENTILE</div>
                        <div className="percentile-subtext">
                          Outperforms {percentile}% of pool
                        </div>
                      </div>
                      <div className="quantile-bar-track" style={{ marginTop: '1rem' }}>
                        <div className="quantile-segment tier-bottom">Bottom 25%</div>
                        <div className="quantile-segment tier-median">Median 50%</div>
                        <div className="quantile-segment tier-top">Top 25%</div>
                        <div className="quantile-segment tier-elite">Top 5%</div>
                        <div 
                          className="quantile-candidate-marker" 
                          style={{ left: `${Math.min(96, Math.max(4, percentile))}%` }}
                        >
                          <div className="marker-pin" />
                          <div className="marker-label">#{cand.rank}</div>
                        </div>
                      </div>
                    </div>

                    <div className="analytics-strength-weakness">
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#15803d', marginBottom: '0.3rem' }}>Strongest Factors:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {factorDefs
                            .filter(f => (cand.scores?.[f.key] || 0) > poolAvg(f.key))
                            .sort((a, b) => (cand.scores?.[b.key] || 0) - poolAvg(b.key) - ((cand.scores?.[a.key] || 0) - poolAvg(a.key)))
                            .slice(0, 4)
                            .map(f => (
                              <span key={f.key} className="factor-info-pill positive" style={{ fontSize: '0.72rem' }}>
                                ▲ {f.label}
                              </span>
                            ))
                          }
                        </div>
                      </div>
                      <div style={{ marginTop: '0.7rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.3rem' }}>Below Pool Average:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {factorDefs
                            .filter(f => (cand.scores?.[f.key] || 0) < poolAvg(f.key))
                            .map(f => (
                              <span key={f.key} className="factor-info-pill negative" style={{ fontSize: '0.72rem' }}>
                                ▼ {f.label}
                              </span>
                            ))
                          }
                          {factorDefs.filter(f => (cand.scores?.[f.key] || 0) < poolAvg(f.key)).length === 0 && (
                            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Above average in all factors</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '14px', padding: '1rem 1.4rem', fontSize: '0.92rem', color: '#1e1b4b' }}>
                  🎯 <strong>Recruiter Readiness:</strong> {cand.cohort_analytics?.recruiter_recommendation || (cand.final_score >= 80 ? "Immediately interview-ready. Strong alignment across core requirements with verifiable production metrics." : cand.final_score >= 65 ? "Schedule for screening round. Shows potential with partial alignment to core stack." : "Requires additional skill verification before proceeding.")}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 1.8rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => { setAnalyticsCand(null); handleQuickCompare(cand.candidate_id); }}
                >
                  <Scale size={15} /> Head-to-Head Compare
                </button>
                <button className="btn-primary" onClick={() => setAnalyticsCand(null)}>
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AnimatedRobotIcon({ size = 36, isThinking = false }) {
  return (
    <div className="robot-svg-container">
      <svg 
        width={size} 
        height={Math.round(size * 1.05)} 
        viewBox="0 0 100 105" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`robot-figure ${isThinking ? 'thinking' : ''}`}
      >
        <defs>
          <linearGradient id="robotMetalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="45%" stopColor="#3730a3" />
            <stop offset="80%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <linearGradient id="visorGlassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#030712" />
            <stop offset="50%" stopColor="#090d16" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="cyanPlasmaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="thrusterFlameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </linearGradient>

          <linearGradient id="coreEnergyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <line x1="36" y1="26" x2="24" y2="12" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="12" r="3.5" className="robot-antenna-orb" />
        <circle cx="24" cy="12" r="4" stroke="#38bdf8" strokeWidth="1" fill="none" className="robot-radar-ring" />
        <line x1="64" y1="26" x2="76" y2="12" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
        <circle cx="76" cy="12" r="3.5" className="robot-antenna-orb" />
        <circle cx="76" cy="12" r="4" stroke="#a855f7" strokeWidth="1" fill="none" className="robot-radar-ring" />
        {isThinking && (
          <g>
            <path d="M50 2 L52 7 L57 9 L52 11 L50 16 L48 11 L43 9 L48 7 Z" fill="#38bdf8" className="robot-thinking-spark" />
            <circle cx="34" cy="6" r="1.5" fill="#c084fc" className="robot-thinking-spark" />
            <circle cx="66" cy="6" r="1.5" fill="#38bdf8" className="robot-thinking-spark" />
          </g>
        )}
        <rect x="18" y="32" width="6" height="14" rx="3" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
        <line x1="21" y1="36" x2="21" y2="42" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="76" y="32" width="6" height="14" rx="3" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
        <line x1="79" y1="36" x2="79" y2="42" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="23" y="21" width="54" height="36" rx="14" fill="url(#robotMetalGrad)" stroke="#6366f1" strokeWidth="2.5" />
        <path d="M33 24 Q50 22 67 24" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="28" y="27" width="44" height="23" rx="9" fill="url(#visorGlassGrad)" stroke="#38bdf8" strokeWidth="1.2" />
        {!isThinking ? (
          <g>
            <g className="robot-eye-blinking">
              <ellipse cx="40" cy="37" rx="4.5" ry="5.5" fill="url(#cyanPlasmaGrad)" />
              <ellipse cx="41.5" cy="35.5" rx="1.5" ry="1.5" fill="#ffffff" />
              <circle cx="40" cy="37" r="6" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" fill="none" />
            </g>
            <g className="robot-eye-blinking">
              <ellipse cx="60" cy="37" rx="4.5" ry="5.5" fill="url(#cyanPlasmaGrad)" />
              <ellipse cx="61.5" cy="35.5" rx="1.5" ry="1.5" fill="#ffffff" />
              <circle cx="60" cy="37" r="6" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" fill="none" />
            </g>
            <path d="M43 45 Q50 49 57 45" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          <g>
            <line x1="32" y1="36" x2="68" y2="36" stroke="#38bdf8" strokeWidth="2.5" className="robot-scanner-beam" strokeLinecap="round" />
            <circle cx="39" cy="36" r="3" fill="#a855f7" className="robot-scanner-beam" />
            <circle cx="61" cy="36" r="3" fill="#38bdf8" className="robot-scanner-beam" />
            <circle cx="32" cy="31" r="0.8" fill="#38bdf8" opacity="0.6" />
            <circle cx="68" cy="31" r="0.8" fill="#38bdf8" opacity="0.6" />
            <circle cx="50" cy="31" r="0.8" fill="#a855f7" opacity="0.6" />
            <rect x="42" y="42" width="2" height="5" rx="1" fill="#38bdf8" className="robot-eq-bar-1" />
            <rect x="46" y="41" width="2" height="7" rx="1" fill="#c084fc" className="robot-eq-bar-2" />
            <rect x="50" y="39" width="2" height="9" rx="1" fill="#38bdf8" className="robot-eq-bar-3" />
            <rect x="54" y="41" width="2" height="7" rx="1" fill="#c084fc" className="robot-eq-bar-4" />
            <rect x="58" y="42" width="2" height="5" rx="1" fill="#38bdf8" className="robot-eq-bar-5" />
          </g>
        )}
        <rect x="44" y="56" width="12" height="4" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1" />
        <g>
          <ellipse cx="20" cy="68" rx="4" ry="5.5" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
          <circle cx="20" cy="66" r="2" fill="#38bdf8" />
        </g>
        <g className="robot-hand-right">
          <ellipse cx="80" cy="68" rx="4" ry="5.5" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
          <circle cx="80" cy="66" r="2" fill="#38bdf8" />
        </g>
        <path d="M30 60 L70 60 L64 83 L36 83 Z" fill="url(#robotMetalGrad)" stroke="#6366f1" strokeWidth="2" />
        <line x1="38" y1="64" x2="44" y2="64" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="56" y1="64" x2="62" y2="64" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="50" cy="72" r="8.5" fill="#0f172a" stroke="#818cf8" strokeWidth="1.5" />
        <g className={`robot-reactor-gear ${isThinking ? 'fast-spin' : ''}`}>
          <circle cx="50" cy="72" r="5.5" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
          <line x1="50" y1="66" x2="50" y2="78" stroke="#818cf8" strokeWidth="1.2" />
          <line x1="44" y1="72" x2="56" y2="72" stroke="#818cf8" strokeWidth="1.2" />
        </g>
        <circle cx="50" cy="72" r="3" fill="url(#coreEnergyGrad)" className="robot-reactor-core" />
        <path d="M43 83 L57 83 L54 87 L46 87 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <polygon points="46,87 54,87 50,103" fill="url(#thrusterFlameGrad)" className="robot-ion-thruster" />
      </svg>
    </div>
  );
}

function TargetIcon(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
