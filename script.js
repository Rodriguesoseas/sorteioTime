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

const COUNTDOWN_STEP_MS = 1000;
const LANES = ["TOP", "JUNGLE", "MID", "ADC", "SUPORTE"];

let lastBlueTeam = [];
let lastRedTeam = [];
let isCountingDown = false;
let countdownTimeouts = [];

function setStatus(el, text, type) {
  el.textContent = text;
  el.classList.remove("ok", "warn");
  if (type) el.classList.add(type);
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
  const normalized = raw.replace(/[,;]+/g, "\n");
  const parts = normalized
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

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

function clearLists(...elements) {
  for (const el of elements) el.innerHTML = "";
}

function renderTeam(listEl, names) {
  listEl.innerHTML = names
    .map((n) => `<li class="member">${escapeHtml(n)}</li>`)
    .join("");
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
  for (const id of countdownTimeouts) clearTimeout(id);
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
  clearLists(blueListEl, redListEl, blueLanesListEl, redLanesListEl);
  setStatus(lanesMessageEl, "", null);

  const pool = uniqueNames.slice();
  shuffleInPlace(pool);
  const chosen10 = pool.slice(0, 10);

  shuffleInPlace(chosen10);
  const blue = chosen10.slice(0, 5);
  const red = chosen10.slice(5, 10);

  lastBlueTeam = blue;
  lastRedTeam = red;

  renderTeam(blueListEl, blue);
  renderTeam(redListEl, red);
  setStatus(messageEl, "Sorteio feito! Foram usados 10 nomes (5 Azul e 5 Vermelho).", "ok");
}

function sortTeams() {
  if (isCountingDown) return;

  const uniqueNames = normalizeNames(namesInput.value);

  if (uniqueNames.length < 10) {
    setStatus(
      messageEl,
      "Cole pelo menos 10 nomes (1 por linha, ou separando por vírgula/ponto e vírgula).",
      "warn"
    );
    return;
  }

  setStatus(messageEl, "", null);
  runCountdown(() => applyTeamSort(uniqueNames));
}

function sortLanesForTeam(teamNames) {
  const shuffledPlayers = shuffleInPlace(teamNames.slice());
  return LANES.map((lane, idx) => ({ lane, name: shuffledPlayers[idx] }));
}

function applyLaneSort() {
  clearLists(blueLanesListEl, redLanesListEl);

  renderLanes(blueLanesListEl, sortLanesForTeam(lastBlueTeam));
  renderLanes(redLanesListEl, sortLanesForTeam(lastRedTeam));
  setStatus(lanesMessageEl, "Lanes sorteadas! (1 de cada por equipe)", "ok");
}

function sortLanes() {
  if (isCountingDown) return;

  if (lastBlueTeam.length !== 5 || lastRedTeam.length !== 5) {
    setStatus(lanesMessageEl, "Primeiro sorteie as equipes (5 Azul e 5 Vermelho).", "warn");
    setActiveTab("teams");
    return;
  }

  setStatus(lanesMessageEl, "", null);
  runCountdown(() => applyLaneSort());
}

sortButton.addEventListener("click", sortTeams);

clearButton.addEventListener("click", () => {
  cancelCountdown();
  namesInput.value = "";
  clearLists(blueListEl, redListEl, blueLanesListEl, redLanesListEl);
  setStatus(messageEl, "", null);
  setStatus(lanesMessageEl, "", null);
  lastBlueTeam = [];
  lastRedTeam = [];
  namesInput.focus();
});

namesInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sortTeams();
  }
});

tabTeams.addEventListener("click", () => setActiveTab("teams"));
tabLanes.addEventListener("click", () => setActiveTab("lanes"));
sortLanesButton.addEventListener("click", sortLanes);
