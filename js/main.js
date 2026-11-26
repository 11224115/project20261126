// ===== 捲動時淡入 =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ===== 導覽列：標示目前所在區塊 =====
const navLinks = document.querySelectorAll(".nav a");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
      });
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });

document.querySelectorAll("section[id]").forEach((s) => sectionObserver.observe(s));

// ===== 互動示範：工作目錄 → 暫存區 → 儲存庫 =====
const zoneWork = document.getElementById("zone-work");
const zoneStage = document.getElementById("zone-stage");
const zoneRepo = document.getElementById("zone-repo");
const hint = document.getElementById("demo-hint");
const log = document.getElementById("terminal-log");
const btnEdit = document.getElementById("btn-edit");
const btnAdd = document.getElementById("btn-add");
const btnCommit = document.getElementById("btn-commit");
const btnReset = document.getElementById("btn-reset");

const FILE_NAMES = ["index.html", "style.css", "main.js"];
const MESSAGES = ["建立網站雛形", "調整版面", "新增互動效果", "修正錯字", "更新配色", "新增聯絡資訊"];

// 每個檔案的狀態："clean"（沒變更）、"modified"（改了沒 add）、"staged"（已 add）
let files;
let commitCount;
let lastCommitLeftovers = 0;

function randomHash() {
  return Math.random().toString(16).slice(2, 9).padEnd(7, "0");
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function writeLog(command, output) {
  if (log.querySelector(".muted")) log.innerHTML = "";
  log.innerHTML += `<span class="prompt">$</span> ${escapeHtml(command)}\n`;
  if (output) log.innerHTML += `${escapeHtml(output)}\n`;
  log.scrollTop = log.scrollHeight;
}

function namesWith(state) {
  return FILE_NAMES.filter((n) => files[n] === state);
}

function highlight(zone) {
  document.querySelectorAll(".zone").forEach((z) => z.classList.toggle("active", z.dataset.zone === zone));
}

function render() {
  // 工作目錄：可點擊的檔案
  zoneWork.innerHTML = "";
  namesWith("modified").forEach((name) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip file";
    chip.innerHTML = `📄 ${name} <small>已修改・點我 add</small>`;
    chip.addEventListener("click", () => stageFiles([name]));
    zoneWork.appendChild(chip);
  });

  // 暫存區
  zoneStage.innerHTML = "";
  namesWith("staged").forEach((name) => {
    const chip = document.createElement("div");
    chip.className = "chip file";
    chip.textContent = `📄 ${name}`;
    zoneStage.appendChild(chip);
  });

  const modified = namesWith("modified").length;
  const staged = namesWith("staged").length;
  const clean = namesWith("clean").length;

  btnEdit.disabled = clean === 0;
  btnAdd.disabled = modified === 0;
  btnCommit.disabled = staged === 0;

  [btnEdit, btnAdd, btnCommit].forEach((b) => b.classList.remove("pulse", "primary"));
  const next = staged ? btnCommit : modified ? btnAdd : btnEdit;
  next.classList.add("pulse", "primary");

  if (staged) {
    hint.textContent = modified
      ? `暫存區有 ${staged} 個檔案會被存進快照，工作目錄裡剩下的 ${modified} 個不會。按 git commit 試試。`
      : "變更都在暫存區排好隊了。按 git commit 正式存成快照。";
  } else if (modified) {
    hint.textContent = lastCommitLeftovers
      ? "看到了嗎？沒放進暫存區的檔案沒有被存進去，還留在工作目錄。"
      : "點工作目錄裡的檔案，只把它放進暫存區；或按 git add . 全部放進去。";
  } else {
    hint.textContent = commitCount === 0
      ? "先按「修改檔案」，假裝你改了網站的三個檔案。"
      : `完成第 ${commitCount} 次提交！可以再修改一次，看看歷史怎麼累積。`;
  }
}

function stageFiles(names) {
  names.forEach((n) => (files[n] = "staged"));
  highlight("stage");
  writeLog(names.length === FILE_NAMES.length || names.length > 1 ? "git add ." : `git add ${names[0]}`);
  render();
}

btnEdit.addEventListener("click", () => {
  namesWith("clean").forEach((n) => (files[n] = "modified"));
  lastCommitLeftovers = 0;
  highlight("work");
  const list = namesWith("modified").map((n) => `    modified:   ${n}`).join("\n");
  writeLog("git status", `Changes not staged for commit:\n${list}`);
  render();
});

btnAdd.addEventListener("click", () => stageFiles(namesWith("modified")));

btnCommit.addEventListener("click", () => {
  const staged = namesWith("staged");
  const msg = MESSAGES[commitCount % MESSAGES.length];
  const hash = randomHash();
  staged.forEach((n) => (files[n] = "clean"));
  commitCount++;
  lastCommitLeftovers = namesWith("modified").length;

  const chip = document.createElement("div");
  chip.className = "chip commit";
  chip.innerHTML = `● ${hash} ${escapeHtml(msg)}<br><small>${staged.join("、")}</small>`;
  zoneRepo.prepend(chip);

  highlight("repo");
  writeLog(`git commit -m "${msg}"`, `[main ${hash}] ${msg}\n ${staged.length} file${staged.length > 1 ? "s" : ""} changed`);
  render();
});

function resetDemo() {
  files = Object.fromEntries(FILE_NAMES.map((n) => [n, "clean"]));
  commitCount = 0;
  lastCommitLeftovers = 0;
  zoneRepo.innerHTML = "";
  log.innerHTML = '<span class="muted"># 指令會出現在這裡</span>';
  highlight(null);
  render();
}

btnReset.addEventListener("click", resetDemo);
resetDemo();

// ===== 指令表：點擊複製 =====
const toast = document.getElementById("toast");
let toastTimer;

document.querySelectorAll(".copy").forEach((code) => {
  code.title = "點一下複製";
  code.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      toast.textContent = `已複製：${code.textContent}`;
    } catch {
      toast.textContent = "瀏覽器不允許複製，請手動選取";
    }
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  });
});
