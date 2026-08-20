// ==========================================================
// AntigravityCN - Frontend Controller & Wails Bridge
// ==========================================================

const GITHUB_REPO_URL = "https://github.com/haoze-evolluling/AntigravityCN";

let currentPath = "";
let currentStatus = {
    asarExists: false,
    backupExists: false,
    isRunning: false
};
let pendingAction = null; // "apply" or "restore"
let currentThemeMode = "system"; // "system" | "light" | "dark"

document.addEventListener("DOMContentLoaded", async () => {
    initThemeSystem();
    initNavigation();
    initWindowControls();
    initEventListeners();
    await loadInitialState();
});

// ==========================================================
// Theme Management System
// ==========================================================
function initThemeSystem() {
    const savedTheme = localStorage.getItem("antigravity_theme") || "system";
    setThemeMode(savedTheme, false);

    // Bind theme card clicks
    const optSystem = document.getElementById("theme-opt-system");
    const optLight = document.getElementById("theme-opt-light");
    const optDark = document.getElementById("theme-opt-dark");

    if (optSystem) optSystem.addEventListener("click", () => setThemeMode("system", true));
    if (optLight) optLight.addEventListener("click", () => setThemeMode("light", true));
    if (optDark) optDark.addEventListener("click", () => setThemeMode("dark", true));

    // Watch OS system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
        if (currentThemeMode === "system") {
            applyThemeToDOM("system");
        }
    });
}

function setThemeMode(mode, showFeedback = true) {
    if (!["system", "light", "dark"].includes(mode)) {
        mode = "system";
    }
    currentThemeMode = mode;
    localStorage.setItem("antigravity_theme", mode);

    applyThemeToDOM(mode);
    updateThemeSelectorUI(mode);

    // Synchronize native window theme if Wails runtime supports it
    if (window.runtime) {
        try {
            if (mode === "light" && window.runtime.WindowSetLightTheme) {
                window.runtime.WindowSetLightTheme();
            } else if (mode === "dark" && window.runtime.WindowSetDarkTheme) {
                window.runtime.WindowSetDarkTheme();
            } else if (mode === "system" && window.runtime.WindowSetSystemDefaultTheme) {
                window.runtime.WindowSetSystemDefaultTheme();
            }
        } catch (e) {
            console.debug("Wails window theme API call ignored:", e);
        }
    }

    if (showFeedback) {
        const names = {
            system: "跟随系统",
            light: "浅色模式",
            dark: "深色模式"
        };
        showToast(`已切换为【${names[mode]}】`);
    }
}

