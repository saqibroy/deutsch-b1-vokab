/**
 * DeutschTrainer — B1 Vocabulary Practice App
 * Main application logic
 */

;(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     CONSTANTS
     ══════════════════════════════════════════════════ */

  const STORAGE_KEY = 'b1vocab_v2_state';
  const HISTORY_KEY = 'b1vocab_v2_history';
  const CUSTOM_WORDS_KEY = 'b1vocab_v2_custom';
  const SETTINGS_KEY = 'b1vocab_v2_settings';

  // Strength: 0=new, 1=weak, 2=learning, 3=decent, 4=strong
  const STRENGTH_NAMES = ['New', 'Weak', 'Learning', 'Decent', 'Strong'];
  const PILL_CLASSES = ['pill-new', 'pill-weak', 'pill-learning', 'pill-learning', 'pill-strong'];
  const DOT_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#f59e0b', '#22c55e'];

  /* ══════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════ */

  let words = [];          // merged vocab (built-in + custom)
  let state = {};          // per-word state { strength, correct, wrong, lastSeen }
  let session = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };
  let currentIdx = 0;
  let prevIdx = -1;
  let recentHistory = [];  // last N indices shown — to avoid repeats
  const HISTORY_SIZE = 8;  // don't repeat any of the last 8 words
  let isFlipped = false;
  let direction = 'de';   // de | en | mix
  let mode = 'flash';     // flash | type | match
  let filterCat = 'all';
  let listOpen = false;
  let listSearch = '';
  let typedResult = null;

  // Match game state
  const MATCH_PAIRS = 6;   // pairs per round
  let matchWords = [];      // array of { idx, de, en }
  let matchTiles = [];      // shuffled tile objects { id, text, lang, wordIdx, matched }
  let matchSelected = null; // currently selected tile id or null
  let matchPairsFound = 0;
  let matchMistakes = 0;
  let matchRound = 1;
  let matchTimerSec = 0;
  let matchTimerInterval = null;
  let matchBusy = false;    // lock during animations

  /* ══════════════════════════════════════════════════
     INITIALIZATION
     ══════════════════════════════════════════════════ */

  function init() {
    loadWords();
    loadState();
    loadSettings();
    buildCategoryFilter();
    updateStats();
    renderWordList();
    bindEvents();
    registerSW();
    updateSessionLabel();

    // Start the appropriate mode
    if (mode === 'match') {
      // Hide card elements and show match
      $('cardScene').style.display = 'none';
      $('actionButtons').style.display = 'none';
      $('kbdHints').style.display = 'none';
      $('matchContainer').style.display = '';
      startMatchRound();
    } else {
      pickNext();
    }

    // Re-initialize icons after dynamic content
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function loadWords() {
    // Built-in words from data.js
    const builtIn = typeof VOCAB_DATA !== 'undefined' ? VOCAB_DATA : [];
    // Custom words from localStorage
    let custom = [];
    try {
      const raw = localStorage.getItem(CUSTOM_WORDS_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    words = [...builtIn, ...custom];
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) state = JSON.parse(saved);
    } catch (e) { /* ignore */ }
    // Ensure every word has state with all required fields
    words.forEach((_, i) => {
      if (!state[i]) {
        state[i] = { strength: 0, correct: 0, wrong: 0, lastSeen: 0 };
      } else {
        // Migrate old state entries missing lastSeen
        if (!state[i].lastSeen) state[i].lastSeen = 0;
      }
    });
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.direction) direction = s.direction;
        if (s.mode) mode = s.mode;
        if (s.filterCat) filterCat = s.filterCat;
      }
    } catch (e) { /* ignore */ }
    // Apply settings to UI
    setModeUI(mode);
    setDirUI(direction);
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ direction, mode, filterCat }));
  }

  /* ══════════════════════════════════════════════════
     EVENT BINDING
     ══════════════════════════════════════════════════ */

  function bindEvents() {
    // Card flip
    $('cardScene').addEventListener('click', flipCard);

    // Mode buttons
    $('modeFlash').addEventListener('click', () => setMode('flash'));
    $('modeType').addEventListener('click', () => setMode('type'));
    $('modeMatch').addEventListener('click', () => setMode('match'));

    // Direction buttons
    $('dirDE').addEventListener('click', () => setDir('de'));
    $('dirEN').addEventListener('click', () => setDir('en'));
    $('dirMix').addEventListener('click', () => setDir('mix'));

    // Action buttons
    $('btnWrong').addEventListener('click', markWrong);
    $('btnRight').addEventListener('click', markRight);

    // Reset
    $('resetBtn').addEventListener('click', resetAll);

    // Toggle word list
    $('listToggle').addEventListener('click', toggleList);

    // Search in word list
    $('wordSearch').addEventListener('input', (e) => {
      listSearch = e.target.value.trim().toLowerCase();
      renderWordList();
    });

    // Type mode
    $('typeInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkTyped();
    });
    $('typeSubmit').addEventListener('click', checkTyped);

    // Add words modal
    $('addWordsBtn').addEventListener('click', () => openModal('addModal'));
    $('statsBtn').addEventListener('click', () => { renderStatsModal(); openModal('statsModal'); });
    $('closeAddModal').addEventListener('click', () => closeModal('addModal'));
    $('closeAddModal2').addEventListener('click', () => closeModal('addModal'));
    $('closeStatsModal').addEventListener('click', () => closeModal('statsModal'));

    // X close buttons
    const closeAddX = $('closeAddModalX');
    if (closeAddX) closeAddX.addEventListener('click', () => closeModal('addModal'));
    const closeStatsX = $('closeStatsModalX');
    if (closeStatsX) closeStatsX.addEventListener('click', () => closeModal('statsModal'));

    // Modal tab switching
    $$('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => switchModalTab(tab));
    });

    // Add single word
    $('addSingleBtn').addEventListener('click', addSingleWord);

    // Bulk import
    $('bulkImportBtn').addEventListener('click', bulkImportWords);

    // Close modal on overlay click
    $$('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', (e) => {
        if (e.target === ov) ov.classList.remove('open');
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Swipe support for mobile
    let touchStartX = 0;
    const scene = $('cardScene');
    scene.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    scene.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 60) {
        if (isFlipped) {
          if (dx > 0) markRight();
          else markWrong();
        }
      }
    }, { passive: true });
  }

  function handleKeyboard(e) {
    // Don't intercept when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') e.target.blur();
      return;
    }

    // No keyboard shortcuts during match mode
    if (mode === 'match') return;

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        flipCard();
        break;
      case 'ArrowRight':
      case '2':
        if (isFlipped) markRight();
        break;
      case 'ArrowLeft':
      case '1':
        if (isFlipped) markWrong();
        break;
      case 'n':
        if (!isFlipped) pickNext();
        break;
    }
  }

  /* ══════════════════════════════════════════════════
     CARD LOGIC
     ══════════════════════════════════════════════════ */

  function getFilteredIndices() {
    const indices = [];
    words.forEach((w, i) => {
      if (filterCat === 'all' || w.cat === filterCat) indices.push(i);
    });
    return indices;
  }

  function pickNext() {
    const indices = getFilteredIndices();
    if (indices.length === 0) return;

    // ── Strategy ──
    // We use a two-phase approach:
    //  Phase 1: Decide WHAT TYPE of word to show (weak, new, or other)
    //  Phase 2: Pick a specific word from that pool
    //
    // This guarantees weak/wrong words get proper attention instead of
    // being drowned out by the sheer number of unseen words.

    const now = Date.now();

    // Categorize all filtered words into pools
    const pools = { weak: [], new_: [], learning: [], strong: [] };
    for (const i of indices) {
      const s = state[i];
      if (s.strength === 1) pools.weak.push(i);
      else if (s.strength === 0 && s.correct === 0 && s.wrong === 0) pools.new_.push(i);
      else if (s.strength === 0) pools.weak.push(i); // answered wrong, dropped back to 0
      else if (s.strength <= 2) pools.learning.push(i);
      else pools.strong.push(i);
    }

    // ── Phase 1: Pick which pool to draw from ──
    // Priority: weak words should appear ~50% of the time when they exist,
    // new words ~30%, learning ~15%, strong ~5%.
    // If a pool is empty, redistribute its share.
    const poolWeights = [];
    if (pools.weak.length > 0)     poolWeights.push({ pool: 'weak',     w: 50 });
    if (pools.new_.length > 0)     poolWeights.push({ pool: 'new_',     w: 30 });
    if (pools.learning.length > 0) poolWeights.push({ pool: 'learning', w: 15 });
    if (pools.strong.length > 0)   poolWeights.push({ pool: 'strong',   w: 5 });

    // Fallback: if somehow no pools, just use all indices
    if (poolWeights.length === 0) {
      pools.new_ = indices;
      poolWeights.push({ pool: 'new_', w: 1 });
    }

    const poolTotal = poolWeights.reduce((sum, p) => sum + p.w, 0);
    let poolRand = Math.random() * poolTotal;
    let chosenPool = poolWeights[0].pool;
    for (const p of poolWeights) {
      poolRand -= p.w;
      if (poolRand <= 0) { chosenPool = p.pool; break; }
    }

    const candidates = pools[chosenPool];

    // ── Phase 2: Pick a word from the chosen pool ──
    // Within the pool, prefer words NOT recently shown.
    // Use a mild recency penalty (not the crushing one from before).
    const candidateWeights = [];
    for (const i of candidates) {
      const s = state[i];
      let w = 10; // base weight (equal within pool)

      // Words with more wrongs get slight boost within the pool
      if (s.wrong > 0) {
        w += Math.min(s.wrong * 2, 10);
      }

      // Recency: prefer words not shown recently, but don't crush them
      const recentPos = recentHistory.indexOf(i);
      if (recentPos !== -1) {
        if (recentPos < 3) {
          // Last 3 shown: strong penalty — avoid immediate repeats
          w *= 0.05;
        } else {
          // Shown 4-8 ago: mild penalty — they can come back soon
          w *= 0.4;
        }
      }

      // Time-since-last-seen bonus for weak words
      if (s.lastSeen && chosenPool === 'weak') {
        const secsSince = (now - s.lastSeen) / 1000;
        if (secsSince > 30) {
          // Boost words not seen in last 30 seconds, up to 2x
          w *= Math.min(2, 1 + secsSince / 120);
        }
      }

      candidateWeights.push({ idx: i, weight: Math.max(w, 0.01) });
    }

    // Weighted random from candidates
    const totalWeight = candidateWeights.reduce((sum, c) => sum + c.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = candidateWeights[0].idx;
    for (const c of candidateWeights) {
      rand -= c.weight;
      if (rand <= 0) { chosen = c.idx; break; }
    }

    // Update history
    recentHistory.unshift(chosen);
    if (recentHistory.length > HISTORY_SIZE) {
      recentHistory.pop();
    }

    // Track last seen time
    state[chosen].lastSeen = now;

    prevIdx = currentIdx;
    currentIdx = chosen;
    showCard();
  }

  function getCardDirection() {
    if (direction === 'mix') return Math.random() < 0.5 ? 'de' : 'en';
    return direction;
  }

  function showCard() {
    const w = words[currentIdx];
    if (!w) return;
    const s = state[currentIdx];
    const dir = getCardDirection();

    isFlipped = false;
    typedResult = null;
    $('cardInner').classList.remove('flipped');

    // Meta
    $('strengthDot').style.background = DOT_COLORS[s.strength];
    $('cardCatText').textContent = w.cat;

    const filtered = getFilteredIndices();
    const posInFiltered = filtered.indexOf(currentIdx) + 1;
    $('cardCounter').textContent = `${posInFiltered} / ${filtered.length}`;

    // Language badge
    const langBadge = $('cardLangBadge');
    if (dir === 'de') {
      langBadge.textContent = 'DE';
      langBadge.className = 'card-lang-badge de';
    } else {
      langBadge.textContent = 'EN';
      langBadge.className = 'card-lang-badge en';
    }

    // Front content
    if (dir === 'de') {
      $('cardType').textContent = w.type;
      $('cardFrontWord').textContent = w.de;
      $('cardBackWord').textContent = w.en;
    } else {
      $('cardType').textContent = '';
      $('cardFrontWord').textContent = w.en;
      $('cardBackWord').textContent = w.de;
    }

    // Example
    const ex = w.ex.replace(/\{([^}]+)\}/g, '<strong>$1</strong>');
    $('cardExample').innerHTML = ex;

    // Store current direction for typed check
    $('cardScene').dataset.dir = dir;

    // Show/hide elements
    $('actionButtons').classList.add('actions-hidden');
    $('tapHint').style.display = '';

    // Type mode
    const typeWrap = $('typeInputWrap');
    if (mode === 'type') {
      typeWrap.classList.add('show');
      const inp = $('typeInput');
      inp.value = '';
      inp.className = 'type-input';
      inp.disabled = false;
      inp.placeholder = dir === 'de' ? 'Type the English translation...' : 'Gib die deutsche Übersetzung ein...';
      setTimeout(() => inp.focus(), 80);
      $('cardScene').style.pointerEvents = 'none';
    } else {
      typeWrap.classList.remove('show');
      $('cardScene').style.pointerEvents = '';
    }

    // Re-initialize lucide icons for any new elements
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Animate card entrance
    const scene = $('cardScene');
    scene.classList.remove('card-enter', 'card-correct', 'card-wrong');
    void scene.offsetWidth;
    scene.classList.add('card-enter');
    setTimeout(() => scene.classList.remove('card-enter'), 500);
  }

  function flipCard() {
    if (mode === 'type') return;
    const inner = $('cardInner');

    if (isFlipped) {
      inner.classList.remove('flipped');
      isFlipped = false;
      $('actionButtons').classList.add('actions-hidden');
      $('tapHint').style.display = '';
    } else {
      inner.classList.add('flipped');
      isFlipped = true;
      $('actionButtons').classList.remove('actions-hidden');
      $('tapHint').style.display = 'none';
    }
  }

  function checkTyped() {
    if (typedResult !== null) return;
    const inp = $('typeInput');
    const userAnswer = inp.value.trim().toLowerCase();
    if (!userAnswer) return;

    const w = words[currentIdx];
    const dir = $('cardScene').dataset.dir || direction;
    const correctRaw = dir === 'de' ? w.en : w.de;

    // Parse variants (slash or comma separated)
    const variants = correctRaw.toLowerCase()
      .split(/[\/,]/)
      .map(v => v.trim())
      .filter(Boolean);

    // Check match (lenient)
    const isCorrect = variants.some(v => {
      const vClean = normalize(v);
      const uClean = normalize(userAnswer);
      if (vClean === uClean) return true;
      // Allow partial matches for compound words
      if (vClean.includes(uClean) && uClean.length >= 3) return true;
      if (uClean.includes(vClean) && vClean.length >= 3) return true;
      // Ignore articles for nouns
      const vNoArt = vClean.replace(/^(der|die|das|ein|eine|the|a|an|to)\s+/i, '');
      const uNoArt = uClean.replace(/^(der|die|das|ein|eine|the|a|an|to)\s+/i, '');
      return vNoArt === uNoArt;
    });

    typedResult = isCorrect;
    inp.className = 'type-input ' + (isCorrect ? 'correct' : 'incorrect');
    inp.disabled = true;

    // Show celebration for typed correct answers
    if (isCorrect && typeof confetti === 'function') {
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.65 }, gravity: 1.1 });
      spawnCelebrationEmoji('✨');
    }

    // Auto-mark based on typed result
    $('cardInner').classList.add('flipped');
    isFlipped = true;
    $('cardScene').style.pointerEvents = '';
    $('actionButtons').classList.remove('actions-hidden');
    $('tapHint').style.display = 'none';

    // If correct in type mode, auto-advance after delay
    if (isCorrect) {
      setTimeout(() => markRight(), 600);
    }
  }

  function normalize(str) {
    return str
      .replace(/[^a-zäöüßéèêàâ\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ══════════════════════════════════════════════════
     SCORING
     ══════════════════════════════════════════════════ */

  function markRight() {
    const s = state[currentIdx];
    s.correct++;
    s.strength = Math.min(4, s.strength + 1);
    session.correct++;
    session.streak++;
    if (session.streak > session.bestStreak) session.bestStreak = session.streak;

    saveState();
    flashFeedback('right');
    animateCard('correct');
    animateStatBump('statCorrect', 'up');
    updateStats();
    updateStreakBadge();
    renderWordList();

    // Celebrate with confetti and emojis on every correct answer!
    if (typeof confetti === 'function') {
      // Small burst on every correct
      confetti({ particleCount: 25, spread: 40, origin: { y: 0.65 }, gravity: 1.2, scalar: 0.8 });
      
      // Bigger bursts at milestones
      if (session.streak === 3) {
        confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 } });
        spawnCelebrationEmoji('🔥');
      } else if (session.streak === 5) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 } });
        spawnCelebrationEmoji('⭐');
      } else if (session.streak === 10) {
        // Double burst from both sides
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
        spawnCelebrationEmoji('🏆');
      } else if (session.streak > 0 && session.streak % 25 === 0) {
        // Fireworks!
        const duration = 1500;
        const end = Date.now() + duration;
        (function frame() {
          confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } });
          confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
        spawnCelebrationEmoji('🎆');
      }
      
      // Level up celebration (when strength increases to a new level)
      if (s.strength === 4) {
        spawnCelebrationEmoji('💪');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 }, colors: ['#22c55e', '#10b981', '#059669'] });
      }
    }

    setTimeout(pickNext, 350);
  }

  function markWrong() {
    const s = state[currentIdx];
    s.wrong++;
    s.strength = Math.max(0, s.strength - 1);
    if (s.strength > 1) s.strength = 1; // drop to weak
    session.wrong++;
    session.streak = 0;

    saveState();
    flashFeedback('wrong');
    animateCard('wrong');
    animateStatBump('statWrong', 'down');
    updateStats();
    updateStreakBadge();
    renderWordList();
    setTimeout(pickNext, 400);
  }

  function flashFeedback(type) {
    const ov = $('feedbackOverlay');
    ov.className = 'feedback-overlay show-' + type;
    setTimeout(() => { ov.className = 'feedback-overlay'; }, 600);
  }

  function animateCard(type) {
    const scene = $('cardScene');
    scene.classList.remove('card-correct', 'card-wrong', 'card-enter');
    // Force reflow
    void scene.offsetWidth;
    scene.classList.add('card-' + type);
    setTimeout(() => scene.classList.remove('card-' + type), 600);
  }

  function animateStatBump(statId, dir) {
    const el = $(statId);
    if (!el) return;
    el.classList.remove('bump', 'bump-down');
    void el.offsetWidth;
    el.classList.add(dir === 'up' ? 'bump' : 'bump-down');
    setTimeout(() => el.classList.remove('bump', 'bump-down'), 500);
  }

  function spawnCelebrationEmoji(emoji) {
    const el = document.createElement('div');
    el.className = 'celebration-emoji';
    el.textContent = emoji;
    
    // Position near the card center
    const card = $('cardScene');
    const rect = card ? card.getBoundingClientRect() : { left: window.innerWidth / 2 - 20, top: window.innerHeight / 2 };
    el.style.left = (rect.left + rect.width / 2 - 16 + (Math.random() - 0.5) * 80) + 'px';
    el.style.top = (rect.top + rect.height / 2) + 'px';
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  /* ══════════════════════════════════════════════════
     STATS & UI UPDATES
     ══════════════════════════════════════════════════ */

  function updateStats() {
    const total = session.correct + session.wrong;
    const acc = total === 0 ? '—' : Math.round(session.correct / total * 100) + '%';

    $('statCorrect').textContent = session.correct;
    $('statWrong').textContent = session.wrong;
    $('statAccuracy').textContent = acc;

    const strong = Object.values(state).filter(s => s.strength >= 4).length;
    $('statStrong').textContent = strong;
    $('statStreak').textContent = session.streak > 0 ? session.streak : '—';

    // Progress bar segments
    const counts = { strong: 0, decent: 0, learning: 0, weak: 0, new_: 0 };
    const filtered = getFilteredIndices();
    filtered.forEach(i => {
      const lvl = state[i].strength;
      if (lvl >= 4) counts.strong++;
      else if (lvl === 3) counts.decent++;
      else if (lvl === 2) counts.learning++;
      else if (lvl === 1) counts.weak++;
      else counts.new_++;
    });

    const n = filtered.length || 1;
    $('progStrong').style.width = (counts.strong / n * 100) + '%';
    $('progDecent').style.width = (counts.decent / n * 100) + '%';
    $('progLearning').style.width = (counts.learning / n * 100) + '%';
    $('progWeak').style.width = (counts.weak / n * 100) + '%';

    const mastered = counts.strong + counts.decent;
    $('progressLeft').textContent = `${mastered} mastered`;
    $('progressRight').textContent = `${filtered.length} words`;
  }

  function updateStreakBadge() {
    const badge = $('streakBadge');
    if (session.streak >= 3) {
      badge.textContent = `🔥 ${session.streak} streak!`;
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  }

  function updateSessionLabel() {
    const now = new Date();
    const h = now.getHours();
    let greeting;
    if (h < 12) greeting = 'Guten Morgen!';
    else if (h < 18) greeting = 'Guten Tag!';
    else greeting = 'Guten Abend!';
    $('sessionLabel').textContent = greeting;
  }

  /* ══════════════════════════════════════════════════
     WORD LIST
     ══════════════════════════════════════════════════ */

  function renderWordList() {
    const body = $('wordListBody');
    body.innerHTML = '';

    const filtered = getFilteredIndices();
    const searchTerm = listSearch;

    filtered.forEach(i => {
      const w = words[i];
      const s = state[i];

      // Search filter
      if (searchTerm) {
        const hay = (w.de + ' ' + w.en + ' ' + w.type + ' ' + w.cat).toLowerCase();
        if (!hay.includes(searchTerm)) return;
      }

      const lvl = s.strength;
      const row = document.createElement('div');
      row.className = 'word-row';
      row.innerHTML = `
        <div>
          <div class="word-de">${esc(w.de)}</div>
          <span class="word-type-inline">${esc(w.type)}</span>
        </div>
        <div class="word-en">${esc(w.en)}</div>
        <div><span class="strength-pill ${PILL_CLASSES[lvl]}">${STRENGTH_NAMES[lvl]}</span></div>
      `;
      body.appendChild(row);
    });

    if (body.children.length === 0) {
      body.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.82rem;">No words found</div>';
    }
  }

  function toggleList() {
    listOpen = !listOpen;
    $('wordList').classList.toggle('open', listOpen);
    const btn = $('listToggle');
    btn.classList.toggle('open', listOpen);
    // Update text inside the button
    const spans = btn.querySelectorAll('span');
    if (spans.length > 0) {
      spans[0].textContent = (listOpen ? 'Hide words' : 'All words') + ' (' + words.length + ')';
    }
  }

  /* ══════════════════════════════════════════════════
     MODE & DIRECTION
     ══════════════════════════════════════════════════ */

  function setMode(m) {
    mode = m;
    setModeUI(m);
    saveSettings();

    // Toggle visibility of practice areas
    const cardScene = $('cardScene');
    const typeWrap = $('typeInputWrap');
    const actions = $('actionButtons');
    const kbdHints = $('kbdHints');
    const matchCont = $('matchContainer');

    if (m === 'match') {
      cardScene.style.display = 'none';
      typeWrap.classList.remove('show');
      actions.style.display = 'none';
      kbdHints.style.display = 'none';
      matchCont.style.display = '';
      startMatchRound();
    } else {
      cardScene.style.display = '';
      actions.style.display = '';
      kbdHints.style.display = '';
      matchCont.style.display = 'none';
      stopMatchTimer();
      showCard();
    }
  }

  function setModeUI(m) {
    $('modeFlash').classList.toggle('active', m === 'flash');
    $('modeType').classList.toggle('active', m === 'type');
    $('modeMatch').classList.toggle('active', m === 'match');
  }

  function setDir(d) {
    direction = d;
    setDirUI(d);
    saveSettings();
    showCard();
  }

  function setDirUI(d) {
    $('dirDE').classList.toggle('active', d === 'de');
    $('dirEN').classList.toggle('active', d === 'en');
    $('dirMix').classList.toggle('active', d === 'mix');
  }

  /* ══════════════════════════════════════════════════
     CATEGORY FILTER
     ══════════════════════════════════════════════════ */

  function buildCategoryFilter() {
    const cats = new Set();
    words.forEach(w => cats.add(w.cat));
    const sorted = [...cats].sort();

    const container = $('catFilter');
    container.innerHTML = '';

    // All chip
    const allChip = document.createElement('button');
    allChip.className = 'cat-chip' + (filterCat === 'all' ? ' active' : '');
    allChip.textContent = `All (${words.length})`;
    allChip.addEventListener('click', () => setCatFilter('all'));
    container.appendChild(allChip);

    sorted.forEach(cat => {
      const count = words.filter(w => w.cat === cat).length;
      const chip = document.createElement('button');
      chip.className = 'cat-chip' + (filterCat === cat ? ' active' : '');
      chip.textContent = `${cat} (${count})`;
      chip.addEventListener('click', () => setCatFilter(cat));
      container.appendChild(chip);
    });
  }

  function setCatFilter(cat) {
    filterCat = cat;
    saveSettings();
    buildCategoryFilter();
    updateStats();
    renderWordList();
    if (mode === 'match') {
      matchRound = 1;
      startMatchRound();
    } else {
      pickNext();
    }
  }

  /* ══════════════════════════════════════════════════
     MATCH GAME
     ══════════════════════════════════════════════════ */

  function startMatchRound() {
    // Pick words — prefer weak & new, then learning, then strong
    const indices = getFilteredIndices();
    if (indices.length < MATCH_PAIRS) {
      showToast('Need at least ' + MATCH_PAIRS + ' words for Match mode.', 'error');
      setMode('flash');
      return;
    }

    // Sort by priority: weak first, then new, then learning, then strong
    const sorted = [...indices].sort((a, b) => {
      const sa = state[a], sb = state[b];
      const prioA = sa.strength <= 1 ? 0 : sa.strength <= 2 ? 1 : 2;
      const prioB = sb.strength <= 1 ? 0 : sb.strength <= 2 ? 1 : 2;
      if (prioA !== prioB) return prioA - prioB;
      // Within same priority, randomize
      return Math.random() - 0.5;
    });

    // Take first MATCH_PAIRS, then shuffle for variety
    const picked = sorted.slice(0, MATCH_PAIRS);
    matchWords = picked.map(i => ({ idx: i, de: words[i].de, en: words[i].en }));

    // Build tiles: one DE tile + one EN tile per word
    matchTiles = [];
    matchWords.forEach((w, pairId) => {
      matchTiles.push({ id: 'de-' + pairId, text: w.de, lang: 'de', pairId, matched: false });
      matchTiles.push({ id: 'en-' + pairId, text: w.en, lang: 'en', pairId, matched: false });
    });

    // Shuffle tiles (Fisher-Yates)
    for (let i = matchTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matchTiles[i], matchTiles[j]] = [matchTiles[j], matchTiles[i]];
    }

    matchSelected = null;
    matchPairsFound = 0;
    matchMistakes = 0;
    matchBusy = false;

    // UI
    $('matchRound').textContent = 'Round ' + matchRound;
    $('matchPairs').textContent = '0 / ' + MATCH_PAIRS + ' matched';
    $('matchResult').style.display = 'none';
    $('matchGrid').style.display = '';

    renderMatchGrid();
    startMatchTimer();
  }

  function renderMatchGrid() {
    const grid = $('matchGrid');
    grid.innerHTML = '';
    matchTiles.forEach(tile => {
      const el = document.createElement('div');
      el.className = 'match-tile ' + tile.lang + '-tile' + (tile.matched ? ' matched' : '');
      el.dataset.tileId = tile.id;
      el.innerHTML = `
        <span class="match-tile-lang">${tile.lang === 'de' ? 'DE' : 'EN'}</span>
        <span class="match-tile-word">${esc(tile.text)}</span>
      `;
      if (!tile.matched) {
        el.addEventListener('click', () => onMatchTileClick(tile.id));
      }
      grid.appendChild(el);
    });
  }

  function onMatchTileClick(tileId) {
    if (matchBusy) return;

    const tile = matchTiles.find(t => t.id === tileId);
    if (!tile || tile.matched) return;

    const el = $('matchGrid').querySelector(`[data-tile-id="${tileId}"]`);
    if (!el) return;

    // First selection
    if (matchSelected === null) {
      matchSelected = tileId;
      el.classList.add('selected');
      return;
    }

    // Clicked same tile — deselect
    if (matchSelected === tileId) {
      matchSelected = null;
      el.classList.remove('selected');
      return;
    }

    const firstTile = matchTiles.find(t => t.id === matchSelected);
    const firstEl = $('matchGrid').querySelector(`[data-tile-id="${matchSelected}"]`);

    // Must select one DE and one EN tile
    if (firstTile.lang === tile.lang) {
      // Same language — switch selection
      if (firstEl) firstEl.classList.remove('selected');
      matchSelected = tileId;
      el.classList.add('selected');
      return;
    }

    // Check if it's a match (same pairId)
    el.classList.add('selected');
    matchBusy = true;

    if (firstTile.pairId === tile.pairId) {
      // ✅ Correct match!
      setTimeout(() => {
        firstTile.matched = true;
        tile.matched = true;
        matchPairsFound++;

        if (firstEl) {
          firstEl.classList.remove('selected');
          firstEl.classList.add('just-matched');
          setTimeout(() => {
            firstEl.classList.remove('just-matched');
            firstEl.classList.add('matched');
          }, 350);
        }
        el.classList.remove('selected');
        el.classList.add('just-matched');
        setTimeout(() => {
          el.classList.remove('just-matched');
          el.classList.add('matched');
        }, 350);

        // Update strength for this word
        const wordEntry = matchWords[firstTile.pairId];
        const s = state[wordEntry.idx];
        s.correct++;
        s.strength = Math.min(4, s.strength + 1);
        s.lastSeen = Date.now();
        session.correct++;
        session.streak++;
        if (session.streak > session.bestStreak) session.bestStreak = session.streak;
        saveState();
        updateStats();
        updateStreakBadge();

        $('matchPairs').textContent = matchPairsFound + ' / ' + MATCH_PAIRS + ' matched';
        matchSelected = null;
        matchBusy = false;

        // Small confetti burst on each correct match
        if (typeof confetti === 'function') {
          confetti({ particleCount: 20, spread: 35, origin: { y: 0.6 }, gravity: 1.3, scalar: 0.7 });
        }

        // Check round completion
        if (matchPairsFound === MATCH_PAIRS) {
          setTimeout(endMatchRound, 500);
        }
      }, 200);
    } else {
      // ✗ Wrong match
      matchMistakes++;
      session.wrong++;
      session.streak = 0;
      updateStats();
      updateStreakBadge();

      if (firstEl) firstEl.classList.add('wrong');
      el.classList.add('wrong');

      setTimeout(() => {
        if (firstEl) {
          firstEl.classList.remove('selected', 'wrong');
        }
        el.classList.remove('selected', 'wrong');
        matchSelected = null;
        matchBusy = false;
      }, 500);
    }
  }

  function endMatchRound() {
    stopMatchTimer();
    $('matchGrid').style.display = 'none';
    $('matchResult').style.display = '';

    const perfect = matchMistakes === 0;
    $('matchResultIcon').textContent = perfect ? '🎉' : (matchMistakes <= 2 ? '👏' : '💪');
    $('matchResultTitle').textContent = perfect ? 'Perfect Round!' : 'Round Complete!';

    // Fire confetti on round completion
    if (typeof confetti === 'function') {
      if (perfect) {
        // Big celebration: fireworks from both sides
        confetti({ particleCount: 80, angle: 60, spread: 65, origin: { x: 0, y: 0.6 } });
        confetti({ particleCount: 80, angle: 120, spread: 65, origin: { x: 1, y: 0.6 } });
        setTimeout(() => {
          confetti({ particleCount: 50, spread: 100, origin: { y: 0.4 } });
        }, 300);
        spawnCelebrationEmoji('🎉');
        spawnCelebrationEmoji('⭐');
      } else {
        // Smaller celebration for non-perfect
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        spawnCelebrationEmoji('👏');
      }
    }

    const minutes = Math.floor(matchTimerSec / 60);
    const seconds = matchTimerSec % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    $('matchResultStats').innerHTML = `
      <div>⏱ Time: <strong>${timeStr}</strong></div>
      <div>✓ Pairs matched: <strong class="green">${MATCH_PAIRS}</strong></div>
      <div>✗ Mistakes: <strong class="${matchMistakes === 0 ? 'green' : 'red'}">${matchMistakes}</strong></div>
    `;

    // Bind next round button
    $('matchNextRound').onclick = () => {
      matchRound++;
      startMatchRound();
    };

    renderWordList();
  }

  function startMatchTimer() {
    stopMatchTimer();
    matchTimerSec = 0;
    const timerEl = $('matchTimer');
    const timerSpan = timerEl.querySelector('span');
    if (timerSpan) timerSpan.textContent = '0:00';
    else timerEl.textContent = '0:00';
    matchTimerInterval = setInterval(() => {
      matchTimerSec++;
      const m = Math.floor(matchTimerSec / 60);
      const s = matchTimerSec % 60;
      const timeText = m + ':' + (s < 10 ? '0' : '') + s;
      const span = timerEl.querySelector('span');
      if (span) span.textContent = timeText;
      else timerEl.textContent = timeText;
    }, 1000);
  }

  function stopMatchTimer() {
    if (matchTimerInterval) {
      clearInterval(matchTimerInterval);
      matchTimerInterval = null;
    }
  }

  /* ══════════════════════════════════════════════════
     RESET
     ══════════════════════════════════════════════════ */

  function resetAll() {
    if (!confirm('Reset all progress? This cannot be undone.')) return;

    // Save session to history before reset
    saveSessionToHistory();

    state = {};
    words.forEach((_, i) => state[i] = { strength: 0, correct: 0, wrong: 0, lastSeen: 0 });
    session = { correct: 0, wrong: 0, streak: 0, bestStreak: 0 };
    recentHistory = [];
    matchRound = 1;
    stopMatchTimer();
    saveState();
    updateStats();
    updateStreakBadge();
    renderWordList();

    // If in match mode, restart a fresh round
    if (mode === 'match') {
      startMatchRound();
    } else {
      pickNext();
    }
    showToast('Progress reset. Fresh start! 🌱');
  }

  /* ══════════════════════════════════════════════════
     SESSION HISTORY
     ══════════════════════════════════════════════════ */

  function saveSessionToHistory() {
    if (session.correct + session.wrong === 0) return;

    let history = [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) history = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    history.push({
      date: new Date().toISOString(),
      correct: session.correct,
      wrong: session.wrong,
      bestStreak: session.bestStreak,
    });

    // Keep last 50 sessions
    if (history.length > 50) history = history.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return [];
  }

  /* ══════════════════════════════════════════════════
     STATS MODAL
     ══════════════════════════════════════════════════ */

  function renderStatsModal() {
    // Calculate all-time stats
    let totalCorrect = 0, totalWrong = 0;
    Object.values(state).forEach(s => {
      totalCorrect += s.correct;
      totalWrong += s.wrong;
    });
    const totalReviews = totalCorrect + totalWrong;
    const allTimeAcc = totalReviews > 0 ? Math.round(totalCorrect / totalReviews * 100) + '%' : '—';

    // Strength distribution
    const dist = [0, 0, 0, 0, 0];
    Object.values(state).forEach(s => dist[s.strength]++);

    $('allTimeReviews').textContent = totalReviews;
    $('allTimeAccuracy').textContent = allTimeAcc;
    $('allTimeBestStreak').textContent = Math.max(session.bestStreak, ...getHistory().map(h => h.bestStreak || 0), 0);
    $('allTimeWords').textContent = words.length;

    // Distribution
    $('distNew').textContent = dist[0];
    $('distWeak').textContent = dist[1];
    $('distLearning').textContent = dist[2] + dist[3];
    $('distStrong').textContent = dist[4];

    // History
    const historyList = $('historyList');
    const history = getHistory();
    if (history.length === 0) {
      historyList.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:0.78rem;">No previous sessions yet</div>';
    } else {
      historyList.innerHTML = '';
      [...history].reverse().slice(0, 20).forEach(h => {
        const d = new Date(h.date);
        const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
        const total = h.correct + h.wrong;
        const acc = total > 0 ? Math.round(h.correct / total * 100) + '%' : '—';
        const row = document.createElement('div');
        row.className = 'history-row';
        row.innerHTML = `
          <span class="history-date">${dateStr}</span>
          <div class="history-stats">
            <span class="history-correct">✓ ${h.correct}</span>
            <span class="history-wrong">✗ ${h.wrong}</span>
            <span class="history-accuracy">${acc}</span>
          </div>
        `;
        historyList.appendChild(row);
      });
    }
  }

  /* ══════════════════════════════════════════════════
     ADD WORDS
     ══════════════════════════════════════════════════ */

  function addSingleWord() {
    const de = $('addDe').value.trim();
    const en = $('addEn').value.trim();
    const type = $('addType').value.trim() || 'Noun';
    const cat = $('addCat').value.trim() || 'Custom';
    const ex = $('addEx').value.trim() || `Beispiel mit {${de.replace(/^(der|die|das)\s+/i, '')}}.`;

    if (!de || !en) {
      showToast('Please fill in both German and English fields.', 'error');
      return;
    }

    const newWord = { de, en, type, cat, ex };
    addCustomWords([newWord]);

    // Clear form
    $('addDe').value = '';
    $('addEn').value = '';
    $('addType').value = '';
    $('addCat').value = '';
    $('addEx').value = '';

    showToast(`Added: ${de} → ${en} ✓`);
  }

  function bulkImportWords() {
    const raw = $('bulkInput').value.trim();
    if (!raw) {
      showToast('Please paste some words to import.', 'error');
      return;
    }

    const lines = raw.split('\n').filter(l => l.trim());
    const newWords = [];
    const errors = [];

    lines.forEach((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 2) {
        errors.push(`Line ${idx + 1}: need at least German | English`);
        return;
      }
      const [de, en, type, cat, ex] = parts;
      newWords.push({
        de,
        en,
        type: type || 'Noun',
        cat: cat || 'Custom',
        ex: ex || `Beispiel mit {${de.replace(/^(der|die|das)\s+/i, '')}}.`,
      });
    });

    if (newWords.length > 0) {
      addCustomWords(newWords);
      $('bulkInput').value = '';
      let msg = `Imported ${newWords.length} word${newWords.length > 1 ? 's' : ''} ✓`;
      if (errors.length > 0) msg += ` (${errors.length} skipped)`;
      showToast(msg);
    } else {
      showToast('No valid words found. Check the format.', 'error');
    }

    // Show result
    const result = $('importResult');
    if (errors.length > 0) {
      result.className = 'import-result error';
      result.textContent = errors.join('; ');
    } else if (newWords.length > 0) {
      result.className = 'import-result success';
      result.textContent = `Successfully imported ${newWords.length} word(s)!`;
    }
  }

  function addCustomWords(newWords) {
    let custom = [];
    try {
      const raw = localStorage.getItem(CUSTOM_WORDS_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    custom.push(...newWords);
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(custom));

    // Reload
    loadWords();
    loadState();
    saveState();
    buildCategoryFilter();
    updateStats();
    renderWordList();
  }

  /* ══════════════════════════════════════════════════
     MODAL
     ══════════════════════════════════════════════════ */

  function openModal(id) {
    $(id).classList.add('open');
  }

  function closeModal(id) {
    $(id).classList.remove('open');
  }

  function switchModalTab(tab) {
    const parent = tab.closest('.modal');
    parent.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('.modal-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    parent.querySelector(`[data-panel="${target}"]`).classList.add('active');
  }

  /* ══════════════════════════════════════════════════
     TOAST
     ══════════════════════════════════════════════════ */

  function showToast(message, type = 'info') {
    const container = $('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') toast.style.borderColor = 'var(--red-dim)';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  /* ══════════════════════════════════════════════════
     SERVICE WORKER
     ══════════════════════════════════════════════════ */

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed (likely not served over HTTPS or localhost)
        // Try relative path
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  /* ══════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════ */

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }
  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Save session on page unload
  window.addEventListener('beforeunload', () => {
    saveSessionToHistory();
  });

  /* ══════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
