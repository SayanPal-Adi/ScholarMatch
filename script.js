
/* ScholarMatch - Front-end demo script
   Add <script src="script.js" defer></script> before </body>
   on each HTML page.

   Data is stored in localStorage. This is a prototype only.
   Do not use real passwords or sensitive personal information.
*/

(() => {
  "use strict";

  const KEYS = {
    users: "scholarmatch_users",
    session: "scholarmatch_session",
    profile: "scholarmatch_profile",
    scholarships: "scholarmatch_scholarships",
    saved: "scholarmatch_saved",
    applications: "scholarmatch_applications",
    rules: "scholarmatch_eligibility_rules"
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("Could not read local data:", error);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function text(value) {
    return String(value ?? "").trim();
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function notice(message, type = "info") {
    let box = $("#sm-notice");

    if (!box) {
      box = document.createElement("div");
      box.id = "sm-notice";
      box.setAttribute("role", "status");

      Object.assign(box.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: "9999",
        maxWidth: "min(420px, calc(100vw - 40px))",
        padding: "14px 18px",
        borderRadius: "12px",
        color: "#fff",
        font: "500 14px/1.45 system-ui",
        boxShadow: "0 8px 30px #0002"
      });

      document.body.appendChild(box);
    }

    box.style.background =
      type === "error" ? "#b42318" :
      type === "success" ? "#137a4b" :
      "#243047";

    box.textContent = message;
    box.hidden = false;

    clearTimeout(notice.timer);

    notice.timer = setTimeout(() => {
      box.hidden = true;
    }, 3500);
  }

  function currentUser() {
    const session = read(KEYS.session, null);

    if (!session?.email) return null;

    return read(KEYS.users, [])
      .find(user => user.email === session.email) || null;
  }

  function requireUser() {
    if (currentUser()) return true;

    notice("Please sign in to use this feature.", "error");
    return false;
  }

  // Sample scholarships for testing the directory.

  function seedScholarships() {
    const existing = read(KEYS.scholarships, null);

    if (Array.isArray(existing)) return existing;

    const samples = [
      {
        id: uid(),
        name: "Merit Excellence Scholarship",
        provider: "ScholarMatch Demo Foundation",
        amount: "₹25,000",
        level: "Undergraduate",
        field: "All fields",
        income: "₹5,00,000",
        deadline: "2027-03-31",
        description:
          "Demo listing for students with a strong academic record.",
        link: "",
        criteria: "Academic merit; undergraduate student"
      },
      {
        id: uid(),
        name: "Technology Learners Grant",
        provider: "ScholarMatch Demo Foundation",
        amount: "₹40,000",
        level: "Undergraduate",
        field: "Computer Science / Technology",
        income: "₹6,00,000",
        deadline: "2027-05-15",
        description:
          "Demo support for students pursuing technology-related studies.",
        link: "",
        criteria:
          "Undergraduate student in a technology-related course"
      },
      {
        id: uid(),
        name: "Need-Based Student Support",
        provider: "ScholarMatch Demo Foundation",
        amount: "₹30,000",
        level: "All levels",
        field: "All fields",
        income: "₹3,00,000",
        deadline: "2027-06-30",
        description:
          "Demo listing intended to illustrate need-based scholarship matching.",
        link: "",
        criteria: "Financial need; enrolled student"
      }
    ];

    write(KEYS.scholarships, samples);
    return samples;
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function findValue(data, names) {
    const key = Object.keys(data).find(k =>
      names.some(name => k.toLowerCase().includes(name))
    );

    return key ? text(data[key]) : "";
  }

  // Registration

  function register(form) {
    const data = formData(form);

    const name = findValue(data, ["name", "full"]);
    const email = findValue(data, ["email"]).toLowerCase();
    const password = findValue(data, ["password", "pass"]);

    if (!name || !email || !password) {
      return notice(
        "Please complete your name, email, and password.",
        "error"
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return notice("Enter a valid email address.", "error");
    }

    if (password.length < 6) {
      return notice(
        "Use at least 6 characters for this demo password.",
        "error"
      );
    }

    const users = read(KEYS.users, []);

    if (users.some(user => user.email === email)) {
      return notice(
        "An account with this email already exists.",
        "error"
      );
    }

    users.push({
      id: uid(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
      role: "student"
    });

    write(KEYS.users, users);
    write(KEYS.session, { email });

    notice("Account created. You are now signed in.", "success");

    redirectIfPresent([
      "dashboard.html",
      "profile.html",
      "matches.html"
    ]);
  }

  // Login

  function login(form) {
    const data = formData(form);

    const email = findValue(data, ["email"]).toLowerCase();
    const password = findValue(data, ["password", "pass"]);

    const user = read(KEYS.users, []).find(item =>
      item.email === email && item.password === password
    );

    if (!user) {
      return notice("Email or password is incorrect.", "error");
    }

    write(KEYS.session, { email: user.email });

    notice(`Welcome back, ${user.name}!`, "success");

    redirectIfPresent([
      "dashboard.html",
      "matches.html",
      "profile.html"
    ]);
  }

  function redirectIfPresent(paths) {
    const target = paths.find(
      path => path !== location.pathname.split("/").pop()
    );

    if (target) {
      const page = location.pathname.toLowerCase();

      if (/login|register|signup|sign-up/.test(page)) {
        location.href = target;
      }
    }
  }

  // Logout

  function logout() {
    localStorage.removeItem(KEYS.session);

    notice("You have signed out.");

    setTimeout(() => {
      location.href = "login.html";
    }, 500);
  }

  // Profile management

  function saveProfile(form) {
    if (!requireUser()) return;

    const data = formData(form);

    const profile = {
      ...read(KEYS.profile, {}),
      ...data,
      email: currentUser().email,
      updatedAt: new Date().toISOString()
    };

    write(KEYS.profile, profile);

    notice("Profile saved.", "success");
  }

  function populateProfile() {
    const profile = read(KEYS.profile, {});

    $$("[name]").forEach(field => {
      if (
        Object.prototype.hasOwnProperty.call(profile, field.name) &&
        !field.value
      ) {
        field.value = profile[field.name];
      }
    });
  }

  // Scholarship directory

  function getScholarships() {
    return seedScholarships();
  }

  function isSaved(id) {
    return read(KEYS.saved, []).includes(id);
  }

  function toggleSaved(id) {
    if (!requireUser()) return;

    let saved = read(KEYS.saved, []);

    saved = saved.includes(id)
      ? saved.filter(item => item !== id)
      : [...saved, id];

    write(KEYS.saved, saved);

    notice(
      saved.includes(id)
        ? "Scholarship saved."
        : "Removed from saved scholarships.",
      "success"
    );

    renderScholarships();
    renderSaved();
  }

  // Application tracking

  function applyScholarship(id) {
    if (!requireUser()) return;

    const scholarship = getScholarships()
      .find(item => item.id === id);

    if (!scholarship) {
      return notice("Scholarship not found.", "error");
    }

    const apps = read(KEYS.applications, []);

    if (
      apps.some(item =>
        item.scholarshipId === id &&
        item.email === currentUser().email
      )
    ) {
      return notice(
        "You have already added this scholarship to your applications."
      );
    }

    apps.push({
      id: uid(),
      scholarshipId: id,
      name: scholarship.name,
      provider: scholarship.provider,
      email: currentUser().email,
      status: "Planning to apply",
      date: new Date().toISOString()
    });

    write(KEYS.applications, apps);

    notice("Added to your application tracker.", "success");

    renderApplications();
  }

  // Scholarship card template

  function scholarshipCard(item) {
    const saved = isSaved(item.id);

    return `
      <article class="scholarship-card" data-scholarship-card>

        <div class="scholarship-card__top">
          <span class="scholarship-provider">
            ${escapeHTML(item.provider)}
          </span>

          <button
            type="button"
            data-save="${escapeHTML(item.id)}"
            aria-pressed="${saved}"
          >
            ${saved ? "♥ Saved" : "♡ Save"}
          </button>
        </div>

        <h3>${escapeHTML(item.name)}</h3>

        <p>${escapeHTML(item.description)}</p>

        <div class="scholarship-meta">
          <span>
            <strong>Award:</strong>
            ${escapeHTML(item.amount || "Not specified")}
          </span>

          <span>
            <strong>Study level:</strong>
            ${escapeHTML(item.level || "Not specified")}
          </span>

          <span>
            <strong>Field:</strong>
            ${escapeHTML(item.field || "Not specified")}
          </span>

          <span>
            <strong>Deadline:</strong>
            ${escapeHTML(item.deadline || "Not specified")}
          </span>
        </div>

        <div class="scholarship-card__actions">
          <button type="button" data-apply="${escapeHTML(item.id)}">
            Track application
          </button>

          ${
            item.link
              ? `<a
                  href="${escapeHTML(item.link)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >Official link ↗</a>`
              : ""
          }
        </div>

      </article>
    `;
  }

  // Search and filters

  function renderScholarships() {
    const container = $(
      "[data-scholarships], #scholarship-list, #scholarships-container"
    );

    if (!container) return;

    const query = text(
      $("[name='search'], #scholarship-search, [data-search]")?.value
    ).toLowerCase();

    const level = text(
      $("[name='level'], #level-filter")?.value
    ).toLowerCase();

    const field = text(
      $("[name='field'], #field-filter")?.value
    ).toLowerCase();

    const list = getScholarships().filter(item => {
      const searchable = `
        ${item.name}
        ${item.provider}
        ${item.description}
        ${item.field}
      `.toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!level || level === "all" ||
          String(item.level).toLowerCase().includes(level)) &&
        (!field || field === "all" ||
          String(item.field).toLowerCase().includes(field))
      );
    });

    container.innerHTML = list.length
      ? list.map(scholarshipCard).join("")
      : "<p>No scholarships match those filters.</p>";
  }

  // Saved scholarships page

  function renderSaved() {
    const container = $(
      "[data-saved-scholarships], #saved-scholarships"
    );

    if (!container) return;

    const ids = read(KEYS.saved, []);

    const list = getScholarships().filter(item =>
      ids.includes(item.id)
    );

    container.innerHTML = list.length
      ? list.map(scholarshipCard).join("")
      : "<p>You have not saved any scholarships yet.</p>";
  }

  // Application list

  function renderApplications() {
    const container = $(
      "[data-applications], #applications-list"
    );

    if (!container) return;

    const email = currentUser()?.email;

    const apps = read(KEYS.applications, [])
      .filter(item => item.email === email);

    container.innerHTML = apps.length
      ? apps.map(app => `
          <article class="application-card">

            <h3>${escapeHTML(app.name)}</h3>

            <p>${escapeHTML(app.provider || "")}</p>

            <label>
              Status

              <select data-status="${escapeHTML(app.id)}">
                ${
                  [
                    "Planning to apply",
                    "Documents in progress",
                    "Submitted",
                    "Under review",
                    "Approved",
                    "Rejected",
                    "Withdrawn"
                  ].map(status => `
                    <option ${app.status === status ? "selected" : ""}>
                      ${status}
                    </option>
                  `).join("")
                }
              </select>
            </label>

            <button
              type="button"
              data-remove-application="${escapeHTML(app.id)}"
            >
              Remove
            </button>

          </article>
        `).join("")
      : "<p>No applications in your tracker yet.</p>";
  }

  // Admin controls

  function renderAdmin() {
    const container = $(
      "[data-admin-scholarships], #admin-scholarships"
    );

    if (!container) return;

    container.innerHTML = getScholarships().map(item => `
      <article class="admin-scholarship">

        <strong>${escapeHTML(item.name)}</strong>

        <span>${escapeHTML(item.provider)}</span>

        <button type="button" data-edit="${escapeHTML(item.id)}">
          Edit
        </button>

        <button type="button" data-delete="${escapeHTML(item.id)}">
          Delete
        </button>

      </article>
    `).join("");
  }

  function addScholarship(form) {
    const data = formData(form);

    const name = findValue(data, ["name", "title"]);

    if (!name) {
      return notice("Enter a scholarship name.", "error");
    }

    const list = getScholarships();

    list.push({
      id: uid(),
      name,
      provider:
        findValue(data, ["provider", "organization"]) ||
        "Not specified",
      amount: findValue(data, ["amount", "award"]),
      level: findValue(data, ["level"]),
      field: findValue(data, ["field", "course"]),
      income: findValue(data, ["income"]),
      deadline: findValue(data, ["deadline"]),
      description: findValue(data, ["description", "details"]),
      link: findValue(data, ["link", "url"]),
      criteria: findValue(data, ["criteria", "eligibility"])
    });

    write(KEYS.scholarships, list);

    form.reset();

    renderAdmin();
    renderScholarships();

    notice("Scholarship added.", "success");
  }

  function editScholarship(id) {
    const list = getScholarships();

    const item = list.find(s => s.id === id);

    if (!item) return;

    const name = prompt("Scholarship name:", item.name);

    if (name === null) return;

    item.name = text(name) || item.name;

    item.provider = text(
      prompt("Provider:", item.provider) ?? item.provider
    );

    item.amount = text(
      prompt("Award amount:", item.amount) ?? item.amount
    );

    item.deadline = text(
      prompt("Deadline (YYYY-MM-DD):", item.deadline) ??
      item.deadline
    );

    write(KEYS.scholarships, list);

    renderAdmin();
    renderScholarships();

    notice("Scholarship updated.", "success");
  }

  function deleteScholarship(id) {
    if (!confirm(
      "Delete this scholarship from this browser's demo data?"
    )) {
      return;
    }

    write(
      KEYS.scholarships,
      getScholarships().filter(item => item.id !== id)
    );

    write(
      KEYS.saved,
      read(KEYS.saved, []).filter(item => item !== id)
    );

    renderAdmin();
    renderScholarships();
    renderSaved();

    notice("Scholarship deleted.", "success");
  }

  // Save eligibility preferences

  function saveEligibilityRules(form) {
    write(KEYS.rules, formData(form));

    notice("Eligibility preferences saved.", "success");
  }

  // Click event handling

  document.addEventListener("click", event => {
    const target = event.target.closest("button, [data-action]");

    if (!target) return;

    if (target.matches("[data-save]")) {
      toggleSaved(target.dataset.save);
    }

    else if (target.matches("[data-apply]")) {
      applyScholarship(target.dataset.apply);
    }

    else if (target.matches("[data-edit]")) {
      editScholarship(target.dataset.edit);
    }

    else if (target.matches("[data-delete]")) {
      deleteScholarship(target.dataset.delete);
    }

    else if (target.matches("[data-remove-application]")) {
      const id = target.dataset.removeApplication;

      write(
        KEYS.applications,
        read(KEYS.applications, [])
          .filter(app => app.id !== id)
      );

      renderApplications();

      notice("Application removed.");
    }

    else if (
      target.matches("[data-action='logout'], #logout, .logout-button")
    ) {
      logout();
    }

    else if (target.matches("[data-action='clear-saved']")) {
      if (confirm("Remove all saved scholarships?")) {
        write(KEYS.saved, []);
        renderSaved();
      }
    }
  });

  // Application status updates

  document.addEventListener("change", event => {
    const select = event.target.closest("[data-status]");

    if (!select) return;

    const apps = read(KEYS.applications, []);

    const app = apps.find(
      item => item.id === select.dataset.status
    );

    if (app) {
      app.status = select.value;

      write(KEYS.applications, apps);

      notice("Application status updated.", "success");
    }
  });

  // Live search and filtering

  document.addEventListener("input", event => {
    if (
      event.target.matches(
        "[name='search'], #scholarship-search, [data-search], " +
        "[name='level'], #level-filter, " +
        "[name='field'], #field-filter"
      )
    ) {
      renderScholarships();
    }
  });

  // Form submissions

  document.addEventListener("submit", event => {
    const form = event.target;

    if (
      form.matches(
        "#register-form, [data-form='register'], form.register-form"
      )
    ) {
      event.preventDefault();
      register(form);
    }

    else if (
      form.matches(
        "#login-form, [data-form='login'], form.login-form"
      )
    ) {
      event.preventDefault();
      login(form);
    }

    else if (
      form.matches(
        "#profile-form, [data-form='profile'], form.profile-form"
      )
    ) {
      event.preventDefault();
      saveProfile(form);
    }

    else if (
      form.matches(
        "#admin-scholarship-form, " +
        "[data-form='add-scholarship'], " +
        "form.admin-scholarship-form"
      )
    ) {
      event.preventDefault();
      addScholarship(form);
    }

    else if (
      form.matches("#eligibility-form, [data-form='eligibility']")
    ) {
      event.preventDefault();
      saveEligibilityRules(form);
    }
  });

  // Initialize page

  document.addEventListener("DOMContentLoaded", () => {
    populateProfile();

    renderScholarships();
    renderSaved();
    renderApplications();
    renderAdmin();

    const user = currentUser();

    $$("[data-user-name], #user-name").forEach(el => {
      if (user) el.textContent = user.name;
    });

    $$("[data-user-email], #user-email").forEach(el => {
      if (user) el.textContent = user.email;
    });

    $$("[data-auth-only]").forEach(el => {
      el.hidden = !user;
    });

    $$("[data-guest-only]").forEach(el => {
      el.hidden = !!user;
    });

    // Fill profile name and email when blank.

    if (user) {
      const nameField = $(
        "[name='name'], [name='fullName'], [name='full_name']"
      );

      const emailField = $("[name='email']");

      if (nameField && !nameField.value) {
        nameField.value = user.name;
      }

      if (emailField && !emailField.value) {
        emailField.value = user.email;
      }
    }
  });

  // Public API for optional use from other scripts.

  window.ScholarMatch = {
    currentUser,
    getScholarships,
    renderScholarships,
    renderSaved,
    renderApplications,
    logout,
    toggleSaved,
    applyScholarship
  };

})();