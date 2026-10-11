const STORAGE_KEY = 'tastenabenteuer-progress-v1';
const ALL_LETTERS = Object.keys(FOCUS);
const KEY_ROWS = [
  '1234567890ß'.split(''),
  'qwertzuiopü'.split(''),
  'asdfghjklöä'.split(''),
  'yxcvbnm,.-'.split('')
];
const OLD_TITLES = ['Die ersten Funken','Nachbarn entdecken','Der kleine Rhythmus','Die ganze Startreihe','Erste echte Wörter','Noch mehr Wörter','Der Satzpfad','Freie Fahrt'];
const $ = selector => document.querySelector(selector);
const keyLabel = key => key === 'ß' ? 'ß' : key.toUpperCase();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.history) ? saved : {history: []};
  } catch {
    return {history: []};
  }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
let state = loadState();
if (state.curriculumVersion !== 3 || !Array.isArray(state.stageProgress)) {
  state.stageProgress = MISSIONS.map((_, i) => state.history.some(x => x.passed && x.mission === i) ? 1 : 0);
  state.curriculumVersion = 3;
}
state.stageProgress = MISSIONS.map((_, i) => Math.min(STAGES_PER_MISSION, Math.max(0, Number(state.stageProgress[i]) || 0)));
state.focusLetters = Array.isArray(state.focusLetters) ? state.focusLetters.filter(k => FOCUS[k]).slice(0, 3) : [];
saveState();

let currentMission = 0;
let currentStage = 0;
let currentFocus = [];
let target = '';
let typed = [];
let mistakes = 0;
let startedAt = null;
let finished = false;
let timer = null;

