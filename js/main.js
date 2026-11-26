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

// state: "clean"（沒有變更）、"modified"（改了還沒 add）、"staged"（已 add）
let state = "clean";
let commitCount = 0;

const messages = ["新增首頁", "修改標題", "加上圖片", "調整顏色", "修正錯字", "新增聯絡資訊"];

function randomHash() {
  return Math.random().toString(16).slice(2, 9);
}

function writeLog(command, output) {
  if (log.querySelector(".muted")) log.innerHTML = "";
  log.innerHTML += `<span class="prompt">$</span> ${command}\n`;
  if (output) log.innerHTML += `${output}\n`;
  log.scrollTop = log.scrollHeight;
}

function makeChip(cls, html) {
  const chip = document.createElement("div");
  chip.className = "chip " + cls;
  chip.innerHTML = html;
  return chip;
}

function highlight(zone) {
  document.querySelectorAll(".zone").forEach((z) => z.classList.toggle("active", z.dataset.zone === zone));
}

function update() {
  btnEdit.disabled = state !== "clean";
  btnAdd.disabled = state !== "modified";
  btnCommit.disabled = state !== "staged";

  [btnEdit, btnAdd, btnCommit].forEach((b) => b.classList.remove("pulse", "primary"));
  const next = { clean: btnEdit, modified: btnAdd, staged: btnCommit }[state];
  next.classList.add("pulse", "primary");

  if (state === "clean") {
    hint.textContent = commitCount === 0
      ? "先按「修改檔案」，假裝你寫了一點東西。"
      : `完成第 ${commitCount} 次提交！可以再修改一次，看看歷史怎麼累積。`;
  } else if (state === "modified") {
    hint.textContent = "檔案改好了，但 Git 還沒準備存它。按 git add 放進暫存區。";
  } else {
    hint.textContent = "變更已經在暫存區排好隊。按 git commit 正式存成快照。";
  }
}

btnEdit.addEventListener("click", () => {
  zoneWork.innerHTML = "";
  zoneWork.appendChild(makeChip("file", "📄 index.html <small>（已修改）</small>"));
  state = "modified";
  highlight("work");
  writeLog("git status", "Changes not staged for commit:\n    modified:   index.html");
  update();
});

btnAdd.addEventListener("click", () => {
  zoneWork.innerHTML = "";
  zoneStage.innerHTML = "";
  zoneStage.appendChild(makeChip("file", "📄 index.html"));
  state = "staged";
  highlight("stage");
  writeLog("git add index.html");
  update();
});

btnCommit.addEventListener("click", () => {
  const msg = messages[commitCount % messages.length];
  const hash = randomHash();
  zoneStage.innerHTML = "";
  zoneRepo.prepend(makeChip("commit", `● ${hash} <small>${msg}</small>`));
  commitCount++;
  state = "clean";
  highlight("repo");
  writeLog(`git commit -m "${msg}"`, `[main ${hash}] ${msg}\n 1 file changed`);
  update();
});

btnReset.addEventListener("click", () => {
  zoneWork.innerHTML = zoneStage.innerHTML = zoneRepo.innerHTML = "";
  log.innerHTML = '<span class="muted"># 指令會出現在這裡</span>';
  state = "clean";
  commitCount = 0;
  highlight(null);
  update();
});

update();

// ===== 指令表：點擊複製 =====
const toast = document.getElementById("toast");
let toastTimer;

document.querySelectorAll(".cheat code").forEach((code) => {
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
