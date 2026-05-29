const namesInput = document.getElementById("namesInput");
const sortButton = document.getElementById("sortButton");
const clearButton = document.getElementById("clearButton");

const messageEl = document.getElementById("message");
const blueListEl = document.getElementById("blueList");
const redListEl = document.getElementById("redList");

const tabTeams = document.getElementById("tabTeams");
const tabLanes = document.getElementById("tabLanes");
const panelTeams = document.getElementById("panelTeams");
const panelLanes = document.getElementById("panelLanes");

const sortLanesButton = document.getElementById("sortLanesButton");
const lanesMessageEl = document.getElementById("lanesMessage");
const blueLanesListEl = document.getElementById("blueLanesList");
const redLanesListEl = document.getElementById("redLanesList");

const countdownEl = document.getElementById("countdown");
const countdownNumberEl = document.getElementById("countdownNumber");

let lastBlueTeam = [];
let lastRedTeam = [];
let isCountingDown = false;
let countdownTimeouts = [];

const COUNTDOWN_STEP_MS = 1000;

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.classList.remove("ok", "warn");
  if (type) messageEl.classList.add(type);
}

function showLanesMessage(text, type) {
  lanesMessageEl.textContent = text;
  lanesMessageEl.classList.remove("ok", "warn");
  if (type) lanesMessageEl.classList.add(type);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeNames(raw) {
  // Aceita "1 por linha" ou separadores comuns (vírgula / ;).
  const normalized = raw.replace(/[,;]+/g, "\n");
  const parts = normalized
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // Remove duplicados mantendo a ordem.
  const seen = new Set();
  const unique = [];
  for (const name of parts) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }

  return unique;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderTeam(listEl, names) {
  listEl.innerHTML = names
    .map((n) => `<li class="member">${escapeHtml(n)}</li>`)
    .join("");
}

function clearTeams() {
  blueListEl.innerHTML = "";
  redListEl.innerHTML = "";
}

function clearLanes() {
  blueLanesListEl.innerHTML = "";
  redLanesListEl.innerHTML = "";
}

function setActiveTab(which) {
  const isTeams = which === "teams";
  tabTeams.classList.toggle("isActive", isTeams);
  tabLanes.classList.toggle("isActive", !isTeams);
  tabTeams.setAttribute("aria-selected", isTeams ? "true" : "false");
  tabLanes.setAttribute("aria-selected", !isTeams ? "true" : "false");
  panelTeams.classList.toggle("isActive", isTeams);
  panelLanes.classList.toggle("isActive", !isTeams);
}

function cancelCountdown() {
  for (const id of countdownTimeouts) {
    clearTimeout(id);
  }
  countdownTimeouts = [];
  isCountingDown = false;
  countdownEl.hidden = true;
  countdownEl.setAttribute("aria-hidden", "true");
  countdownNumberEl.textContent = "";
  countdownNumberEl.classList.remove("isPopping");
  sortButton.disabled = false;
  sortLanesButton.disabled = false;
}

function showCountdownNumber(n) {
  countdownNumberEl.textContent = String(n);
  countdownNumberEl.classList.remove("isPopping");
  void countdownNumberEl.offsetWidth;
  countdownNumberEl.classList.add("isPopping");
}

function runCountdown(onDone) {
  cancelCountdown();
  isCountingDown = true;
  sortButton.disabled = true;
  sortLanesButton.disabled = true;
  countdownEl.hidden = false;
  countdownEl.setAttribute("aria-hidden", "false");

  const steps = [3, 2, 1];
  steps.forEach((n, index) => {
    const id = setTimeout(() => {
      showCountdownNumber(n);
      if (index === steps.length - 1) {
        const finishId = setTimeout(() => {
          cancelCountdown();
          onDone();
        }, COUNTDOWN_STEP_MS);
        countdownTimeouts.push(finishId);
      }
    }, index * COUNTDOWN_STEP_MS);
    countdownTimeouts.push(id);
  });
}

function applyTeamSort(uniqueNames) {
  clearTeams();
  clearLanes();
  showLanesMessage("", null);

  const pool = uniqueNames.slice();
  shuffleInPlace(pool);
  const chosen10 = pool.slice(0, 10);

  shuffleInPlace(chosen10);
  const blue = chosen10.slice(0, 5);
  const red = chosen10.slice(5, 10);

  lastBlueTeam = blue.slice();
  lastRedTeam = red.slice();

  renderTeam(blueListEl, blue);
  renderTeam(redListEl, red);

  const usedCount = Math.min(10, uniqueNames.length);
  showMessage(`Sorteio feito! Foram usados ${usedCount} nomes (5 Azul e 5 Vermelho).`, "ok");
}

function sortTeams() {
  if (isCountingDown) return;

  const uniqueNames = normalizeNames(namesInput.value);

  if (uniqueNames.length < 10) {
    showMessage(
      "Cole pelo menos 10 nomes (1 por linha, ou separando por vírgula/ponto e vírgula).",
      "warn"
    );
    return;
  }

  showMessage("", null);
  runCountdown(() => applyTeamSort(uniqueNames));
}

sortButton.addEventListener("click", sortTeams);

clearButton.addEventListener("click", () => {
  cancelCountdown();
  namesInput.value = "";
  clearTeams();
  clearLanes();
  showMessage("", null);
  showLanesMessage("", null);
  lastBlueTeam = [];
  lastRedTeam = [];
  namesInput.focus();
});

// Permite sortear rapidamente com Ctrl+Enter (ou Cmd+Enter no macOS).
namesInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sortTeams();
  }
});

tabTeams.addEventListener("click", () => setActiveTab("teams"));
tabLanes.addEventListener("click", () => setActiveTab("lanes"));

function sortLanesForTeam(teamNames) {
  const lanes = ["TOP", "JUNGLE", "MID", "ADC", "SUPORTE"];
  const shuffledPlayers = shuffleInPlace(teamNames.slice());
  return lanes.map((lane, idx) => ({ lane, name: shuffledPlayers[idx] }));
}

function renderLanes(listEl, pairs) {
  listEl.innerHTML = pairs
    .map(
      (p) =>
        `<li class="member"><div class="laneRow"><span class="laneBadge">${escapeHtml(
          p.lane
        )}</span><span>${escapeHtml(p.name)}</span></div></li>`
    )
    .join("");
}

function applyLaneSort() {
  clearLanes();

  const bluePairs = sortLanesForTeam(lastBlueTeam);
  const redPairs = sortLanesForTeam(lastRedTeam);

  renderLanes(blueLanesListEl, bluePairs);
  renderLanes(redLanesListEl, redPairs);
  showLanesMessage("Lanes sorteadas! (1 de cada por equipe)", "ok");
}

function sortLanes() {
  if (isCountingDown) return;

  if (lastBlueTeam.length !== 5 || lastRedTeam.length !== 5) {
    showLanesMessage("Primeiro sorteie as equipes (5 Azul e 5 Vermelho).", "warn");
    setActiveTab("teams");
    return;
  }

  showLanesMessage("", null);
  runCountdown(() => applyLaneSort());
}

sortLanesButton.addEventListener("click", sortLanes);

