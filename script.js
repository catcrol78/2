// ===== State =====
let currentLang = localStorage.getItem("lang") || "ru";

// songs-data.js should define: const songsDataFromExternal = [...]
const allSongs = (typeof songsDataFromExternal !== "undefined" && Array.isArray(songsDataFromExternal))
  ? songsDataFromExternal
  : [];

let filteredSongs = [...allSongs];
let selectedSongId = null;
let visibleCount = 20;

// ===== i18n =====
const i18n = {
  ru: {
    siteTitle: "Каталог испанских песен",
    admin: "Админка",
    filtersTitle: "Поиск и фильтры",
    collapseHint: "нажми, чтобы свернуть",
    search: "Поиск",
    searchPlaceholder: "Название, автор, ключевое слово...",
    level: "Уровень",
    culture: "Культура",
    restrFilters: "Ограничения",
    exclude16: "Исключить 16+",
    excludeOtherLang: "Исключить другой язык",
    apply: "Применить",
    reset: "Сбросить",
    foundLabel: "Найдено песен:",
    welcome: "Добро пожаловать!",
    welcomeText: "Выберите песню из списка, чтобы увидеть её детали.",
    songList: "Список песен",
    mobileDetail: "Детали",
    mobileList: "Список",
    sortRelevance: "По релевантности",
    sortTitle: "По названию",
    sortArtist: "По исполнителю",
    loadMore: "Показать ещё",
    footerNote: "Каталог для учителей: испанский по песням",
    videoFallback: "Если видео не отображается, открой его по ссылке:",
    downloadPdf: "Скачать PDF",

    tabLyrics: "Текст",
    tabGrammar: "Грамматика",
    tabTasks: "Задания",
    tabVocab: "Лексика",
    tabCulture: "Культура",
    tabRestrictions: "Ограничения",

    lyricsHeader: "Текст / таймкоды",
    grammarHeader: "Грамматические заметки",
    tasksHeader: "Задания",
    tasksEmpty: "Для этой песни задания пока не добавлены.",
    vocabHeader: "Ключевая лексика",
    cultureHeader: "Культура / реалии",
    restrHeader: "Ограничения",

    allLevels: "Все уровни",
    allCulture: "Любая культура",
    culture_geography: "География",
    culture_neighborhoods: "Районы/места",
    culture_holidays: "Праздники",
    culture_traditions: "Традиции",
    culture_food: "Еда",
    culture_dance_music: "Танцы/музыка",

    listShowing: (shown, total) => `Показано: ${shown} из ${total}`,
    noMatches: "Ничего не найдено по текущим фильтрам.",

    showAnswer: "Показать ответ",
    hideAnswer: "Скрыть ответ"
  },
  es: {
    siteTitle: "Catálogo de canciones en español",
    admin: "Admin",
    filtersTitle: "Búsqueda y filtros",
    collapseHint: "toca para contraer",
    search: "Buscar",
    searchPlaceholder: "Título, artista, palabra clave...",
    level: "Nivel",
    culture: "Cultura",
    restrFilters: "Restricciones",
    exclude16: "Excluir 16+",
    excludeOtherLang: "Excluir otro idioma",
    apply: "Aplicar",
    reset: "Restablecer",
    foundLabel: "Canciones encontradas:",
    welcome: "¡Bienvenido!",
    welcomeText: "Selecciona una canción de la lista para ver los detalles.",
    songList: "Lista de canciones",
    mobileDetail: "Detalles",
    mobileList: "Lista",
    sortRelevance: "Por relevancia",
    sortTitle: "Por título",
    sortArtist: "Por artista",
    loadMore: "Mostrar más",
    footerNote: "Catálogo para profesores: español con canciones",
    videoFallback: "Si el vídeo no se muestra, ábrelo con el enlace:",
    downloadPdf: "Descargar PDF",

    tabLyrics: "Letra",
    tabGrammar: "Gramática",
    tabTasks: "Tareas",
    tabVocab: "Vocabulario",
    tabCulture: "Cultura",
    tabRestrictions: "Restricciones",

    lyricsHeader: "Letra / marcas de tiempo",
    grammarHeader: "Notas gramaticales",
    tasksHeader: "Tareas",
    tasksEmpty: "Aún no hay tareas para esta canción.",
    vocabHeader: "Vocabulario clave",
    cultureHeader: "Cultura / referencias",
    restrHeader: "Restricciones",

    allLevels: "Todos los niveles",
    allCulture: "Cualquier cultura",
    culture_geography: "Geografía",
    culture_neighborhoods: "Barrios/lugares",
    culture_holidays: "Fiestas",
    culture_traditions: "Tradiciones",
    culture_food: "Comida",
    culture_dance_music: "Baile/música",

    listShowing: (shown, total) => `Mostrando: ${shown} de ${total}`,
    noMatches: "No hay resultados con los filtros actuales.",

    showAnswer: "Mostrar respuesta",
    hideAnswer: "Ocultar respuesta"
  }
};

