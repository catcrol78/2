// DinoMusicalApp admin.js (fixed + improved)
// - Uses --accent (no --brand dependency)
// - Validation + required fields highlighting
// - Auto incremental ID (based on songs-data.js if loaded + localStorage set)
// - Clipboard fallback for file:// restrictions
// - Fixed truncated export handlers

function linesToArray(text) {
  return (text || "").split("\n").map(s => s.trim()).filter(Boolean);
}
function csvToArray(text) {
  return (text || "").split(",").map(s => s.trim()).filter(Boolean);
}
function parseLyrics(text) {
  const rows = linesToArray(text);
  return rows.map(row => {
    const parts = row.split("|");
    if (parts.length < 2) return { time: "", text: row.trim() };
    return { time: parts[0].trim(), text: parts.slice(1).join("|").trim() };
  });
}
function checkedValues(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)).map(i => i.value);
}

function extractYouTubeId(input) {
  const raw = (input || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(raw) && !raw.includes("http")) return raw;

  try {
    const url = new URL(raw);
    const v = url.searchParams.get("v");
    if (v) return v;
    if (url.hostname.includes("youtu.be")) return url.pathname.replace("/", "");
    const parts = url.pathname.split("/").filter(Boolean);
    const shortsIdx = parts.indexOf("shorts");
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
  } catch (_) {}

  const m = raw.match(/v=([a-zA-Z0-9_-]{6,20})/);
  return m ? m[1] : raw;
}

function pretty(obj) { return JSON.stringify(obj, null, 2); }

function youtubeWatchUrl(id){ return id ? `https://www.youtube.com/watch?v=${id}` : "#"; }
function youtubeEmbedUrl(id){ return id ? `https://www.youtube.com/embed/${id}` : ""; }
function youtubeCoverUrl(id){ return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ""; }

