const state = {
    token: localStorage.getItem("gongmodocToken"),
    nickname: localStorage.getItem("gongmodocNickname"),
    currentFile: null,
    viewingFile: null,
    documentPage: 1,
    linesPerPage: Number(localStorage.getItem("gongmodocLinesPerPage") || 50),
    writerMode: "create",
    editingFileId: null,
    editingFileType: "TXT",
    commentsSignature: "",
    filesSignature: "",
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    if (state.token && state.nickname) {
        showApp();
        refreshAll();
        setInterval(refreshAll, 4000);
    } else {
        showLogin();
    }
});

function bindEvents() {
    $("loginForm").addEventListener("submit", login);
    $("appBrandLogo").addEventListener("click", returnToCurrentDocument);
    $("appBrandLogo").addEventListener("keydown", handleBrandKeydown);
    $("logoutButton").addEventListener("click", logout);
    $("openWriterButton").addEventListener("click", openWriter);
    $("editWriterButton").addEventListener("click", () => openEditor());
    $("closeWriterButton").addEventListener("click", closeWriter);
    $("cancelWriterButton").addEventListener("click", closeWriter);
    $("writerModal").addEventListener("click", closeWriterFromBackdrop);
    $("writerForm").addEventListener("submit", saveWrittenDocument);
    $("writerContent").addEventListener("input", renderWriterPreview);
    $("linesPerPageSelect").addEventListener("change", changeLinesPerPage);
    $("prevPageButton").addEventListener("click", () => changeDocumentPage(-1));
    $("nextPageButton").addEventListener("click", () => changeDocumentPage(1));
    $("uploadButton").addEventListener("click", () => $("fileInput").click());
    $("fileInput").addEventListener("change", uploadSelectedFile);
    $("downloadTxtButton").addEventListener("click", () => downloadFile(state.viewingFile?.id, "txt"));
    $("commentForm").addEventListener("submit", createComment);
}

function handleBrandKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    returnToCurrentDocument();
}

async function returnToCurrentDocument() {
    if (!state.token) return;
    const logo = $("appBrandLogo");
    logo.classList.remove("logo-pulse");
    void logo.offsetWidth;
    logo.classList.add("logo-pulse");

    if (state.currentFile) {
        state.viewingFile = state.currentFile;
        state.documentPage = 1;
        renderDocument(state.currentFile, false);
    }

    await refreshAll();
    window.scrollTo({top: 0, behavior: "smooth"});
}

async function api(path, options = {}) {
    const headers = {
        ...(options.headers || {}),
        ...(state.token ? {"X-GongmoDoc-Token": state.token} : {}),
    };
    const response = await fetch(path, {...options, headers});
    if (response.status === 204) return null;
    if (!response.ok) {
        let message = "요청 처리 중 오류가 발생했습니다.";
        try {
            const body = await response.json();
            message = body.message || message;
        } catch (_) {
            // Keep fallback message for non-JSON errors.
        }
        throw new Error(message);
    }
    return response.json();
}

async function login(event) {
    event.preventDefault();
    $("loginError").textContent = "";
    try {
        const nickname = $("nicknameInput").value.trim();
        if (!["지은", "영연"].includes(nickname)) {
            throw new Error("아이디는 지은 또는 영연만 사용할 수 있습니다.");
        }
        const body = {
            accessCode: $("accessCodeInput").value.trim(),
            nickname,
        };
        const result = await api("/api/auth/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
        });
        state.token = result.token;
        state.nickname = result.nickname;
        localStorage.setItem("gongmodocToken", state.token);
        localStorage.setItem("gongmodocNickname", state.nickname);
        showApp();
        refreshAll();
    } catch (error) {
        $("loginError").textContent = error.message;
    }
}

function logout() {
    localStorage.removeItem("gongmodocToken");
    localStorage.removeItem("gongmodocNickname");
    state.token = null;
    state.nickname = null;
    state.currentFile = null;
    state.viewingFile = null;
    state.editingFileId = null;
    showLogin();
}

function showLogin() {
    $("loginView").classList.remove("hidden");
    $("appView").classList.add("hidden");
}

function showApp() {
    $("loginView").classList.add("hidden");
    $("appView").classList.remove("hidden");
    $("nicknameBadge").textContent = `${state.nickname}님`;
    $("linesPerPageSelect").value = String(state.linesPerPage);
}

async function refreshAll() {
    if (!state.token) return;
    await Promise.all([loadCurrentFile(), loadFileList()]);
    if (state.viewingFile?.id) {
        await loadComments();
    }
}