function applyThemeToDOM(mode) {
    const isDarkOS = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let effectiveTheme = mode;
    if (mode === "system") {
        effectiveTheme = isDarkOS ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-theme", effectiveTheme);
    document.body.setAttribute("data-theme", effectiveTheme);
}

function updateThemeSelectorUI(mode) {
    const cards = {
        system: document.getElementById("theme-opt-system"),
        light: document.getElementById("theme-opt-light"),
        dark: document.getElementById("theme-opt-dark")
    };

    Object.keys(cards).forEach((key) => {
        const el = cards[key];
        if (el) {
            if (key === mode) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        }
    });

    const label = document.getElementById("current-theme-label");
    if (label) {
        const labels = {
            system: "跟随系统",
            light: "浅色模式",
            dark: "深色模式"
        };
        label.textContent = labels[mode] || "跟随系统";
    }
}

// ==========================================================
// Page View Navigation (Dashboard <-> Settings)
// ==========================================================
function initNavigation() {
    const navBtnDashboard = document.getElementById("nav-btn-dashboard");
    const navBtnSettings = document.getElementById("nav-btn-settings");
    const btnBackDashboard = document.getElementById("btn-back-dashboard");
    const viewDashboard = document.getElementById("view-dashboard");
    const viewSettings = document.getElementById("view-settings");

    function switchView(target) {
        if (target === "settings") {
            viewDashboard.classList.remove("active");
            viewSettings.classList.add("active");
            if (navBtnDashboard) navBtnDashboard.classList.remove("active");
            if (navBtnSettings) navBtnSettings.classList.add("active");
        } else {
            viewSettings.classList.remove("active");
            viewDashboard.classList.add("active");
            if (navBtnDashboard) navBtnDashboard.classList.add("active");
            if (navBtnSettings) navBtnSettings.classList.remove("active");
        }
    }

    if (navBtnDashboard) {
        navBtnDashboard.addEventListener("click", () => switchView("dashboard"));
    }

    if (navBtnSettings) {
        navBtnSettings.addEventListener("click", () => switchView("settings"));
    }

    if (btnBackDashboard) {
        btnBackDashboard.addEventListener("click", () => switchView("dashboard"));
    }
}

// Window Minimise & Close
function initWindowControls() {
    const btnMin = document.getElementById("btn-minimize");
    const btnClose = document.getElementById("btn-close");

    if (btnMin) {
        btnMin.addEventListener("click", () => {
            if (window.runtime && window.runtime.WindowMinimise) {
                window.runtime.WindowMinimise();
            }
        });
    }

    if (btnClose) {
        btnClose.addEventListener("click", () => {
            if (window.runtime && window.runtime.Quit) {
                window.runtime.Quit();
            }
        });
    }
}

// Initial state load
async function loadInitialState() {
    // Listen for log events from Go backend
    if (window.runtime && window.runtime.EventsOn) {
        window.runtime.EventsOn("log", (msg) => {
            appendLog(msg);
        });
    }

    if (window.go && window.go.main && window.go.main.App) {
        try {
            const state = await window.go.main.App.GetInitialState();
            updateUIState(state);
        } catch (err) {
            appendLog(`[错误] 初始化状态失败: ${err}`);
        }
    }
}

// Event Listeners
function initEventListeners() {
    const btnBrowse = document.getElementById("btn-browse");
    const btnRefresh = document.getElementById("btn-refresh");
    const btnApply = document.getElementById("btn-apply");
    const btnRestore = document.getElementById("btn-restore");
    const btnLaunch = document.getElementById("btn-launch");
    const btnClearLog = document.getElementById("btn-clear-log");
    const btnCopyLog = document.getElementById("btn-copy-log");
    const btnOpenGithub = document.getElementById("btn-open-github");

    const modalCancel = document.getElementById("modal-btn-cancel");
    const modalAutoClose = document.getElementById("modal-btn-autoclose");

    // Open GitHub Repo
    if (btnOpenGithub) {
        btnOpenGithub.addEventListener("click", () => {
            openExternalUrl(GITHUB_REPO_URL);
        });
    }

    // Browse file
    btnBrowse.addEventListener("click", async () => {
        if (window.go && window.go.main && window.go.main.App) {
            const selected = await window.go.main.App.SelectAsarFile();
            if (selected) {
                currentPath = selected;
                document.getElementById("input-path").value = selected;
                await refreshStatus();
                appendLog(`[*] 已选择目标文件: ${selected}`);
            }
        }
    });

    // Refresh
    btnRefresh.addEventListener("click", async () => {
        await refreshStatus();
        showToast("状态已刷新");
    });

    // Apply Patch
    btnApply.addEventListener("click", async () => {
        if (!currentStatus.asarExists) {
            showToast("请先选择有效的 app.asar 文件！");
            return;
        }

        if (currentStatus.isRunning) {
            pendingAction = "apply";
            showConflictModal();
            return;
        }

        await executeApply(false);
    });

    // Restore Original
    btnRestore.addEventListener("click", async () => {
        if (!currentStatus.asarExists) {
            showToast("请先选择有效的 app.asar 文件！");
            return;
        }

        if (!currentStatus.backupExists) {
            showToast("未检测到备份文件，无法还原！");
            return;
        }

        if (currentStatus.isRunning) {
            pendingAction = "restore";
            showConflictModal();
            return;
        }

        await executeRestore(false);
    });

    // Launch Antigravity
    btnLaunch.addEventListener("click", async () => {
        if (window.go && window.go.main && window.go.main.App) {
            const res = await window.go.main.App.LaunchAntigravity(currentPath);
            if (res.success) {
                showToast("已启动 Antigravity！");
            } else {
                showToast(`启动失败: ${res.message}`);
            }
            setTimeout(refreshStatus, 1500);
        }
    });

    // Clear logs
    btnClearLog.addEventListener("click", () => {
        document.getElementById("terminal-body").innerHTML = "";
        showToast("控制台已清空");
    });

    // Copy logs
    btnCopyLog.addEventListener("click", () => {
        const text = document.getElementById("terminal-body").innerText;
        navigator.clipboard.writeText(text).then(() => {
            showToast("日志已复制到剪贴板");
        });
    });

    // Modal buttons
    modalCancel.addEventListener("click", () => {
        hideConflictModal();
        appendLog("[!] 用户取消了操作（Antigravity 正在运行）。");
        pendingAction = null;
    });

    modalAutoClose.addEventListener("click", async () => {
        hideConflictModal();
        if (pendingAction === "apply") {
            await executeApply(true);
        } else if (pendingAction === "restore") {
            await executeRestore(true);
        }
        pendingAction = null;
    });
}

// Open External URL
function openExternalUrl(url) {
    if (window.runtime && window.runtime.BrowserOpenURL) {
        window.runtime.BrowserOpenURL(url);
    } else if (window.go && window.go.main && window.go.main.App && window.go.main.App.OpenURL) {
        window.go.main.App.OpenURL(url);
    } else {
        window.open(url, "_blank");
    }
    showToast("已在默认浏览器中打开 GitHub 仓库");
}

// Refresh status
async function refreshStatus() {
    if (window.go && window.go.main && window.go.main.App) {
        const state = await window.go.main.App.RefreshStatus(currentPath);
        updateUIState(state);
    }
}

// Update UI with AppState
function updateUIState(state) {
    currentPath = state.asarPath || "";
    currentStatus.asarExists = state.asarExists;
    currentStatus.backupExists = state.backupExists;
    currentStatus.isRunning = state.isRunning;

    document.getElementById("input-path").value = currentPath;

    // Pill: Install
    const pillInstall = document.getElementById("pill-install");
    if (state.asarExists) {
        pillInstall.className = "status-pill status-ok";
        pillInstall.querySelector(".status-value").textContent = "已定位";
    } else {
        pillInstall.className = "status-pill status-err";
        pillInstall.querySelector(".status-value").textContent = "未找到";
    }

    // Pill: Backup
    const pillBackup = document.getElementById("pill-backup");
    if (state.backupExists) {
        pillBackup.className = "status-pill status-ok";
        pillBackup.querySelector(".status-value").textContent = "已备份";
    } else {
        pillBackup.className = "status-pill status-warn";
        pillBackup.querySelector(".status-value").textContent = "未备份";
    }

    // Pill: Running
    const pillRunning = document.getElementById("pill-running");
    if (state.isRunning) {
        pillRunning.className = "status-pill status-warn";
        pillRunning.querySelector(".status-value").textContent = "运行中";
    } else {
        pillRunning.className = "status-pill status-ok";
        pillRunning.querySelector(".status-value").textContent = "未运行";
    }
}

// Execute Apply
async function executeApply(autoClose) {
    setButtonsDisabled(true);
    try {
        const res = await window.go.main.App.ApplyPatch(currentPath, autoClose);
        if (res.success) {
            showToast("🎉 汉化成功完成！");
        } else {
            showToast(`汉化失败: ${res.message}`);
        }
    } catch (err) {
        appendLog(`[错误] 异常: ${err}`);
    } finally {
        setButtonsDisabled(false);
        await refreshStatus();
    }
}

// Execute Restore
async function executeRestore(autoClose) {
    setButtonsDisabled(true);
    try {
        const res = await window.go.main.App.RestoreOriginal(currentPath, autoClose);
        if (res.success) {
            showToast("已成功还原英文官方原版！");
        } else {
            showToast(`还原失败: ${res.message}`);
        }
    } catch (err) {
        appendLog(`[错误] 异常: ${err}`);
    } finally {
        setButtonsDisabled(false);
        await refreshStatus();
    }
}

function setButtonsDisabled(disabled) {
    document.getElementById("btn-apply").disabled = disabled;
    document.getElementById("btn-restore").disabled = disabled;
    document.getElementById("btn-browse").disabled = disabled;
    document.getElementById("btn-refresh").disabled = disabled;
}

// Modal handling
function showConflictModal() {
    document.getElementById("modal-conflict").classList.remove("hidden");
}

function hideConflictModal() {
    document.getElementById("modal-conflict").classList.add("hidden");
}

// Append log to terminal
function appendLog(text) {
    const term = document.getElementById("terminal-body");
    const div = document.createElement("div");
    div.className = "log-line";

    if (text.includes("===")) {
        div.className += " log-divider";
    } else if (text.includes("[OK]") || text.includes("[+]") || text.includes("完成") || text.includes("成功")) {
        div.className += " log-success";
    } else if (text.includes("[*]")) {
        div.className += " log-info";
    } else if (text.includes("[!]") || text.includes("警告")) {
        div.className += " log-warn";
    } else if (text.includes("[错误]") || text.includes("失败")) {
        div.className += " log-error";
    } else {
        div.className += " log-system";
    }

    const time = new Date().toLocaleTimeString();
    div.textContent = `[${time}] ${text}`;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
}

// Toast notification
let toastTimer = null;
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 2800);
}