function unlockedMission() {
  const index = state.stageProgress.findIndex(value => value < STAGES_PER_MISSION);
  return index < 0 ? MISSIONS.length - 1 : index;
}
function overallStats() {
  const h = state.history;
  return {
    completed: state.stageProgress.filter(value => value >= STAGES_PER_MISSION).length,
    bestAccuracy: h.length ? Math.max(...h.map(x => Number(x.accuracy) || 0)) : null,
    bestSpeed: h.length ? Math.max(...h.map(x => Number(x.apm) || 0)) : null
  };
}
function show(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === 'view-' + view));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  $('#crumb-current').textContent = ({home:'ÜBERSICHT', missions:'MISSIONEN', focus:'BUCHSTABENWAHL', progress:'FORTSCHRITT', play:'ÜBUNG', result:'ERGEBNIS'})[view];
  window.scrollTo({top: 0, behavior: 'instant'});
  if (view === 'home') renderHome();
  if (view === 'missions') renderMissions();
  if (view === 'focus') renderFocus();
  if (view === 'progress') renderProgress();
}
function renderHome() {
  const summary = overallStats();
  $('#home-completed').innerHTML = `${summary.completed} <small>/ ${MISSIONS.length}</small>`;
  $('#home-accuracy').textContent = summary.bestAccuracy === null ? '—' : summary.bestAccuracy + '%';
  $('#home-speed').textContent = summary.bestSpeed === null ? '—' : summary.bestSpeed + ' APM';
  const index = unlockedMission();
  const mission = MISSIONS[index];
  $('#next-number').textContent = String(index + 1).padStart(2, '0');
  $('#next-title').textContent = mission.title;
  $('#next-description').textContent = `${mission.description} · Etappe ${Math.min(state.stageProgress[index] + 1, STAGES_PER_MISSION)} von ${STAGES_PER_MISSION}`;
  $('#home-track').style.width = (summary.completed / MISSIONS.length * 100) + '%';
  $('#hero-start').onclick = () => startMission(index);
  $('#next-button').onclick = () => startMission(index);
}
function renderMissions() {
  const unlocked = unlockedMission();
  $('#mission-grid').innerHTML = MISSIONS.map((mission, index) => {
    const progress = state.stageProgress[index];
    const locked = index > unlocked;
    const done = progress >= STAGES_PER_MISSION;
    const status = locked ? '🔒 GESPERRT' : done ? '✓ GESCHAFFT' : `ETAPPE ${progress + 1} / ${STAGES_PER_MISSION}`;
    return `<article class="mission-card ${locked ? 'locked' : ''} ${done ? 'done' : ''}">
      <div class="mission-card-top"><span class="mission-num">MISSION ${String(index + 1).padStart(2, '0')}</span><span class="mission-status">${status}</span></div>
      <h3>${mission.title}</h3><p>${mission.description}</p>
      <div class="stage-track" aria-label="${progress} von ${STAGES_PER_MISSION} Etappen geschafft">${Array.from({length: STAGES_PER_MISSION}, (_, i) => `<span class="${i < progress ? 'filled' : ''}"></span>`).join('')}</div>
      <div class="key-tags">${mission.newKeys.split(' · ').map(key => `<span>${key}</span>`).join('')}</div>
      <button aria-label="${mission.title} ${locked ? 'gesperrt' : 'starten'}" data-mission="${index}" ${locked ? 'disabled' : ''}></button>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-mission]').forEach(button => button.onclick = () => startMission(Number(button.dataset.mission)));
}
function renderFocus() {
  $('#focus-letters').innerHTML = ALL_LETTERS.map(letter => `<button class="letter-choice ${state.focusLetters.includes(letter) ? 'selected' : ''}" data-focus-letter="${letter}" aria-pressed="${state.focusLetters.includes(letter)}">${keyLabel(letter)}</button>`).join('');
  document.querySelectorAll('[data-focus-letter]').forEach(button => button.onclick = () => toggleFocus(button.dataset.focusLetter));
  $('#focus-count').textContent = `${state.focusLetters.length} / 3 gewählt`;
  const chosen = state.focusLetters;
  $('#focus-preview-title').textContent = chosen.length ? `Wir üben ${chosen.map(keyLabel).join(' · ')}` : 'Welchen Buchstaben üben wir?';
  $('#focus-preview-copy').textContent = chosen.length ? FOCUS[chosen[0]].sentences[0] : 'Wähle links einen Buchstaben aus. Hier siehst du, welche Wörter dich erwarten.';
  $('#focus-words').innerHTML = chosen.flatMap(letter => FOCUS[letter].words.map(word => `<span>${word}</span>`)).join('');
  $('#focus-start').disabled = chosen.length === 0;
}
function toggleFocus(letter) {
  if (state.focusLetters.includes(letter)) {
    state.focusLetters = state.focusLetters.filter(x => x !== letter);
  } else if (state.focusLetters.length < 3) {
    state.focusLetters.push(letter);
  } else {
    $('#focus-preview-copy').textContent = 'Wähle höchstens drei Buchstaben. Du kannst einen abwählen und einen anderen dazunehmen.';
    return;
  }
  saveState();
  renderFocus();
}
function safeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
}
function renderProgress() {
  const h = state.history;
  $('#progress-count').textContent = h.length;
  $('#progress-avg-accuracy').textContent = h.length ? Math.round(h.reduce((sum, x) => sum + (Number(x.accuracy) || 0), 0) / h.length) + '%' : '—';
  $('#progress-avg-speed').textContent = h.length ? Math.round(h.reduce((sum, x) => sum + (Number(x.apm) || 0), 0) / h.length) + ' APM' : '—';
  $('#progress-minutes').textContent = Math.round(h.reduce((sum, x) => sum + (Number(x.seconds) || 0), 0) / 60);
  $('#history').innerHTML = h.length ? h.slice(-10).reverse().map(entry => {
    const title = entry.title || OLD_TITLES[entry.mission] || 'Mission';
    const stage = Number.isInteger(entry.stage) ? ` · Etappe ${entry.stage + 1}` : '';
    const date = new Date(entry.date);
    const dateText = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('de-DE', {day:'numeric', month:'short', year:'numeric'});
    return `<div class="history-row"><div><strong>${safeText(title + stage)}</strong><br><span>${dateText}</span></div><b>${Number(entry.accuracy) || 0}%</b><b>${Number(entry.apm) || 0} APM</b><span>${entry.passed ? '✓ geschafft' : '↻ geübt'}</span></div>`;
  }).join('') : '<div class="history-empty">Noch keine Runde getippt. Deine Reise beginnt mit der ersten Mission. ✳</div>';
}
function renderKeyboard() {
  const active = currentMission < 0 ? currentFocus.join('') : MISSIONS[currentMission].newKeys.toLowerCase();
  const available = currentMission < 0 ? ALL_LETTERS.join('') : MISSIONS[currentMission].keys;
  $('#keyboard').innerHTML = KEY_ROWS.map(row => `<div class="keyboard-row">${row.map(key => `<div class="key ${active.includes(key) ? 'new' : available.includes(key) ? 'available' : ''}" data-key="${key}">${keyLabel(key)}</div>`).join('')}</div>`).join('') + '<div class="keyboard-row"><div class="key wide">⇧ Shift</div><div class="key space available" data-key=" ">Leertaste</div><div class="key wide">⌫</div></div>';
  highlightNext();
}
function highlightNext() {
  document.querySelectorAll('.key.next').forEach(key => key.classList.remove('next'));
  const next = target[typed.length];
  if (next) [...document.querySelectorAll('[data-key]')].find(key => key.dataset.key === next)?.classList.add('next');
}
function prepareRound() {
  clearInterval(timer);
  typed = [];
  mistakes = 0;
  startedAt = null;
  finished = false;
  $('#typing-input').value = '';
  $('#typing-prompt').textContent = 'Hier klicken oder einfach lostippen ↗';
  renderKeyboard();
  renderTyping();
  show('play');
  setTimeout(() => $('#typing-input').focus(), 50);
}
function startMission(index) {
  if (index > unlockedMission()) return;
  currentMission = index;
  const mission = MISSIONS[index];
  const progress = state.stageProgress[index];
  currentStage = progress < STAGES_PER_MISSION ? progress : state.history.filter(entry => entry.mission === index).length % STAGES_PER_MISSION;
  target = mission.rounds[currentStage].join(' ');
  $('#play-step').textContent = `MISSION ${String(index + 1).padStart(2, '0')} / ${MISSIONS.length} · ETAPPE ${currentStage + 1} / ${STAGES_PER_MISSION}`;
  $('#play-newkeys').textContent = 'NEUE TASTEN · ' + mission.newKeys;
  $('#play-title').textContent = mission.title;
  $('#play-instruction').textContent = mission.instruction;
  prepareRound();
}
function startFocus() {
  if (!state.focusLetters.length) return;
  currentMission = -1;
  currentFocus = [...state.focusLetters];
  target = currentFocus.flatMap(letter => FOCUS[letter].sentences).join(' ');
  $('#play-step').textContent = 'WORTLABOR · DEINE AUSWAHL';
  $('#play-newkeys').textContent = 'DEINE BUCHSTABEN · ' + currentFocus.map(keyLabel).join(' · ');
  $('#play-title').textContent = 'Wörter mit ' + currentFocus.map(keyLabel).join(' · ');
  $('#play-instruction').textContent = 'Dasselbe wichtige Wort kommt wieder. Finde seinen Weg auf der Tastatur.';
  prepareRound();
}
function elapsed() { return startedAt ? Math.max(1, (Date.now() - startedAt) / 1000) : 0; }
function currentAccuracy() { return typed.length + mistakes ? Math.round(typed.length / (typed.length + mistakes) * 100) : 100; }
function currentApm() { return startedAt ? Math.round(typed.length / elapsed() * 60) : 0; }
function renderTyping() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < target.length; i++) {
    const span = document.createElement('span');
    span.textContent = target[i] === ' ' ? '\u00a0' : target[i];
    span.className = i < typed.length ? 'correct' : i === typed.length ? 'current' : 'pending';
    fragment.append(span);
  }
  $('#target-text').replaceChildren(fragment);
  $('#round-counter').textContent = `${typed.length} / ${target.length} ZEICHEN`;
  $('#round-progress').textContent = Math.round(typed.length / target.length * 100) + '%';
  $('#live-accuracy').textContent = currentAccuracy() + '%';
  $('#live-speed').innerHTML = `${currentApm()} <small>APM</small>`;
  $('#live-errors').textContent = mistakes;
  highlightNext();
}
function handleKey(event) {
  if (!$('#view-play').classList.contains('active') || finished) return;
  if (event.key === 'Tab' || event.key === 'Escape') return;
  if (event.key === 'Backspace') {
    event.preventDefault();
    if (typed.length) { typed.pop(); renderTyping(); }
    return;
  }
  if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
  event.preventDefault();
  const key = event.key.toLowerCase();
  if (!startedAt) { startedAt = Date.now(); timer = setInterval(renderTyping, 1000); }
  if (key === target[typed.length]) {
    typed.push(key);
    $('#typing-prompt').textContent = 'Super! Blick auf den Bildschirm behalten.';
    renderTyping();
    if (typed.length === target.length) finishRound();
  } else {
    mistakes++;
    const current = $('#target-text .current');
    current?.classList.add('wrong');
    $('#typing-prompt').textContent = 'Fast! Schau auf die leuchtende Taste und versuch es nochmal.';
    $('#live-accuracy').textContent = currentAccuracy() + '%';
    $('#live-errors').textContent = mistakes;
    setTimeout(() => current?.classList.remove('wrong'), 230);
  }
}
function finishRound() {
  finished = true;
  clearInterval(timer);
  const accuracy = currentAccuracy();
  const apm = currentApm();
  const passed = accuracy >= 85;
  const isFocus = currentMission < 0;
  state.history.push({
    kind: isFocus ? 'focus' : 'mission',
    mission: currentMission,
    stage: isFocus ? null : currentStage,
    focus: isFocus ? [...currentFocus] : undefined,
    title: isFocus ? 'Buchstabenwahl · ' + currentFocus.map(keyLabel).join(' · ') : MISSIONS[currentMission].title,
    accuracy, apm, errors: mistakes, seconds: elapsed(), date: new Date().toISOString(), passed
  });
  if (!isFocus && passed && currentStage === state.stageProgress[currentMission]) state.stageProgress[currentMission]++;
  saveState();
  $('#result-kicker').textContent = isFocus ? 'WÖRTER GEÜBT' : passed ? 'ETAPPE GESCHAFFT' : 'GUT GEÜBT';
  $('#result-title').textContent = passed ? 'Das war stark!' : 'Noch eine Runde?';
  $('#result-message').textContent = isFocus ? 'Diese Wörter kennst du jetzt schon besser. Wiederhole sie oder wähle neue Buchstaben.' : passed ? `Du hast Etappe ${currentStage + 1} von ${STAGES_PER_MISSION} geschafft. Die vertrauten Wörter kommen wieder.` : 'Tipp die Etappe noch einmal in Ruhe. Ab 85 % Genauigkeit geht es weiter.';
  $('#result-accuracy').textContent = accuracy + '%';
  $('#result-speed').textContent = apm;
  $('#result-errors').textContent = mistakes;
  let next;
  if (isFocus) {
    $('#result-primary').innerHTML = 'Buchstaben wählen <span>↗</span>';
    next = () => show('focus');
  } else if (!passed) {
    $('#result-primary').innerHTML = 'Etappe wiederholen <span>↗</span>';
    next = () => startMission(currentMission);
  } else if (state.stageProgress[currentMission] < STAGES_PER_MISSION) {
    $('#result-primary').innerHTML = 'Nächste Etappe <span>↗</span>';
    next = () => startMission(currentMission);
  } else if (currentMission < MISSIONS.length - 1) {
    $('#result-primary').innerHTML = 'Nächste Mission <span>↗</span>';
    next = () => startMission(currentMission + 1);
  } else {
    $('#result-primary').innerHTML = 'Missionen ansehen <span>↗</span>';
    next = () => show('missions');
  }
  $('#result-primary').onclick = next;
  show('result');
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => show(button.dataset.view)));
$('#focus-start').onclick = startFocus;
$('#exit-play').onclick = () => { clearInterval(timer); show(currentMission < 0 ? 'focus' : 'missions'); };
$('#result-repeat').onclick = () => currentMission < 0 ? startFocus() : startMission(currentMission);
$('#result-home').onclick = () => show('home');
$('#typing-input').addEventListener('keydown', handleKey);
document.addEventListener('keydown', event => {
  if ($('#view-play').classList.contains('active') && document.activeElement !== $('#typing-input') && !['Tab','Escape'].includes(event.key)) {
    $('#typing-input').focus();
    handleKey(event);
  }
});
document.querySelector('.play-panel').addEventListener('click', () => $('#typing-input').focus());
renderHome();
