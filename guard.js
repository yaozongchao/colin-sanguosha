/**
 * Colin 三国杀 - 家长守卫与版本控制 (Parental Guard & Version Banner)
 * 继承 CleanYourTV / 能量晶石 离线 SHA-256 挑战-应答放行机制
 */
(function () {
  "use strict";

  const APP_VERSION = "v1.1.0";
  const SECRET = "ColinCleanTV2026";
  const CONFIG_API = "https://energy.colinyao.fun/api/tv-config";
  const DEFAULT_QUOTA_MINUTES = 30;

  // 1. 获取今天日期 YYYY-MM-DD
  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // 2. 本地时长状态读取与存储
  function getTodayUsageSeconds() {
    const today = getTodayKey();
    const storedDate = localStorage.getItem("colin_sgs_usage_date");
    if (storedDate !== today) {
      localStorage.setItem("colin_sgs_usage_date", today);
      localStorage.setItem("colin_sgs_usage_seconds", "0");
      localStorage.setItem("colin_sgs_extra_seconds", "0");
      return 0;
    }
    return parseInt(localStorage.getItem("colin_sgs_usage_seconds") || "0", 10);
  }

  function addUsageSecond() {
    const current = getTodayUsageSeconds();
    localStorage.setItem("colin_sgs_usage_seconds", String(current + 1));
    return current + 1;
  }

  function getExtraSeconds() {
    return parseInt(localStorage.getItem("colin_sgs_extra_seconds") || "0", 10);
  }

  function addExtraSeconds(sec) {
    const current = getExtraSeconds();
    localStorage.setItem("colin_sgs_extra_seconds", String(current + sec));
  }

  // 3. 配额获取
  let quotaMinutes = DEFAULT_QUOTA_MINUTES;
  let isForceLocked = false;

  async function syncCloudConfig() {
    try {
      const resp = await fetch(CONFIG_API, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const list = await resp.json();
        const cfg = list.find((item) => item.package_name === "com.colin.sanguosha");
        if (cfg) {
          quotaMinutes = cfg.daily_quota_minutes ?? DEFAULT_QUOTA_MINUTES;
          isForceLocked = !!cfg.is_locked;
          localStorage.setItem("colin_sgs_cloud_quota", String(quotaMinutes));
          localStorage.setItem("colin_sgs_cloud_locked", isForceLocked ? "1" : "0");
          return;
        }
      }
    } catch (_) {}
    // 降级使用本地存储或保底
    const localQ = localStorage.getItem("colin_sgs_cloud_quota");
    if (localQ) quotaMinutes = parseInt(localQ, 10);
    isForceLocked = localStorage.getItem("colin_sgs_cloud_locked") === "1";
  }

  // 4. SHA-256 挑战放行算法 (与 CleanYourTV / tv-helper.html 100% 对齐)
  async function verifyPasscode(challenge, inputCode) {
    const durations = [
      { opt: 0, minutes: 30, label: "30 分钟" },
      { opt: 1, minutes: 45, label: "45 分钟" },
      { opt: 2, minutes: 60, label: "60 分钟" },
      { opt: 3, minutes: 1440, label: "全天无限" },
      { opt: 4, minutes: 0.5, label: "30 秒测试" },
    ];
    for (const d of durations) {
      const payload = `${challenge}:${d.opt}:${SECRET}`;
      const data = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const view = new DataView(hashBuffer);
      const val = view.getInt32(0, false);
      const expected = (Math.abs(val) % 10000).toString().padStart(4, "0");
      if (expected === inputCode) {
        return d;
      }
    }
    return null;
  }

  // 5. 生成当前挑战码
  let currentChallenge = Math.floor(1000 + Math.random() * 9000);

  // 6. UI: 注入样式与全屏锁屏遮罩
  function injectStylesAndUI() {
    const style = document.createElement("style");
    style.textContent = `
      #colin-version-badge {
        position: fixed;
        bottom: 8px;
        right: 8px;
        z-index: 99999;
        background: rgba(20, 20, 25, 0.75);
        color: #d4af37;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 12px;
        border: 1px solid rgba(212, 175, 55, 0.35);
        backdrop-filter: blur(8px);
        pointer-events: auto;
        cursor: pointer;
        user-select: none;
        letter-spacing: 0.5px;
        transition: all 0.2s ease;
      }
      #colin-version-badge:hover {
        background: rgba(35, 35, 45, 0.95);
        border-color: #d4af37;
      }
      #colin-lock-mask {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 99999999;
        background: radial-gradient(circle at center, rgba(30, 25, 20, 0.98), rgba(10, 10, 12, 0.99));
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
        color: #f5ecd5;
        padding: 20px;
        box-sizing: border-box;
      }
      #colin-lock-card {
        background: rgba(30, 26, 22, 0.9);
        border: 2px solid #b8860b;
        border-radius: 16px;
        box-shadow: 0 0 30px rgba(184, 134, 11, 0.35);
        width: 90%;
        max-width: 440px;
        padding: 24px;
        text-align: center;
      }
      .colin-lock-title {
        font-size: 24px;
        font-weight: bold;
        color: #d4af37;
        margin-bottom: 8px;
        letter-spacing: 2px;
      }
      .colin-lock-sub {
        font-size: 14px;
        color: #aaa;
        margin-bottom: 20px;
      }
      .colin-challenge-box {
        background: rgba(0, 0, 0, 0.5);
        border: 1px dashed #d4af37;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 20px;
      }
      .colin-challenge-label {
        font-size: 12px;
        color: #888;
        margin-bottom: 4px;
      }
      .colin-challenge-code {
        font-family: ui-monospace, Menlo, monospace;
        font-size: 32px;
        font-weight: 800;
        color: #ffcc00;
        letter-spacing: 6px;
      }
      .colin-input-group {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 12px;
      }
      .colin-passcode-input {
        width: 140px;
        font-size: 22px;
        text-align: center;
        font-family: ui-monospace, Menlo, monospace;
        letter-spacing: 4px;
        border: 2px solid #555;
        background: #111;
        color: #fff;
        border-radius: 8px;
        padding: 8px;
        outline: none;
      }
      .colin-passcode-input:focus {
        border-color: #d4af37;
      }
      .colin-unlock-btn {
        background: linear-gradient(135deg, #b8860b, #d4af37);
        color: #111;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        padding: 0 18px;
        cursor: pointer;
        font-size: 16px;
        transition: transform 0.1s;
      }
      .colin-unlock-btn:active {
        transform: scale(0.96);
      }
      .colin-lock-tip {
        font-size: 12px;
        color: #777;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);

    // 版本角标
    const badge = document.createElement("div");
    badge.id = "colin-version-badge";
    badge.innerHTML = `🛡️ ${APP_VERSION}`;
    badge.title = "点击查看今日军务时长";
    badge.onclick = () => {
      const usedMin = Math.floor(getTodayUsageSeconds() / 60);
      const totalMin = quotaMinutes + Math.floor(getExtraSeconds() / 60);
      alert(`⚔️ Colin 的三国杀\n\n版本：${APP_VERSION}\n今日已战：${usedMin} 分钟\n今日限额：${isForceLocked ? "已由家长锁定" : totalMin + " 分钟"}`);
    };
    document.body.appendChild(badge);

    // 锁屏遮罩
    const mask = document.createElement("div");
    mask.id = "colin-lock-mask";
    mask.innerHTML = `
      <div id="colin-lock-card">
        <div class="colin-lock-title">🏯 今日军务已毕</div>
        <div class="colin-lock-sub">主公鞍马劳顿，请注意休息护眼！</div>
        
        <div class="colin-challenge-box">
          <div class="colin-challenge-label">向爸爸报出挑战码以获得放行：</div>
          <div class="colin-challenge-code" id="colin-challenge-text">${currentChallenge}</div>
        </div>

        <div class="colin-input-group">
          <input type="number" id="colin-input-code" class="colin-passcode-input" placeholder="0000" maxlength="4" pattern="[0-9]*" inputmode="numeric">
          <button id="colin-submit-btn" class="colin-unlock-btn">核销放行</button>
        </div>

        <div class="colin-lock-tip">
          爸爸可在手机【能量晶石 · 家长助手】中输入挑战码生成放行码。<br>
          适度游戏益脑，沉迷游戏伤身。
        </div>
      </div>
    `;
    document.body.appendChild(mask);

    // 绑定放行校验事件
    const input = mask.querySelector("#colin-input-code");
    const btn = mask.querySelector("#colin-submit-btn");

    async function handleUnlock() {
      const code = input.value.trim();
      if (!/^\d{4}$/.test(code)) {
        alert("请输入4位纯数字放行码！");
        return;
      }
      const verified = await verifyPasscode(currentChallenge, code);
      if (verified) {
        addExtraSeconds(Math.floor(verified.minutes * 60));
        alert(`🎉 放行成功！已增加时长：${verified.label}，主公请继续出战！`);
        input.value = "";
        hideLock();
      } else {
        alert("❌ 放行码错误，请找爸爸重新确认！");
        input.value = "";
      }
    }

    btn.onclick = handleUnlock;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleUnlock();
    });
  }

  function showLock() {
    const mask = document.getElementById("colin-lock-mask");
    if (!mask) return;
    currentChallenge = Math.floor(1000 + Math.random() * 9000);
    const codeEl = document.getElementById("colin-challenge-text");
    if (codeEl) codeEl.textContent = String(currentChallenge);
    mask.style.display = "flex";
  }

  function hideLock() {
    const mask = document.getElementById("colin-lock-mask");
    if (mask) mask.style.display = "none";
  }

  // 7. 心跳监控与时间判定
  function checkLimit() {
    const used = getTodayUsageSeconds();
    const allowed = quotaMinutes * 60 + getExtraSeconds();
    const mask = document.getElementById("colin-lock-mask");
    const isShowing = mask && mask.style.display === "flex";

    if (isForceLocked || used >= allowed) {
      if (!isShowing) showLock();
    } else {
      if (isShowing) hideLock();
    }
  }

  function startHeartbeat() {
    setInterval(() => {
      // 只有当前页面在前台可见时才计入使用时间
      if (!document.hidden) {
        addUsageSecond();
        checkLimit();
      }
    }, 1000);

    // 每 2 分钟尝试从能量晶石同步一次云端配置
    setInterval(syncCloudConfig, 120000);
  }

  // 8. 启动
  document.addEventListener("DOMContentLoaded", async () => {
    injectStylesAndUI();
    await syncCloudConfig();
    checkLimit();
    startHeartbeat();
  });
})();
