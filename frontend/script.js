const form = document.getElementById("applicationForm");
const companyInput = document.getElementById("company");
const positionInput = document.getElementById("position");
const statusInput = document.getElementById("status");
const appliedDateInput = document.getElementById("appliedDate");
const deadlineInput = document.getElementById("deadline");
const scoreInput = document.getElementById("interviewScore");
const notesInput = document.getElementById("notes");
const applicationList = document.getElementById("applicationList");
const analyticsGrid = document.getElementById("analyticsGrid");
const refreshButton = document.getElementById("refreshButton");
const clearButton = document.getElementById("clearButton");

let currentEditId = null;

const apiBase = "http://127.0.0.1:5000/api";

async function fetchApplications() {
  const response = await fetch(`${apiBase}/applications`);
  return response.ok ? response.json() : [];
}

async function fetchAnalytics() {
  const response = await fetch(`${apiBase}/analytics`);
  return response.ok ? response.json() : {};
}

function formatLabel(label, value) {
  return `${label}: ${value}`;
}

function renderAnalytics(data) {
  analyticsGrid.innerHTML = "";
  const cards = [
    { title: "Total applications", value: data.totalApplications || 0 },
    { title: "Active interviews", value: data.activeInterviews || 0 },
    { title: "Offers earned", value: data.offers || 0 },
    { title: "Average score", value: data.averageInterviewScore || 0 },
  ];

  cards.forEach((card) => {
    const element = document.createElement("article");
    element.className = "metric-card";
    element.innerHTML = `<h3>${card.title}</h3><p>${card.value}</p>`;
    analyticsGrid.appendChild(element);
  });

  if (data.upcomingDeadlines && data.upcomingDeadlines.length > 0) {
    const upcomingCard = document.createElement("article");
    upcomingCard.className = "metric-card";
    upcomingCard.innerHTML = `<h3>Upcoming deadlines</h3><div>${data.upcomingDeadlines
      .map((item) => `<p>${item.company} • ${item.position} — ${item.deadline} (${item.daysLeft}d)</p>`)
      .join("")}</div>`;
    analyticsGrid.appendChild(upcomingCard);
  }
}

function renderApplications(applications) {
  applicationList.innerHTML = "";
  if (!applications.length) {
    applicationList.innerHTML = `<p style="color:#526d82;">No applications yet. Add one to start tracking your internship pipeline.</p>`;
    return;
  }

  applications.forEach((item) => {
    const card = document.createElement("article");
    card.className = "application-card";
    card.innerHTML = `
      <div class="card-row">
        <div>
          <h3>${item.company} — ${item.position}</h3>
          <span class="tag ${item.status}">${item.status}</span>
        </div>
        <div class="card-actions">
          <button onclick="startEdit(${item.id})">Edit</button>
          <button class="delete" onclick="removeApplication(${item.id})">Delete</button>
        </div>
      </div>
      <div class="details-grid">
        <div class="detail-item">Applied: ${item.appliedDate || "—"}</div>
        <div class="detail-item">Deadline: ${item.deadline || "—"}</div>
        <div class="detail-item">Score: ${item.interviewScore || 0}</div>
      </div>
      <p class="description">${item.notes || "No notes yet."}</p>
    `;
    applicationList.appendChild(card);
  });
}

async function loadDashboard() {
  const [applications, analytics] = await Promise.all([fetchApplications(), fetchAnalytics()]);
  renderApplications(applications);
  renderAnalytics(analytics);
}

function resetForm() {
  form.reset();
  currentEditId = null;
}

function getFormData() {
  return {
    company: companyInput.value,
    position: positionInput.value,
    status: statusInput.value,
    appliedDate: appliedDateInput.value,
    deadline: deadlineInput.value,
    interviewScore: Number(scoreInput.value) || 0,
    notes: notesInput.value
  };
}

async function saveApplication(event) {
  event.preventDefault();
  const payload = getFormData();

  if (!payload.company || !payload.position) {
    alert("Company and position are required.");
    return;
  }

  const url = currentEditId ? `${apiBase}/applications/${currentEditId}` : `${apiBase}/applications`;
  const method = currentEditId ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    alert("Unable to save application. Please try again.");
    return;
  }

  resetForm();
  loadDashboard();
}

function populateForm(application) {
  companyInput.value = application.company;
  positionInput.value = application.position;
  statusInput.value = application.status;
  appliedDateInput.value = application.appliedDate || "";
  deadlineInput.value = application.deadline || "";
  scoreInput.value = application.interviewScore || 0;
  notesInput.value = application.notes || "";
}

window.startEdit = async function startEdit(id) {
  const applications = await fetchApplications();
  const item = applications.find((app) => app.id === id);
  if (!item) return;
  currentEditId = id;
  populateForm(item);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.removeApplication = async function removeApplication(id) {
  if (!confirm("Delete this application?")) return;
  const response = await fetch(`${apiBase}/applications/${id}`, { method: "DELETE" });
  if (response.ok) {
    loadDashboard();
  } else {
    alert("Could not delete the application.");
  }
};

form.addEventListener("submit", saveApplication);
refreshButton.addEventListener("click", loadDashboard);
clearButton.addEventListener("click", resetForm);

loadDashboard();