async function loadCurrentFile() {
    try {
        const response = await fetch("/api/files/current", {
            headers: {"X-GongmoDoc-Token": state.token},
        });
        if (response.status === 204) {
            state.currentFile = null;
            if (!state.viewingFile) renderEmptyDocument();
            return;
        }
        if (!response.ok) throw new Error("현재 파일을 불러오지 못했습니다.");
        const current = await response.json();
        const shouldRender = !state.viewingFile || state.viewingFile.id === state.currentFile?.id || state.viewingFile.current;
        const isSameViewedFile = state.viewingFile?.id === current.id;
        state.currentFile = current;
        if (shouldRender) {
            state.viewingFile = current;
            if (!isSameViewedFile) {
                state.documentPage = 1;
            }
            renderDocument(current, false);
        }
        updateDownloadButtons();
    } catch (error) {
        console.error(error);
    }
}

async function loadFileList() {
    try {
        const files = await api("/api/files");
        const signature = JSON.stringify(files);
        if (signature === state.filesSignature) return;
        state.filesSignature = signature;
        renderFileList(files);
    } catch (error) {
        console.error(error);
    }
}

function renderDocument(file, previousView) {
    const card = $("documentCard");
    card.classList.remove("empty");
    $("previousNotice").classList.toggle("hidden", !previousView);
    $("viewerStatus").textContent = `${file.originalFileName} · ${fileTypeLabel(file.fileType)} · ${formatDate(file.uploadedAt)}`;
    $("commentFileName").textContent = file.originalFileName;

    renderPagedTextDocument(card, file.content || "");
    updateDownloadButtons();
}

function renderEmptyDocument() {
    state.viewingFile = null;
    $("documentCard").className = "document-card empty";
    $("documentCard").innerHTML = "<p>아직 업로드된 문서가 없습니다.</p>";
    $("viewerStatus").textContent = "아직 업로드된 문서가 없습니다.";
    $("previousNotice").classList.add("hidden");
    $("pageControls").classList.add("hidden");
    $("pageNav").classList.add("hidden");
    $("commentFileName").textContent = "파일을 선택하면 댓글을 볼 수 있습니다.";
    $("commentList").innerHTML = "";
    updateDownloadButtons();
}

function renderFileList(files) {
    const list = $("historyList");
    if (!files.length) {
        list.innerHTML = "<p class='history-meta'>아직 업로드된 문서가 없습니다.</p>";
        return;
    }
    list.innerHTML = "";
    files.forEach((file) => {
        const item = document.createElement("article");
        item.className = "history-item";
        item.innerHTML = `
            <div>
                <div class="history-title">
                    <span>${escapeHtml(file.originalFileName)}</span>
                    <span class="tag">${escapeHtml(fileTypeLabel(file.fileType))}</span>
                    ${file.current ? '<span class="tag current">현재 파일</span>' : '<span class="tag">이전 파일</span>'}
                </div>
                <div class="history-meta">
                    업로드: ${escapeHtml(file.uploaderNickname)} · ${formatDate(file.uploadedAt)}
                </div>
                <div class="history-comment-summary">
                    댓글 ${file.commentCount ?? 0}개 / 미해결 ${file.unresolvedCommentCount ?? 0}개
                </div>
            </div>
            <div class="history-actions">
                <button type="button" data-action="view">보기</button>
                <button type="button" data-action="edit">수정</button>
                <button type="button" data-action="restore" ${file.current ? "disabled" : ""}>현재 문서로 복원</button>
                <button type="button" data-action="txt">다운로드</button>
                <button type="button" class="danger" data-action="delete" ${file.current ? "disabled" : ""}>삭제</button>
            </div>
        `;
        item.querySelector("[data-action='view']").addEventListener("click", () => viewFile(file.id));
        item.querySelector("[data-action='edit']").addEventListener("click", () => editFile(file.id));
        item.querySelector("[data-action='restore']").addEventListener("click", () => restoreFile(file.id));
        item.querySelector("[data-action='txt']").addEventListener("click", () => downloadFile(file.id, "txt"));
        item.querySelector("[data-action='delete']").addEventListener("click", () => deleteFile(file.id));
        list.appendChild(item);
    });
}

async function uploadSelectedFile(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".txt") && !lower.endsWith(".text") && !lower.endsWith(".md")) {
        alert("지원하는 파일 형식은 .txt, .md 입니다.");
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert("파일 크기는 2MB 이하만 가능합니다.");
        return;
    }
    if (!confirm("새 파일을 업로드하면 현재 문서는 이전 파일 목록으로 이동합니다. 계속할까요?")) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaderNickname", state.nickname);
    try {
        const uploaded = await api("/api/files/upload", {method: "POST", body: formData});
        state.currentFile = uploaded;
        state.viewingFile = uploaded;
        state.documentPage = 1;
        renderDocument(uploaded, false);
        await refreshAll();
    } catch (error) {
        alert(error.message);
    }
}