function safeSlug(s) {
  return (s || "song").toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function downloadText(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ===== CSV helpers =====
function csvEscape(val) {
  const s = (val ?? "").toString();
  const needs = /[",\n\r;]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
}
function toCsv(headers, rows) {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  return head + "\n" + body + "\n";
}

// ===== Set storage (localStorage) =====
const SET_KEY = "songs_admin_set_v1";

function loadSet() {
  try {
    const raw = localStorage.getItem(SET_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveSet(arr) {
  localStorage.setItem(SET_KEY, JSON.stringify(arr));
}
function upsertSongInSet(song) {
  const set = loadSet();
  const idx = set.findIndex(s => String(s.id) === String(song.id));
  if (idx >= 0) set[idx] = song;
  else set.push(song);
  saveSet(set);
  return set;
}
function removeSongFromSet(id) {
  const set = loadSet().filter(s => String(s.id) !== String(id));
  saveSet(set);
  return set;
}
function clearSet() {
  saveSet([]);
  return [];
}

function exportSongsDataJs(set) {
  return `// Автосгенерировано из admin.html\nconst songsDataFromExternal = ${JSON.stringify(set, null, 2)};\n`;
}
function exportSongsJson(set) {
  return JSON.stringify(set, null, 2);
}

// ===== Merge helpers (append to existing songs-data.js) =====
function getExternalSongs() {
  return (typeof songsDataFromExternal !== "undefined" && Array.isArray(songsDataFromExternal))
    ? songsDataFromExternal
    : [];
}

function mergeSongs(existing, additions) {
  const map = new Map();
  (existing || []).forEach(s => {
    if (!s) return;
    map.set(String(s.id), s);
  });
  (additions || []).forEach(s => {
    if (!s) return;
    // Если ID совпал — берём новую версию из админки
    map.set(String(s.id), s);
  });
  return Array.from(map.values()).sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
}

// ===== ID generation =====
function maxIdFromArray(arr) {
  return (arr || []).reduce((mx, s) => {
    const v = Number(s?.id);
    return Number.isFinite(v) ? Math.max(mx, v) : mx;
  }, 0);
}
function getNextId() {
  const set = loadSet();
  const maxInSet = maxIdFromArray(set);

  const maxInExternal = (typeof songsDataFromExternal !== "undefined" && Array.isArray(songsDataFromExternal))
    ? maxIdFromArray(songsDataFromExternal)
    : 0;

  return Math.max(maxInSet, maxInExternal) + 1;
}

// ===== UI: tasks editor =====
function createTaskEditor(index) {
  const wrap = document.createElement("div");
  wrap.className = "task-editor";
  wrap.innerHTML = `
    <div class="task-top">
      <h4>Задание <span class="task-number">${index + 1}</span></h4>
      <button class="task-remove" type="button" data-action="remove">Удалить</button>
    </div>

    <div class="task-grid">
      <div class="admin-field">
        <label>Название (ru)</label>
        <input type="text" data-field="titleRu" placeholder="Разминка" />
      </div>
      <div class="admin-field">
        <label>Название (es)</label>
        <input type="text" data-field="titleEs" placeholder="Calentamiento" />
      </div>

      <div class="admin-field">
        <label>Тип</label>
        <select data-field="type">
          <option value="warm-up">warm-up</option>
          <option value="gap-fill">gap-fill</option>
          <option value="grammar">grammar</option>
          <option value="speaking">speaking</option>
          <option value="listening">listening</option>
          <option value="writing">writing</option>
          <option value="vocabulary">vocabulary</option>
          <option value="culture">culture</option>
        </select>
      </div>

      <div class="admin-field">
        <label>Ответ (необязательно)</label>
        <input type="text" data-field="answer" placeholder="respirar / oído / acuerdes" />
      </div>

      <div class="admin-field">
        <label>Инструкция (ru)</label>
        <textarea data-field="instrRu" placeholder="что сделать ученику"></textarea>
      </div>
      <div class="admin-field">
        <label>Инструкция (es)</label>
        <textarea data-field="instrEs" placeholder="instrucciones"></textarea>
      </div>

      <div class="admin-field">
        <label>Контент (по строке)</label>
        <textarea data-field="content" placeholder="строка 1\nстрока 2\n..."></textarea>
      </div>

      <div class="admin-field">
        <label>Word bank (по слову на строке, опционально)</label>
        <textarea data-field="wordBank" placeholder="palabra1\npalabra2"></textarea>
      </div>
    </div>
  `;

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='remove']");
    if (!btn) return;
    wrap.remove();
    renumberTasks();
  });

  return wrap;
}

function renumberTasks() {
  const tasks = Array.from(document.querySelectorAll("#tasksContainer .task-editor"));
  tasks.forEach((el, idx) => {
    const num = el.querySelector(".task-number");
    if (num) num.textContent = String(idx + 1);
  });
  document.getElementById("tasksCount").textContent = String(tasks.length);
}

// ===== Build song =====
function buildSong() {
  const idInput = document.getElementById("id");
  const idVal = (idInput.value || "").trim();
  const youtubeId = extractYouTubeId(document.getElementById("youtubeInput").value);

  const titleRu = document.getElementById("titleRu").value.trim();
  const titleEs = document.getElementById("titleEs").value.trim();
  const artist = document.getElementById("artist").value.trim();

  const level = document.getElementById("level").value.trim();
  const age = document.getElementById("age").value;
  const containsOtherLanguages = document.getElementById("otherLang").value === "true";
  const profanity = document.getElementById("profanity").value;
  const note = document.getElementById("restrNote").value.trim();

  const cultureTags = checkedValues("cultureTags");
  const cultureItems = linesToArray(document.getElementById("cultureItems").value);

  const vocabulary = linesToArray(document.getElementById("vocabulary").value);
  const grammar = csvToArray(document.getElementById("grammar").value);
  const themes = csvToArray(document.getElementById("themes").value);

  // Optional downloadable PDF (put the file into project folder, e.g. ./pdf/lesson.pdf)
  const pdf = (document.getElementById("pdfLink")?.value || "").trim();

  const lyrics = parseLyrics(document.getElementById("lyrics").value);

  const cover = youtubeCoverUrl(youtubeId);

  const taskEditors = Array.from(document.querySelectorAll("#tasksContainer .task-editor"));
  const tasks = taskEditors.map((el) => {
    const get = (field) => (el.querySelector(`[data-field="${field}"]`)?.value || "").trim();
    const title = { ru: get("titleRu"), es: get("titleEs") };
    const instruction = { ru: get("instrRu"), es: get("instrEs") };
    const type = get("type") || "warm-up";
    const answer = get("answer");

    const contentLines = linesToArray(el.querySelector('[data-field="content"]')?.value || "");
    const content = (contentLines.length <= 1) ? (contentLines[0] || "") : contentLines;

    const wordBank = linesToArray(get("wordBank"));

    const taskObj = { title, type, instruction, content };
    if (answer) taskObj.answer = answer;
    if (wordBank.length) taskObj.wordBank = wordBank;
    return taskObj;
  }).filter(t => (t.title.ru || t.title.es || t.instruction.ru || t.instruction.es || t.content));

  const autoId = getNextId();
  const finalId = idVal ? Number(idVal) : autoId;

  return {
    id: finalId,
    title: { ru: titleRu || "", es: titleEs || "" },
    artist: artist || "",
    youtubeId: youtubeId || "",
    cover,
    level: level ? [level] : [],
    themes,
    grammar,
    vocabulary,
    culture: { tags: cultureTags, items: cultureItems },
    restrictions: { age, containsOtherLanguages, profanity, sensitiveTopics: [], note },
    lyrics,
    pdf: pdf || "",
    analysis: [],
    tasks
  };
}

// ===== Validation =====
const REQUIRED_FIELDS = ["youtubeInput", "artist", "titleRu", "titleEs"]; // at least one title

function setInvalid(el, isInvalid) {
  if (!el) return;
  el.classList.toggle("invalid", !!isInvalid);
}
function clearInvalidAll() {
  REQUIRED_FIELDS.forEach(id => setInvalid(document.getElementById(id), false));
}

function validateSong(song) {
  const errors = [];

  const youtubeOk = !!(song.youtubeId && song.youtubeId.trim().length >= 6);
  const artistOk = !!(song.artist && song.artist.trim().length >= 1);
  const titleOk = !!((song.title?.ru || "").trim() || (song.title?.es || "").trim());

  if (!youtubeOk) errors.push("• YouTube: вставь ссылку или ID (обязательно).");
  if (!artistOk) errors.push("• Исполнитель: заполни (обязательно).");
  if (!titleOk) errors.push("• Название: заполни хотя бы ru или es (обязательно).");

  setInvalid(document.getElementById("youtubeInput"), !youtubeOk);
  setInvalid(document.getElementById("artist"), !artistOk);
  const titlesEmpty = !titleOk;
  setInvalid(document.getElementById("titleRu"), titlesEmpty);
  setInvalid(document.getElementById("titleEs"), titlesEmpty);

  return errors;
}

function showErrors(list) {
  const box = document.getElementById("adminErrors");
  if (!box) return;
  if (!list || !list.length) {
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }
  box.style.display = "block";
  box.innerHTML = `<strong>Нужно поправить:</strong><br/>${list.join("<br/>")}`;
}

// ===== CSV export (single song) =====
function exportCsv(song) {
  const songId = song.id;

  const songsHeaders = [
    "id","title_ru","title_es","artist","youtubeId","cover",
    "level","themes","grammar","vocabulary",
    "culture_tags","culture_items",
    "age","containsOtherLanguages","profanity","restriction_note"
  ];
  const songsRow = [[
    songId,
    song.title?.ru || "",
    song.title?.es || "",
    song.artist || "",
    song.youtubeId || "",
    song.cover || "",
    (song.level || []).join("|"),
    (song.themes || []).join("|"),
    (song.grammar || []).join("|"),
    (song.vocabulary || []).join("|"),
    (song.culture?.tags || []).join("|"),
    (song.culture?.items || []).join("|"),
    song.restrictions?.age || "all",
    song.restrictions?.containsOtherLanguages ? "true" : "false",
    song.restrictions?.profanity || "none",
    song.restrictions?.note || ""
  ]];
  const songsCsv = toCsv(songsHeaders, songsRow);

  const tasksHeaders = [
    "song_id","task_index","type",
    "title_ru","title_es",
    "instruction_ru","instruction_es",
    "content","answer","wordBank"
  ];
  const tasksRows = (song.tasks || []).map((t, idx) => {
    const content = Array.isArray(t.content) ? t.content.join("\n") : (t.content || "");
    const wb = Array.isArray(t.wordBank) ? t.wordBank.join("|") : "";
    return [
      songId,
      idx + 1,
      t.type || "",
      t.title?.ru || "",
      t.title?.es || "",
      t.instruction?.ru || "",
      t.instruction?.es || "",
      content,
      t.answer || "",
      wb
    ];
  });
  const tasksCsv = toCsv(tasksHeaders, tasksRows.length ? tasksRows : []);

  const lyricsHeaders = ["song_id","line_index","time","text"];
  const lyricsRows = (song.lyrics || []).map((l, idx) => [
    songId,
    idx + 1,
    l.time || "",
    l.text || ""
  ]);
  const lyricsCsv = toCsv(lyricsHeaders, lyricsRows.length ? lyricsRows : []);

  const base = `song_${songId}_${safeSlug(song.title?.es || song.title?.ru)}`;
  downloadText(`${base}_songs.csv`, songsCsv, "text/csv;charset=utf-8");
  downloadText(`${base}_tasks.csv`, tasksCsv, "text/csv;charset=utf-8");
  downloadText(`${base}_lyrics.csv`, lyricsCsv, "text/csv;charset=utf-8");
}

function exportSetCsv(set) {
  if (!set.length) return;

  const songsHeaders = [
    "id","title_ru","title_es","artist","youtubeId","cover",
    "level","themes","grammar","vocabulary",
    "culture_tags","culture_items",
    "age","containsOtherLanguages","profanity","restriction_note"
  ];
  const songsRows = set.map(song => ([
    song.id,
    song.title?.ru || "",
    song.title?.es || "",
    song.artist || "",
    song.youtubeId || "",
    song.cover || "",
    (song.level || []).join("|"),
    (song.themes || []).join("|"),
    (song.grammar || []).join("|"),
    (song.vocabulary || []).join("|"),
    (song.culture?.tags || []).join("|"),
    (song.culture?.items || []).join("|"),
    song.restrictions?.age || "all",
    song.restrictions?.containsOtherLanguages ? "true" : "false",
    song.restrictions?.profanity || "none",
    song.restrictions?.note || ""
  ]));
  const songsCsv = toCsv(songsHeaders, songsRows);

  const tasksHeaders = [
    "song_id","task_index","type",
    "title_ru","title_es",
    "instruction_ru","instruction_es",
    "content","answer","wordBank"
  ];
  const tasksRows = [];
  set.forEach(song => {
    (song.tasks || []).forEach((t, idx) => {
      const content = Array.isArray(t.content) ? t.content.join("\n") : (t.content || "");
      const wb = Array.isArray(t.wordBank) ? t.wordBank.join("|") : "";
      tasksRows.push([
        song.id,
        idx + 1,
        t.type || "",
        t.title?.ru || "",
        t.title?.es || "",
        t.instruction?.ru || "",
        t.instruction?.es || "",
        content,
        t.answer || "",
        wb
      ]);
    });
  });
  const tasksCsv = toCsv(tasksHeaders, tasksRows);

  const lyricsHeaders = ["song_id","line_index","time","text"];
  const lyricsRows = [];
  set.forEach(song => {
    (song.lyrics || []).forEach((l, idx) => {
      lyricsRows.push([song.id, idx + 1, l.time || "", l.text || ""]);
    });
  });
  const lyricsCsv = toCsv(lyricsHeaders, lyricsRows);

  downloadText("songs_all.csv", songsCsv, "text/csv;charset=utf-8");
  downloadText("tasks_all.csv", tasksCsv, "text/csv;charset=utf-8");
  downloadText("lyrics_all.csv", lyricsCsv, "text/csv;charset=utf-8");
}

// ===== YouTube preview =====
function updateYouTubePreview() {
  const input = document.getElementById("youtubeInput").value;
  const id = extractYouTubeId(input);

  const preview = document.getElementById("ytPreview");
  const meta = document.getElementById("ytMeta");
  const frame = document.getElementById("ytFrame");
  const cover = document.getElementById("ytCover");
  const open = document.getElementById("ytOpen");
  const img = document.getElementById("ytImg");
  const pill = document.getElementById("ytIdPill");

  if (!id) {
    preview.style.display = "none";
    meta.style.display = "none";
    frame.src = "";
    cover.src = "";
    open.href = "#";
    img.href = "#";
    pill.textContent = "";
    return;
  }

  preview.style.display = "block";
  meta.style.display = "flex";

  frame.src = youtubeEmbedUrl(id);
  cover.src = youtubeCoverUrl(id);
  open.href = youtubeWatchUrl(id);
  img.href = youtubeCoverUrl(id);
  pill.textContent = `ID: ${id}`;
}

// ===== Clipboard helper =====
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    ta.remove();
    return false;
  }
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("out");
  const tasksContainer = document.getElementById("tasksContainer");

  function primeIdPlaceholder() {
    const idInput = document.getElementById("id");
    if (!idInput.value) idInput.placeholder = `например ${getNextId()}`;
  }

  renumberTasks();
  updateYouTubePreview();
  primeIdPlaceholder();

  ["youtubeInput","artist","titleRu","titleEs"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      setInvalid(el, false);
      showErrors([]);
    });
  });

  document.getElementById("youtubeInput").addEventListener("input", updateYouTubePreview);

  document.getElementById("btnAddTask").addEventListener("click", () => {
    tasksContainer.appendChild(createTaskEditor(tasksContainer.children.length));
    renumberTasks();
  });

  document.getElementById("btnGenerate").addEventListener("click", () => {
    clearInvalidAll();
    const song = buildSong();
    const errs = validateSong(song);
    if (errs.length) {
      showErrors(errs);
      return;
    }
    showErrors([]);
    out.textContent = pretty(song);
    primeIdPlaceholder();
  });

  document.getElementById("btnCopy").addEventListener("click", async () => {
    const text = out.textContent || "";
    if (!text || text === "{}") return alert("Сначала нажми «Сгенерировать JSON»");
    const ok = await copyText(text);
    alert(ok ? "Скопировано!" : "Не удалось скопировать. Попробуй скачать .json");
  });

  document.getElementById("btnDownload").addEventListener("click", () => {
    clearInvalidAll();
    const song = buildSong();
    const errs = validateSong(song);
    if (errs.length) {
      showErrors(errs);
      return;
    }
    showErrors([]);
    const text = pretty(song);
    const base = `song_${song.id}_${safeSlug(song.title?.es || song.title?.ru)}`;
    downloadText(`${base}.json`, text, "application/json;charset=utf-8");
    primeIdPlaceholder();
  });

  document.getElementById("btnExportCsv").addEventListener("click", () => {
    clearInvalidAll();
    const song = buildSong();
    const errs = validateSong(song);
    if (errs.length) {
      showErrors(errs);
      return;
    }
    showErrors([]);
    exportCsv(song);
    primeIdPlaceholder();
  });

  const setList = document.getElementById("setList");
  const setCount = document.getElementById("setCount");

  function renderSet() {
    const set = loadSet();
    if (setCount) setCount.textContent = String(set.length);

    if (!setList) return;
    setList.innerHTML = "";

    if (set.length === 0) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "Пока пусто. Нажми «Добавить в общий набор» после заполнения песни.";
      setList.appendChild(empty);
      return;
    }

    set.slice()
      .sort((a,b) => (a.artist || "").localeCompare((b.artist || ""), "ru"))
      .forEach(song => {
        const item = document.createElement("div");
        item.className = "set-item";
        item.innerHTML = `
          <div>
            <h4>${(song.title?.es || song.title?.ru || "—")} <span class="pill">ID: ${song.id}</span></h4>
            <p>${song.artist || "—"} • ${(song.level || []).join(", ") || "уровень —"}</p>
          </div>
          <div class="set-actions">
            <button type="button" data-act="copy" data-id="${song.id}">Копировать JSON</button>
            <button type="button" data-act="remove" data-id="${song.id}">Удалить</button>
          </div>
        `;
        setList.appendChild(item);
      });

    primeIdPlaceholder();
  }

  if (setList) {
    setList.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const act = btn.getAttribute("data-act");

      const set = loadSet();
      const song = set.find(s => String(s.id) === String(id));

      if (act === "remove") {
        removeSongFromSet(id);
        renderSet();
        return;
      }

      if (act === "copy" && song) {
        const ok = await copyText(JSON.stringify(song, null, 2));
        alert(ok ? "JSON песни скопирован!" : "Не удалось скопировать. Открой песню и скачай .json");
      }
    });
  }

  renderSet();

  document.getElementById("btnAddToSet").addEventListener("click", () => {
    clearInvalidAll();
    const song = buildSong();
    const errs = validateSong(song);
    if (errs.length) {
      showErrors(errs);
      return;
    }
    showErrors([]);
    const set = upsertSongInSet(song);
    out.textContent = pretty(song);
    renderSet();
    alert(`Добавлено в общий набор. Сейчас песен: ${set.length}`);
  });

  document.getElementById("btnExportSetJs").addEventListener("click", () => {
    const set = loadSet();
    if (!set.length) return alert("Общий набор пустой.");
    const merged = mergeSongs(getExternalSongs(), set);
    downloadText("songs-data.js", exportSongsDataJs(merged), "application/javascript;charset=utf-8");
    alert(`Готово! В export вошло песен: ${merged.length} (старые + новые).`);
  });

  document.getElementById("btnExportSetJson").addEventListener("click", () => {
    const set = loadSet();
    if (!set.length) return alert("Общий набор пустой.");
    const merged = mergeSongs(getExternalSongs(), set);
    downloadText("songs.json", exportSongsJson(merged), "application/json;charset=utf-8");
    alert(`Готово! В export вошло песен: ${merged.length} (старые + новые).`);
  });

  document.getElementById("btnExportSetCsv").addEventListener("click", () => {
    const set = loadSet();
    if (!set.length) return alert("Общий набор пустой.");
    const merged = mergeSongs(getExternalSongs(), set);
    exportSetCsv(merged);
    alert(`Готово! CSV экспортирован для ${merged.length} песен (старые + новые).`);
  });

  
  // Quick navigation: new song = clear form
  const btnNewSong = document.getElementById("btnNewSong");
  if (btnNewSong) {
    btnNewSong.addEventListener("click", () => {
      document.getElementById("btnClear")?.click();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

document.getElementById("btnClear").addEventListener("click", () => {
    document.getElementById("id").value = "";
    document.getElementById("youtubeInput").value = "";
    document.getElementById("titleRu").value = "";
    document.getElementById("titleEs").value = "";
    document.getElementById("artist").value = "";
    document.getElementById("level").value = "";
    document.getElementById("age").value = "16+";
    document.getElementById("otherLang").value = "false";
    document.getElementById("profanity").value = "none";
    document.getElementById("restrNote").value = "";

    document.querySelectorAll('#cultureTags input[type="checkbox"]').forEach(ch => ch.checked = false);

    document.getElementById("cultureItems").value = "";
    document.getElementById("vocabulary").value = "";
    document.getElementById("grammar").value = "";
    document.getElementById("pdfLink").value = "";
    document.getElementById("themes").value = "";
    document.getElementById("lyrics").value = "";

    document.getElementById("tasksContainer").innerHTML = "";
    renumberTasks();

    updateYouTubePreview();
    clearInvalidAll();
    showErrors([]);
    out.textContent = "{}";
    primeIdPlaceholder();
  });

  document.getElementById("btnClearSet").addEventListener("click", () => {
    const ok = confirm("Точно очистить общий набор? Это удалит все песни из localStorage.");
    if (!ok) return;
    clearSet();
    renderSet();
    alert("Общий набор очищен.");
  });

});
