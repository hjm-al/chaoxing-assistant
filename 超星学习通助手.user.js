// ==UserScript==
// @name          【超星学习通助手】更新AI解答+视频+测试+考试（使用AI进行答题）
// @namespace     li_stu
// @version       2.43
// @description   【完全免费】超星学习通：视频/文档/图书全自动，测验作业考试 AI 答题可选，验证码风控自动暂停续跑。基于脚本猫 1693（unrival，GPL-3.0）二次开发，维护者 li_stu
// @name:zh-TW   【超星學習通助手】更新AI解答+影片+測驗+考試（AI輔助）
// @name:en      Chaoxing Learning Assistant [AI Answer][Video][Quiz][Exam]
// @description:zh-TW   【完全免費】超星學習通：影片/文件/圖書全自動，測驗作業考試 AI 答題可選，驗證碼風控自動暫停續跑。基於腳本貓 1693（unrival，GPL-3.0）二次開發，維護者 li_stu
// @description:en     Free Chaoxing helper: fully automatic video / document / book, optional AI answering for quizzes and exams, auto-pauses at the platform captcha and resumes from the breakpoint. Derived from ScriptCat 1693 by unrival (GPL-3.0), maintained by li_stu.
// @antifeature payment  脚本会请求第三方AI接口进行答题，您可以选择停用相关功能
// @antifeature:zh-TW payment 腳本會請求第三方AI介面進行答題，您可以選擇停用相關功能
// @antifeature:en payment The script requests third-party AI APIs for answering. You can disable this feature.
// @compatible firefox
// @compatible chrome
// @compatible edge
// @author        unrival, li_stu
// @run-at        document-end
// @storageName   li_stu_xxt
// @match         *://*.chaoxing.com/*
// @match         *://*.edu.cn/*
// @match         *://*.nbdlib.cn/*
// @match         *://*.hnsyu.net/*
// @match         *://*.ac.cn/*
// @icon          https://pan-yz.chaoxing.com/favicon.ico
// @grant         unsafeWindow
// @grant         GM_xmlhttpRequest
// @grant         GM_setValue
// @grant         GM_getValue
// @grant         GM_info
// @grant         GM_getResourceText
// @connect       passport2-api.chaoxing.com
// @connect       zhibo.chaoxing.com
// @connect       pan-yz.chaoxing.com
// @connect       api.deepseek.com
// @connect       nuoapi.net
// @connect       api.higanai.top
// @connect       localhost
// @connect       127.0.0.1
// @connect       *
// 说明：以上每个域名都对应脚本里真实发起的跨域请求，可逐条核对：
//   passport2-api.chaoxing.com  登录态校验与用户信息
//   zhibo.chaoxing.com          直播回放观看进度上报
//   pan-yz.chaoxing.com         仅用于 @icon 图标与运行日志截图，非接口请求
//   api.deepseek.com / nuoapi.net / api.higanai.top / localhost / 127.0.0.1  内置 AI 预设
// AI 接口地址由用户在「LLM 配置」中自行填写（DeepSeek / Ollama / NuoAPI / 其他 OpenAI 兼容服务），
// 目标域名无法在打包时枚举，因此保留 `*`；声明具体域名只为让审核能对上代码，不缩小用户可用范围。
// @resource      Vue https://lib.baomitu.com/vue/2.6.0/vue.min.js
// @resource      ElementUi https://lib.baomitu.com/element-ui/2.15.13/index.js
// @resource      ElementUiCss https://lib.baomitu.com/element-ui/2.15.13/theme-chalk/index.min.css
// @resource      Table https://www.forestpolice.org/ttf/2.0/table.json
// 字体映射表来源：脚本猫 432《超星字体解密》作者 wyn665817（MIT），
// 原表由该作者生成；forestpolice.org 仅为当前可用的静态托管镜像。
// 若该站失效，可换任意同内容托管地址，不影响字体解密逻辑。
// @require       https://lib.baomitu.com/axios/0.27.2/axios.min.js
// @require       https://lib.baomitu.com/cryptico/0.0.1343522940/hash.min.js
// @require       https://lib.baomitu.com/jquery/3.6.0/jquery.min.js
// @require       https://lib.baomitu.com/promise-polyfill/8.3.0/polyfill.min.js
// @license       GPL-3.0-or-later
// @homepageURL   https://github.com/hjm-al/chaoxing-assistant
// @supportURL    https://github.com/hjm-al/chaoxing-assistant/issues
// @source        https://github.com/hjm-al/chaoxing-assistant
// @original-script https://scriptcat.org/zh-CN/script-show-page/1693
// @original-author unrival
// @original-license GPL-3.0-or-later
// @thanks        脚本猫 1693《超星学习通助手》作者 unrival
// @thanks        脚本猫 379《正则脚本》作者 张正则（原版，已下线）
// @thanks        GitHub Looong01/Zhihuishu-Automatic-Answering 作者 Loong（BUPT）
// @thanks        GitHub Black-Cyan/chaoxing 作者 Black-Cyan
// @thanks        脚本猫 432《超星字体解密》作者 wyn665817
// @thanks        脚本猫 367《OCS 网课助手》作者 言小溪enncy
// @thanks        Greasy Fork 28497《网页限制解除(改)》作者 qxinGitHub
// @thanks        脚本猫 616 / Greasy Fork 451356《【万能】全平台自动答题脚本》作者 万能（Greasy Fork: xmig666）
// @tag           超星学习通
// @tag           学习辅助
// @tag           答题辅助
// @tag           AI答题
// @tag           自动播放
// @tag           在线教育
// @tag           AI辅助
// ==/UserScript==
// 如需新增安全网址(@connect)，请在上方元数据块内的 @connect 列表中补充，一行一个。

// ============================================================================
// 来源与署名
//
//   原始版本：脚本猫 1693《超星学习通助手》，作者 unrival，许可证 GPL-3.0-or-later。
//   本脚本：在该版本基础上二次开发并持续维护（维护者 li_stu），沿用
//           GPL-3.0-or-later 分发，许可证全文见仓库 LICENSE。
//           二次分发必须附带完整源码、保留原作者署名，不得闭源或混淆打包。
//
// 致谢清单
//   以下项目在本脚本开发过程中提供了思路、接口约定或行为对照。此处仅作参考登记，
//   本脚本未复制它们的代码。一行一项，括号内为许可证：
//   - 脚本猫 379《正则脚本》— 张正则（原版已下线，未标注许可证）
//   - Zhihuishu-Automatic-Answering — Loong / BUPT（MIT）
//   - chaoxing — Black-Cyan（Apache-2.0）
//   - 脚本猫 432《超星字体解密》— wyn665817（MIT）
//   - 脚本猫 367《OCS 网课助手》— 言小溪 enncy（MIT）
//   - Greasy Fork 28497《网页限制解除(改)》— qxinGitHub（LGPL-3.0）
//   - 脚本猫 616 / Greasy Fork 451356《【万能】全平台自动答题脚本》— 万能（未标注许可证）
//
// 关于 616 / 451356 的边界说明（一行一条）：
//   1. 重合范围仅限「早期答题框架与接口约定」：WorkerJS 与 GLOBAL 配置对象、answerApi.tikuAdapter / tiku_adapter 题库适配约定、考试页路径匹配写法。
//   2. 上述内容在仓库归档的 v1.46 快照里已全部存在，属于 unrival 代码线的既成部分，不是本脚本新增的搬用。
//   3. 该项目在脚本页与 Greasy Fork 页的许可证字段均为空，本脚本不能以它作为授权来源，也不对它做任何再许可。
//   4. 它后期加入的题库直连与多 host 探测（getFastHost / probeHosts、tiku168.net）未被本脚本采用。
//   5. v2.37 已把沿用该家族写法却与本脚本无关的答案上报、广告位实现整体移除：reportOnline、url2Base64、adList、hookHTML、uploadAnswer、scriptService、baseService。
// ============================================================================


var XXTFoundation = (function () {
    var logPrefix = "[XXT]";

    function get(key, fallback) {
        try {
            var value = GM_getValue(key);
            return value === undefined ? fallback : value;
        } catch (error) {
            log("warn", "读取设置失败：" + key, error);
            return fallback;
        }
    }

    function set(key, value) {
        try {
            GM_setValue(key, value);
            return true;
        } catch (error) {
            log("warn", "保存设置失败：" + key, error);
            return false;
        }
    }

    function text(value, fallback) {
        var normalized = String(value == null ? "" : value).trim();
        return normalized || (fallback || "");
    }

    function number(value, fallback, minimum) {
        var parsed = Number(value);
        if (!isFinite(parsed) || (minimum != null && parsed < minimum)) return fallback;
        return parsed;
    }

    function enabled(value) {
        return value === true || value === "true" || value === 1 || value === "1";
    }

    function log(level, message, detail) {
        var method = console && typeof console[level] === "function" ? level : "log";
        if (detail === undefined) console[method](logPrefix + " " + message);
        else console[method](logPrefix + " " + message, detail);
    }

    function request(options) {
        if (!options || typeof options !== "object") {
            return Promise.reject(new TypeError("请求配置无效"));
        }
        return new Promise(function (resolve, reject) {
            var requestOptions = Object.assign({}, options);
            var onload = requestOptions.onload;
            var onerror = requestOptions.onerror;
            requestOptions.onload = function (response) {
                if (typeof onload === "function") onload(response);
                resolve(response);
            };
            requestOptions.onerror = function (error) {
                if (typeof onerror === "function") onerror(error);
                reject(error);
            };
            try {
                GM_xmlhttpRequest(requestOptions);
            } catch (error) {
                if (typeof onerror === "function") onerror(error);
                reject(error);
            }
        });
    }

    return { get: get, set: set, text: text, number: number, enabled: enabled, log: log, request: request };
})();

function aiPanelMessage(type, message, sourceWindow) {
    var current = sourceWindow || (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
    while (current) {
        try {
            var frame = current.document.getElementById('iframeNode');
            if (frame && frame.contentWindow && typeof frame.contentWindow.vueDefinedProp === 'function') {
                frame.contentWindow.vueDefinedProp(type, message);
                return true;
            }
            if (current === current.parent) break;
            current = current.parent;
        } catch (error) {
            break;
        }
    }
    return false;
}

function aiRemovePanel(sourceWindow, owner) {
    var current = sourceWindow || (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
    while (current) {
        try {
            var panel = current.document.getElementById('modelId_xx');
            if (panel && panel.querySelector('#iframeNode') && (!owner || panel.dataset.xxtOwner === owner)) {
                panel.remove();
                return true;
            }
            if (current === current.parent) break;
            current = current.parent;
        } catch (error) {
            break;
        }
    }
    return false;
}
// ============================================================================
// UI 模块：悬浮答题面板 / 学习通主页面板 / LLM 配置面板 / 保存提示
// 四套 HTML 模板与公共设计令牌只在这里定义一份，其它位置一律通过 XXT_UI 取用，
// 避免同一份样式与结构重复维护、改一处漏三处。
// ============================================================================
var XXT_UI = (function () {
    var TOKENS = ":root {\n  color-scheme: light;\n  --xxt-ink: #243447;\n  --xxt-muted: #718096;\n  --xxt-line: #e6ebf1;\n  --xxt-surface: #ffffff;\n  --xxt-soft: #f5f8fb;\n  --xxt-accent: #3b82f6;\n}";

    var PANEL_HTML = `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>

__XXT_ELEMENT_CSS__
__XXT_TOKENS__
      html, body {
        width: 100%;
        margin: 0;
        min-width: 0;
        overflow-x: hidden;
        background: #eef2f6;
      }
      #app {
        width: 100%;
        min-width: 0;
        min-height: 100vh;
        color: var(--xxt-ink);
      }
      .xxt-shell {
        padding: 10px 10px 14px;
      }
      .xxt-header {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 9px;
        padding: 10px 12px;
        border: 1px solid var(--xxt-line);
        border-radius: 8px;
        background: var(--xxt-surface);
        box-shadow: 0 2px 8px rgba(31, 45, 61, .06);
      }
      .xxt-header-actions {
        display: flex;
        flex: 0 0 auto;
        gap: 4px;
      }
      .xxt-title {
        margin: 0;
        color: var(--xxt-ink);
        font-size: 15px;
        font-weight: 700;
        line-height: 1.3;
      }
      .xxt-subtitle {
        margin: 3px 0 0;
        color: var(--xxt-muted);
        font-size: 11px;
      }
      .xxt-section {
        margin-bottom: 8px;
        padding: 9px;
        border: 1px solid var(--xxt-line);
        border-radius: 8px;
        background: var(--xxt-surface);
        box-shadow: 0 1px 5px rgba(31, 45, 61, .04);
      }
      .xxt-section:last-child {
        margin-bottom: 0;
      }
      .xxt-section-title {
        margin: 0 0 7px;
        color: var(--xxt-muted);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: .02em;
      }
      .xxt-alert {
        margin: 0;
      }
      .xxt-status {
        display: block;
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
        color: var(--xxt-muted);
        font-size: 11px;
        line-height: 1.4;
        white-space: normal;
      }
      .xxt-table {
        width: 100%;
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--xxt-line);
        border-radius: 6px;
      }
      .xxt-table .el-table__header th {
        color: #526273;
        background: var(--xxt-soft);
        font-size: 11px;
        font-weight: 600;
      }
      .xxt-table .el-table__body td {
        vertical-align: top;
        color: #334155;
        font-size: 11px;
      }
      .xxt-table .cell {
        min-width: 0;
        padding: 5px 6px;
        line-height: 1.45;
        word-break: break-word;
        overflow-wrap: anywhere;
        white-space: normal;
      }
      .xxt-table th .cell {
        padding: 5px 4px;
        white-space: nowrap;
      }
      .xxt-table .warning-row {
        background: #fff8eb;
      }
      .xxt-table .default-row {
        background: #f5fbf7;
      }
      .xxt-table .primary-row {
        background: #f3f8ff;
      }
      .xxt-table .el-button {
        max-width: 100%;
        padding: 5px 6px;
        white-space: normal;
        overflow-wrap: anywhere;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .xxt-trace {
        height: 104px;
        overflow-y: auto;
        padding: 3px 6px;
        border: 1px solid var(--xxt-line);
        border-radius: 5px;
        background: #f8fafc;
      }
      .xxt-trace-row {
        display: flex;
        gap: 6px;
        padding: 3px 0;
        border-bottom: 1px solid #e9eef3;
        color: #315f86;
        font-size: 10px;
        line-height: 1.4;
      }
      .xxt-trace-row:last-child { border-bottom: 0; }
      .xxt-trace-time { flex: 0 0 auto; color: #718096; }
      .xxt-trace-message { min-width: 0; overflow-wrap: anywhere; }
      .xxt-trace-warn { color: #9a5700; }
      .xxt-trace-error { color: #b42318; }
      .xxt-chat-log {
        height: 244px;
        overflow-y: auto;
        padding: 7px;
        border: 1px solid var(--xxt-line);
        border-radius: 6px;
        background: #f8fafc;
      }
      .xxt-chat-row {
        margin-bottom: 8px;
        color: #334155;
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .xxt-chat-row:last-child { margin-bottom: 0; }
      .xxt-chat-user { color: #1f76ff; }
      .xxt-chat-ai { color: #2f855a; }
      .xxt-chat-controls { display: flex; gap: 5px; margin-top: 8px; }
      .xxt-chat-controls .el-input { min-width: 0; flex: 1 1 auto; }
      .xxt-chat-status { margin: 7px 0 0; color: var(--xxt-muted); font-size: 11px; line-height: 1.4; }
      .el-alert {
        border-radius: 6px;
      }
      .el-button {
        min-height: 28px;
        border-radius: 5px;
      }
      .el-button + .el-button {
        margin-left: 4px;
      }
      .el-form-item {
        margin-bottom: 0;
      }
      .el-input--mini .el-input__inner {
        height: 28px;
        line-height: 28px;
      }
      * {
        box-sizing: border-box;
      }
      .drag_auto_answer-class{
        width: 100%;
        min-width: 0;
        height: 100%;
        background-color: rgb(255, 255, 255);
        overflow-x: hidden;
        overflow-y: auto;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
    </style>
</head>
<body>

<div id="app">
    <div id="drag_auto_answer" class="drag_auto_answer-class">
        <div class="xxt-shell">
        <el-main style="min-width: 0;padding: 0; z-index: 99999;">
            <header class="xxt-header">
                <div>
                    <h1 class="xxt-title">学习通助手</h1>
                    <p class="xxt-subtitle">考试端 · 题目处理状态</p>
                </div>
                <div class="xxt-header-actions">
                    <el-button size="mini" @click="activePanel = activePanel === 'chat' ? 'answer' : 'chat'">{{ activePanel === 'chat' ? '答题状态' : 'AI 问答' }}</el-button>
                    <el-button size="mini" type="primary" @click="open_ai_setting()">LLM 设置</el-button>
                </div>
            </header>
            <div v-if="activePanel === 'answer'">
            <el-row class="xxt-section">
                <el-alert
                        class="xxt-alert"
                        style="display: block"
                        :title="tip"
                        :closable="false"
                        type="success">
                    <el-button v-if="need_jump" @click="btnClick(opt.jump,'opt.jump')" size="mini" type="info">跳过本题</el-button>
                    <el-button v-if="!hidden" @click="btnClick(opt.auto_jump,'opt.auto_jump')" size="mini" type="default">{{opt.auto_jump ? '停止自动切换': '开启自动切换'}}</el-button>
                </el-alert>
            </el-row>
            <el-row class="xxt-section" style="display: flex; align-items: center; justify-content: space-between;">
                <el-button v-if="!hidden" @click="btnClick(opt.stop,'opt.stop')" size="mini" type="default">{{!opt.stop ? '暂停答题': '继续答题'}}</el-button>
                <span class="xxt-status" :title="aiStatus">{{ aiStatus }}</span>
            </el-row>
            <section class="xxt-section">
                <p class="xxt-section-title">运行日志</p>
                <div class="xxt-trace" ref="traceLog" role="log" aria-live="polite">
                    <div v-for="(row, index) in traceRows" :key="row.time + '-' + index" class="xxt-trace-row" :class="'xxt-trace-' + row.level">
                        <span class="xxt-trace-time">{{ formatTraceTime(row.time) }}</span>
                        <span class="xxt-trace-message">{{ row.message }}</span>
                    </div>
                </div>
            </section>

            <section class="xxt-section">
                <p class="xxt-section-title">答题记录</p>
            <el-table class="xxt-table" size="mini" :data="tableData" style="width: 100%" :row-class-name="tableRowClassName">
                <el-table-column prop="index" label="题号" width="38"></el-table-column>
                <el-table-column prop="question" label="问题" min-width="80">
                  <template slot-scope="scope">
                        <div style="font-size: 11px;" v-html="scope.row.question"></div>
                  </template>
                </el-table-column>
                <el-table-column prop="answer" label="答案" min-width="90">
                 <template slot-scope="scope">
                     <el-popover
                        v-if="scope.row.style === 'warning-row'"
                        placement="bottom-end"
                        title="未完成原因"
                        width="240"
                        trigger="click">
                        <div style="font-size: 10px;height: 220px; overflow: auto;" v-html="scope.row.answer"></div>
                        <el-button slot="reference" size="small" type="danger">查看原因</el-button>
                     </el-popover>
                     <p v-if="scope.row.style != 'warning-row'" style="font-size: 11px;" v-html="scope.row.answer"></p>
                  </template>
                </el-table-column>
            </el-table>
            </section>
            </div>
            <section v-else class="xxt-section">
                <p class="xxt-section-title">AI 问答</p>
                <div class="xxt-chat-log" ref="chatLog" role="log" aria-live="polite">
                    <div v-if="!chatRows.length" class="xxt-chat-row">输入问题后发送，回答将使用当前 LLM 设置。</div>
                    <div v-for="(row, index) in chatRows" :key="index" class="xxt-chat-row" :class="row.role === 'user' ? 'xxt-chat-user' : 'xxt-chat-ai'">
                        <strong>{{ row.role === 'user' ? '我' : 'AI' }}：</strong>{{ row.text }}
                    </div>
                </div>
                <div class="xxt-chat-controls">
                    <el-input size="mini" v-model="chatInput" :disabled="chatBusy" placeholder="输入问题后回车发送" @keyup.enter.native="sendChat"></el-input>
                    <el-button size="mini" type="primary" :loading="chatBusy" @click="sendChat">发送</el-button>
                    <el-button size="mini" :disabled="chatBusy || !chatRows.length" @click="clearChat">清空</el-button>
                </div>
                <p class="xxt-chat-status">{{ chatStatus }}</p>
            </section>
        </el-main>
        </div>
    </div>
</div>
</body>
<script>__XXT_VUE_JS__</script>
<script>__XXT_ELEMENT_JS__</script>
<script>
const XXT_NONCE = '__XXT_NONCE__';
function __xxtPost(msg, target) {
    try { if (msg && typeof msg === "object") { msg.nonce = XXT_NONCE; } } catch (e) {}
    window.parent.postMessage(msg, target || "*");
}
const tips = [
    '想要隐藏此面板，按键盘的⬆箭头，想要显示按⬇箭头',
    '想要永久隐藏此面板，按键盘的左箭头，想要显示在屏幕中央按右箭头',
]
    new Vue({
        el: '#app',
        data: function () {
            return {
                aiStatus: __XXT_AI_STATUS__,
                hidden: false,
                need_jump: false,
                tip: tips[Math.floor(Math.random()*tips.length)],
                opt:{
                    auto_jump: __XXT_AUTO_JUMP__,
                    stop: false
                },
                input: '',
                visible: false,
                tableData: [],
                traceRows: [],
                activePanel: 'answer',
                chatInput: '',
                chatRows: [],
                chatHistory: [],
                chatBusy: false,
                chatStatus: '使用当前 LLM 设置进行问答',
                passw:"password"
            }
        },
        created(){
            /**
            * 
            * @param type 消息类型
            * @param receiveParams 消息参数
            */
            window['vueDefinedProp'] = (type,receiveParams) => {
                if (type === 'push'){
                    let length = this.tableData.length
                    this.tableData.push({index: length + 1,question: receiveParams.question,answer: receiveParams.answer,style:receiveParams.style})
                }else if (type === 'clear'){
                    this.tableData = []
                }else if (type === 'tip'){
                    if (receiveParams.type && receiveParams.type === 'jump'){
                         __xxtPost({"type": 'jump'}, '*');
                    }else if (receiveParams.type && receiveParams.type === 'error'){
                         this.need_jump = true
                    }else if (receiveParams.type && receiveParams.type === 'hidden'){
                         this.hidden = true
                    }else if (receiveParams.type && receiveParams.type === 'active'){
                         this.hidden = false
                    }else if (receiveParams.type && receiveParams.type === 'stop'){
                         this.opt.stop = true
                    }
                    this.tip = receiveParams.tip
                }else if (type === 'stop'){
                    this.opt.stop = receiveParams
                }else if (type === 'ai_status'){
                    this.aiStatus = receiveParams
                }else if (type === 'trace' && receiveParams && receiveParams.message){
                    if (this.traceRows.some(row => row.time === receiveParams.time && row.message === receiveParams.message && row.level === receiveParams.level)) return;
                    this.traceRows.push({ time: receiveParams.time, level: receiveParams.level, message: receiveParams.message });
                    if (this.traceRows.length > 30) this.traceRows.splice(0, this.traceRows.length - 30);
                    this.$nextTick(() => { if (this.$refs.traceLog) this.$refs.traceLog.scrollTop = this.$refs.traceLog.scrollHeight; });
                }else if (type === 'chat_result'){
                    this.chatBusy = false;
                    if (receiveParams && receiveParams.ok) {
                        this.chatRows.push({ role: 'assistant', text: receiveParams.text || '' });
                        this.chatHistory.push({ role: 'assistant', content: receiveParams.text || '' });
                        if (this.chatHistory.length > 12) this.chatHistory = this.chatHistory.slice(-12);
                        this.chatStatus = '完成';
                        this.$nextTick(() => { if (this.$refs.chatLog) this.$refs.chatLog.scrollTop = this.$refs.chatLog.scrollHeight; });
                    } else {
                        this.chatStatus = (receiveParams && receiveParams.msg) || '请求失败';
                    }
                }
            }
        },
        mounted(){
            __xxtPost({type: 'trace_ready'}, '*');
        },
        methods: {
            formatTraceTime(value){
                const date = new Date(value);
                return [date.getHours(), date.getMinutes(), date.getSeconds()].map(part => String(part).padStart(2, '0')).join(':');
            },
            open_ai_setting(){
                 __xxtPost({type: 'open_ai_setting'}, '*');
            },
            sendChat(){
                const question = String(this.chatInput || '').trim();
                if (!question || this.chatBusy) return;
                this.chatBusy = true;
                this.chatInput = '';
                this.chatRows.push({ role: 'user', text: question });
                this.chatHistory.push({ role: 'user', content: question });
                if (this.chatHistory.length > 12) this.chatHistory = this.chatHistory.slice(-12);
                this.chatStatus = 'AI 正在思考…';
                this.$nextTick(() => { if (this.$refs.chatLog) this.$refs.chatLog.scrollTop = this.$refs.chatLog.scrollHeight; });
                __xxtPost({type: 'chat_send', messages: this.chatHistory.slice(-12)}, '*');
            },
            clearChat(){
                if (this.chatBusy) return;
                this.chatRows = [];
                this.chatHistory = [];
                this.chatStatus = '对话已清空';
            },
        
            tableRowClassName({row, rowIndex}) {
                return row.style
            },
            btnClick(e,type){
                if (type === 'opt.stop'){//暂停答题
                    this.opt.stop = !this.opt.stop
                    this.tip = this.opt.stop? '已暂停答题': '继续答题'
                    __xxtPost({type: 'stop',val:this.opt.stop}, '*');
                }else if (type === 'opt.auto_jump'){//开启自动切换
                    this.opt.auto_jump = ! this.opt.auto_jump
                    __xxtPost({type: 'auto_jump',flag:this.opt.auto_jump}, '*');
                }else if (type === 'opt.jump'){//跳过本题
                    __xxtPost({type: 'jump'}, '*');
                    this.need_jump = false
                }
            }
        }
    })
</script>
</html>
`;

    var PAGE_HTML = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>学习通小助手V1.2</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
        <style>
__XXT_TOKENS__
            html, body {
                min-height: 100%;
                background: #eef2f6;
                color: var(--xxt-ink);
            }
            body {
                font-family: "Microsoft YaHei", Arial, sans-serif;
            }
            .xxt-page {
                max-width: 1180px;
                margin: 0 auto;
                padding: 14px 16px 32px;
            }
            .xxt-page > .col-md-6 {
                float: none;
                width: 100%;
                margin: 0;
                padding: 0;
            }
            /* 标题并进「任务配置」的标题行，不再单独占一张卡片，首屏多出一整块空间。 */
            .xxt-page #normalQuery > .panel-heading {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .xxt-page .xxt-page-title {
                margin: 0;
                color: var(--xxt-ink)!important;
                font-size: 15px;
                font-weight: 700;
                line-height: 1.2;
            }
            .xxt-page #normalQuery #onlineNum {
                color: var(--xxt-muted);
                font-size: 12px;
            }
            .xxt-page #normalQuery > .panel-heading .xxt-section-tip {
                margin-left: auto;
                color: #8b98a8;
                font-size: 11px;
                font-weight: 400;
            }
            .xxt-page .panel {
                margin-bottom: 10px;
                border: 1px solid var(--xxt-line);
                border-radius: 9px;
                background: var(--xxt-surface);
                box-shadow: 0 1px 6px rgba(31,45,61,.045);
                overflow: hidden;
            }
            .xxt-page .panel-heading {
                padding: 10px 13px;
                border-bottom: 1px solid var(--xxt-line);
                background: var(--xxt-soft);
                color: #526273;
                font-size: 13px;
                font-weight: 700;
            }
            .xxt-page .panel-body {
                padding: 12px 13px;
            }
            .xxt-page #normalQuery .panel-body {
                line-height: 1.5;
            }
            /* 三组配置并排：宽屏一行三列（视频倍速 / 章节测试 / LLM 配置），
               窗口变窄时自动折行，不再是三层纵向排布。 */
            .xxt-page #normalQuery .xxt-config-grid {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0 18px;
            }
            .xxt-page #normalQuery .xxt-config-row {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 4px;
                min-height: 32px;
                margin: 0;
            }
            /* 并排后按钮和分隔符都要收紧，1366px 宽才能把三组挤进同一行。 */
            .xxt-page #normalQuery .xxt-config-grid .xxt-config-controls a.btn {
                padding: 4px 7px;
            }
            .xxt-page #normalQuery .xxt-config-grid .xxt-config-separator {
                margin: 0;
            }
            .xxt-page #normalQuery .xxt-config-label {
                flex: 0 0 auto;
                margin-right: 3px;
                color: #526273;
                font-size: 12px!important;
                font-weight: 600;
            }
            .xxt-page #normalQuery .xxt-config-row > .xxt-config-controls {
                display: contents;
            }
            .xxt-page #normalQuery .panel-body a.btn,
            .xxt-page #normalQuery .panel-body input {
                margin: 0;
            }
            .xxt-page #normalQuery .panel-body input {
                height: 30px;
                padding: 5px 8px;
            }
            .xxt-page #normalQuery .panel-body a.btn {
                padding: 5px 10px;
            }
            .xxt-page #normalQuery .xxt-config-separator {
                color: #a7b3c0;
                margin: 0 2px;
            }
            .xxt-page #normalQuery .xxt-config-note {
                color: #718096;
                font-size: 12px;
            }
            .xxt-page #normalQuery .xxt-config-help {
                margin: 2px 0 0;
                color: #718096!important;
                font-size: 11px!important;
            }
            .xxt-page .btn {
                border-radius: 5px;
                border-color: #d7e1eb;
                box-shadow: none;
                font-size: 12px;
            }
            .xxt-page .btn-success,
            .xxt-page .btn-primary {
                border-color: var(--xxt-accent);
                background: var(--xxt-accent);
            }
            .xxt-page #result {
                flex: 1 1 auto;
                min-height: 0;
                display: flex;
                flex-direction: column;
                border-color: var(--xxt-line)!important;
                border-radius: 6px!important;
                background: #f8fafc!important;
                color: #526273;
            }
            .xxt-page #unrivalRate {
                border: 1px solid #d7e1eb;
                border-radius: 5px;
                padding: 6px 8px;
                color: var(--xxt-ink);
            }
            .xxt-page #courseContent,
            .xxt-page #videoTimeContent,
            .xxt-page #frame_content {
                display: block;
                border: 1px solid var(--xxt-line)!important;
                border-radius: 6px;
                background: #f8fafc;
            }
            .xxt-page #courseContent {
                width: 100%;
                height: min(52vh, 620px);
                min-height: 400px;
            }
            .xxt-page #frame_content {
                height: min(52vh, 620px);
                min-height: 400px;
            }
            /* 电脑端一屏可见：左边课程内容（视频/阅读/章节测试共用一张卡片），
               右边运行日志，LLM 配置在下方独立成块，不再藏在标签页里。
               两列卡片等高：网格拉伸 + 卡片内部纵向弹性，日志区自动填满剩余高度。 */
            .xxt-page .xxt-grid {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 380px;
                gap: 10px;
                align-items: stretch;
            }
            .xxt-page .xxt-grid > .xxt-col {
                min-width: 0;
                display: grid;
                grid-auto-rows: 1fr;
                gap: 10px;
            }
            .xxt-page .xxt-grid .xxt-section {
                display: flex;
                flex-direction: column;
                min-height: 0;
                margin-bottom: 0;
            }
            .xxt-page .xxt-grid .xxt-section > .panel-body {
                flex: 1 1 auto;
                min-height: 0;
                display: flex;
                flex-direction: column;
            }
            .xxt-page .xxt-grid .xxt-stage {
                flex: 1 1 auto;
                min-height: 0;
            }
            .xxt-page .xxt-section {
                margin-bottom: 10px;
            }
            .xxt-page .xxt-section > .panel-heading {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            .xxt-page .xxt-section > .panel-heading .xxt-section-tip {
                color: #8b98a8;
                font-size: 11px;
                font-weight: 400;
            }
            /* 课程卡片内同一时刻只显示一个舞台：课程内容（视频/阅读）或章节测试答题页。 */
            .xxt-page .xxt-stage-view {
                display: none;
            }
            .xxt-page #courseSection[data-mode="course"] #courseView,
            .xxt-page #courseSection[data-mode="work"] #workView {
                display: block;
            }
            .xxt-page #courseSection .xxt-tip-work {
                display: none;
            }
            .xxt-page #courseSection[data-mode="work"] .xxt-tip-course {
                display: none;
            }
            .xxt-page #courseSection[data-mode="work"] .xxt-tip-work {
                display: inline;
            }
            .xxt-page #courseSection[data-mode="work"] > .panel-heading > span:first-child::after {
                content: " · 作答中";
                color: var(--xxt-accent);
                font-size: 11px;
            }
            .xxt-page #log {
                flex: 1 1 auto;
                min-height: 120px;
                height: min(46vh, 420px);
                overflow: auto;
                padding-right: 4px;
                line-height: 1.8!important;
                font-size: 12px;
                overflow-wrap: anywhere;
            }
            .xxt-page #aiStatus {
                margin: 0;
                font-size: 12px;
                color: #718096;
                overflow-wrap: anywhere;
            }
            .xxt-page .xxt-risk-bar {
                margin-top: 8px;
                padding: 8px;
                border: 1px solid #f0b4b4;
                border-radius: 6px;
                background: #fff5f5;
            }
            .xxt-page .xxt-risk-head {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #a12a2a;
            }
            .xxt-page .xxt-risk-head .xxt-risk-text {
                flex: 1 1 240px;
                min-width: 0;
                overflow-wrap: anywhere;
            }
            .xxt-page .xxt-llm-panel {
                width: 100%;
                min-width: 0;
                padding-top: 8px;
                border-top: 1px solid var(--xxt-line);
            }
            .xxt-page #llmSettingsContainer {
                width: 100%;
                min-width: 0;
            }
            .xxt-page #llmSettingsContainer iframe {
                display: block;
                width: 100%;
                height: 640px;
                min-height: 420px;
                border: 0;
                background: #f3f6f9;
            }
            .xxt-page .xxt-llm-placeholder {
                margin: 0;
                padding: 6px 2px;
                color: #718096;
                font-size: 12px;
            }
            .xxt-page #normalQuery .panel-body {
                display: grid;
                gap: 8px;
            }
            @media (max-width: 900px) {
                .xxt-page .xxt-grid {
                    grid-template-columns: minmax(0, 1fr);
                }
                /* 单列时不需要再拉平两行高度，否则课程卡片会被撑到和日志一样高。 */
                .xxt-page .xxt-grid > .xxt-col {
                    grid-auto-rows: auto;
                }
                .xxt-page .xxt-grid .xxt-section {
                    display: block;
                }
                .xxt-page .xxt-grid .xxt-section > .panel-body {
                    display: block;
                }
                .xxt-page .xxt-grid .xxt-stage {
                    min-height: 0;
                }
                .xxt-page #result,
                .xxt-page #log {
                    display: block;
                    flex: none;
                }
                .xxt-page #log {
                    height: 260px;
                }
            }
            @media (max-width: 600px) {
                .xxt-page { padding: 8px 6px 18px; }
                .xxt-page #llmSettingsContainer iframe { height: 1100px; }
                .xxt-page #courseContent,
                .xxt-page #frame_content { height: 420px; min-height: 320px; }
                .xxt-page .xxt-page-title { font-size: 14px; }
                .xxt-page #normalQuery .xxt-config-row { min-height: 0; }
                /* 窄屏换行后行尾会留下孤零零的竖线分隔符，看着像渲染错位。 */
                .xxt-page #normalQuery .xxt-config-separator { display: none; }
                .xxt-page #normalQuery .xxt-config-note { display: block; width: 100%; }
            }
        </style>
    </head>
    <body>
        <div class="xxt-page row" style="margin: 0 auto;">
            <div class="col-md-6 col-md-offset-3">
                <div class="panel panel-default" id="normalQuery">
                    <div class="panel-heading">
                        <h3 class="xxt-page-title">学习通助手</h3>
                        <div id="onlineNum"></div>
                        <span class="xxt-section-tip">任务配置</span>
                    </div>
                    <div class="panel-body">
                        <div class="xxt-config-grid">
                            <div class="xxt-config-row">
                            <div class="xxt-config-label">视频倍速：</div>
                            <div class="xxt-config-controls">
                                <input type="number" id="unrivalRate" style="width: 80px;">
                                &ensp;
                                <a id='updateRateButton' class="btn btn-default">保存</a>
                                <span class="xxt-config-separator">|</span>
                                <a id='reviewModeButton' class="btn btn-default">复习模式</a>
                                <span class="xxt-config-separator">|</span>
                                <a id='videoTimeButton' class="btn btn-default">查看学习进度</a>
                                <span class="xxt-config-separator">|</span>
                                <a id='previewPlayButton' class="btn btn-default">预览同步播放</a>
                            </div>
                            </div>
                            <div class="xxt-config-row">
                            <div class="xxt-config-label">章节测试：</div>
                            <div class="xxt-config-controls">
                            <a id='autoDoWorkButton' class="btn btn-default">自动答题</a>
                            <span class="xxt-config-separator">|</span>
                            <a id='autoSubmitButton' class="btn btn-default">自动提交</a>
                            <span class="xxt-config-separator">|</span>
                            <a id='autoSaveButton' class="btn btn-default">自动保存</a>
                            <span class="xxt-config-separator">|</span>
                            <a id='recognitionCheckButton' class="btn btn-default">识别诊断</a>
                            </div>
                            </div>
                            <div class="xxt-config-row">
                            <div class="xxt-config-label">LLM 配置：</div>
                            <div class="xxt-config-controls">
                            <a id='llmToggleButton' class="btn btn-default" role="button" aria-expanded="false"
                                aria-controls="llmPanel">展开设置</a>
                            <span class="xxt-config-separator xxt-config-separator-llm">|</span>
                            <span class="xxt-config-note" id='aiStatus'>当前：__XXT_AI_STATUS_TEXT__</span>
                            </div>
                            </div>
                        </div>
                        <p class="xxt-config-help">自用即可，视频倍速尽量1倍速（速度过快容易清进度）</p>
                        <div class="xxt-llm-panel" id="llmPanel" style="display: none;">
                            <div id="llmSettingsContainer"><p class="xxt-llm-placeholder">正在加载 LLM 配置…</p></div>
                        </div>
                    </div>
                </div>
                <div class="xxt-grid">
                    <div class="xxt-col">
                        <div class="panel panel-default xxt-section" data-pane="course" id="courseSection"
                            data-mode="course">
                            <div class="panel-heading">
                                <span>课程内容 / 章节测试</span>
                                <span class="xxt-section-tip" id="courseStateTip">
                                    <span class="xxt-tip-course">视频与阅读任务在本区域自动播放</span>
                                    <span class="xxt-tip-work" id="workStateTip">暂无进行中的章节测试</span>
                                </span>
                            </div>
                            <div class="panel-body">
                                <div class="xxt-stage">
                                    <div class="xxt-stage-view" id="courseView">
                                        <iframe id="courseContent" src="" frameborder="0" scrolling="auto"
                                            title="课程视频和题目内容"></iframe>
                                        <div id='videoTime' style="display: none;height: 300px;margin-top: 10px;">
                                            <div class="panel panel-default" style="margin: 0;">
                                                <div class="panel-heading">学习进度</div>
                                                <div class="panel-body" style="height: 260px;">
                                                    <iframe id="videoTimeContent" src="" frameborder="0" scrolling="auto"
                                                        style="width: 100%;height: 100%;"></iframe>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="xxt-stage-view" id="workView">
                                        <div id="workEmpty" style="color: #888; font-size: 12px; padding: 6px 0;">当前不是章节测试，进入答题时会自动切换到本区域</div>
                                        <div id="workPanel" style="display: none;">
                                            <iframe id="frame_content" name="frame_content" src="" frameborder="0" scrolling="auto"
                                                style="width: 100%;"></iframe>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="xxt-col">
                        <div class="panel panel-default xxt-section" data-pane="log">
                            <div class="panel-heading">
                                <span>运行日志</span>
                                <span class="xxt-section-tip">最近 240 条，自动滚动</span>
                            </div>
                            <div class="panel-body">
                                <div class="xxt-risk-bar" id="riskControlBar" style="display: none;">
                                    <div class="xxt-risk-head">
                                        <span class="xxt-risk-text" id="riskControlText">平台要求输入验证码，学习任务已暂停</span>
                                        <a class="btn btn-default btn-xs" id="riskControlVerifyButton" href="#"
                                            target="_blank" rel="noopener">去验证</a>
                                        <a class="btn btn-success btn-xs" id="riskControlResumeButton">已验证，继续</a>
                                    </div>
                                </div>
                                <div id="result">
                                    <div id="log">
                                        <span data-xxt-log-placeholder style="color: red">[00:00:00]如果此提示不消失，说明页面出现了错误，请联系作者</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    </body>

</html>
`;

    var SETTINGS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;padding:14px;font:12px/1.55 "Microsoft YaHei",Arial,sans-serif;color:#263445;background:#f3f6f9;height:100%;overflow-y:auto}
h3{margin:0 0 12px;padding:12px 14px;border:1px solid #e4eaf0;border-radius:8px;background:#fff;color:#263445;font-size:15px;box-shadow:0 2px 8px rgba(31,45,61,.05)}
.settings-shell{display:grid;gap:9px}
.settings-card{padding:11px 12px;border:1px solid #e4eaf0;border-radius:8px;background:#fff;box-shadow:0 1px 5px rgba(31,45,61,.04)}
.sec{margin:0 0 9px;color:#526273;font-size:12px;font-weight:700;letter-spacing:.02em}
.row{margin-bottom:8px;display:flex;align-items:flex-start}
.row:last-child{margin-bottom:0}
.row>label{width:88px;flex:none;color:#617184;padding-top:5px;font-size:12px}
.row .ctl{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.row input,.row select,.row textarea{flex:1;min-width:0;padding:6px 8px;border:1px solid #dbe3eb;border-radius:5px;font-size:12px;font-family:inherit;background:#fff;color:#263445;outline:none;transition:border-color .15s,box-shadow .15s}
.row input:focus,.row select:focus,.row textarea:focus{border-color:#409eff;box-shadow:0 0 0 2px rgba(64,158,255,.12)}
.row textarea{resize:vertical;min-height:54px}
.hint{color:#5b8def;font-size:11px;cursor:pointer;flex:0 1 auto;min-width:0;overflow-wrap:anywhere;padding-top:5px}
.hint:hover{color:#2f6fd1}
.btns{display:flex;gap:7px;padding:8px 0;position:sticky;bottom:0;background:linear-gradient(180deg,rgba(243,246,249,0),#f3f6f9 22%);}
button{padding:6px 12px;border:1px solid #dbe3eb;background:#fff;border-radius:5px;color:#526273;cursor:pointer;font-size:12px;transition:border-color .15s,background .15s}
button.primary{background:#3b82f6;border-color:#3b82f6;color:#fff}
button:hover{border-color:#93b9f5;background:#f7fbff}button.primary:hover{background:#286fd9}
#status{margin-top:8px;padding:8px 10px;border:1px solid #e4eaf0;border-radius:6px;font-size:12px;background:#fff;color:#617184;white-space:pre-wrap;word-break:break-all;min-height:34px}
#status.ok{border-color:#ccebd6;background:#f3fbf5;color:#317a4a}
#status.err{border-color:#f5d2d2;background:#fff6f6;color:#c44545}
@media(max-width:560px){.row>label{width:72px}.row .ctl input[type="number"]{flex:1 1 100px}.row .ctl #model{flex:1 1 100%}.row .ctl #fetchModels{margin-left:auto}}
</style></head><body>
<h3>LLM 设置（第三方模型辅助）</h3>
<div class="settings-shell">
<div class="settings-card">
<div class="sec">连接与模型</div>
<div class="row"><label>AI 答题</label><div class="ctl"><select id="mode"><option value="off">关闭（只做视频/文档任务）</option><option value="first">开启 AI 直连答题</option></select></div></div>
<div class="row"><label>预设</label><div class="ctl"><select id="preset"></select></div></div>
<div class="row"><label>接口地址</label><div class="ctl"><input id="url" placeholder="https://api.deepseek.com"></div></div>
<div class="row"><label>API Key</label><div class="ctl"><input id="key" type="password" placeholder="sk-..."><span class="hint" id="showKey">显示</span></div></div>
<div class="row"><label>获取密钥</label><div class="ctl"><a href="https://nuoapi.net/register" target="_blank" rel="noopener" style="color:#3b82f6;font-size:12px;line-height:1.6;">获取 NuoAPI 密钥</a><span class="hint" style="cursor:default;color:#8a97a6;">注册即送 $1 额度（以官网当前活动为准）；国模福利分组 1 元通常可完成 5000+ 道题，普通 GPT 低价分组约 500+ 道题；也可用「自定义」接别家</span></div></div>
<div class="row"><label>模型</label><div class="ctl"><select id="model"><option value="">请先获取模型列表</option></select><button id="fetchModels" type="button">获取模型列表</button><span class="hint" style="cursor:default;color:#8a97a6;line-height:1.6;">NuoAPI 注册即送 $1（以官网当前活动为准）。模型列表中如存在「国模福利分组」，任何用户均可选择其中的 <code>deepseek-v4.1-flash</code>，适合高频答题；按当前价格，1 元通常可完成 5000+ 道题。普通 GPT 低价分组约 500+ 道题；实际价格、可用模型和额度以账户后台为准。</span></div></div>
<div class="row"><label>跳过已作答</label><div class="ctl"><label style="font-size:12px;color:#526273;"><input type="checkbox" id="skip_answered" style="width:auto;margin-right:6px;vertical-align:middle;">已作答题目不覆盖</label></div></div>
<div class="row"><label>超时 / 温度</label><div class="ctl"><input id="timeout" type="number" min="3000" step="1000" placeholder="超时 22000ms"><input id="temperature" type="number" min="0" max="2" step="0.1" placeholder="温度 0.2"><input id="max_tokens" type="number" min="1" step="64" placeholder="max_tokens 1024"></div></div>
<div class="row"><label>失败重试</label><div class="ctl"><input id="retries" type="number" min="0" max="5" step="1" placeholder="重试次数 2"><span class="hint" style="cursor:default;color:#8a97a6;">遇到 429/5xx/超时自动重试，0 表示不重试</span></div></div>
<div class="row"><label>单题上限</label><div class="ctl"><span class="hint" style="cursor:default;color:#8a97a6;">默认：连接超时 5s、单次响应超时 22s、失败重试 2 次（间隔 0.8～1.5s）、单题总等待 45s，超时即跳过。并发固定建议 2，接口不稳时不要调高。</span><button id="resetLimits" type="button">恢复默认</button></div></div>
<div class="row"><label>并发上限</label><div class="ctl"><input id="concurrency" type="number" min="1" max="6" step="1" placeholder="并发 2"><span class="hint" style="cursor:default;color:#8a97a6;">同时进行的 AI 请求数，1 最稳，调高更容易触发上游 502/429</span></div></div>
</div>
<div class="settings-card">
<div class="sec">提示词</div>
<div class="row"><label>系统提示词</label><div class="ctl"><textarea id="system_prompt" rows="3" placeholder="留空使用默认"></textarea></div></div>
<div class="row"><label>用户提示词</label><div class="ctl"><textarea id="user_prompt" rows="4" placeholder="留空使用默认模板"></textarea></div></div>
<div class="row"><label>缓存优化</label><div class="ctl" style="font-size:12px;color:#718096;line-height:1.6;">固定说明文字会自动前置，题目等变动内容自动后置。</div></div>
</div>
<div class="settings-card">
<div class="sec">高级配置</div>
<div class="row"><label>额外请求头</label><div class="ctl"><textarea id="headers_json" rows="2" placeholder="例如 {&quot;x-api-version&quot;:&quot;2024-01-01&quot;}"></textarea></div></div>
<div class="row"><label>额外请求体</label><div class="ctl"><textarea id="body_json" rows="2" placeholder="例如 {&quot;top_p&quot;:0.9}"></textarea></div></div>
<div class="row"><label>响应字段路径</label><div class="ctl"><input id="response_path" placeholder="choices.0.message.content"></div></div>
</div>
<div class="settings-card">
<div class="sec">配置备份</div>
<div class="row"><label>导出 / 导入</label><div class="ctl"><button id="exportCfg" type="button">导出配置</button><button id="importCfg" type="button">导入配置</button><span class="hint" style="cursor:default;color:#8a97a6;">用于换浏览器、换设备或跨版本迁移</span></div></div>
<div class="row"><label>配置文本</label><div class="ctl"><textarea id="cfgText" rows="3" placeholder="点“导出配置”把当前设置写到这里；粘贴别人的配置后点“导入配置”"></textarea></div></div>
</div>
</div>
<div class="btns"><button class="primary" id="save">保存</button><button id="test">测试连接</button><button id="resetStats">重置统计</button><button id="close">返回运行日志</button></div>
<div id="status">修改后点“保存”立即生效，无需刷新页面。</div>
<div id="stats" style="margin-top:8px;padding:0 2px;font-size:12px;color:#718096;line-height:1.6;white-space:pre-wrap;">AI 调用统计加载中…</div>
<script>
var AI_NONCE="__AI_NONCE__";
var PRESETS=[{n:"自定义",u:"",m:""},{n:"DeepSeek",u:"https://api.deepseek.com",m:"deepseek-flash"},{n:"Ollama本地",u:"http://localhost:11434/v1",m:"qwen2.5:7b"},{n:"NuoAPI",u:"https://nuoapi.net/v1",m:"gpt-5.6-luna"},{n:"Higan API",u:"https://api.higanai.top/v1",m:""}];
var MODELS=["deepseek-flash","deepseek-v4-pro","qwen2.5:7b","gpt-5.6-luna"];
function $(id){return document.getElementById(id);}
function aiShowStatus(msg,type){var s=$("status");if(!s)return;s.textContent=msg;s.className=type||"";}
function aiShowStats(s){var el=$("stats");if(el)el.textContent=s||"AI 调用统计加载中…";}
function aiSetModelOptions(models,selected){var s=$("model");if(!s)return;var list=[];for(var i=0;i<(models||[]).length;i++){var m=String(models[i]||"").trim();if(m&&list.indexOf(m)<0)list.push(m);}if(selected&&list.indexOf(selected)<0)list.unshift(selected);s.innerHTML="";if(!list.length){var empty=document.createElement("option");empty.value="";empty.textContent="请先获取模型列表";s.appendChild(empty);return;}for(var j=0;j<list.length;j++){var o=document.createElement("option");o.value=list[j];o.textContent=list[j];s.appendChild(o);}s.value=selected&&list.indexOf(selected)>=0?selected:list[0];}
function aiSetValues(v){v=v||{};$("mode").value=v.mode==="off"?"off":"first";$("url").value=v.url||"";$("key").value=v.key||"";aiSetModelOptions(MODELS,v.model||"");$("timeout").value=v.timeout||22000;$("retries").value=v.retries==null?2:v.retries;$("concurrency").value=v.concurrency==null?2:v.concurrency;$("temperature").value=v.temperature==null?"0.2":v.temperature;$("max_tokens").value=v.max_tokens||1024;$("system_prompt").value=v.system_prompt||"";$("user_prompt").value=v.user_prompt||"";$("headers_json").value=v.headers_json||"";$("body_json").value=v.body_json||"";$("response_path").value=v.response_path||"";$("skip_answered").checked=!!v.skip_answered;aiShowStatus("当前："+(v.mode==="off"?"已关闭AI":"AI直连"),"");}
function aiReadValues(){return{mode:$("mode").value,url:$("url").value.trim(),key:$("key").value.trim(),model:$("model").value.trim(),timeout:$("timeout").value,retries:$("retries").value,concurrency:$("concurrency").value,temperature:$("temperature").value,max_tokens:$("max_tokens").value,system_prompt:$("system_prompt").value,user_prompt:$("user_prompt").value,headers_json:$("headers_json").value,body_json:$("body_json").value,response_path:$("response_path").value,skip_answered:$("skip_answered").checked?1:0};}
function aiReply(r){r=r||{};if(r.models){aiSetModelOptions(r.models,$("model").value);}$("fetchModels").disabled=!!r.pending;if(r.pending){aiShowStatus(r.msg||"处理中…","");return;}if(r.exported!=null){var ta=$("cfgText");if(ta)ta.value=String(r.exported||"");if(r.ok){if(r.values){aiSetValues(r.values);}aiShowStatus(r.msg||"成功","ok");}else{aiShowStatus(r.msg||"失败","err");}return;}if(r.ok){if(r.values){aiSetValues(r.values);}aiShowStatus(r.msg||"成功","ok");}else{aiShowStatus(r.msg||"失败","err");}}
function aiPost(data){data.__xxtAiSetting=true;data.nonce=AI_NONCE;window.parent.postMessage(data,"*");}
var ps=$("preset");for(var i=0;i<PRESETS.length;i++){var op=document.createElement("option");op.textContent=PRESETS[i].n;op.value=i;ps.appendChild(op);}
ps.onchange=function(){var p=PRESETS[this.value];if(p&&p.u){$("url").value=p.u;$("model").value=p.m;aiShowStatus("已填入预设："+p.n+"，请确认后再点测试/保存。","");}};
aiSetModelOptions(MODELS,"");
$("save").onclick=function(){aiShowStatus("保存中…","");aiPost({type:"save",data:aiReadValues()});};
$("test").onclick=function(){aiShowStatus("正在请求模型，请稍候…","");aiPost({type:"test",data:aiReadValues()});};
$("fetchModels").onclick=function(){aiShowStatus("正在获取模型列表，请稍候…","");aiPost({type:"models",data:aiReadValues()});};
$("close").onclick=function(){aiPost({type:"close"});};
$("showKey").onclick=function(){var k=$("key");k.type=k.type==="password"?"text":"password";this.textContent=k.type==="password"?"显示":"隐藏";};
$("resetStats").onclick=function(){aiPost({type:"reset_stats"});};
$("resetLimits").onclick=function(){$("timeout").value=22000;$("retries").value=2;$("concurrency").value=2;aiShowStatus("已填入推荐默认值（超时 22000ms / 重试 2 次 / 并发 2），点“保存”生效。","");};
$("exportCfg").onclick=function(){aiShowStatus("正在读取当前配置…","");aiPost({type:"export_cfg"});};
$("importCfg").onclick=function(){var t=$("cfgText").value;if(!t.replace(/\s+/g,"")){aiShowStatus("配置文本为空：请先粘贴导出内容","err");return;}aiShowStatus("正在导入…","");aiPost({type:"import_cfg",text:t});};
<\/script>
</body></html>`;

    function fill(template, values) {
        var text = String(template);
        Object.keys(values).forEach(function (key) {
            var token = "__XXT_" + key + "__";
            if (text.indexOf(token) < 0) return;
            text = text.split(token).join(values[key] == null ? "" : String(values[key]));
        });
        return text;
    }

    function escapeText(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function panelHtml(options) {
        options = options || {};
        return fill(PANEL_HTML, {
            TOKENS: TOKENS,
            ELEMENT_CSS: options.elementCss,
            VUE_JS: options.vue,
            ELEMENT_JS: options.elementUi,
            NONCE: options.nonce,
            AI_STATUS: JSON.stringify(options.aiStatusText == null ? "" : String(options.aiStatusText)),
            AUTO_JUMP: JSON.stringify(!!options.autoJump)
        });
    }

    function pageHtml(options) {
        options = options || {};
        return fill(PAGE_HTML, {
            TOKENS: TOKENS,
            AI_STATUS_TEXT: escapeText(options.aiStatusText)
        });
    }

    function settingsHtml() {
        return SETTINGS_HTML;
    }

    return {
        tokens: TOKENS,
        panelHtml: panelHtml,
        pageHtml: pageHtml,
        settingsHtml: settingsHtml
    };
})();
// ==================== UI 模块结束 ====================


function aiTrace(message, level, sourceWindow) {
    var severity = level === 'error' || level === 'warn' ? level : 'info';
    var safe = String(message == null ? '' : message)
        .replace(/https?:\/\/\S+/gi, '[URL]')
        .replace(/\bBearer\s+\S+/gi, 'Bearer [hidden]')
        .replace(/\b(authorization|api[_-]?key|token|key)\s*[:=]\s*[^\s,;]+/gi, '$1=[hidden]')
        .replace(/\bsk-[A-Za-z0-9._-]+/g, '[key]')
        .replace(/[\r\n\t]+/g, ' ').slice(0, 240);
    if (!safe) return;
    var entry = { time: Date.now(), level: severity, message: safe };
    try { console[severity]('[XXT trace] ' + safe); } catch (error) {}
    var current = sourceWindow || (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
    while (current) {
        try {
            var parent = current.parent;
            if (parent === current) break;
            void parent.document;
            current = parent;
        } catch (error) {
            break;
        }
    }
    try {
        var history = current.__xxtDebugEvents;
        var pending = current.__xxtDebugQueue;
        if (!Array.isArray(history)) history = current.__xxtDebugEvents = [];
        if (!Array.isArray(pending)) pending = current.__xxtDebugQueue = [];
        history.push(entry);
        pending.push(entry);
        if (history.length > 200) history.splice(0, history.length - 200);
        if (pending.length > 200) pending.splice(0, pending.length - 200);
        aiPanelMessage('trace', entry, sourceWindow);
    } catch (error) {
        console.warn('[XXT trace] 无法写入课程日志队列');
    }
}

function aiChapterSubmitHost(sourceWindow) {
    var current = sourceWindow || (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
    while (current) {
        try {
            var parent = current.parent;
            if (parent === current) break;
            void parent.document;
            current = parent;
        } catch (error) {
            break;
        }
    }
    return current;
}

function aiChapterWorkId(sourceWindow, hint) {
    var id = '';
    try { id = aiChapterSubmitHost(sourceWindow).unrivalActiveWorkId || ''; } catch (error) {}
    if (!id) id = String(hint || '').trim();
    if (!id) {
        try {
            var query = new URLSearchParams(sourceWindow.location.search);
            id = query.get('workId') || query.get('workid') || '';
        } catch (error) {}
    }
    if (!id) {
        try { id = sourceWindow.document.getElementById('workLibraryId').value || ''; } catch (error) {}
    }
    return /^[A-Za-z0-9_-]{1,80}$/.test(String(id).replace(/^work-/, '')) ? String(id).replace(/^work-/, '') : '';
}

// 回收章节共享注册表里的历史令牌。注册表挂在顶层窗口上，而顶层窗口在切章时不会
// 重建：只写不删的话，每切一个章节就会永久留下一份已销毁 iframe 的 document
// （令牌的 root 与 signature 闭包都指向它），顶层窗口活得越久占用越大。
// 回收口径必须保守：题目节点被重渲染并不代表 AI 请求已经结束，pending 只按
// aiChapterPendingRequests 已有的存活上限回收。终态令牌挂在已脱离文档的节点上时
// 它本就已经 isLive() === false，删掉不会改变任何拦截行为。
function aiPruneChapterTokens(requests, now) {
    if (!(requests instanceof Map) || !requests.size) return;
    var time = Number(now) > 0 ? Number(now) : Date.now();
    var expired = [];
    requests.forEach(function (token, id) {
        // 没有令牌对象、也没有任何时间依据的条目是垃圾，直接回收。
        if (!token) { expired.push(id); return; }
        if (token.state === 'pending') {
            // 页面被关掉后令牌没人收尾，超期就不再算在途，也不再阻止提交。
            if (!(time - Number(token.startedAt || 0) <= AI_CHAPTER_PENDING_STALE_MS)) expired.push(id);
            return;
        }
        if (token.root && token.root.isConnected === false) { expired.push(id); return; }
        if (!(time - Number(token.endedAt || token.startedAt || 0) <= AI_CHAPTER_TOKEN_RETENTION_MS)) expired.push(id);
    });
    for (var i = 0; i < expired.length; i++) requests.delete(expired[i]);
}

// 顺带把已经空掉的章节条目从注册表里摘掉，并给注册表一个硬上限：
// 一次性刷很多章节的极端场景下，空的 workId 条目本身也会一直堆着。
// 当前章节一律不动：它还要参与「另一页面已完成」的跨页去重，那一步不检查 isLive()。
function aiPruneChapterRegistry(registry, currentWorkId) {
    if (!(registry instanceof Map) || !registry.size) return;
    var now = Date.now();
    registry.forEach(function (requests, workId) {
        if (workId === currentWorkId) return;
        if (!(requests instanceof Map)) { registry.delete(workId); return; }
        aiPruneChapterTokens(requests, now);
        if (!requests.size) registry.delete(workId);
    });
    if (registry.size <= AI_CHAPTER_REGISTRY_MAX) return;
    // Map 保持插入顺序，从最早建立的章节开始清，且绝不清理还有在途请求的章节。
    registry.forEach(function (requests, workId) {
        if (registry.size <= AI_CHAPTER_REGISTRY_MAX || workId === currentWorkId) return;
        var busy = false;
        if (requests instanceof Map) requests.forEach(function (token) { if (token && token.state === 'pending') busy = true; });
        if (!busy) registry.delete(workId);
    });
}

function aiChapterQuestionScope(sourceWindow, hint) {
    var workId = aiChapterWorkId(sourceWindow, hint);
    if (!workId) return null;
    try {
        var host = aiChapterSubmitHost(sourceWindow);
        var submit = host.__xxtChapterSubmit;
        var blocked = aiChapterSubmitBlocking(submit, workId);
        var registry = host.__xxtChapterQuestionRequests;
        if (!(registry instanceof Map)) registry = host.__xxtChapterQuestionRequests = new Map();
        aiPruneChapterRegistry(registry, workId);
        var requests = registry.get(workId);
        if (!requests) {
            requests = new Map();
            registry.set(workId, requests);
        }
        return { host: host, workId: workId, requests: requests, blocked: blocked };
    } catch (error) {
        console.warn('[AI question] 无法读取章节请求协调状态', error);
        return null;
    }
}

function aiChapterQuestionBlocked(sourceWindow, workId) {
    if (!workId) return false;
    try {
        return aiChapterSubmitBlocking(aiChapterSubmitHost(sourceWindow).__xxtChapterSubmit, workId);
    } catch (error) {
        console.warn('[AI question] 无法确认章节提交状态', error);
        return true;
    }
}

function aiClaimChapterSubmit(sourceWindow, hint, source) {
    var host = aiChapterSubmitHost(sourceWindow);
    var workId = aiChapterWorkId(sourceWindow, hint);
    if (!workId) return { claimed: false, reason: 'missing-work-id' };
    try {
        var previous = host.__xxtChapterSubmit;
        if (previous && previous.workId === workId) {
            if (aiChapterSubmitBlocking(previous, workId)) {
                aiTrace('章节 ' + workId + '已有' + previous.source + '提交流程，阻止' + source + '重复提交', 'warn', sourceWindow);
                return { claimed: false, reason: 'already-submitted', source: previous.source };
            }
            aiTrace('章节 ' + workId + '上次提交锁' + (previous.state === 'failed' ? '已被平台拒绝' : '已超时未确认') +
                '，按' + source + '重新尝试提交', 'warn', sourceWindow);
        }
        host.__xxtChapterSubmit = { workId: workId, source: source, state: 'submitting', time: Date.now() };
        aiTrace('章节 ' + workId + '由' + source + '占用提交权', 'info', sourceWindow);
        return { claimed: true, workId: workId };
    } catch (error) {
        aiTrace('无法建立章节提交锁，已阻止自动提交', 'error', sourceWindow);
        return { claimed: false, reason: 'unavailable' };
    }
}

function aiMarkChapterSubmitResult(sourceWindow, hint) {
    var workId = aiChapterWorkId(sourceWindow, hint);
    if (!workId) return false;
    try {
        var host = aiChapterSubmitHost(sourceWindow);
        var previous = host.__xxtChapterSubmit;
        host.__xxtChapterSubmit = { workId: workId, source: previous && previous.workId === workId ? previous.source : 'result-page',
            state: 'result', time: Date.now() };
        return true;
    } catch (error) {
        return false;
    }
}

function aiChapterAlreadyReviewed(sourceWindow, hint) {
    var workId = aiChapterWorkId(sourceWindow, hint);
    if (!workId) return false;
    try {
        var record = aiChapterSubmitHost(sourceWindow).__xxtChapterSubmit;
        return !!(record && record.workId === workId && record.state === 'reviewed');
    } catch (error) {
        return false;
    }
}

function aiObserveChapterAlert(sourceWindow, hint, message) {
    var text = String(message == null ? '' : message);
    if (/已批阅.*不允许重复提交/.test(text)) {
        var workId = aiChapterWorkId(sourceWindow, hint);
        aiTrace('平台确认作业已批阅，停止后续提交步骤', 'warn', sourceWindow);
        if (!workId) return true;
        try {
            var host = aiChapterSubmitHost(sourceWindow);
            host.__xxtChapterSubmit = { workId: workId, source: 'platform', state: 'reviewed', time: Date.now() };
            host.unrivalDoneWorkId = workId;
            host.unrivalWorkDone = true;
        } catch (error) {
            aiTrace('已批阅提示无法回传课程页，请手动检查任务状态', 'warn', sourceWindow);
        }
        return true;
    }
    // 风控（antispider）拦截的提交也必须回退锁：那不是「参数错误」，
    // 用户完成验证后重交一次就能成，锁在 submitting 会让重交永远被自己挡掉。
    if (xxtRiskControlMark(text)) {
        var riskId = aiChapterWorkId(sourceWindow, hint);
        aiTrace('平台要求完成验证码（风控），已回退提交锁，验证后可重新提交', 'warn', sourceWindow);
        if (!riskId) return true;
        try {
            var riskHost = aiChapterSubmitHost(sourceWindow);
            var riskCurrent = riskHost.__xxtChapterSubmit;
            if (riskCurrent && riskCurrent.workId === riskId && riskCurrent.state === 'reviewed') return true;
            riskHost.__xxtChapterSubmit = { workId: riskId, source: 'platform', state: 'failed', time: Date.now(),
                message: '风控验证未完成' };
        } catch (error) {}
        return true;
    }
    if (!AI_CHAPTER_SUBMIT_REJECT.test(text)) return false;
    // 平台拒绝了这次提交（无效的参数 / code-1 / 不能为空…）。这里的锁必须立刻回退成
    // 可重试，否则一次「无效的参数：code-1！」就会把这个章节永久锁在 submitting，
    // 后续所有提交都被「已有提交流程」挡掉，用户只能刷新页面重来。
    var rejectId = aiChapterWorkId(sourceWindow, hint);
    aiTrace('平台拒绝提交（' + text + '），已回退提交锁，可重新尝试', 'warn', sourceWindow);
    if (!rejectId) return true;
    try {
        var rejectHost = aiChapterSubmitHost(sourceWindow);
        var current = rejectHost.__xxtChapterSubmit;
        // 已经拿到「已批阅」结论的章节不能被一次迟到的失败弹窗降级。
        if (current && current.workId === rejectId && current.state === 'reviewed') return true;
        rejectHost.__xxtChapterSubmit = { workId: rejectId, source: 'platform', state: 'failed', time: Date.now(),
            message: text.slice(0, 80) };
    } catch (error) {
        aiTrace('提交失败提示无法回传课程页，请手动检查提交结果', 'warn', sourceWindow);
    }
    return true;
}

// 提交锁的存活上限：平台卡住、被拦截或页面被关掉时没人释放锁，
// 超过这个时间就必须允许重试，否则整个章节永久停在「已提交」状态。
var AI_CHAPTER_SUBMIT_TTL_MS = 60000;
// 提交前等待其他页面在途题目请求的上限，超过就放弃这次自动提交。
var AI_CHAPTER_PENDING_WAIT_MS = 60000;
// 在途请求的存活上限：页面被关掉后令牌没人收尾，超时后不再算 pending。
var AI_CHAPTER_PENDING_STALE_MS = 120000;
// 章节共享注册表的两个回收上限：终态令牌最多留这么久，章节条目数再兜一个硬顶。
// 注册表挂在顶层窗口上，顶层窗口切章时不会重建，不设上限就会一直长。
var AI_CHAPTER_TOKEN_RETENTION_MS = 30 * 60 * 1000;
var AI_CHAPTER_REGISTRY_MAX = 8;
// 平台拒绝提交时的弹窗文案。命中后把提交锁回退成可重试。
// `code-1` 必须带分隔符才算：模型/接口侧的普通 `code1` 不能被误判成提交被拒。
var AI_CHAPTER_SUBMIT_REJECT = /无效的参数|不能为空|参数错误|提交失败|code\s*[-:：]\s*-?1\b/;

function aiChapterSubmitExpired(record) {
    var time = Number(record && record.time);
    if (!isFinite(time) || time <= 0) return false;
    return Date.now() - time > AI_CHAPTER_SUBMIT_TTL_MS;
}

// 该提交锁是否仍然阻止新的提交/作答：
// reviewed/result 表示平台已收卷或已进结果页，永久阻止；
// submitting 只是「有人正在提」，超过 TTL 还没确认就必须允许重试，
// 否则一次卡住或被平台静默丢弃的提交会把这个章节锁死到刷新页面为止。
function aiChapterSubmitBlocking(record, workId) {
    if (!record || record.workId !== workId) return false;
    if (record.state === 'reviewed' || record.state === 'result') return true;
    if (record.state !== 'submitting') return false;
    return !aiChapterSubmitExpired(record);
}

function aiChapterSubmitFailed(sourceWindow, hint) {
    if (!aiChapterWorkId(sourceWindow, hint)) return false;
    try {
        var record = aiChapterSubmitHost(sourceWindow).__xxtChapterSubmit;
        return !!(record && record.workId === aiChapterWorkId(sourceWindow, hint) && record.state === 'failed');
    } catch (error) {
        return false;
    }
}

// 共享注册表里属于该章节、仍在处理中的题目请求数。桌面章节页只核验本页 results，
// 看不到手机章节页还在跑的 AI 请求，提交前必须靠这个计数确认没人还在写答案。
function aiChapterPendingRequests(sourceWindow, workId) {
    if (!workId) return 0;
    try {
        var registry = aiChapterSubmitHost(sourceWindow).__xxtChapterQuestionRequests;
        if (!(registry instanceof Map)) return 0;
        var requests = registry.get(workId);
        if (!(requests instanceof Map)) return 0;
        var now = Date.now();
        var pending = 0;
        requests.forEach(function (token) {
            if (!token || token.state !== 'pending') return;
            if (now - Number(token.startedAt || 0) > AI_CHAPTER_PENDING_STALE_MS) return;
            pending++;
        });
        return pending;
    } catch (error) {
        return 0;
    }
}

// 轮询等待在途请求收尾，返回「是否超时」与剩余 pending 数。
function aiWaitChapterPendingRequests(sourceWindow, workId, budget, onWait) {
    var limit = Number(budget) > 0 ? Number(budget) : AI_CHAPTER_PENDING_WAIT_MS;
    var startedAt = Date.now();
    var deadline = startedAt + limit;
    return new Promise(function (resolve) {
        var check = function () {
            var pending = aiChapterPendingRequests(sourceWindow, workId);
            var waited = Date.now() - startedAt;
            if (!pending) { resolve({ timedOut: false, pending: 0, waited: waited }); return; }
            if (Date.now() >= deadline) { resolve({ timedOut: true, pending: pending, waited: waited }); return; }
            if (typeof onWait === 'function') {
                try { onWait(pending, deadline - Date.now(), waited); } catch (error) {}
            }
            setTimeout(check, 500);
        };
        check();
    });
}

var GLOBAL = {
    //启动延迟，页面初始化完毕后再开始处理题目(防止页面未初始化完成,如果页面加载比较慢,可以调高该值)
    delay: 2e3,
    //填充答案的延迟，不建议小于0.5秒，默认0.5s
    fillAnswerDelay: 500,
    //逐题处理间隔，单位秒。低于 10 秒时代码会抬到 12 秒，见 GLOBAL.questionInterval
    questionInterval: 12,
    //逐题随机浮动上限，单位秒。每题在 questionInterval 之上再随机多等 0~该值，避免节奏精确到秒
    answerJitter: 4,
    //保存/提交随机浮动上限，单位秒。发起保存或提交前在固定基数上再随机多等 0~该值
    saveJitter: 3,
    //答题面板 iframe 的高度，单位px可以适当调整。屏幕装不下时按视口自动收缩，不会超出可视区。
    length: 720,
};

// 逐题节奏是平台判定异常的主要依据：间隔不足 10 秒一律抬到 12 秒，
// 想跑更快只能改成 >= 10 的值，避免把 questionInterval 调到 2 秒这类会被风控的取值。
function questionIntervalSeconds() {
    var value = Number(GLOBAL.questionInterval);
    if (!isFinite(value) || value <= 0) return 12;
    return value < 10 ? 12 : value;
}

// 固定节奏本身也是特征：机械的「每隔整 12 秒答一题、整 2 秒后保存」比慢一点更像脚本。
// 所有等待都在固定基数上加 0~range 秒的随机浮动；Math.random() 返回 0 时不加浮动，
// 回归测试据此仍能拿到确定的时长。
// 配置读取做成容错形式：部分回归夹具只注入调度片段，页面里并没有完整的 GLOBAL 对象。
function jitterSeconds(key) {
    if (typeof GLOBAL === 'undefined' || !GLOBAL) return 0;
    return GLOBAL[key];
}

function jitterMs(rangeSeconds) {
    var range = Number(rangeSeconds);
    if (!isFinite(range) || range <= 0) return 0;
    return Math.floor(Math.random() * range * 1e3);
}

// 逐题等待时长：风控间隔 + 0~answerJitter 秒随机浮动。
function answerIntervalMs() {
    return questionIntervalSeconds() * 1e3 + jitterMs(jitterSeconds('answerJitter'));
}

// 保存 / 提交前的等待时长：固定基数 + 0~saveJitter 秒随机浮动。
function saveDelayMs(baseMs) {
    var base = Number(baseMs);
    return (isFinite(base) && base > 0 ? base : 0) + jitterMs(jitterSeconds('saveJitter'));
}

// 「跳过已作答」不调用 AI，不需要风控间隔，只留一个极短的让步避免死循环空转。
var AI_SKIP_ANSWERED_DELAY_MS = 120;

// 老内核（Chrome 85 以下等）没有 String.prototype.replaceAll，这里只补一个语义一致的兜底实现。
// 关键点：字符串模式必须按字面量处理。曾经的实现是 this.replace(new RegExp(s1, "gm"), s2)，
// 会把 '.'、'('、'-' 等全部当成正则元字符，导致题干被改写（例如把整个字符串都替换掉）。
if (typeof String.prototype.replaceAll !== "function") {
    Object.defineProperty(String.prototype, "replaceAll", {
        configurable: true,
        writable: true,
        value: function (pattern, replacement) {
            // 用 toString 判类型而不是 instanceof：跨 iframe / 跨沙箱传入的正则不属于当前 Realm，
            // instanceof 会判成 false，从而把正则当成字符串字面量处理。
            if (Object.prototype.toString.call(pattern) === "[object RegExp]") {
                if (!pattern.global) {
                    throw new TypeError("replaceAll must be called with a global RegExp");
                }
                return this.replace(pattern, replacement);
            }
            return this.split(String(pattern)).join(String(replacement));
        }
    });
}

// ==================== 第三方 AI 模型辅助（OpenAI 兼容接口） ====================
// 使用第三方大模型辅助答题/考试；所有参数均可在页面“LLM 设置”窗口中自由配置。
// 支持 DeepSeek、Ollama 本地等 OpenAI 兼容接口；其他服务商可通过“自定义”填入接口地址。
var AI_BASE_DEFAULT = "https://api.deepseek.com";
var AI_MODEL_DEFAULT = "deepseek-flash";
var AI_SYSTEM_DEFAULT = "你是一名严谨的考试答题助手，必须严格依据题目和选项给出答案，禁止输出解释、题号和多余文字。\n请只输出最终答案：单选输出单个选项字母（如A）；多选输出全部正确选项字母（如ABD）；判断只输出“正确”或“错误”；填空题每个空用 ||| 分隔；问答/主观题直接输出答案内容。";
var AI_USER_DEFAULT = "题型：{type}\n题目：{question}\n{options}";
var AI_RESPONSE_PATH_DEFAULT = "choices.0.message.content";
var AI_TIMEOUT_DEFAULT = 22000;
var AI_RETRY_DEFAULT = 2;
var AI_CONCURRENCY_DEFAULT = 2;
var AI_STATUS_HOOKS = [];
var AI_SETTING_FRAME = null;
var AI_SETTING_NODE_ID = "xxt-llm-setting-node";
var AI_SETTING_CARD_ID = "xxt-llm-setting-card";
var AI_SETTING_CARD = null;
var AI_SETTING_HANDLER = null;

function aiJsonParse(text, def) {
    var t = String(text == null ? "" : text).trim();
    if (!t) return def;
    try {
        var v = JSON.parse(t);
        return v && typeof v === "object" ? v : def;
    } catch (e) {
        return def;
    }
}
function aiCfg() {
    var oldEnable = XXTFoundation.enabled(XXTFoundation.get("ai_enable", false));
    var mode = XXTFoundation.get("ai_mode", "");
    // 从未保存过 ai_mode 时不默认关闭：只要已经填了接口地址，就按开启处理。
    // 否则「填好 Key、点保存」之后仍需再手动把下拉框改成开启，答题会一路报未启用。
    if (mode !== "off" && mode !== "first") mode = oldEnable || XXTFoundation.text(XXTFoundation.get("ai_url", "")) ? "first" : "off";
    return {
        mode: mode,
        enable: mode !== "off",
        first: mode === "first",
        url: XXTFoundation.text(XXTFoundation.get("ai_url", "")),
        key: XXTFoundation.text(XXTFoundation.get("ai_key", "")),
        model: XXTFoundation.text(XXTFoundation.get("ai_model", ""), AI_MODEL_DEFAULT),
        timeout: Math.max(3000, XXTFoundation.number(XXTFoundation.get("ai_timeout", AI_TIMEOUT_DEFAULT), AI_TIMEOUT_DEFAULT, 0)),
        retries: Math.min(5, Math.max(0, Math.floor(XXTFoundation.number(XXTFoundation.get("ai_retries", AI_RETRY_DEFAULT), AI_RETRY_DEFAULT, 0)))),
        concurrency: Math.min(6, Math.max(1, Math.floor(XXTFoundation.number(XXTFoundation.get("ai_concurrency", AI_CONCURRENCY_DEFAULT), AI_CONCURRENCY_DEFAULT, 1)))),
        temperature: XXTFoundation.number(XXTFoundation.get("ai_temperature", 0.2), 0.2),
        maxTokens: Math.floor(XXTFoundation.number(XXTFoundation.get("ai_max_tokens", 1024), 1024, 1)),
        systemPrompt: XXTFoundation.text(XXTFoundation.get("ai_system_prompt", ""), AI_SYSTEM_DEFAULT),
        userPrompt: XXTFoundation.text(XXTFoundation.get("ai_user_prompt", ""), AI_USER_DEFAULT),
        headersJson: XXTFoundation.text(XXTFoundation.get("ai_headers_json", "")),
        bodyJson: XXTFoundation.text(XXTFoundation.get("ai_body_json", "")),
        responsePath: XXTFoundation.text(XXTFoundation.get("ai_response_path", ""), AI_RESPONSE_PATH_DEFAULT)
    };
}
function aiEndpoint(base) {
    var u = String(base || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    u = u.replace(/\/+$/, "");
    if (/\/chat\/completions$/i.test(u)) return u;
    if (/\/v\d+(\/)?$/i.test(u)) return u + "/chat/completions";
    return u + "/v1/chat/completions";
}
function aiMode() {
    return aiCfg().mode;
}
function aiAvailable() {
    var c = aiCfg();
    return c.mode !== "off" && aiEndpoint(c.url) !== "";
}
function aiSkipAnswered() {
    return !!GM_getValue("ai_skip_answered");
}
// 未启用时给出可执行的下一步，而不是只丢一句「未启用」。这条文案会直接出现在运行日志和题目请求行里。
// 「什么都没填」这一支才补入口链接：用户刚被告知要配接口，此时最需要；已配过的人再看到就成骚扰了。
// 链接为普通注册入口，不带任何推广参数，也不需要隐藏跳转。
function aiDisabledHint() {
    var c = aiCfg();
    if (c.mode !== "off" && aiEndpoint(c.url) === "") return "AI 已开启但接口地址为空：请在 LLM 配置里填写接口地址（如 https://api.deepseek.com）并保存";
    if (c.mode === "off" && aiEndpoint(c.url) !== "") return "AI 仍是关闭状态：请在 LLM 配置里把「AI 答题」改成「开启 AI 直连答题」并保存";
    return "请先在 LLM 配置里填写接口地址与 API Key 并保存；没有密钥可在设置页点「获取密钥」注册：https://nuoapi.net/register";
}
function aiModeLabel(cfg) {
    cfg = cfg || aiCfg();
    if (cfg.mode === "off") return "已关闭AI";
    var model = String(cfg.model || AI_MODEL_DEFAULT).replace(/[<>&"'\u2028\u2029]/g, "");
    return "AI直连" + " · " + model;
}
function aiStatusText(cfg) {
    var aiSt = aiStatRead();
    return aiModeLabel(cfg) + " · 今日AI调用 " + (aiSt.daily || 0) + " 次";
}
function aiNotifyStatus(text) {
    for (var i = 0; i < AI_STATUS_HOOKS.length; i++) {
        try { AI_STATUS_HOOKS[i](text); } catch (e) {}
    }
}
function aiTodayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function aiStatRead() {
    var st = { date: aiTodayStr(), daily: 0, total: 0, ok: 0, fail: 0, last: null, cacheHit: 0, cacheMiss: 0 };
    try {
        var raw = XXTFoundation.get("ai_stat", "");
        var o = raw ? JSON.parse(raw) : null;
        if (o && typeof o === "object") {
            st.total = parseInt(o.total, 10) || 0;
            st.ok = parseInt(o.ok, 10) || 0;
            st.fail = parseInt(o.fail, 10) || 0;
            st.date = String(o.date || "");
            st.daily = parseInt(o.daily, 10) || 0;
            st.last = o.last || null;
            st.cacheHit = parseInt(o.cacheHit, 10) || 0;
            st.cacheMiss = parseInt(o.cacheMiss, 10) || 0;
        }
    } catch (e) {}
    if (st.date !== aiTodayStr()) {
        st.date = aiTodayStr();
        st.daily = 0;
    }
    return st;
}
function aiStatsText(st) {
    st = st || aiStatRead();
    var last = "最近一次：无";
    if (st.last && st.last.t) {
        var d = new Date(parseInt(st.last.t, 10) || 0);
        last = "最近一次：" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + " · " + (st.last.ok ? "成功" : "失败") + " · " + (parseInt(st.last.ms, 10) || 0) + "ms";
    }
    var hit = parseInt(st.cacheHit, 10) || 0;
    var miss = parseInt(st.cacheMiss, 10) || 0;
    var cache = "";
    if (hit > 0 || miss > 0) {
        cache = " · 缓存命中 " + Math.round(hit * 100 / (hit + miss)) + "%（累计 " + hit + "/" + (hit + miss) + " tokens）";
    }
    if (st.last && st.last.cacheHit != null) {
        var lh = parseInt(st.last.cacheHit, 10) || 0;
        var lm = parseInt(st.last.cacheMiss, 10) || 0;
        cache += " · 上次命中 " + lh + "/" + (lh + lm) + " tokens";
    }
    return "今日调用 " + st.daily + " 次 · 累计 " + st.total + " 次（成功 " + st.ok + " / 失败 " + st.fail + "）· " + last + cache;
}
function aiStatAdd(ok, ms, note, cacheHit, cacheMiss) {
    var st = aiStatRead();
    st.daily += 1;
    st.total += 1;
    if (ok) st.ok += 1; else st.fail += 1;
    var ch = cacheHit == null ? null : (parseInt(cacheHit, 10) || 0);
    var cm = cacheMiss == null ? null : (parseInt(cacheMiss, 10) || 0);
    st.last = { t: Date.now(), ok: !!ok, ms: parseInt(ms, 10) || 0, note: String(note || "").slice(0, 150), cacheHit: ch, cacheMiss: cm };
    if (ch != null || cm != null) {
        st.cacheHit = (parseInt(st.cacheHit, 10) || 0) + (ch || 0);
        st.cacheMiss = (parseInt(st.cacheMiss, 10) || 0) + (cm || 0);
    }
    XXTFoundation.set("ai_stat", JSON.stringify(st));
    try { aiNotifyStatus(aiStatusText()); } catch (e) {}
    try {
        var frameEl = AI_SETTING_FRAME;
        if (frameEl && frameEl.isConnected !== false && frameEl.contentWindow &&
            typeof frameEl.contentWindow.aiShowStats === "function") {
            frameEl.contentWindow.aiShowStats(aiStatsText(st));
        }
    } catch (e) {}
    return st;
}
function aiTypeName(type) {
    var map = { 0: "单选题", 1: "多选题", 2: "填空题", 3: "判断题", 4: "问答题", 5: "问答题", 6: "论述题", 65: "完形填空", 66: "多选题" };
    return map[type] || "题目";
}
function aiSourceName(source) {
    var map = { "phone-chapter": "手机章节页", "超星章节测验": "桌面章节页", "WorkerJS": "考试页" };
    var text = String(source == null ? "" : source).trim();
    return map[text] || text || "未知来源";
}
// 日志里的长文本一律按上限裁剪，并回传原始长度，避免把整段题干或模型输出刷屏。
function aiClip(text, max) {
    var value = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (!value) return "";
    var limit = max > 0 ? max : 24;
    return value.length > limit ? value.slice(0, limit) + "…共 " + value.length + " 字" : value;
}
// 题干摘要用省略号截断即可；aiClip 会附字数，适合失败原因，不适合逐行重复出现。
function aiStem(text, max) {
    var value = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (!value) return "";
    var limit = max > 0 ? max : 16;
    return value.length > limit ? value.slice(0, limit) + "…" : value;
}
function aiRequestTag(data) {
    var count = Array.isArray(data && data.options) ? data.options.length : 0;
    var stem = aiStem(data && data.question, 16);
    return aiTypeName(data && data.type) + (count ? " " + count + " 选项" : "") + (stem ? "「" + stem + "」" : "");
}
function aiRequestRef(requestId, data) {
    var source = data && data.requestMeta && data.requestMeta.source;
    // 手机章节页与桌面章节页是两个页面，各自的请求编号都从 1 开始，
    // 只写 #N 会对不上号，所以把来源并到编号里。
    return '#' + requestId + (source ? '（' + aiSourceName(source) + '）' : '');
}
function aiRequestProfile(data, cfg, retryLimit, slotLimit) {
    var meta = (data && data.requestMeta) || {};
    var parts = [ "题型：" + aiTypeName(data && data.type) ];
    parts.push("选项：" + (Array.isArray(data && data.options) ? data.options.length : 0) + " 个");
    if (meta.questionId) parts.push("题号：" + aiClip(meta.questionId, 18));
    if (cfg && cfg.model) parts.push("模型：" + aiClip(cfg.model, 24));
    parts.push("超时 " + (cfg && cfg.timeout) + "ms");
    if (retryLimit) parts.push("失败重试 " + retryLimit + " 次");
    parts.push("并发上限 " + slotLimit);
    return parts.join("，");
}
function aiQuestionLabel(token) {
    var parts = [];
    // 这里只写来源与平台题号；「第几题」由 aiQuestionRef 单独给出，避免前缀与括号里重复。
    if (token && token.source) parts.push(aiSourceName(token.source));
    if (token && token.key && token.key !== "dom") parts.push("题号 " + aiClip(token.key, 18));
    return parts.join("，") || "未识别题目";
}
// 题目前缀统一写成「题目 #N」，N 是页面内的第几题（和用户在页面上数出来的一致）。
// token.id 是页面级流水号，两个页面各自从 1 开始会撞号，只用于内部关联，不写进日志。
function aiQuestionRef(token) {
    if (token && token.position) return "题目 #" + token.position;
    return token && token.id ? "题目 #" + token.id : "题目";
}
var AI_QUESTION_FAIL_TEXT = {
    "invalid-answer": "模型没有返回可映射的选项答案",
    "stale-question": "题目已切换，旧答案已丢弃",
    "click-failed": "页面未选中目标选项",
    "selection-mismatch": "实际勾选项与目标答案不一致",
    "click-error": "选项点击失败",
    "processing-error": "答题流程异常中断",
    "selection-verified": "页面选项核验通过"
};
function aiQuestionFailText(reason) {
    var text = String(reason == null ? "" : reason).trim();
    if (!text) return "未知原因";
    var mapped = AI_QUESTION_FAIL_TEXT[text];
    if (mapped) return mapped;
    return aiClip(text, 60);
}
function aiPromptValues(data) {
    var optText = "";
    if (data.options instanceof Array && data.options.length > 0) {
        var arr = [];
        for (var i = 0; i < data.options.length; i++) {
            arr.push(String.fromCharCode(65 + i) + ". " + String(data.options[i] || "").trim());
        }
        optText = "选项：\n" + arr.join("\n");
    }
    return {
        type: aiTypeName(data.type),
        question: String(data.question || "").trim(),
        options: optText
    };
}
function aiBuildMessages(data, cfg) {
    cfg = cfg || aiCfg();
    var v = aiPromptValues(data);
    var renderSystem = function (tpl) {
        return String(tpl || "")
            .replace(/\{type\}/g, function () { return v.type; })
            .replace(/\{question\}/g, function () { return v.question; })
            .replace(/\{options\}/g, function () { return v.options; });
    };
    var map = { type: v.type, question: v.question, options: v.options };
    var tokens = String(cfg.userPrompt || "").split(/(\{type\}|\{question\}|\{options\})/);
    var headParts = [];
    var dynParts = [];
    var pending = "";
    for (var i = 0; i < tokens.length; i++) {
        var tk = tokens[i];
        var name = /^\{(\w+)\}$/.exec(tk);
        if (name && Object.prototype.hasOwnProperty.call(map, name[1])) {
            var nl = pending.lastIndexOf("\n");
            var label = nl >= 0 ? pending.slice(nl + 1) : pending;
            if (nl >= 0) headParts.push(pending.slice(0, nl + 1));
            pending = "";
            label = label.trim();
            var value = String(map[name[1]] == null ? "" : map[name[1]]).trim();
            var sep = label ? (/[：:，,]\s*$/.test(label) ? "" : " ") : "";
            dynParts.push(label + sep + value);
        } else {
            if (pending) headParts.push(pending);
            pending = tk;
        }
    }
    if (pending) headParts.push(pending);
    var head = headParts.join("").replace(/\r/g, "").split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; }).join("\n");
    var dyn = dynParts.join("\n").trim();
    if (!dyn) {
        dyn = "题型：" + v.type + "\n题目：" + v.question + (v.options ? "\n" + v.options : "");
    }
    var user = head ? head + "\n\n" + dyn : dyn;
    return [
        { role: "system", content: renderSystem(cfg.systemPrompt) },
        { role: "user", content: user }
    ];
}

function aiNormalize(text) {
    var t = String(text == null ? "" : text).trim();
    t = t.replace(/\`\`\`[\s\S]*?\`\`\`/g, function (s) { return s.replace(/\`\`\`[a-zA-Z]*/g, "").replace(/\`\`\`/g, ""); });
    t = t.replace(/[\uFF21-\uFF3A\uFF41-\uFF5A]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); });
    t = t.replace(/^(最终答案|正确答案|参考答案|答案|final answer|correct answer|answer)\s*[:：]?\s*/i, "").trim();
    return t;
}
// 模型经常把答案连同解析一起给出，或把答案包在代码块 / 反引号 / 列表符号里。
// 这些修饰不属于答案内容，但会直接让「只认单行字母」的解析失败，所以先剥干净再交给 aiParseAnswer。
function aiStripAnswerDecorations(text) {
    var t = String(text == null ? "" : text).trim();
    if (!t) return '';
    t = t.replace(/^[ \t]*[-*·+•][ \t]+/gm, '');
    t = t.replace(/^[ \t]*\d+[.、)）][ \t]+/gm, '');
    t = t.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');
    t = t.replace(/^[ \t>]+/gm, '');
    t = t.replace(/^[*_~`]+|[*_~`]+$/gm, '');
    t = t.replace(/^[「『“"【\[（(]+|[」』”"】\]）)]+$/gm, '');
    // 「选项A」「答案是 A」「是 C」都是同一个意思，剥掉修饰词后再走字母规则。
    // 只收中文修饰词：英文里 "The answer is C" 这类叙述句必须继续判为不可作答。
    t = t.replace(/^(?:(?:正确选项|选项|答案)\s*)?[是为]?\s*[:：]?\s*([A-H])(?:\s*[.。、．:：)）])?$/i, '$1');
    return t.trim();
}
// 只保留答案段：出现「解析 / 分析 / 说明 / 理由」这类分段标题时，标题之后的内容一律丢弃，
// 否则模型附带的解释会把单行模板撑成多行，解析阶段会直接判为不可用。
function aiAnswerSegment(text) {
    var t = String(text == null ? '' : text);
    var cut = t.search(/(?:^|\n)\s*(?:[\u3010\[]?\s*(?:解析|分析|说明|理由|解释|考点|备注|思路|依据)\s*[\u3011\]]?\s*[:：]?|[\u3010\[]?\s*(?:explanation|analysis|reasoning)\s*[\u3011\]]?\s*[:：])/i);
    if (cut > 0) t = t.slice(0, cut);
    return t.trim();
}
function aiMapOptionAnswers(answers, options) {
    if (!(answers instanceof Array) || !(options instanceof Array) || answers.length === 0) return null;
    var mapped = [];
    for (var i = 0; i < answers.length; i++) {
        var letter = String(answers[i] == null ? "" : answers[i]).trim().toUpperCase();
        if (!/^[A-H]$/.test(letter)) return null;
        var index = letter.charCodeAt(0) - 65;
        if (index >= options.length || mapped.indexOf(index) >= 0) return null;
        mapped.push(index);
    }
    return mapped;
}
async function aiSelectOptions(options, answers, type, isSelected, clickOption, isCurrent, wait) {
    var indexes = aiMapOptionAnswers(answers, options);
    if (!indexes || ([0, 3].includes(type) && indexes.length !== 1)) return { success: false, reason: "invalid-answer" };
    var targets = new Set(indexes);
    var multi = type === 1 || type === 66;
    var delay = typeof wait === "function" ? wait : function () { return Promise.resolve(); };
    var current = typeof isCurrent === "function" ? isCurrent : function () { return true; };
    var selected = typeof isSelected === "function" ? isSelected : function () { return false; };
    var click = typeof clickOption === "function" ? clickOption : function () {};
    try {
        if (!current()) return { success: false, reason: "stale-question" };
        if (multi) {
            for (var i = 0; i < options.length; i++) {
                if (!current()) return { success: false, reason: "stale-question" };
                if (!targets.has(i) && Boolean(selected(options[i]))) {
                    click(options[i]);
                    await delay();
                    if (!current()) return { success: false, reason: "stale-question" };
                    if (Boolean(selected(options[i]))) return { success: false, reason: "click-failed" };
                }
            }
        }
        for (var j = 0; j < options.length; j++) {
            if (!targets.has(j)) continue;
            if (!current()) return { success: false, reason: "stale-question" };
            if (!Boolean(selected(options[j]))) {
                click(options[j]);
                await delay();
            }
            if (!current()) return { success: false, reason: "stale-question" };
            if (!Boolean(selected(options[j]))) return { success: false, reason: "click-failed" };
        }
        if (!current()) return { success: false, reason: "stale-question" };
        for (var k = 0; k < options.length; k++) {
            if (Boolean(selected(options[k])) !== targets.has(k)) return { success: false, reason: "selection-mismatch" };
        }
        return { success: true, indexes: indexes, options: indexes.map(function (index) { return options[index]; }) };
    } catch (error) {
        return { success: false, reason: "click-error", error: error };
    }
}
// 平台把选中事件绑定在选项内部容器（如 [class*="before-after"]）上，直接点 li 无法冒泡进去，
// 因此按优先级尝试可点击目标，每次点击后立即回读状态，已生效就不再点下一层。
function aiOptionClickTargets(node) {
    var list = [];
    var push = function (el) { if (el && el.nodeType === 1 && list.indexOf(el) < 0) list.push(el); };
    if (!node || node.nodeType !== 1) return list;
    var wrapper = null;
    if (node.matches && node.matches('[class*="before-after"]')) wrapper = node;
    if (!wrapper && node.querySelector) wrapper = node.querySelector('[class*="before-after"]');
    if (!wrapper && node.closest) wrapper = node.closest('[class*="before-after"]');
    push(wrapper);
    if (!wrapper && node.querySelector) push(node.querySelector('.after'));
    if (node.matches && node.matches('input[type="radio"],input[type="checkbox"]')) push(node);
    else if (node.querySelector) push(node.querySelector('input[type="radio"],input[type="checkbox"]'));
    push(node);
    return list;
}
function aiToggleOption(node, isSelected) {
    var selected = typeof isSelected === 'function' ? function () { return Boolean(isSelected(node)); } : function () { return false; };
    if (!node || node.nodeType !== 1) return false;
    var desired = !selected();
    var targets = aiOptionClickTargets(node);
    for (var i = 0; i < targets.length; i++) {
        try { if (typeof targets[i].click === 'function') targets[i].click(); } catch (error) { continue; }
        if (selected() === desired) return true;
    }
    // 点击被平台拦截时才兜底：优先切换原生控件，其次写入容器上的 aria-checked / cur，
    // 这两处正是平台序列化答案时读取的状态。
    var input = node.matches && node.matches('input[type="radio"],input[type="checkbox"]') ? node : null;
    if (!input && node.querySelector) input = node.querySelector('input[type="radio"],input[type="checkbox"]');
    if (input && input.checked !== desired) {
        input.checked = desired;
        try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (error) {}
        try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (error) {}
        if (selected() === desired) return true;
    }
    var wrapper = null;
    for (var j = 0; j < targets.length; j++) {
        if (targets[j].matches && targets[j].matches('[class*="before-after"]')) { wrapper = targets[j]; break; }
    }
    if (wrapper && wrapper.setAttribute) {
        wrapper.setAttribute('aria-checked', desired ? 'true' : 'false');
        if (wrapper.classList) wrapper.classList.toggle('cur', desired);
    }
    if (desired && node.classList) node.classList.add('cur');
    else if (!desired && node.classList) node.classList.remove('cur');
    return selected() === desired;
}
function aiParseAnswer(text, data) {
    var t = aiNormalize(text);
    if (!t) return [];
    var primary = aiParseAnswerStrict(t, data);
    if (primary.length > 0) return primary;
    // 严格模式失败后才尝试宽容模式，避免宽容规则把「C or D」「C\nActually D」这类
    // 明确不该作答的回复猜成答案。
    var relaxed = aiAnswerSegment(aiStripAnswerDecorations(t));
    if (!relaxed || relaxed === t) return [];
    return aiParseAnswerStrict(relaxed, data);
}
function aiParseAnswerStrict(t, data) {
    var firstLine = t.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; })[0] || t;
    firstLine = firstLine.trim();
    var type = data.type;
    if ((type === 0 || type === 1 || type === 3 || type === 66) && t.split(/\r?\n/).filter(function (line) { return line.trim() !== ""; }).length !== 1) return [];
    if (type === 3) {
        if (/^(正确|√|对|是|true|t|a)$/i.test(firstLine)) return [ "正确" ];
        if (/^(错误|×|错|否|false|f|b)$/i.test(firstLine)) return [ "错误" ];
        return [];
    }
    if (type === 0 || type === 1 || type === 66) {
        var opts = data.options instanceof Array ? data.options : [];
        if (opts.length === 0) return [];
        var lettersOnly = firstLine.match(/^([A-H])(?:[.、．:：)）])?$/i);
        var letterSet = firstLine.match(/^([A-H](?:\s*[,，、;；&和及]?\s*[A-H])*)$/i);
        var idxs = [];
        if (lettersOnly) {
            idxs = [ lettersOnly[1].toUpperCase().charCodeAt(0) - 65 ];
        } else if (letterSet) {
            var tokens = firstLine.toUpperCase().match(/[A-H]/g) || [];
            idxs = tokens.map(function (letter) { return letter.charCodeAt(0) - 65; });
            if (idxs.some(function (index) { return index >= opts.length; }) || new Set(idxs).size !== idxs.length) return [];
        }
        if (idxs.length > 0) {
            if (idxs.some(function (index) { return index >= opts.length; })) return [];
            if (type === 0 && idxs.length !== 1) return [];
            return idxs.map(function (index) { return String.fromCharCode(65 + index); });
        }
        function normalizeOption(value) {
            return String(value == null ? "" : value).replace(/\s/g, "").replace(/[。.!！?？]+$/g, "").toLowerCase();
        }
        var exact = normalizeOption(firstLine);
        var matches = [];
        if (exact) {
            for (var j = 0; j < opts.length; j++) {
                if (normalizeOption(opts[j]) === exact) matches.push(j);
            }
        }
        if (matches.length !== 1) return [];
        return [ String.fromCharCode(65 + matches[0]) ];
    }
    if (type === 2 || type === 4 || type === 5 || type === 6) {
        var parts = t.split(/\s*\|\|\|\s*/).map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; });
        return parts.length > 0 ? parts : [ firstLine ];
    }
    return [ firstLine ];
}
var aiQuestionRequests = new WeakMap();
var aiQuestionSequence = 0;
var AI_CROSS_PAGE_ANSWER_TTL_MS = 10 * 60 * 1000;
// 跨页面缓存使用规范化后的题干和有序选项指纹，避免手机页/桌面页 URL 或标点差异影响复用。
function aiAnswerCacheText(value) {
    return String(value == null ? '' : value).replace(/[\u3000\s]+/g, '').replace(/[（(]/g, '(')
        .replace(/[）)]/g, ')').replace(/[，,]/g, ',').replace(/[。.!！!？?；;]/g, '').toLowerCase();
}
function aiAnswerCacheContext(workId, questionId, type, question, options) {
    var rows = Array.isArray(options) ? options.map(function (option) {
        // 手机页带平台 value，桌面页通常只有文本；跨页身份只使用有序规范化文本，避免两种 DOM 表示无法互认。
        return aiAnswerCacheText(option && typeof option === 'object' ? (option.text || option.value || '') : option);
    }) : [];
    return {
        workId: String(workId || 'global'),
        questionId: String(questionId || ''),
        type: Number(type),
        questionFingerprint: aiAnswerCacheText(question),
        optionFingerprint: JSON.stringify(rows)
    };
}
function aiAnswerCacheKey(context) {
    if (!context || !context.workId || !context.questionFingerprint || !context.optionFingerprint) return '';
    return JSON.stringify([context.workId, context.questionId, context.type, context.questionFingerprint, context.optionFingerprint]);
}
function aiCrossPageAnswerCache(sourceWindow) {
    var host = aiChapterSubmitHost(sourceWindow);
    try {
        if (!host.__xxtCrossPageAnswers) host.__xxtCrossPageAnswers = new Map();
        return host.__xxtCrossPageAnswers;
    } catch (error) {
        return null;
    }
}
function aiGetCrossPageAnswer(sourceWindow, context) {
    var key = aiAnswerCacheKey(context);
    if (!key) return null;
    var cache = aiCrossPageAnswerCache(sourceWindow);
    if (!cache) return null;
    var record = cache.get(key);
    if (!record || Date.now() - record.time > AI_CROSS_PAGE_ANSWER_TTL_MS || !Array.isArray(record.answers) || !record.answers.length) {
        if (record) cache.delete(key);
        aiSweepCrossPageAnswers(cache, Date.now());
        return null;
    }
    return record.answers.slice();
}
// 缓存挂在顶层窗口上，跨章节共用。之前只在「查到过期那条」时删，键却是整段
// 题干+选项指纹的 JSON，长会话里每答一题就多一条永不回收的记录。
// 查和写都顺手扫一遍过期项，量级只有几十到几百条，开销可以忽略。
// 唯一的例外是 aiWaitCrossPageAnswer 每 250ms 轮询一次 miss，那里用节流兜住，
// 否则一次 60 秒的等待会白白全表扫两百多遍。
var AI_CROSS_PAGE_SWEEP_INTERVAL_MS = 5000;
var aiCrossPageSweepAt = new WeakMap();
function aiSweepCrossPageAnswers(cache, now, force) {
    if (!(cache instanceof Map) || !cache.size) return;
    var time = Number(now) > 0 ? Number(now) : Date.now();
    if (!force) {
        var last = aiCrossPageSweepAt.get(cache);
        if (last && time - last >= 0 && time - last < AI_CROSS_PAGE_SWEEP_INTERVAL_MS) return;
    }
    aiCrossPageSweepAt.set(cache, time);
    var expired = [];
    cache.forEach(function (record, key) {
        if (!record || !Array.isArray(record.answers) || !record.answers.length) { expired.push(key); return; }
        if (time - Number(record.time || 0) > AI_CROSS_PAGE_ANSWER_TTL_MS) expired.push(key);
    });
    for (var i = 0; i < expired.length; i++) cache.delete(expired[i]);
}
function aiRememberCrossPageAnswer(sourceWindow, context, answers) {
    var key = aiAnswerCacheKey(context);
    if (!key || !Array.isArray(answers) || !answers.length) return;
    var cache = aiCrossPageAnswerCache(sourceWindow);
    if (!cache) return;
    aiSweepCrossPageAnswers(cache, Date.now(), true);
    cache.set(key, { time: Date.now(), answers: answers.slice() });
}
function aiWaitCrossPageAnswer(sourceWindow, context, timeout) {
    var limit = Math.max(0, Number(timeout) || 0);
    var started = Date.now();
    return new Promise(function (resolve) {
        var check = function () {
            var answers = aiGetCrossPageAnswer(sourceWindow, context);
            if (answers) { resolve(answers); return; }
            if (Date.now() - started >= limit) { resolve(null); return; }
            setTimeout(check, 250);
        };
        check();
    });
}
// 判断两条请求记录是否指向同一道题。题目 ID 在新版考试页上常常缺失或重名，不能当
// 唯一标识：一旦按 ID 判重，第 1 题答完后留下的 done 记录会把后面所有同 ID 的题
// 全挡成「已有处理请求」，整卷一道也答不了。因此以 DOM 节点为准。
function aiSameQuestionRoot(a, b) {
    if (!a || !b) return false;
    return a === b || !!(a.root && b.root && a.root === b.root);
}
function aiBeginQuestion(root, key, source, signature, chapterWorkId, position, cacheContext) {
    var doc = root.ownerDocument;
    var requests = aiQuestionRequests.get(doc);
    if (!requests) { requests = new Map(); aiQuestionRequests.set(doc, requests); }
    var id = key || root;
    var fingerprint = signature();
    var sourceWindow = doc.defaultView || (typeof window !== 'undefined' ? window : null);
    var chapterScope = chapterWorkId ? aiChapterQuestionScope(sourceWindow, chapterWorkId) : null;
    var sharedId = key ? 'id:' + String(key) : 'fingerprint:' + fingerprint;
    if (chapterScope && chapterScope.blocked) {
        aiTrace('章节 ' + aiClip(chapterScope.workId, 18) + ' 已进入' + (chapterScope.host.__xxtChapterSubmit || {}).state + '状态，阻止 ' + aiSourceName(source) + ' 启动题目请求', 'info', sourceWindow);
        return null;
    }
    var previous = requests.get(id);
    // 跨窗口的章节共享注册表仍按题目 ID 协调：章节页的 answer{id}/answertype{id}
    // 是平台给出的真实唯一 ID，不存在重名问题。
    var sharedPrevious = chapterScope && chapterScope.requests.get(sharedId);
    var blocking = null;
    // 本地注册表只认 DOM 节点：同一节点再次进入（重试、重复调度）才算重复请求。
    // 曾经按题目 ID 判重，而考试页从 input[name^=answer] 取到的 ID 会重名，
    // 于是第 1 题答完留下的 done 记录把后面同 ID 的题全挡成「已有处理请求」，
    // 一整份卷子一道都答不了。
    var duplicate = aiSameQuestionRoot(previous, { root: root }) ||
        !!(previous && previous.state === "pending" && previous.fingerprint === fingerprint);
    if (previous && (previous.state === "pending" || previous.state === "done") &&
        duplicate && previous.isLive()) {
        blocking = previous;
    }
    if (!blocking && sharedPrevious && sharedPrevious.state === "pending") blocking = sharedPrevious;
    // 另一页面已经完成同题时，只在缓存身份完全一致的情况下放行本地流程：
    // 后续仍由当前页面映射、点击并回读选中状态，绝不把缓存当成页面完成结果。
    if (!blocking && sharedPrevious && sharedPrevious.state === "done" && !aiGetCrossPageAnswer(sourceWindow, cacheContext)) {
        blocking = sharedPrevious;
    }
    if (blocking) {
        aiTrace(aiQuestionRef(blocking) + '（' + aiQuestionLabel(blocking) + '）仍处于' + (blocking.state === 'pending' ? '处理中' : '已完成') + '状态，' + aiSourceName(source) + '本次跳过（重复请求已拦截）', 'info', sourceWindow);
        return null;
    }
    var token = { id: ++aiQuestionSequence, key: key || "dom", source: source, root: root, fingerprint: fingerprint, state: "pending",
        position: position || 0, startedAt: Date.now(), attempts: 0, chapterWorkId: chapterScope && chapterScope.workId, chapterRequestId: sharedId };
    token.isLive = function () {
        // 不再因为章节进入 submitting 就判死：进入提交只应阻止「启动新题目」，
        // 已经在途的 AI 请求仍在合法地写答案，一旦提前作废，答对的题会被当成
        // 「题目已切换，已丢弃过期答案」丢掉，提交反而变成缺题提交。
        return requests.get(id) === token && (!chapterScope || chapterScope.requests.get(sharedId) === token) &&
            root.isConnected !== false && doc.documentElement.contains(root) && signature() === fingerprint;
    };
    token.isCurrent = function () { return token.state === "pending" && token.isLive(); };
    token.finish = function (success, reason) {
        if (requests.get(id) !== token || token.state !== "pending") return false;
        if (success && !token.isCurrent()) { success = false; reason = "stale-question"; }
        token.state = success ? "done" : "failed";
        token.endedAt = Date.now();
        var cost = token.endedAt - token.startedAt;
        var label = aiQuestionLabel(token);
        var detail = success ? '页面选项核验通过' : aiQuestionFailText(reason);
        // token.attempts 由外部流程累加，未累加时回落到请求层的实际尝试次数。
        var attempts = token.attempts > 0 ? token.attempts : (typeof aiQuestionAttempts === 'function' ? aiQuestionAttempts(token.id) : 0);
        aiTrace(aiQuestionRef(token) + '（' + label + '）' + (success ? '完成' : '失败') + '：' + detail +
            '，耗时 ' + (cost / 1000).toFixed(1) + 's' + (attempts > 0 ? '，AI 共 ' + attempts + ' 次尝试' : ''),
            success ? 'info' : 'warn', sourceWindow);
        return success;
    };
    requests.set(id, token);
    if (chapterScope) chapterScope.requests.set(sharedId, token);
    return token;
}
function aiCreateOptionModel(option, index) {
    option = option || {};
    return {
        modelIndex: Number.isInteger(option.modelIndex) ? option.modelIndex : index,
        pageLetter: String(option.pageLetter || ""),
        optionId: String(option.optionId || option.pageLetter || option.value || index),
        value: String(option.value || ""),
        text: String(option.text || ""),
        answerName: String(option.answerName || ""),
        judgment: Boolean(option.judgment),
        multi: Boolean(option.multi),
        node: option.node || null
    };
}
function aiCreateQuestionModel(input) {
    input = input || {};
    var rawOptions = Array.isArray(input.options) ? input.options : [];
    var options = rawOptions.map(aiCreateOptionModel);
    var model = {
        id: String(input.id || input.questionid || ""),
        workId: String(input.workId || ""),
        source: String(input.source || "worker"),
        index: Number.isInteger(input.index) ? input.index : 0,
        root: input.root || input.element || null,
        stem: String(input.stem || input.question || "").trim(),
        stemHtml: input.stemHtml,
        typeCode: Number.isInteger(input.typeCode) ? input.typeCode : (Number.isInteger(input.type) ? input.type : -1),
        options: options,
        controls: Array.isArray(input.controls) ? input.controls : [],
        error: String(input.error || "")
    };
    model.fingerprint = typeof input.fingerprint === "function" ? input.fingerprint : function () {
        return JSON.stringify([typeof location !== "undefined" ? location.href : "", model.stem, model.options.map(function (option) {
            return [option.optionId, option.pageLetter, option.value, option.text];
        }), model.typeCode]);
    };
    return model;
}
function aiValidateQuestionModel(question) {
    if (!question || !question.id) return { valid: false, reason: "missing-question-id" };
    if (!question.stem && !question.options.some(function (option) { return option.text; })) {
        return { valid: false, reason: "missing-question-stem" };
    }
    if (!Number.isInteger(question.typeCode) || question.typeCode < 0) return { valid: false, reason: "unknown-question-type" };
    var choiceType = [0, 1, 3, 66].indexOf(question.typeCode) >= 0;
    if (!choiceType) return { valid: true, reason: "" };
    if (question.options.length < 2 || question.options.length > 8) return { valid: false, reason: "invalid-option-count" };
    var ids = question.options.map(function (option) { return option.optionId; });
    if (new Set(ids).size !== ids.length) return { valid: false, reason: "duplicate-option-id" };
    if (question.typeCode === 3) {
        var values = question.options.map(function (option) { return option.value; });
        if (values.length !== 2 || values.indexOf("true") < 0 || values.indexOf("false") < 0) return { valid: false, reason: "invalid-judgment-options" };
    }
    return { valid: true, reason: "" };
}
function aiAllQuestionsVerified(total, results) {
    if (total <= 0 || !Array.isArray(results) || results.length !== total) return false;
    // 必须按下标遍历，不能用 every：results 是按题号存进稀疏数组的，
    // 数组的洞会被 every 直接跳过，等于把「没处理」判成「已验证」，章节就会缺题提交。
    for (var index = 0; index < total; index++) {
        var result = results[index];
        if (!result || !result.success || typeof result.verify !== "function") return false;
        try { if (result.verify() !== true) return false; } catch (error) { return false; }
    }
    return true;
}
function aiCanSubmitQuestions(total, results, threshold) {
    if (!aiAllQuestionsVerified(total, results)) return false;
    return results.length / total * 100 >= threshold;
}
function createMissionState(initial, onChange) {
    var state = ['pending', 'running', 'done', 'failed'].indexOf(initial) >= 0 ? initial : 'pending';
    var update = function (next) {
        if (['pending', 'running', 'done', 'failed'].indexOf(next) < 0) return;
        if ((state === 'done' || state === 'failed') && next !== state) return;
        state = next;
        if (typeof onChange === 'function') onChange(state);
    };
    return {
        getStatus: function () { return state; },
        setStatus: update,
        isRunning: function () { return state === 'running'; },
        setRunning: function (value) { if (value) update('running'); else if (state === 'running') update('pending'); },
        isDone: function () { return state === 'done' || state === 'failed'; },
        setDone: function (value) { if (value) update(state === 'failed' ? 'failed' : 'done'); }
    };
}
function aiGetByPath(obj, path) {
    if (!path) return undefined;
    var parts = String(path).replace(/\[(\d+)\]/g, ".$1").split(".").filter(function (p) { return p !== ""; });
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
        if (cur == null) return undefined;
        cur = cur[parts[i]];
    }
    return cur;
}
function aiExtractText(res, cfg) {
    cfg = cfg || aiCfg();
    var v = aiGetByPath(res, cfg.responsePath);
    if (v == null && res && res.choices && res.choices[0]) {
        var choice = res.choices[0];
        if (choice.message && choice.message.content != null) {
            v = choice.message.content;
        } else if (choice.delta && choice.delta.content != null) {
            v = choice.delta.content;
        }
    }
    if (v instanceof Array) {
        v = v.map(function (p) { return typeof p === "string" ? p : (p && p.text) || ""; }).join("");
    }
    return v == null ? "" : String(v);
}
function aiExtractSse(raw) {
    var out = "";
    var lines = String(raw == null ? "" : raw).split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf("data:") !== 0) continue;
        var payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        var j = null;
        try { j = JSON.parse(payload); } catch (e) { continue; }
        if (!j) continue;
        var piece = "";
        try { piece = aiExtractText(j, { responsePath: "choices.0.message.content" }); } catch (e) {}
        if (!piece && j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content != null) {
            piece = String(j.choices[0].delta.content);
        }
        if (piece) out += piece;
    }
    return out;
}
function aiCfgFromData(d) {
    d = d || {};
    var temp = parseFloat(d.temperature);
    var maxTokens = parseInt(d.max_tokens, 10);
    var retriesRaw = d.retries == null ? '' : String(d.retries).trim();
    var retries = retriesRaw === '' ? AI_RETRY_DEFAULT : parseInt(retriesRaw, 10);
    if (!isFinite(retries)) retries = AI_RETRY_DEFAULT;
    var concurrencyRaw = d.concurrency == null ? '' : String(d.concurrency).trim();
    var concurrency = concurrencyRaw === '' ? AI_CONCURRENCY_DEFAULT : parseInt(concurrencyRaw, 10);
    if (!isFinite(concurrency)) concurrency = AI_CONCURRENCY_DEFAULT;
    var mode = d.mode;
    if (mode !== "off" && mode !== "first") mode = "first";
    return {
        mode: mode,
        url: String(d.url || "").trim(),
        key: String(d.key || "").trim(),
        model: String(d.model || AI_MODEL_DEFAULT).trim(),
        timeout: Math.max(3000, parseInt(d.timeout, 10) || AI_TIMEOUT_DEFAULT),
        retries: Math.min(5, Math.max(0, retries)),
        concurrency: Math.min(6, Math.max(1, concurrency)),
        temperature: isNaN(temp) ? 0.2 : temp,
        maxTokens: maxTokens > 0 ? maxTokens : 1024,
        systemPrompt: String(d.system_prompt || "").trim() || AI_SYSTEM_DEFAULT,
        userPrompt: String(d.user_prompt || "").trim() || AI_USER_DEFAULT,
        headersJson: String(d.headers_json || "").trim(),
        bodyJson: String(d.body_json || "").trim(),
        responsePath: String(d.response_path || "").trim() || AI_RESPONSE_PATH_DEFAULT
    };
}
function aiBackupKeys() {
    return [
        "ai_mode", "ai_enable", "ai_first", "ai_url", "ai_key", "ai_model",
        "ai_timeout", "ai_temperature", "ai_max_tokens", "ai_retries", "ai_concurrency",
        "ai_system_prompt", "ai_user_prompt", "ai_headers_json", "ai_body_json",
        "ai_response_path", "ai_skip_answered"
    ];
}
function aiBackupExport() {
    var dump = { xxtConfig: "llm", version: 1, savedAt: new Date().toISOString() };
    var keys = aiBackupKeys();
    for (var i = 0; i < keys.length; i++) {
        var value = GM_getValue(keys[i]);
        dump[keys[i]] = value === undefined ? null : value;
    }
    return JSON.stringify(dump, null, 2);
}
function aiBackupImport(text) {
    var parsed = null;
    try { parsed = JSON.parse(String(text == null ? "" : text)); } catch (e) { parsed = null; }
    if (!parsed || typeof parsed !== "object" || parsed instanceof Array) {
        return { ok: false, msg: "配置文本不是合法的 JSON 对象" };
    }
    // 只按白名单写入，避免导入时把任意键塞进 GM 存储。
    var keys = aiBackupKeys();
    var applied = 0;
    for (var i = 0; i < keys.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(parsed, keys[i])) continue;
        var value = parsed[keys[i]];
        if (value === null || value === undefined) continue;
        if (typeof value === "object") continue;
        GM_setValue(keys[i], value);
        applied += 1;
    }
    if (!applied) return { ok: false, msg: "这份配置里没有可识别的字段（是否粘错了内容？）" };
    var cfg = aiCfg();
    return {
        ok: true,
        applied: applied,
        msg: "已导入 " + applied + " 项配置：" + aiModeLabel(cfg),
        values: aiCfgSnapshot(cfg)
    };
}
function aiCfgSnapshot(cfg) {
    cfg = cfg || aiCfg();
    return {
        mode: cfg.mode,
        url: cfg.url,
        key: cfg.key,
        model: cfg.model,
        timeout: cfg.timeout,
        retries: cfg.retries,
        concurrency: cfg.concurrency,
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens,
        system_prompt: cfg.systemPrompt,
        user_prompt: cfg.userPrompt,
        headers_json: cfg.headersJson,
        body_json: cfg.bodyJson,
        response_path: cfg.responsePath,
        skip_answered: GM_getValue("ai_skip_answered") ? 1 : 0
    };
}
function aiIsRetryableOutcome(outcome) {
    var text = String(outcome || '');
    if (!text || /无可用内容/.test(text)) return false;
    return /^HTTP (?:408|409|425|429|5\d\d)/.test(text) || /网络错误|连接超时|请求超时|本地等待超时|请求启动异常/.test(text);
}
function aiIsTransientFailure(reason) {
    return /HTTP (?:408|409|425|429|5\d\d)|网络错误|连接超时|请求超时|本地等待超时|请求启动异常/.test(String(reason || ''));
}
// 单题总等待上限：默认 45s，且至少覆盖一次完整超时窗口，避免调大超时后被预算提前掐断。
var AI_TOTAL_BUDGET_MS = 45000;
var AI_CONNECT_TIMEOUT_MS = 5000;
function aiTotalBudget(cfg) {
    var timeout = parseInt(cfg && cfg.timeout, 10);
    var budget = AI_TOTAL_BUDGET_MS;
    if (isFinite(timeout) && timeout > 0) budget = Math.max(budget, timeout + 2000);
    return budget;
}
function aiRetryDelay(attempt) {
    // 首次重试 0.8～1.0s，第二次 1.2～1.5s，实测上游多在 1s 左右恢复。
    var base = attempt <= 1 ? 800 : 1200;
    var spread = attempt <= 1 ? 200 : 300;
    return base + Math.floor(Math.random() * spread);
}
var AI_REQUEST_SLOT_LIMIT = 2;
var aiRequestSlots = { active: 0, limit: AI_REQUEST_SLOT_LIMIT, waiting: [] };
function aiSlotLimit(cfg) {
    var value = parseInt(cfg && cfg.concurrency, 10);
    return isFinite(value) && value > 0 ? Math.min(value, 6) : AI_REQUEST_SLOT_LIMIT;
}
function aiAcquireRequestSlot(task, limit) {
    var cap = parseInt(limit, 10);
    if (isFinite(cap) && cap > 0) aiRequestSlots.limit = Math.min(cap, 6);
    if (aiRequestSlots.active < aiRequestSlots.limit) {
        aiRequestSlots.active += 1;
        task();
        return;
    }
    aiRequestSlots.waiting.push(task);
}
function aiReleaseRequestSlot() {
    if (aiRequestSlots.active > 0) aiRequestSlots.active -= 1;
    if (aiRequestSlots.active >= aiRequestSlots.limit) return;
    var next = aiRequestSlots.waiting.shift();
    if (!next) return;
    aiRequestSlots.active += 1;
    setTimeout(next, 0);
}
// 4xx 是「配置不对」而不是「等一等就好」：不区分 401 与 402 时用户只会反复重试，
// 所以这里把状态码翻成「该改哪一处」的具体动作。
function aiStatusAdvice(status) {
    var code = parseInt(status, 10);
    if (!isFinite(code) || code < 100) return '';
    if (code === 400) return '请求被拒绝，多为模型名不受支持或提示词过长，可先换模型重试';
    if (code === 401) return 'API Key 无效或已过期，请到 LLM 设置重新填写密钥';
    if (code === 402) return '账户额度不足，请到服务商后台充值后再试';
    if (code === 403) return 'Key 没有该模型的调用权限或账户被限制，请检查服务商的令牌与模型权限';
    if (code === 404) return '接口地址或模型名不存在，请核对「接口地址」与「模型」两栏';
    if (code === 413 || code === 422) return '请求内容超长或被参数校验拒绝，可缩短提示词或换模型';
    if (code === 429) return '触发限流或额度用尽，请稍后重试并在服务商后台查看余额';
    if (code >= 500) return '服务商接口异常，可稍后重试；持续失败请更换服务商';
    return '';
}
function aiOutcomeStatus(outcome) {
    var matched = String(outcome || '').match(/^HTTP (\d{3})/);
    return matched ? parseInt(matched[1], 10) : 0;
}
function aiOutcomeAdvice(outcome) {
    return aiStatusAdvice(aiOutcomeStatus(outcome));
}
function aiHttpErrorDetail(response) {
    var raw = String(response && response.responseText || '');
    if (!raw) return '';
    try {
        var payload = JSON.parse(raw);
        var error = payload && (payload.error || payload);
        var message = typeof error === 'string' ? error :
            (error && (error.message || error.msg || error.detail)) || (payload && payload.message);
        if (message) return String(message).replace(/\s+/g, ' ').slice(0, 60);
    } catch (e) {}
    return '';
}
var aiFailureRecords = {};
// 最近一次请求的结束原因（含「配置测试」这种被 aiRecordRequestOutcome 排除的请求）。
// 设置面板只能拿到 ok/text，要指出「哪一栏填错了」必须把状态码带回去。
var aiLastOutcomes = {};
function aiRememberLastOutcome(requestId, outcome) {
    var list = Object.keys(aiLastOutcomes);
    if (list.length > 20) delete aiLastOutcomes[list[0]];
    aiLastOutcomes[String(requestId || '配置测试')] = String(outcome || '');
}
function aiLastFailureAdvice(requestId) {
    var outcome = aiLastOutcomes[String(requestId || '配置测试')];
    var status = aiOutcomeStatus(outcome);
    var advice = aiStatusAdvice(status);
    if (!advice) return '';
    return 'HTTP ' + status + ' · ' + advice;
}
// 同一个配置问题会让每道题都失败一次，逐题重复同一条建议只会把日志刷满。
// 连续第 3 次命中同一条建议时提示一次根因，之后静默，等结论变了再重新计数。
var aiAdviceStreak = { advice: '', count: 0 };
function aiTrackAdviceStreak(outcome) {
    var advice = aiOutcomeAdvice(outcome);
    if (!advice) { aiAdviceStreak.advice = ''; aiAdviceStreak.count = 0; return; }
    if (aiAdviceStreak.advice === advice) aiAdviceStreak.count += 1;
    else { aiAdviceStreak.advice = advice; aiAdviceStreak.count = 1; }
    if (aiAdviceStreak.count === 3) {
        aiTrace('连续 3 次 AI 请求都因同一配置问题失败：' + advice + '（同类失败已合并，修好前后续题目仍会跳过）', 'warn');
    }
}
// 记录每个请求实际发生的尝试次数，供 aiBeginQuestion 收尾日志显示「AI 共 N 次尝试」。
var aiAttemptTotals = {};
function aiTrackRequestAttempts(requestId, attempts) {
    var key = String(requestId || '');
    if (!key || key === '配置测试') return;
    aiAttemptTotals[key] = attempts || 0;
    var keys = Object.keys(aiAttemptTotals);
    if (keys.length > 40) delete aiAttemptTotals[keys[0]];
}
function aiQuestionAttempts(requestId) {
    return aiAttemptTotals[String(requestId || '')] || 0;
}
function aiRecordRequestOutcome(requestId, outcome, attempts) {
    var key = String(requestId || '');
    if (!key || key === '配置测试') return;
    if (!outcome) { delete aiFailureRecords[key]; return; }
    var keys = Object.keys(aiFailureRecords);
    if (keys.length > 40) delete aiFailureRecords[keys[0]];
    aiFailureRecords[key] = { outcome: outcome, attempts: attempts || 0 };
}
function aiFailureHint(requestId) {
    var record = aiFailureRecords[String(requestId || '')];
    if (!record) return '';
    if (aiIsTransientFailure(record.outcome)) {
        return '模型接口暂时不可用（' + record.outcome + '）' +
            (record.attempts > 0 ? '，已重试 ' + record.attempts + ' 次' : '，可在 LLM 设置中调高失败重试次数');
    }
    // 4xx 不会自愈，重试只会浪费时间：直接告诉用户该改配置的哪一栏。
    // 前缀保留上游原文（record.outcome 里已带错误体摘要），便于用户对照服务商文档。
    var advice = aiStatusAdvice(aiOutcomeStatus(record.outcome));
    if (!advice) return '';
    return record.outcome + '：' + advice;
}
function aiRequest(data, cfgOverride) {
    return new Promise(function (resolve) {
        var cfg = cfgOverride || aiCfg();
        var endpoint = aiEndpoint(cfg.url);
        var question = String((data && data.question) || "").trim();
        if (!endpoint || question === "") { resolve(""); return; }
        if (!cfgOverride && cfg.mode === "off") { resolve(""); return; }
        var finished = false;
        var started = Date.now();
        var budget = aiTotalBudget(cfg);
        var requestId = data && data.requestMeta && data.requestMeta.requestId || '配置测试';
        var retryLimit = parseInt(cfg.retries, 10);
        retryLimit = isFinite(retryLimit) && retryLimit > 0 ? Math.min(retryLimit, 5) : 0;
        var attempt = 0;
        var slotLimit = aiSlotLimit(cfg);
        var queuedForSlot = aiRequestSlots.active >= slotLimit;
        var requestProfile = aiRequestProfile(data, cfg, retryLimit, slotLimit);
        var requestBrief = aiRequestTag(data);
        var requestRef = aiRequestRef(requestId, data);
        aiTrace('AI 请求 ' + requestRef + (queuedForSlot ?
            '排队等待槽位（' + aiRequestSlots.active + '/' + aiRequestSlots.limit + ' 占用中）：' : '开始：') + requestBrief + '；' + requestProfile);
        var requestHandle = null;
        var watchdog = null;
        var retryTimer = null;
        var connectTimer = null;
        var responseStarted = false;
        var slotHeld = false;
        var clearTimers = function () {
            if (watchdog !== null) clearTimeout(watchdog);
            if (retryTimer !== null) clearTimeout(retryTimer);
            if (connectTimer !== null) clearTimeout(connectTimer);
            watchdog = retryTimer = connectTimer = null;
        };
        var done = function (txt, cacheHit, cacheMiss, outcome) {
            if (!finished) {
                finished = true;
                clearTimers();
                var costText = ((Date.now() - started) / 1000).toFixed(1) + 's';
                var replyInfo = txt ? '，回复 ' + String(txt).length + ' 字' : '';
                var cacheInfo = cacheHit || cacheMiss ? '，缓存命中 ' + (cacheHit || 0) + '/' + ((cacheHit || 0) + (cacheMiss || 0)) : '';
                // 一次「请求超时 + 重试」的总耗时会远大于单次超时设置，这里直接摊开说明，
                // 否则容易误以为超时参数没生效。
                var timeoutNote = !txt && attempt > 1 && /请求超时|本地等待超时|连接超时/.test(String(outcome || '')) ?
                    '；单次超时 ' + cfg.timeout + 'ms，' + attempt + ' 次尝试均未拿到回复' : '';
                aiTrace('AI 请求 ' + requestRef + (txt ? '完成：' : '失败：') +
                    (outcome || (txt ? '有回复' : '无回复')) + '（' + requestBrief + '）' + replyInfo +
                    '，耗时 ' + costText + (attempt > 1 ? '，共 ' + attempt + ' 次尝试（重试 ' + (attempt - 1) + ' 次）' : '') +
                    timeoutNote + cacheInfo, txt ? 'info' : 'warn');
                aiRecordRequestOutcome(requestId, txt ? '' : outcome, attempt > 1 ? attempt - 1 : 0);
                aiTrackRequestAttempts(requestId, attempt);
                aiRememberLastOutcome(requestId, txt ? '' : outcome);
                if (!txt) aiTrackAdviceStreak(outcome);
                else { aiAdviceStreak.advice = ''; aiAdviceStreak.count = 0; }
                if (!cfgOverride) {
                    try { aiStatAdd(!!txt, Date.now() - started, question, cacheHit, cacheMiss); } catch (e) {}
                }
                if (slotHeld) { slotHeld = false; aiReleaseRequestSlot(); }
                resolve(txt);
            }
        };
        var settle = function (txt, cacheHit, cacheMiss, outcome) {
            if (finished) return;
            if (watchdog !== null) { clearTimeout(watchdog); watchdog = null; }
            if (connectTimer !== null) { clearTimeout(connectTimer); connectTimer = null; }
            requestHandle = null;
            if (!txt && attempt - 1 < retryLimit && aiIsRetryableOutcome(outcome)) {
                var retryIndex = attempt;
                var delay = aiRetryDelay(retryIndex);
                // 剩余预算不足以再跑一轮时直接收工，避免把整场考试拖死。
                if (Date.now() - started + delay + 1500 >= budget) {
                    done(txt, cacheHit, cacheMiss, (outcome || '无回复') + '，已达单题等待上限 ' + Math.round(budget / 1000) + 's');
                    return;
                }
                console.warn('[AI] 请求失败，准备重试', outcome, delay);
                aiTrace('AI 请求 ' + requestRef + '第 ' + retryIndex + ' 次尝试失败（' + requestBrief + '）：' + (outcome || '无回复') +
                    '，' + delay + 'ms 后开始第 ' + (retryIndex + 1) + ' 次重试（还剩 ' + (retryLimit - retryIndex + 1) + ' 次机会，单题总等待上限 ' +
                    Math.round(budget / 1000) + 's）', 'warn');
                retryTimer = setTimeout(startAttempt, delay);
                return;
            }
            done(txt, cacheHit, cacheMiss, outcome);
        };
        function startAttempt() {
            retryTimer = null;
            requestHandle = null;
            responseStarted = false;
            attempt += 1;
            if (attempt > 1) {
                aiTrace('AI 请求 ' + requestRef + '第 ' + attempt + ' 次尝试开始（共 ' + (retryLimit + 1) + ' 次），已等待 ' +
                    ((Date.now() - started) / 1000).toFixed(1) + 's，' + requestProfile);
            }
            // 单次超时同时受单题总预算约束，剩余时间不足时用更短的窗口收尾。
            var remaining = budget - (Date.now() - started);
            var attemptTimeout = Math.min(cfg.timeout, Math.max(1000, remaining - 1000));
            watchdog = setTimeout(function () {
                var handle = requestHandle;
                console.warn('[AI] 请求等待超时', attemptTimeout);
                settle('', null, null, '本地等待超时');
                try {
                    if (handle && typeof handle.abort === 'function') handle.abort();
                } catch (error) {
                    console.warn('[AI] 中止超时请求失败', error);
                }
            }, attemptTimeout + 1000);
            // 连接阶段单独限时：离线时 3～5s 内快速失败；在线但响应慢时继续等满单次超时，
            // 避免把 5～12s 才返回的正常请求误杀。
            connectTimer = setTimeout(function () {
                if (responseStarted) return;
                connectTimer = null;
                var offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;
                if (!offline) {
                    aiTrace('AI 请求 ' + requestRef + '连接较慢（已 ' + AI_CONNECT_TIMEOUT_MS + 'ms 未收到响应头），继续等到单次超时 ' +
                        attemptTimeout + 'ms');
                    return;
                }
                var handle = requestHandle;
                console.warn('[AI] 连接超时', AI_CONNECT_TIMEOUT_MS);
                settle('', null, null, '连接超时');
                try {
                    if (handle && typeof handle.abort === 'function') handle.abort();
                } catch (error) {}
            }, Math.min(AI_CONNECT_TIMEOUT_MS, attemptTimeout));
            try {
                requestHandle = sendRequest();
            } catch (e) {
                console.log("[AI] 调用异常", e);
                settle("", null, null, '请求启动异常');
            }
        }
        function markResponding(readyState) {
            // readyState 1 只代表请求已打开，只有 >=2 才算真正连上并收到响应头。
            if (readyState != null && readyState < 2) return;
            responseStarted = true;
            if (connectTimer !== null) { clearTimeout(connectTimer); connectTimer = null; }
        }
        function sendRequest() {
            return GM_xmlhttpRequest({
                method: "POST",
                url: endpoint,
                timeout: Math.min(cfg.timeout, Math.max(1000, budget - (Date.now() - started) - 1000)),
                headers: headers,
                data: JSON.stringify(body),
                onprogress: function () { markResponding(); },
                onreadystatechange: function (r) { markResponding(r && r.readyState); },
                onload: function (r) {
                    markResponding();
                    var status = Number(r && r.status) || 0;
                    if (status < 200 || status >= 300) {
                        var detail = aiHttpErrorDetail(r);
                        // 失败原因必须同时进控制台：用户点开 F12 就能看到上游到底说了什么，
                        // 而面板日志只留一句短提示，避免刷屏。
                        console.warn('[AI] 请求返回 HTTP ' + status, detail || '(上游未返回错误说明)');
                        settle('', null, null, 'HTTP ' + status + (detail ? '（' + detail + '）' : ''));
                        return;
                    }
                    var txt = "", cacheHit = null, cacheMiss = null;
                    var rawText = (r && r.responseText) || "";
                    try {
                        var raw = JSON.parse(rawText);
                        txt = aiExtractText(raw, cfg);
                        if (raw && raw.usage && typeof raw.usage === "object") {
                            if (raw.usage.prompt_cache_hit_tokens != null) cacheHit = parseInt(raw.usage.prompt_cache_hit_tokens, 10) || 0;
                            if (raw.usage.prompt_cache_miss_tokens != null) cacheMiss = parseInt(raw.usage.prompt_cache_miss_tokens, 10) || 0;
                        }
                    } catch (e) {
                        console.log("[AI] 非标准JSON响应，尝试按SSE流式解析");
                    }
                    if (!txt && /(^|\n)\s*data:/.test(rawText)) {
                        txt = aiExtractSse(rawText);
                    }
                    if (!txt && rawText) {
                        try {
                            txt = aiExtractText(JSON.parse(rawText), { responsePath: "choices.0.delta.content" });
                        } catch (e2) {}
                    }
                    settle(txt, cacheHit, cacheMiss, 'HTTP ' + status + (txt ? '' : '，无可用内容'));
                },
                onerror: function (e) { console.log("[AI] 请求失败", e); settle("", null, null, '网络错误'); },
                ontimeout: function () { console.log("[AI] 请求超时"); settle("", null, null, '请求超时'); }
            });
        }
        var headers = { "Content-Type": "application/json" };
        if (cfg.key) headers["Authorization"] = "Bearer " + cfg.key;
        var extraHeaders = aiJsonParse(cfg.headersJson, null);
        if (extraHeaders) {
            for (var h in extraHeaders) {
                if (!Object.prototype.hasOwnProperty.call(extraHeaders, h)) continue;
                headers[h] = String(extraHeaders[h]);
            }
        }
        var body = {
            model: cfg.model,
            messages: aiBuildMessages(data, cfg),
            temperature: cfg.temperature,
            max_tokens: cfg.maxTokens,
            stream: false
        };
        var extraBody = aiJsonParse(cfg.bodyJson, null);
        if (extraBody) {
            for (var b in extraBody) {
                if (!Object.prototype.hasOwnProperty.call(extraBody, b)) continue;
                body[b] = extraBody[b];
            }
        }
        slotHeld = true;
        aiAcquireRequestSlot(function () { startAttempt(); }, slotLimit);
    });
}
function aiModelAnswer(data) {
    return aiRequest(data).then(function (text) {
        var ans = text ? aiParseAnswer(text, data) : [];
        console.log("[AI]", data && data.requestMeta || {}, "题目：", (data && data.question) || "", "选项：", data && data.options || [], "模型输出：", text, "解析答案：", ans);
        var requestRef = aiRequestRef((data && data.requestMeta && data.requestMeta.requestId) || '配置测试', data);
        var head = 'AI 答案 ' + requestRef + '（' + aiTypeName(data && data.type) + '）';
        if (ans.length) {
            aiTrace(head + '解析出 ' + ans.length + ' 项：' + aiClip(ans.join(' / '), 40), 'info');
        } else {
            var raw = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
            var reason = raw ? '模型原文「' + aiClip(raw, 28) + '」' : '模型无回复（见上面该请求的结束日志）';
            if (raw) {
                // 回复很长却映射不出选项，基本是模型（尤其是推理模型）输出了思考过程，
                // 这里直接点明怎么改，避免用户反复重试同一道题。
                reason += raw.length > 200 ?
                    '；回复长达 ' + raw.length + ' 字且无可识别选项，疑似输出了推理过程，建议换用非推理模型或在提示词中强调「只输出选项字母」' :
                    '；未解析出可映射的选项字母';
            }
            aiTrace(head + '解析出 0 项：' + reason, 'warn');
        }
        return ans;
    });
}
function aiTestConnection(cfg, done) {
    var started = Date.now();
    aiRequest({ question: "请只回复 OK", options: [], type: 4 }, cfg).then(function (text) {
        done({ ok: !!text, text: (text || "").slice(0, 200), ms: Date.now() - started });
    });
}
function aiModelsEndpoint(base) {
    var u = String(base || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    u = u.replace(/\/+$/, "");
    if (/\/models$/i.test(u)) return u;
    if (/\/chat\/completions$/i.test(u)) return u.replace(/\/chat\/completions$/i, "/models");
    if (/\/v\d+(\/)?$/i.test(u)) return u + "/models";
    return u + "/v1/models";
}
function aiListModels(cfg, done) {
    var endpoint = aiModelsEndpoint(cfg && cfg.url);
    if (!endpoint) { done({ ok: false, msg: "接口地址为空或无效" }); return; }
    var headers = { "Accept": "application/json" };
    if (cfg.key) headers["Authorization"] = "Bearer " + cfg.key;
    var extraHeaders = aiJsonParse(cfg.headersJson, null);
    if (extraHeaders) {
        for (var h in extraHeaders) {
            if (Object.prototype.hasOwnProperty.call(extraHeaders, h)) headers[h] = String(extraHeaders[h]);
        }
    }
    try {
        GM_xmlhttpRequest({
            method: "GET",
            url: endpoint,
            timeout: cfg.timeout,
            headers: headers,
            onload: function (r) {
                var status = (r && r.status) || 0;
                var payload;
                try { payload = JSON.parse((r && r.responseText) || ""); } catch (e) { payload = null; }
                if (status < 200 || status >= 300) {
                    var errorMsg = payload && payload.error && (payload.error.message || payload.error.msg);
                    var listAdvice = aiStatusAdvice(status);
                    done({ ok: false, msg: "获取模型失败（HTTP " + status + "）" + (errorMsg ? "：" + errorMsg : listAdvice ? "：" + listAdvice : "") });
                    return;
                }
                var rows = [];
                if (payload && Array.isArray(payload.data)) rows = payload.data;
                else if (payload && Array.isArray(payload.models)) rows = payload.models;
                else if (payload && payload.result && Array.isArray(payload.result.data)) rows = payload.result.data;
                else if (payload && payload.result && Array.isArray(payload.result.models)) rows = payload.result.models;
                else if (Array.isArray(payload)) rows = payload;
                var models = rows.map(function (item) {
                    return typeof item === "string" ? item : String(item && (item.id || item.name || item.model || item.display_name) || "").trim();
                }).filter(Boolean);
                models = models.filter(function (model, index) { return models.indexOf(model) === index; });
                if (!models.length) {
                    done({ ok: false, msg: "接口未返回可用模型（HTTP " + status + "）" });
                    return;
                }
                done({ ok: true, models: models, msg: "已获取 " + models.length + " 个模型" });
            },
            onerror: function () { done({ ok: false, msg: "获取模型失败，请检查 URL、Key 或网络" }); },
            ontimeout: function () { done({ ok: false, msg: "获取模型超时，请检查接口地址" }); }
        });
    } catch (e) {
        done({ ok: false, msg: "获取模型异常：" + e });
    }
}
function aiChat(messages, done) {
    var cfg = aiCfg();
    var endpoint = aiEndpoint(cfg.url);
    if (!endpoint) { done({ ok: false, msg: "请先在「LLM 设置」里填写接口地址并保存" }); return; }
    var headers = { "Content-Type": "application/json" };
    if (cfg.key) headers["Authorization"] = "Bearer " + cfg.key;
    var extraHeaders = aiJsonParse(cfg.headersJson, null);
    if (extraHeaders) {
        for (var h in extraHeaders) {
            if (Object.prototype.hasOwnProperty.call(extraHeaders, h)) headers[h] = String(extraHeaders[h]);
        }
    }
    var body = { model: cfg.model, messages: messages, temperature: cfg.temperature, max_tokens: cfg.maxTokens, stream: false };
    var extraBody = aiJsonParse(cfg.bodyJson, null);
    if (extraBody) {
        for (var b in extraBody) {
            if (Object.prototype.hasOwnProperty.call(extraBody, b)) body[b] = extraBody[b];
        }
    }
    var finished = false;
    var reply = function (obj) { if (!finished) { finished = true; done(obj); } };
    try {
        GM_xmlhttpRequest({
            method: "POST",
            url: endpoint,
            timeout: cfg.timeout,
            headers: headers,
            data: JSON.stringify(body),
            onload: function (r) {
                var text = "";
                var rawText = (r && r.responseText) || "";
                try { text = aiExtractText(JSON.parse(rawText), cfg); } catch (e) {}
                if (!text && /(^|\n)\s*data:/.test(rawText)) { try { text = aiExtractSse(rawText); } catch (e2) {} }
                reply({ ok: !!text, text: text, msg: text ? "" : ("接口无有效返回（HTTP " + ((r && r.status) || 0) + "），请检查 LLM 设置") });
            },
            onerror: function () { reply({ ok: false, msg: "网络请求失败，请检查网络或接口地址" }); },
            ontimeout: function () { reply({ ok: false, msg: "请求超时，请检查接口地址/网络" }); }
        });
    } catch (e) {
        reply({ ok: false, msg: "调用异常：" + e });
    }
}
function aiSettingHost() {
    var W = (typeof unsafeWindow !== "undefined" && unsafeWindow) ? unsafeWindow : window;
    var topWin = W;
    var localDoc = null;
    var topDoc = null;
    try {
        localDoc = W.document;
        topWin = W.top || W;
        topDoc = topWin.document;
    } catch (e) {
        topWin = W;
        try { localDoc = W.document; } catch (e2) { localDoc = document; }
    }
    try {
        if (localDoc && localDoc.getElementById("llmSettingsContainer")) return { win: W, doc: localDoc };
    } catch (e) {}
    try {
        if (topDoc && topDoc.getElementById("llmSettingsContainer")) return { win: topWin, doc: topDoc };
    } catch (e) {}
    return { win: topWin, doc: topDoc || localDoc };
}
function aiSettingHtml() {
    return XXT_UI.settingsHtml();
}
function aiCloseSettingWindow() {
    var host = aiSettingHost();
    var doc = host && host.doc ? host.doc : null;
    var card = (doc && doc.getElementById ? doc.getElementById(AI_SETTING_CARD_ID) : null) || AI_SETTING_CARD;
    if (card) { aiTeardownSettingCard(card); return; }
    if (!host || !host.doc) return;
    aiShowSettingTab(host, "log");
}
function aiTeardownSettingCard(card) {
    if (AI_SETTING_HANDLER) {
        var hostWin = (card && card.ownerDocument && card.ownerDocument.defaultView) ||
            (typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window);
        try { hostWin.removeEventListener("message", AI_SETTING_HANDLER, false); } catch (e) {}
        AI_SETTING_HANDLER = null;
    }
    if (card && card.parentNode) card.parentNode.removeChild(card);
    AI_SETTING_CARD = null;
    AI_SETTING_FRAME = null;
}
// 考试/作业页没有主面板（拿不到 #llmSettingsContainer），这里用可拖动浮层卡片承载同一份设置表单。
function aiDragSettingCard(card, handle) {
    var doc = card.ownerDocument;
    var win = (doc && doc.defaultView) || window;
    var active = null;
    var move = function (event) {
        if (!active || event.pointerId !== active.pointerId) return;
        var maxLeft = Math.max(0, win.innerWidth - card.offsetWidth);
        var maxTop = Math.max(0, win.innerHeight - Math.min(card.offsetHeight, 48));
        card.style.left = Math.min(maxLeft, Math.max(0, active.left + event.clientX - active.x)) + "px";
        card.style.top = Math.min(maxTop, Math.max(0, active.top + event.clientY - active.y)) + "px";
        card.style.right = "auto";
    };
    var finish = function (event) {
        if (!active || event.pointerId !== active.pointerId) return;
        active = null;
        win.removeEventListener("pointermove", move, true);
        win.removeEventListener("pointerup", finish, true);
        win.removeEventListener("pointercancel", finish, true);
    };
    handle.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        var rect = card.getBoundingClientRect();
        active = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
        win.addEventListener("pointermove", move, true);
        win.addEventListener("pointerup", finish, true);
        win.addEventListener("pointercancel", finish, true);
    });
}
function aiCreateSettingCard(doc) {
    if (!doc || !doc.body) return null;
    var card = doc.createElement("div");
    card.id = AI_SETTING_CARD_ID;
    card.style.cssText = "position:fixed;top:12px;right:12px;width:600px;max-width:calc(100vw - 24px);" +
        "height:840px;max-height:calc(100vh - 24px);display:flex;flex-direction:column;background:#fff;" +
        "border:1px solid #d8e2ed;border-radius:10px;box-shadow:0 18px 48px rgba(15,32,52,.28);" +
        "z-index:2147483000;overflow:hidden;font:12px/1.5 'Microsoft YaHei',Arial,sans-serif;color:#263445;";
    var head = doc.createElement("div");
    head.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;" +
        "background:#f3f7fc;border-bottom:1px solid #e4eaf0;cursor:grab;touch-action:none;user-select:none;flex:none;";
    var title = doc.createElement("strong");
    title.textContent = "LLM 设置（第三方模型辅助）";
    title.style.cssText = "font-size:13px;color:#263445;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
    var close = doc.createElement("button");
    close.type = "button";
    close.title = "关闭";
    close.setAttribute("aria-label", "关闭 LLM 设置");
    close.textContent = "×";
    close.style.cssText = "flex:none;width:24px;height:24px;padding:0;border:1px solid #dfe6ee;border-radius:6px;" +
        "background:#fff;color:#617184;font-size:16px;line-height:20px;cursor:pointer;";
    close.addEventListener("click", function () { aiCloseSettingWindow(); });
    head.appendChild(title);
    head.appendChild(close);
    var body = doc.createElement("div");
    body.style.cssText = "flex:1;min-height:0;position:relative;overflow:hidden;background:#f3f6f9;";
    card.appendChild(head);
    card.appendChild(body);
    card.__aiMount = body;
    doc.body.appendChild(card);
    aiDragSettingCard(card, head);
    AI_SETTING_CARD = card;
    return card;
}
function aiSettingMount(doc, host, silent) {
    var container = doc.getElementById("llmSettingsContainer");
    if (container) {
        // silent 用于页面渲染时预挂载：只把表单填进容器，不接管滚动位置，
        // 否则主面板一渲染就会把用户视线拽到 LLM 区域。
        if (!silent) aiShowSettingTab(host, "llm");
        return container;
    }
    var card = doc.getElementById(AI_SETTING_CARD_ID) || AI_SETTING_CARD;
    if (!card || !card.parentNode) card = aiCreateSettingCard(doc);
    if (!card) return null;
    card.style.zIndex = "2147483000";
    return card.__aiMount || card;
}
function aiShowSettingTab(host, name) {
    if (!host || !host.doc) return;
    try {
        if (host.win && typeof host.win.xxtShowSection === "function") {
            host.win.xxtShowSection(name);
            return;
        }
        if (host.win && typeof host.win.xxtShowTab === "function") {
            host.win.xxtShowTab(name);
            return;
        }
    } catch (e) {}
    // LLM 表单已并进顶部「任务配置」，没有独立的 llm 区块可滚了，退回到配置面板本身。
    var target = host.doc.querySelector('.xxt-section[data-pane="' + name + '"]') ||
        (name === "llm" ? host.doc.getElementById("normalQuery") : null);
    if (target && typeof target.scrollIntoView === "function") {
        try { target.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e2) {}
    }
}
// silent 模式供页面渲染后立即预挂载：容器里只有占位文字时用户会一直看到
// “正在加载 LLM 配置…”，必须由脚本主动把表单塞进去，不能等用户点。
function openAiSettingWindow(silent) {
    var host = aiSettingHost();
    if (!host || !host.doc || !host.doc.body) {
        if (!silent) { try { alert("页面尚未加载完成，请稍后再试"); } catch (e) {} }
        return null;
    }
    var doc = host.doc;
    var win = host.win;
    var inCard = !doc.getElementById("llmSettingsContainer");
    var mount = aiSettingMount(doc, host, silent);
    if (!mount) {
        if (!silent) { try { alert("页面尚未加载完成，请稍后再试"); } catch (e) {} }
        return null;
    }
    var old = doc.getElementById(AI_SETTING_NODE_ID);
    if (old) {
        AI_SETTING_FRAME = old;
        return old;
    }
    var iframe = doc.createElement("iframe");
    iframe.id = AI_SETTING_NODE_ID;
    iframe.title = "LLM 配置";
    iframe.setAttribute("frameborder", "0");
    iframe.style.cssText = inCard ?
        "position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:0;display:block;background:#f3f6f9;" :
        "width:100%;min-height:520px;border:0;display:block;background:#f3f6f9;";
    AI_SETTING_FRAME = iframe;
    iframe.onload = function () {
        try {
            iframe.contentWindow.aiSetValues(aiCfgSnapshot());
            try { iframe.contentWindow.aiShowStats(aiStatsText()); } catch (e) {}
            if (inCard) {
                var back = iframe.contentDocument && iframe.contentDocument.getElementById("close");
                if (back) back.textContent = "关闭卡片";
            }
        } catch (e) {}
    };
    var aiNonce = "ai" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    iframe.srcdoc = aiSettingHtml().replace("__AI_NONCE__", aiNonce);
    mount.textContent = "";
    mount.appendChild(iframe);
    if (AI_SETTING_HANDLER) {
        try { win.removeEventListener("message", AI_SETTING_HANDLER, false); } catch (e) {}
    }
    var handler = function (ev) {
        var d = ev && ev.data;
        if (!d || ev.source !== iframe.contentWindow || d.__xxtAiSetting !== true || !aiNonce || d.nonce !== aiNonce) return;
        var reply = function (obj) {
            try { iframe.contentWindow.aiReply(obj); } catch (e) {}
        };
        if (d.type === "close") {
            aiCloseSettingWindow();
            return;
        }
        if (d.type === "save") {
            var data = d.data || {};
            var errs = [];
            if (data.headers_json) { try { JSON.parse(data.headers_json); } catch (e) { errs.push("额外请求头 不是合法JSON"); } }
            if (data.body_json) { try { JSON.parse(data.body_json); } catch (e) { errs.push("额外请求体 不是合法JSON"); } }
            if (errs.length) { reply({ ok: false, msg: errs.join("；") }); return; }
            var cfg = aiCfgFromData(data);
            if (cfg.mode !== "off" && !aiEndpoint(cfg.url)) { reply({ ok: false, msg: "已启用 AI，但接口地址为空或无效" }); return; }
            // 填了地址和 Key 却把下拉框留在「关闭」是最常见的配置失误：只要这次保存改动了地址或 Key，就按开启处理并明确告知。
            // 用「凭据是否变化」当判据，才能保证之后把下拉框改回关闭再保存时不会被反复打开。
            var autoEnabled = false;
            var prevUrl = aiEndpoint(String(GM_getValue("ai_url", "") || "").trim());
            var prevKey = String(GM_getValue("ai_key", "") || "").trim();
            var credChanged = aiEndpoint(cfg.url) !== prevUrl || cfg.key !== prevKey;
            if (cfg.mode === "off" && credChanged && aiEndpoint(cfg.url) && cfg.key) {
                cfg.mode = "first";
                autoEnabled = true;
            }
            GM_setValue("ai_mode", cfg.mode);
            GM_setValue("ai_enable", cfg.mode !== "off");
            GM_setValue("ai_first", cfg.mode === "first");
            GM_setValue("ai_url", cfg.url);
            GM_setValue("ai_key", cfg.key);
            GM_setValue("ai_model", cfg.model);
            GM_setValue("ai_timeout", cfg.timeout);
            GM_setValue("ai_temperature", cfg.temperature);
            GM_setValue("ai_max_tokens", cfg.maxTokens);
            GM_setValue("ai_retries", cfg.retries);
            GM_setValue("ai_concurrency", cfg.concurrency);
            GM_setValue("ai_system_prompt", cfg.systemPrompt);
            GM_setValue("ai_user_prompt", cfg.userPrompt);
            GM_setValue("ai_headers_json", cfg.headersJson);
            GM_setValue("ai_body_json", cfg.bodyJson);
            GM_setValue("ai_response_path", cfg.responsePath);
            GM_setValue("ai_skip_answered", data.skip_answered ? 1 : 0);
            reply({ ok: true, msg: (autoEnabled ? "已保存并启用：" : "已保存：") + aiModeLabel(cfg), values: aiCfgSnapshot(cfg) });
            try { iframe.contentWindow.aiShowStats(aiStatsText()); } catch (e) {}
            aiNotifyStatus(aiStatusText(cfg));
            return;
        }
        if (d.type === "models") {
            var modelCfg = aiCfgFromData(d.data || {});
            reply({ pending: true, msg: "正在获取模型列表，请稍候…" });
            aiListModels(modelCfg, function (res) {
                reply(res);
            });
            return;
        }
        if (d.type === "test") {
            var testCfg = aiCfgFromData(d.data || {});
            if (!aiEndpoint(testCfg.url)) { reply({ ok: false, msg: "接口地址为空或无效" }); return; }
            reply({ pending: true, msg: "正在请求模型，请稍候（最长 " + Math.round(testCfg.timeout / 1000) + " 秒）…" });
            aiTestConnection(testCfg, function (res) {
                if (res.ok) {
                    reply({ ok: true, msg: "连接成功（" + res.ms + "ms）\n模型返回：" + res.text });
                } else {
                    var advice = aiLastFailureAdvice('配置测试');
                    reply({ ok: false, msg: "连接失败：" + (advice || "接口无有效返回（检查地址/Key/模型名/网络，以及油猴的 @connect 权限）") });
                }
            });
        }
        if (d.type === "export_cfg") {
            var dumped = "";
            try { dumped = aiBackupExport(); } catch (e) { dumped = ""; }
            if (!dumped) { reply({ ok: false, msg: "导出失败，请刷新页面重试" }); return; }
            reply({ ok: true, exported: dumped, msg: "已导出当前配置，请复制上方文本保存" });
            return;
        }
        if (d.type === "import_cfg") {
            var imported = aiBackupImport(d.text);
            reply(imported);
            if (imported.ok) {
                try { iframe.contentWindow.aiShowStats(aiStatsText()); } catch (e) {}
                aiNotifyStatus(aiStatusText());
            }
            return;
        }
        if (d.type === "reset_stats") {
            try { GM_setValue("ai_stat", ""); } catch (e) {}
            aiNotifyStatus(aiStatusText());
            reply({ ok: true, msg: "AI 调用统计已重置" });
            try { iframe.contentWindow.aiShowStats(aiStatsText()); } catch (e) {}
            return;
        }
    };
    win.addEventListener("message", handler, false);
    AI_SETTING_HANDLER = handler;
    iframe.__aiHandler = handler;
    return iframe;
}
// ==================== 第三方 AI 模块结束 ====================

// ==================== 单实例运行检测（独立实现） ====================
// 同一顶层窗口内通过心跳租约保证只有一个助手实例持有执行权；心跳过期会释放租约，
// 避免旧实例异常退出后永远无法再次运行。
var XXT_RUN_LEASE_KEY = "__xxtAssistantLease";
var __XXT_DUP__ = (function () {
    var W;
    try {
        W = (typeof unsafeWindow !== "undefined" && unsafeWindow) ? unsafeWindow : window;
        if (W.top !== W) return false;
        var now = Date.now(),
            lease = {
                owner: "i" + now.toString(36) + Math.random().toString(36).slice(2),
                seen: now,
                ttl: 30000
            };
        var registry = {};
        var current = W[XXT_RUN_LEASE_KEY];
        if (current && typeof current === "object") {
            registry[current.owner] = { seen: Number(current.seen) || 0 };
        }
        var result = xxtRegisterRun(registry, lease.owner, now, lease.ttl);
        if (result.duplicate) {
            try {
                alert("【超星学习通助手】\n这个页面已经有助手实例在运行，可能是安装了重复脚本，或同时开启了多个脚本管理器。\n请保留一个后刷新页面，否则会重复答题或重复上报进度。");
            } catch (e) {}
            return true;
        }
        W[XXT_RUN_LEASE_KEY] = lease;
        var heartbeat = setInterval(function () {
            try {
                var held = W[XXT_RUN_LEASE_KEY];
                if (held && held.owner === lease.owner) held.seen = Date.now();
            } catch (e) {}
        }, 10000);
        try {
            W.addEventListener("pagehide", function () {
                clearInterval(heartbeat);
                try {
                    var held = W[XXT_RUN_LEASE_KEY];
                    if (held && held.owner === lease.owner) delete W[XXT_RUN_LEASE_KEY];
                } catch (e) {}
            }, { once: true });
        } catch (e) {}
    } catch (e) {}
    return false;
})();


(function() {
    "use strict";
    if (__XXT_DUP__) return;
    const PANEL_NONCE = "xxtn" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const PANEL_STARTED_AT = Date.now();
    // 浮层答题面板的宽度上限。360px 时内嵌的课程页只剩 320px，视频被横向裁切，故放宽到 520px；
    // 视口更窄时按 innerWidth 再收缩，避免出现横向滚动条。
    const PANEL_WIDTH = 520;
    // ------------------------------------------------------------------------
    // 内嵌第三方库：Typr.js（TrueType/OpenType 字体解析）
    //   来源   https://github.com/photopea/Typr.js
    //   版本   v1.0.0（2016 发布，上游此后无功能性更新）
    //   许可   MIT，Copyright (c) 2016 Photopea
    //   用途   解析学习通页面内联的 base64 字体，取字形路径生成指纹，用于
    //          .font-cxsecret 加密题干的还原（见下方 removeF）
    //   为何内嵌而非 @require：上游未发布到任何 CDN 白名单源，npm 包亦无 UMD
    //          构建；经 @require 引入需要额外的跨域下载与版本漂移风险，而这里
    //          只用到 parse / U.codeToGlyph / U.glyphToPath 三个入口。
    //   MIT 全文见仓库 THIRD-PARTY-NOTICES.md 第 1 节，保留本段即满足署名要求。
    // ------------------------------------------------------------------------
    var Typr = {};
    Typr["parse"] = function(buff) {
        var readFont = function(data, idx, offset, tmap) {
            Typr["B"];
            var T = Typr["T"];
            var prsr = {
                cmap: T.cmap,
                head: T.head,
                hhea: T.hhea,
                maxp: T.maxp,
                hmtx: T.hmtx,
                name: T.name,
                "OS/2": T.OS2,
                post: T.post,
                loca: T.loca,
                kern: T.kern,
                glyf: T.glyf,
                "CFF ": T.CFF,
                "SVG ": T.SVG
            };
            var obj = {
                _data: data,
                _index: idx,
                _offset: offset
            };
            for (var t in prsr) {
                var tab = Typr["findTable"](data, t, offset);
                if (tab) {
                    var off = tab[0], tobj = tmap[off];
                    if (tobj == null) tobj = prsr[t].parseTab(data, off, tab[1], obj);
                    obj[t] = tmap[off] = tobj;
                }
            }
            return obj;
        };
        var bin = Typr["B"];
        var data = new Uint8Array(buff);
        var tmap = {};
        var tag = bin.readASCII(data, 0, 4);
        if (tag == "ttcf") {
            var offset = 4;
            bin.readUshort(data, offset);
            offset += 2;
            bin.readUshort(data, offset);
            offset += 2;
            var numF = bin.readUint(data, offset);
            offset += 4;
            var fnts = [];
            for (var i = 0; i < numF; i++) {
                var foff = bin.readUint(data, offset);
                offset += 4;
                fnts.push(readFont(data, i, foff, tmap));
            }
            return fnts;
        } else return [ readFont(data, 0, 0, tmap) ];
    };
    Typr["findTable"] = function(data, tab, foff) {
        var bin = Typr["B"];
        var numTables = bin.readUshort(data, foff + 4);
        var offset = foff + 12;
        for (var i = 0; i < numTables; i++) {
            var tag = bin.readASCII(data, offset, 4);
            bin.readUint(data, offset + 4);
            var toffset = bin.readUint(data, offset + 8);
            var length = bin.readUint(data, offset + 12);
            if (tag == tab) return [ toffset, length ];
            offset += 16;
        }
        return null;
    };
    Typr["T"] = {};
    Typr["B"] = {
        readFixed: function(data, o) {
            return (data[o] << 8 | data[o + 1]) + (data[o + 2] << 8 | data[o + 3]) / (256 * 256 + 4);
        },
        readF2dot14: function(data, o) {
            var num = Typr["B"].readShort(data, o);
            return num / 16384;
        },
        readInt: function(buff, p) {
            var a = Typr["B"].t.uint8;
            a[0] = buff[p + 3];
            a[1] = buff[p + 2];
            a[2] = buff[p + 1];
            a[3] = buff[p];
            return Typr["B"].t.int32[0];
        },
        readInt8: function(buff, p) {
            var a = Typr["B"].t.uint8;
            a[0] = buff[p];
            return Typr["B"].t.int8[0];
        },
        readShort: function(buff, p) {
            var a = Typr["B"].t.uint8;
            a[1] = buff[p];
            a[0] = buff[p + 1];
            return Typr["B"].t.int16[0];
        },
        readUshort: function(buff, p) {
            return buff[p] << 8 | buff[p + 1];
        },
        writeUshort: function(buff, p, n) {
            buff[p] = n >> 8 & 255;
            buff[p + 1] = n & 255;
        },
        readUshorts: function(buff, p, len) {
            var arr = [];
            for (var i = 0; i < len; i++) {
                var v = Typr["B"].readUshort(buff, p + i * 2);
                arr.push(v);
            }
            return arr;
        },
        readUint: function(buff, p) {
            var a = Typr["B"].t.uint8;
            a[3] = buff[p];
            a[2] = buff[p + 1];
            a[1] = buff[p + 2];
            a[0] = buff[p + 3];
            return Typr["B"].t.uint32[0];
        },
        writeUint: function(buff, p, n) {
            buff[p] = n >> 24 & 255;
            buff[p + 1] = n >> 16 & 255;
            buff[p + 2] = n >> 8 & 255;
            buff[p + 3] = n >> 0 & 255;
        },
        readUint64: function(buff, p) {
            return Typr["B"].readUint(buff, p) * (4294967295 + 1) + Typr["B"].readUint(buff, p + 4);
        },
        readASCII: function(buff, p, l) {
            var s = "";
            for (var i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
            return s;
        },
        writeASCII: function(buff, p, s) {
            for (var i = 0; i < s.length; i++) buff[p + i] = s.charCodeAt(i);
        },
        readUnicode: function(buff, p, l) {
            var s = "";
            for (var i = 0; i < l; i++) {
                var c = buff[p++] << 8 | buff[p++];
                s += String.fromCharCode(c);
            }
            return s;
        },
        _tdec: window["TextDecoder"] ? new window["TextDecoder"]() : null,
        readUTF8: function(buff, p, l) {
            var tdec = Typr["B"]._tdec;
            if (tdec && p == 0 && l == buff.length) return tdec["decode"](buff);
            return Typr["B"].readASCII(buff, p, l);
        },
        readBytes: function(buff, p, l) {
            var arr = [];
            for (var i = 0; i < l; i++) arr.push(buff[p + i]);
            return arr;
        },
        readASCIIArray: function(buff, p, l) {
            var s = [];
            for (var i = 0; i < l; i++) s.push(String.fromCharCode(buff[p + i]));
            return s;
        },
        t: function() {
            var ab = new ArrayBuffer(8);
            return {
                buff: ab,
                int8: new Int8Array(ab),
                uint8: new Uint8Array(ab),
                int16: new Int16Array(ab),
                uint16: new Uint16Array(ab),
                int32: new Int32Array(ab),
                uint32: new Uint32Array(ab)
            };
        }()
    };
    Typr["T"].CFF = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"];
            var CFF = Typr["T"].CFF;
            data = new Uint8Array(data.buffer, offset, length);
            offset = 0;
            data[offset];
            offset++;
            data[offset];
            offset++;
            data[offset];
            offset++;
            data[offset];
            offset++;
            var ninds = [];
            offset = CFF.readIndex(data, offset, ninds);
            var names = [];
            for (var i = 0; i < ninds.length - 1; i++) names.push(bin.readASCII(data, offset + ninds[i], ninds[i + 1] - ninds[i]));
            offset += ninds[ninds.length - 1];
            var tdinds = [];
            offset = CFF.readIndex(data, offset, tdinds);
            var topDicts = [];
            for (var i = 0; i < tdinds.length - 1; i++) topDicts.push(CFF.readDict(data, offset + tdinds[i], offset + tdinds[i + 1]));
            offset += tdinds[tdinds.length - 1];
            var topdict = topDicts[0];
            var sinds = [];
            offset = CFF.readIndex(data, offset, sinds);
            var strings = [];
            for (var i = 0; i < sinds.length - 1; i++) strings.push(bin.readASCII(data, offset + sinds[i], sinds[i + 1] - sinds[i]));
            offset += sinds[sinds.length - 1];
            CFF.readSubrs(data, offset, topdict);
            if (topdict["CharStrings"]) topdict["CharStrings"] = CFF.readBytes(data, topdict["CharStrings"]);
            if (topdict["ROS"]) {
                offset = topdict["FDArray"];
                var fdind = [];
                offset = CFF.readIndex(data, offset, fdind);
                topdict["FDArray"] = [];
                for (var i = 0; i < fdind.length - 1; i++) {
                    var dict = CFF.readDict(data, offset + fdind[i], offset + fdind[i + 1]);
                    CFF._readFDict(data, dict, strings);
                    topdict["FDArray"].push(dict);
                }
                offset += fdind[fdind.length - 1];
                offset = topdict["FDSelect"];
                topdict["FDSelect"] = [];
                var fmt = data[offset];
                offset++;
                if (fmt == 3) {
                    var rns = bin.readUshort(data, offset);
                    offset += 2;
                    for (var i = 0; i < rns + 1; i++) {
                        topdict["FDSelect"].push(bin.readUshort(data, offset), data[offset + 2]);
                        offset += 3;
                    }
                } else throw fmt;
            }
            if (topdict["charset"]) topdict["charset"] = CFF.readCharset(data, topdict["charset"], topdict["CharStrings"].length);
            CFF._readFDict(data, topdict, strings);
            return topdict;
        },
        _readFDict: function(data, dict, ss) {
            var CFF = Typr["T"].CFF;
            var offset;
            if (dict["Private"]) {
                offset = dict["Private"][1];
                dict["Private"] = CFF.readDict(data, offset, offset + dict["Private"][0]);
                if (dict["Private"]["Subrs"]) CFF.readSubrs(data, offset + dict["Private"]["Subrs"], dict["Private"]);
            }
            for (var p in dict) if ([ "FamilyName", "FontName", "FullName", "Notice", "version", "Copyright" ].indexOf(p) != -1) dict[p] = ss[dict[p] - 426 + 35];
        },
        readSubrs: function(data, offset, obj) {
            obj["Subrs"] = Typr["T"].CFF.readBytes(data, offset);
            var bias, nSubrs = obj["Subrs"].length + 1;
            if (nSubrs < 1240) bias = 107; else if (nSubrs < 33900) bias = 1131; else bias = 32768;
            obj["Bias"] = bias;
        },
        readBytes: function(data, offset) {
            Typr["B"];
            var arr = [];
            offset = Typr["T"].CFF.readIndex(data, offset, arr);
            var subrs = [], arl = arr.length - 1, no = data.byteOffset + offset;
            for (var i = 0; i < arl; i++) {
                var ari = arr[i];
                subrs.push(new Uint8Array(data.buffer, no + ari, arr[i + 1] - ari));
            }
            return subrs;
        },
        tableSE: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 0, 111, 112, 113, 114, 0, 115, 116, 117, 118, 119, 120, 121, 122, 0, 123, 0, 124, 125, 126, 127, 128, 129, 130, 131, 0, 132, 133, 0, 134, 135, 136, 137, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 138, 0, 139, 0, 0, 0, 0, 140, 141, 142, 143, 0, 0, 0, 0, 0, 144, 0, 0, 0, 145, 0, 0, 146, 147, 148, 149, 0, 0, 0, 0 ],
        glyphByUnicode: function(cff, code) {
            for (var i = 0; i < cff["charset"].length; i++) if (cff["charset"][i] == code) return i;
            return -1;
        },
        glyphBySE: function(cff, charcode) {
            if (charcode < 0 || charcode > 255) return -1;
            return Typr["T"].CFF.glyphByUnicode(cff, Typr["T"].CFF.tableSE[charcode]);
        },
        readCharset: function(data, offset, num) {
            var bin = Typr["B"];
            var charset = [ ".notdef" ];
            var format = data[offset];
            offset++;
            if (format == 0) {
                for (var i = 0; i < num; i++) {
                    var first = bin.readUshort(data, offset);
                    offset += 2;
                    charset.push(first);
                }
            } else if (format == 1 || format == 2) {
                while (charset.length < num) {
                    var first = bin.readUshort(data, offset);
                    offset += 2;
                    var nLeft = 0;
                    if (format == 1) {
                        nLeft = data[offset];
                        offset++;
                    } else {
                        nLeft = bin.readUshort(data, offset);
                        offset += 2;
                    }
                    for (var i = 0; i <= nLeft; i++) {
                        charset.push(first);
                        first++;
                    }
                }
            } else throw "error: format: " + format;
            return charset;
        },
        readIndex: function(data, offset, inds) {
            var bin = Typr["B"];
            var count = bin.readUshort(data, offset) + 1;
            offset += 2;
            var offsize = data[offset];
            offset++;
            if (offsize == 1) for (var i = 0; i < count; i++) inds.push(data[offset + i]); else if (offsize == 2) for (var i = 0; i < count; i++) inds.push(bin.readUshort(data, offset + i * 2)); else if (offsize == 3) for (var i = 0; i < count; i++) inds.push(bin.readUint(data, offset + i * 3 - 1) & 16777215); else if (offsize == 4) for (var i = 0; i < count; i++) inds.push(bin.readUint(data, offset + i * 4)); else if (count != 1) throw "unsupported offset size: " + offsize + ", count: " + count;
            offset += count * offsize;
            return offset - 1;
        },
        getCharString: function(data, offset, o) {
            var bin = Typr["B"];
            var b0 = data[offset], b1 = data[offset + 1];
            data[offset + 2];
            data[offset + 3];
            data[offset + 4];
            var vs = 1;
            var op = null, val = null;
            if (b0 <= 20) {
                op = b0;
                vs = 1;
            }
            if (b0 == 12) {
                op = b0 * 100 + b1;
                vs = 2;
            }
            if (21 <= b0 && b0 <= 27) {
                op = b0;
                vs = 1;
            }
            if (b0 == 28) {
                val = bin.readShort(data, offset + 1);
                vs = 3;
            }
            if (29 <= b0 && b0 <= 31) {
                op = b0;
                vs = 1;
            }
            if (32 <= b0 && b0 <= 246) {
                val = b0 - 139;
                vs = 1;
            }
            if (247 <= b0 && b0 <= 250) {
                val = (b0 - 247) * 256 + b1 + 108;
                vs = 2;
            }
            if (251 <= b0 && b0 <= 254) {
                val = -(b0 - 251) * 256 - b1 - 108;
                vs = 2;
            }
            if (b0 == 255) {
                val = bin.readInt(data, offset + 1) / 65535;
                vs = 5;
            }
            o.val = val != null ? val : "o" + op;
            o.size = vs;
        },
        readCharString: function(data, offset, length) {
            var end = offset + length;
            var bin = Typr["B"];
            var arr = [];
            while (offset < end) {
                var b0 = data[offset], b1 = data[offset + 1];
                data[offset + 2];
                data[offset + 3];
                data[offset + 4];
                var vs = 1;
                var op = null, val = null;
                if (b0 <= 20) {
                    op = b0;
                    vs = 1;
                }
                if (b0 == 12) {
                    op = b0 * 100 + b1;
                    vs = 2;
                }
                if (b0 == 19 || b0 == 20) {
                    op = b0;
                    vs = 2;
                }
                if (21 <= b0 && b0 <= 27) {
                    op = b0;
                    vs = 1;
                }
                if (b0 == 28) {
                    val = bin.readShort(data, offset + 1);
                    vs = 3;
                }
                if (29 <= b0 && b0 <= 31) {
                    op = b0;
                    vs = 1;
                }
                if (32 <= b0 && b0 <= 246) {
                    val = b0 - 139;
                    vs = 1;
                }
                if (247 <= b0 && b0 <= 250) {
                    val = (b0 - 247) * 256 + b1 + 108;
                    vs = 2;
                }
                if (251 <= b0 && b0 <= 254) {
                    val = -(b0 - 251) * 256 - b1 - 108;
                    vs = 2;
                }
                if (b0 == 255) {
                    val = bin.readInt(data, offset + 1) / 65535;
                    vs = 5;
                }
                arr.push(val != null ? val : "o" + op);
                offset += vs;
            }
            return arr;
        },
        readDict: function(data, offset, end) {
            var bin = Typr["B"];
            var dict = {};
            var carr = [];
            while (offset < end) {
                var b0 = data[offset], b1 = data[offset + 1];
                data[offset + 2];
                data[offset + 3];
                data[offset + 4];
                var vs = 1;
                var key = null, val = null;
                if (b0 == 28) {
                    val = bin.readShort(data, offset + 1);
                    vs = 3;
                }
                if (b0 == 29) {
                    val = bin.readInt(data, offset + 1);
                    vs = 5;
                }
                if (32 <= b0 && b0 <= 246) {
                    val = b0 - 139;
                    vs = 1;
                }
                if (247 <= b0 && b0 <= 250) {
                    val = (b0 - 247) * 256 + b1 + 108;
                    vs = 2;
                }
                if (251 <= b0 && b0 <= 254) {
                    val = -(b0 - 251) * 256 - b1 - 108;
                    vs = 2;
                }
                if (b0 == 255) {
                    val = bin.readInt(data, offset + 1) / 65535;
                    vs = 5;
                    throw "unknown number";
                }
                if (b0 == 30) {
                    var nibs = [];
                    vs = 1;
                    while (true) {
                        var b = data[offset + vs];
                        vs++;
                        var nib0 = b >> 4, nib1 = b & 15;
                        if (nib0 != 15) nibs.push(nib0);
                        if (nib1 != 15) nibs.push(nib1);
                        if (nib1 == 15) break;
                    }
                    var s = "";
                    var chars = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ".", "e", "e-", "reserved", "-", "endOfNumber" ];
                    for (var i = 0; i < nibs.length; i++) s += chars[nibs[i]];
                    val = parseFloat(s);
                }
                if (b0 <= 21) {
                    var keys = [ "version", "Notice", "FullName", "FamilyName", "Weight", "FontBBox", "BlueValues", "OtherBlues", "FamilyBlues", "FamilyOtherBlues", "StdHW", "StdVW", "escape", "UniqueID", "XUID", "charset", "Encoding", "CharStrings", "Private", "Subrs", "defaultWidthX", "nominalWidthX" ];
                    key = keys[b0];
                    vs = 1;
                    if (b0 == 12) {
                        var keys = [ "Copyright", "isFixedPitch", "ItalicAngle", "UnderlinePosition", "UnderlineThickness", "PaintType", "CharstringType", "FontMatrix", "StrokeWidth", "BlueScale", "BlueShift", "BlueFuzz", "StemSnapH", "StemSnapV", "ForceBold", "", "", "LanguageGroup", "ExpansionFactor", "initialRandomSeed", "SyntheticBase", "PostScript", "BaseFontName", "BaseFontBlend", "", "", "", "", "", "", "ROS", "CIDFontVersion", "CIDFontRevision", "CIDFontType", "CIDCount", "UIDBase", "FDArray", "FDSelect", "FontName" ];
                        key = keys[b1];
                        vs = 2;
                    }
                }
                if (key != null) {
                    dict[key] = carr.length == 1 ? carr[0] : carr;
                    carr = [];
                } else carr.push(val);
                offset += vs;
            }
            return dict;
        }
    };
    Typr["T"].cmap = {
        parseTab: function(data, offset, length) {
            var obj = {
                tables: [],
                ids: {},
                off: offset
            };
            data = new Uint8Array(data.buffer, offset, length);
            offset = 0;
            var bin = Typr["B"], rU = bin.readUshort, cmap = Typr["T"].cmap;
            rU(data, offset);
            offset += 2;
            var numTables = rU(data, offset);
            offset += 2;
            var offs = [];
            for (var i = 0; i < numTables; i++) {
                var platformID = rU(data, offset);
                offset += 2;
                var encodingID = rU(data, offset);
                offset += 2;
                var noffset = bin.readUint(data, offset);
                offset += 4;
                var id = "p" + platformID + "e" + encodingID;
                var tind = offs.indexOf(noffset);
                if (tind == -1) {
                    tind = obj.tables.length;
                    var subt = {};
                    offs.push(noffset);
                    var format = subt.format = rU(data, noffset);
                    if (format == 0) subt = cmap.parse0(data, noffset, subt); else if (format == 4) subt = cmap.parse4(data, noffset, subt); else if (format == 6) subt = cmap.parse6(data, noffset, subt); else if (format == 12) subt = cmap.parse12(data, noffset, subt);
                    obj.tables.push(subt);
                }
                if (obj.ids[id] != null) throw "multiple tables for one platform+encoding";
                obj.ids[id] = tind;
            }
            return obj;
        },
        parse0: function(data, offset, obj) {
            var bin = Typr["B"];
            offset += 2;
            var len = bin.readUshort(data, offset);
            offset += 2;
            bin.readUshort(data, offset);
            offset += 2;
            obj.map = [];
            for (var i = 0; i < len - 6; i++) obj.map.push(data[offset + i]);
            return obj;
        },
        parse4: function(data, offset, obj) {
            var bin = Typr["B"], rU = bin.readUshort, rUs = bin.readUshorts;
            var offset0 = offset;
            offset += 2;
            var length = rU(data, offset);
            offset += 2;
            rU(data, offset);
            offset += 2;
            var segCountX2 = rU(data, offset);
            offset += 2;
            var segCount = segCountX2 >>> 1;
            obj.searchRange = rU(data, offset);
            offset += 2;
            obj.entrySelector = rU(data, offset);
            offset += 2;
            obj.rangeShift = rU(data, offset);
            offset += 2;
            obj.endCount = rUs(data, offset, segCount);
            offset += segCount * 2;
            offset += 2;
            obj.startCount = rUs(data, offset, segCount);
            offset += segCount * 2;
            obj.idDelta = [];
            for (var i = 0; i < segCount; i++) {
                obj.idDelta.push(bin.readShort(data, offset));
                offset += 2;
            }
            obj.idRangeOffset = rUs(data, offset, segCount);
            offset += segCount * 2;
            obj.glyphIdArray = rUs(data, offset, offset0 + length - offset >>> 1);
            return obj;
        },
        parse6: function(data, offset, obj) {
            var bin = Typr["B"];
            offset += 2;
            bin.readUshort(data, offset);
            offset += 2;
            bin.readUshort(data, offset);
            offset += 2;
            obj.firstCode = bin.readUshort(data, offset);
            offset += 2;
            var entryCount = bin.readUshort(data, offset);
            offset += 2;
            obj.glyphIdArray = [];
            for (var i = 0; i < entryCount; i++) {
                obj.glyphIdArray.push(bin.readUshort(data, offset));
                offset += 2;
            }
            return obj;
        },
        parse12: function(data, offset, obj) {
            var bin = Typr["B"], rU = bin.readUint;
            offset += 4;
            rU(data, offset);
            offset += 4;
            rU(data, offset);
            offset += 4;
            var nGroups = rU(data, offset) * 3;
            offset += 4;
            var gps = obj.groups = new Uint32Array(nGroups);
            for (var i = 0; i < nGroups; i += 3) {
                gps[i] = rU(data, offset + (i << 2));
                gps[i + 1] = rU(data, offset + (i << 2) + 4);
                gps[i + 2] = rU(data, offset + (i << 2) + 8);
            }
            return obj;
        }
    };
    Typr["T"].glyf = {
        parseTab: function(data, offset, length, font) {
            var obj = [], ng = font["maxp"]["numGlyphs"];
            for (var g = 0; g < ng; g++) obj.push(null);
            return obj;
        },
        _parseGlyf: function(font, g) {
            var bin = Typr["B"];
            var data = font["_data"], loca = font["loca"];
            if (loca[g] == loca[g + 1]) return null;
            var offset = Typr["findTable"](data, "glyf", font["_offset"])[0] + loca[g];
            var gl = {};
            gl.noc = bin.readShort(data, offset);
            offset += 2;
            gl.xMin = bin.readShort(data, offset);
            offset += 2;
            gl.yMin = bin.readShort(data, offset);
            offset += 2;
            gl.xMax = bin.readShort(data, offset);
            offset += 2;
            gl.yMax = bin.readShort(data, offset);
            offset += 2;
            if (gl.xMin >= gl.xMax || gl.yMin >= gl.yMax) return null;
            if (gl.noc > 0) {
                gl.endPts = [];
                for (var i = 0; i < gl.noc; i++) {
                    gl.endPts.push(bin.readUshort(data, offset));
                    offset += 2;
                }
                var instructionLength = bin.readUshort(data, offset);
                offset += 2;
                if (data.length - offset < instructionLength) return null;
                gl.instructions = bin.readBytes(data, offset, instructionLength);
                offset += instructionLength;
                var crdnum = gl.endPts[gl.noc - 1] + 1;
                gl.flags = [];
                for (var i = 0; i < crdnum; i++) {
                    var flag = data[offset];
                    offset++;
                    gl.flags.push(flag);
                    if ((flag & 8) != 0) {
                        var rep = data[offset];
                        offset++;
                        for (var j = 0; j < rep; j++) {
                            gl.flags.push(flag);
                            i++;
                        }
                    }
                }
                gl.xs = [];
                for (var i = 0; i < crdnum; i++) {
                    var i8 = (gl.flags[i] & 2) != 0, same = (gl.flags[i] & 16) != 0;
                    if (i8) {
                        gl.xs.push(same ? data[offset] : -data[offset]);
                        offset++;
                    } else {
                        if (same) gl.xs.push(0); else {
                            gl.xs.push(bin.readShort(data, offset));
                            offset += 2;
                        }
                    }
                }
                gl.ys = [];
                for (var i = 0; i < crdnum; i++) {
                    var i8 = (gl.flags[i] & 4) != 0, same = (gl.flags[i] & 32) != 0;
                    if (i8) {
                        gl.ys.push(same ? data[offset] : -data[offset]);
                        offset++;
                    } else {
                        if (same) gl.ys.push(0); else {
                            gl.ys.push(bin.readShort(data, offset));
                            offset += 2;
                        }
                    }
                }
                var x = 0, y = 0;
                for (var i = 0; i < crdnum; i++) {
                    x += gl.xs[i];
                    y += gl.ys[i];
                    gl.xs[i] = x;
                    gl.ys[i] = y;
                }
            } else {
                var ARG_1_AND_2_ARE_WORDS = 1 << 0;
                var ARGS_ARE_XY_VALUES = 1 << 1;
                var WE_HAVE_A_SCALE = 1 << 3;
                var MORE_COMPONENTS = 1 << 5;
                var WE_HAVE_AN_X_AND_Y_SCALE = 1 << 6;
                var WE_HAVE_A_TWO_BY_TWO = 1 << 7;
                var WE_HAVE_INSTRUCTIONS = 1 << 8;
                gl.parts = [];
                var flags;
                do {
                    flags = bin.readUshort(data, offset);
                    offset += 2;
                    var part = {
                        m: {
                            a: 1,
                            b: 0,
                            c: 0,
                            d: 1,
                            tx: 0,
                            ty: 0
                        },
                        p1: -1,
                        p2: -1
                    };
                    gl.parts.push(part);
                    part.glyphIndex = bin.readUshort(data, offset);
                    offset += 2;
                    if (flags & ARG_1_AND_2_ARE_WORDS) {
                        var arg1 = bin.readShort(data, offset);
                        offset += 2;
                        var arg2 = bin.readShort(data, offset);
                        offset += 2;
                    } else {
                        var arg1 = bin.readInt8(data, offset);
                        offset++;
                        var arg2 = bin.readInt8(data, offset);
                        offset++;
                    }
                    if (flags & ARGS_ARE_XY_VALUES) {
                        part.m.tx = arg1;
                        part.m.ty = arg2;
                    } else {
                        part.p1 = arg1;
                        part.p2 = arg2;
                    }
                    if (flags & WE_HAVE_A_SCALE) {
                        part.m.a = part.m.d = bin.readF2dot14(data, offset);
                        offset += 2;
                    } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
                        part.m.a = bin.readF2dot14(data, offset);
                        offset += 2;
                        part.m.d = bin.readF2dot14(data, offset);
                        offset += 2;
                    } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
                        part.m.a = bin.readF2dot14(data, offset);
                        offset += 2;
                        part.m.b = bin.readF2dot14(data, offset);
                        offset += 2;
                        part.m.c = bin.readF2dot14(data, offset);
                        offset += 2;
                        part.m.d = bin.readF2dot14(data, offset);
                        offset += 2;
                    }
                } while (flags & MORE_COMPONENTS);
                if (flags & WE_HAVE_INSTRUCTIONS) {
                    var numInstr = bin.readUshort(data, offset);
                    offset += 2;
                    gl.instr = [];
                    for (var i = 0; i < numInstr; i++) {
                        gl.instr.push(data[offset]);
                        offset++;
                    }
                }
            }
            return gl;
        }
    };
    Typr["T"].head = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"];
            var obj = {};
            bin.readFixed(data, offset);
            offset += 4;
            obj["fontRevision"] = bin.readFixed(data, offset);
            offset += 4;
            bin.readUint(data, offset);
            offset += 4;
            bin.readUint(data, offset);
            offset += 4;
            obj["flags"] = bin.readUshort(data, offset);
            offset += 2;
            obj["unitsPerEm"] = bin.readUshort(data, offset);
            offset += 2;
            obj["created"] = bin.readUint64(data, offset);
            offset += 8;
            obj["modified"] = bin.readUint64(data, offset);
            offset += 8;
            obj["xMin"] = bin.readShort(data, offset);
            offset += 2;
            obj["yMin"] = bin.readShort(data, offset);
            offset += 2;
            obj["xMax"] = bin.readShort(data, offset);
            offset += 2;
            obj["yMax"] = bin.readShort(data, offset);
            offset += 2;
            obj["macStyle"] = bin.readUshort(data, offset);
            offset += 2;
            obj["lowestRecPPEM"] = bin.readUshort(data, offset);
            offset += 2;
            obj["fontDirectionHint"] = bin.readShort(data, offset);
            offset += 2;
            obj["indexToLocFormat"] = bin.readShort(data, offset);
            offset += 2;
            obj["glyphDataFormat"] = bin.readShort(data, offset);
            offset += 2;
            return obj;
        }
    };
    Typr["T"].hhea = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"];
            var obj = {};
            bin.readFixed(data, offset);
            offset += 4;
            var keys = [ "ascender", "descender", "lineGap", "advanceWidthMax", "minLeftSideBearing", "minRightSideBearing", "xMaxExtent", "caretSlopeRise", "caretSlopeRun", "caretOffset", "res0", "res1", "res2", "res3", "metricDataFormat", "numberOfHMetrics" ];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var func = key == "advanceWidthMax" || key == "numberOfHMetrics" ? bin.readUshort : bin.readShort;
                obj[key] = func(data, offset + i * 2);
            }
            return obj;
        }
    };
    Typr["T"].hmtx = {
        parseTab: function(data, offset, length, font) {
            var bin = Typr["B"];
            var aWidth = [];
            var lsBearing = [];
            var nG = font["maxp"]["numGlyphs"], nH = font["hhea"]["numberOfHMetrics"];
            var aw = 0, lsb = 0, i = 0;
            while (i < nH) {
                aw = bin.readUshort(data, offset + (i << 2));
                lsb = bin.readShort(data, offset + (i << 2) + 2);
                aWidth.push(aw);
                lsBearing.push(lsb);
                i++;
            }
            while (i < nG) {
                aWidth.push(aw);
                lsBearing.push(lsb);
                i++;
            }
            return {
                aWidth: aWidth,
                lsBearing: lsBearing
            };
        }
    };
    Typr["T"].kern = {
        parseTab: function(data, offset, length, font) {
            var bin = Typr["B"], kern = Typr["T"].kern;
            var version = bin.readUshort(data, offset);
            if (version == 1) return kern.parseV1(data, offset, length, font);
            var nTables = bin.readUshort(data, offset + 2);
            offset += 4;
            var map = {
                glyph1: [],
                rval: []
            };
            for (var i = 0; i < nTables; i++) {
                offset += 2;
                var length = bin.readUshort(data, offset);
                offset += 2;
                var coverage = bin.readUshort(data, offset);
                offset += 2;
                var format = coverage >>> 8;
                format &= 15;
                if (format == 0) offset = kern.readFormat0(data, offset, map);
            }
            return map;
        },
        parseV1: function(data, offset, length, font) {
            var bin = Typr["B"], kern = Typr["T"].kern;
            bin.readFixed(data, offset);
            var nTables = bin.readUint(data, offset + 4);
            offset += 8;
            var map = {
                glyph1: [],
                rval: []
            };
            for (var i = 0; i < nTables; i++) {
                bin.readUint(data, offset);
                offset += 4;
                var coverage = bin.readUshort(data, offset);
                offset += 2;
                bin.readUshort(data, offset);
                offset += 2;
                var format = coverage & 255;
                if (format == 0) offset = kern.readFormat0(data, offset, map);
            }
            return map;
        },
        readFormat0: function(data, offset, map) {
            var bin = Typr["B"], rUs = bin.readUshort;
            var pleft = -1;
            var nPairs = rUs(data, offset);
            rUs(data, offset + 2);
            rUs(data, offset + 4);
            rUs(data, offset + 6);
            offset += 8;
            for (var j = 0; j < nPairs; j++) {
                var left = rUs(data, offset);
                offset += 2;
                var right = rUs(data, offset);
                offset += 2;
                var value = bin.readShort(data, offset);
                offset += 2;
                if (left != pleft) {
                    map.glyph1.push(left);
                    map.rval.push({
                        glyph2: [],
                        vals: []
                    });
                }
                var rval = map.rval[map.rval.length - 1];
                rval.glyph2.push(right);
                rval.vals.push(value);
                pleft = left;
            }
            return offset;
        }
    };
    Typr["T"].loca = {
        parseTab: function(data, offset, length, font) {
            var bin = Typr["B"];
            var obj = [];
            var ver = font["head"]["indexToLocFormat"];
            var len = font["maxp"]["numGlyphs"] + 1;
            if (ver == 0) for (var i = 0; i < len; i++) obj.push(bin.readUshort(data, offset + (i << 1)) << 1);
            if (ver == 1) for (var i = 0; i < len; i++) obj.push(bin.readUint(data, offset + (i << 2)));
            return obj;
        }
    };
    Typr["T"].maxp = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"], rU = bin.readUshort;
            var obj = {};
            bin.readUint(data, offset);
            offset += 4;
            obj["numGlyphs"] = rU(data, offset);
            offset += 2;
            return obj;
        }
    };
    Typr["T"].name = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"];
            var obj = {};
            bin.readUshort(data, offset);
            offset += 2;
            var count = bin.readUshort(data, offset);
            offset += 2;
            bin.readUshort(data, offset);
            offset += 2;
            var names = [ "copyright", "fontFamily", "fontSubfamily", "ID", "fullName", "version", "postScriptName", "trademark", "manufacturer", "designer", "description", "urlVendor", "urlDesigner", "licence", "licenceURL", "---", "typoFamilyName", "typoSubfamilyName", "compatibleFull", "sampleText", "postScriptCID", "wwsFamilyName", "wwsSubfamilyName", "lightPalette", "darkPalette" ];
            var offset0 = offset;
            var rU = bin.readUshort;
            for (var i = 0; i < count; i++) {
                var platformID = rU(data, offset);
                offset += 2;
                var encodingID = rU(data, offset);
                offset += 2;
                var languageID = rU(data, offset);
                offset += 2;
                var nameID = rU(data, offset);
                offset += 2;
                var slen = rU(data, offset);
                offset += 2;
                var noffset = rU(data, offset);
                offset += 2;
                var soff = offset0 + count * 12 + noffset;
                var str;
                if (platformID == 0) str = bin.readUnicode(data, soff, slen / 2); else if (platformID == 3 && encodingID == 0) str = bin.readUnicode(data, soff, slen / 2); else if (encodingID == 0) str = bin.readASCII(data, soff, slen); else if (encodingID == 1) str = bin.readUnicode(data, soff, slen / 2); else if (encodingID == 3) str = bin.readUnicode(data, soff, slen / 2); else if (encodingID == 4) str = bin.readUnicode(data, soff, slen / 2); else if (encodingID == 10) str = bin.readUnicode(data, soff, slen / 2); else if (platformID == 1) {
                    str = bin.readASCII(data, soff, slen);
                    console.log("reading unknown MAC encoding " + encodingID + " as ASCII");
                } else {
                    console.log("unknown encoding " + encodingID + ", platformID: " + platformID);
                    str = bin.readASCII(data, soff, slen);
                }
                var tid = "p" + platformID + "," + languageID.toString(16);
                if (obj[tid] == null) obj[tid] = {};
                obj[tid][names[nameID]] = str;
                obj[tid]["_lang"] = languageID;
            }
            var psn = "postScriptName";
            for (var p in obj) if (obj[p][psn] != null && obj[p]["_lang"] == 1033) return obj[p];
            for (var p in obj) if (obj[p][psn] != null && obj[p]["_lang"] == 0) return obj[p];
            for (var p in obj) if (obj[p][psn] != null && obj[p]["_lang"] == 3084) return obj[p];
            for (var p in obj) if (obj[p][psn] != null) return obj[p];
            var out;
            for (var p in obj) {
                out = obj[p];
                break;
            }
            console.log("returning name table with languageID " + out._lang);
            if (out[psn] == null && out["ID"] != null) out[psn] = out["ID"];
            return out;
        }
    };
    Typr["T"].OS2 = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"];
            var ver = bin.readUshort(data, offset);
            offset += 2;
            var OS2 = Typr["T"].OS2;
            var obj = {};
            if (ver == 0) OS2.version0(data, offset, obj); else if (ver == 1) OS2.version1(data, offset, obj); else if (ver == 2 || ver == 3 || ver == 4) OS2.version2(data, offset, obj); else if (ver == 5) OS2.version5(data, offset, obj); else throw "unknown OS/2 table version: " + ver;
            return obj;
        },
        version0: function(data, offset, obj) {
            var bin = Typr["B"];
            obj["xAvgCharWidth"] = bin.readShort(data, offset);
            offset += 2;
            obj["usWeightClass"] = bin.readUshort(data, offset);
            offset += 2;
            obj["usWidthClass"] = bin.readUshort(data, offset);
            offset += 2;
            obj["fsType"] = bin.readUshort(data, offset);
            offset += 2;
            obj["ySubscriptXSize"] = bin.readShort(data, offset);
            offset += 2;
            obj["ySubscriptYSize"] = bin.readShort(data, offset);
            offset += 2;
            obj["ySubscriptXOffset"] = bin.readShort(data, offset);
            offset += 2;
            obj["ySubscriptYOffset"] = bin.readShort(data, offset);
            offset += 2;
            obj["ySuperscriptXSize"] = bin.readShort(data, offset);
            offset += 2;
            obj["ySuperscriptYSize"] = bin.readShort(data, offset);
            offset += 2;
            obj["ySuperscriptXOffset"] = bin.readShort(data, offset);
            offset += 2;
            obj["ySuperscriptYOffset"] = bin.readShort(data, offset);
            offset += 2;
            obj["yStrikeoutSize"] = bin.readShort(data, offset);
            offset += 2;
            obj["yStrikeoutPosition"] = bin.readShort(data, offset);
            offset += 2;
            obj["sFamilyClass"] = bin.readShort(data, offset);
            offset += 2;
            obj["panose"] = bin.readBytes(data, offset, 10);
            offset += 10;
            obj["ulUnicodeRange1"] = bin.readUint(data, offset);
            offset += 4;
            obj["ulUnicodeRange2"] = bin.readUint(data, offset);
            offset += 4;
            obj["ulUnicodeRange3"] = bin.readUint(data, offset);
            offset += 4;
            obj["ulUnicodeRange4"] = bin.readUint(data, offset);
            offset += 4;
            obj["achVendID"] = bin.readASCII(data, offset, 4);
            offset += 4;
            obj["fsSelection"] = bin.readUshort(data, offset);
            offset += 2;
            obj["usFirstCharIndex"] = bin.readUshort(data, offset);
            offset += 2;
            obj["usLastCharIndex"] = bin.readUshort(data, offset);
            offset += 2;
            obj["sTypoAscender"] = bin.readShort(data, offset);
            offset += 2;
            obj["sTypoDescender"] = bin.readShort(data, offset);
            offset += 2;
            obj["sTypoLineGap"] = bin.readShort(data, offset);
            offset += 2;
            obj["usWinAscent"] = bin.readUshort(data, offset);
            offset += 2;
            obj["usWinDescent"] = bin.readUshort(data, offset);
            offset += 2;
            return offset;
        },
        version1: function(data, offset, obj) {
            var bin = Typr["B"];
            offset = Typr["T"].OS2.version0(data, offset, obj);
            obj["ulCodePageRange1"] = bin.readUint(data, offset);
            offset += 4;
            obj["ulCodePageRange2"] = bin.readUint(data, offset);
            offset += 4;
            return offset;
        },
        version2: function(data, offset, obj) {
            var bin = Typr["B"], rU = bin.readUshort;
            offset = Typr["T"].OS2.version1(data, offset, obj);
            obj["sxHeight"] = bin.readShort(data, offset);
            offset += 2;
            obj["sCapHeight"] = bin.readShort(data, offset);
            offset += 2;
            obj["usDefault"] = rU(data, offset);
            offset += 2;
            obj["usBreak"] = rU(data, offset);
            offset += 2;
            obj["usMaxContext"] = rU(data, offset);
            offset += 2;
            return offset;
        },
        version5: function(data, offset, obj) {
            var rU = Typr["B"].readUshort;
            offset = Typr["T"].OS2.version2(data, offset, obj);
            obj["usLowerOpticalPointSize"] = rU(data, offset);
            offset += 2;
            obj["usUpperOpticalPointSize"] = rU(data, offset);
            offset += 2;
            return offset;
        }
    };
    Typr["T"].post = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"];
            var obj = {};
            obj["version"] = bin.readFixed(data, offset);
            offset += 4;
            obj["italicAngle"] = bin.readFixed(data, offset);
            offset += 4;
            obj["underlinePosition"] = bin.readShort(data, offset);
            offset += 2;
            obj["underlineThickness"] = bin.readShort(data, offset);
            offset += 2;
            return obj;
        }
    };
    Typr["T"].SVG = {
        parseTab: function(data, offset, length) {
            var bin = Typr["B"];
            var obj = {
                entries: []
            };
            var offset0 = offset;
            bin.readUshort(data, offset);
            offset += 2;
            var svgDocIndexOffset = bin.readUint(data, offset);
            offset += 4;
            bin.readUint(data, offset);
            offset += 4;
            offset = svgDocIndexOffset + offset0;
            var numEntries = bin.readUshort(data, offset);
            offset += 2;
            for (var i = 0; i < numEntries; i++) {
                var startGlyphID = bin.readUshort(data, offset);
                offset += 2;
                var endGlyphID = bin.readUshort(data, offset);
                offset += 2;
                var svgDocOffset = bin.readUint(data, offset);
                offset += 4;
                var svgDocLength = bin.readUint(data, offset);
                offset += 4;
                var sbuf = new Uint8Array(data.buffer, offset0 + svgDocOffset + svgDocIndexOffset, svgDocLength);
                var svg = bin.readUTF8(sbuf, 0, sbuf.length);
                for (var f = startGlyphID; f <= endGlyphID; f++) {
                    obj.entries[f] = svg;
                }
            }
            return obj;
        }
    };
    Typr["U"] = {
        shape: function(font, str, ltr) {
            var getGlyphPosition = function(font, gls, i1, ltr) {
                var g1 = gls[i1], g2 = gls[i1 + 1], kern = font["kern"];
                if (kern) {
                    var ind1 = kern.glyph1.indexOf(g1);
                    if (ind1 != -1) {
                        var ind2 = kern.rval[ind1].glyph2.indexOf(g2);
                        if (ind2 != -1) return [ 0, 0, kern.rval[ind1].vals[ind2], 0 ];
                    }
                }
                return [ 0, 0, 0, 0 ];
            };
            var gls = [];
            for (var i = 0; i < str.length; i++) {
                var cc = str.codePointAt(i);
                if (cc > 65535) i++;
                gls.push(Typr["U"]["codeToGlyph"](font, cc));
            }
            var shape = [];
            for (var i = 0; i < gls.length; i++) {
                var padj = getGlyphPosition(font, gls, i);
                var gid = gls[i];
                var ax = font["hmtx"].aWidth[gid] + padj[2];
                shape.push({
                    g: gid,
                    cl: i,
                    dx: 0,
                    dy: 0,
                    ax: ax,
                    ay: 0
                });
            }
            return shape;
        },
        shapeToPath: function(font, shape, clr) {
            var tpath = {
                cmds: [],
                crds: []
            };
            var x = 0, y = 0;
            for (var i = 0; i < shape.length; i++) {
                var it = shape[i];
                var path = Typr["U"]["glyphToPath"](font, it["g"]), crds = path["crds"];
                for (var j = 0; j < crds.length; j += 2) {
                    tpath.crds.push(crds[j] + x + it["dx"]);
                    tpath.crds.push(crds[j + 1] + y + it["dy"]);
                }
                if (clr) tpath.cmds.push(clr);
                for (var j = 0; j < path["cmds"].length; j++) tpath.cmds.push(path["cmds"][j]);
                var clen = tpath.cmds.length;
                if (clr) if (clen != 0 && tpath.cmds[clen - 1] != "X") tpath.cmds.push("X");
                x += it["ax"];
                y += it["ay"];
            }
            return {
                cmds: tpath.cmds,
                crds: tpath.crds
            };
        },
        codeToGlyph: function(font, code) {
            var cmap = font["cmap"];
            var tind = -1, pps = [ "p3e10", "p0e4", "p3e1", "p1e0", "p0e3", "p0e1" ];
            for (var i = 0; i < pps.length; i++) if (cmap.ids[pps[i]] != null) {
                tind = cmap.ids[pps[i]];
                break;
            }
            if (tind == -1) throw "no familiar platform and encoding!";
            var arrSearch = function(arr, k, v) {
                var l = 0, r = Math.floor(arr.length / k);
                while (l + 1 != r) {
                    var mid = l + (r - l >>> 1);
                    if (arr[mid * k] <= v) l = mid; else r = mid;
                }
                return l * k;
            };
            var tab = cmap.tables[tind], fmt = tab.format, gid = -1;
            if (fmt == 0) {
                if (code >= tab.map.length) gid = 0; else gid = tab.map[code];
            } else if (fmt == 4) {
                var sind = -1, ec = tab.endCount;
                if (code > ec[ec.length - 1]) sind = -1; else {
                    sind = arrSearch(ec, 1, code);
                    if (ec[sind] < code) sind++;
                }
                if (sind == -1) gid = 0; else if (code < tab.startCount[sind]) gid = 0; else {
                    var gli = 0;
                    if (tab.idRangeOffset[sind] != 0) gli = tab.glyphIdArray[code - tab.startCount[sind] + (tab.idRangeOffset[sind] >> 1) - (tab.idRangeOffset.length - sind)]; else gli = code + tab.idDelta[sind];
                    gid = gli & 65535;
                }
            } else if (fmt == 6) {
                var off = code - tab.firstCode, arr = tab.glyphIdArray;
                if (off < 0 || off >= arr.length) gid = 0; else gid = arr[off];
            } else if (fmt == 12) {
                var grp = tab.groups;
                if (code > grp[grp.length - 2]) gid = 0; else {
                    var i = arrSearch(grp, 3, code);
                    if (grp[i] <= code && code <= grp[i + 1]) {
                        gid = grp[i + 2] + (code - grp[i]);
                    }
                    if (gid == -1) gid = 0;
                }
            } else throw "unknown cmap table format " + tab.format;
            var SVG = font["SVG "], loca = font["loca"];
            if (gid != 0 && font["CFF "] == null && (SVG == null || SVG.entries[gid] == null) && loca[gid] == loca[gid + 1] && [ 9, 10, 11, 12, 13, 32, 133, 160, 5760, 8232, 8233, 8239, 12288, 6158, 8203, 8204, 8205, 8288, 65279 ].indexOf(code) == -1 && !(8192 <= code && code <= 8202)) gid = 0;
            return gid;
        },
        glyphToPath: function(font, gid) {
            var path = {
                cmds: [],
                crds: []
            };
            var SVG = font["SVG "], CFF = font["CFF "];
            var U = Typr["U"];
            if (SVG && SVG.entries[gid]) {
                var p = SVG.entries[gid];
                if (p != null) {
                    if (typeof p == "string") {
                        p = U["SVG"].toPath(p);
                        SVG.entries[gid] = p;
                    }
                    path = p;
                }
            } else if (CFF) {
                var pdct = CFF["Private"];
                var state = {
                    x: 0,
                    y: 0,
                    stack: [],
                    nStems: 0,
                    haveWidth: false,
                    width: pdct ? pdct["defaultWidthX"] : 0,
                    open: false
                };
                if (CFF["ROS"]) {
                    var gi = 0;
                    while (CFF["FDSelect"][gi + 2] <= gid) gi += 2;
                    pdct = CFF["FDArray"][CFF["FDSelect"][gi + 1]]["Private"];
                }
                U["_drawCFF"](CFF["CharStrings"][gid], state, CFF, pdct, path);
            } else if (font["glyf"]) {
                U["_drawGlyf"](gid, font, path);
            }
            return {
                cmds: path.cmds,
                crds: path.crds
            };
        },
        _drawGlyf: function(gid, font, path) {
            var gl = font["glyf"][gid];
            if (gl == null) gl = font["glyf"][gid] = Typr["T"].glyf._parseGlyf(font, gid);
            if (gl != null) {
                if (gl.noc > -1) Typr["U"]["_simpleGlyph"](gl, path); else Typr["U"]["_compoGlyph"](gl, font, path);
            }
        },
        _simpleGlyph: function(gl, p) {
            var P = Typr["U"]["P"];
            for (var c = 0; c < gl.noc; c++) {
                var i0 = c == 0 ? 0 : gl.endPts[c - 1] + 1;
                var il = gl.endPts[c];
                for (var i = i0; i <= il; i++) {
                    var pr = i == i0 ? il : i - 1;
                    var nx = i == il ? i0 : i + 1;
                    var onCurve = gl.flags[i] & 1;
                    var prOnCurve = gl.flags[pr] & 1;
                    var nxOnCurve = gl.flags[nx] & 1;
                    var x = gl.xs[i], y = gl.ys[i];
                    if (i == i0) {
                        if (onCurve) {
                            if (prOnCurve) P.MoveTo(p, gl.xs[pr], gl.ys[pr]); else {
                                P.MoveTo(p, x, y);
                                continue;
                            }
                        } else {
                            if (prOnCurve) P.MoveTo(p, gl.xs[pr], gl.ys[pr]); else P.MoveTo(p, Math.floor((gl.xs[pr] + x) * .5), Math.floor((gl.ys[pr] + y) * .5));
                        }
                    }
                    if (onCurve) {
                        if (prOnCurve) P.LineTo(p, x, y);
                    } else {
                        if (nxOnCurve) P.qCurveTo(p, x, y, gl.xs[nx], gl.ys[nx]); else P.qCurveTo(p, x, y, Math.floor((x + gl.xs[nx]) * .5), Math.floor((y + gl.ys[nx]) * .5));
                    }
                }
                P.ClosePath(p);
            }
        },
        _compoGlyph: function(gl, font, p) {
            for (var j = 0; j < gl.parts.length; j++) {
                var path = {
                    cmds: [],
                    crds: []
                };
                var prt = gl.parts[j];
                Typr["U"]["_drawGlyf"](prt.glyphIndex, font, path);
                var m = prt.m;
                for (var i = 0; i < path.crds.length; i += 2) {
                    var x = path.crds[i], y = path.crds[i + 1];
                    p.crds.push(x * m.a + y * m.b + m.tx);
                    p.crds.push(x * m.c + y * m.d + m.ty);
                }
                for (var i = 0; i < path.cmds.length; i++) p.cmds.push(path.cmds[i]);
            }
        },
        pathToSVG: function(path, prec) {
            var cmds = path["cmds"], crds = path["crds"];
            if (prec == null) prec = 5;
            var out = [], co = 0, lmap = {
                M: 2,
                L: 2,
                Q: 4,
                C: 6
            };
            for (var i = 0; i < cmds.length; i++) {
                var cmd = cmds[i], cn = co + (lmap[cmd] ? lmap[cmd] : 0);
                out.push(cmd);
                while (co < cn) {
                    var c = crds[co++];
                    out.push(parseFloat(c.toFixed(prec)) + (co == cn ? "" : " "));
                }
            }
            return out.join("");
        },
        SVGToPath: function(d) {
            var pth = {
                cmds: [],
                crds: []
            };
            Typr["U"]["SVG"].svgToPath(d, pth);
            return {
                cmds: pth.cmds,
                crds: pth.crds
            };
        },
        pathToContext: function(path, ctx) {
            var c = 0, cmds = path["cmds"], crds = path["crds"];
            for (var j = 0; j < cmds.length; j++) {
                var cmd = cmds[j];
                if (cmd == "M") {
                    ctx.moveTo(crds[c], crds[c + 1]);
                    c += 2;
                } else if (cmd == "L") {
                    ctx.lineTo(crds[c], crds[c + 1]);
                    c += 2;
                } else if (cmd == "C") {
                    ctx.bezierCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3], crds[c + 4], crds[c + 5]);
                    c += 6;
                } else if (cmd == "Q") {
                    ctx.quadraticCurveTo(crds[c], crds[c + 1], crds[c + 2], crds[c + 3]);
                    c += 4;
                } else if (cmd.charAt(0) == "#") {
                    ctx.beginPath();
                    ctx.fillStyle = cmd;
                } else if (cmd == "Z") {
                    ctx.closePath();
                } else if (cmd == "X") {
                    ctx.fill();
                }
            }
        },
        P: {
            MoveTo: function(p, x, y) {
                p.cmds.push("M");
                p.crds.push(x, y);
            },
            LineTo: function(p, x, y) {
                p.cmds.push("L");
                p.crds.push(x, y);
            },
            CurveTo: function(p, a, b, c, d, e, f) {
                p.cmds.push("C");
                p.crds.push(a, b, c, d, e, f);
            },
            qCurveTo: function(p, a, b, c, d) {
                p.cmds.push("Q");
                p.crds.push(a, b, c, d);
            },
            ClosePath: function(p) {
                p.cmds.push("Z");
            }
        },
        _drawCFF: function(cmds, state, font, pdct, p) {
            var stack = state.stack;
            var nStems = state.nStems, haveWidth = state.haveWidth, width = state.width, open = state.open;
            var i = 0;
            var x = state.x, y = state.y, c1x = 0, c1y = 0, c2x = 0, c2y = 0, c3x = 0, c3y = 0, c4x = 0, c4y = 0, jpx = 0, jpy = 0;
            var CFF = Typr["T"].CFF, P = Typr["U"]["P"];
            var nominalWidthX = pdct["nominalWidthX"];
            var o = {
                val: 0,
                size: 0
            };
            while (i < cmds.length) {
                CFF.getCharString(cmds, i, o);
                var v = o.val;
                i += o.size;
                if (v == "o1" || v == "o18") {
                    var hasWidthArg;
                    hasWidthArg = stack.length % 2 !== 0;
                    if (hasWidthArg && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                    }
                    nStems += stack.length >> 1;
                    stack.length = 0;
                    haveWidth = true;
                } else if (v == "o3" || v == "o23") {
                    var hasWidthArg;
                    hasWidthArg = stack.length % 2 !== 0;
                    if (hasWidthArg && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                    }
                    nStems += stack.length >> 1;
                    stack.length = 0;
                    haveWidth = true;
                } else if (v == "o4") {
                    if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                        haveWidth = true;
                    }
                    if (open) P.ClosePath(p);
                    y += stack.pop();
                    P.MoveTo(p, x, y);
                    open = true;
                } else if (v == "o5") {
                    while (stack.length > 0) {
                        x += stack.shift();
                        y += stack.shift();
                        P.LineTo(p, x, y);
                    }
                } else if (v == "o6" || v == "o7") {
                    var count = stack.length;
                    var isX = v == "o6";
                    for (var j = 0; j < count; j++) {
                        var sval = stack.shift();
                        if (isX) x += sval; else y += sval;
                        isX = !isX;
                        P.LineTo(p, x, y);
                    }
                } else if (v == "o8" || v == "o24") {
                    var count = stack.length;
                    var index = 0;
                    while (index + 6 <= count) {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y + stack.shift();
                        P.CurveTo(p, c1x, c1y, c2x, c2y, x, y);
                        index += 6;
                    }
                    if (v == "o24") {
                        x += stack.shift();
                        y += stack.shift();
                        P.LineTo(p, x, y);
                    }
                } else if (v == "o11") break; else if (v == "o1234" || v == "o1235" || v == "o1236" || v == "o1237") {
                    if (v == "o1234") {
                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        jpx = c2x + stack.shift();
                        jpy = c2y;
                        c3x = jpx + stack.shift();
                        c3y = c2y;
                        c4x = c3x + stack.shift();
                        c4y = y;
                        x = c4x + stack.shift();
                        P.CurveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
                        P.CurveTo(p, c3x, c3y, c4x, c4y, x, y);
                    }
                    if (v == "o1235") {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        jpx = c2x + stack.shift();
                        jpy = c2y + stack.shift();
                        c3x = jpx + stack.shift();
                        c3y = jpy + stack.shift();
                        c4x = c3x + stack.shift();
                        c4y = c3y + stack.shift();
                        x = c4x + stack.shift();
                        y = c4y + stack.shift();
                        stack.shift();
                        P.CurveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
                        P.CurveTo(p, c3x, c3y, c4x, c4y, x, y);
                    }
                    if (v == "o1236") {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        jpx = c2x + stack.shift();
                        jpy = c2y;
                        c3x = jpx + stack.shift();
                        c3y = c2y;
                        c4x = c3x + stack.shift();
                        c4y = c3y + stack.shift();
                        x = c4x + stack.shift();
                        P.CurveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
                        P.CurveTo(p, c3x, c3y, c4x, c4y, x, y);
                    }
                    if (v == "o1237") {
                        c1x = x + stack.shift();
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        jpx = c2x + stack.shift();
                        jpy = c2y + stack.shift();
                        c3x = jpx + stack.shift();
                        c3y = jpy + stack.shift();
                        c4x = c3x + stack.shift();
                        c4y = c3y + stack.shift();
                        if (Math.abs(c4x - x) > Math.abs(c4y - y)) {
                            x = c4x + stack.shift();
                        } else {
                            y = c4y + stack.shift();
                        }
                        P.CurveTo(p, c1x, c1y, c2x, c2y, jpx, jpy);
                        P.CurveTo(p, c3x, c3y, c4x, c4y, x, y);
                    }
                } else if (v == "o14") {
                    if (stack.length > 0 && !haveWidth) {
                        width = stack.shift() + font["nominalWidthX"];
                        haveWidth = true;
                    }
                    if (stack.length == 4) {
                        var adx = stack.shift();
                        var ady = stack.shift();
                        var bchar = stack.shift();
                        var achar = stack.shift();
                        var bind = CFF.glyphBySE(font, bchar);
                        var aind = CFF.glyphBySE(font, achar);
                        Typr["U"]["_drawCFF"](font["CharStrings"][bind], state, font, pdct, p);
                        state.x = adx;
                        state.y = ady;
                        Typr["U"]["_drawCFF"](font["CharStrings"][aind], state, font, pdct, p);
                    }
                    if (open) {
                        P.ClosePath(p);
                        open = false;
                    }
                } else if (v == "o19" || v == "o20") {
                    var hasWidthArg;
                    hasWidthArg = stack.length % 2 !== 0;
                    if (hasWidthArg && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                    }
                    nStems += stack.length >> 1;
                    stack.length = 0;
                    haveWidth = true;
                    i += nStems + 7 >> 3;
                } else if (v == "o21") {
                    if (stack.length > 2 && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                        haveWidth = true;
                    }
                    y += stack.pop();
                    x += stack.pop();
                    if (open) P.ClosePath(p);
                    P.MoveTo(p, x, y);
                    open = true;
                } else if (v == "o22") {
                    if (stack.length > 1 && !haveWidth) {
                        width = stack.shift() + nominalWidthX;
                        haveWidth = true;
                    }
                    x += stack.pop();
                    if (open) P.ClosePath(p);
                    P.MoveTo(p, x, y);
                    open = true;
                } else if (v == "o25") {
                    while (stack.length > 6) {
                        x += stack.shift();
                        y += stack.shift();
                        P.LineTo(p, x, y);
                    }
                    c1x = x + stack.shift();
                    c1y = y + stack.shift();
                    c2x = c1x + stack.shift();
                    c2y = c1y + stack.shift();
                    x = c2x + stack.shift();
                    y = c2y + stack.shift();
                    P.CurveTo(p, c1x, c1y, c2x, c2y, x, y);
                } else if (v == "o26") {
                    if (stack.length % 2) {
                        x += stack.shift();
                    }
                    while (stack.length > 0) {
                        c1x = x;
                        c1y = y + stack.shift();
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x;
                        y = c2y + stack.shift();
                        P.CurveTo(p, c1x, c1y, c2x, c2y, x, y);
                    }
                } else if (v == "o27") {
                    if (stack.length % 2) {
                        y += stack.shift();
                    }
                    while (stack.length > 0) {
                        c1x = x + stack.shift();
                        c1y = y;
                        c2x = c1x + stack.shift();
                        c2y = c1y + stack.shift();
                        x = c2x + stack.shift();
                        y = c2y;
                        P.CurveTo(p, c1x, c1y, c2x, c2y, x, y);
                    }
                } else if (v == "o10" || v == "o29") {
                    var obj = v == "o10" ? pdct : font;
                    if (stack.length == 0) {
                        console.log("error: empty stack");
                    } else {
                        var ind = stack.pop();
                        var subr = obj["Subrs"][ind + obj["Bias"]];
                        state.x = x;
                        state.y = y;
                        state.nStems = nStems;
                        state.haveWidth = haveWidth;
                        state.width = width;
                        state.open = open;
                        Typr["U"]["_drawCFF"](subr, state, font, pdct, p);
                        x = state.x;
                        y = state.y;
                        nStems = state.nStems;
                        haveWidth = state.haveWidth;
                        width = state.width;
                        open = state.open;
                    }
                } else if (v == "o30" || v == "o31") {
                    var count, count1 = stack.length;
                    var index = 0;
                    var alternate = v == "o31";
                    count = count1 & ~2;
                    index += count1 - count;
                    while (index < count) {
                        if (alternate) {
                            c1x = x + stack.shift();
                            c1y = y;
                            c2x = c1x + stack.shift();
                            c2y = c1y + stack.shift();
                            y = c2y + stack.shift();
                            if (count - index == 5) {
                                x = c2x + stack.shift();
                                index++;
                            } else x = c2x;
                            alternate = false;
                        } else {
                            c1x = x;
                            c1y = y + stack.shift();
                            c2x = c1x + stack.shift();
                            c2y = c1y + stack.shift();
                            x = c2x + stack.shift();
                            if (count - index == 5) {
                                y = c2y + stack.shift();
                                index++;
                            } else y = c2y;
                            alternate = true;
                        }
                        P.CurveTo(p, c1x, c1y, c2x, c2y, x, y);
                        index += 4;
                    }
                } else if ((v + "").charAt(0) == "o") {
                    console.log("Unknown operation: " + v, cmds);
                    throw v;
                } else stack.push(v);
            }
            state.x = x;
            state.y = y;
            state.nStems = nStems;
            state.haveWidth = haveWidth;
            state.width = width;
            state.open = open;
        },
        SVG: function() {
            var M = {
                getScale: function(m) {
                    return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
                },
                translate: function(m, x, y) {
                    M.concat(m, [ 1, 0, 0, 1, x, y ]);
                },
                rotate: function(m, a) {
                    M.concat(m, [ Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a), 0, 0 ]);
                },
                scale: function(m, x, y) {
                    M.concat(m, [ x, 0, 0, y, 0, 0 ]);
                },
                concat: function(m, w) {
                    var a = m[0], b = m[1], c = m[2], d = m[3], tx = m[4], ty = m[5];
                    m[0] = a * w[0] + b * w[2];
                    m[1] = a * w[1] + b * w[3];
                    m[2] = c * w[0] + d * w[2];
                    m[3] = c * w[1] + d * w[3];
                    m[4] = tx * w[0] + ty * w[2] + w[4];
                    m[5] = tx * w[1] + ty * w[3] + w[5];
                },
                invert: function(m) {
                    var a = m[0], b = m[1], c = m[2], d = m[3], tx = m[4], ty = m[5], adbc = a * d - b * c;
                    m[0] = d / adbc;
                    m[1] = -b / adbc;
                    m[2] = -c / adbc;
                    m[3] = a / adbc;
                    m[4] = (c * ty - d * tx) / adbc;
                    m[5] = (b * tx - a * ty) / adbc;
                },
                multPoint: function(m, p) {
                    var x = p[0], y = p[1];
                    return [ x * m[0] + y * m[2] + m[4], x * m[1] + y * m[3] + m[5] ];
                },
                multArray: function(m, a) {
                    for (var i = 0; i < a.length; i += 2) {
                        var x = a[i], y = a[i + 1];
                        a[i] = x * m[0] + y * m[2] + m[4];
                        a[i + 1] = x * m[1] + y * m[3] + m[5];
                    }
                }
            };
            function _bracketSplit(str, lbr, rbr) {
                var out = [], pos = 0, ci = 0, lvl = 0;
                while (true) {
                    var li = str.indexOf(lbr, ci);
                    var ri = str.indexOf(rbr, ci);
                    if (li == -1 && ri == -1) break;
                    if (ri == -1 || li != -1 && li < ri) {
                        if (lvl == 0) {
                            out.push(str.slice(pos, li).trim());
                            pos = li + 1;
                        }
                        lvl++;
                        ci = li + 1;
                    } else if (li == -1 || ri != -1 && ri < li) {
                        lvl--;
                        if (lvl == 0) {
                            out.push(str.slice(pos, ri).trim());
                            pos = ri + 1;
                        }
                        ci = ri + 1;
                    }
                }
                return out;
            }
            function cssMap(str) {
                var pts = _bracketSplit(str, "{", "}");
                var css = {};
                for (var i = 0; i < pts.length; i += 2) {
                    var cn = pts[i].split(",");
                    for (var j = 0; j < cn.length; j++) {
                        var cnj = cn[j].trim();
                        if (css[cnj] == null) css[cnj] = "";
                        css[cnj] += pts[i + 1];
                    }
                }
                return css;
            }
            function readTrnf(trna) {
                var pts = _bracketSplit(trna, "(", ")");
                var m = [ 1, 0, 0, 1, 0, 0 ];
                for (var i = 0; i < pts.length; i += 2) {
                    var om = m;
                    m = _readTrnsAttr(pts[i], pts[i + 1]);
                    M.concat(m, om);
                }
                return m;
            }
            function _readTrnsAttr(fnc, vls) {
                var m = [ 1, 0, 0, 1, 0, 0 ], gotSep = true;
                for (var i = 0; i < vls.length; i++) {
                    var ch = vls.charAt(i);
                    if (ch == "," || ch == " ") gotSep = true; else if (ch == ".") {
                        if (!gotSep) {
                            vls = vls.slice(0, i) + "," + vls.slice(i);
                            i++;
                        }
                        gotSep = false;
                    } else if (ch == "-" && i > 0 && vls[i - 1] != "e") {
                        vls = vls.slice(0, i) + " " + vls.slice(i);
                        i++;
                        gotSep = true;
                    }
                }
                vls = vls.split(/\s*[\s,]\s*/).map(parseFloat);
                if (fnc == "translate") {
                    if (vls.length == 1) M.translate(m, vls[0], 0); else M.translate(m, vls[0], vls[1]);
                } else if (fnc == "scale") {
                    if (vls.length == 1) M.scale(m, vls[0], vls[0]); else M.scale(m, vls[0], vls[1]);
                } else if (fnc == "rotate") {
                    var tx = 0, ty = 0;
                    if (vls.length != 1) {
                        tx = vls[1];
                        ty = vls[2];
                    }
                    M.translate(m, -tx, -ty);
                    M.rotate(m, -Math.PI * vls[0] / 180);
                    M.translate(m, tx, ty);
                } else if (fnc == "matrix") m = vls; else console.log("unknown transform: ", fnc);
                return m;
            }
            function toPath(str) {
                var pth = {
                    cmds: [],
                    crds: []
                };
                if (str == null) return pth;
                var prsr = new DOMParser();
                var doc = prsr["parseFromString"](str, "image/svg+xml");
                var svg = doc.getElementsByTagName("svg")[0];
                var vb = svg.getAttribute("viewBox");
                if (vb) vb = vb.trim().split(" ").map(parseFloat); else vb = [ 0, 0, 1e3, 1e3 ];
                _toPath(svg.children, pth);
                for (var i = 0; i < pth.crds.length; i += 2) {
                    var x = pth.crds[i], y = pth.crds[i + 1];
                    x -= vb[0];
                    y -= vb[1];
                    y = -y;
                    pth.crds[i] = x;
                    pth.crds[i + 1] = y;
                }
                return pth;
            }
            function _toPath(nds, pth, fill) {
                for (var ni = 0; ni < nds.length; ni++) {
                    var nd = nds[ni], tn = nd.tagName;
                    var cfl = nd.getAttribute("fill");
                    if (cfl == null) cfl = fill;
                    if (tn == "g") {
                        var tp = {
                            crds: [],
                            cmds: []
                        };
                        _toPath(nd.children, tp, cfl);
                        var trf = nd.getAttribute("transform");
                        if (trf) {
                            var m = readTrnf(trf);
                            M.multArray(m, tp.crds);
                        }
                        pth.crds = pth.crds.concat(tp.crds);
                        pth.cmds = pth.cmds.concat(tp.cmds);
                    } else if (tn == "path" || tn == "circle" || tn == "ellipse") {
                        pth.cmds.push(cfl ? cfl : "#000000");
                        var d;
                        if (tn == "path") d = nd.getAttribute("d");
                        if (tn == "circle" || tn == "ellipse") {
                            var vls = [ 0, 0, 0, 0 ], nms = [ "cx", "cy", "rx", "ry", "r" ];
                            for (var i = 0; i < 5; i++) {
                                var V = nd.getAttribute(nms[i]);
                                if (V) {
                                    V = parseFloat(V);
                                    if (i < 4) vls[i] = V; else vls[2] = vls[3] = V;
                                }
                            }
                            var cx = vls[0], cy = vls[1], rx = vls[2], ry = vls[3];
                            d = [ "M", cx - rx, cy, "a", rx, ry, 0, 1, 0, rx * 2, 0, "a", rx, ry, 0, 1, 0, -rx * 2, 0 ].join(" ");
                        }
                        svgToPath(d, pth);
                        pth.cmds.push("X");
                    } else if (tn == "defs"); else console.log(tn, nd);
                }
            }
            function _tokens(d) {
                var ts = [], off = 0, rn = false, cn = "", pc = "";
                while (off < d.length) {
                    var cc = d.charCodeAt(off), ch = d.charAt(off);
                    off++;
                    var isNum = 48 <= cc && cc <= 57 || ch == "." || ch == "-" || ch == "e" || ch == "E";
                    if (rn) {
                        if (ch == "-" && pc != "e" || ch == "." && cn.indexOf(".") != -1) {
                            ts.push(parseFloat(cn));
                            cn = ch;
                        } else if (isNum) cn += ch; else {
                            ts.push(parseFloat(cn));
                            if (ch != "," && ch != " ") ts.push(ch);
                            rn = false;
                        }
                    } else {
                        if (isNum) {
                            cn = ch;
                            rn = true;
                        } else if (ch != "," && ch != " ") ts.push(ch);
                    }
                    pc = ch;
                }
                if (rn) ts.push(parseFloat(cn));
                return ts;
            }
            function _reps(ts, off, ps) {
                var i = off;
                while (i < ts.length) {
                    if (typeof ts[i] == "string") break;
                    i += ps;
                }
                return (i - off) / ps;
            }
            function svgToPath(d, pth) {
                var ts = _tokens(d);
                var i = 0, x = 0, y = 0, ox = 0, oy = 0, oldo = pth.crds.length;
                var pc = {
                    M: 2,
                    L: 2,
                    H: 1,
                    V: 1,
                    T: 2,
                    S: 4,
                    A: 7,
                    Q: 4,
                    C: 6
                };
                var cmds = pth.cmds, crds = pth.crds;
                while (i < ts.length) {
                    var cmd = ts[i];
                    i++;
                    var cmu = cmd.toUpperCase();
                    if (cmu == "Z") {
                        cmds.push("Z");
                        x = ox;
                        y = oy;
                    } else {
                        var ps = pc[cmu], reps = _reps(ts, i, ps);
                        for (var j = 0; j < reps; j++) {
                            if (j == 1 && cmu == "M") {
                                cmd = cmd == cmu ? "L" : "l";
                                cmu = "L";
                            }
                            var xi = 0, yi = 0;
                            if (cmd != cmu) {
                                xi = x;
                                yi = y;
                            }
                            if (cmu == "M") {
                                x = xi + ts[i++];
                                y = yi + ts[i++];
                                cmds.push("M");
                                crds.push(x, y);
                                ox = x;
                                oy = y;
                            } else if (cmu == "L") {
                                x = xi + ts[i++];
                                y = yi + ts[i++];
                                cmds.push("L");
                                crds.push(x, y);
                            } else if (cmu == "H") {
                                x = xi + ts[i++];
                                cmds.push("L");
                                crds.push(x, y);
                            } else if (cmu == "V") {
                                y = yi + ts[i++];
                                cmds.push("L");
                                crds.push(x, y);
                            } else if (cmu == "Q") {
                                var x1 = xi + ts[i++], y1 = yi + ts[i++], x2 = xi + ts[i++], y2 = yi + ts[i++];
                                cmds.push("Q");
                                crds.push(x1, y1, x2, y2);
                                x = x2;
                                y = y2;
                            } else if (cmu == "T") {
                                var co = Math.max(crds.length - 2, oldo);
                                var x1 = x + x - crds[co], y1 = y + y - crds[co + 1];
                                var x2 = xi + ts[i++], y2 = yi + ts[i++];
                                cmds.push("Q");
                                crds.push(x1, y1, x2, y2);
                                x = x2;
                                y = y2;
                            } else if (cmu == "C") {
                                var x1 = xi + ts[i++], y1 = yi + ts[i++], x2 = xi + ts[i++], y2 = yi + ts[i++], x3 = xi + ts[i++], y3 = yi + ts[i++];
                                cmds.push("C");
                                crds.push(x1, y1, x2, y2, x3, y3);
                                x = x3;
                                y = y3;
                            } else if (cmu == "S") {
                                var co = Math.max(crds.length - (cmds[cmds.length - 1] == "C" ? 4 : 2), oldo);
                                var x1 = x + x - crds[co], y1 = y + y - crds[co + 1];
                                var x2 = xi + ts[i++], y2 = yi + ts[i++], x3 = xi + ts[i++], y3 = yi + ts[i++];
                                cmds.push("C");
                                crds.push(x1, y1, x2, y2, x3, y3);
                                x = x3;
                                y = y3;
                            } else if (cmu == "A") {
                                var x1 = x, y1 = y;
                                var rx = ts[i++], ry = ts[i++];
                                var phi = ts[i++] * (Math.PI / 180), fA = ts[i++], fS = ts[i++];
                                var x2 = xi + ts[i++], y2 = yi + ts[i++];
                                if (x2 == x && y2 == y && rx == 0 && ry == 0) continue;
                                var hdx = (x1 - x2) / 2, hdy = (y1 - y2) / 2;
                                var cosP = Math.cos(phi), sinP = Math.sin(phi);
                                var x1A = cosP * hdx + sinP * hdy;
                                var y1A = -sinP * hdx + cosP * hdy;
                                var rxS = rx * rx, ryS = ry * ry;
                                var x1AS = x1A * x1A, y1AS = y1A * y1A;
                                var frc = (rxS * ryS - rxS * y1AS - ryS * x1AS) / (rxS * y1AS + ryS * x1AS);
                                var coef = (fA != fS ? 1 : -1) * Math.sqrt(Math.max(frc, 0));
                                var cxA = coef * (rx * y1A) / ry;
                                var cyA = -coef * (ry * x1A) / rx;
                                var cx = cosP * cxA - sinP * cyA + (x1 + x2) / 2;
                                var cy = sinP * cxA + cosP * cyA + (y1 + y2) / 2;
                                var angl = function(ux, uy, vx, vy) {
                                    var lU = Math.sqrt(ux * ux + uy * uy), lV = Math.sqrt(vx * vx + vy * vy);
                                    var num = (ux * vx + uy * vy) / (lU * lV);
                                    return (ux * vy - uy * vx >= 0 ? 1 : -1) * Math.acos(Math.max(-1, Math.min(1, num)));
                                };
                                var vX = (x1A - cxA) / rx, vY = (y1A - cyA) / ry;
                                var theta1 = angl(1, 0, vX, vY);
                                var dtheta = angl(vX, vY, (-x1A - cxA) / rx, (-y1A - cyA) / ry);
                                dtheta = dtheta % (2 * Math.PI);
                                var arc = function(gst, x, y, r, a0, a1, neg) {
                                    var rotate = function(m, a) {
                                        var si = Math.sin(a), co = Math.cos(a);
                                        var a = m[0], b = m[1], c = m[2], d = m[3];
                                        m[0] = a * co + b * si;
                                        m[1] = -a * si + b * co;
                                        m[2] = c * co + d * si;
                                        m[3] = -c * si + d * co;
                                    };
                                    var multArr = function(m, a) {
                                        for (var j = 0; j < a.length; j += 2) {
                                            var x = a[j], y = a[j + 1];
                                            a[j] = m[0] * x + m[2] * y + m[4];
                                            a[j + 1] = m[1] * x + m[3] * y + m[5];
                                        }
                                    };
                                    var concatA = function(a, b) {
                                        for (var j = 0; j < b.length; j++) a.push(b[j]);
                                    };
                                    var concatP = function(p, r) {
                                        concatA(p.cmds, r.cmds);
                                        concatA(p.crds, r.crds);
                                    };
                                    if (neg) while (a1 > a0) a1 -= 2 * Math.PI; else while (a1 < a0) a1 += 2 * Math.PI;
                                    var th = (a1 - a0) / 4;
                                    var x0 = Math.cos(th / 2), y0 = -Math.sin(th / 2);
                                    var x1 = (4 - x0) / 3, y1 = y0 == 0 ? y0 : (1 - x0) * (3 - x0) / (3 * y0);
                                    var x2 = x1, y2 = -y1;
                                    var x3 = x0, y3 = -y0;
                                    var ps = [ x1, y1, x2, y2, x3, y3 ];
                                    var pth = {
                                        cmds: [ "C", "C", "C", "C" ],
                                        crds: ps.slice(0)
                                    };
                                    var rot = [ 1, 0, 0, 1, 0, 0 ];
                                    rotate(rot, -th);
                                    for (var j = 0; j < 3; j++) {
                                        multArr(rot, ps);
                                        concatA(pth.crds, ps);
                                    }
                                    rotate(rot, -a0 + th / 2);
                                    rot[0] *= r;
                                    rot[1] *= r;
                                    rot[2] *= r;
                                    rot[3] *= r;
                                    rot[4] = x;
                                    rot[5] = y;
                                    multArr(rot, pth.crds);
                                    multArr(gst.ctm, pth.crds);
                                    concatP(gst.pth, pth);
                                };
                                var gst = {
                                    pth: pth,
                                    ctm: [ rx * cosP, rx * sinP, -ry * sinP, ry * cosP, cx, cy ]
                                };
                                arc(gst, 0, 0, 1, theta1, theta1 + dtheta, fS == 0);
                                x = x2;
                                y = y2;
                            } else console.log("Unknown SVG command " + cmd);
                        }
                    }
                }
            }
            return {
                cssMap: cssMap,
                readTrnf: readTrnf,
                svgToPath: svgToPath,
                toPath: toPath
            };
        }(),
    };
    const QQ_GROUP = [ "854137118" ];
    var _self = unsafeWindow;
    var top = _self;
    var UE$1;
    var modelId = "modelId_xx";
    const selfintv = setInterval(() => {
        if (unsafeWindow) {
            _self = unsafeWindow;
            top = _self;
            UE$1 = _self.UE;
            try {
                while (top !== _self.top) {
                    top = top.parent.document ? top.parent : _self.top;
                    if (top.location.pathname === "/mycourse/studentstudy") break;
                }
            } catch (err) {
                top = _self;
            }
            clearInterval(selfintv);
        }
    }, GLOBAL.delay);
    top.addEventListener("message", event => {
        if (!event.data) return;
        if (event.data.nonce !== PANEL_NONCE) {
            var panelFrame = null;
            try { panelFrame = top.document.getElementById("iframeNode"); } catch (e) { panelFrame = null; }
            var trustedPanel = false;
            try { trustedPanel = !!(panelFrame && panelFrame.contentWindow && event.source === panelFrame.contentWindow); } catch (e) { trustedPanel = false; }
            if (!trustedPanel) return;
        }
        if (event.data.type === "jump") {
            GLOBAL.index++;
            iframeMsg("tip", {
                tip: "准备答第" + (GLOBAL.index + 1) + "题"
            });
        } else if (event.data.type === "stop") {
            GLOBAL.stop = event.data.val;
        } else if (event.data.type === "auto_jump") {
            GM_setValue("auto_jump", event.data.flag);
            iframeMsg("tip", {
                tip: "已" + (event.data.flag ? "开启" : "关闭") + "自动切换,页面刷新后生效"
            });
        } else if (event.data.type === "open_ai_setting") {
            openAiSettingWindow();
        } else if (event.data.type === "chat_send") {
            var rawMessages = Array.isArray(event.data.messages) ? event.data.messages.slice(-12) : [];
            var chatMessages = rawMessages.map(function (message) {
                var role = message && (message.role === 'assistant' ? 'assistant' : 'user');
                var content = String(message && message.content || '').trim().slice(0, 4000);
                return content ? { role: role, content: content } : null;
            }).filter(Boolean);
            if (!chatMessages.length) {
                iframeMsg('chat_result', { ok: false, msg: '请输入问题后再发送' });
                return;
            }
            aiChat([{ role: 'system', content: '你是一个乐于助人的中文学习助手，回答要简洁、准确、有条理。' }].concat(chatMessages), function (result) {
                iframeMsg('chat_result', result || { ok: false, msg: 'AI 未返回结果' });
            });
        } else if (event.data.type === "trace_ready" && event.data.nonce === PANEL_NONCE) {
            const history = top.__xxtDebugEvents;
            if (Array.isArray(history)) history.filter(entry => entry.time >= PANEL_STARTED_AT).slice(-30).forEach(entry => iframeMsg('trace', entry));
        }
    }, false);
    $(document).keydown(function(event) {
        if (event.keyCode === 38) {
            $("." + modelId).hide();
        } else if (event.keyCode === 40) {
            $("." + modelId).show();
        } else if (event.keyCode === 37) {
            $("." + modelId).hide();
            GM_setValue("hide", true);
        } else if (event.keyCode === 39) {
            $("." + modelId).show();
            GM_setValue("hide", false);
            GM_setValue("pos", "50px,50px");
        } else if (event.keyCode === 83) {
            GLOBAL.stop = true;
            iframeMsg("stop", GLOBAL.stop);
        } else if (event.keyCode === 68) {
            GLOBAL.stop = false;
            iframeMsg("stop", GLOBAL.stop);
        }
    });
    function setIntervalFunc(flag, func, time) {
        const interval = setInterval(() => {
            if (flag()) {
                clearInterval(interval);
                func();
            }
        }, time || 1e3);
    }
    function getQuestionType(str) {
        if (!str) return;
        str = str.trim().replaceAll(/\s+/g, "");
        if (TYPE[str]) return TYPE[str];
        const regex = Object.keys(TYPE).join("|");
        const matcher = str.match(regex);
        if (matcher) return TYPE[matcher[0]];
    }
    function rand(m, n) {
        return Math.ceil(Math.random() * (n - m + 1) + m - 1);
    }
    const TYPE = {
        "阅读理解（选择）/完型填空": 66,
        "听力训练": 66,
        multichoice: 1,
        singlechoice: 0,
        SingleChoice: 0,
        bijudgement: 3,
        Judgement: 3,
        "单项选择题": 0,
        "单项选择": 0,
        "单选题": 0,
        "单选": 0,
        "多选": 1,
        "多选题": 1,
        "案例分析": 1,
        "多项选择题": 1,
        "多项选择": 1,
        "客观题": 1,
        "填空题": 2,
        "填空": 2,
        "对错题": 3,
        "判断题": 3,
        "判断正误": 3,
        "判断": 3,
        "主观题": 4,
        "问答题": 4,
        "简答题": 4,
        "名词解释": 5,
        "论述题": 6,
        "计算题": 7,
        "其它": 8,
        "分录题": 9,
        "资料题": 10,
        "连线题": 11,
        "排序题": 13,
        "完形填空": 14,
        "完型填空": 14,
        "阅读理解": 15,
        "口语题": 18,
        "听力题": 19,
        "A1A2题": 1,
        "文件作答": 4,
        "视频题": 1
    };
    function sleep(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }
    function iframeMsg(type, message) {
        aiPanelMessage(type, message, top);
    }
    // 选项统一用 li 行作为单位，保证与选项数量一一对应；平台真正的点击目标
    //（li 内部的 [class*="before-after"] 容器）由 aiToggleOption 逐层尝试。
    function desktopChapterOptions(data) {
        if (![0, 1, 3, 66].includes(data.type)) return;
        const toRows = nodes => {
            const rows = [];
            nodes.forEach(node => {
                if (!node || node.nodeType !== 1) return;
                const row = node.closest ? node.closest('li') || node : node;
                if (rows.indexOf(row) < 0) rows.push(row);
            });
            return rows;
        };
        // 不同版本页面的结构差异较大：依次尝试「选项文本行」「控件所在行」「列表行」，
        // 取第一个与选项数量一致的方案，避免某一层结构变化就整题放弃作答。
        const candidates = [
            toRows(data.$item.find('ul:eq(0) li .after').toArray()),
            toRows(data.$options ? data.$options.toArray() : []),
            toRows(data.$item.find('ul:eq(0) li').toArray())
        ];
        const rows = candidates.find(list => list.length === data.options.length) || [];
        data.$options = jQuery(rows);
    }
    // 桌面章节测验的选中态可能挂在 li、内部 [class*="before-after"] / .after 容器
    //（aria-checked）或原生控件上，依次读取，任一位置给出明确结果即采用。
    function desktopChapterSelected($item) {
        const element = $item && $item.get ? $item.get(0) : $item;
        if (!element) return false;
        const nodes = [];
        const add = node => { if (node && nodes.indexOf(node) < 0) nodes.push(node); };
        add(element);
        if (element.closest) add(element.closest('[class*="before-after"]'));
        if (element.querySelector) {
            add(element.querySelector('[class*="before-after"]'));
            add(element.querySelector('.after'));
        }
        // 任一处给出「已选中」即认定选中。不能因外层容器残留 aria-checked="false" 就提前判否，
        // 否则真实已勾选的题会被判成未作答，章节核验失败后会无限重答。
        const input = element.querySelector ? element.querySelector('input[type="radio"],input[type="checkbox"]') : null;
        if (input && input.checked) return true;
        if (typeof element.checked === 'boolean' && element.checked) return true;
        for (const node of nodes) {
            if (node.getAttribute && node.getAttribute('aria-checked') === 'true') return true;
            if (node.classList && (node.classList.contains('check_answer') || node.classList.contains('check_answer_dx') || node.classList.contains('cur'))) return true;
            if (node.querySelector && node.querySelector('.check_answer, .check_answer_dx')) return true;
        }
        return false;
    }
    function desktopChapterVerified(results, total) {
        try {
            if (!aiAllQuestionsVerified(total, results)) return false;
            // 「已有页面答案，按设置跳过」的题没有请求令牌（跳过发生在建请求之前），
            // 这类题只看页面上是否真有答案，不能因为它没有 request 就判成未作答。
            let skipped = 0;
            for (let index = 0; index < total; index++) {
                const result = results[index];
                if (!result || result.skipped) { if (result && result.skipped) skipped++; continue; }
                if (!result.request || typeof result.request.isLive !== 'function' || !result.request.isLive()) return false;
            }
            // 该章节上一次提交被平台拒绝过，页面上的「已有答案」很可能就是被拒的那一份：
            // 沿用它们凑出的 100% 不是作答结果，重新提交只会再失败一次。
            if (skipped > 0 && aiChapterSubmitFailed(_self, '')) return false;
            return true;
        } catch (error) {
            console.warn('[chapter verify]', error);
            return false;
        }
    }
    // 桌面章节页的提交必须是平台的完整链路：
    // btnBlueSubmit → validateTimeNew（异步 /work/validate）→ toadd（把凭证写进 #enc / #answerwqbid）
    // → workPop「确认提交」→ submitCheckTimes → form1submit → confirmSubmitWork(POST)。
    // 直接调 submitCheckTimes 会跳过 toadd，表单里的 enc 还是空的，
    // version(url) 拼出的 pos 因此为空，服务端一律回「无效的参数：code-1！」并刷新整页。
    function desktopChapterSubmitWindows() {
        const windows = [];
        let current = _self;
        while (current) {
            try {
                if (!current.document) break;
                windows.push(current);
                const parent = current.parent;
                if (!parent || parent === current) break;
                void parent.document;
                current = parent;
            } catch (error) {
                break;
            }
        }
        return windows.length ? windows : [_self];
    }
    // 平台把待提交的题号清单写进 #answerwqbid，并由 toadd 顺带补齐全各类题型的答案，
    // 这一步跑过才说明 validate 通过、表单已备齐；只调 submitCheckTimes 会把这个清单留空，
    // 服务端拿不到题号，直接回「无效的参数：code-1！」。
    function desktopChapterFormReady() {
        for (const target of desktopChapterSubmitWindows()) {
            try {
                const ids = target.document.getElementById('answerwqbid');
                if (ids && String(ids.value == null ? '' : ids.value).trim()) return true;
            } catch (error) {}
        }
        return false;
    }
    // 平台在提交流程里弹出的拦截文案（账号异常等），由 desktopChapterTraceAlerts 回填。
    let desktopChapterAlertNote = '';
    // 平台拦住这次提交时的真实原因。validate 只在 status==3 时回调 toadd，
    // status==1 alert「账号发生异常」、status==2 弹验证码，这两种情况下确认框永远不会出现。
    // 只报「凭证未就绪」会把验证码说成交付失败，用户刷新页面再来一次照样交不上。
    function desktopChapterSubmitBlocker() {
        if (desktopChapterAlertNote) return desktopChapterAlertNote;
        for (const target of desktopChapterSubmitWindows()) {
            try {
                // antispider 拦截不一定弹 #verifyCodeWin：整页被 302 到验证页时
                // 提交表单根本没发出去，之后每次重试都只会再被挡一次。
                if (xxtRiskControlMark('', String(target.location && target.location.href || ''))) {
                    return '平台要求输入验证码（风控），请完成验证后再提交';
                }
            } catch (error) {}
            try {
                const verify = target.document.getElementById('verifyCodeWin');
                if (verify && verify.style && verify.style.display === 'block') {
                    return '平台要求输入提交验证码，请手动完成验证后再提交';
                }
            } catch (error) {}
        }
        return '';
    }
    // 上一次桌面提交被拦住的说明，供收尾流程如实上报。
    let desktopChapterSubmitNote = '';
    // 接管平台的「确认提交」弹窗，等价于用户自己点确定。
    // 返回 false 表示平台始终没进入提交流程（凭证没写进来），此时不能硬提交。
    async function desktopChapterConfirmSubmit() {
        desktopChapterSubmitNote = '';
        let confirmed = false;
        // 平台只会在 toadd 跑完之后才弹确认框，所以弹过框就等于说过一次「表单已备齐」，
        // 再等下去没有意义，直接结束，避免让用户白等 15 秒。
        let dialogSeen = false;
        const hooks = [];
        const release = () => {
            for (const hook of hooks) {
                try { if (hook.target.workPop === hook.hooked) hook.target.workPop = hook.original; } catch (error) {}
            }
            hooks.length = 0;
        };
        for (const target of desktopChapterSubmitWindows()) {
            try {
                const original = target.workPop;
                if (typeof original !== 'function') continue;
                const hooked = function (content, okText, cancelText, okcallback) {
                    // 只自动确认提交框；未及格重做等其它弹窗保持平台原样。
                    const message = String(content == null ? '' : content);
                    if (confirmed || !/确认提交/.test(message) || typeof okcallback !== 'function') {
                        return original.apply(this, arguments);
                    }
                    // toadd 会先写好待提交题号清单再弹框，清单为空说明这次提交是空表单，宁可不点。
                    if (!desktopChapterFormReady()) {
                        dialogSeen = true;
                        aiTrace('桌面提交：确认框已弹出但待提交清单为空，交由用户手动确认', 'warn', _self);
                        return original.apply(this, arguments);
                    }
                    confirmed = true;
                    try {
                        okcallback();
                    } catch (error) {
                        console.warn('[chapter submit]', error);
                    }
                    return undefined;
                };
                target.workPop = hooked;
                hooks.push({ target: target, original: original, hooked: hooked });
            } catch (error) {
                console.warn('[chapter submit hook]', error);
            }
        }
        try {
            await Promise.resolve(_self.btnBlueSubmit());
            const deadline = Date.now() + 15000;
            while (!confirmed && !dialogSeen && Date.now() < deadline) {
                await sleep(250);
                if (aiChapterAlreadyReviewed(_self, '')) break;
                // 平台已经明确拒绝（无效的参数 / code-1）：确认框永远不会来了，别让用户白等 15 秒。
                if (aiChapterSubmitFailed(_self, '')) break;
                // 弹了验证码就说明这次提交被平台拦在 /work/validate 之前，确认框不会出现。
                const blocker = desktopChapterSubmitBlocker();
                if (blocker) {
                    desktopChapterSubmitNote = blocker;
                    aiTrace('桌面提交：' + blocker, 'warn', _self);
                    break;
                }
            }
            // 弹窗没劫持到时，只有清单已经写好才允许走平台的 submitCheckTimes（否则就是 code-1 的来源）；
            // 平台已经回「已批阅」时更不能补一刀，那只会换来一次重复提交提示。
            if (!confirmed && !desktopChapterSubmitNote && !aiChapterAlreadyReviewed(_self, '') && desktopChapterFormReady()) {
                aiTrace('桌面提交：未捕获确认框但待提交清单已就绪，直接调用 submitCheckTimes', 'info', _self);
                if (typeof _self.submitCheckTimes === 'function') {
                    await Promise.resolve(_self.submitCheckTimes());
                    confirmed = true;
                }
            }
        } finally {
            release();
        }
        return confirmed;
    }
    function desktopChapterTraceAlerts() {
        desktopChapterAlertNote = '';
        const windows = desktopChapterSubmitWindows();
        try { if (_self.top !== _self && _self.top.document) windows.push(_self.top); } catch (error) {}
        for (const target of windows) {
            try {
                const original = target.alert;
                if (typeof original !== 'function') continue;
                const observed = function (message) {
                    const text = String(message == null ? '' : message);
                    aiTrace('平台提交弹窗：' + text, 'warn', _self);
                    // validate 的 status==1 只会 alert「账号发生异常」再返回，不会回调 toadd，
                    // 确认框因此永远不会出现；把它记下来，收尾时如实告诉用户卡在哪一步。
                    if (/账号发生异常|请刷新页面后重试/.test(text)) desktopChapterAlertNote = text;
                    // 风控验证提示走的是 alert 通道时（【9010】操作异常…），
                    // 光看 #verifyCodeWin 是看不到的，必须也记成拦截原因。
                    if (xxtRiskControlMark(text)) desktopChapterAlertNote = '平台要求输入验证码（风控），请完成验证后再提交';
                    // 先让协调层处理（回退提交锁 / 记已批阅），再独立判断要不要上报：
                    // 两者返回值无关，回退提交锁成功不代表用户已经知道这次没交上去。
                    const handled = aiObserveChapterAlert(_self, '', message);
                    // 平台自己拒绝了这次提交时必须如实报错，否则面板还显示「已发起提交」，
                    // 用户只看到一个莫名弹窗 + 整页刷新，完全不知道课没交上去。
                    if (!handled && /无效的参数|提交失败|参数错误|请重新提交/.test(text)) {
                        const tip = '平台拒绝提交：' + text + '（请刷新页面后重新提交）';
                        iframeMsg('tip', { type: 'hidden', tip: tip });
                        try { _self.top.unrivalWorkInfo = tip; } catch (error) {}
                    }
                    return original.apply(this, arguments);
                };
                target.alert = observed;
                const restore = () => { if (target.alert === observed) target.alert = original; };
                setTimeout(restore, 30000);
                window.addEventListener('pagehide', restore, { once: true });
            } catch (error) {
                console.warn('[chapter alert trace]', error);
            }
        }
    }
    async function finishDesktopChapterWork(_canAdvance, results, total, notes) {
        const report = message => {
            iframeMsg('tip', { type: 'hidden', tip: message });
            aiTrace('章节状态：' + message, /失败|异常|未就绪|取消|未完成|未通过/.test(message) ? 'warn' : 'info', _self);
            try { _self.top.unrivalWorkInfo = message; } catch (error) { console.warn('[chapter status]', error); }
        };
        // 章节收尾时把没通过的题号列出来，用户才知道该去手动补哪几题。
        const failSummary = (notes) => {
            const failed = Array.isArray(notes) ? notes.filter(Boolean) : [];
            if (failed.length) return failed;
            for (let index = 0; index < total; index++) {
                const result = results && results[index];
                // 只认「当前页面上真的还验得过」，不能只看 success 标记：
                // 沿用页面已有答案的题一旦页面选中被改掉，标记仍是成功，但实际已经不算作答。
                let passed = false;
                if (result && result.success && typeof result.verify === 'function') {
                    try { passed = result.verify() === true; } catch (error) { passed = false; }
                }
                if (passed) continue;
                // 没有记录 = 这一题根本没进过处理流程，与「填了但没通过校验」是两码事，
                // 文案要分开写，否则用户会去页面上找一道其实没被处理过的题。
                const label = result && result.request ? aiQuestionLabel(result.request) : '第 ' + (index + 1) + ' 题';
                const why = !result ? '未进入处理流程'
                    : result.skipped ? '页面已有答案已失效，需重新作答'
                    : '页面校验未通过或未作答';
                failed.push('#' + (index + 1) + '（' + label + '）：' + why);
            }
            // 日志整体还有长度上限，题目多时只列前几题并标注剩余数量。
            return failed.length > 5 ? failed.slice(0, 5).concat('…其余 ' + (failed.length - 5) + ' 题同类情况') : failed;
        };
        const setting = (name, fallback) => {
            try { return _self.top[name]; } catch (error) { return fallback; }
        };
        // 沿用了页面已有答案的题数。这些题没问过 AI，日志里要点明，否则用户会以为全部重新作答了。
        const reusedCount = () => {
            let count = 0;
            for (let index = 0; index < total; index++) {
                const result = results && results[index];
                if (result && result.skipped) count++;
            }
            return count;
        };
        const reusedText = () => {
            const count = reusedCount();
            return count ? '，其中 ' + count + ' 题沿用页面已有答案' : '';
        };
        const autoSubmit = String(setting('unrivalAutoSubmit', GM_getValue('unrivalautosubmit', '1'))) === '1';
        const autoSave = String(setting('unrivalAutoSave', GM_getValue('unrivalautosave', '1'))) === '1';
        // 两项同时开启时一律提交优先：保存会弹平台提示并可能刷新页面，导致整章重新作答。
        const allowSave = autoSave && !autoSubmit;
        // 保存前先随机等一小会儿：答完最后一题立刻保存，这个时序本身也是特征。
        const saveWithDelay = async () => {
            await sleep(saveDelayMs(2000));
            return Promise.resolve(_self.noSubmit());
        };
        // 上一次提交被平台拒绝时，「沿用页面已有答案」不算作答结果：
        // 页面上那一份很可能就是被拒的旧答案，直接沿用等于拿同一份答案再被拒一次。
        const reusedInvalid = reusedCount() > 0 && aiChapterSubmitFailed(_self, '');
        if (!desktopChapterVerified(results, total)) {
            if (reusedInvalid) {
                const failed = failSummary(notes);
                report('上次提交被平台拒绝，页面上的旧答案不再计入覆盖率，请取消勾选「跳过已作答」后重新作答' +
                    (failed.length ? '（未通过 ' + failed.length + ' 题）' : ''));
                return 'handled';
            }
            const failed = failSummary(notes);
            // 章节失败清单可能很长，先按 180 字裁剪，保证不会被 aiTrace 的 240 字上限直接截掉结论。
            const failedText = failed.length ? aiClip('未通过 ' + failed.length + ' 题：' + failed.join('；'), 180) : '';
            if (total > 0 && allowSave && typeof _self.noSubmit === 'function') {
                try {
                    await saveWithDelay();
                    report('有题目未完成或选中状态已变化，已发起保存，请检查后手动提交' + (failedText ? '（' + failedText + '）' : ''));
                } catch (error) {
                    console.error('[chapter save]', error);
                    report('有题目未完成，答案保存失败，请手动检查' + (failedText ? '（' + failedText + '）' : ''));
                }
            } else if (total > 0 && autoSubmit && autoSave) {
                report('有题目未完成或选中状态已变化，已按提交优先跳过保存，请检查后手动提交' + (failedText ? '（' + failedText + '）' : ''));
            } else {
                report(total ? '有题目未完成或选中状态已变化，请检查后手动提交' + (failedText ? '（' + failedText + '）' : '') : '未发现题目，已阻止自动提交');
            }
            return 'handled';
        }
        try {
            if (autoSubmit) {
                if (typeof _self.btnBlueSubmit !== 'function') {
                    if (allowSave && typeof _self.noSubmit === 'function') {
                        await saveWithDelay();
                        report('平台提交函数未就绪，已发起保存，请手动检查并提交');
                    } else {
                        report('平台提交函数未就绪，请手动检查并提交');
                    }
                    return 'handled';
                }
                report('作答覆盖率 100%' + reusedText() + '，页面选项已核验，准备提交');
                await sleep(saveDelayMs(2000));
                // 手机章节页可能还在跑 AI 请求：共享注册表里只要还有 pending，就说明这一章
                // 还没答完，抢在它前面提交等于把「答了一半」的卷子交上去，平台会回
                // 「无效的参数：code-1！」并刷新整页，整章白跑。
                const pendingWorkId = aiChapterWorkId(_self, '');
                if (pendingWorkId) {
                    const wait = await aiWaitChapterPendingRequests(_self, pendingWorkId, AI_CHAPTER_PENDING_WAIT_MS,
                        (pending, left) => report('等待其他页面在途题目请求收尾（剩余 ' + pending + ' 题，最长再等 ' +
                            Math.ceil(left / 1000) + ' 秒）'));
                    if (wait.timedOut) {
                        report('仍有 ' + wait.pending + ' 道题在途未结束，已取消本次自动提交，请稍后重试');
                        return 'handled';
                    }
                    if (wait.waited > 0) {
                        aiTrace('在途题目请求已收尾（等待 ' + (wait.waited / 1000).toFixed(1) + 's），继续提交', 'info', _self);
                    }
                }
                if (!desktopChapterVerified(results, total)) {
                    report('提交前页面状态发生变化，已取消自动提交');
                    return 'handled';
                }
                const claim = aiClaimChapterSubmit(_self, '', '桌面章节页');
                if (!claim.claimed) {
                    report(claim.reason === 'already-submitted' ? '同一章节已由其他页面发起提交，已阻止重复提交' : '无法确认章节提交状态，已阻止自动提交');
                    return 'handled';
                }
                desktopChapterTraceAlerts();
                aiTrace('桌面提交：调用 btnBlueSubmit', 'info', _self);
                // 由劫持到的「确认提交」回调触发 submitCheckTimes，保证 toadd 已把凭证写进表单。
                const submitted = await desktopChapterConfirmSubmit();
                if (aiChapterAlreadyReviewed(_self, '')) {
                    report('平台提示作业已批阅，停止重复提交');
                    return 'handled';
                }
                if (!submitted) {
                    report(desktopChapterSubmitNote || '平台未进入提交流程（凭证未就绪），请手动点击提交');
                    return 'handled';
                }
                aiTrace('桌面提交：submitCheckTimes 已返回，等待平台结果页', 'info', _self);
                report('已发起章节提交，请确认平台结果');
            } else if (autoSave) {
                if (typeof _self.noSubmit !== 'function') {
                    report('平台保存函数未就绪，请手动保存答案');
                    return 'handled';
                }
                await saveWithDelay();
                report('已发起答案保存，请确认平台提示');
            } else {
                report('作答覆盖率 100%' + reusedText() + '，请检查后手动保存或提交');
            }
        } catch (error) {
            console.error('[chapter finish]', error);
            report('章节保存或提交失败，请检查平台状态后手动处理');
        }
        return 'handled';
    }
    AI_STATUS_HOOKS.push(function (text) {
        iframeMsg("ai_status", text);
    });
    function getRecognitionDiagnostics(doc) {
        const target = doc || document;
        const bodyText = String(target.body && (target.body.innerText || target.body.textContent) || "").replace(/\s+/g, " ").trim();
        const encryptedElements = target.querySelectorAll ? target.querySelectorAll(".font-cxsecret") : [];
        const encryptedStyles = target.querySelectorAll ? Array.from(target.querySelectorAll("style")).filter(style => String(style.textContent || "").includes("font-cxsecret")) : [];
        const images = target.querySelectorAll ? Array.from(target.querySelectorAll("img[src]")).slice(0, 5).map(image => image.currentSrc || image.src) : [];
        return {
            textPreview: bodyText.slice(0, 180) || "未读取到可见文本",
            encryptedElementCount: encryptedElements.length,
            encryptedStyleCount: encryptedStyles.length,
            imageCount: target.querySelectorAll ? target.querySelectorAll("img[src]").length : 0,
            imagePreview: images
        };
    }
    function escapeLogHtml(value) {
        return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function filterImg(dom) {
        if (location.host === "ncexam.cug.edu.cn") {
            String.prototype.trim = function() {
                return this.replace(/^\s+|\s+$/gm, "");
            };
        }
        return $(dom).clone().find("img[src]").replaceWith(function() {
            return $("<p></p>").text('<img src="' + $(this).attr("src") + '">');
        }).end().find("iframe[src]").replaceWith(function() {
            return $("<p></p>").text('<iframe src="' + $(this).attr("src") + '"></irame>');
        }).end().text().trim();
    }
    function isDomQuestionAnswered(dom) {
        try {
            var node = dom && dom[0] ? dom[0] : (dom || null);
            if (!node || !node.querySelectorAll) return false;
            if (node.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').length > 0) return true;
            if (node.querySelector('.check_answer, .check_answer_bg, .cur, [aria-checked="true"]')) return true;
            var inputs = node.querySelectorAll('input[type="text"], textarea, .answerInput');
            for (var i = 0; i < inputs.length; i++) {
                if (String(inputs[i].value || '').replace(/\s/g, '') !== '') return true;
            }
            var iframes = node.querySelectorAll('iframe');
            for (var j = 0; j < iframes.length; j++) {
                try {
                    var d = iframes[j].contentDocument || (iframes[j].contentWindow && iframes[j].contentWindow.document);
                    var body = d && d.body;
                    if (body && String(body.innerText || '').replace(/\s/g, '') !== '') return true;
                } catch (e) {}
            }
        } catch (e) {}
        return false;
    }
    function createContainer(name, childElem) {
        name = name.toLowerCase();
        let elem = top.document.createElement(name);
        elem.style.display = "block";
        elem.id = name.replace("hcsearche", "hcSearche").replace(/\-[a-z]/g, function(w) {
            return w.replace("-", "").toUpperCase();
        });
        if (childElem) {
            if (Array.isArray(childElem) === false) childElem = [ childElem ];
            for (let i = 0; i < childElem.length; i++) elem.appendChild(childElem[i]);
        }
        return elem;
    }
    function dragModel(panel, handle) {
        let active = null;
        const move = event => {
            if (!active || event.pointerId !== active.pointerId) return;
            const maxLeft = Math.max(0, top.innerWidth - (panel.offsetWidth <= top.innerWidth ? panel.offsetWidth : 32));
            const maxTop = Math.max(0, top.innerHeight - (panel.offsetHeight <= top.innerHeight ? panel.offsetHeight : 32));
            panel.style.left = Math.min(maxLeft, Math.max(0, active.left + event.clientX - active.x)) + 'px';
            panel.style.top = Math.min(maxTop, Math.max(0, active.top + event.clientY - active.y)) + 'px';
        };
        const finish = event => {
            if (!active || event.pointerId !== active.pointerId) return;
            active = null;
            top.removeEventListener('pointermove', move, true);
            top.removeEventListener('pointerup', finish, true);
            top.removeEventListener('pointercancel', finish, true);
            GM_setValue('pos', panel.style.left + ',' + panel.style.top);
        };
        handle.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            event.preventDefault();
            const rect = panel.getBoundingClientRect();
            active = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
            top.addEventListener('pointermove', move, true);
            top.addEventListener('pointerup', finish, true);
            top.addEventListener('pointercancel', finish, true);
            try { handle.setPointerCapture(event.pointerId); } catch (error) {}
        });
    }
    function defaultWorkTypeResolver($options) {
        function count(selector) {
            let sum = 0;
            for (const option of $options || []) {
                if ($(option).find(selector).length || $(option).parent().find(selector).length) {
                    sum++;
                }
            }
            return sum;
        }
        return count('[type="radio"]') === 2 ? 3 : count('[type="radio"]') > 2 ? 0 : count('[type="checkbox"]') > 2 ? 1 : count("textarea") >= 1 ? 4 : undefined;
    }
    async function formatSearchAnswer(initData) {
            const data = {
                question: initData.question,
                options: initData.options,
                type: initData.type,
                requestMeta: initData.requestMeta
            };
            if (!aiAvailable()) return { success: false, msg: aiDisabledHint() };
            iframeMsg("tip", { tip: "正在调用 AI 作答..." });
            const answers = await aiModelAnswer(data);
            if (answers.length > 0) return { success: true, msg: "AI 作答", num: 1, list: [ answers ] };
            const hint = aiFailureHint(initData.requestMeta && initData.requestMeta.requestId);
            return { success: false, msg: hint ? hint + '，已跳过该题' :
                '模型没有返回可映射的选项答案（' + aiTypeName(initData.type) + '），请检查接口、模型和提示词设置' };
        }
    function isTrue(str) {
        return Boolean(String(str).match(/(^|,)(正确|是|对|√|T|ri|true|A)(,|$)/));
    }
    function isFalse(str) {
        return Boolean(String(str).match(/(^|,)(错误|否|错|×|F|不是|wr|false|B)(,|$)/));
    }
    async function defaultQuestionResolve(list, data, handler, ignore_click, isCurrent) {
        if (data.type === 4 || data.type === 2 || data.type === 5) {
            const answers = list[0] || [];
            const answerCount = data.$options ? data.$options.length : 0;
            if (!answerCount || answers.length !== answerCount || answers.some(answer => !String(answer).trim()) || typeof handler !== "function") {
                return { type: data.type, style: "warning-row", ans: "答案与填空控件数量不一致，未完成作答", question: data.question };
            }
            const normalizeText = value => {
                const container = document.createElement('div');
                container.innerHTML = String(value == null ? '' : value);
                return String(container.textContent || '').replace(/\s+/g, ' ').trim();
            };
            const readFilledAnswer = $option => {
                const element = $option.get(0);
                if (!element || !element.isConnected) return null;
                const input = element.matches('input,textarea') ? element : element.querySelector('textarea,input');
                let actual = input ? input.value : element.isContentEditable ? element.innerHTML : null;
                const editorIds = input ? [input.name, input.id].filter(Boolean) : [];
                if (editorIds.length && typeof UE$1 !== 'undefined' && UE$1 && UE$1.instants) {
                    const editor = Object.values(UE$1.instants).find(editor => editor && (editorIds.includes(editor.key) || editor.textarea === input));
                    if (editor && typeof editor.getContent === 'function') actual = editor.getContent();
                }
                return actual;
            };
            const filledOptions = [];
            for (let index = 0; index < answerCount; index++) {
                if (typeof isCurrent === "function" && !isCurrent()) {
                    return { type: data.type, style: "warning-row", ans: "题目已切换，已丢弃过期答案", question: data.question };
                }
                const $option = data.$options.eq(index);
                await handler(data.type, answers[index], $option);
                if (typeof isCurrent === "function" && !isCurrent()) {
                    return { type: data.type, style: "warning-row", ans: "题目已切换，已丢弃过期答案", question: data.question };
                }
                const actual = readFilledAnswer($option);
                if (actual === null || normalizeText(actual) !== normalizeText(answers[index])) {
                    return { type: data.type, style: "warning-row", ans: "页面填充结果未通过校验，未完成作答", question: data.question };
                }
                filledOptions.push($option);
            }
            return { type: data.type, style: "success-row", ans: answers.join("===="), question: data.question,
                verify: () => filledOptions.every(($option, index) => {
                    const actual = readFilledAnswer($option);
                    return actual !== null && normalizeText(actual) === normalizeText(answers[index]);
                }) };
        }
        if (![0, 1, 3, 66].includes(data.type) || !Array.isArray(data.options) || !data.$options || data.$options.length !== data.options.length) {
            return { type: data.type, style: "warning-row", ans: "题目选项结构不完整，未作答", question: data.question };
        }
        let answers = list.length === 1 ? list[0] : [];
        if (data.type === 3) {
            const judgment = aiParseAnswer((answers || []).join(""), { type: 3 });
            if (judgment.length !== 1) {
                return { type: data.type, style: "warning-row", ans: "判断题答案无效，未作答", question: data.question };
            }
            const desired = judgment[0] === "正确";
            const optionIndexes = data.options.map((option, index) => (desired ? isTrue(option) : isFalse(option)) ? index : -1).filter(index => index >= 0);
            if (optionIndexes.length !== 1) return { type: data.type, style: "warning-row", ans: "无法唯一定位判断选项，未作答", question: data.question };
            answers = [String.fromCharCode(65 + optionIndexes[0])];
        }
        const optionElements = [];
        for (let index = 0; index < data.$options.length; index++) optionElements.push(data.$options.eq(index));
        const isSelected = $item => {
            const element = $item.get(0);
            if (element && typeof element.checked === "boolean") return element.checked;
            return Boolean(ignore_click($item, data.type));
        };
        const selection = await aiSelectOptions(optionElements, answers, data.type, isSelected, $item => {
            const element = $item.get(0);
            if (!element) throw new Error("option is not clickable");
            if (aiToggleOption(element, () => isSelected($item))) return;
            if (typeof element.click !== "function") throw new Error("option is not clickable");
        }, isCurrent, () => sleep(GLOBAL.fillAnswerDelay));
        if (!selection.success) {
            const messages = {
                "invalid-answer": "模型答案与当前选项不匹配，未作答",
                "stale-question": "题目已切换，已丢弃过期答案",
                "click-failed": "页面未选中目标选项，作答失败",
                "selection-mismatch": "页面选中结果与目标答案不一致，作答失败",
                "click-error": "点击选项失败，作答未完成"
            };
            return { type: data.type, style: "warning-row", ans: messages[selection.reason] || "选项验证失败，未作答", question: data.question };
        }
        const selectedIndexes = selection.indexes;
        const verify = () => optionElements.every(($item, index) => {
            const element = $item.get(0);
            return element && element.isConnected && isSelected($item) === selectedIndexes.includes(index);
        });
        return {
            type: data.type,
            style: "primary-row",
            ans: selectedIndexes.map(index => data.options[index]).join("===="),
            question: data.question,
            verify: verify
        };
    }
    function HTMLDecode(text) {
        var temp = document.createElement("div");
        temp.innerHTML = text;
        var output = temp.innerText || temp.textContent;
        temp = null;
        return output;
    }
    function formatString(src) {
        src = String(src);
        src = src.includes("img") || src.includes("iframe") ? src : HTMLDecode(src);
        src = src.replace(/[\uff01-\uff5e]/g, function(str) {
            return String.fromCharCode(str.charCodeAt(0) - 65248);
        });
        return src.replace(/\s+/g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/。/g, ".").replace(/[,.?:!;]$/, "").trim();
    }
    var vm = {
        hideTip() {
            var tip = document.createElement("div");
            tip.id = "yinc";
            tip.innerHTML = `
        <div style="
            position:fixed;
            right:0;
            top:10%;
            color: #8a6d3b;
            background-color: #fcf8e3;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid transparent;
            border-radius: 4px;
            border-color: #faebcc;">
            学习通助手已被隐藏<br>如果需要显示答题面板，请按键盘右箭头
        <button style="
            padding: 0;
            color: inherit;
            border: 0;
            background: inherit;
            top:-22px;
            position:relative"
            type="button" id="cl_yinc" data-dismiss="alert" aria-label="Close">&times;</button>
        </div>`;
            top.document.getElementsByTagName("body")[0].appendChild(tip);
            top.document.querySelector("#cl_yinc").onclick = function() {
                top.document.querySelector("#yinc").remove();
            };
            setTimeout(() => {
                top.document.querySelector("#yinc").remove();
            }, 3e3);
        }
    };
    function showPanel() {
        let html = XXT_UI.panelHtml({
            elementCss: GM_getResourceText("ElementUiCss"),
            vue: GM_getResourceText("Vue"),
            elementUi: GM_getResourceText("ElementUi"),
            nonce: PANEL_NONCE,
            aiStatusText: aiStatusText(),
            autoJump: GM_getValue("auto_jump")
        });
        addModal2(html);
    }
    // 浮层面板尺寸：常量只是上限，视口更小时按可用空间收缩，避免面板超出屏幕
    // 或撑出横向滚动条。520x720 才够放下内嵌课程页的桌面双栏视频区。
    function addModal2(html, newPos, footerChildNode = false) {
        let headersNode = createContainer("hcsearche-modal-links");
        let dragHandle = top.document.createElement('button');
        dragHandle.type = 'button';
        dragHandle.className = 'xxt-drag-handle';
        dragHandle.title = '拖动答题窗口';
        dragHandle.setAttribute('aria-label', '拖动答题窗口');
        dragHandle.textContent = '⠿';
        dragHandle.style.cssText = 'display:block;width:100%;height:22px;padding:0;border:0;border-bottom:1px solid #d8e2ed;background:#edf3f9;color:#526273;font-size:18px;line-height:20px;cursor:grab;touch-action:none;';
        headersNode.appendChild(dragHandle);
        const viewportWidth = Number(top.innerWidth) || PANEL_WIDTH;
        const viewportHeight = Number(top.innerHeight) || GLOBAL.length;
        const panelWidth = Math.max(280, Math.min(PANEL_WIDTH, viewportWidth - 16));
        const panelHeight = Math.max(280, Math.min(GLOBAL.length, viewportHeight - 60));
        let iframeNode = top.document.createElement("iframe");
        iframeNode.id = "iframeNode";
        iframeNode.setAttribute("width", "100%");
        iframeNode.setAttribute("height", panelHeight + "px");
        iframeNode.setAttribute("style", "display:block;border:0;width:100%;height:" + panelHeight + "px");
        iframeNode.setAttribute("frameborder", "0");
        iframeNode.srcdoc = html;
        let contentNode = createContainer("content-modal", [ headersNode, iframeNode ]);
        contentNode.style.width = panelWidth + "px";
        let modal = renderModal(contentNode);
        modal.dataset.xxtOwner = PANEL_NONCE;
        dragModel(modal, dragHandle);
        if (GM_getValue("hide")) {
            $("#" + modelId).hide();
            vm.hideTip();
        }
    }
    function renderModal(childElem, newPos) {
        return render(String.fromCharCode(rand(65, 90), rand(65, 90), rand(65, 90)) + rand(1, 100).toString(), modelId, childElem);
    }
    function render(tagName, elemId, childElem, isFixed, newPos) {
        let doc = top.document;
        let elem = doc.getElementById(elemId);
        if (elem) {
            elem.innerHTML = "";
        } else {
            elem = doc.createElement(tagName);
            elem.id = elemId;
            doc.body.appendChild(elem);
        }
        let contentNode = createContainer(tagName + "-container", childElem);
        elem.appendChild(contentNode);
        elem.classList.add(elemId);
        elem.style.zIndex = "9999999";
        elem.style.position = "fixed";
        const pos = GM_getValue("pos") === undefined ? "30px,30px" : GM_getValue("pos");
        const posarr = pos.split(",");
        // 面板变宽后，老的记忆位置可能把面板顶到屏幕外，这里按视口把左上角夹回可视区。
        const parsePos = (value, limit) => {
            const num = Number(String(value || "").replace("px", ""));
            if (!isFinite(num)) return 0;
            return limit > 0 ? Math.max(0, Math.min(num, limit)) : Math.max(0, num);
        };
        const panelWidth = elem.offsetWidth || 0;
        elem.style.left = parsePos(posarr[0], panelWidth ? (Number(top.innerWidth) || 0) - panelWidth - 8 : 0) + "px";
        elem.style.top = parsePos(posarr[1], (Number(top.innerHeight) || 0) - 40) + "px";
        setTimeout(function() {
            elem.classList.add(elemId + "-show");
        }, 10);
        return elem;
    }
    const init$1 = async ($TiMu, select, wrap) => {
        let question = formatString(filterImg($TiMu.find(select.elements.question)));
        if (select.elements.type && select.elements.type.includes("input[name^=type]:eq")) {
            select.elements.type = "input[name^=type]:eq(" + GLOBAL.i + ")";
        }
        let data = {
            $item: $TiMu,
            question_text: $TiMu.find(select.elements.question).text(),
            question: question.length === 0 ? $TiMu.find(select.elements.question) : question.replace(/^\d+、/, "").replace(/[(（](\d+\s?(\.\d+)?分)[)）]$/, "").replace(/^((\d+.(\s+)?)?)[\[(（【](.*?)[】)）\]]/, "").trim(),
            $options: select.elements.$options ? $TiMu.find(select.elements.$options) : undefined,
            options: select.elements.options ? jQuery.map($TiMu.find(select.elements.options), function(val) {
                return formatString(filterImg(val)).replace(/^[A-Ga-g][.、]/, "").trim();
            }) : undefined
        };
        if (select.elements.type) {
            const getType = getQuestionType($TiMu.find(select.elements.type).text());
            const val = $TiMu.find(select.elements.type).val();
            data.type = isNaN(getType) ? isNaN(val) ? val : parseInt(val) : getType;
        } else {
            data.type = defaultWorkTypeResolver(data.$options);
        }
        if (data && data.type === 3 && data.options.length === 0) {
            data.options = [ "正确", "错误" ];
        }
        const r = await wrap(data);
        if (typeof r === "boolean") return undefined;
        return data;
    };
    async function WorkerJSPlus(options) {
        if (GLOBAL.isMatch) return;
        const match = options.match ? typeof options.match === "boolean" ? options.match : options.match() : false;
        if (!match) return;
        GLOBAL.isMatch = true;
        if (options.hook && typeof options.hook === "function") {
            if (options.hook()) return;
        }
        let pageActive = true;
        window.addEventListener('pagehide', () => {
            pageActive = false;
            aiRemovePanel(_self, PANEL_NONCE);
        }, { once: true });
        const defaultFunc = () => {};
        const main = () => {
            setTimeout(() => {
                if (!pageActive) return;
                if (options.init && typeof options.init === "function") {
                    if (options.init()) return;
                }
                if (!jQuery(options.root).length) return;
                showPanel();
                const select = {
                    name: options.name,
                    root: options.root,
                    elements: options.elements,
                    ignore_click: options.ignore_click
                };
                new WorkerJS(select, options.wrap ? options.wrap : defaultFunc, options.fill ? options.fill : defaultFunc, options.finished ? options.finished : defaultFunc, options.fillFinish ? options.fillFinish : defaultFunc).fillAnswer();
            }, GLOBAL.delay);
        };
        if (options.intv) {
            setIntervalFunc(options.intv, main);
        } else {
            main();
        }
    }
    var WorkerJS = function(select, searchHander, fillHander, onFinish = function(need_jump) {}, fillFinish = function() {}) {
        GLOBAL.index = 0;
        this.init = init$1;
        this.fillAnswer = async () => {
            let arr = jQuery(select.root);
            const seenItems = new WeakSet();
            let failedQuestions = 0;
            let lastIterationSkipped = false;
            const verifiedResults = [];
            // 记录每题失败原因，章节收尾时汇总进状态日志。
            const failedNotes = [];
            const noteFailure = (label, reason) => {
                failedQuestions++;
                // reason 可能是内部代号（如 invalid-answer），统一翻成人话再汇总。
                failedNotes.push('#' + label + '：' + aiQuestionFailText(reason));
            };
            while (true) {
                if (arr.length === 0) return;
                // 「跳过已作答」命中的题目不需要等 AI 回复，也就不必再等那 12 秒风控间隔，
                // 否则整卷已答完时会白等十几秒 × 题量。跳过分支不向平台发任何请求，收紧间隔无风控代价。
                // 队列已空时沿用上一轮的节奏：上一题只是跳过（没动页面）就快速收尾；
                // 上一题真正填过答案则保留完整间隔，让平台有时间落库再提交。
                const pendingItem = GLOBAL.index < arr.length ? jQuery(arr[GLOBAL.index]) : null;
                // 暂停期间保持原来的慢节奏，避免 120ms 空转。
                const noAiNeeded = !GLOBAL.stop && (pendingItem ? (aiSkipAnswered() && isDomQuestionAnswered(pendingItem)) : lastIterationSkipped);
                if (pendingItem && !GLOBAL.stop) lastIterationSkipped = noAiNeeded;
                await sleep(noAiNeeded ? AI_SKIP_ANSWERED_DELAY_MS : answerIntervalMs());
                if (GLOBAL.stop) {
                    continue;
                }
                if (GLOBAL.index >= arr.length) {
                    let auto_jump = GM_getValue("auto_jump") === undefined || GM_getValue("auto_jump");
                    const next = await onFinish(auto_jump && failedQuestions === 0, verifiedResults, arr.length, failedNotes);
                    if (next === 'handled') return true;
                    if (next) {
                        GLOBAL.index = 0;
                        setTimeout(this.fillAnswer, 300);
                    }
                    if (auto_jump && failedQuestions === 0) {
                        iframeMsg("tip", {
                            tip: "自动答题已完成,即将切换下一题"
                        });
                        next || setTimeout(() => {
                            iframeMsg("tip", {
                                type: "hidden",
                                tip: "自动答题已完成,请检查提交"
                            });
                        }, answerIntervalMs());
                    } else if (auto_jump) {
                        iframeMsg("tip", { tip: "有题目未通过解析或页面选中校验，请检查后手动继续" });
                    } else {
                        iframeMsg("tip", {
                            tip: "自动答题已完成" + (arr.length === 1 ? ",请手动切换" : "请检查提交")
                        });
                    }
                    return true;
                }
                let activeRequest = null;
                try {
                    const item = jQuery(arr[GLOBAL.index++]);
                    const itemElement = item.get(0);
                    if (itemElement && seenItems.has(itemElement)) continue;
                    if (itemElement) seenItems.add(itemElement);
                    let data = await this.init(item, select, searchHander);
                    if (!data) {
                        noteFailure(GLOBAL.index, '题干/选项读取失败，未处理已跳过');
                        aiTrace('题目 #' + GLOBAL.index + '（' + aiSourceName(select.name || "WorkerJS") + '）读取失败：未能从页面取到题干或选项，已跳过该题', 'warn', _self);
                        iframeMsg("push", { index: GLOBAL.index, question: "题目未能读取", answer: "未处理，已跳过", style: "warning-row" });
                        continue;
                    }
                    if (aiSkipAnswered() && isDomQuestionAnswered(jQuery(arr[GLOBAL.index - 1]))) {
                        const skippedItem = jQuery(arr[GLOBAL.index - 1]);
                        // 跳过分支发生在建请求之前，没有 request 令牌，但题目确实已经处理过（页面上有答案）。
                        // 必须补一条记录，否则 verifiedResults 少一个下标，章节收尾会把它误报成「未作答」。
                        verifiedResults[GLOBAL.index - 1] = {
                            success: true,
                            request: null,
                            skipped: true,
                            verify: () => isDomQuestionAnswered(skippedItem)
                        };
                        aiTrace('题目 #' + GLOBAL.index + '（' + aiSourceName(select.name || "WorkerJS") + '）已有页面答案，按设置跳过（不覆盖已有答案）', 'info', _self);
                        iframeMsg("push", {
                            index: GLOBAL.index,
                            question: data.question,
                            answer: "已作答，跳过（不覆盖已有答案）",
                            style: "warning-row"
                        });
                        continue;
                    }
                    const itemRoot = data.$item.get(0);
                    const optionNodes = data.$options ? data.$options.toArray() : [];
                    const questionSignature = () => {
                        const currentQuestion = String(jQuery(itemRoot).find(select.elements.question).text() || "").trim();
                        const currentOptions = select.elements.options ? jQuery.map(jQuery(itemRoot).find(select.elements.options), val => formatString(filterImg(val)).replace(/^[A-Ga-g][.、]/, "").trim()) : [];
                        const controls = select.elements.$options ? jQuery(itemRoot).find(select.elements.$options).toArray() : [];
                        const sameNodes = controls.length === optionNodes.length && controls.every((node, index) => node === optionNodes[index]);
                        const typeValue = select.elements.type ? jQuery(itemRoot).find(select.elements.type).val() : data.type;
                        return JSON.stringify([location.href, currentQuestion, currentOptions, sameNodes, typeValue]);
                    };
                    const idInput = itemRoot.querySelector('input[name^="answer"],input[name^="questionId"],input[name^="questionid"]');
                    const questionKey = data.questionid || data.id || (idInput && (idInput.getAttribute('name') || idInput.id).replace(/^answer(?:check)?/, '')) || null;
                    const chapterWorkId = select.name === '超星章节测验' ? aiChapterWorkId(itemRoot.ownerDocument.defaultView || _self, '') : '';
                    const cacheContext = aiAnswerCacheContext(chapterWorkId, questionKey, data.type, data.question, data.options);
                    const request = aiBeginQuestion(itemRoot, questionKey, select.name || "WorkerJS", questionSignature, chapterWorkId, GLOBAL.index, cacheContext);
                    if (!request) {
                        noteFailure(GLOBAL.index, '该题已有处理请求，本次跳过');
                        aiTrace('题目 #' + GLOBAL.index + '（' + aiSourceName(select.name || "WorkerJS") + '）已有处理请求，本次跳过（重复请求已拦截）', 'warn', _self);
                        iframeMsg("push", { index: GLOBAL.index, question: data.question, answer: "该题已有处理请求，本次跳过", style: "warning-row" });
                        continue;
                    }
                    activeRequest = request;
                    data.requestMeta = { requestId: request.id, questionId: request.key, source: request.source };
                    aiTrace('题目 #' + GLOBAL.index + '（' + aiSourceName(select.name || "WorkerJS") + '）开始作答：' + aiTypeName(data.type) + ' ' +
                        (Array.isArray(data.options) ? data.options.length : 0) + ' 选项「' + aiStem(data.question, 16) + '」，题号 ' +
                        aiClip(request.key || '未提供', 18), 'info', _self);
                    iframeMsg("tip", {
                        tip: "准备答第" + GLOBAL.index + "题"
                    });
                    const cachedAnswers = aiGetCrossPageAnswer(_self, cacheContext);
                    const formatResult = cachedAnswers ? {
                        success: true,
                        msg: '复用另一页面已核验答案',
                        num: 0,
                        list: [cachedAnswers]
                    } : await formatSearchAnswer(data);
                    if (!cachedAnswers && !formatResult.success) {
                        const recoveredAnswers = await aiWaitCrossPageAnswer(_self, cacheContext, 5000);
                        if (recoveredAnswers) {
                            formatResult.success = true;
                            formatResult.msg = '复用另一页面已核验答案';
                            formatResult.list = [recoveredAnswers];
                            aiTrace('题目 #' + GLOBAL.index + '（' + aiSourceName(select.name || "WorkerJS") +
                                '）请求失败后复用另一页面已核验答案', 'info', _self);
                        }
                    }
                    if (cachedAnswers) {
                        aiTrace('题目 #' + GLOBAL.index + '（' + aiSourceName(select.name || "WorkerJS") +
                            '）复用另一页面已核验答案，跳过重复 AI 请求', 'info', _self);
                    }
                    if (formatResult.success && request.isCurrent()) {
                        iframeMsg("tip", {
                            tip: "准备填充 AI 答案"
                        });
                        let r = await defaultQuestionResolve(formatResult.list, data, fillHander, select.ignore_click ? select.ignore_click : () => {
                            return false;
                        }, request.isCurrent);
                        const filled = r.style === "primary-row" || r.style === "success-row";
                        const success = request.finish(filled, filled ? "selection-verified" : r.ans);
                        if (filled && !success) {
                            r.style = "warning-row";
                            r.ans = "题目已切换，已丢弃过期答案";
                        }
                        iframeMsg("push", {
                            index: GLOBAL.index,
                            question: r.question,
                            answer: r.ans,
                            style: r.style
                        });
                        if (success) {
                            aiRememberCrossPageAnswer(_self, cacheContext, formatResult.list[0]);
                            // 按下标存放而不是 push：aiAllQuestionsVerified 要求 results.length === total，
                            // 只有按下标填充，稀疏数组的 length 才等于总题数，收尾才能正确判出漏答题。
                            verifiedResults[GLOBAL.index - 1] = { success: true, request: request, verify: r.verify };
                            await fillFinish(r);
                        }
                        else noteFailure(GLOBAL.index, r.ans || '页面选中状态未通过校验');
                    } else {
                        const stillCurrent = request.isCurrent();
                        request.finish(false, stillCurrent ? formatResult.msg : "stale-question");
                        noteFailure(GLOBAL.index, stillCurrent ? formatResult.msg : '题目已切换，答案已作废');
                        iframeMsg("push", {
                            index: GLOBAL.index,
                            question: data.question,
                            answer: stillCurrent ? formatResult.msg : "题目已切换，已丢弃过期答案",
                            style: "warning-row"
                        });
                        iframeMsg("tip", {
                            tip: stillCurrent ? formatResult.msg : "题目已切换，已丢弃过期答案"
                        });
                    }
                } catch (e) {
                    if (activeRequest) activeRequest.finish(false, "processing-error");
                    noteFailure(GLOBAL.index, '处理异常：' + String(e && e.message || e));
                    console.table(e);
                    aiTrace('题目 #' + GLOBAL.index + '（' + aiSourceName(select.name || "WorkerJS") + '）处理异常：' + String(e && e.message || e) + '，已跳过该题', 'error', _self);
                    iframeMsg("push", { index: GLOBAL.index, question: "题目处理异常", answer: String(e && e.message || e), style: "warning-row" });
                }
            }
        };
    };
    // @thanks 特别感谢 qxin i 借鉴 网页限制解除(改) 开源地址 https://greasyfork.org/zh-CN/scripts/28497
    function init() {
        if (!rwl_userData || typeof rwl_userData !== "object") rwl_userData = {};
        rwl_userData.rules = rwl_userData.rules || {};
        rule = rwl_userData.rules.rule_def || {};
        hook_eventNames = String(rule.hook_eventNames || "").split("|");
        unhook_eventNames = String(rule.unhook_eventNames || "").split("|");
        eventNames = hook_eventNames.concat(unhook_eventNames);
        if (rule.dom0) {
            setInterval(clearLoop, 10 * 1e3);
            setTimeout(clearLoop, 1500);
            window.addEventListener("load", clearLoop, true);
            clearLoop();
        }
        if (rule.hook_addEventListener) {
            EventTarget.prototype.addEventListener = addEventListener;
            document.addEventListener = addEventListener;
            if (hasFrame) {
                for (let i = 0; i < hasFrame.length; i++) {
                    hasFrame[i].contentWindow.document.addEventListener = addEventListener;
                }
            }
        }
        if (rule.hook_preventDefault) {
            Event.prototype.preventDefault = function() {
                if (hook_eventNames.indexOf(this.type) < 0) {
                    Event_preventDefault.apply(this, arguments);
                }
            };
            if (hasFrame) {
                for (let i = 0; i < hasFrame.length; i++) {
                    hasFrame[i].contentWindow.Event.prototype.preventDefault = function() {
                        if (hook_eventNames.indexOf(this.type) < 0) {
                            Event_preventDefault.apply(this, arguments);
                        }
                    };
                }
            }
        }
        if (rule.hook_set_returnValue) {
            Event.prototype.__defineSetter__("returnValue", function() {
                if (this.returnValue !== true && hook_eventNames.indexOf(this.type) >= 0) {
                    this.returnValue = true;
                }
            });
        }
    }
    function addEventListener(type, func, useCapture) {
        var _addEventListener = this === document ? document_addEventListener : EventTarget_addEventListener;
        if (hook_eventNames.indexOf(type) >= 0) {
            _addEventListener.apply(this, [ type, returnTrue, useCapture ]);
        } else if (unhook_eventNames.indexOf(type) >= 0) {
            var funcsName = storageName + type + (useCapture ? "t" : "f");
            if (this[funcsName] === undefined) {
                this[funcsName] = [];
                _addEventListener.apply(this, [ type, useCapture ? unhook_t : unhook_f, useCapture ]);
            }
            this[funcsName].push(func);
        } else {
            _addEventListener.apply(this, arguments);
        }
    }
    function clearLoop() {
        var elements = getElements();
        for (var i in elements) {
            for (var j in eventNames) {
                var name = "on" + eventNames[j];
                if (Object.prototype.toString.call(elements[i]) == "[object String]") {
                    continue;
                }
                if (elements[i][name] !== null && elements[i][name] !== onxxx) {
                    if (unhook_eventNames.indexOf(eventNames[j]) >= 0) {
                        elements[i][storageName + name] = elements[i][name];
                        elements[i][name] = onxxx;
                    } else {
                        elements[i][name] = null;
                    }
                }
            }
        }
        document.onmousedown = function() {
            return true;
        };
    }
    function returnTrue(e) {
        return true;
    }
    function unhook_t(e) {
        return unhook(e, this, storageName + e.type + "t");
    }
    function unhook_f(e) {
        return unhook(e, this, storageName + e.type + "f");
    }
    function unhook(e, self, funcsName) {
        var list = self[funcsName];
        for (var i in list) {
            list[i](e);
        }
        e.returnValue = true;
        return true;
    }
    function onxxx(e) {
        var name = storageName + "on" + e.type;
        this[name](e);
        e.returnValue = true;
        return true;
    }
    function getElements() {
        var elements = Array.prototype.slice.call(document.getElementsByTagName("*"));
        elements.push(document);
        var frames = document.querySelectorAll("frame");
        if (frames) {
            hasFrame = frames;
            var frames_element;
            for (let i = 0; i < frames.length; i++) {
                frames_element = Array.prototype.slice.call(frames[i].contentWindow.document.querySelectorAll("*"));
                elements.push(frames[i].contentWindow.document);
                elements = elements.concat(frames_element);
            }
        }
        return elements;
    }
    var settingData = {
        status: 1,
        version: .1,
        message: "",
        positionTop: "0",
        positionLeft: "0",
        positionRight: "auto",
        addBtn: false,
        connectToTheServer: false,
        waitUpload: [],
        currentURL: "null",
        shortcut: 3,
        rules: {},
        data: []
    };
    var rwl_userData = null;
    var rule = null;
    var hasFrame = false;
    var storageName = "storageName";
    var hook_eventNames, unhook_eventNames, eventNames;
    var EventTarget_addEventListener = EventTarget.prototype.addEventListener;
    var document_addEventListener = document.addEventListener;
    var Event_preventDefault = Event.prototype.preventDefault;
    rwl_userData = GM_getValue("rwl_userData");
    if (!rwl_userData) {
        rwl_userData = settingData;
    }
    for (let value in settingData) {
        if (!rwl_userData.hasOwnProperty(value)) {
            rwl_userData[value] = settingData[value];
            GM_setValue("rwl_userData", rwl_userData);
        }
    }
    // @thanks 特别感谢 wyn大佬 提供的 字典匹配表 原作者 wyn665817@163.com 开源地址 https://scriptcat.org/script-show-page/432/code
    function removeF() {
        var $tip = $("style:contains(font-cxsecret)");
        if (!$tip.length) return;
        var font = $tip.text().match(/base64,([\w\W]+?)'/)[1];
        font = Typr.parse(base64ToUint8Array(font))[0];
        var table = JSON.parse(GM_getResourceText("Table"));
        var match = {};
        for (var i = 19968; i < 40870; i++) {
            $tip = Typr.U.codeToGlyph(font, i);
            if (!$tip) continue;
            $tip = Typr.U.glyphToPath(font, $tip);
            $tip = MD5(JSON.stringify($tip)).slice(24);
            match[i] = table[$tip];
        }
        $(".font-cxsecret").html(function(index, html) {
            $.each(match, function(key, value) {
                key = String.fromCharCode(key);
                key = new RegExp(key, "g");
                value = String.fromCharCode(value);
                html = html.replace(key, value);
            });
            return html;
        }).removeClass("font-cxsecret");
        function base64ToUint8Array(base64) {
            var data = window.atob(base64);
            var buffer = new Uint8Array(data.length);
            for (var i = 0; i < data.length; ++i) {
                buffer[i] = data.charCodeAt(i);
            }
            return buffer;
        }
    }
    function start() {
        try {
            removeF();
        } catch (e) {}
        try {
            init();
        } catch (e) {}
    }
    WorkerJSPlus({
        name: "学习通作业",
        match: location.pathname === "/mooc2/work/dowork" || location.pathname === "/mooc-ans/mooc2/work/dowork",
        root: ".questionLi",
        elements: {
            question: "h3",
            options: ".stem_answer .answerBg .answer_p, .textDIV, .eidtDiv",
            $options: ".stem_answer .answerBg, .textDIV, .eidtDiv",
            type: "input[type^=hidden]:eq(0)"
        },
        wrap: obj => {
            obj.question = obj.question.replace(obj.$item.find(".colorShallow").text(), "").replace(/^(\d+\.\s)/, "");
        },
        ignore_click: $item => {
            return Boolean($item.find(".check_answer,.check_answer_dx").length);
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2 || type === 5) {
                UE$1.getEditor($option.find("textarea").attr("name")).setContent(answer);
            }
        }
    });
    WorkerJSPlus({
        name: "超星旧版考试",
        match: (location.pathname === "/exam/test/reVersionTestStartNew" || location.pathname === "/exam-ans/exam/test/reVersionTestStartNew") && !location.href.includes("newMooc=true"),
        root: ".TiMu",
        elements: {
            question: ".Cy_TItle .clearfix",
            options: ".Cy_ulTop .clearfix",
            $options: ":radio, :checkbox, .Cy_ulTk textarea",
            type: "[name^=type]:not([id])"
        },
        ignore_click: $item => {
            return $item.get(0).checked;
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2 || type === 5) {
                UE$1.getEditor($option.attr("name")).setContent(answer);
            }
        },
        finished: auto_jump => {
            if (GLOBAL.__autoNextTimer) {
                clearInterval(GLOBAL.__autoNextTimer);
                GLOBAL.__autoNextTimer = null;
            }
            if (!auto_jump) return;
            GLOBAL.__autoNextTimer = setInterval(function () {
                try {
                    const $btn = $(".saveYl:contains(下一题)");
                    if (!$btn.length) return;
                    const btn = $btn.offset();
                    if (!btn) return;
                    var mouse = document.createEvent("MouseEvents"), arr = [ btn.left + Math.ceil(Math.random() * 80), btn.top + Math.ceil(Math.random() * 26) ];
                    mouse.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0, arr[0], arr[1], false, false, false, false, 0, null);
                    _self.event = $.extend(true, {}, mouse);
                    delete _self.event.isTrusted;
                    _self.getTheNextQuestion(1);
                } catch (e) {
                    console.log(e);
                }
            }, Math.ceil(GLOBAL.fillAnswerDelay * Math.random()) * 2);
        }
    });
    WorkerJSPlus({
        name: "超星章节测验",
        match: location.pathname === "/work/doHomeWorkNew" || location.pathname === "/mooc-ans/work/doHomeWorkNew",
        init: start,
        root: ".clearfix .TiMu",
        elements: {
            question: ".Zy_TItle .clearfix",
            options: "ul:eq(0) li .after",
            $options: "ul:eq(0) li :radio,:checkbox,textarea,.num_option_dx,.num_option",
            type: "input[name^=answertype]"
        },
        wrap: desktopChapterOptions,
        ignore_click: desktopChapterSelected,
        fill: async (type, answer, $option) => {
            if (type === 4 || type === 2 || type === 5) {
                UE$1.getEditor($option.attr("name")).setContent(answer);
            }
        },
        finished: finishDesktopChapterWork
    });
    WorkerJSPlus({
        name: "超星新版考试",
        match: () => {
            const cxSinglePage = (location.pathname === "/exam/test/reVersionTestStartNew" || location.pathname === "/exam-ans/exam/test/reVersionTestStartNew" || location.pathname === "/mooc-ans/exam/test/reVersionTestStartNew") && location.href.includes("newMooc=true");
            const cxAll = location.pathname === "/mooc2/exam/preview" || location.pathname === "/exam-ans/mooc2/exam/preview" || location.pathname === "/mooc-ans/mooc2/exam/preview";
            return cxSinglePage || cxAll;
        },
        root: ".questionLi",
        elements: {
            question: "h3 div",
            options: ".answerBg .answer_p, .textDIV, .eidtDiv",
            $options: ".answerBg, .textDIV, .eidtDiv",
            type: "input[name^=type]:eq(" + GLOBAL.i + ")"
        },
        ignore_click: $item => {
            return Boolean($item.find(".check_answer,.check_answer_dx").length);
        },
        hook: () => {
            GLOBAL.i = Number((location.pathname === "/exam/test/reVersionTestStartNew" || location.pathname === "/exam-ans/exam/test/reVersionTestStartNew" || location.pathname === "/mooc-ans/exam/test/reVersionTestStartNew") && location.href.includes("newMooc=true"));
        },
        wrap: obj => {
            if (obj.type === 6) {
                obj.type = 4;
            }
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2 || type === 5) {
                const name = $option.find("textarea").attr("name");
                UE$1.getEditor(name).setContent(answer);
                if (GLOBAL.i === 0) {
                    console.log("#" + name.replace("answerEditor", "save_"));
                    $("#" + name.replace("answerEditor", "save_")).click();
                }
            }
        },
        finished: a => {
            a && $('.nextDiv .jb_btn:contains("下一题")').click();
        }
    });
    WorkerJSPlus({
        name: "超星随堂测验",
        match: location.pathname.includes("/page/quiz/stu/answerQuestion"),
        root: ".question-item",
        elements: {
            question: ".topic-txt",
            options: ".topic-option-list",
            $options: ".topic-option-list input",
            type: "input[class^=que-type]"
        },
        ignore_click: $item => {
            return Boolean($item.find(".check_answer,.check_answer_dx").length);
        },
        wrap: obj => {
            if (obj.type === 16) {
                obj.type = 3;
            }
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2) {
                $option.val(answer);
            }
        }
    });
    GLOBAL.timeout = 10 * 1e3;

    function JSONParseHook(func) {
        const parse = JSON.parse;
        JSON.parse = function(...args) {
            const o = parse.call(this, ...args);
            // 回调只做旁路采集，绝不能让它的异常冒泡：一旦冒泡，页面上所有 JSON.parse
            // 调用（包括本脚本自己的配置读取）都会被这一处失败连带打断。
            try { func(o); } catch (e) { console.warn("[学习通助手] JSON 旁路采集失败，已跳过", e); }
            return o;
        };
    }

    function parseIcve(questions) {
        return questions.map(item => {
            const options = item.Selects.map(opt => {
                return formatString(opt);
            });
            const type = getQuestionType(item.ACHType.QuestionTypeName);
            const answer = item.Answers.map(key => {
                if (type === 0 || type === 1) {
                    return options[key.charCodeAt() - 65];
                } else if (type === 3) {
                    return key === "1" ? "正确" : "错误";
                }
            });
            const answerKey = type === 0 || type === 1 ? item.Answers : answer;
            return {
                id: item.Id,
                question: item.ContentText,
                answerKey: answerKey,
                options: type === 3 ? [ "正确", "错误" ] : options,
                answer: answer,
                type: type
            };
        });
    }
    WorkerJSPlus({
        name: "资源库 WWW开头",
        match: location.pathname === "/study/works/works.html" || location.pathname === "/study/exam/exam.html",
        root: ".questions",
        elements: {
            question: ".preview_stem",
            options: "li .preview_cont",
            $options: "li input",
            type: "input:hidden"
        },
        hook: () => {
            JSONParseHook(o => {
                if (location.pathname === "/study/works/works.html") {
                    if (o.paper) {
                        GLOBAL.json = parseIcve(o.paper.PaperQuestions);
                    }
                } else if (location.pathname === "/study/exam/exam.html") {
                    if (o.array) {
                        GLOBAL.json = parseIcve(o.array.map(item => {
                            return item.Questions;
                        }).flat());
                    }
                }
            });
        },
        ignore_click: $item => {
            return $item.prop("checked");
        },
        wrap: obj => {
            function get_element(id) {
                for (let jsonElement of GLOBAL.json) {
                    if (jsonElement.id === id) {
                        return jsonElement;
                    }
                }
            }
            const ele = get_element(obj.$item.find("input:hidden").val());
            obj.question = ele.question;
            obj.answer = ele.answerKey ? ele.answerKey : ele.answer;
            obj.type = ele.type;
            obj.options = ele.options;
            console.log(obj);
        },
        fill: (type, answer, $option) => {
            if (type === 4 || type === 2) {
                UE$1.getEditor($option.attr("name")).setContent(answer);
            }
        }
    });
 
    WorkerJSPlus({
        name: "exam2_euibe_com_exam",
        match: location.hostname === "exam2.euibe.com" && location.pathname === "/KaoShi/ShiTiYe.aspx",
        root: ".question",
        elements: {
            question: ".wenti",
            options: "li label span",
            $options: "li label"
        },
        wrap: obj => {
            obj.type = getQuestionType($(".question_head").text());
        },
        finished: need_jump => {
            $(".paginationjs-next").click();
            return true;
        }
    });
    WorkerJSPlus({
        name: "lzwyedu_jijiaool_com_exam",
        match: () => {
            const pathMatch = location.pathname.includes("/learnspace/course/test/") || location.pathname.includes("/Student/ExamManage/CourseOnlineExamination");
            const matchHostArr = [ "lzwyedu.jijiaool.com", "cgjx.jsnu.edu.cn", "learn-cs.icve.com.cn", "nwnu.jijiaool.com", "lut.jijiaool.com", "learn.courshare.cn", "cj1027-kfkc.webtrn.cn" ];
            return pathMatch && matchHostArr.includes(location.host);
        },
        root: ".test_item",
        elements: {
            question: ".test_item_tit",
            options: ".test_item_theme label .zdh_op_con",
            $options: "label input"
        },
        wrap: obj => {
            obj.question = obj.question.replace(/该题未做$/, "").replace(/^\d+\./, "").replace(/^\d+、/, "").replace(/[(（](\d+\s?(\.\d+)?分)[)）]$/, "").replace(/^((\d+.(\s+)?)?)[\[(（【](.*?)[】)）\]]/, "").trim();
            obj.type = getQuestionType(obj.$item.prevAll(".test_item_type:first").text());
            if (obj.type === 3) {
                obj.options = [ "对", "错" ];
            }
        }
    });
    WorkerJSPlus({
        name: "zzx_ouchn_edu_cn_exam",
        match: location.hostname === "zzx.ouchn.edu.cn" && location.pathname.includes("/edu/public/student/"),
        root: ".subject",
        elements: {
            question: ".question span",
            options: ".answer>span>p:first-child",
            $options: ".answer>span>p:first-child"
        },
        wrap: obj => {
            if (obj.$options.length > 1) {
                obj.type = 0;
            }
        }
    });
    WorkerJSPlus({
        name: "havust_hnscen_cn_exam",
        match: location.hostname === "havust.hnscen.cn" && location.pathname.includes("/stuExam/examing/"),
        root: ".main .mt_2 > div",
        elements: {
            question: ".flex_row+div",
            options: ".flex_row+div+div .el-radio__label,.el-checkbox__label",
            $options: ".flex_row+div+div .el-radio__label,.el-checkbox__label",
            type: ".flex_row .mr_2"
        }
    });
    WorkerJSPlus({
        name: "www_zygbxxpt_com_exam",
        match: location.hostname === "www.zygbxxpt.com" && location.pathname.includes("/exam"),
        root: ".Body",
        elements: {
            question: ".QName",
            options: ".QuestinXuanXiang p:parent",
            $options: ".QuestinXuanXiang p:parent",
            type: ".QName span"
        },
        wrap: obj => {
            obj.question = obj.question.replace(/\([^\)]*\)/g, "").replace(/\【.*?\】/g, "");
            obj.options = obj.options.map(item => {
                return item.split(">").pop().trim();
            });
        }
    });
    WorkerJSPlus({
        name: "xuexi_jsou_cn_work",
        match: location.hostname === "xuexi.jsou.cn" && location.pathname.includes("/jxpt-web/student/newHomework/showHomeworkByStatus"),
        root: ".insert",
        elements: {
            question: ".window-title",
            options: ".questionId-option .option-title div[style^=display]",
            $options: ".questionId-option .option-title .numberCover"
        },
        wrap: obj => {
            obj.type = {
                1: 0,
                2: 1,
                7: 3
            }[obj.$item.find(".question-type").val()];
            if (obj.options.length == 2) {
                obj.type = 3;
            }
        }
    });
    WorkerJSPlus({
        name: "czvtc_cjEdu_com_exam",
        match: () => {
            const pathMatch = location.pathname.includes("/ExamInfo") || location.pathname.includes("/Examination");
            const matchHostArr = [ "czvtc.cj-edu.com", "hbkjxy.cj-edu.com", "bhlgxy.cj-edu.com", "hbsi.cj-edu.com", "czys.cj-edu.com", "hbjd.cj-edu.com", "xttc.cj-edu.com", "bvtc.cj-edu.com", "caztc.cj-edu.com" ];
            return pathMatch && matchHostArr.includes(location.host);
        },
        intv: () => {
            return $(".el-container .all_subject>.el-row").length;
        },
        root: ".el-container .all_subject>.el-row",
        elements: {
            question: ".stem div:last-child",
            options: ".el-radio-group .el-radio__label,.el-checkbox-group .el-checkbox__label",
            $options: ".el-radio-group .el-radio__original,.el-checkbox-group .el-checkbox__original"
        },
        wrap: obj => {
            if (obj.$options.length < 3 && obj.$options.eq(0).attr("type") === "radio") {
                obj.type = 3;
            } else if (obj.$options.length > 2 && obj.$options.eq(0).attr("type") === "radio") {
                obj.type = 0;
            } else if (obj.$options.length > 2 && obj.$options.eq(0).attr("type") === "checkbox") {
                obj.type = 1;
            }
        }
    });
    WorkerJSPlus({
        name: "learning_mhtall_com_exam",
        match: location.host.includes("learning.mhtall.com") && location.pathname.includes("/rest/course/exercise/item"),
        root: "#div_item",
        elements: {
            question: ".item_title",
            options: ".opt div label",
            $options: ".opt div input:not(.button_short)",
            type: "h4"
        },
        ignore_click: $item => {
            return $item.prop("checked");
        },
        wrap: obj => {
            if (obj.type === 0 || obj.type === 3) {
                obj.answer = ($(".div_answer").text().match(/[a-zA-Z]/) || []).map(i => {
                    return obj.options[i.charCodeAt(0) - 65];
                });
            } else if (obj.type === 2) {
                obj.answer = $(".div_answer").text().replace("参考答案：", "").split("，");
            }
        },
        fill: (type, answer, $option) => {
            if (type === 2 || type === 4) {
                $option.val(answer);
                $(".DIV_TYPE_BLANK .button_short").click();
            }
        },
        fillFinish: () => {
            if ($(".opt+div+div input:eq(1)").val() === "下一题") {
                $(".opt+div+div input:eq(1)").click();
            } else {
                $(".button_short:eq(2)").click();
            }
        }
    });

})();

// ============================================================================
// 独立实现：题干媒体文本化、闯关任务请求、直播进度、重复运行与多窗口提示
// 这些函数只依赖传入参数，便于在 Node 环境中直接回归测试。
// ============================================================================

function xxtDecodeEntities(text) {
    return String(text == null ? '' : text).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, function (entity, body) {
        var name = String(body).toLowerCase();
        if (name === 'amp') return '&';
        if (name === 'quot') return '"';
        if (name === 'apos') return "'";
        if (name === 'lt') return '<';
        if (name === 'gt') return '>';
        if (name === 'nbsp') return ' ';
        if (name.charAt(0) === '#') {
            var code = name.charAt(1) === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
            if (isFinite(code) && code > 0) return String.fromCharCode(code);
        }
        return entity;
    });
}

function xxtReadTagAttributes(source) {
    var attributes = Object.create(null);
    var pattern = /([^\s"'<>\/=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
    var match;
    while ((match = pattern.exec(source))) {
        var name = match[1].toLowerCase();
        if (name === '/' || Object.prototype.hasOwnProperty.call(attributes, name)) continue;
        var value = match[2];
        if (value === undefined) {
            attributes[name] = '';
        } else if (value.charAt(0) === '"' || value.charAt(0) === "'") {
            attributes[name] = xxtDecodeEntities(value.slice(1, -1));
        } else {
            attributes[name] = xxtDecodeEntities(value);
        }
    }
    return attributes;
}

function xxtFindTagEnd(source, start) {
    var quote = '';
    for (var index = start + 1; index < source.length; index++) {
        var character = source.charAt(index);
        if (quote) {
            if (character === quote) quote = '';
        } else if (character === '"' || character === "'") {
            quote = character;
        } else if (character === '>') {
            return index;
        }
    }
    return -1;
}

function xxtTokenizeMarkup(markup) {
    var source = String(markup == null ? '' : markup);
    var tokens = [];
    var cursor = 0;
    while (cursor < source.length) {
        var open = source.indexOf('<', cursor);
        if (open < 0) {
            tokens.push({ type: 'text', value: source.slice(cursor) });
            break;
        }
        if (open > cursor) tokens.push({ type: 'text', value: source.slice(cursor, open) });
        if (source.substr(open, 4) === '<!--') {
            var commentEnd = source.indexOf('-->', open + 4);
            cursor = commentEnd < 0 ? source.length : commentEnd + 3;
            continue;
        }
        var close = xxtFindTagEnd(source, open);
        if (close < 0) {
            var tail = source.slice(open + 1).trim();
            var tailMatch = /^([a-zA-Z][a-zA-Z0-9:_-]*)([\s\S]*)$/.exec(tail);
            if (!tailMatch) {
                tokens.push({ type: 'text', value: source.slice(open) });
            } else {
                tokens.push({
                    type: 'tag',
                    name: tailMatch[1].toLowerCase(),
                    closing: false,
                    raw: source.slice(open),
                    attributes: xxtReadTagAttributes(tailMatch[2].replace(/\/$/, ''))
                });
            }
            break;
        }
        var raw = source.slice(open, close + 1);
        var body = raw.slice(1, -1).trim();
        var nameMatch = /^\/?\s*([a-zA-Z][a-zA-Z0-9:_-]*)/.exec(body);
        if (!nameMatch) {
            tokens.push({ type: 'text', value: raw });
        } else {
            var closing = body.charAt(0) === '/';
            tokens.push({
                type: 'tag',
                name: nameMatch[1].toLowerCase(),
                closing: closing,
                raw: raw,
                attributes: closing ? Object.create(null) :
                    xxtReadTagAttributes(body.replace(/^\/?\s*[a-zA-Z][a-zA-Z0-9:_-]*/, '').replace(/\/$/, ''))
            });
        }
        cursor = close + 1;
    }
    return tokens;
}

function xxtMediaUrl(attributes) {
    var keys = ['_src', 'src', 'data-src', 'data-original', 'data-url'];
    for (var index = 0; index < keys.length; index++) {
        var value = String(attributes[keys[index]] || '').trim();
        if (!value || /^(javascript|data|about|blob):/i.test(value)) continue;
        return value.replace(/^(?:https?:)?\/\//i, '');
    }
    return '';
}

// 把题干里的图片、音频 iframe 和 audioReader 播放器换成可读的媒体地址，供 AI 理解题目。
function xxtTextFromMarkup(markup) {
    var tokens = xxtTokenizeMarkup(markup);
    var output = '';
    var audioDepth = 0;
    var audioUrl = '';
    for (var index = 0; index < tokens.length; index++) {
        var token = tokens[index];
        if (token.type === 'text') {
            if (!audioDepth) output += token.value;
            continue;
        }
        var name = token.name;
        if (name === 'style' || name === 'script') {
            if (!token.closing) {
                while (index + 1 < tokens.length &&
                    !(tokens[index + 1].type === 'tag' && tokens[index + 1].closing && tokens[index + 1].name === name)) {
                    index++;
                }
                index++;
            }
            continue;
        }
        if (audioDepth > 0) {
            if (name === 'div') {
                audioDepth += token.closing ? -1 : 1;
                if (audioDepth <= 0) {
                    output += audioUrl;
                    audioUrl = '';
                    audioDepth = 0;
                }
                continue;
            }
            if (!token.closing && !audioUrl && (name === 'source' || name === 'audio')) {
                audioUrl = xxtMediaUrl(token.attributes);
            }
            continue;
        }
        if (!token.closing && name === 'div' && /(^|\s)audioReader(\s|$)/i.test(token.attributes['class'] || '')) {
            audioDepth = 1;
            continue;
        }
        if (name === 'img' || name === 'iframe') {
            if (!token.closing) output += xxtMediaUrl(token.attributes);
            continue;
        }
        output += token.raw;
    }
    if (audioDepth > 0) output += audioUrl;
    return output;
}

function xxtQueryString(pairs) {
    var parts = [];
    (pairs || []).forEach(function (pair) {
        if (!pair || pair[1] === undefined || pair[1] === null) return;
        parts.push(encodeURIComponent(pair[0]) + '=' + encodeURIComponent(String(pair[1])));
    });
    return parts.join('&');
}

function xxtAnanasUrl(item, spec, context) {
    var pairs = [
        ['jobid', item.jobid],
        ['knowledgeid', context.chapterId],
        ['courseid', context.courseId],
        ['clazzid', context.classId],
        ['jtoken', item.jtoken]
    ];
    var extra = typeof spec.params === 'function' ? spec.params(item, context) : spec.params;
    if (extra) pairs = pairs.concat(extra);
    return String(context.protocol || '') + '//' + String(context.host || '') + spec.path + '?' + xxtQueryString(pairs);
}

function xxtAnanasSucceeded(spec, responseText) {
    var text = String(responseText == null ? '' : responseText);
    if (spec && spec.successText) return text.indexOf(spec.successText) >= 0;
    try {
        var parsed = JSON.parse(text);
        return Boolean(parsed && parsed.status);
    } catch (error) {
        return false;
    }
}

// 只有上报成功的次数才计入观看时长，失败不会让任务提前完成。
function xxtCreateLiveProgress(durationSeconds, watchedSeconds, options) {
    var settings = options || {};
    var step = Math.max(1, Math.floor(Number(settings.step) || 30));
    var maxFailures = Math.max(1, Math.floor(Number(settings.maxFailures) || 3));
    var duration = Math.max(0, Math.floor(Number(durationSeconds) || 0));
    var progress = Math.max(0, Math.floor(Number(watchedSeconds) || 0));
    var failures = 0;
    return {
        duration: duration,
        step: step,
        getProgress: function () { return progress; },
        isComplete: function () { return duration > 0 && progress >= duration; },
        canReport: function () { return duration > 0 && progress < duration; },
        remaining: function () { return Math.max(0, duration - progress); },
        recordSuccess: function () {
            failures = 0;
            progress = Math.min(duration, progress + step);
            return progress >= duration;
        },
        recordFailure: function () {
            failures += 1;
            return failures >= maxFailures;
        }
    };
}

function xxtPruneRuns(registry, now, ttl) {
    Object.keys(registry).forEach(function (id) {
        var entry = registry[id];
        if (!entry || now - Number(entry.seen || 0) > ttl) delete registry[id];
    });
    return registry;
}

// 同一顶层窗口中只允许一个活跃实例；心跳过期后自动让位，避免异常退出导致永久误报。
function xxtRegisterRun(registry, instanceId, now, ttl) {
    xxtPruneRuns(registry, now, ttl);
    var owner = Object.keys(registry).filter(function (id) { return id !== instanceId; })[0] || '';
    if (owner) return { duplicate: true, owner: owner };
    registry[instanceId] = { seen: now };
    return { duplicate: false, owner: '' };
}

function xxtReadStudySessions(raw) {
    try {
        var parsed = JSON.parse(String(raw == null ? '' : raw));
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function xxtFindStudyConflict(sessions, selfId, courseId, now, ttl) {
    var conflict = '';
    Object.keys(sessions || {}).forEach(function (id) {
        var entry = sessions[id];
        if (id === selfId || !entry || now - Number(entry.seen || 0) > ttl) return;
        if (String(entry.courseId == null ? '' : entry.courseId) !== String(courseId == null ? '' : courseId)) {
            conflict = String(entry.courseId == null ? '' : entry.courseId);
        }
    });
    return conflict;
}

// 超星风控（antispider）会把业务请求 302 到 /antispiderShowVerify.ac，
// 回包里是一张要求输入图片验证码的页面，不是业务数据。
// 请求层必须能认出这种回包：否则 JSON.parse 失败会被当成「接口错误」「任务未完成」，
// 任务被判定为失败且不可回退，整章学习直接停摆，用户还不知道要去输入验证码。
function xxtRiskControlMark(body, url, headers) {
    var text = String(body == null ? '' : body);
    var where = String(url == null ? '' : url) + ' ' + String(headers == null ? '' : headers);
    // 优先嗅探特征串而不是依赖 finalUrl / responseHeaders：
    // 各脚本管理器对 302 后原始地址的回传并不一致，特征串在所有实现上都拿得到。
    // 地址侧一并纳入判定，是因为有些拦截页的正文可能是空的，只剩跳转目标可认。
    if (/antispiderShowVerify|processVerifyPng|processVerify\.ac/i.test(where)) return 'antispider';
    if (/antispiderShowVerify|processVerifyPng|processVerify\.ac/i.test(text)) return 'antispider';
    if (text.indexOf('【9010】') >= 0) return 'antispider';
    if (text.indexOf('请输入图片中的验证码') >= 0) return 'antispider';
    return '';
}

// 验证页地址：脚本给出的链接必须是真正能解验证的页面，
// 早期版本把上报接口当成 href，用户点开只看得到一段 JSON。
function xxtRiskControlUrl(protocol, host) {
    return String(protocol || 'https:') + '//' + String(host || '') + '/antispiderShowVerify.ac';
}

function xxtFormatPlaybackTime(seconds) {
    var value = Math.max(0, Math.floor(Number(seconds) || 0));
    var hours = Math.floor(value / 3600);
    var minutes = Math.floor(value % 3600 / 60);
    var remainingSeconds = value % 60;
    var twoDigits = function (part) { return String(part).padStart(2, '0'); };
    return hours > 0 ? String(hours) + ':' + twoDigits(minutes) + ':' + twoDigits(remainingSeconds) :
        String(minutes) + ':' + twoDigits(remainingSeconds);
}

function xxtFormatPlaybackPercent(percent) {
    var value = Math.max(0, Math.min(100, Number(percent) || 0));
    return (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '');
}

function xxtObserveNativeVideoProgress(sourceWindow) {
    var win = sourceWindow || window;
    var doc = win.document;
    var videoStates = new WeakMap();

    function report(video, force) {
        if (!video || !isFinite(video.duration) || video.duration <= 0 || !isFinite(video.currentTime)) {
            return;
        }
        var duration = Math.max(1, Number(video.duration));
        var currentTime = Math.max(0, Math.min(duration, Number(video.currentTime)));
        var percent = Math.round(currentTime / duration * 1000) / 10;
        var bucket = Math.min(100, Math.floor(percent / 5) * 5);
        var previous = videoStates.get(video);
        if (!force && previous && previous.bucket === bucket) {
            return;
        }
        videoStates.set(video, { bucket: bucket });
        try {
            // 进度日志在播放器 iframe 的直接父级 knowledge/cards 页面，不能直接跳到最外层课程页。
            ((win.parent && win.parent !== win) ? win.parent : win).postMessage({
                type: 'xxt-video-progress',
                currentTime: currentTime,
                duration: duration,
                percent: percent
            }, '*');
        } catch (error) {
            console.warn('[XXT] 视频进度上报失败', error);
        }
    }

    function handleVideoEvent(event) {
        var video = event && event.target;
        if (!video || String(video.tagName).toUpperCase() !== 'VIDEO') {
            return;
        }
        report(video, event.type === 'loadedmetadata' || event.type === 'seeked' || event.type === 'ended');
    }

    doc.addEventListener('loadedmetadata', handleVideoEvent, true);
    doc.addEventListener('timeupdate', handleVideoEvent, true);
    doc.addEventListener('seeked', handleVideoEvent, true);
    doc.addEventListener('ended', handleVideoEvent, true);
    doc.querySelectorAll('video').forEach(function (video) { report(video, true); });
}

(() => {
   var jumpType = 1, // 0:智能模式，1:遍历模式，2:不跳转，如果智能模式出现无限跳转/不跳转情况，请切换为遍历模式
        disableMonitor = 0, // 0:无操作，1:解除多端学习监控，开启此功能后可以多端学习，不会被强制下线。
        accuracy = 30, //作答覆盖率阈值；仍须全部题目处理并核验成功，才允许自动提交
        //-----------------------------------------------------------------------------------------------------
        autoLogin = 0, //掉线是否自动登录，1为自动登录，需要配置登录信息（仅支持手机号+密码登陆）
        phoneNumber = '', //自动登录的手机号，填写在单引号之间。
        password = ''; //自动登录的密码，填写在单引号之间。
    //-----------------------------------------------------------------------------------------------------
    var rate = GM_getValue('unrivalrate', '1'),
        getQueryVariable = (variable) => {
            let q = _l.search.substring(1),
                v = q.split("&"),
                r = false;
            for (let i = 0, l = v.length; i < l; i++) {
                let p = v[i].split("=");
                p[0] == variable && (r = p[1]);
            }
            return r;
        },
        getCookie = name => `; ${document.cookie}`.split(`; ${name}=`).pop().split(';').shift(),
        isCat = GM_info.scriptHandler == 'ScriptCat',
        _w = unsafeWindow,
        _d = _w.document,
        _l = _w.location,
        _p = _l.protocol,
        _h = _l.host,
        //isEdge = _w.navigator.userAgent.includes("Edg/"),
        isFf = _w.navigator.userAgent.includes("Firefox"),
        isMobile = _w.navigator.userAgent.includes("Android"),
        stop = false,
        handleImgs = (s) => xxtTextFromMarkup(s),
        trim = (s) => {
            return handleImgs(s).replaceAll('javascript:void(0);', '').replaceAll("&nbsp;", '').replaceAll("，", ',').replaceAll(
                "。", '.').replaceAll("：", ':').replaceAll("；",
                    ';').replaceAll("？", '?').replaceAll("（", '(').replaceAll("）", ')').replaceAll("“", '"')
                .replaceAll("”", '"').replaceAll("！", '!').replaceAll("-", ' ').replace(/(<([^>]+)>)/ig, '')
                .replace(/^\s+/ig, '').replace(/\s+$/ig, '');
        },
        cVersion = 999,
        classId = getQueryVariable('clazzid') || getQueryVariable('clazzId') || getQueryVariable('classid') ||
            getQueryVariable('classId'),
        courseId = getQueryVariable('courseid') || getQueryVariable('courseId'),
        UID = getCookie('_uid') || getCookie('UID'),
        FID = getCookie('fid'),
        jq = _w.top.$ || _w.top.jQuery;
    // 自动提交需要放行平台自带的确认框，但 confirm 属于页面共享的原生方法：
    // 原实现对所有匹配站点无条件返回 true 且每 2 秒重设一次，会让平台自己的
    // “确认提交/取消”类提示一律失效。这里保存原函数，只在脚本持有章节提交权
    // （__xxtChapterSubmit.state === 'submitting'）时才放行，其余情况保持平台原行为。
    if (typeof _w.__xxtNativeConfirm !== 'function') {
        _w.__xxtNativeConfirm = _w.confirm;
    }
    _w.confirm = function (msg) {
        try {
            var submit = _w.top.__xxtChapterSubmit;
            if (submit && submit.state === 'submitting') return true;
        } catch (error) { }
        if (typeof _w.__xxtNativeConfirm === 'function') {
            return _w.__xxtNativeConfirm.apply(_w, arguments);
        }
        return false;
    };
    if (parseFloat(rate) == parseInt(rate)) {
        rate = parseInt(rate);
    } else {
        rate = parseFloat(rate);
    }
    try {
        _w.top.unrivalReviewMode = GM_getValue('unrivalreview', '0') || '0';
        _w.top.unrivalDoWork = GM_getValue('unrivaldowork', '1') || '1';
        _w.top.unrivalAutoSubmit = GM_getValue('unrivalautosubmit', '1') || '1';
        _w.top.unrivalAutoSave = GM_getValue('unrivalautosave', '1') || '1';
        _w.top.unrivalPreviewPlay = GM_getValue('unrivalpreviewplay', '0') || '0';
    } catch (e) { }
    try {
        // 视频播放器会被平台放在不同路径的嵌套 iframe 中，按窗口层级监听而不是依赖固定 URL。
        if (_w.top !== _w) {
            xxtObserveNativeVideoProgress(_w);
        }
    } catch (e) { }
    if (_l.href.indexOf("knowledge/cards") > 0 && _l.href.indexOf("xxtAssistantPreview=1") === -1) {
        let spans = _d.getElementsByTagName('span');
        for (let i = 0, l = spans.length; i < l; i++) {
            if (spans[i].innerHTML.indexOf('章节未开放') != -1) {
                if (_l.href.indexOf("ut=s") != -1) {
                    _l.href = _l.href.replace("ut=s", "ut=t").replace(/&cpi=[0-9]{1,10}/, '');
                } else if (_l.href.indexOf("ut=t") != -1) {
                    spans[i].innerHTML = '此课程为闯关模式，请回到上一章节完成学习任务！'
                    return;
                }
                break;
            }
        }
        _w.top.unrivalPageRd = String(Math.random());
        if (!isFf) {
            try {
                cVersion = parseInt(navigator.userAgent.match(/Chrome\/[0-9]{2,3}./)[0].replace('Chrome/', '')
                    .replace('.', ''));
            } catch (e) { }
        }
        var busyThread = 0,
            getStr = (str, start, end) => {
                let res = str.substring(str.indexOf(start), str.indexOf(end)).replace(start, '');
                return res;
            },
            scripts = _d.getElementsByTagName('script'),
            param = null;
        for (let i = 0, l = scripts.length; i < l; i++) {
            if (scripts[i].innerHTML.indexOf('mArg = "";') != -1 && scripts[i].innerHTML.indexOf(
                '==UserScript==') == -1) {
                param = getStr(scripts[i].innerHTML, 'try{\n    mArg = ', ';\n}catch(e){');
            }
        }
        if (param == null) {
            return;
        }
        try {
            vrefer = _d.getElementsByClassName('ans-attach-online ans-insertvideo-online')[0].src;
        } catch (e) {
            vrefer = _p + '//' + _h + '/ananas/modules/video/index.html?v=2022-1118-1729';
        }
        GM_setValue('vrefer', vrefer);
        GM_setValue('host', _h);

        _d.getElementsByTagName("html")[0].innerHTML = XXT_UI.pageHtml({
            aiStatusText: typeof aiStatusText === "function" ? aiStatusText() : "AI已关闭"
        });
        // 电脑端主面板不再用标签页：日志、课程内容、章节测试常驻可见，LLM 配置并进顶部「任务配置」。
        // 课程内容与章节测试共用同一张卡片：视频/阅读在卡片里正常播放，进入章节测试时
        // 同一张卡片切换到答题页，用户不用在两块区域之间来回找。
        // xxtShowTab / xxtShowSection 保留为兼容入口，只负责切换课程卡片模式并滚进视野。
        var courseSectionEl = _d.getElementById('courseSection');
        var xxtSetCourseMode = function (mode) {
            if (!courseSectionEl) {
                return;
            }
            var next = mode === 'work' ? 'work' : 'course';
            courseSectionEl.setAttribute('data-mode', next);
            var workPanelEl = _d.getElementById('workPanel');
            var workEmptyEl = _d.getElementById('workEmpty');
            if (workPanelEl) workPanelEl.style.display = next === 'work' ? 'block' : 'none';
            if (workEmptyEl) workEmptyEl.style.display = next === 'work' ? 'none' : 'block';
        };
        _w.xxtSetCourseMode = xxtSetCourseMode;
        // LLM 表单在顶部任务配置里默认收起：展开后高度 640px，一直摊开会把课程卡片挤到屏幕外。
        var llmPanelEl = _d.getElementById('llmPanel');
        var llmToggleEl = _d.getElementById('llmToggleButton');
        var xxtSetLlmPanel = function (open) {
            if (!llmPanelEl) return;
            var next = !!open;
            llmPanelEl.style.display = next ? 'block' : 'none';
            if (llmToggleEl) {
                llmToggleEl.textContent = next ? '收起设置' : '展开设置';
                llmToggleEl.setAttribute('aria-expanded', next ? 'true' : 'false');
                llmToggleEl.classList.toggle('btn-default', !next);
                llmToggleEl.classList.toggle('btn-success', next);
            }
            if (next && !llmPanelEl.querySelector('iframe') && typeof openAiSettingWindow === 'function') {
                try { openAiSettingWindow(true); } catch (e) { }
            }
        };
        _w.xxtSetLlmPanel = xxtSetLlmPanel;
        if (llmToggleEl) {
            llmToggleEl.addEventListener('click', function () {
                xxtSetLlmPanel(!llmPanelEl || llmPanelEl.style.display === 'none');
            });
        }
        var xxtScrollTo = function (target) {
            if (!target || typeof target.scrollIntoView !== 'function') {
                return;
            }
            try {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                try { target.scrollIntoView(); } catch (e2) { }
            }
        };
        var xxtShowSection = function (name) {
            if (name === 'work') {
                xxtSetCourseMode('work');
                xxtScrollTo(courseSectionEl);
                return;
            }
            if (name === 'course') {
                xxtSetCourseMode('course');
                xxtScrollTo(courseSectionEl);
                return;
            }
            if (name === 'llm') {
                xxtSetLlmPanel(true);
                xxtScrollTo(_d.getElementById('normalQuery'));
                return;
            }
            if (name === 'log') {
                xxtScrollTo(_d.querySelector('.xxt-section[data-pane="log"]'));
            }
        };
        _w.xxtShowSection = xxtShowSection;
        _w.xxtShowTab = function (name) {
            xxtShowSection(name);
            if (name === 'llm') {
                openAiSettingWindow();
            }
        };
        // 面板渲染完就把 LLM 表单填进去：容器里只剩占位文字时，用户看到的永远是
        // “正在加载 LLM 配置…”。这里用 silent 模式，既不弹提示也不抢滚动位置，
        // 也不展开面板——表单藏在收起的面板里，展开时已就绪。
        if (typeof openAiSettingWindow === 'function') {
            var mountLlmSettings = function (retry) {
                try {
                    if (_d.getElementById(AI_SETTING_NODE_ID)) return;
                    if (!_d.getElementById('llmSettingsContainer')) {
                        if (retry > 0) setTimeout(function () { mountLlmSettings(retry - 1); }, 400);
                        return;
                    }
                    openAiSettingWindow(true);
                } catch (e) { }
            };
            mountLlmSettings(5);
        }
        var courseContentFrame = _d.getElementById('courseContent');
        if (courseContentFrame) {
            courseContentFrame.addEventListener('load', function () {
                try {
                    var courseDoc = courseContentFrame.contentDocument;
                    if (courseDoc) {
                        var keepVideoPlaying = function (event) {
                            if (event.target && (event.target.tagName === 'VIDEO' ||
                                (event.target.closest && event.target.closest('video')))) {
                                event.stopImmediatePropagation();
                            }
                        };
                        courseDoc.addEventListener('mouseout', keepVideoPlaying, true);
                        courseDoc.addEventListener('mouseleave', keepVideoPlaying, true);
                    }
                } catch (e) { }
            });
            try {
                var coursePreviewUrl = _l.href + (_l.href.indexOf('?') >= 0 ? '&' : '?') + 'xxtAssistantPreview=1';
                courseContentFrame.src = coursePreviewUrl;
            } catch (e) {
                courseContentFrame.src = _l.href;
            }
        }
        var previewSyncTimer = null;
        function findVideoInDoc(doc, depth) {
            if (!doc || depth > 3) {
                return null;
            }
            var v = doc.querySelector('video');
            if (v) {
                return v;
            }
            var inner = doc.querySelectorAll('iframe');
            for (var i = 0; i < inner.length; i++) {
                try {
                    var v2 = findVideoInDoc(inner[i].contentDocument, depth + 1);
                    if (v2) {
                        return v2;
                    }
                } catch (e) { }
            }
            return null;
        }
        function findPreviewVideo() {
            try {
                return findVideoInDoc(courseContentFrame && courseContentFrame.contentDocument, 0);
            } catch (e) {
                return null;
            }
        }
        function syncPreviewVideo() {
            if (previewSyncTimer) {
                clearInterval(previewSyncTimer);
            }
            previewSyncTimer = setInterval(function () {
                if (_w.top.unrivalPreviewPlay != '1') {
                    return;
                }
                var v = findPreviewVideo();
                if (!v) {
                    return;
                }
                try {
                    v.muted = true;
                    v.volume = 0;
                    if (Math.abs(v.playbackRate - rate) > 0.01) {
                        v.playbackRate = rate;
                    }
                    if (v.paused && !v.ended) {
                        var p = v.play();
                        if (p && p.catch) {
                            p.catch(function () { });
                        }
                    }
                } catch (e) { }
            }, 1000);
        }
        function pausePreviewVideo() {
            if (previewSyncTimer) {
                clearInterval(previewSyncTimer);
                previewSyncTimer = null;
            }
            var v = findPreviewVideo();
            if (v) {
                try {
                    v.pause();
                } catch (e) { }
            }
        }
        AI_STATUS_HOOKS.push(function (text) {
            var aiStatusEl = _d.getElementById('aiStatus');
            if (aiStatusEl) aiStatusEl.textContent = '当前：' + text;
        });
        var logs = {
            "logArry": [],
            "logElement": null,
            "logLimit": 240,
            "addLog": function (str, color = "black", allowHtml = false) {
                var logElement = _d.getElementById('log');
                if (!logElement) return;
                if (this.logElement !== logElement) {
                    this.logElement = logElement;
                    var logPlaceholder = logElement.querySelector('[data-xxt-log-placeholder]');
                    if (logPlaceholder) logElement.removeChild(logPlaceholder);
                    for (var savedIndex = 0; savedIndex < this.logArry.length; savedIndex++) {
                        logElement.appendChild(this.logArry[savedIndex]);
                    }
                }
                if (this.logArry.length >= this.logLimit) {
                    var oldLogEntry = this.logArry.shift();
                    if (oldLogEntry && oldLogEntry.parentNode === logElement) {
                        logElement.removeChild(oldLogEntry);
                    }
                }
                var nowTime = new Date();
                var nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2);
                var nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2);
                var nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2);
                var logEntry = _d.createElement('span');
                logEntry.style.color = color;
                logEntry.style.display = 'block';
                // 日志文本多数来自页面（任务名、题干、接口回包），默认按纯文本渲染，
                // 避免其中的尖括号被当成标记执行；确需富文本的调用点显式传 allowHtml = true。
                var logText = "[" + nowHour + ":" + nowMin + ":" + nowSec + "] " + str;
                if (allowHtml) logEntry.innerHTML = logText;
                else logEntry.textContent = logText;
                this.logArry.push(logEntry);
                logElement.appendChild(logEntry);
                logElement.scrollTop = logElement.scrollHeight;
            }
        },
            latestNativeVideoProgress = null,
            logVideoProgress = function (event) {
                var data = event && event.data;
                if (!data || data.type !== 'xxt-video-progress') {
                    return;
                }
                var currentTime = Number(data.currentTime);
                var duration = Number(data.duration);
                var percent = Number(data.percent);
                if (!isFinite(currentTime) || !isFinite(duration) || !isFinite(percent) || duration <= 0 ||
                    currentTime < 0 || currentTime > duration || percent < 0 || percent > 100) {
                    return;
                }
                latestNativeVideoProgress = {
                    currentTime: currentTime,
                    duration: duration,
                    percent: percent,
                    updatedAt: Date.now()
                };
            },
            drainAiTrace = () => {
                const logNode = _d.getElementById('log');
                if (!logNode) return;
                let queue;
                try { queue = _w.top.__xxtDebugQueue; } catch (error) { return; }
                if (!Array.isArray(queue) || queue.length === 0) return;
                for (const entry of queue.splice(0, 40)) {
                    const safe = _d.createElement('span');
                    safe.textContent = '调试 · ' + entry.message;
                    logs.addLog(safe.innerHTML, entry.level === 'error' ? 'red' : entry.level === 'warn' ? '#a15c00' : '#315f86', true);
                }
            },
            htmlHook = setInterval(function () {
                if (_d.getElementById('unrivalRate') && _d.getElementById('updateRateButton') && _d
                    .getElementById('reviewModeButton') && _d.getElementById('autoDoWorkButton') && _d
                        .getElementById('autoSubmitButton') && _d.getElementById('autoSaveButton')) {
                    clearInterval(htmlHook);
                    if (cVersion < 86) {
                        logs.addLog(
                            '您的浏览器内核过老，请更新版本或使用主流浏览器，推荐<a href="https://www.microsoft.com/zh-cn/edge" target="view_window">edge浏览器</a>',
                            'red', true);
                        stop = true;
                        return;
                    }
                    if (isMobile) {
                        logs.addLog('手机浏览器不保证能正常运行此脚本', 'orange');
                    }
                    _d.getElementById('unrivalRate').value = rate;
                    _d.getElementById('updateRateButton').onclick = function () {
                        let urate = _d.getElementById('unrivalRate').value;
                        if (parseFloat(urate) == parseInt(urate)) {
                            urate = parseInt(urate);
                        } else {
                            urate = parseFloat(urate);
                        }
                        GM_setValue('unrivalrate', urate);
                        rate = urate;
                        if (urate > 0) {
                            logs.addLog('视频倍速已更新为' + urate + '倍，将在3秒内生效', 'green');
                        } else {
                            logs.addLog('倍速小于等于0时，将会自动跳过视频任务', 'orange');
                        }
                    }
                    _d.getElementById('recognitionCheckButton').onclick = function () {
                        const diagnostic = getRecognitionDiagnostics(_w.document || document);
                        logs.addLog('识别诊断：DOM 文本预览：' + diagnostic.textPreview, '#315f86');
                        logs.addLog('识别诊断：加密字体元素 ' + diagnostic.encryptedElementCount + ' 个；加密字体样式 ' + diagnostic.encryptedStyleCount + ' 个；图片 ' + diagnostic.imageCount + ' 张；图片按 DOM 文本解析处理（不调用外部 OCR）', '#315f86');
                        if (diagnostic.imagePreview.length) {
                            logs.addLog('识别诊断：前 ' + diagnostic.imagePreview.length + ' 个图片地址：' + diagnostic.imagePreview.join(' | '), '#315f86');
                        }
                    };
                    _d.getElementById('reviewModeButton').onclick = function () {
                        let reviewButton = _d.getElementById('reviewModeButton');
                        if (reviewButton.getAttribute('class') == 'btn btn-default') {
                            _d.getElementById('reviewModeButton').setAttribute('class', 'btn btn-success');
                            logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过', 'green');
                            GM_setValue('unrivalreview', '1');
                            _w.top.unrivalReviewMode = '1';
                        } else {
                            _d.getElementById('reviewModeButton').setAttribute('class', 'btn btn-default');
                            logs.addLog('复习模式已关闭，遇到已完成的视频任务会自动跳过', 'green');
                            GM_setValue('unrivalreview', '0');
                            _w.top.unrivalReviewMode = '0';
                        }
                    }
                    _d.getElementById('autoDoWorkButton').onclick = function () {
                        let autoDoWorkButton = _d.getElementById('autoDoWorkButton');
                        if (autoDoWorkButton.getAttribute('class') == 'btn btn-default') {
                            _d.getElementById('autoDoWorkButton').setAttribute('class', 'btn btn-success');
                            logs.addLog('自动做章节测试已开启，将会自动做章节测试', 'green');
                            GM_setValue('unrivaldowork', '1');
                            _w.top.unrivalDoWork = '1';
                        } else {
                            _d.getElementById('autoDoWorkButton').setAttribute('class', 'btn btn-default');
                            logs.addLog('自动做章节测试已关闭，将不会自动做章节测试', 'green');
                            GM_setValue('unrivaldowork', '0');
                            _w.top.unrivalDoWork = '0';
                        }
                    }
                    _d.getElementById('autoSubmitButton').onclick = function () {
                        let autoSubmitButton = _d.getElementById('autoSubmitButton');
                        if (autoSubmitButton.getAttribute('class') == 'btn btn-default') {
                            _d.getElementById('autoSubmitButton').setAttribute('class', 'btn btn-success');
                            logs.addLog('符合提交标准的章节测试将会自动提交', 'green');
                            GM_setValue('unrivalautosubmit', '1');
                            _w.top.unrivalAutoSubmit = '1';
                        } else {
                            _d.getElementById('autoSubmitButton').setAttribute('class', 'btn btn-default');
                            logs.addLog('章节测试将不会自动提交', 'green');
                            GM_setValue('unrivalautosubmit', '0');
                            _w.top.unrivalAutoSubmit = '0';
                        }
                    }
                    _d.getElementById('autoSaveButton').onclick = function () {
                        let autoSaveButton = _d.getElementById('autoSaveButton');
                        if (autoSaveButton.getAttribute('class') == 'btn btn-default') {
                            _d.getElementById('autoSaveButton').setAttribute('class', 'btn btn-success');
                            logs.addLog('不符合提交标准的章节测试将会自动保存', 'green');
                            GM_setValue('unrivalautosave', '1');
                            _w.top.unrivalAutoSave = '1';
                        } else {
                            _d.getElementById('autoSaveButton').setAttribute('class', 'btn btn-default');
                            logs.addLog('不符合提交标准的章节测试将不会自动保存，等待用户自己操作', 'green');
                            GM_setValue('unrivalautosave', '0');
                            _w.top.unrivalAutoSave = '0';
                        }
                    }
                    var riskResumeButton = _d.getElementById('riskControlResumeButton');
                    if (riskResumeButton) {
                        riskResumeButton.onclick = function () {
                            xxtRiskControlLeave();
                        };
                    }
                    _d.getElementById('videoTimeButton').onclick = function () {
                        if (_w.xxtShowTab) {
                            _w.xxtShowTab('course');
                        }
                        _d.getElementById('videoTime').style.display = 'block';
                        _d.getElementById('videoTimeContent').src = _p +
                            '//stat2-ans.chaoxing.com/task/s/index?courseid=' + courseId + '&clazzid=' +
                            classId;
                    }
                    _d.getElementById('previewPlayButton').onclick = function () {
                        let btn = _d.getElementById('previewPlayButton');
                        if (btn.getAttribute('class') == 'btn btn-default') {
                            btn.setAttribute('class', 'btn btn-success');
                            logs.addLog('预览同步播放已开启，预览窗口内的视频会静音播放', 'green');
                            _w.top.unrivalPreviewPlay = '1';
                            GM_setValue('unrivalpreviewplay', '1');
                            syncPreviewVideo();
                        } else {
                            btn.setAttribute('class', 'btn btn-default');
                            logs.addLog('预览同步播放已关闭', 'green');
                            _w.top.unrivalPreviewPlay = '0';
                            GM_setValue('unrivalpreviewplay', '0');
                            pausePreviewVideo();
                        }
                    }
                }
            }, 100),
            loopJobTimer = null,
            loopJobRunning = false,
            loopJobEnded = false,
            multiScriptWarned = false,
            // —— 风控（antispider）暂停 / 恢复 ——
            // 超星把人机验证记在服务端会话上，脚本不可能替用户输入；
            // 但若把它当成「任务失败」，任务状态会进入 failed 终态，
            // 用户验证完也接不回去，只能整章重来。所以这里只停派发、不动任务状态。
            riskControl = {
                active: false,
                scene: '',
                url: '',
                since: 0,
                logged: false,
                retry: []
            },
            xxtRiskControlSyncUi = () => {
                var bar = _d.getElementById('riskControlBar');
                if (!bar) return;
                if (!riskControl.active) {
                    bar.style.display = 'none';
                    return;
                }
                bar.style.display = 'block';
                var waitingSeconds = Math.max(0, Math.round((Date.now() - riskControl.since) / 1000));
                var text = _d.getElementById('riskControlText');
                if (text) {
                    text.textContent = '平台要求输入验证码（风控），任务已暂停 ' +
                        xxtFormatPlaybackTime(waitingSeconds) + '。完成验证后点「已验证，继续」';
                }
                var link = _d.getElementById('riskControlVerifyButton');
                if (link) link.setAttribute('href', riskControl.url || xxtRiskControlUrl(_p, _h));
            },
            xxtRiskControlEnter = (scene, retry) => {
                if (typeof retry === 'function') riskControl.retry.push(retry);
                riskControl.active = true;
                riskControl.scene = String(scene || '');
                riskControl.url = xxtRiskControlUrl(_p, _h);
                riskControl.since = Date.now();
                if (!riskControl.logged) {
                    riskControl.logged = true;
                    logs.addLog('平台要求输入验证码（风控），学习任务已暂停：点上方「去验证」在打开的页面里完成验证，' +
                        '再点「已验证，继续」即可自动接着学', 'red');
                    if (typeof _w.xxtShowTab === 'function') {
                        try { _w.xxtShowTab('log'); } catch (error) {}
                    }
                }
                xxtRiskControlSyncUi();
                scheduleLoopJob(3000);
            },
            xxtRiskControlLeave = () => {
                if (!riskControl.active) return;
                var retryList = riskControl.retry.splice(0, riskControl.retry.length);
                riskControl.active = false;
                riskControl.scene = '';
                riskControl.logged = false;
                xxtRiskControlSyncUi();
                if (loopJobTimer !== null) {
                    clearTimeout(loopJobTimer);
                    loopJobTimer = null;
                }
                logs.addLog('已恢复运行，正在重新发起被风控打断的任务', 'green');
                for (var retryIndex = 0; retryIndex < retryList.length; retryIndex++) {
                    try {
                        retryList[retryIndex]();
                    } catch (error) {
                        console.warn('[risk control resume]', error);
                    }
                }
                scheduleLoopJob(500);
            },
            scheduleLoopJob = delay => {
                if (loopJobTimer !== null || loopJobEnded || stop) return;
                loopJobTimer = setTimeout(() => {
                    loopJobTimer = null;
                    loopjob();
                }, delay);
            },
            cancelLoopJob = () => {
                if (loopJobTimer !== null) clearTimeout(loopJobTimer);
                loopJobTimer = null;
                loopJobEnded = true;
            },
            loopjob = () => {
                drainAiTrace();
                if (loopJobEnded || stop) return;
                if (riskControl.active) {
                    // 风控期间只保留心跳：不派发新任务、不改任务状态、不判定失败。
                    // 用户在这些任务上其实什么都没做错，验证完必须能原地接上。
                    xxtRiskControlSyncUi();
                    scheduleLoopJob(3000);
                    return;
                }
                if (loopJobRunning) {
                    scheduleLoopJob(500);
                    return;
                }
                loopJobRunning = true;
                try {
                    if (!multiScriptWarned && (_w.top.unrivalScriptList || []).length > 1) {
                        multiScriptWarned = true;
                        logs.addLog('您同时开启了多个刷课脚本，建议关闭其他脚本，否则会有挂科风险！', 'red');
                    }
                    if (cVersion < 8.6 * 10) {
                        logs.addLog(
                            '\u60a8\u7684\u6d4f\u89c8\u5668\u5185\u6838\u8fc7\u8001\uff0c\u8bf7\u66f4\u65b0\u7248\u672c\u6216\u4f7f\u7528\u4e3b\u6d41\u6d4f\u89c8\u5668\uff0c\u63a8\u8350\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0077\u0077\u0077\u002e\u006d\u0069\u0063\u0072\u006f\u0073\u006f\u0066\u0074\u002e\u0063\u006f\u006d\u002f\u007a\u0068\u002d\u0063\u006e\u002f\u0065\u0064\u0067\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u0065\u0064\u0067\u0065\u6d4f\u89c8\u5668\u003c\u002f\u0061\u003e',
                            'red');
                        stop = true;
                        return;
                    }
                    if (stop) return;
                    const missionEntries = Object.keys(missionList);
                    if (missionEntries.length === 0 && busyThread > 0) return;
                    if (missionEntries.length === 0 && taskSetupReady && taskCandidateCount > 0) {
                        loopJobEnded = true;
                        logs.addLog('检测到' + taskCandidateCount + '项未完成任务，但没有可执行项，已保留在当前章节，请检查“自动答题”开关后手动处理', 'orange');
                        return;
                    }
                    if (missionEntries.some(key => missionList[key].status === 'running')) return;
                    const nextMission = missionEntries.map(key => missionList[key]).find(item => item.status !== 'done' && item.status !== 'failed');
                    if (nextMission) {
                        try {
                            switch (nextMission.type) {
                                case 'video': doVideo(nextMission); break;
                                case 'document': doDocument(nextMission); break;
                                case 'work': doWork(nextMission); break;
                                case 'book': doBook(nextMission); break;
                                case 'hyperlink': doHyperlink(nextMission); break;
                                case 'microCourse': doMicroCourse(nextMission); break;
                                case 'live': doLive(nextMission); break;
                                default: throw new Error('未知任务类型：' + nextMission.type);
                            }
                        } catch (error) {
                            nextMission.status = 'failed';
                            console.error('[task start]', { jobId: nextMission.jobid, error: error });
                            logs.addLog('任务启动失败：' + nextMission.name + '，' + String(error && error.message || error), 'red');
                        }
                        return;
                    }
                    if (busyThread <= 0) {
                        loopJobEnded = true;
                        if (jumpType != 2) {
                            _w.top.jump = true;
                            logs.addLog('所有任务处理完毕，5秒后自动下一章', 'green');
                        } else {
                            logs.addLog('所有任务处理完毕，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数', 'green');
                        }
                    }
                } finally {
                    loopJobRunning = false;
                    if (!loopJobEnded && !stop) scheduleLoopJob(500);
                }
            },
            readyCheck = () => {
                setTimeout(function () {
                    try {
                        try {
                            var studyKey = 'xxtStudySessions:' + (UID || 'anon'),
                                windowId = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
                                studyTtl = 10 * 60 * 1000,
                                sessions = xxtReadStudySessions(_w.localStorage.getItem(studyKey)),
                                conflict = xxtFindStudyConflict(sessions, windowId, courseId, Date.now(), studyTtl);
                            if (conflict) {
                                logs.addLog('检测到同一账号在另一个窗口学习不同课程，超星可能会清空学习进度，建议只保留一个学习窗口', 'red');
                            }
                            Object.keys(sessions).forEach(function (id) {
                                if (sessions[id] && Date.now() - (Number(sessions[id].seen) || 0) > studyTtl) delete sessions[id];
                            });
                            sessions[windowId] = { courseId: String(courseId || ''), seen: Date.now() };
                            _w.localStorage.setItem(studyKey, JSON.stringify(sessions));
                            _w.addEventListener('pagehide', function () {
                                try {
                                    var current = xxtReadStudySessions(_w.localStorage.getItem(studyKey));
                                    delete current[windowId];
                                    _w.localStorage.setItem(studyKey, JSON.stringify(current));
                                } catch (e) {}
                            }, { once: true });
                        } catch (e) {}
                        if (!isCat) {
                            logs.addLog(
                                '推荐使用<a href="https://docs.scriptcat.org/use/#%E5%AE%89%E8%A3%85%E6%89%A9%E5%B1%95" target="view_window">脚本猫</a>运行此脚本，使用其他脚本管理器不保证能正常运行',
                                'orange');
                        }
                        if (_w.top.unrivalReviewMode == '1') {
                            logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过', 'green');
                            _d.getElementById('reviewModeButton').setAttribute('class', ['btn btn-default',
                                'btn btn-success'
                            ][_w.top.unrivalReviewMode]);
                        }
                        if (_w.top.unrivalPreviewPlay == '1') {
                            _d.getElementById('previewPlayButton').setAttribute('class', 'btn btn-success');
                            syncPreviewVideo();
                        }
                        if (_w.top.unrivalDoWork == '1') {
                            logs.addLog('自动做章节测试已开启，将会自动做章节测试', 'green');
                            _d.getElementById('autoDoWorkButton').setAttribute('class', ['btn btn-default',
                                'btn btn-success'
                            ][_w.top.unrivalDoWork]);
                        }
                        _d.getElementById('autoSubmitButton').setAttribute('class', ['btn btn-default',
                            'btn btn-success'
                        ][_w.top.unrivalAutoSubmit]);
                        _d.getElementById('autoSaveButton').setAttribute('class', ['btn btn-default',
                            'btn btn-success'
                        ][_w.top.unrivalAutoSave]);
                    } catch (e) {
                        console.log(e);
                        readyCheck();
                        return;
                    }
                }, 500);
            }
        _w.addEventListener('message', logVideoProgress);
        readyCheck();
        try {
            var pageData = JSON.parse(param);
        } catch (e) {
            if (jumpType != 2) {
                _w.top.jump = true;
                logs.addLog('此页无任务，5秒后自动下一章', 'green');
            } else {
                logs.addLog('此页无任务，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数', 'green');
            }
            return;
        }
        var data = pageData['defaults'],
            jobList = [],
            classId = data['clazzId'],
            chapterId = data['knowledgeid'],
            reportUrl = data['reportUrl'],
            ktoken = data['ktoken'];
        UID = UID || data['userid'];
        FID = FID || data['fid'];
        for (let i = 0, l = pageData['attachments'].length; i < l; i++) {
            let item = pageData['attachments'][i];
            if (item['job'] != true || item['isPassed'] == true) {
                if (_w.top.unrivalReviewMode == '1' && item['type'] == 'video') {
                    jobList.push(item);
                }
                continue;
            } else {
                jobList.push(item);
            }
        }
        const videoReadyRequests = new Set();
        var video_getReady = (item) => {
            const readyKey = String(item['jobid']);
            if (videoReadyRequests.has(readyKey) || getMission(readyKey)) return;
            videoReadyRequests.add(readyKey);
            let statusUrl = _p + '//' + _h + '/ananas/status/' + item['property']['objectid'] + '?k=' +
                FID + '&flag=normal&_dc=' + String(Math.round(new Date())),
                doubleSpeed = item['property']['doublespeed'];
            busyThread += 1;
            let readyFinished = false;
            const releaseReady = () => { busyThread = Math.max(0, busyThread - 1); };
            const failVideoReady = reason => {
                setMission({ type: 'video', jobid: item['jobid'], name: item['property']['name'], status: 'failed', failure: reason });
                logs.addLog('获取视频任务信息失败：' + item['property']['name'] + '，' + reason, 'red');
            };
            const readyTimeout = setTimeout(function () {
                if (readyFinished) return;
                readyFinished = true;
                releaseReady();
                failVideoReady('请求超时');
            }, 20000);
            try {
            GM_xmlhttpRequest({
                method: "get",
                headers: {
                    'Host': _h,
                    'Referer': vrefer,
                    'Sec-Fetch-Site': 'same-origin'
                },
                url: statusUrl,
                onload: function (res) {
                    if (readyFinished) return;
                    readyFinished = true;
                    clearTimeout(readyTimeout);
                    releaseReady();
                    if (xxtRiskControlMark(res && res.responseText, res && res.finalUrl || statusUrl)) {
                        // 风控回包是验证页 HTML，不是视频信息；当成「解析失败」会把任务判死，
                        // 用户验证完也接不回来。这里放开去重标记，验证后原地重拉。
                        videoReadyRequests.delete(readyKey);
                        xxtRiskControlEnter('video-ready', function () { video_getReady(item); });
                        return;
                    }
                    try {
                        let videoInfo = JSON.parse(res.responseText),
                            duration = videoInfo['duration'],
                            dtoken = videoInfo['dtoken'];
                        if (duration == undefined) {
                            failVideoReady('响应中没有视频时长');
                            return;
                        }
                        setMission({
                            'module': item['property']['module'],
                            'type': 'video',
                            'dtoken': dtoken,
                            'duration': duration,
                            'objectId': item['property']['objectid'],
                            'rt': item['property']['rt'] || '0.9',
                            'otherInfo': item['otherInfo'],
                            'doublespeed': doubleSpeed,
                            'jobid': item['jobid'],
                            'name': item['property']['name'],
                            'status': 'pending'
                        });
                    } catch (e) {
                        console.error('[task ready]', { jobId: item['jobid'], error: e });
                        failVideoReady('任务信息解析失败');
                    }
                },
                onerror: function (err) {
                    if (readyFinished) return;
                    readyFinished = true;
                    clearTimeout(readyTimeout);
                    releaseReady();
                    console.log(err);
                    if (String(err && err.error || '').indexOf('@connect list') >= 0) {
                        logs.addLog('请添加安全网址，将 【 //@connect      ' + _h +
                            ' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：', 'red');
                        logs.addLog(
                            '<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">'
                        );
                        stop = true;
                        failVideoReady('缺少安全网址授权');
                    } else {
                        logs.addLog('获取任务详情失败', 'red');
                        logs.addLog('错误原因：' + String(err && err.error || '未知网络错误'), 'red');
                        failVideoReady('网络请求失败');
                    }
                },
                ontimeout: function () {
                    if (readyFinished) return;
                    readyFinished = true;
                    clearTimeout(readyTimeout);
                    releaseReady();
                    failVideoReady('请求超时');
                }
            });
            } catch (error) {
                if (readyFinished) return;
                readyFinished = true;
                clearTimeout(readyTimeout);
                releaseReady();
                console.error('[task ready]', { jobId: item['jobid'], error: error });
                failVideoReady('请求启动失败');
            }
        },
            doVideo = (item) => {
                if (rate <= 0) {
                    missionList['m' + item['jobid']]['running'] = true;
                    logs.addLog('倍速设置为0时，视频将自动跳过', 'orange');
                    setTimeout(function () {
                        missionList['m' + item['jobid']]['running'] = false;
                        missionList['m' + item['jobid']]['done'] = true;
                    }, 5000);
                    return;
                }
                let videojs_id = String(parseInt(Math.random() * 9999999));
                _d.cookie = 'videojs_id=' + videojs_id + ';path=/'
                logs.addLog('开始刷视频：' + item['name'] + '，倍速：' + String(rate) + '倍');
                logs.addLog('视频观看信息每60秒上报一次，请耐心等待', 'green');
                if (disableMonitor) {
                    logs.addLog('解除多端学习监控有清除进度风险，请谨慎使用', 'orange');
                }
                let dtype = 'Video';
                if (item['module'].includes('audio')) {
                    dtype = 'Audio';
                    rt = '';
                }
                let playTime = 0,
                    playsTime = 0,
                    isdrag = '3',
                    times = 0,
                    first = true,
                    loop = setInterval(function () {
                        if (riskControl.active) {
                            // 风控暂停期间既不推进也不上报：进度原地冻结，
                            // 恢复后从同一处续报，不会出现「一秒跳过几分钟」的假进度被平台清掉。
                            return;
                        }
                        if (rate <= 0) {
                            clearInterval(loop);
                            logs.addLog('倍速设置为0，视频已自动跳过', 'orange');
                            setTimeout(function () {
                                missionList['m' + item['jobid']]['running'] = false;
                                missionList['m' + item['jobid']]['done'] = true;
                            }, 5000);
                            return;
                        } else if (item['doublespeed'] == 0 && rate > 1 && _w.top.unrivalReviewMode == '0') {
                            //rate = 1;
                            //logs.addLog('该视频不允许倍速播放，已恢复至一倍速，高倍速会被清空进度挂科，勿存侥幸', 'red');
                        }
                        rt = missionList['m' + item['jobid']]['rt'];
                        playsTime += rate;
                        playTime = Math.ceil(playsTime);
                        if (times == 0 || times % 30 == 0 || playTime >= item['duration']) {
                            if (first) {
                                playTime = 0;
                            }
                            if (playTime >= item['duration']) {
                                clearInterval(loop);
                                playTime = item['duration'];
                                isdrag = '4';
                            } else if (playTime > 0) {
                                isdrag = '0';
                            }
                            busyThread += 1;
                            var busyReleased = false;
                            var releaseBusy = function () {
                                if (!busyReleased) {
                                    busyReleased = true;
                                    busyThread -= 1;
                                }
                            };
                            setTimeout(releaseBusy, 20000);
                            var _bold_playTime = playTime;
                            // 加密参数 enc 由本地算法生成：早期版本依赖一台第三方加密服务器，
                            // 该服务已不可用，只会让每次上报多等一次超时，故直接走本地算法。
                            function ecOnload() {
                                var strEc = '[' + classId + '][' + UID + '][' + item['jobid'] + '][' +
                                    item['objectId'] + '][' + (playTime * 1000) + '][d_yHJ!$pdA~5][' +
                                    (item['duration'] * 1000) + '][0_' + item['duration'] + ']';
                                let enc = MD5(strEc);
                                if (enc.length != 32) {
                                    clearInterval(loop);
                                    stop = true;
                                    releaseBusy();
                                    return;
                                }
                                let reportsUrl = reportUrl + '/' + item['dtoken'] +
                                    '?clazzId=' + classId + '&playingTime=' + playTime +
                                    '&duration=' + item['duration'] + '&clipTime=0_' + item[
                                    'duration'] + '&objectId=' + item['objectId'] +
                                    '&otherInfo=' + item['otherInfo'] + '&jobid=' + item[
                                    'jobid'] + '&userid=' + UID + '&isdrag=' + isdrag +
                                    '&view=pc&enc=' + enc + '&rt=' + rt + '&dtype=' + dtype +
                                    '&_t=' + String(Math.round(new Date()));
                                GM_xmlhttpRequest({
                                    method: "get",
                                    headers: {
                                        'Host': _h,
                                        'Referer': vrefer,
                                        'Sec-Fetch-Site': 'same-origin',
                                        'Content-Type': 'application/json'
                                    },
                                    url: reportsUrl,
                                    onload: function (res) {
                                        try {
                                            let today = new Date(),
                                                todayStr = today.getFullYear() +
                                                    'd' + today.getMonth() + 'd' + today
                                                        .getDate(),
                                                timelong = GM_getValue(
                                                    'unrivaltimelong', {});
                                            if (timelong[UID] == undefined ||
                                                timelong[UID]['today'] != todayStr
                                            ) {
                                                timelong[UID] = {
                                                    'time': 0,
                                                    'today': todayStr
                                                };
                                            } else {
                                                timelong[UID]['time']++;
                                            }
                                            GM_setValue('unrivaltimelong',
                                                timelong);
                                            releaseBusy();
                                            if (timelong[UID]['time'] / 60 > 22 &&
                                                item['doublespeed'] == 0 && _w.top
                                                    .unrivalReviewMode == '0') {
                                                clearInterval(loop);
                                                logs.addLog(
                                                    '今日学习时间过长，继续学习会导致清空进度，建议明天再来',
                                                    'red');
                                                setTimeout(function () {
                                                    missionList['m' + item[
                                                        'jobid']][
                                                        'running'
                                                    ] = false;
                                                    missionList['m' + item[
                                                        'jobid']][
                                                        'done'
                                                    ] = true;
                                                }, 5000);
                                                return;
                                            }
                                            let ispass = JSON.parse(res
                                                .responseText);
                                            first = false;
                                            if (ispass['isPassed'] && _w.top
                                                .unrivalReviewMode == '0') {
                                                logs.addLog('视频任务已完成', 'green');
                                                missionList['m' + item['jobid']]['running'] = false;
                                                missionList['m' + item['jobid']]['done'] = true;
                                                clearInterval(loop);
                                                return;
                                            } else if (isdrag == '4') {
                                                if (_w.top.unrivalReviewMode ==
                                                    '1') {
                                                    logs.addLog('视频已观看完毕', 'green');
                                                } else {
                                                    logs.addLog('视频已观看完毕，但视频任务未完成',
                                                        'red');
                                                }
                                                missionList['m' + item['jobid']][
                                                    'running'
                                                ] = false;
                                                missionList['m' + item['jobid']][
                                                    'done'
                                                ] = true;
                                                try {
                                                    clearInterval(loop);
                                                } catch (e) {

                                                }
                                            } else {
                                                var actualProgress = latestNativeVideoProgress;
                                                var hasFreshPlayerProgress = actualProgress &&
                                                    Date.now() - actualProgress.updatedAt <= 90000;
                                                var loggedCurrentTime = hasFreshPlayerProgress ?
                                                    actualProgress.currentTime : _bold_playTime;
                                                var loggedDuration = hasFreshPlayerProgress ?
                                                    actualProgress.duration : item['duration'];
                                                var loggedRemaining = Math.max(0, Math.ceil(loggedDuration - loggedCurrentTime));
                                                var playerPercent = hasFreshPlayerProgress ?
                                                    '（播放器 ' + xxtFormatPlaybackPercent(actualProgress.percent) + '%）' : '';
                                                logs.addLog(item['name'] + '已观看' + Math.floor(loggedCurrentTime) +
                                                    '秒，剩余大约' + String(loggedRemaining) + '秒' + playerPercent);
                                            }
                                        } catch (e) {
                                            releaseBusy();
                                            console.log(e);
                                            if (xxtRiskControlMark(res && res.responseText,
                                                res && res.finalUrl || reportsUrl)) {
                                                // 进度上报被挡：视频仍在本地播放，这里只暂停上报。
                                                // 定时器保留，验证完成后下个周期自动续报，
                                                // 不必从头重播，也不会让进度倒退。
                                                xxtRiskControlEnter('video-progress');
                                                return;
                                            }
                                            logs.addLog('超星返回错误信息，十秒后重试，请重新登录或重新打开浏览器', 'red');
                                            times = -10;
                                            return;
                                        }
                                    },
                                    onerror: function (err) {
                                        console.log(err);
                                        releaseBusy();
                                        if (err.error.indexOf('@connect list') >=
                                            0) {
                                            logs.addLog(
                                                '请添加安全网址，将 【 //@connect      ' +
                                                _h +
                                                ' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：',
                                                'red');
                                            logs.addLog(
                                                '<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">'
                                            );
                                            stop = true;
                                        } else {
                                            logs.addLog('观看视频失败', 'red');
                                            logs.addLog('错误原因：' + err.error, 'red');
                                        }
                                        missionList['m' + item['jobid']][
                                            'running'
                                        ] = false;
                                        clearInterval(loop);
                                    }
                                });
                            };
                            // 本地生成加密参数后直接上报，不再经过第三方加密服务器
                            ecOnload();
                        }
                        times += 1;
                    }, 1000);
                missionList['m' + item['jobid']]['running'] = true;
            },
            doDocument = (item) => {
                missionList['m' + item['jobid']]['running'] = true;
                logs.addLog('开始刷文档：' + item['name']);
                setTimeout(function () {
                    busyThread += 1;
                    let requestFinished = false;
                    const finishDocument = status => {
                        if (requestFinished) return;
                        requestFinished = true;
                        busyThread = Math.max(0, busyThread - 1);
                        missionList['m' + item['jobid']].status = status;
                    };
                    try {
                    GM_xmlhttpRequest({
                        method: "get",
                        timeout: 15000,
                        url: _p + '//' + _h + '/ananas/job/document?jobid=' + item['jobid'] +
                            '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' +
                            classId + '&jtoken=' + item['jtoken'],
                        onload: function (res) {
                            if (requestFinished) return;
                            if (xxtRiskControlMark(res && res.responseText, res && res.finalUrl)) {
                                // 验证页 HTML 会被 JSON.parse 抛错，进而把文档任务判成失败；
                                // 实际只是要求人工验证，暂停后重试即可。
                                requestFinished = true;
                                busyThread = Math.max(0, busyThread - 1);
                                missionList['m' + item['jobid']].running = false;
                                xxtRiskControlEnter('document', function () { doDocument(item); });
                                return;
                            }
                            try {
                                let ispass = JSON.parse(res.responseText);
                                if (ispass['status']) {
                                    logs.addLog('文档任务已完成', 'green');
                                    finishDocument('done');
                                } else {
                                    logs.addLog('文档已阅读完成，但任务点未完成', 'red');
                                    finishDocument('failed');
                                }

                            } catch (err) {
                                console.log(err);
                                console.log(res.responseText);
                                logs.addLog('解析文档内容失败', 'red');
                                finishDocument('failed');
                            }
                        },
                        onerror: function (err) {
                            if (requestFinished) return;
                            console.log(err);
                            if (String(err && err.error || '').indexOf('@connect list') >= 0) {
                                logs.addLog('请添加安全网址，将 【 //@connect      ' + _h +
                                    ' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：', 'red');
                                logs.addLog(
                                    '<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">'
                                );
                                stop = true;
                            } else {
                                logs.addLog('阅读文档失败', 'red');
                                logs.addLog('错误原因：' + String(err && err.error || '未知网络错误'), 'red');
                            }
                            finishDocument('failed');
                        },
                        ontimeout: function () {
                            if (requestFinished) return;
                            logs.addLog('文档任务请求超时：' + item['name'], 'red');
                            finishDocument('failed');
                        }
                    });
                    } catch (error) {
                        console.error('[task document]', { jobId: item['jobid'], error: error });
                        logs.addLog('文档任务请求启动失败：' + item['name'], 'red');
                        finishDocument('failed');
                    }
                }, parseInt(Math.random() * 2000 + 9000, 10))
            },
            doWork = (item) => {
                missionList['m' + item['jobid']]['running'] = true;
                logs.addLog('开始刷章节测试：' + item['name']);
                aiTrace('章节任务开始，任务 ID ' + String(item['jobid']).replace(/[^\w-]/g, '').slice(0, 40), 'info', _w);
                logs.addLog('作答覆盖率最低阈值：' + String(accuracy) + '%；自动提交仍要求所有题目均处理并核验成功', 'blue');
                _w.top.unrivalActiveWorkId = String(item['jobid']).replace(/^work-/, '');
                _w.top.unrivalWorkInfo = '';
                _w.top.unrivalDoneWorkId = '';
                _w.top.unrivalWorkDone = false;
                if (typeof xxtSetCourseMode === 'function') {
                    xxtSetCourseMode('work');
                } else {
                    _d.getElementById('workEmpty').style.display = 'none';
                    _d.getElementById('workPanel').style.display = 'block';
                }
                if (_d.getElementById('workStateTip')) {
                    _d.getElementById('workStateTip').textContent = '正在作答：' + item['name'];
                }
                if (_w.xxtShowTab) {
                    _w.xxtShowTab('work');
                }
                _d.getElementById('frame_content').src = _p + '//' + _h + '/work/phone/work?workId=' + item['jobid']
                    .replace('work-', '') + '&courseId=' + courseId + '&clazzId=' + classId + '&knowledgeId=' +
                    chapterId + '&jobId=' + item['jobid'] + '&enc=' + item['enc'];
                let workInfoInterval = setInterval(function () {
                    drainAiTrace();
                    if (_w.top.unrivalWorkInfo != '') {
                        logs.addLog(_w.top.unrivalWorkInfo);
                        _w.top.unrivalWorkInfo = '';
                    }
                }, 100);
                let checkcross = setInterval(function () {
                    if (_w.top.unrivalWorkDone == false) {
                        clearInterval(checkcross);
                        return;
                    }
                    let ifW = _d.getElementById('frame_content').contentWindow;
                    try {
                        ifW.location.href;
                    } catch (e) {
                        console.log(e);
                        if (e.message.indexOf('cross-origin') != -1) {
                            clearInterval(checkcross);
                            _w.top.unrivalWorkDone = true;
                            return;
                        }
                    }
                }, 2000);
                let workDoneInterval = setInterval(function () {
                    if (_w.top.unrivalWorkDone) {
                        drainAiTrace();
                        aiTrace('章节结果信号已收到，关闭答题页并等待任务状态更新', 'info', _w);
                        _w.top.unrivalWorkDone = false;
                        clearInterval(workDoneInterval);
                        clearInterval(workInfoInterval);
                        clearInterval(checkcross);
                        _w.top.unrivalDoneWorkId = '';
                        if (typeof xxtSetCourseMode === 'function') {
                            xxtSetCourseMode('course');
                        } else {
                            _d.getElementById('workPanel').style.display = 'none';
                            _d.getElementById('workEmpty').style.display = 'block';
                        }
                        if (_d.getElementById('workStateTip')) {
                            _d.getElementById('workStateTip').textContent = '暂无进行中的章节测试';
                        }
                        aiRemovePanel(_w);
                        _d.getElementById('frame_content').src = '';
                        if (_w.xxtShowTab) {
                            _w.xxtShowTab('log');
                        }
                        setTimeout(function () {
                            missionList['m' + item['jobid']]['running'] = false;
                            missionList['m' + item['jobid']]['done'] = true;
                        }, 5000);
                    }
                }, 500);
                _w.addEventListener('pagehide', () => {
                    clearInterval(workInfoInterval);
                    clearInterval(checkcross);
                    clearInterval(workDoneInterval);
                }, { once: true });
            },
            doAnanasTask = (item, spec, label) => {
                var mission = missionList['m' + item['jobid']];
                mission.running = true;
                logs.addLog('开始处理' + label + '任务：' + item['name']);
                var settled = false;
                var settle = function (status, message, color) {
                    if (settled) return;
                    settled = true;
                    mission.status = status;
                    if (message) logs.addLog(message, color);
                };
                setTimeout(function () {
                    var url;
                    try {
                        url = xxtAnanasUrl(item, spec, {
                            protocol: _p, host: _h, chapterId: chapterId, courseId: courseId, classId: classId
                        });
                    } catch (error) {
                        settle('failed', label + '任务参数异常：' + item['name'], 'red');
                        return;
                    }
                    try {
                        GM_xmlhttpRequest({
                            method: "get",
                            timeout: 15000,
                            url: url,
                            onload: function (res) {
                                if (settled) return;
                                if (xxtRiskControlMark(res && res.responseText, res && res.finalUrl || url)) {
                                    // 图书/链接/速课都是靠回包文本判成功的，验证页 HTML 里没有成功标识，
                                    // 直接判失败会让任务进入终态、验证完也接不回来。
                                    settled = true;
                                    mission.running = false;
                                    xxtRiskControlEnter(label, function () { doAnanasTask(item, spec, label); });
                                    return;
                                }
                                if (xxtAnanasSucceeded(spec, res && res.responseText)) {
                                    settle('done', label + '任务已完成：' + item['name'], 'green');
                                } else {
                                    settle('failed', label + '任务未完成，请手动检查：' + item['name'], 'red');
                                }
                            },
                            onerror: function (err) {
                                console.log(err);
                                settle('failed', label + '任务请求失败：' + item['name'], 'red');
                            },
                            ontimeout: function () {
                                settle('failed', label + '任务请求超时：' + item['name'], 'red');
                            }
                        });
                    } catch (error) {
                        console.error('[task request]', { jobId: item['jobid'], error: error });
                        settle('failed', label + '任务请求启动失败：' + item['name'], 'red');
                    }
                }, parseInt(Math.random() * 2000 + 3000, 10));
            },
            doBook = (item) => doAnanasTask(item, { path: '/ananas/job' }, '图书'),
            doHyperlink = (item) => doAnanasTask(item, { path: '/ananas/job/hyperlink' }, '链接'),
            doMicroCourse = (item) => doAnanasTask(item, {
                path: '/ananas/job/microCourse',
                successText: '添加考核点成功',
                params: function (mission) {
                    return [
                        ['checkMicroTopic', 'true'],
                        ['microTopicId', mission.microTopicId || 'undefined'],
                        ['_', Date.now()]
                    ];
                }
            }, '速课'),
            doLive = (item) => {
                var mission = missionList['m' + item['jobid']];
                var settled = false;
                var timer = null;
                var settle = function (ok, message) {
                    if (settled) return;
                    settled = true;
                    if (timer !== null) clearInterval(timer);
                    timer = null;
                    mission.status = ok ? 'done' : 'failed';
                    if (message) logs.addLog(message, ok ? 'green' : 'red');
                };
                mission.running = true;
                logs.addLog('开始处理直播任务：' + item['name']);
                GM_xmlhttpRequest({
                    method: "get",
                    timeout: 15000,
                    url: _p + '//' + _h + '/ananas/live/liveinfo?' + xxtQueryString([
                        ['liveid', item.liveId], ['userid', UID], ['clazzid', classId],
                        ['knowledgeid', chapterId], ['courseid', courseId], ['jobid', item.jobid], ['ut', 's']
                    ]),
                    onload: function (res) {
                        if (settled) return;
                        if (xxtRiskControlMark(res && res.responseText, res && res.finalUrl)) {
                            // 直播详情也走风控；判失败同样会让任务进终态，验证后接不回来。
                            settled = true;
                            mission.running = false;
                            xxtRiskControlEnter('live', function () { doLive(item); });
                            return;
                        }
                        var detail;
                        try {
                            var info = JSON.parse(res.responseText);
                            detail = (info && info.temp && info.temp.data) ? info.temp.data : (info && info.data ? info.data : {});
                        } catch (error) {
                            console.log(error);
                            settle(false, '解析直播信息失败：' + item['name']);
                            return;
                        }
                        if (Number(detail.liveStatus) === 4 && Number(detail.ifReview) === 1) {
                            settle(false, '直播不允许回看，无法完成：' + item['name']);
                            return;
                        }
                        var duration = parseInt(detail.duration, 10) || 0,
                            watched = (parseInt(detail.timeLongValue, 10) || 0) * 60;
                        if (duration > 0 && watched >= duration) {
                            settle(true, '直播时长已达标，无需继续观看：' + item['name']);
                            return;
                        }
                        if (duration <= 0) {
                            settle(false, '无法获取直播时长，请手动完成：' + item['name']);
                            return;
                        }
                        var progress = xxtCreateLiveProgress(duration, watched, { step: 30, maxFailures: 3 }),
                            started = false;
                        var reportFailure = function (reason) {
                            if (settled) return;
                            if (progress.recordFailure()) {
                                settle(false, '直播进度连续上报失败，已跳过，请手动完成：' + item['name']);
                            } else {
                                logs.addLog(reason + '：' + item['name'], 'red');
                            }
                        };
                        timer = setInterval(function () {
                            if (settled) return;
                            if (stop) {
                                settle(false, '脚本已停止，直播任务中断');
                                return;
                            }
                            if (!progress.canReport()) {
                                settle(true, '直播回放完成：' + item['name']);
                                return;
                            }
                            var reportUrl = _p + '//zhibo.chaoxing.com/saveTimePc?' + xxtQueryString([
                                ['streamName', item.streamName || ''], ['vdoid', item.vdoid || ''],
                                ['userId', UID], ['isStart', started ? '1' : '0'],
                                ['t', Date.now()], ['courseId', courseId]
                            ]);
                            started = true;
                            GM_xmlhttpRequest({
                                method: "get",
                                timeout: 15000,
                                url: reportUrl,
                                onload: function (report) {
                                    if (settled) return;
                                    if (xxtRiskControlMark(report && report.responseText, report && report.finalUrl || reportUrl)) {
                                        // 进度上报被风控挡下：短视频里只要有一条进度没记上，
                                        // 这次观看就白播了。停在这里等用户验证，再从当前进度续报。
                                        if (timer !== null) clearInterval(timer);
                                        timer = null;
                                        settled = true;
                                        mission.running = false;
                                        xxtRiskControlEnter('live-progress', function () { doLive(item); });
                                        return;
                                    }
                                    if (String(report && report.responseText).indexOf('success') < 0) {
                                        reportFailure('直播进度上报失败');
                                        return;
                                    }
                                    var complete = progress.recordSuccess();
                                    logs.addLog(item['name'] + '：直播已观看' + Math.floor(progress.getProgress() / 60) + '分钟');
                                    if (complete) settle(true, '直播回放完成：' + item['name']);
                                },
                                onerror: function () {
                                    reportFailure('直播进度上报失败');
                                },
                                ontimeout: function () {
                                    reportFailure('直播进度上报超时');
                                }
                            });
                        }, 30000);
                        logs.addLog('直播任务将在后台按30秒一次上报进度：' + item['name']);
                    },
                    onerror: function (err) {
                        console.log(err);
                        settle(false, '获取直播信息失败：' + item['name']);
                    },
                    ontimeout: function () {
                        settle(false, '获取直播信息超时：' + item['name']);
                    }
                });
            },
            missionList = Object.create(null),
            taskCandidateCount = 0,
            taskSetupReady = false,
            getMission = (jobid) => missionList['m' + jobid],
            setMission = (mission) => {
                var key = 'm' + mission.jobid,
                    existing = missionList[key];
                if (existing) return existing;
                var stateModel = createMissionState(mission.status || 'pending');
                Object.defineProperty(mission, 'status', {
                    configurable: true,
                    get: stateModel.getStatus,
                    set: stateModel.setStatus
                });
                Object.defineProperty(mission, 'running', {
                    configurable: true,
                    get: stateModel.isRunning,
                    set: stateModel.setRunning
                });
                Object.defineProperty(mission, 'done', {
                    configurable: true,
                    get: stateModel.isDone,
                    set: stateModel.setDone
                });
                missionList[key] = mission;
                stateModel.setStatus(stateModel.getStatus());
                return mission;
            };
        if (jobList.length <= 0) {
            if (jumpType != 2) {
                _w.top.jump = true;
                logs.addLog('此页无任务，5秒后自动下一章', 'green');
            } else {
                logs.addLog('此页无任务，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数', 'green');
            }
            return;
        }
        for (let i = 0, l = jobList.length; i < l; i++) {
            let item = jobList[i];
            taskCandidateCount += 1;
            if (item['type'] == 'video') {
                video_getReady(item);
            } else if (item['type'] == 'document') {
                setMission({
                    'type': 'document',
                    'jtoken': item['jtoken'],
                    'jobid': item['jobid'],
                    'name': item['property']['name'],
                    'status': 'pending'
                });
            } else if (item['type'] == 'book' || (item['property'] && item['property']['module'] == 'insertbook')) {
                setMission({
                    'type': 'book',
                    'jtoken': item['jtoken'],
                    'jobid': item['jobid'],
                    'name': (item['property'] && (item['property']['name'] || item['property']['bookname'])) || '图书任务',
                    'status': 'pending'
                });
            } else if (item['type'] == 'hyperlink') {
                setMission({
                    'type': 'hyperlink',
                    'jtoken': item['jtoken'],
                    'jobid': item['jobid'],
                    'name': (item['property'] && (item['property']['title'] || item['property']['name'])) || '链接任务',
                    'status': 'pending'
                });
            } else if (item['type'] == 'microCourse') {
                setMission({
                    'type': 'microCourse',
                    'jtoken': item['jtoken'],
                    'jobid': item['jobid'],
                    'name': (item['property'] && (item['property']['title'] || item['property']['name'])) || '速课任务',
                    'status': 'pending'
                });
            } else if (item['type'] == 'live') {
                setMission({
                    'type': 'live',
                    'jobid': item['jobid'],
                    'liveId': (item['property'] && item['property']['liveId']) || item['liveId'],
                    'streamName': (item['property'] && item['property']['streamName']) || '',
                    'vdoid': (item['property'] && item['property']['vdoid']) || '',
                    'name': (item['property'] && (item['property']['title'] || item['property']['name'])) || '直播任务',
                    'status': 'pending'
                });
            } else if ((item['type'] == 'workid' || item['type'] == 'work' ||
                (item['property'] && item['property']['workid'])) && _w.top.unrivalDoWork == '1') {
                setMission({
                    'type': 'work',
                    'workid': item['property']['workid'],
                    'jobid': item['jobid'],
                    'name': item['property']['title'],
                    'enc': item['enc'],
                    'status': 'pending'
                });
            }
            // 自动答题关闭的章节测试和未识别的任务类型不再登记：任务列表已移除，
            // 这类任务本来就由用户手动处理，登记进来只会让调度器空转。
        }
        taskSetupReady = true;
        _w.addEventListener('pagehide', cancelLoopJob, { once: true });
        loopjob();
    } else if (_l.href.includes("mycourse/studentstudy")) {
        var audiofile =
            'data:audio/ogg;base64,T2dnUwACAAAAAAAAAABwRPFFAAAAAGFtEqwBHgF2b3JiaXMAAAAAAUAfAAAAAAAAUHgAAAAAAACZAU9nZ1MAAAAAAAAAAAAAcETxRQEAAAA7J4IBDP8F////////////tQN2b3JiaXMvAAAAWGlwaC5PcmcgbGliVm9yYmlzIEkgMjAxNDAxMjIgKFR1cnBha8OkcsOkamlpbikGAAAAJQAAAEVOQ09ERVI9U291bmQgU3R1ZGlvLCBsaWJWb3JiaXMgMS4zLjEbAAAAQUxCVU0gQVJUSVNUPUFkdmVudHVyZSBMYW5kFAAAAEFMQlVNPUFkdmVudHVyZSBMYW5kIQAAAEVOQ09ESU5HIEFQUExJQ0FUSU9OPVNvdW5kIFN0dWRpbxUAAABBUlRJU1Q9QWR2ZW50dXJlIExhbmQjAAAAVElUTEU9RW1wdHkgTG9vcCBGb3IgSlMgUGVyZm9ybWFuY2UBBXZvcmJpcxJCQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBADIAAAYhiGH3knMkFOQSSYpVcw5CKH1DjnlFGTSUsaYYoxRzpBTDDEFMYbQKYUQ1E45pQwiCENInWTOIEs96OBi5zgQGrIiAIgCAACMQYwhxpBzDEoGIXKOScggRM45KZ2UTEoorbSWSQktldYi55yUTkompbQWUsuklNZCKwUAAAQ4AAAEWAiFhqwIAKIAABCDkFJIKcSUYk4xh5RSjinHkFLMOcWYcowx6CBUzDHIHIRIKcUYc0455iBkDCrmHIQMMgEAAAEOAAABFkKhISsCgDgBAIMkaZqlaaJoaZooeqaoqqIoqqrleabpmaaqeqKpqqaquq6pqq5seZ5peqaoqp4pqqqpqq5rqqrriqpqy6ar2rbpqrbsyrJuu7Ks256qyrapurJuqq5tu7Js664s27rkearqmabreqbpuqrr2rLqurLtmabriqor26bryrLryratyrKua6bpuqKr2q6purLtyq5tu7Ks+6br6rbqyrquyrLu27au+7KtC7vourauyq6uq7Ks67It67Zs20LJ81TVM03X9UzTdVXXtW3VdW1bM03XNV1XlkXVdWXVlXVddWVb90zTdU1XlWXTVWVZlWXddmVXl0XXtW1Vln1ddWVfl23d92VZ133TdXVblWXbV2VZ92Vd94VZt33dU1VbN11X103X1X1b131htm3fF11X11XZ1oVVlnXf1n1lmHWdMLqurqu27OuqLOu+ruvGMOu6MKy6bfyurQvDq+vGseu+rty+j2rbvvDqtjG8um4cu7Abv+37xrGpqm2brqvrpivrumzrvm/runGMrqvrqiz7uurKvm/ruvDrvi8Mo+vquirLurDasq/Lui4Mu64bw2rbwu7aunDMsi4Mt+8rx68LQ9W2heHVdaOr28ZvC8PSN3a+AACAAQcAgAATykChISsCgDgBAAYhCBVjECrGIIQQUgohpFQxBiFjDkrGHJQQSkkhlNIqxiBkjknIHJMQSmiplNBKKKWlUEpLoZTWUmotptRaDKG0FEpprZTSWmopttRSbBVjEDLnpGSOSSiltFZKaSlzTErGoKQOQiqlpNJKSa1lzknJoKPSOUippNJSSam1UEproZTWSkqxpdJKba3FGkppLaTSWkmptdRSba21WiPGIGSMQcmck1JKSamU0lrmnJQOOiqZg5JKKamVklKsmJPSQSglg4xKSaW1kkoroZTWSkqxhVJaa63VmFJLNZSSWkmpxVBKa621GlMrNYVQUgultBZKaa21VmtqLbZQQmuhpBZLKjG1FmNtrcUYSmmtpBJbKanFFluNrbVYU0s1lpJibK3V2EotOdZaa0ot1tJSjK21mFtMucVYaw0ltBZKaa2U0lpKrcXWWq2hlNZKKrGVklpsrdXYWow1lNJiKSm1kEpsrbVYW2w1ppZibLHVWFKLMcZYc0u11ZRai621WEsrNcYYa2415VIAAMCAAwBAgAlloNCQlQBAFAAAYAxjjEFoFHLMOSmNUs45JyVzDkIIKWXOQQghpc45CKW01DkHoZSUQikppRRbKCWl1losAACgwAEAIMAGTYnFAQoNWQkARAEAIMYoxRiExiClGIPQGKMUYxAqpRhzDkKlFGPOQcgYc85BKRljzkEnJYQQQimlhBBCKKWUAgAAChwAAAJs0JRYHKDQkBUBQBQAAGAMYgwxhiB0UjopEYRMSielkRJaCylllkqKJcbMWomtxNhICa2F1jJrJcbSYkatxFhiKgAA7MABAOzAQig0ZCUAkAcAQBijFGPOOWcQYsw5CCE0CDHmHIQQKsaccw5CCBVjzjkHIYTOOecghBBC55xzEEIIoYMQQgillNJBCCGEUkrpIIQQQimldBBCCKGUUgoAACpwAAAIsFFkc4KRoEJDVgIAeQAAgDFKOSclpUYpxiCkFFujFGMQUmqtYgxCSq3FWDEGIaXWYuwgpNRajLV2EFJqLcZaQ0qtxVhrziGl1mKsNdfUWoy15tx7ai3GWnPOuQAA3AUHALADG0U2JxgJKjRkJQCQBwBAIKQUY4w5h5RijDHnnENKMcaYc84pxhhzzjnnFGOMOeecc4wx55xzzjnGmHPOOeecc84556CDkDnnnHPQQeicc845CCF0zjnnHIQQCgAAKnAAAAiwUWRzgpGgQkNWAgDhAACAMZRSSimllFJKqKOUUkoppZRSAiGllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimVUkoppZRSSimllFJKKaUAIN8KBwD/BxtnWEk6KxwNLjRkJQAQDgAAGMMYhIw5JyWlhjEIpXROSkklNYxBKKVzElJKKYPQWmqlpNJSShmElGILIZWUWgqltFZrKam1lFIoKcUaS0qppdYy5ySkklpLrbaYOQelpNZaaq3FEEJKsbXWUmuxdVJSSa211lptLaSUWmstxtZibCWlllprqcXWWkyptRZbSy3G1mJLrcXYYosxxhoLAOBucACASLBxhpWks8LR4EJDVgIAIQEABDJKOeecgxBCCCFSijHnoIMQQgghREox5pyDEEIIIYSMMecghBBCCKGUkDHmHIQQQgghhFI65yCEUEoJpZRSSucchBBCCKWUUkoJIYQQQiillFJKKSGEEEoppZRSSiklhBBCKKWUUkoppYQQQiillFJKKaWUEEIopZRSSimllBJC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',
            audioPlayer = new Audio(audiofile);
        _w.top.backNow = 1;
        audioPlayer.loop = true;
        _w.audioPlayer = audioPlayer;
        setInterval(function () {
            try {
                _w.jQuery.fn.viewer.Constructor.prototype.show = () => { };
            } catch (e) {
            }
        }, 1000);
        try {
            _w.unrivalScriptList.push('Fuck me please');
        } catch (e) {
            _w.unrivalScriptList = ['Fuck me please'];
        }
        function checkOffline() {
            let dleft = _d.getElementsByClassName('left');
            if (dleft.length == 1) {
                let img = dleft[0].getElementsByTagName('img');
                if (img.length == 1) {
                    if (img[0].src.indexOf('loading.gif') != -1) {
                        return true;
                    }
                }
            }
            return false;
        }
        setInterval(function () {
            if (checkOffline()) {
                setTimeout(function () {
                    if (checkOffline()) {
                        _l.reload();
                    }
                }, 10000)
            }
        }, 3000);
        _d.addEventListener('visibilitychange', function () {
            var c = 0;
            _d.title = '学生学习页面';
            if (_d.hidden) {
                audioPlayer.play();
                var timer = setInterval(function () {
                    if (c) {
                        _d.title = '超星助手挂机中';
                        c = 0;
                    } else {
                        _d.title = '超星助手挂机中';
                        c = 1;
                    }
                    if (!_d.hidden) {
                        clearInterval(timer);
                        _d.title = '学生学习页面';
                    }
                }, 1300);
            } else {
                audioPlayer.pause();
            }
        });
        _w.unrivalgetTeacherAjax = _w.getTeacherAjax;
        _w.getTeacherAjax = (courseid, classid, cid) => {
            if (cid == getQueryVariable('chapterId')) {
                return;
            }
            _w.top.unrivalPageRd = '';
            _w.unrivalgetTeacherAjax(courseid, classid, cid);
        }
        if (disableMonitor == 1) {
            _w.appendChild = _w.Element.prototype.appendChild;
            _w.Element.prototype.appendChild = function () {
                try {
                    if (arguments[0].src.indexOf('detect.chaoxing.com') > 0) {
                        return;
                    }
                } catch (e) { }
                _w.appendChild.apply(this, arguments);
            };
        }

        _w.jump = false;
        setInterval(function () {
            if (getQueryVariable('mooc2') == '1') {
                let tabs = _d.getElementsByClassName('posCatalog_select');
                for (let i = 0, l = tabs.length; i < l; i++) {
                    let tabId = tabs[i].getAttribute('id');
                    if (tabId.indexOf('cur') >= 0 && tabs[i].getAttribute('class') == 'posCatalog_select') {
                        const targetId = tabId.replace('cur', '');
                        if (tabs[i].dataset.unrivalCourse !== targetId) {
                            tabs[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                                "','" + targetId + "');");
                            tabs[i].dataset.unrivalCourse = targetId;
                        }
                    }
                }
            } else {
                let h4s = _d.getElementsByTagName('h4'),
                    h5s = _d.getElementsByTagName('h5');
                for (let i = 0, l = h4s.length; i < l; i++) {
                    if (h4s[i].getAttribute('id').indexOf('cur') >= 0) {
                        const targetId = h4s[i].getAttribute('id').replace('cur', '');
                        if (h4s[i].dataset.unrivalCourse !== targetId) {
                            h4s[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                                "','" + targetId + "');");
                            h4s[i].dataset.unrivalCourse = targetId;
                        }
                    }
                }
                for (let i = 0, l = h5s.length; i < l; i++) {
                    if (h5s[i].getAttribute('id').indexOf('cur') >= 0) {
                        const targetId = h5s[i].getAttribute('id').replace('cur', '');
                        if (h5s[i].dataset.unrivalCourse !== targetId) {
                            h5s[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                                "','" + targetId + "');");
                            h5s[i].dataset.unrivalCourse = targetId;
                        }
                    }
                }
            }
        }, 1000);
        setInterval(function () {
            let but = null;
            if (_w.jump) {
                _w.jump = false;
                _w.top.unrivalDoneWorkId = '';
                _w.jjump = (rd) => {
                    if (rd != _w.top.unrivalPageRd) {
                        return;
                    }
                    try {
                        setTimeout(function () {
                            if (jumpType == 1) {
                                if (getQueryVariable('mooc2') == '1') {
                                    but = _d.getElementsByClassName(
                                        'jb_btn jb_btn_92 fs14 prev_next next');
                                } else {
                                    but = _d.getElementsByClassName('orientationright');
                                }
                                try {
                                    setTimeout(function () {
                                        if (rd != _w.top.unrivalPageRd) {
                                            return;
                                        }
                                        but[0].click();
                                    }, 2000);
                                } catch (e) { }
                                return;
                            }
                            if (getQueryVariable('mooc2') == '1') {
                                let ul = _d.getElementsByClassName('prev_ul')[0],
                                    lis = ul.getElementsByTagName('li');
                                for (let i = 0, l = lis.length; i < l; i++) {
                                    if (lis[i].getAttribute('class') == 'active') {
                                        if (i + 1 >= l) {
                                            break;
                                        } else {
                                            try {
                                                lis[i + 1].click();
                                            } catch (e) { }
                                            return;
                                        }
                                    }
                                }
                                let tabs = _d.getElementsByClassName('posCatalog_select');
                                for (let i = 0, l = tabs.length; i < l; i++) {
                                    if (tabs[i].getAttribute('class') ==
                                        'posCatalog_select posCatalog_active') {
                                        while (i + 1 < tabs.length) {
                                            let nextTab = tabs[i + 1];
                                            if ((nextTab.innerHTML.includes(
                                                'icon_Completed prevTips') && _w.top
                                                    .unrivalReviewMode == '0') || nextTab
                                                        .innerHTML.includes(
                                                            'catalog_points_er prevTips')) {
                                                i++;
                                                continue;
                                            }
                                            if (nextTab.id.indexOf('cur') < 0) {
                                                i++;
                                                continue;
                                            }
                                            let clickF = setInterval(function () {
                                                if (rd != _w.top.unrivalPageRd) {
                                                    clearInterval(clickF);
                                                    return;
                                                }
                                                nextTab.click();
                                            }, 2000);
                                            break;
                                        }
                                        break;
                                    }
                                }
                            } else {
                                let div = _d.getElementsByClassName('tabtags')[0],
                                    spans = div.getElementsByTagName('span');
                                for (let i = 0, l = spans.length; i < l; i++) {
                                    if (spans[i].getAttribute('class').indexOf('currents') >=
                                        0) {
                                        if (i + 1 == l) {
                                            break;
                                        } else {
                                            try {
                                                spans[i + 1].click();
                                            } catch (e) { }
                                            return;
                                        }
                                    }
                                }
                                let tabs = _d.getElementsByTagName('span'),
                                    newTabs = [];
                                for (let i = 0, l = tabs.length; i < l; i++) {
                                    if (tabs[i].getAttribute('style') != null && tabs[i]
                                        .getAttribute('style').indexOf(
                                            'cursor:pointer;height:18px;') >= 0) {
                                        newTabs.push(tabs[i]);
                                    }
                                }
                                tabs = newTabs;
                                for (let i = 0, l = tabs.length; i < l; i++) {
                                    if (tabs[i].parentNode.getAttribute('class') ==
                                        'currents') {
                                        while (i + 1 < tabs.length) {
                                            let nextTab = tabs[i + 1].parentNode;
                                            if ((nextTab.innerHTML.includes(
                                                'roundpoint  blue') && _w.top
                                                    .unrivalReviewMode == '0') || nextTab
                                                        .innerHTML.includes('roundpointStudent  lock')
                                            ) {
                                                i++;
                                                continue;
                                            }
                                            if (nextTab.id.indexOf('cur') < 0) {
                                                i++;
                                                continue;
                                            }
                                            let clickF = setInterval(function () {
                                                if (rd != _w.top.unrivalPageRd) {
                                                    clearInterval(clickF);
                                                    return;
                                                }
                                                nextTab.click();
                                            }, 2000);
                                            break;
                                        }
                                        break;
                                    }
                                }
                            }
                        }, 2000);
                    } catch (e) { }
                }
                // onReadComplete1 是平台可选的收尾钩子，并非所有页面都存在；
                // 直接调用会在缺失时抛 TypeError 并跳过下面的跳章调度，故必须先判存在。
                try {
                    if (typeof _w.onReadComplete1 === 'function') _w.onReadComplete1();
                } catch (e) { }
                // 原实现用字符串 setTimeout 求值，等价于 eval；改为闭包，并保留 rd 快照语义。
                var jumpRd = _w.top.unrivalPageRd;
                setTimeout(function () { if (typeof _w.jjump === 'function') _w.jjump(jumpRd); }, 2856);
            }
        }, 200);
    } else if (_l.href.indexOf("work/phone/doHomeWork") > 0) {
        _w.top.unrivalWorkDone = false;
        _w.aalert = _w.alert;
        let _phoneSaveAck = false;
        _w.alert = msg => {
            const _phoneAlertText = String(msg == null ? '' : msg);
            if (_phoneAlertText.indexOf('保存成功') >= 0) {
                _phoneSaveAck = true;
                _w.top.unrivalDoneWorkId = getQueryVariable('workId');
                aiTrace('平台提示保存成功', 'info', _w);
                aiPanelMessage('tip', { type: 'hidden', tip: '平台已提示答案保存成功，请检查章节任务状态' }, _w);
                return;
            }
            aiTrace('平台弹窗：' + String(msg), 'warn', _w);
            if (aiObserveChapterAlert(_w, _phoneWorkId, msg)) {
                let held = {};
                try { held = aiChapterSubmitHost(_w).__xxtChapterSubmit || {}; } catch (error) { held = {}; }
                _w.top.unrivalWorkInfo = held.state === 'failed' ?
                    '平台拒绝提交：' + _phoneAlertText.slice(0, 40) + '（已释放提交锁，请检查后重试）' :
                    '平台提示作业已批阅，停止重复提交';
                aiPanelMessage('tip', { type: 'hidden', tip: _w.top.unrivalWorkInfo }, _w);
            }
            _w.aalert(msg);
        };
        const _phoneWorkId = getQueryVariable('workId');
        if (_w.top.unrivalDoneWorkId == _phoneWorkId) {
            _w.top.unrivalWorkDone = true;
            return;
        }
        const _phonePanelTip = (tip, type) => {
            aiTrace('章节状态：' + tip, /失败|异常|取消|未处理|未发现|未完成|未通过/.test(tip) ? 'warn' : 'info', _w);
            aiPanelMessage('tip', { tip: tip, type: type }, _w);
        };
        if (aiChapterQuestionBlocked(_w, _phoneWorkId)) {
            let held = {};
            try { held = aiChapterSubmitHost(_w).__xxtChapterSubmit || {}; } catch (error) { held = {}; }
            _w.top.unrivalWorkInfo = held.state === 'reviewed' ? '平台显示该作业已批阅，已阻止重复提交' :
                '同一章节已由其他页面发起提交，已阻止重复提交';
            _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
            return;
        }
        _phonePanelTip('正在处理章节测试题目...', 'active');
        const _phoneQuestions = Array.from(_d.getElementsByClassName('Py-mian1'));
        const _phoneTotal = _phoneQuestions.length;
        const _phoneTypeNames = { '0': '单选题', '1': '多选题', '3': '判断题' };
        const _phoneTypeCodes = { '单选题': 0, '多选题': 1, '判断题': 3 };
        const _phoneQuestionText = questionElement => {
            const title = questionElement.getElementsByClassName('Py-m1-title fs16')[0];
            return title ? handleImgs(title.innerHTML).replace(/(<([^>]+)>)/ig, '').replace(/[0-9]{1,3}.\[(.*?)\]/ig, '').replace(/\s+/g, ' ').trim() : '';
        };
        const _phoneOptionText = node => {
            const content = node.cloneNode(true);
            const marker = content.querySelector('em[id-param]');
            if (marker) marker.remove();
            return trim(content.innerHTML || '');
        };
        const _phoneCollectOptions = (questionElement, type, pageQuestionId, questionId) => {
            const nodes = type === '判断题' ? Array.from(questionElement.querySelectorAll('li[val-param]')) : Array.from(questionElement.querySelectorAll('.answerList li'));
            return nodes.filter(node => type === '判断题' ? node.getAttribute('id-param') === pageQuestionId : true).map((node, index) => {
                const marker = node.querySelector('em[id-param]');
                const pageLetter = marker ? marker.getAttribute('id-param') : '';
                return { modelIndex: index, pageLetter: pageLetter, questionId: node.getAttribute('id-param') || pageQuestionId,
                    optionId: pageLetter || node.getAttribute('val-param') || String(index), value: node.getAttribute('val-param') || '',
                    text: _phoneOptionText(node), node: node,
                    answerName: questionId || ('answer' + pageQuestionId),
                    judgment: type === '判断题', multi: type === '多选题' };
            });
        };
        const _phoneQuestionList = _phoneQuestions.map((element, index) => {
            const inputs = Array.from(element.getElementsByTagName('input'));
            const answerInput = inputs.find(input => String(input.getAttribute('name') || '').includes('answer'));
            const questionId = answerInput ? answerInput.getAttribute('name').replace('type', '') : '';
            const pageQuestionId = questionId.replace('answer', '').replace('check', '');
            const typeInput = inputs.find(input => input.id === 'answertype' + pageQuestionId);
            const type = typeInput ? _phoneTypeNames[String(typeInput.value)] : '';
            const question = _phoneQuestionText(element);
            const options = _phoneCollectOptions(element, type, pageQuestionId, questionId);
            const invalidOptions = options.length < 2 || options.length > 8 || options.some(option => option.questionId !== pageQuestionId || (!option.text && !option.value)) ||
                new Set(options.map(option => option.optionId)).size !== options.length ||
                (type === '判断题' && (options.length !== 2 || !options.some(option => option.value === 'true') || !options.some(option => option.value === 'false')));
            const model = aiCreateQuestionModel({
                id: pageQuestionId || questionId,
                workId: _phoneWorkId,
                source: 'phone-chapter',
                index: index,
                root: element,
                stem: question,
                typeCode: _phoneTypeCodes[type],
                options: options,
                controls: [],
                fingerprint: () => {
                    const liveInputs = Array.from(element.getElementsByTagName('input'));
                    const liveAnswerInput = liveInputs.find(input => String(input.getAttribute('name') || '').includes('answer'));
                    const liveTypeInput = liveInputs.find(input => input.id === 'answertype' + pageQuestionId);
                    const liveType = liveTypeInput ? _phoneTypeNames[String(liveTypeInput.value)] : '';
                    return JSON.stringify([_l.href, liveAnswerInput ? liveAnswerInput.getAttribute('name') : '', _phoneQuestionText(element), _phoneTypeCodes[liveType],
                        _phoneCollectOptions(element, liveType, pageQuestionId, questionId).map(option => [option.questionId, option.optionId, option.pageLetter, option.value, option.text])]);
                }
            });
            const modelValidation = aiValidateQuestionModel(model);
            const error = !questionId ? '题目 ID 未找到' : !type ? '题型不支持或未识别' :
                !question ? '题干为空' : invalidOptions || !modelValidation.valid ?
                    (modelValidation.reason || '页面选项结构不完整或标识重复') : '';
            return Object.assign(model, {
                index: index, element: element, question: question, questionid: questionId, pageQuestionId: pageQuestionId,
                type: type, typeCode: _phoneTypeCodes[type], error: error
            });
        });
        const _phoneResults = new Array(_phoneTotal);
        const _phoneVerify = question => {
            if (!question.element.isConnected || !_d.documentElement.contains(question.element) || _phoneQuestionText(question.element) !== question.question) return false;
            const inputs = Array.from(question.element.getElementsByTagName('input'));
            const answerInput = inputs.find(input => String(input.getAttribute('name') || '').includes('answer'));
            const typeInput = inputs.find(input => input.id === 'answertype' + question.pageQuestionId);
            if (!answerInput || answerInput.getAttribute('name').replace('type', '') !== question.questionid ||
                !typeInput || _phoneTypeNames[String(typeInput.value)] !== question.type) return false;
            const liveOptions = _phoneCollectOptions(question.element, question.type, question.pageQuestionId, question.questionid);
            return liveOptions.length === question.options.length && question.options.every((option, index) => {
                const live = liveOptions[index];
                return live && live.node === option.node && live.questionId === question.id && live.optionId === option.optionId &&
                    live.pageLetter === option.pageLetter && live.value === option.value && live.text === option.text;
            });
        };
        const _phoneAnswerInput = option => {
            const byId = _d.getElementById(option.answerName);
            if (byId && typeof byId.value === 'string') return byId;
            const named = _d.getElementsByName(option.answerName);
            const first = named && named.length ? named[0] : null;
            return first && typeof first.value === 'string' ? first : null;
        };
        const _phoneAnswerValue = option => {
            const input = _phoneAnswerInput(option);
            return input ? String(input.value || '') : '';
        };
        const _phoneIsSelected = option => {
            const control = option.node.querySelector('input[type="radio"],input[type="checkbox"]');
            if (control && control.checked) return true;
            const value = _phoneAnswerValue(option);
            if (value) {
                if (option.judgment) {
                    if (value === option.value) return true;
                } else if (option.pageLetter && value.toUpperCase().indexOf(String(option.pageLetter).toUpperCase()) >= 0) {
                    return true;
                }
            }
            return option.node.classList.contains('cur');
        };
        // 手机版章节测验不会响应合成的 li.click()，必须直接改写平台隐藏的作答字段并同步选项样式，
        // 平台的 noSubmit 才会把答案读走保存。
        const _phoneSyncControls = option => {
            const wanted = _phoneIsSelected(option);
            Array.from(option.node.querySelectorAll('input[type="radio"],input[type="checkbox"]')).forEach(control => {
                const letter = String(control.value || '').toUpperCase();
                if (!letter) return;
                control.checked = option.judgment ? control.value === option.value : letter === String(option.pageLetter || '').toUpperCase();
                if (!wanted) control.checked = false;
            });
            Array.from(_d.getElementsByName(option.answerName) || []).forEach(control => {
                const letter = String(control.value || '').toUpperCase();
                if (!letter || !control.type || !/radio|checkbox/i.test(control.type)) return;
                control.checked = option.judgment ? control.value === option.value && wanted
                    : letter === String(option.pageLetter || '').toUpperCase() && wanted;
            });
        };
        const _phoneApplySelection = (option, on) => {
            const input = _phoneAnswerInput(option);
            if (!input) return false;
            if (option.judgment) {
                if (on) input.value = option.value;
                else if (String(input.value) === option.value) input.value = '';
            } else if (option.multi) {
                const letter = String(option.pageLetter || '').toUpperCase();
                if (!letter) return false;
                const letters = _phoneAnswerValue(option).toUpperCase().replace(/[^A-H]/g, '').split('');
                const next = letters.filter(item => item !== letter);
                if (on) next.push(letter);
                next.sort();
                input.value = next.join('');
            } else {
                const letter = String(option.pageLetter || '');
                if (on) input.value = letter;
                else if (String(input.value).toUpperCase() === letter.toUpperCase()) input.value = '';
            }
            if (on) option.node.classList.add('cur');
            else option.node.classList.remove('cur');
            _phoneSyncControls(option);
            return true;
        };
        const _phoneProcessQuestion = async question => {
            if (question.error) {
                aiTrace('题目 #' + (question.index + 1) + '（手机章节页）页面解析失败：' + question.error + '（题干「' + aiStem(question.question, 16) +
                    '」，题号 ' + aiClip(question.pageQuestionId || '未找到', 18) + '），已跳过该题', 'warn', _w);
                return { success: false, reason: question.error };
            }
            if (!_phoneVerify(question)) {
                aiTrace('题目 #' + (question.index + 1) + '（手机章节页）页面已刷新或题干变化，取消本次作答（避免把答案填到错误题目上）', 'warn', _w);
                return { success: false, reason: '题目已切换，已取消处理' };
            }
            if (typeof aiAvailable !== 'function' || !aiAvailable()) {
                aiTrace('题目 #' + (question.index + 1) + '（手机章节页）未作答：' + (typeof aiDisabledHint === 'function' ? aiDisabledHint() : 'LLM 未启用或未配置'), 'warn', _w);
                return { success: false, reason: typeof aiDisabledHint === 'function' ? aiDisabledHint() : 'LLM 未启用或未配置' };
            }
            const signature = () => question.fingerprint();
            const cacheContext = aiAnswerCacheContext(question.workId, question.id, question.typeCode, question.question, question.options);
            const request = aiBeginQuestion(question.element, question.id, question.source, signature, question.workId, question.index + 1, cacheContext);
            if (!request) {
                aiTrace('题目 #' + (question.index + 1) + '（手机章节页）未作答：该题已有处理请求或章节已进入提交状态（重复请求已拦截）', 'warn', _w);
                return { success: false, reason: '该题已有处理请求（另一流程正在处理）' };
            }
            aiTrace('题目 #' + (question.index + 1) + '（手机章节页）开始作答：' + (question.type || '未识别题型') + ' ' +
                question.options.length + ' 选项「' + aiStem(question.question, 16) + '」，题号 ' + aiClip(question.pageQuestionId, 18), 'info', _w);
            try {
            const type = question.typeCode;
            const modelOptions = question.options.map(option => option.text || (option.value === 'true' ? '正确' : option.value === 'false' ? '错误' : ''));
            const cachedAnswers = aiGetCrossPageAnswer(_w, cacheContext);
            const answers = cachedAnswers || await aiModelAnswer({ question: question.question, options: modelOptions, type: type,
                requestMeta: { requestId: request.id, questionId: request.key, source: request.source } });
            if (cachedAnswers) {
                aiTrace('题目 #' + (question.index + 1) + '（手机章节页）复用另一页面已核验答案，跳过重复 AI 请求', 'info', _w);
            }
            if (!request.isCurrent()) {
                request.finish(false, 'stale-question');
                return { success: false, reason: '题目已切换，已丢弃过期答案' };
            }
            let answerLetters = answers;
            if (type === 3) {
                const judgment = answers.length ? answers[0] : '';
                const target = answers.length === 1 && ['正确', '错误'].includes(judgment) ?
                    question.options.findIndex(option => option.value === (judgment === '正确' ? 'true' : 'false')) : -1;
                answerLetters = target < 0 ? [] : [String.fromCharCode(65 + target)];
            }
            console.info('[AI mapping]', { requestId: request.id, questionId: request.key, source: request.source,
                options: question.options.map(option => ({ modelLetter: String.fromCharCode(65 + option.modelIndex), pageLetter: option.pageLetter, optionId: option.optionId, text: option.text })),
                parsed: answers, target: answerLetters });
            let selection = await aiSelectOptions(question.options, answerLetters, type, _phoneIsSelected, option => {
                const desired = !_phoneIsSelected(option);
                if (aiToggleOption(option.node, () => _phoneIsSelected(option))) return;
                _phoneApplySelection(option, desired);
            }, request.isCurrent, () => new Promise(resolve => setTimeout(resolve, 150)));
            if (!selection.success) {
                // 合成点击无效时直接写入平台隐藏作答字段，再由下面的整体校验确认结果。
                // 题目已切换或答案无法映射时不能改写页面，必须如实失败。
                const clickable = ['click-failed', 'selection-mismatch', 'click-error'].includes(selection.reason);
                const wanted = clickable ? (aiMapOptionAnswers(answerLetters, question.options) || []) : [];
                if (wanted.length) {
                    question.options.forEach((option, index) => _phoneApplySelection(option, wanted.includes(index)));
                    selection = { success: true, indexes: wanted, options: wanted.map(index => question.options[index]) };
                }
            }
            if (!selection.success) {
                const reasons = { 'invalid-answer': '模型没有返回可映射的选项答案', 'stale-question': '题目已切换，已丢弃过期答案', 'click-failed': '页面未选中目标选项', 'selection-mismatch': '实际勾选项与目标答案不一致', 'click-error': '选项点击失败' };
                const reason = reasons[selection.reason] || '选项验证失败';
                const hint = selection.reason === 'invalid-answer' ? aiFailureHint(request.id) : '';
                const message = hint ? reason + '；' + hint : reason;
                request.finish(false, message);
                return { success: false, reason: message };
            }
            const verify = () => _phoneVerify(question) && question.options.every((option, index) => _phoneIsSelected(option) === selection.indexes.includes(index));
            console.info('[AI selection]', { requestId: request.id, questionId: request.key, source: request.source,
                actual: question.options.filter(_phoneIsSelected).map(option => option.optionId) });
            if (!verify()) {
                request.finish(false, 'selection-mismatch');
                return { success: false, reason: '最终选中状态与答案不一致' };
            }
            if (!request.finish(true, 'selection-verified')) return { success: false, reason: '题目已切换，已丢弃过期答案' };
            aiRememberCrossPageAnswer(_w, cacheContext, answers);
            return { success: true, verify: verify, indexes: selection.indexes };
            } catch (error) {
                request.finish(false, 'processing-error');
                throw error;
            }
        };
        // 收尾时把失败题目连同题号与原因列出来，否则用户只看到「存在未处理题目」无从下手。
        const _phoneFailSummary = () => {
            const failed = [];
            // 不能对 _phoneResults 用 forEach：它是按题号预分配的稀疏数组，
            // forEach 会跳过还没写入的洞，于是「根本没开始处理」的题会从清单里消失。
            for (let index = 0; index < _phoneTotal; index++) {
                const result = _phoneResults[index];
                if (result && result.success) continue;
                const question = _phoneQuestionList[index] || {};
                failed.push('#' + (index + 1) + (question.type ? '（' + question.type + '，题号 ' + (question.pageQuestionId || '未知') + '）' : '') +
                    '：' + (result && result.reason ? aiClip(result.reason, 28) : (result ? '未作答' : '未开始处理')));
            }
            // 日志整体还有长度上限，题目多时只列前几题并标注剩余数量。
            return failed.length > 5 ? failed.slice(0, 5).concat('…其余 ' + (failed.length - 5) + ' 题同类失败') : failed;
        };
        const _phoneFinish = () => {
            const succeeded = _phoneResults.filter(result => result && result.success).length;
            const coverage = _phoneTotal ? Math.floor(succeeded / _phoneTotal * 100) : 0;
            const allVerified = aiAllQuestionsVerified(_phoneTotal, _phoneResults);
            const autoSubmit = String(_w.top.unrivalAutoSubmit) === '1';
            // 提交与保存同时开启时只走提交：保存弹窗会让页面重载，整章答案需要重做。
            const autoSaveOnly = String(_w.top.unrivalAutoSave) === '1' && !autoSubmit;
            if (_phoneTotal === 0) {
                _w.top.unrivalWorkInfo = '未发现题目，已阻止自动提交';
                _phonePanelTip('未发现题目，已阻止自动提交', 'hidden');
                return;
            }
            if (autoSubmit && allVerified && aiCanSubmitQuestions(_phoneTotal, _phoneResults, accuracy)) {
                _w.top.unrivalWorkInfo = '作答覆盖率 ' + coverage + '%，选项已核验，准备提交';
                _phonePanelTip('作答覆盖率 ' + coverage + '%，选项已核验，准备提交', 'hidden');
                setTimeout(async function () {
                    if (!aiAllQuestionsVerified(_phoneTotal, _phoneResults) || !aiCanSubmitQuestions(_phoneTotal, _phoneResults, accuracy)) {
                        _w.top.unrivalWorkInfo = '提交前页面状态发生变化，已取消自动提交';
                        _phonePanelTip('提交前页面状态发生变化，已取消自动提交，请手动检查', 'hidden');
                        return;
                    }
                    // 桌面章节页可能还有在途的 AI 请求，等它们收尾再提交，避免交出半份卷子。
                    if (_phoneWorkId) {
                        const pending = await aiWaitChapterPendingRequests(_w, _phoneWorkId, AI_CHAPTER_PENDING_WAIT_MS,
                            (count, left) => _phonePanelTip('等待其他页面在途题目请求收尾（剩余 ' + count + ' 题，最长再等 ' +
                                Math.ceil(left / 1000) + ' 秒）', 'active'));
                        if (pending.timedOut) {
                            _w.top.unrivalWorkInfo = '仍有 ' + pending.pending + ' 道题在途未结束，已取消本次自动提交，请稍后重试';
                            _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                            return;
                        }
                        if (pending.waited > 0) {
                            aiTrace('手机提交：在途题目请求已收尾（等待 ' + (pending.waited / 1000).toFixed(1) + 's），继续提交', 'info', _w);
                        }
                    }
                    try {
                        const claim = aiClaimChapterSubmit(_w, _phoneWorkId, '手机章节页');
                        if (!claim.claimed) {
                            _w.top.unrivalWorkInfo = claim.reason === 'already-submitted' ? '同一章节已由其他页面发起提交，已阻止重复提交' : '无法确认章节提交状态，已阻止自动提交';
                            _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                            return;
                        }
                        aiTrace('手机提交：调用 submitCheckTimes', 'info', _w);
                        if (typeof _w.submitCheckTimes === 'function') {
                            _w.submitCheckTimes();
                        } else {
                            aiTrace('手机提交：平台未提供 submitCheckTimes，跳过该步骤', 'warn', _w);
                        }
                        if (aiChapterAlreadyReviewed(_w, _phoneWorkId)) return;
                        aiTrace('手机提交：调用 escapeBlank', 'info', _w);
                        if (typeof _w.escapeBlank === 'function') {
                            _w.escapeBlank();
                        } else {
                            aiTrace('手机提交：平台未提供 escapeBlank，跳过该步骤', 'warn', _w);
                        }
                        if (aiChapterAlreadyReviewed(_w, _phoneWorkId)) return;
                        aiTrace('手机提交：调用 submitAction', 'info', _w);
                        if (typeof _w.submitAction === 'function') {
                            _w.submitAction();
                        } else {
                            throw new Error('平台未提供 submitAction，无法发起章节提交');
                        }
                        if (aiChapterAlreadyReviewed(_w, _phoneWorkId)) return;
                        aiTrace('手机提交：submitAction 已返回，等待平台结果页', 'info', _w);
                        _w.top.unrivalWorkInfo = '作答覆盖率 ' + coverage + '%，已发起提交，请确认平台结果';
                        _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                    } catch (error) {
                        console.error('[chapter submit]', { workId: _phoneWorkId, error: error });
                        _w.top.unrivalWorkInfo = '自动提交流程发生异常，请手动检查平台状态';
                        _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                    }
                }, saveDelayMs(parseInt(Math.random() * 2000 + 3000, 10)));
            } else if (autoSaveOnly) {
                const transient = _phoneResults.filter(result => result && !result.success && aiIsTransientFailure(result.reason)).length;
                _w.top.unrivalWorkInfo = '作答覆盖率 ' + coverage + '%，' + (allVerified ? '自动提交未开启' : '存在未处理或未核验题目') + '，正在保存答案' +
                    (transient ? '（' + transient + ' 题因模型接口暂时不可用未能作答）' : '');
                _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                setTimeout(function () {
                    try {
                        aiTrace('手机保存：调用 noSubmit', 'info', _w);
                        _phoneSaveAck = false;
                        if (typeof _w.noSubmit !== 'function') {
                            _w.top.unrivalWorkInfo = '平台保存函数未就绪，请手动保存答案';
                            _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                            return;
                        }
                        _w.noSubmit();
                        aiTrace('手机保存：noSubmit 已返回，等待平台提示', 'info', _w);
                        // 平台保存失败时不会弹「保存成功」，这里回查并重试一次，避免静默失败。
                        setTimeout(function () {
                            if (_phoneSaveAck) return;
                            aiTrace('手机保存：未收到保存成功提示，重新写入答案后重试', 'warn', _w);
                            _phoneQuestionList.forEach(question => {
                                const result = _phoneResults[question.index];
                                if (!result || !result.success || typeof result.verify !== 'function' || !result.verify()) return;
                                const wanted = result.indexes || [];
                                question.options.forEach((option, index) => _phoneApplySelection(option, wanted.includes(index)));
                            });
                            try {
                                _w.noSubmit();
                                _w.top.unrivalWorkInfo = '上次保存未得到平台确认，已重新提交保存，请检查章节状态';
                            } catch (error) {
                                console.error('[chapter save retry]', { workId: _phoneWorkId, error: error });
                                _w.top.unrivalWorkInfo = '答案保存未得到平台确认，请手动检查保存状态';
                            }
                            _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                        }, 6000);
                    } catch (error) {
                        console.error('[chapter save]', { workId: _phoneWorkId, error: error });
                        _w.top.unrivalWorkInfo = '答案保存流程发生异常，请手动检查保存状态';
                        _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
                    }
                }, saveDelayMs(2000));
            } else {
                const failed = _phoneFailSummary();
                const failedText = failed.length ? aiClip('未完成 ' + failed.length + ' 题：' + failed.join('；'), 160) : '';
                _w.top.unrivalWorkInfo = '作答覆盖率 ' + coverage + '%（' + succeeded + '/' + _phoneTotal + '），' +
                    (failedText || '存在未处理题目或自动提交未开启') + '，请手动检查';
                _phonePanelTip(_w.top.unrivalWorkInfo, 'hidden');
            }
        };
        let _phoneBusy = _phoneTotal;
        let _phoneDelay = -4000;
        if (_phoneTotal === 0) _phoneFinish();
        _phoneQuestionList.forEach(question => {
            _phoneDelay += parseInt(Math.random() * 2000 + 2500, 10);
            setTimeout(async function () {
                try {
                    _phoneResults[question.index] = await _phoneProcessQuestion(question);
                    if (!_phoneResults[question.index].success) _w.top.unrivalWorkInfo = question.question + '：' + _phoneResults[question.index].reason;
                } catch (error) {
                    console.error('[AI question]', { questionId: question.pageQuestionId, source: 'phone-chapter-work', error: error });
                    _phoneResults[question.index] = { success: false, reason: '答题请求异常' };
                    _w.top.unrivalWorkInfo = question.question + '：答题请求异常';
                } finally {
                    const result = _phoneResults[question.index];
                    aiTrace('章节题目 #' + (question.index + 1) + '（' + (question.type || '未识别题型') + '，题号 ' +
                        aiClip(question.pageQuestionId, 18) + '，手机章节页）' + (result && result.success ? '页面核验通过（选项已确认选中）' :
                            '失败：' + (result && result.reason ? aiClip(result.reason, 60) : '未知原因')),
                        result && result.success ? 'info' : 'warn', _w);
                    _phoneBusy -= 1;
                    if (_phoneBusy === 0) _phoneFinish();
                }
            }, _phoneDelay);
        });
        return;
    } else if (_l.href.includes('work/phone/selectWorkQuestionYiPiYue') || _l.href.includes('/work/selectWorkQuestionYiPiYue')) {
        _w.top.unrivalWorkDone = true;
        _w.top.unrivalDoneWorkId = getQueryVariable('workId');
        aiMarkChapterSubmitResult(_w, _w.top.unrivalDoneWorkId);
        aiTrace('平台章节结果页已打开', 'info', _w);
        aiPanelMessage('tip', { type: 'hidden', tip: '章节页面已进入提交后页面，请确认平台判定结果' }, _w);
    } else if (_l.href.includes('stat2-ans.chaoxing.com/task/s/index')) {
        if (_w.top == _w) {
            return;
        }
        _d.getElementsByClassName('page-container studentStatistic')[0].setAttribute('class', 'studentStatistic');
        _d.getElementsByClassName('page-item item-task-list minHeight390')[0].remove();
        _d.getElementsByClassName('subNav clearfix')[0].remove();
        setInterval(function () {
            _l.reload();
        }, 90000);
    } else if (_l.href.includes('passport2.') && _l.href.includes('login?refer=http') && autoLogin == 1) {
        if (!(/^1[3456789]\d{9}$/.test(phoneNumber))) {
            alert('自动登录的手机号填写错误，无法登陆')
            return;
        }
        if (password == '') {
            alert('未填写登录密码，无法登陆')
            return;
        }
        GM_xmlhttpRequest({
            method: "get",
            url: 'https://passport2-api.chaoxing.com/v11/loginregister?cx_xxt_passport=json&uname=' +
                phoneNumber + '&code=' + encodeURIComponent(password),
            onload: function (res) {
                try {
                    let ispass = JSON.parse(res.responseText);
                    if (ispass['status']) {
                        _l.href = decodeURIComponent(getQueryVariable('refer'));
                    } else {
                        alert(ispass['mes']);
                    }
                } catch (err) {
                    console.log(res.responseText);
                    alert('登陆失败');
                }
            },
            onerror: function (err) {
                alert('登陆错误');
            }
        });
    }
})();
