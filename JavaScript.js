/* ===== 핵심 설정 ===== */
const WEBHOOK_URL =
  "https://uncentralized-tomoko-augustly.ngrok-free.dev/webhook/csv-upload";
const RECENT_KEY = "pasa_recent_xls_20";

/* ===== DOM 요소 ===== */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const recentListEl = document.getElementById("recentList");
const devResetRecentBtn = document.getElementById("devResetRecent");

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");
const fileNameEl = document.getElementById("fileName");
const fileSizeEl = document.getElementById("fileSize");
const fileError = document.getElementById("fileError");
const storeError = document.getElementById("storeError");
const uploadForm = document.getElementById("uploadForm");
const resetBtn = document.getElementById("resetBtn");

const overlay = document.getElementById("overlay");
const modalFileName = document.getElementById("modalFileName");
const modalFileSize = document.getElementById("modalFileSize");
const modalStore = document.getElementById("modalStore");
const modalCancel = document.getElementById("modalCancel");
const modalOk = document.getElementById("modalOk");

const errorOverlay = document.getElementById("errorOverlay");
const errorTitleEl = document.getElementById("errorTitle");
const errorMessageEl = document.getElementById("errorMessage");
const errorCloseBtn = document.getElementById("errorClose");

const checkboxPasa = document.querySelector('input[value="파사 코골이"]');
const checkboxSmart = document.querySelector('input[value="스마트 파사 코골이"]');
const pillPasa = document.getElementById("pill-pasa");
const pillSmart = document.getElementById("pill-smart");

/* ===== 유틸 ===== */
function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
}

function isExcelFile(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return name.endsWith(".xls") || name.endsWith(".xlsx");
}

function showFileInfo(file) {
  fileInfo.style.display = "flex";
  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatSize(file.size);
  fileError.style.display = "none";
  fileError.textContent = "";
}

function clearFileInfo() {
  fileInfo.style.display = "none";
  fileNameEl.textContent = "";
  fileSizeEl.textContent = "";
}

function openErrorModal(title, message) {
  if (title) errorTitleEl.textContent = title;
  else errorTitleEl.textContent = "업로드 실패";

  if (message) errorMessageEl.textContent = message;
  else
    errorMessageEl.textContent =
      "업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

  errorOverlay.classList.add("show");
  errorOverlay.setAttribute("aria-hidden", "false");
}

function closeErrorModal() {
  errorOverlay.classList.remove("show");
  errorOverlay.setAttribute("aria-hidden", "true");
}

/* ===== 최근 업로드 관리 ===== */
function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function hasUploadedFile(name) {
  const list = loadRecent();
  return list.some((item) => item.name === name);
}

function addRecentUpload(name, store, sizeBytes) {
  const list = loadRecent();
  const item = {
    name,
    store,
    size: sizeBytes || null,
    at: new Date().toISOString(),
  };
  list.unshift(item);
  const trimmed = list.slice(0, 20);
  saveRecent(trimmed);
  renderRecentList(trimmed);
}

function renderRecentList(list) {
  const arr = list || loadRecent();
  recentListEl.innerHTML = "";
  if (!arr.length) {
    const li = document.createElement("li");
    li.className = "recent-item";
    li.innerHTML = `<div class="recent-item-name">아직 업로드된 파일이 없습니다.</div>`;
    recentListEl.appendChild(li);
    return;
  }
  arr.forEach((item) => {
    const li = document.createElement("li");
    li.className = "recent-item";

    const nameDiv = document.createElement("div");
    nameDiv.className = "recent-item-name";
    nameDiv.textContent = item.name;

    const metaDiv = document.createElement("div");
    metaDiv.className = "recent-item-meta";

    const storeSpan = document.createElement("span");
    storeSpan.className = "recent-item-store";
    storeSpan.textContent = item.store || "-";

    const rightSpan = document.createElement("span");
    const sizeText = item.size ? formatSize(item.size) : "";
    rightSpan.textContent = sizeText;

    metaDiv.appendChild(storeSpan);
    metaDiv.appendChild(rightSpan);

    li.appendChild(nameDiv);
    li.appendChild(metaDiv);
    recentListEl.appendChild(li);
  });
}

/* ===== 사이드바 토글 ===== */
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

/* ===== Dev: 최근 목록 초기화 ===== */
devResetRecentBtn.addEventListener("click", () => {
  const ok = confirm(
    "최근 업로드 파일 목록을 모두 삭제할까요?\n(이 브라우저의 로컬 저장소에서만 삭제됩니다.)"
  );
  if (!ok) return;
  saveRecent([]);
  renderRecentList([]);
});

/* ===== 드래그 앤 드롭 ===== */
dropzone.addEventListener("click", () => fileInput.click());

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (!files || !files[0]) return;
  const file = files[0];

  if (!isExcelFile(file)) {
    clearFileInfo();
    fileInput.value = "";
    fileError.style.display = "block";
    fileError.textContent = "xls, xlsx 파일만 업로드할 수 있습니다.";
    return;
  }

  if (hasUploadedFile(file.name)) {
    clearFileInfo();
    fileInput.value = "";
    fileError.style.display = "block";
    fileError.textContent = "이미 업로드한 파일입니다. 다른 파일을 선택해주세요.";
    return;
  }

  const dt = new DataTransfer();
  dt.items.add(file);
  fileInput.files = dt.files;

  showFileInfo(file);
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) {
    clearFileInfo();
    return;
  }

  if (!isExcelFile(file)) {
    clearFileInfo();
    fileInput.value = "";
    fileError.style.display = "block";
    fileError.textContent = "xls, xlsx 파일만 업로드할 수 있습니다.";
    return;
  }

  if (hasUploadedFile(file.name)) {
    clearFileInfo();
    fileInput.value = "";
    fileError.style.display = "block";
    fileError.textContent = "이미 업로드한 파일입니다. 다른 파일을 선택해주세요.";
    return;
  }

  showFileInfo(file);
});