function openWriter() {
    state.writerMode = "create";
    state.editingFileId = null;
    state.editingFileType = "TXT";
    $("writerEyebrow").textContent = "Quick Text";
    $("writerTitle").textContent = "빠른 텍스트 추가";
    $("saveWriterButton").textContent = "현재 문서로 저장";
    $("writerFileTypeLabel").value = "Text (.txt)";
    $("writerFileName").value = defaultWriterFileName();
    $("writerContent").value = "";
    $("writerModal").classList.remove("hidden");
    renderWriterPreview();
    $("writerContent").focus();
}

function openEditor(file = state.viewingFile) {
    if (!file?.id) {
        alert("수정할 문서가 없습니다.");
        return;
    }
    state.writerMode = "edit";
    state.editingFileId = file.id;
    state.editingFileType = file.fileType || "TXT";
    $("writerEyebrow").textContent = file.current ? "현재 문서 수정" : "이전 문서 수정";
    $("writerTitle").textContent = "글 수정";
    $("saveWriterButton").textContent = "수정 저장";
    $("writerFileTypeLabel").value = state.editingFileType === "MD" ? "Markdown (.md)" : "Text (.txt)";
    $("writerFileName").value = file.originalFileName.replace(/\.(md|txt|text)$/i, "");
    $("writerContent").value = file.content || "";
    $("writerModal").classList.remove("hidden");
    renderWriterPreview();
    $("writerContent").focus();
}

async function editFile(fileId) {
    try {
        const file = await api(`/api/files/${fileId}`);
        state.viewingFile = file;
        state.documentPage = 1;
        renderDocument(file, !file.current);
        await loadComments();
        openEditor(file);
    } catch (error) {
        alert(error.message);
    }
}

function closeWriter() {
    $("writerModal").classList.add("hidden");
}

function closeWriterFromBackdrop(event) {
    if (event.target === $("writerModal")) {
        closeWriter();
    }
}

async function saveWrittenDocument(event) {
    event.preventDefault();
    const content = $("writerContent").value.trimEnd();
    if (!content.trim()) {
        alert("작성 내용을 입력해주세요.");
        return;
    }
    const fileType = state.writerMode === "edit" ? state.editingFileType : "TXT";
    const fileName = normalizeWriterFileName($("writerFileName").value, fileType);
    if (state.writerMode === "edit") {
        await updateWrittenDocument(fileName, content);
        return;
    }

    if (!confirm("새 글을 저장하면 현재 문서는 이전 파일 목록으로 이동합니다. 계속할까요?")) return;
    const file = new File([content], fileName, {type: "text/plain;charset=utf-8"});
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaderNickname", state.nickname);

    try {
        const uploaded = await api("/api/files/upload", {method: "POST", body: formData});
        state.currentFile = uploaded;
        state.viewingFile = uploaded;
        renderDocument(uploaded, false);
        closeWriter();
        await refreshAll();
    } catch (error) {
        alert(error.message);
    }
}