const themeLabels = {
  nature: { ru: "Природа", es: "Naturaleza" },
  weather: { ru: "Погода", es: "Tiempo" },
  love: { ru: "Любовь", es: "Amor" },
  dance: { ru: "Танцы", es: "Baile" },
  body: { ru: "Тело", es: "Cuerpo" }
};

const grammarLabels = {
  gustar: { ru: "Gustar", es: "Gustar" },
  gerundio: { ru: "Герундий", es: "Gerundio" },
  se: { ru: "Se", es: "Se" },
  ir_gerundio: { ru: "Ir + gerundio", es: "Ir + gerundio" }
};

const cultureLabels = {
  geography: { ru: "География", es: "Geografía" },
  neighborhoods: { ru: "Районы/места", es: "Barrios/lugares" },
  holidays: { ru: "Праздники", es: "Fiestas" },
  traditions: { ru: "Традиции", es: "Tradiciones" },
  food: { ru: "Еда", es: "Comida" },
  dance_music: { ru: "Танцы/музыка", es: "Baile/música" }
};

// ===== Helpers =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const t = (key) => (i18n[currentLang] && i18n[currentLang][key]) ? i18n[currentLang][key] : (i18n.ru[key] || "");

function safeText(objOrString) {
  if (!objOrString) return "";
  if (typeof objOrString === "string") return objOrString;
  if (typeof objOrString === "object") return objOrString[currentLang] || objOrString.ru || objOrString.es || "";
  return "";
}

function normalize(str) {
  return (str || "").toString().toLowerCase().trim();
}

function songTitle(song) {
  return song?.title?.[currentLang] || song?.title?.ru || song?.title?.es || "";
}

function youtubeEmbedUrl(youtubeId) {
  return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : "";
}
function youtubeWatchUrl(youtubeId) {
  return youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : "#";
}

function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===== Language apply =====
function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.title = t("siteTitle");
  $("#year").textContent = new Date().getFullYear();

  $$("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (typeof val === "string") el.textContent = val;
  });

  $$("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.setAttribute("placeholder", t(key));
  });

  // update culture select labels
  buildSelectOptions(); // language-sensitive labels
}

// ===== Build filter options from data =====
function uniq(arr) {
  return Array.from(new Set(arr)).filter(Boolean);
}

function buildSelectOptions() {
  // Levels
  const levels = uniq(allSongs.flatMap(s => Array.isArray(s.level) ? s.level : []));
  const levelSelect = $("#level-select");
  levelSelect.innerHTML = "";
  levelSelect.appendChild(new Option(t("allLevels"), ""));
  levels.sort((a, b) => a.localeCompare(b));
  levels.forEach(lv => levelSelect.appendChild(new Option(lv, lv)));

  // Culture tags (types)
  const tags = uniq(allSongs.flatMap(s => Array.isArray(s?.culture?.tags) ? s.culture.tags : []));
  const cultureSelect = $("#culture-select");
  cultureSelect.innerHTML = "";
  cultureSelect.appendChild(new Option(t("allCulture"), ""));
  tags.sort((a, b) => (cultureLabels[a]?.[currentLang] || a).localeCompare((cultureLabels[b]?.[currentLang] || b), currentLang));
  tags.forEach(tag => {
    const label = cultureLabels[tag]?.[currentLang] || tag;
    cultureSelect.appendChild(new Option(label, tag));
  });
}

// ===== Search haystack =====
function songSearchHaystack(song) {
  const titles = [song?.title?.ru || "", song?.title?.es || ""].join(" ");
  const artist = song?.artist || "";
  const vocab = Array.isArray(song?.vocabulary) ? song.vocabulary.join(" ") : "";
  const themes = Array.isArray(song?.themes) ? song.themes.map(k => themeLabels[k]?.[currentLang] || k).join(" ") : "";
  const grammar = Array.isArray(song?.grammar) ? song.grammar.map(k => grammarLabels[k]?.[currentLang] || k).join(" ") : "";
  const cultureItems = Array.isArray(song?.culture?.items) ? song.culture.items.join(" ") : "";
  const restrNote = song?.restrictions?.note || "";
  return normalize([titles, artist, vocab, themes, grammar, cultureItems, restrNote].join(" "));
}

