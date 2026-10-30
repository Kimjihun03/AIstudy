const $ = (id) => document.getElementById(id);

const screens = {
  start: $("start-screen"),
  quiz: $("quiz-screen"),
  end: $("end-screen"),
  ranking: $("ranking-screen"),
};

const STORAGE_KEY = "quiz-rankings";
const RANKING_LIMIT = 10;

let rankingFrom = "start"; // 순위표에서 "돌아가기"를 눌렀을 때 돌아갈 화면

// 한 판의 모든 상태. 점수 정보(nickname, score, total, byCategory)는 순위 저장에 그대로 쓸 수 있다.
const state = {
  nickname: "",
  list: [],      // 이번 판의 출제 목록 (섞인 문제 + 섞인 보기)
  index: 0,
  answered: false,
  score: 0,      // 총 정답 수 (1문제 = 1점)
  total: 0,      // 총 문제 수 (만점)
  byCategory: {}, // { 카테고리: { correct, total } }
  recordId: null,    // 이번 판 기록의 저장 id (순위표 강조용)
  saveFailed: false, // 기록 저장 실패 여부
};

// 상태를 처음 값으로 되돌린다. 새 게임 시작과 다시 하기에서 사용.
function resetState() {
  state.nickname = "";
  state.list = [];
  state.index = 0;
  state.answered = false;
  state.score = 0;
  state.total = 0;
  state.byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, { correct: 0, total: 0 }]));
  state.recordId = null;
  state.saveFailed = false;
}
resetState();

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => { el.hidden = key !== name; });
}

// Fisher-Yates 셔플 (원본을 바꾸지 않고 복사본 반환)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 보기를 섞으면서 정답 인덱스를 새 위치로 다시 계산한다.
function prepareQuestion(q) {
  const tagged = q.choices.map((text, i) => ({ text, correct: i === q.answerIndex }));
  const mixed = shuffle(tagged);
  return {
    id: q.id,
    category: q.category,
    question: q.question,
    choices: mixed.map((c) => c.text),
    answerIndex: mixed.findIndex((c) => c.correct),
    explanation: q.explanation,
  };
}

// 카테고리 순서는 고정, 카테고리 안의 문제·보기 순서만 무작위
function buildQuizList() {
  return CATEGORIES.flatMap((cat) =>
    shuffle(QUESTIONS.filter((q) => q.category === cat)).map(prepareQuestion)
  );
}

function validateNickname(raw) {
  const name = raw.trim();
  const length = [...name].length; // 이모지 등도 1자로 계산
  if (length < 1 || length > 10) return { ok: false, name };
  return { ok: true, name };
}

function startQuiz(nickname) {
  resetState();
  state.nickname = nickname;
  state.list = buildQuizList();
  state.total = state.list.length;
  state.list.forEach((q) => { state.byCategory[q.category].total++; });
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const q = state.list[state.index];
  state.answered = false;

  $("category").textContent = q.category;
  $("progress").textContent = `${state.index + 1} / ${state.list.length}`;
  $("progress-fill").style.width = `${(state.index / state.list.length) * 100}%`;
  $("question").textContent = q.question;

  const ul = $("choices");
  ul.replaceChildren();
  q.choices.forEach((text, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = `${i + 1}. ${text}`;
    btn.addEventListener("click", () => selectChoice(i));
    li.appendChild(btn);
    ul.appendChild(li);
  });

  $("feedback").hidden = true;
  $("next-btn").hidden = true;
  $("next-btn").textContent = state.index === state.list.length - 1 ? "마치기" : "다음";
}

function selectChoice(i) {
  if (state.answered) return; // 답 변경 불가
  state.answered = true;

  const q = state.list[state.index];
  const buttons = $("choices").querySelectorAll(".choice-btn");
  buttons.forEach((b) => { b.disabled = true; });

  const isCorrect = i === q.answerIndex;
  if (isCorrect) {
    state.score++;
    state.byCategory[q.category].correct++;
  }
  buttons[q.answerIndex].classList.add("correct");
  if (!isCorrect) buttons[i].classList.add("wrong");

  const result = $("result");
  result.textContent = isCorrect ? "정답입니다!" : "오답입니다.";
  result.className = `result ${isCorrect ? "ok" : "ng"}`;
  $("explanation").textContent = q.explanation;
  $("feedback").hidden = false;
  $("next-btn").hidden = false;
  $("next-btn").focus();
}

function nextQuestion() {
  if (!state.answered) return;
  state.answered = false; // "마치기"를 연타해도 결과 처리·저장이 한 번만 일어나도록
  if (state.index < state.list.length - 1) {
    state.index++;
    renderQuestion();
  } else {
    saveRecord();
    renderResult();
    showScreen("end");
  }
}

