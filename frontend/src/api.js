const API_BASE = "http://localhost:8000/api";

export async function fetchHealth() {
  try {
    const res = await fetch("http://localhost:8000/");
    return await res.json();
  } catch (err) {
    console.error("Health check failed", err);
    return null;
  }
}

export async function listJobs() {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error("Failed to list jobs");
  return await res.json();
}

export async function getJobDetails(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to load job details");
  return await res.json();
}

export async function seedFullDataset() {
  const res = await fetch(`${API_BASE}/seed-full-dataset`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to seed benchmark dataset");
  }
  return await res.json();
}

export async function resetAll() {
  const res = await fetch(`${API_BASE}/reset-all`, {
    method: "POST"
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reset database");
  }
  return await res.json();
}

export async function compareCandidates(jobId, candidateAId, candidateBId) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: jobId,
      candidate_a_id: candidateAId,
      candidate_b_id: candidateBId
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Comparison failed");
  }
  return await res.json();
}

export async function askRAG(jobId, query) {
  const formData = new FormData();
  formData.append("job_id", jobId);
  formData.append("query", query);

  const res = await fetch(`${API_BASE}/rag/ask`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "RAG Query failed");
  }
  return await res.json();
}

export async function parseJdFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/jobs/parse-jd-file`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to parse Job Description document");
  }
  return await res.json();
}

export async function createJob(title, company, jdText, jdFile = null) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("company", company);
  if (jdText) {
    formData.append("jd_text", jdText);
  }
  if (jdFile) {
    formData.append("jd_file", jdFile);
  }

  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create job");
  }
  return await res.json();
}

export async function uploadResumes(jobId, files) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  const res = await fetch(`${API_BASE}/jobs/${jobId}/upload-resumes`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Resume batch upload failed");
  }
  return await res.json();
}

export function getCandidatePdfUrl(candidateId) {
  return `${API_BASE}/resumes/${candidateId}/pdf`;
}

