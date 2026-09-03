// ============================================================
// Sepahijala District Administration — Feedback Portal
// Shared Frontend Utility (Optimized for GitHub Pages & CDN)
// ============================================================

// ➜ Deployed Google Apps Script Web App Endpoint
const API_URL = "https://script.google.com/macros/s/AKfycbzRzkU8m_S6KxXXzJ81b-tStyJ_54blw0s3nwP4nyImku7DWpYb_9Ch5igdQAu2Wa-j/exec";

/**
 * POST JSON to the Google Apps Script Web App with timeout and error resilience.
 * Uses text/plain to prevent CORS pre-flight OPTIONS request on GAS endpoints.
 */
async function apiPost(action, data = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const payload = { action, ...data };
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const rawText = await response.text();
    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("GAS returned non-JSON response:", rawText);
      if (rawText.includes("Google Drive") || rawText.includes("Page not found")) {
        return { success: false, error: "Google Apps Script permissions issue. Please verify Web App access is set to 'Anyone'." };
      }
      return { success: false, error: "Invalid server response format. Please try again." };
    }
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      return { success: false, error: "Request timed out. Please check your internet connection and try again." };
    }
    console.error("API call error:", err);
    return { success: false, error: err.message || "Network error. Please check your internet connection." };
  }
}

// ── Auth & Session Management ───────────────────────────────

function getAuthToken() {
  return localStorage.getItem("spj_feedback_token");
}

function setAuthToken(token) {
  if (token) localStorage.setItem("spj_feedback_token", token);
}

function clearAuth() {
  ["spj_feedback_token", "spj_feedback_role",
   "spj_feedback_office", "spj_feedback_email"].forEach(k =>
    localStorage.removeItem(k)
  );
}

function saveUserInfo(email, role, office) {
  if (email)  localStorage.setItem("spj_feedback_email",  email);
  if (role)   localStorage.setItem("spj_feedback_role",   role);
  if (office) localStorage.setItem("spj_feedback_office", office);
}

function checkAuthOrRedirect() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "login.html";
    return null;
  }
  return token;
}

// ── Common String & UI Utilities ────────────────────────────

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderStars(rating) {
  const full = Math.floor(Number(rating) || 0);
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += i <= full ? "★" : "☆";
  }
  return stars;
}