// ===== Filtering & sorting =====
function sortSongs() {
  const mode = $("#sort-select").value;
  if (mode === "title") {
    filteredSongs.sort((a, b) => songTitle(a).localeCompare(songTitle(b), currentLang));
  } else if (mode === "artist") {
    filteredSongs.sort((a, b) => (a.artist || "").localeCompare((b.artist || ""), currentLang));
  } else {
    const indexMap = new Map(allSongs.map((s, i) => [s.id, i]));
    filteredSongs.sort((a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0));
  }
}

function applyFilters(opts = {}) {
  const q = normalize($("#main-search").value);
  const level = $("#level-select").value;
  const cultureTag = $("#culture-select").value;
  const exclude16 = $("#exclude-16plus").checked;
  const excludeOther = $("#exclude-otherlang").checked;

  filteredSongs = allSongs.filter(song => {
    const searchOk = !q || songSearchHaystack(song).includes(q);

    const levelOk = !level || (Array.isArray(song.level) && song.level.includes(level));

    const cultureOk = !cultureTag || (Array.isArray(song?.culture?.tags) && song.culture.tags.includes(cultureTag));

    const ageOk = !exclude16 || (song?.restrictions?.age !== "16+" && song?.restrictions?.age !== "18+");
    const otherOk = !excludeOther || !song?.restrictions?.containsOtherLanguages;

    return searchOk && levelOk && cultureOk && ageOk && otherOk;
  });

  sortSongs();
  visibleCount = 20;
  renderSongList();

// On mobile: after explicit Apply click, collapse filters and show list
const collapse = !!opts.collapseToList;
const isMobile = window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
if (collapse && isMobile) {
  const details = document.querySelector('.filters-collapse');
  if (details) details.open = false;
  document.body.classList.remove('mobile-show-detail');
  document.body.classList.add('mobile-show-list');
  const listPane = document.querySelector('#list-pane');
  if (listPane) listPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

}

// ===== Render list =====
function renderSongList() {
  const grid = $("#song-grid");
  const countEl = $("#song-count");
  const hint = $("#list-hint");
  const subtitle = $("#results-subtitle");
  const loadMoreBtn = $("#load-more-btn");

  grid.innerHTML = "";
countEl.textContent = String(filteredSongs.length);

const showBtnInList = document.querySelector("#show-results-btn");
if (showBtnInList) {
  showBtnInList.textContent = (currentLang === "ru")
    ? `Показать: ${filteredSongs.length}`
    : `Mostrar: ${filteredSongs.length}`;
  showBtnInList.disabled = filteredSongs.length === 0;
  showBtnInList.style.opacity = filteredSongs.length === 0 ? "0.6" : "1";
}


  if (filteredSongs.length === 0) {
    subtitle.textContent = t("noMatches");
    hint.textContent = "";
    loadMoreBtn.style.display = "none";
    return;
  }

  const shown = Math.min(visibleCount, filteredSongs.length);
  subtitle.textContent = t("listShowing")(shown, filteredSongs.length);

  filteredSongs.slice(0, shown).forEach(song => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.tabIndex = 0;
    card.dataset.songId = String(song.id);

    const themeTags = (song.themes || []).map(k => themeLabels[k]?.[currentLang] || k);
    const levelTag = (song.level || [])[0] ? [`${(song.level || [])[0]}`] : [];
    const tags = [...levelTag, ...themeTags].slice(0, 5);

    card.innerHTML = `
      <img class="song-card-cover" src="${song.cover || ""}" alt="" />
      <div class="song-card-info">
        <h4>${escapeHtml(songTitle(song))}</h4>
        <p>${escapeHtml(song.artist || "")}</p>
        <div class="song-card-tags">${tags.map(x => `<span>${escapeHtml(x)}</span>`).join("")}</div>
      </div>
    `;

    const open = () => openSong(song.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    grid.appendChild(card);
  });

  loadMoreBtn.style.display = (shown < filteredSongs.length) ? "block" : "none";
  hint.textContent = t("listShowing")(shown, filteredSongs.length);
}

// ===== Detail tabs =====
function setupTabs() {
  const tabs = $$(".detail-tab");
  const panels = $$(".detail-panel");

  function activate(name) {
    tabs.forEach(btn => {
      const active = btn.dataset.tab === name;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach(p => p.classList.toggle("active", p.dataset.panel === name));
  }

  tabs.forEach(btn => btn.addEventListener("click", () => activate(btn.dataset.tab)));
}

// ===== Mobile toggle =====
function setupMobileToggle() {
  $$(".mobile-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view === "list") {
        document.body.classList.add("mobile-show-list");
        document.body.classList.remove("mobile-show-detail");
      } else {
        document.body.classList.add("mobile-show-detail");
        document.body.classList.remove("mobile-show-list");
      }
    });
  });
}