/* ===== 스토어 체크박스를 라디오처럼 ===== */
function updateCheckboxStyles() {
  pillPasa.classList.toggle("active", checkboxPasa.checked);
  pillSmart.classList.toggle("active", checkboxSmart.checked);
}

checkboxPasa.addEventListener("change", () => {
  if (checkboxPasa.checked) checkboxSmart.checked = false;
  updateCheckboxStyles();
});

checkboxSmart.addEventListener("change", () => {
  if (checkboxSmart.checked) checkboxPasa.checked = false;
  updateCheckboxStyles();
});

/* ===== 폼 리셋 ===== */
function resetForm() {
  uploadForm.reset();
  clearFileInfo();
  fileError.style.display = "none";
  storeError.style.display = "none";
  const secretError = document.getElementById("secretError");
  secretError.style.display = "none";
  secretError.textContent = "";
  updateCheckboxStyles();
}

resetBtn.addEventListener("click", () => {
  resetForm();
});

/* ===== 폼 제출 (AJAX → n8n Webhook) ===== */
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = uploadForm.querySelector("button[type='submit']");
  if(submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "업로드 중..."; // 사용자에게 피드백
  }

  fileError.style.display = "none";
  storeError.style.display = "none";

  const secretError = document.getElementById("secretError");
  secretError.style.display = "none";
  secretError.textContent = "";

  const file = fileInput.files[0];
  if (!file) {
    fileError.style.display = "block";
    fileError.textContent = "업로드할 파일을 선택해주세요.";
    return;
  }
  if (!isExcelFile(file)) {
    fileError.style.display = "block";
    fileError.textContent = "xls, xlsx 파일만 업로드할 수 있습니다.";
    return;
  }
  if (hasUploadedFile(file.name)) {
    fileError.style.display = "block";
    fileError.textContent = "이미 업로드한 파일입니다. 다른 파일을 선택해주세요.";
    return;
  }

  const storeValue =
    (checkboxPasa.checked && checkboxPasa.value) ||
    (checkboxSmart.checked && checkboxSmart.value) ||
    "";
  if (!storeValue) {
    storeError.style.display = "block";
    storeError.textContent = "스토어를 선택해주세요.";
    return;
  }

  const formData = new FormData(uploadForm);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
    });

    let payload = null;
    const ct = res.headers.get("Content-Type") || "";
    
    
    if (ct.includes("application/json")) {
      try {
        payload = await res.json();
      } catch (e) {
        payload = null;
      }
    } else {
      try {
        const text = await res.text();
        payload = { message: text };
      } catch (e) {
        payload = null;
      }
    }

    if (!res.ok) {
      // 1) 비밀번호 오류 (402/401 + INVALID_SECRET)
      if (
        (res.status === 402 || res.status === 401) &&
        payload &&
        payload.error === "INVALID_SECRET"
      ) {
        secretError.style.display = "block";
        secretError.textContent =
          payload.message || "관리자 비밀번호가 올바르지 않습니다.";
        return;
      }

      // 2) 스토어 오류 (400)
      if (res.status === 400) {
        const msg =
          (payload && (payload.massege || payload.message)) ||
          "스토어 선택에 오류가 있습니다.";
        openErrorModal("스토어 선택 오류", msg);
        return;
      }

      // 3) 그 외 업로드 실패 (402 등)
      const msg =
        (payload && (payload.massege || payload.message)) ||
        "업로드에 실패했습니다. 잠시 후 다시 시도해주세요.";
      openErrorModal("업로드 실패", msg);
      return;
    }

    // ===== 여기까지 왔으면 업로드 성공 =====
    modalFileName.textContent = file.name;
    modalFileSize.textContent = formatSize(file.size);
    modalStore.textContent = storeValue;

    addRecentUpload(file.name, storeValue, file.size);

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  } catch (err) {
    openErrorModal(
      "업로드 실패",
      "업로드 중 오류가 발생했습니다.\n" + (err.message || "")
    );
  } finally {
    if(submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "업로드"; // 원래 텍스트로 복구
    }
  }
});

function closeSuccessModalAndReset() {
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
  resetForm();
}

modalCancel.addEventListener("click", closeSuccessModalAndReset);
modalOk.addEventListener("click", closeSuccessModalAndReset);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    closeSuccessModalAndReset();
  }
});

errorCloseBtn.addEventListener("click", () => {
  closeErrorModal();
});

errorOverlay.addEventListener("click", (e) => {
  if (e.target === errorOverlay) {
    closeErrorModal();
  }
});

// 초기 렌더링
document.addEventListener("DOMContentLoaded", () => {
  renderRecentList();
  updateCheckboxStyles();
});