async function updateWrittenDocument(fileName, content) {
    if (!state.editingFileId) return;
    if (!confirm("이 문서의 내용을 수정 저장할까요? 연결된 댓글은 그대로 유지됩니다.")) return;
    try {
        const updated = await api(`/api/files/${state.editingFileId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                originalFileName: fileName,
                fileType: state.editingFileType || "TXT",
                content,
            }),
        });
        if (updated.current) {
            state.currentFile = updated;
        }
        state.viewingFile = updated;
        state.documentPage = 1;
        renderDocument(updated, !updated.current);
        closeWriter();
        state.filesSignature = "";
        await refreshAll();
    } catch (error) {
        alert(error.message);
    }
}

function renderWriterPreview() {
    const preview = $("writerPreview");
    const content = $("writerContent").value;
    preview.classList.toggle("empty", !content.trim());
    if (!content.trim()) {
        preview.innerHTML = "<p>작성 내용을 입력하면 미리보기가 표시됩니다.</p>";
        return;
    }
    renderTextDocument(preview, content);
}

async function viewFile(fileId) {
    try {
        const file = await api(`/api/files/${fileId}`);
        state.viewingFile = file;
        state.documentPage = 1;
        renderDocument(file, !file.current);
        await loadComments();
    } catch (error) {
        alert(error.message);
    }
}

async function restoreFile(fileId) {
    if (!confirm("이 파일을 현재 문서로 복원할까요?")) return;
    try {
        const file = await api(`/api/files/${fileId}/restore`, {method: "POST"});
        state.currentFile = file;
        state.viewingFile = file;
        state.documentPage = 1;
        renderDocument(file, false);
        await refreshAll();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteFile(fileId) {
    if (!confirm("이 파일을 삭제할까요? 연결된 댓글도 함께 삭제됩니다.")) return;
    try {
        await api(`/api/files/${fileId}`, {method: "DELETE"});
        if (state.viewingFile?.id === fileId) {
            state.viewingFile = state.currentFile;
            if (state.currentFile) renderDocument(state.currentFile, false);
        }
        await refreshAll();
    } catch (error) {
        alert(error.message);
    }
}

async function downloadFile(fileId, format) {
    if (!fileId) return;
    try {
        const response = await fetch(`/api/files/${fileId}/download?format=${format}`, {
            headers: {"X-GongmoDoc-Token": state.token},
        });
        if (!response.ok) throw new Error("다운로드할 수 없습니다.");
        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition") || "";
        const name = parseDownloadFileName(disposition, `silverroom.${format}`);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert(error.message);
    }
}

async function loadComments() {
    if (!state.viewingFile?.id) return;
    try {
        const comments = await api(`/api/files/${state.viewingFile.id}/comments?sort=asc`);
        const signature = `${state.viewingFile.id}:asc:${JSON.stringify(comments)}`;
        if (signature === state.commentsSignature) return;
        state.commentsSignature = signature;
        renderComments(comments);
    } catch (error) {
        console.error(error);
    }
}

function renderComments(comments) {
    const list = $("commentList");
    if (!comments.length) {
        list.innerHTML = "<p class='history-meta'>아직 댓글이 없습니다.</p>";
        return;
    }
    list.innerHTML = "";
    comments.forEach((comment) => {
        const card = document.createElement("article");
        card.className = `comment-card ${comment.resolved ? "resolved" : ""}`;
        card.innerHTML = `
            <div class="comment-meta">
                <span>[${escapeHtml(comment.authorNickname)}]</span>
                <span>${formatTime(comment.createdAt)}</span>
            </div>
            ${renderCommentTag(comment)}
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div class="comment-actions">
                <button type="button" class="ghost resolve-button" data-action="resolve" title="${comment.resolved ? "다시 열기" : "해결 처리"}" aria-label="${comment.resolved ? "다시 열기" : "해결 처리"}">${comment.resolved ? "↺" : "✓"}</button>
                <button type="button" class="danger" data-action="delete">삭제</button>
            </div>
        `;
        card.querySelector("[data-action='resolve']").addEventListener("click", () => toggleComment(comment.id));
        card.querySelector("[data-action='delete']").addEventListener("click", () => deleteComment(comment.id));
        list.appendChild(card);
    });
}

async function createComment(event) {
    event.preventDefault();
    if (!state.viewingFile?.id) {
        alert("댓글을 남길 파일이 없습니다.");
        return;
    }
    const content = $("commentInput").value.trim();
    const tag = $("commentTagInput").value || "NONE";
    if (!content) {
        alert("댓글을 입력하세요.");
        return;
    }
    try {
        await api(`/api/files/${state.viewingFile.id}/comments`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({authorNickname: state.nickname, content, tag}),
        });
        $("commentInput").value = "";
        $("commentTagInput").value = "NONE";
        state.commentsSignature = "";
        state.filesSignature = "";
        await loadComments();
        await loadFileList();
    } catch (error) {
        alert(error.message);
    }
}

async function toggleComment(commentId) {
    try {
        await api(`/api/comments/${commentId}/resolve`, {method: "PATCH"});
        state.commentsSignature = "";
        state.filesSignature = "";
        await loadComments();
        await loadFileList();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteComment(commentId) {
    try {
        await api(`/api/comments/${commentId}`, {method: "DELETE"});
        state.commentsSignature = "";
        state.filesSignature = "";
        await loadComments();
        await loadFileList();
    } catch (error) {
        alert(error.message);
    }
}

function updateDownloadButtons() {
    const disabled = !state.viewingFile?.id;
    $("downloadTxtButton").disabled = disabled;
    $("editWriterButton").disabled = disabled;
}

function parseDownloadFileName(disposition, fallback) {
    const utf8Name = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Name?.[1]) {
        try {
            return decodeURIComponent(utf8Name[1].trim().replace(/^"|"$/g, ""));
        } catch (_) {
            return fallback;
        }
    }
    const quotedName = disposition.match(/filename="([^"]+)"/i);
    return quotedName?.[1] || fallback;
}

function commentTagLabel(tag) {
    return {
        NONE: "기본",
        CHANGE_REQUEST: "수정요청",
        IDEA: "아이디어",
        NEEDS_CHECK: "확인필요",
    }[tag] || "기본";
}

function renderCommentTag(comment) {
    if (!comment?.tag || comment.tag === "NONE") {
        return "";
    }
    return `<div class="comment-tag ${commentTagClass(comment.tag)}">${escapeHtml(comment.tagLabel || commentTagLabel(comment.tag))}</div>`;
}

function commentTagClass(tag) {
    return {
        CHANGE_REQUEST: "tag-change",
        IDEA: "tag-idea",
        NEEDS_CHECK: "tag-check",
    }[tag] || "";
}

function renderTextDocument(container, content) {
    container.innerHTML = "";
    const textWrap = document.createElement("div");
    textWrap.className = "text-document";
    const lines = content.split(/\r?\n/);
    lines.forEach((line) => {
        const row = document.createElement("div");
        const match = line.match(/^(\s*)\/\/\s?(.*)$/);
        if (match) {
            row.className = "slash-comment";
            row.textContent = match[2] || " ";
        } else {
            row.className = "text-line";
            row.textContent = line || " ";
        }
        textWrap.appendChild(row);
    });
    container.appendChild(textWrap);
}

function renderPagedTextDocument(container, content) {
    const lines = splitLines(content);
    const pageCount = Math.max(1, Math.ceil(lines.length / state.linesPerPage));
    state.documentPage = Math.min(Math.max(1, state.documentPage), pageCount);
    const start = (state.documentPage - 1) * state.linesPerPage;
    const end = Math.min(start + state.linesPerPage, lines.length);
    renderTextLines(container, lines.slice(start, end), start);
    renderPageControls(lines.length, pageCount, start, end);
}

function renderTextLines(container, lines, offset = 0) {
    container.innerHTML = "";
    const textWrap = document.createElement("div");
    textWrap.className = "text-document";
    lines.forEach((line) => {
        const row = document.createElement("div");
        row.className = "text-row";
        const content = document.createElement("span");
        const match = line.match(/^(\s*)\/\/\s?(.*)$/);
        content.className = match ? "slash-comment line-content" : "text-line line-content";
        content.textContent = match ? (match[2] || " ") : (line || " ");
        row.append(content);
        textWrap.appendChild(row);
    });
    container.appendChild(textWrap);
}

function renderPageControls(totalLines, pageCount, start, end) {
    const hasDocument = Boolean(state.viewingFile?.id);
    $("pageControls").classList.toggle("hidden", !hasDocument);
    $("pageNav").classList.toggle("hidden", !hasDocument);
    const label = `${state.documentPage} / ${pageCount} · ${start + 1}-${end}줄 / 총 ${totalLines}줄`;
    $("pageIndicator").textContent = label;
    $("pageNavIndicator").textContent = label;
    $("prevPageButton").disabled = state.documentPage <= 1;
    $("nextPageButton").disabled = state.documentPage >= pageCount;
}

function changeLinesPerPage() {
    state.linesPerPage = Number($("linesPerPageSelect").value);
    localStorage.setItem("gongmodocLinesPerPage", String(state.linesPerPage));
    state.documentPage = 1;
    if (state.viewingFile) {
        renderDocument(state.viewingFile, !state.viewingFile.current);
    }
}

function changeDocumentPage(delta) {
    if (!state.viewingFile) return;
    state.documentPage += delta;
    renderDocument(state.viewingFile, !state.viewingFile.current);
}

function splitLines(content) {
    return String(content || "").split(/\r?\n/);
}

function defaultWriterFileName() {
    const now = new Date();
    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("");
    return `silverroom_note_${date}`;
}

function normalizeWriterFileName(value, fileType = "TXT") {
    const cleanName = (value || defaultWriterFileName())
        .trim()
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\.+$/g, "");
    const withoutExtension = cleanName.replace(/\.(md|txt|text)$/i, "");
    const extension = fileType === "MD" ? "md" : "txt";
    return `${withoutExtension}.${extension}`;
}

function fileTypeLabel(fileType) {
    return fileType === "MD" ? "md" : "txt";
}

function formatDate(value) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parseSeoulDate(value));
}

function formatTime(value) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parseSeoulDate(value));
}

function parseSeoulDate(value) {
    if (!value) return new Date();
    const text = String(value);
    if (/[zZ]|[+-]\d{2}:\d{2}$/.test(text)) {
        return new Date(text);
    }
    return new Date(`${text}+09:00`);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