// ===== Open song =====
function openSong(id) {
  const song = allSongs.find(s => String(s.id) === String(id));
  if (!song) return;

  selectedSongId = song.id;

  $("#placeholder-detail").style.display = "none";
  $("#song-detail-content").style.display = "block";

  // video
  $("#video-iframe").src = youtubeEmbedUrl(song.youtubeId);
  $("#youtube-link").href = youtubeWatchUrl(song.youtubeId);
  $("#video-fallback").classList.remove("hidden");

  // meta
  $("#detail-title").textContent = songTitle(song);
  $("#detail-artist").textContent = song.artist || "";

  // badges
  const badgesWrap = $("#detail-badges");
  badgesWrap.innerHTML = "";
  const badges = [
    ...(song.level || []).map(l => ({ icon: "fa-signal", text: l })),
    ...(song.themes || []).map(k => ({ icon: "fa-tag", text: themeLabels[k]?.[currentLang] || k })),
    ...(song.grammar || []).map(k => ({ icon: "fa-language", text: grammarLabels[k]?.[currentLang] || k }))
  ].slice(0, 8);

  badges.forEach(b => {
    const span = document.createElement("span");
    span.className = "badge";
    span.innerHTML = `<i class="fas ${b.icon}"></i> ${escapeHtml(b.text)}`;
    badgesWrap.appendChild(span);
  });

  // PDF download (optional)
  const pdfBtn = document.querySelector("#pdf-download");
  if (pdfBtn) {
    const href = (song.pdf || "").trim();
    if (href) {
      pdfBtn.href = href;
      pdfBtn.classList.remove("hidden");
    } else {
      pdfBtn.classList.add("hidden");
      pdfBtn.href = "#";
    }
  }

  // lyrics
  $("#lyrics-note").textContent = safeText(song.lyricsNote);
  const lyricsWrap = $("#lyrics-text");
  lyricsWrap.innerHTML = "";
  (song.lyrics || []).forEach(line => {
    const p = document.createElement("p");
    const time = line.time ? `<strong>${escapeHtml(line.time)}</strong> ` : "";
    p.innerHTML = `${time}${escapeHtml(line.text || "")}`;
    lyricsWrap.appendChild(p);
  });

  // analysis
  const analysisList = document.querySelector("#analysis-list");
analysisList.innerHTML = "";

const analysisArr = Array.isArray(song.analysis) ? song.analysis : [];
analysisArr.forEach(item => {
  let text = "";

  if (typeof item === "string") {
    text = item;
  } else if (item && typeof item === "object") {
    // поддержка формата {ru:"...", es:"..."} или {text:"..."}
    text = item[currentLang] || item.ru || item.es || item.text || "";
  }

  text = String(text).trim();
  if (!text) return;

  const li = document.createElement("li");
  li.textContent = text;
  analysisList.appendChild(li);
});


  // tasks
  const tasks = Array.isArray(song.tasks) ? song.tasks : [];
  const tasksList = $("#tasks-list");
  const tasksEmpty = $("#tasks-empty");
  const badge = $("#tasks-count-badge");

  tasksList.innerHTML = "";
  if (!tasks.length) {
    tasksEmpty.style.display = "block";
    badge.style.display = "none";
  } else {
    tasksEmpty.style.display = "none";
    badge.textContent = String(tasks.length);
    badge.style.display = "inline-flex";

    tasks.forEach((task, idx) => {
      const card = document.createElement("div");
      card.className = "task-card";

      const title = safeText(task.title) || (currentLang === "ru" ? `Задание ${idx + 1}` : `Tarea ${idx + 1}`);
      const instruction = safeText(task.instruction);
      const type = task.type || "";

      const bodyHtml = renderTaskBody(task);

      card.innerHTML = `
        <div class="task-top">
          <h4 class="task-title">${escapeHtml(title)}</h4>
          <div class="task-type">${escapeHtml(type)}</div>
        </div>
        ${instruction ? `<p class="task-instruction">${escapeHtml(instruction)}</p>` : ""}
        <div class="task-body">${bodyHtml}</div>
        ${task.answer ? `
          <div class="task-actions">
            <button class="task-btn primary" type="button" data-action="toggle-answer">${escapeHtml(t("showAnswer"))}</button>
          </div>
          <div class="task-answer">${escapeHtml(task.answer)}</div>
        ` : ""}
      `;

      const toggleBtn = card.querySelector('[data-action="toggle-answer"]');
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const ans = card.querySelector(".task-answer");
          const shown = ans.style.display === "block";
          ans.style.display = shown ? "none" : "block";
          toggleBtn.textContent = shown ? t("showAnswer") : t("hideAnswer");
        });
      }

      tasksList.appendChild(card);
    });
  }

  // vocab chips
  const chips = $("#vocab-chips");
  chips.innerHTML = "";
  (song.vocabulary || []).forEach(w => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = w;
    chips.appendChild(span);
  });

  // culture list
  const cultureList = $("#culture-list");
  cultureList.innerHTML = "";
  const items = Array.isArray(song?.culture?.items) ? song.culture.items : [];
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "—";
    cultureList.appendChild(li);
  } else {
    items.forEach(x => {
      const li = document.createElement("li");
      li.textContent = x;
      cultureList.appendChild(li);
    });
  }

  // restrictions
  const restrList = $("#restr-list");
  restrList.innerHTML = "";
  const r = song.restrictions || {};
  const restrLines = [];
  if (r.age) restrLines.push((currentLang === "ru" ? `Возраст: ${r.age}` : `Edad: ${r.age}`));
  if (r.containsOtherLanguages) restrLines.push(currentLang === "ru" ? "Есть фрагменты на другом языке" : "Hay fragmentos en otro idioma");
  if (r.profanity && r.profanity !== "none") restrLines.push(currentLang === "ru" ? `Ненормативная лексика: ${r.profanity}` : `Lenguaje: ${r.profanity}`);
  if (r.note) restrLines.push(r.note);

  if (!restrLines.length) {
    const li = document.createElement("li");
    li.textContent = "—";
    restrList.appendChild(li);
  } else {
    restrLines.forEach(x => {
      const li = document.createElement("li");
      li.textContent = x;
      restrList.appendChild(li);
    });
  }

  // on mobile show detail
  document.body.classList.remove("mobile-show-list");
  document.body.classList.add("mobile-show-detail");
}