// ===== 순위 기록 (localStorage) =====
function isValidRecord(r) {
  return r && typeof r.id === "string" && typeof r.nickname === "string"
    && Number.isFinite(r.score) && Number.isFinite(r.total)
    && typeof r.playedAt === "string" && !Number.isNaN(Date.parse(r.playedAt));
}

// 읽기 실패·손상된 데이터는 빈 목록으로 취급한다.
function loadRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidRecord) : [];
  } catch (e) {
    return [];
  }
}

// 저장에 실패해도 게임은 계속 진행된다.
function saveRecord() {
  try {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nickname: state.nickname,
      score: state.score,
      total: state.total,
      byCategory: JSON.parse(JSON.stringify(state.byCategory)),
      playedAt: new Date().toISOString(),
    };
    const records = loadRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    state.recordId = record.id;
    state.saveFailed = false;
  } catch (e) {
    state.recordId = null;
    state.saveFailed = true;
  }
}

// 점수 내림차순, 동점이면 먼저 달성한 기록이 위
function sortRecords(records) {
  return records
    .map((r, i) => ({ r, i, t: Date.parse(r.playedAt) }))
    .sort((a, b) => b.r.score - a.r.score || a.t - b.t || a.i - b.i)
    .map((x) => x.r);
}

function formatDate(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function makeRow(cells, className) {
  const tr = document.createElement("tr");
  if (className) tr.className = className;
  cells.forEach((text) => {
    const td = document.createElement("td");
    td.textContent = text;
    tr.appendChild(td);
  });
  return tr;
}

function myRankIndex(sorted) {
  return state.recordId ? sorted.findIndex((r) => r.id === state.recordId) : -1;
}

function renderRanking() {
  const sorted = sortRecords(loadRecords());
  const tbody = $("ranking-body");
  tbody.replaceChildren();

  $("ranking-empty").hidden = sorted.length > 0;
  $("ranking-table").hidden = sorted.length === 0;

  const toRow = (r, i, mine) =>
    makeRow([`${i + 1}위`, r.nickname, `${r.score} / ${r.total}`, formatDate(r.playedAt)], mine ? "me" : "");

  sorted.slice(0, RANKING_LIMIT).forEach((r, i) => {
    tbody.appendChild(toRow(r, i, r.id === state.recordId));
  });

  // 내 기록이 10위 밖이면 표 아래에 따로 보여 준다.
  const mine = myRankIndex(sorted);
  if (mine >= RANKING_LIMIT) tbody.appendChild(toRow(sorted[mine], mine, true));

  $("my-rank").hidden = mine < 0;
  if (mine >= 0) $("my-rank").textContent = `내 순위: ${mine + 1}위 (전체 ${sorted.length}명 중)`;
}

function showRanking(from) {
  rankingFrom = from;
  renderRanking();
  showScreen("ranking");
}

function renderResult() {
  $("end-message").textContent = `${state.nickname}님, 모든 문제를 풀었습니다!`;
  $("total-score").textContent = `${state.score} / ${state.total}`;

  const rankEl = $("end-rank");
  if (state.saveFailed) {
    rankEl.textContent = "기록을 저장하지 못해 순위를 표시할 수 없습니다.";
  } else {
    const mine = myRankIndex(sortRecords(loadRecords()));
    rankEl.textContent = mine >= 0 ? `내 순위: ${mine + 1}위` : "";
  }

  const tbody = $("category-stats");
  tbody.replaceChildren();
  CATEGORIES.forEach((cat) => {
    const { correct, total } = state.byCategory[cat];
    const rate = total === 0 ? 0 : Math.round((correct / total) * 100);
    const tr = document.createElement("tr");
    [cat, `${correct} / ${total}`, `${rate}%`].forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

$("start-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const { ok, name } = validateNickname($("nickname").value);
  if (!ok) {
    $("nickname-error").textContent = "닉네임은 1~10자로 입력해 주세요.";
    return;
  }
  $("nickname-error").textContent = "";
  startQuiz(name);
});

$("next-btn").addEventListener("click", nextQuestion);

$("ranking-btn-start").addEventListener("click", () => showRanking("start"));
$("ranking-btn-end").addEventListener("click", () => showRanking("end"));
$("ranking-back-btn").addEventListener("click", () => showScreen(rankingFrom));

$("restart-btn").addEventListener("click", () => {
  resetState();
  $("nickname").value = "";
  $("nickname-error").textContent = "";
  showScreen("start");
});