// ===== Task body renderer =====
function renderTaskBody(task) {
  if (Array.isArray(task.content)) {
    return `<ul>${task.content.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
  }
  if (typeof task.content === "string") {
    return `<p>${escapeHtml(task.content).replace(/\n/g, "<br/>")}</p>`;
  }
  return "<p>—</p>";
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  // controls
  const langSelect = $("#language-select");
  langSelect.value = currentLang;

  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    localStorage.setItem("lang", currentLang);
    applyLanguage();
    // re-render
    sortSongs();
    renderSongList();
    if (selectedSongId !== null) openSong(selectedSongId);
  });

  $("#apply-filters").addEventListener("click", () => applyFilters({ collapseToList: true }));

  $("#clear-filters").addEventListener("click", () => {
    $("#main-search").value = "";
    $("#level-select").value = "";
    $("#culture-select").value = "";
    $("#exclude-16plus").checked = false;
    $("#exclude-otherlang").checked = false;
    applyFilters({ collapseToList: true });

});

const showResults = () => {
  const details = document.querySelector('.filters-collapse');
  if (details) details.open = false;
  document.body.classList.remove('mobile-show-detail');
  document.body.classList.add('mobile-show-list');
  const listPane = document.querySelector('#list-pane');
  if (listPane) listPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const showBtn = document.querySelector("#show-results-btn");
if (showBtn) showBtn.addEventListener("click", showResults);

const resultsClick = document.querySelector("#results-click");
if (resultsClick) resultsClick.addEventListener("click", showResults);

$("#main-search").addEventListener("input", applyFilters);

  $("#level-select").addEventListener("change", applyFilters);
  $("#culture-select").addEventListener("change", applyFilters);
  $("#exclude-16plus").addEventListener("change", applyFilters);
  $("#exclude-otherlang").addEventListener("change", applyFilters);

  $("#sort-select").addEventListener("change", () => {
    sortSongs();
    visibleCount = 20;
    renderSongList();
  });

  $("#load-more-btn").addEventListener("click", () => {
    visibleCount += 20;
    renderSongList();
  });

  setupTabs();
setupMobileToggle();

// Mobile: start with filters collapsed so the list is visible
const detailsOnLoad = document.querySelector('.filters-collapse');
const isMobileOnLoad = window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
if (detailsOnLoad && isMobileOnLoad) detailsOnLoad.open = false;

buildSelectOptions();

  applyLanguage();

  sortSongs();
  renderSongList();
});
