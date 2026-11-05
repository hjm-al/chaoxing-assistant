const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sidebarScreenshot = path.join(require('node:os').tmpdir(), '任务引擎侧栏验证.png');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const source = fs.readFileSync(path.join(__dirname, '超星学习通助手.user.js'), 'utf8').replace(/\r\n/g, '\n');
function extract(from, to) {
    const start = source.indexOf(from);
    const end = source.indexOf(to, start);
    assert.ok(start >= 0 && end > start, 'production extraction boundaries: ' + from);
    return source.slice(start, end);
}
// 日志格式化辅助函数（aiTypeName…aiQuestionFailText）定义在 aiNormalize 之前，
// 但 aiBeginQuestion / aiRequest 都依赖它们，切片必须从它们开始。
const helpers = extract('function aiTypeName(type)', 'function aiGetByPath(obj, path)');
const transient = extract('function aiIsTransientFailure(reason)', 'function aiRetryDelay(attempt)');
// aiObserveChapterAlert 会调用 xxtRiskControlMark 判定风控回包，但该函数定义在脚本末尾，
// 落在 aiPanelMessage 的切片之外，必须显式带上，否则章节提交弹窗的判定会抛 ReferenceError。
const riskControl = extract('function xxtRiskControlMark(', 'function xxtRiskControlUrl(');
const panelMessage = extract('function aiPanelMessage(', 'var GLOBAL =') + riskControl;
// 逐题与保存的随机浮动辅助函数：章节收尾与手机题页都会调用，切片执行时必须一并注入。
const pacing = extract('// 固定节奏本身也是特征', '// 「跳过已作答」不调用 AI');
const uiModule = extract('var XXT_UI = (function () {', '// ==================== UI 模块结束');
const aiSettings = extract('function aiSettingHost()', '// ==================== 第三方 AI 模块结束');
const aiBackup = extract('function aiBackupKeys()', 'function aiCfgSnapshot(cfg)');
const panelTabs = extract("        // LLM 表单在顶部任务配置里默认收起", "        var courseContentFrame = _d.getElementById('courseContent');");
const videoProgress = extract('function xxtFormatPlaybackTime', '(() => {');
const phone = extract('        _w.aalert = _w.alert;', '        return;\n    } else if').replace(/\r/g, '');
const trim = extract('trim = (s) => {', '        cVersion =').replace(/,\s*$/, ';');

function question(type = 0, texts = ['城市民谣', '抒情摇滚'], id = 'q1') {
    const judgment = type === 3;
    return `<section class="Py-mian1"><h3 class="Py-m1-title fs16">1.[测试题]目标题干</h3>
      <input name="answer${id}" value=""><input id="answertype${id}" value="${type}">
      <ul class="answerList">${texts.map((text, index) => `<li id-param="${id}"${judgment ? ` val-param="${index === 0 ? 'true' : 'false'}"` : ''}>
      ${judgment ? '' : `<em id-param="${String.fromCharCode(65 + index)}">${String.fromCharCode(65 + index)}.</em>`}<span>${text}</span></li>`).join('')}</ul></section>`;
}

async function runPanelMessageBridge(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent('<div id="log"></div><iframe name="quiz"></iframe><div id="modelId_xx" data-xxt-owner="current"><iframe id="iframeNode"></iframe></div><div id="unrelated">other</div>');
        await page.evaluate(() => {
            window.received = [];
            document.getElementById('iframeNode').contentWindow.vueDefinedProp = (type, message) => received.push({ type, message });
        });
        const quiz = page.frame({ name: 'quiz' });
        await quiz.addScriptTag({ content: panelMessage });
        assert.equal(await quiz.evaluate(() => aiPanelMessage('tip', { tip: 'nested' }, window)), true);
        assert.deepEqual(await page.evaluate(() => received), [{ type: 'tip', message: { tip: 'nested' } }]);
        await quiz.evaluate(() => {
            aiTrace('模型请求开始', 'info', window);
            aiTrace('<b>平台错误</b> key=secret', 'error', window);
        });
        const drain = extract('            drainAiTrace = () => {', '            htmlHook = setInterval(function () {');
        await page.addScriptTag({ content: `var _d=document, _w=window, logs={addLog:(html,color)=>{(window.rendered ||= []).push({html,color});}}, ${drain} noop=0;` });
        await page.evaluate(() => drainAiTrace());
        assert.deepEqual(await page.evaluate(() => ({
            messages: __xxtDebugEvents.map(entry => entry.message),
            pending: __xxtDebugQueue.length,
            rendered: window.rendered
        })), { messages: ['模型请求开始', '<b>平台错误</b> key=[hidden]'], pending: 0,
            rendered: [{ html: '调试 · 模型请求开始', color: '#315f86' },
                { html: '调试 · &lt;b&gt;平台错误&lt;/b&gt; key=[hidden]', color: 'red' }] });
        await quiz.evaluate(() => { for (let index = 0; index < 205; index++) aiTrace('event ' + index, 'info', window); });
        assert.deepEqual(await page.evaluate(() => ({ history: __xxtDebugEvents.length, pending: __xxtDebugQueue.length,
            oldest: __xxtDebugEvents[0].message, newest: __xxtDebugEvents.at(-1).message })),
            { history: 200, pending: 200, oldest: 'event 5', newest: 'event 204' });
        assert.equal(await quiz.evaluate(() => aiRemovePanel(window, 'old')), false);
        assert.equal(await page.evaluate(() => !!document.getElementById('modelId_xx')), true);
        assert.equal(await quiz.evaluate(() => aiRemovePanel(window, 'current')), true);
        assert.deepEqual(await page.evaluate(() => ({ panel: !!document.getElementById('modelId_xx'), unrelated: !!document.getElementById('unrelated') })),
            { panel: false, unrelated: true });
        console.log('PASS panel: nested quiz frame reaches and closes course sidebar');
    } finally { await page.close(); }
}

async function runVideoProgressRelay(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent('<video id="courseVideo"></video>');
        await page.addScriptTag({ content: videoProgress });
        await page.evaluate(() => {
            const video = document.getElementById('courseVideo');
            let position = 828;
            Object.defineProperty(video, 'duration', { configurable: true, get: () => 1232 });
            Object.defineProperty(video, 'currentTime', { configurable: true, get: () => position, set: value => { position = value; } });
            window.videoProgressEvents = [];
            window.addEventListener('message', event => {
                if (event.data && event.data.type === 'xxt-video-progress') {
                    window.videoProgressEvents.push(event.data);
                }
            });
            xxtObserveNativeVideoProgress(window);
        });
        await page.waitForFunction(() => window.videoProgressEvents.length === 1);
        assert.deepEqual(await page.evaluate(() => window.videoProgressEvents[0]), {
            type: 'xxt-video-progress', currentTime: 828, duration: 1232, percent: 67.2
        });
        assert.deepEqual(await page.evaluate(() => ({ time: xxtFormatPlaybackTime(828), duration: xxtFormatPlaybackTime(1232), percent: xxtFormatPlaybackPercent(67.2) })),
            { time: '13:48', duration: '20:32', percent: '67.2' });

        await page.evaluate(() => {
            const video = document.getElementById('courseVideo');
            video.currentTime = 840;
            video.dispatchEvent(new Event('timeupdate'));
        });
        await page.waitForTimeout(30);
        assert.equal(await page.evaluate(() => window.videoProgressEvents.length), 1, 'same 5% bucket does not duplicate progress messages');

        await page.evaluate(() => {
            const video = document.getElementById('courseVideo');
            video.currentTime = 925;
            video.dispatchEvent(new Event('timeupdate'));
        });
        await page.waitForFunction(() => window.videoProgressEvents.length === 2);
        assert.deepEqual(await page.evaluate(() => window.videoProgressEvents[1]), {
            type: 'xxt-video-progress', currentTime: 925, duration: 1232, percent: 75.1
        });
        console.log('PASS video progress: native playback time relays at 5% intervals');
    } finally { await page.close(); }
}

async function runWorkerPanelLifecycle(browser) {
    const page = await browser.newPage();
    try {
        await page.clock.install();
        await page.setContent('<main></main>');
        await page.addScriptTag({ content: panelMessage + extract('    async function WorkerJSPlus(options)', '    var WorkerJS = function(') });
        const state = await page.evaluate(async () => {
            window.GLOBAL = { isMatch: false, delay: 1 };
            window.PANEL_NONCE = 'fixture-owner';
            window.modelId = 'modelId_xx';
            window._self = window;
            window.jQuery = selector => document.querySelectorAll(selector);
            window.showPanel = () => {
                const modal = document.createElement('div');
                modal.id = modelId;
                modal.dataset.xxtOwner = PANEL_NONCE;
                modal.innerHTML = '<iframe id="iframeNode"></iframe>';
                document.body.appendChild(modal);
            };
            window.WorkerJS = function () { this.fillAnswer = () => {}; };
            await WorkerJSPlus({ match: true, name: 'fixture', root: '.question' });
            return true;
        });
        assert.equal(state, true);
        await page.clock.runFor(20);
        assert.equal(await page.locator('#modelId_xx').count(), 0, 'empty matched page must not open a sidebar');
        await page.evaluate(async () => {
            GLOBAL.isMatch = false;
            document.querySelector('main').innerHTML = '<div class="question"></div>';
            await WorkerJSPlus({ match: true, name: 'fixture', root: '.question' });
        });
        await page.clock.runFor(20);
        assert.equal(await page.locator('#modelId_xx').count(), 1, 'question page opens its sidebar');
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
        assert.equal(await page.locator('#modelId_xx').count(), 0, 'leaving the question page closes its sidebar');
        console.log('PASS panel: empty pages stay closed and page exit removes owned sidebar');
    } finally { await page.close(); }
}

async function runChapterSubmitOwnership(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent('<iframe name="phone"></iframe><iframe name="desktop"></iframe>');
        await page.evaluate(() => { window.unrivalActiveWorkId = 'work1'; });
        const phoneFrame = page.frame({ name: 'phone' });
        const desktopFrame = page.frame({ name: 'desktop' });
        await phoneFrame.addScriptTag({ content: panelMessage });
        await desktopFrame.addScriptTag({ content: panelMessage });
        const first = await phoneFrame.evaluate(() => aiClaimChapterSubmit(window, 'work1', '手机章节页'));
        const second = await desktopFrame.evaluate(() => aiClaimChapterSubmit(window, 'different-page-id', '桌面章节页'));
        assert.equal(first.claimed, true);
        assert.deepEqual(second, { claimed: false, reason: 'already-submitted', source: '手机章节页' });
        assert.equal(await desktopFrame.evaluate(() => aiObserveChapterAlert(window, 'work1', '已批阅作业，不允许重复提交!')), true);
        assert.deepEqual(await page.evaluate(() => ({ done: unrivalWorkDone, state: __xxtChapterSubmit.state, id: unrivalDoneWorkId })),
            { done: true, state: 'reviewed', id: 'work1' });
        assert.equal(await phoneFrame.evaluate(() => aiClaimChapterSubmit(window, 'work1', '手机章节页').claimed), false);
        await page.evaluate(() => { window.unrivalActiveWorkId = 'work2'; });
        assert.equal(await desktopFrame.evaluate(() => aiClaimChapterSubmit(window, 'work2', '桌面章节页').claimed), true);
        console.log('PASS chapter submit: cross-frame owner blocks duplicates and reviewed state ends work');
    } finally { await page.close(); }
}

async function mountPhone(browser, html, config = {}) {
    const page = await browser.newPage();
    await page.clock.install();
    await page.setContent(html);
    await page.addScriptTag({ content: panelMessage + helpers + transient + pacing });
    await page.evaluate(({ config, trim, phone }) => {
        window._w = window;
        window._d = document;
        window._l = { href: 'https://fixture.test/work/phone/doHomeWork?workId=work1' };
        window.accuracy = 30;
        window.getQueryVariable = () => 'work1';
        window.handleImgs = html => html;
        window.aiAvailable = () => true;
        window.unrivalAutoSubmit = config.autoSubmit === false ? '0' : '1';
        window.unrivalAutoSave = config.autoSave ? '1' : '0';
        window.stats = { requests: [], submits: 0, saves: 0, clicks: 0, checks: 0, escapes: 0, alerts: [] };
        window.alert = message => stats.alerts.push(message);
        if (config.existingClaim) window.__xxtChapterSubmit = { workId: 'work1', source: '桌面章节页', state: 'submitting' };
        // 模拟桌面章节页还有一道题在等模型回复：提交前必须等它，等不到就放弃这次提交。
        if (config.existingRequests) window.__xxtChapterQuestionRequests =
            new Map([['work1', new Map([['id:other-page-question', { state: 'pending', startedAt: Date.now() }]])]]);
        window.iframeMessages = [];
        if (!config.noPanel) {
            const panel = document.createElement('iframe');
            panel.id = 'iframeNode';
            document.body.appendChild(panel);
            panel.contentWindow.vueDefinedProp = (eventType, message) => iframeMessages.push({ eventType, ...message });
        }
        window.submitAction = () => {
            if (config.throwSubmit) throw new Error('fixture submit error');
            stats.submits++;
        };
        window.submitCheckTimes = () => {
            stats.checks++;
            if (config.reviewedOnCheck) window.alert('已批阅作业，不允许重复提交!');
        };
        window.escapeBlank = () => stats.escapes++;
        window.noSubmit = () => { stats.saves++; if (config.ackSave) window.alert('保存成功'); };
        Math.random = () => 0;
        document.querySelectorAll('li').forEach(node => node.onclick = () => {
            stats.clicks++;
            if (config.noClick) return;
            if (config.type !== 1) node.parentElement.querySelectorAll('li').forEach(other => other.classList.remove('cur'));
            node.classList.toggle('cur');
        });
        window.aiModelAnswer = async data => {
            stats.requests.push(data);
            if (config.throwRequest) throw new Error('fixture request error');
            const text = config.pending ? await new Promise(resolve => window.resolveAnswer = resolve) : (config.answer ?? 'A');
            return aiParseAnswer(text, data);
        };
        (0, eval)('var ' + trim);
        (0, eval)('(function () {\n' + phone + '\nglobalThis.phoneTest = { questions: _phoneQuestionList, results: _phoneResults, process: _phoneProcessQuestion };\n})();');
    }, { config, trim, phone });
    return page;
}

async function phoneState(page) {
    return page.evaluate(() => ({
        ...stats, info: window.unrivalWorkInfo || '',
        workDone: !!window.unrivalWorkDone,
        submitState: window.__xxtChapterSubmit && window.__xxtChapterSubmit.state,
        panelMessages: iframeMessages,
        selected: Array.from(document.querySelectorAll('li')).map((node, index) => node.classList.contains('cur') ? index : -1).filter(index => index >= 0),
        success: (window.phoneTest ? phoneTest.results : []).map(result => Boolean(result && result.success))
    }));
}

async function runPhoneCases(browser) {
    const cases = [
        { name: 'ordered options and HTML labels', html: question(0, ['<b>城市民谣</b>', '抒情摇滚']), config: { answer: 'A' }, selected: [0], success: true },
        { name: 'explicit index distinguishes duplicate text', html: question(0, ['相同', '相同']), config: { answer: 'B' }, selected: [1], success: true },
        { name: 'multi-choice verifies all selected options', html: question(1, ['甲', '乙', '丙']), config: { answer: 'AC', type: 1 }, selected: [0, 2], success: true },
        { name: 'false judgment selects false', html: question(3, ['正确', '错误']), config: { answer: '错误', type: 3 }, selected: [1], success: true },
        { name: 'empty judgment never defaults to false', html: question(3, ['正确', '错误']), config: { answer: '', type: 3 }, selected: [], success: false },
        { name: 'ordinary prose is rejected', html: question(), config: { answer: 'The answer is B' }, selected: [], success: false },
        { name: 'synthetic click no-op still writes the platform answer field', html: question(), config: { answer: 'A', noClick: true }, selected: [0], success: true },
        { name: 'zero questions prevents submit', html: '<main></main>', config: {}, selected: [], success: false },
        { name: 'unsupported question prevents submit', html: question(4), config: {}, selected: [], success: false },
        { name: 'duplicate page IDs prevents submit', html: question().replace('id-param="B"', 'id-param="A"'), config: {}, selected: [], success: false },
        { name: 'request rejection prevents submit', html: question(), config: { throwRequest: true }, selected: [], success: false },
        { name: 'missing panel does not interrupt answering', html: question(), config: { noPanel: true }, selected: [0], success: true },
        { name: 'submit priority skips save when both modes are on', html: question(), config: { answer: 'The answer is B', autoSave: true }, selected: [], success: false, saves: 0 },
        { name: 'save still runs when only auto save is on', html: question(), config: { answer: 'The answer is B', autoSubmit: false, autoSave: true, ackSave: true }, selected: [], success: false, saves: 1 },
        { name: 'failed question remains in coverage denominator', html: question() + question(4, ['甲', '乙'], 'q2'), config: {}, selected: [0], success: false }
    ];
    for (const fixture of cases) {
        const page = await mountPhone(browser, fixture.html, fixture.config);
        try {
            await page.clock.runFor(14000);
            const state = await phoneState(page);
            assert.deepEqual(state.selected, fixture.selected, fixture.name);
            assert.equal(state.submits, fixture.success ? 1 : 0, fixture.name);
            if (fixture.saves !== undefined) assert.equal(state.saves, fixture.saves, fixture.name);
            if (!fixture.config.noPanel) assert.ok(state.panelMessages.some(message => message.eventType === 'tip' && message.type === 'active' && /正在处理章节测试题目/.test(message.tip)), fixture.name + ' starts a fresh panel state');
            if (fixture.success) {
                assert.deepEqual(state.success, [true], fixture.name);
                assert.equal(state.checks, 1);
                assert.equal(state.escapes, 1);
                assert.ok(state.requests[0].options.every(option => option !== 'length'));
                if (!fixture.config.noPanel) assert.match(state.panelMessages.filter(message => message.eventType === 'tip').at(-1).tip, /已发起提交，请确认平台结果/, fixture.name);
            } else if (fixture.name === 'zero questions prevents submit') {
                assert.match(state.panelMessages.filter(message => message.eventType === 'tip').at(-1).tip, /未发现题目/);
            }
            console.log('PASS phone: ' + fixture.name);
        } finally { await page.close(); }
    }
    const duplicatePage = await mountPhone(browser, question(), { existingClaim: true });
    try {
        await duplicatePage.clock.runFor(14000);
        const state = await phoneState(duplicatePage);
        assert.equal(state.submits, 0);
        assert.equal(state.checks, 0);
        assert.match(state.info, /已阻止重复提交/);
        console.log('PASS phone: desktop submission lock prevents duplicate submit');
    } finally { await duplicatePage.close(); }

    const reviewedPage = await mountPhone(browser, question(), { reviewedOnCheck: true });
    try {
        await reviewedPage.clock.runFor(14000);
        const state = await phoneState(reviewedPage);
        assert.deepEqual(state.alerts, ['已批阅作业，不允许重复提交!']);
        assert.equal(state.checks, 1);
        assert.equal(state.escapes, 0, JSON.stringify(state));
        assert.equal(state.submits, 0);
        assert.equal(state.workDone, true);
        assert.equal(state.submitState, 'reviewed');
        console.log('PASS phone: reviewed alert stops remaining submission calls');
    } finally { await reviewedPage.close(); }
    for (const mutation of ['title', 'option', 'question-id', 'selection']) {
        const pending = mutation !== 'selection';
        const page = await mountPhone(browser, question(), { pending });
        try {
            await page.clock.runFor(1000);
            await page.evaluate(mutation => {
                if (mutation === 'title') document.querySelector('h3').textContent = 'new question';
                if (mutation === 'option') document.querySelector('li span').textContent = 'new option';
                if (mutation === 'question-id') document.querySelector('input[name]').name = 'answerq2';
                if (mutation === 'selection') document.querySelector('li').classList.remove('cur');
                else resolveAnswer('A');
            }, mutation);
            await page.clock.runFor(10000);
            const state = await phoneState(page);
            assert.equal(state.submits, 0, mutation);
            assert.deepEqual(state.selected, [], mutation);
            if (pending) assert.deepEqual(state.success, [false], mutation);
            else {
                assert.match(state.info, /已取消自动提交/);
                assert.match(state.panelMessages.filter(message => message.eventType === 'tip').at(-1).tip, /已取消自动提交/);
            }
            console.log('PASS phone: stale ' + mutation + ' prevents submit');
        } finally { await page.close(); }
    }
    const page = await mountPhone(browser, question(), { pending: true });
    try {
        await page.clock.runFor(1000);
        assert.equal(await page.evaluate(async () => (await phoneTest.process(phoneTest.questions[0])).success), false);
        await page.evaluate(() => resolveAnswer('A'));
        await page.clock.runFor(10000);
        const state = await phoneState(page);
        assert.equal(state.requests.length, 1);
        assert.equal(state.clicks, 1);
        assert.equal(state.submits, 1);
        console.log('PASS phone: duplicate processing owns one request and one click');
    } finally { await page.close(); }

    const savePage = await mountPhone(browser, question(), { autoSubmit: false, autoSave: true });
    try {
        await savePage.clock.runFor(5000);
        const state = await phoneState(savePage);
        assert.equal(state.saves, 1);
        assert.match(state.panelMessages.filter(message => message.eventType === 'tip').at(-1).tip, /正在保存答案/);
        console.log('PASS phone: save state replaces stale in-progress panel tip');
    } finally { await savePage.close(); }

    const submitErrorPage = await mountPhone(browser, question(), { throwSubmit: true });
    try {
        await submitErrorPage.clock.runFor(14000);
        const state = await phoneState(submitErrorPage);
        assert.equal(state.submits, 0);
        assert.match(state.panelMessages.filter(message => message.eventType === 'tip').at(-1).tip, /提交流程发生异常/);
        console.log('PASS phone: submit startup error is surfaced in the panel');
    } finally { await submitErrorPage.close(); }

    // 桌面章节页可能还在跑 AI 请求：共享注册表里只要还有 pending，就不能提交一份半成品。
    const blockedPage = await mountPhone(browser, question(), { existingRequests: true });
    try {
        await blockedPage.clock.runFor(70000);
        const state = await phoneState(blockedPage);
        assert.equal(state.submits, 0, 'a chapter with in-flight requests must not be submitted');
        assert.match(state.info, /仍有 1 道题在途未结束/);
        console.log('PASS phone: in-flight chapter requests block the submit instead of racing it');
    } finally { await blockedPage.close(); }
}

async function runMissionRendering(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent('<main></main>');
        await page.addScriptTag({ content: helpers });
        const engine = extract('missionList = Object.create(null),', '        if (jobList.length <= 0)');
        const result = await page.evaluate(engine => {
            return new Function('var ' + engine + `
                var mission = setMission({ jobid: '1', type: 'document', name: 'test' });
                var sameMission = setMission({ jobid: '1', type: 'document', name: 'test' }) === mission;
                var states = [];
                states.push(mission.status);
                mission.status = 'running';
                states.push(mission.running, mission.done);
                mission.status = 'failed';
                states.push(mission.done);
                mission.status = 'done';
                states.push(mission.status);
                mission.running = true;
                states.push(mission.status);
                return { states: states, sameMission: sameMission,
                    keys: Object.keys(missionList).length, name: getMission('1').name };
            `)();
        }, engine);
        assert.deepEqual(result, {
            states: ['pending', true, false, true, 'failed', 'failed'], sameMission: true, keys: 1, name: 'test'
        });
        console.log('PASS render: mission state machine keeps one node per job and terminal states stick');
    } finally { await page.close(); }
}

async function runGenericAnswers(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent('<main></main>');
        await page.addScriptTag({ content: await resource('https://lib.baomitu.com/jquery/3.6.0/jquery.min.js') });
        await page.addScriptTag({ content: helpers + extract('    function isTrue(str)', '    function HTMLDecode(text)') });
        const results = await page.evaluate(async () => {
            window.GLOBAL = { fillAnswerDelay: 0 };
            window.sleep = () => Promise.resolve();
            const results = [];
            for (const fixture of [
                { name: 'single', type: 0, answers: ['B'], options: ['甲', '乙'], selected: [1] },
                { name: 'multi', type: 1, answers: ['A', 'C'], options: ['甲', '乙', '丙'], selected: [0, 2] },
                { name: 'judgment', type: 3, answers: ['错误'], options: ['正确', '错误'], selected: [1] },
                { name: 'empty judgment', type: 3, answers: [], options: ['正确', '错误'], selected: [] },
                { name: 'ambiguous judgment', type: 3, answers: ['正确'], options: ['正确', '正确'], selected: [] },
                // 平台拦截了 click 时仍要通过直接写入控件状态完成作答
                { name: 'blocked click', type: 0, answers: ['A'], options: ['甲', '乙'], selected: [0], noClick: true },
                // 完全不可交互的选项必须报错，不能被兜底逻辑掩盖
                { name: 'unselectable option', type: 0, answers: ['A'], options: ['甲', '乙'], selected: [], plain: true }
            ]) {
                const selector = fixture.plain ? 'span.opt' : 'input';
                document.querySelector('main').innerHTML = fixture.plain
                    ? fixture.options.map(() => '<span class="opt"></span>').join('')
                    : fixture.options.map(() => `<input type="${fixture.type === 1 ? 'checkbox' : 'radio'}" name="q">`).join('');
                if (fixture.noClick) document.querySelectorAll('input').forEach(input => input.onclick = event => event.preventDefault());
                const data = { type: fixture.type, options: fixture.options, question: 'test', $options: $(selector) };
                const result = await defaultQuestionResolve([fixture.answers], data, () => {}, () => false, () => true);
                results.push({ name: fixture.name, style: result.style, selected: Array.from(document.querySelectorAll(selector)).map((input, index) => input.checked ? index : -1).filter(index => index >= 0) });
            }
            for (const mode of ['filled', 'no-op', 'partial', 'stale', 'editor']) {
                document.querySelector('main').innerHTML = '<textarea name="editor1"></textarea><textarea name="editor2"></textarea>';
                const data = { type: 2, question: 'blank', $options: $('textarea') };
                let current = true;
                window.UE$1 = mode === 'editor' ? { instants: { editor1: { key: 'editor1', getContent: () => '<p>甲</p>' }, editor2: { key: 'editor2', getContent: () => '<p>乙</p>' } } } : undefined;
                const result = await defaultQuestionResolve([mode === 'partial' ? ['甲'] : ['甲', '乙']], data, (type, answer, $option) => {
                    if (mode === 'filled' || mode === 'stale') $option.val(answer);
                    if (mode === 'stale') current = false;
                }, () => false, () => current);
                results.push({ name: 'blank ' + mode, style: result.style });
            }
            return results;
        });
        const successful = new Set(['single', 'multi', 'judgment', 'blocked click', 'blank filled', 'blank editor']);
        for (const result of results) {
            assert.equal(['primary-row', 'success-row'].includes(result.style), successful.has(result.name), result.name);
            const selected = { single: [1], multi: [0, 2], judgment: [1], 'blocked click': [0] };
            if (result.selected) assert.deepEqual(result.selected, selected[result.name] || [], result.name);
            console.log('PASS generic: ' + result.name);
        }
    } finally { await page.close(); }
}

async function runDesktopChapter(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent(`<section class="TiMu"><div class="Zy_TItle"><div class="clearfix">目标题干</div></div>
            <input name="answertype1" value="0"><ul>
            <li aria-checked="false"><span class="num_option">A</span><span class="after">甲</span></li>
            <li aria-checked="false"><span class="num_option">B</span><span class="after">乙</span></li>
            </ul></section>`);
        await page.addScriptTag({ content: await resource('https://lib.baomitu.com/jquery/3.6.0/jquery.min.js') });
        await page.addScriptTag({ content: panelMessage + helpers + extract('    function isTrue(str)', '    function HTMLDecode(text)') +
            extract('    function isDomQuestionAnswered(', '    function createContainer(') +
            extract('    function desktopChapterOptions(', '    function desktopChapterVerified(') +
            extract('    function desktopChapterVerified(', '    AI_STATUS_HOOKS.push(') + pacing });
        const result = await page.evaluate(async () => {
            window.GLOBAL = { fillAnswerDelay: 0 };
            window.sleep = () => Promise.resolve();
            const item = $('.TiMu');
            const data = { type: 0, question: '目标题干', options: ['甲', '乙'], $item: item,
                $options: item.find('ul:eq(0) li .num_option') };
            item.find('li').each((index, element) => element.onclick = () => {
                item.find('li').attr('aria-checked', 'false');
                element.setAttribute('aria-checked', 'true');
            });
            desktopChapterOptions(data);
            const row = await defaultQuestionResolve([['B']], data, () => {}, desktopChapterSelected, () => true);
            const chosen = item.find('li[aria-checked="true"]').index();
            const answeredBefore = isDomQuestionAnswered(item);
            const before = desktopChapterVerified([{ success: true, request: { isLive: () => true }, verify: row.verify }], 1);
            item.find('li').attr('aria-checked', 'false');
            const answeredAfter = isDomQuestionAnswered(item);
            const after = desktopChapterVerified([{ success: true, request: { isLive: () => true }, verify: row.verify }], 1);
            return { optionTags: data.$options.map((index, element) => element.tagName).get(), style: row.style,
                chosen, before, after, answeredBefore, answeredAfter };
        });
        assert.deepEqual(result, { optionTags: ['LI', 'LI'], style: 'primary-row', chosen: 1, before: true, after: false,
            answeredBefore: true, answeredAfter: false });
        console.log('PASS desktop chapter: outer choice state and final recheck');

        const finish = await page.evaluate(async () => {
            window._self = window;
            window.iframeMsg = () => {};
            window.GM_getValue = () => '1';
            window.unrivalAutoSubmit = '1';
            window.unrivalAutoSave = '1';
            window.unrivalActiveWorkId = 'work1';
            const calls = [];
            window.alert = message => calls.push('alert:' + message);
            window.btnBlueSubmit = () => { window.alert('无效的参数：code -1!'); calls.push('submit'); };
            window.submitCheckTimes = () => calls.push('check');
            window.noSubmit = () => calls.push('save');
            const success = [{ success: true, request: { isLive: () => true }, verify: () => true }];
            const rejected = await finishDesktopChapterWork(true, [], 1);
            const afterRejected = calls.slice();
            calls.length = 0;
            const accepted = await finishDesktopChapterWork(true, success, 1);
            const submissions = calls.slice();
            const alertTrace = window.__xxtDebugEvents.some(entry => entry.message.includes('平台提交弹窗：无效的参数：code -1!'));
            calls.length = 0;
            // 平台拒绝提交后锁必须回退成可重试：否则这一章会被一次 code-1 永久锁死，
            // 用户只能刷新页面重来。
            const retried = await finishDesktopChapterWork(true, success, 1);
            const afterRetry = calls.slice();
            const retryState = window.__xxtChapterSubmit.state;
            calls.length = 0;
            // 反之，仍在有效期内、未被拒绝的 submitting 锁必须继续挡住重复提交。
            window.__xxtChapterSubmit = { workId: 'work1', source: '手机章节页', state: 'submitting', time: Date.now() };
            const locked = await finishDesktopChapterWork(true, success, 1);
            const afterLocked = calls.slice();
            const lockedInfo = window.unrivalWorkInfo;
            calls.length = 0;
            delete window.__xxtChapterSubmit;
            const staleResult = [{ success: true, request: { isLive: () => true }, verify: () => true }];
            window.sleep = () => { staleResult[0].verify = () => false; return Promise.resolve(); };
            const stale = await finishDesktopChapterWork(true, staleResult, 1);
            const afterStale = calls.slice();
            calls.length = 0;
            delete window.btnBlueSubmit;
            const fallback = await finishDesktopChapterWork(true, success, 1);
            const afterFallback = calls.slice();
            calls.length = 0;
            window.unrivalActiveWorkId = 'work2';
            window.alert = message => calls.push('alert:' + message);
            window.btnBlueSubmit = () => { window.alert('已批阅作业，不允许重复提交!'); calls.push('submit'); };
            const reviewed = await finishDesktopChapterWork(true, success, 1);
            const afterReviewed = calls.slice();
            calls.length = 0;
            window.unrivalActiveWorkId = 'work3';
            window.unrivalAutoSubmit = '0';
            window.unrivalAutoSave = '1';
            const saveOnly = await finishDesktopChapterWork(true, [], 1);
            const afterSaveOnly = calls.slice();
            return { rejected, accepted, retried, locked, stale, fallback, reviewed, saveOnly, afterRejected, submissions, alertTrace,
                afterRetry, retryState, afterLocked, lockedInfo, afterStale, afterFallback, afterReviewed, afterSaveOnly,
                workDone: window.unrivalWorkDone, submitState: window.__xxtChapterSubmit.state };
        });
        assert.deepEqual(finish, { rejected: 'handled', accepted: 'handled', retried: 'handled', locked: 'handled', stale: 'handled',
            fallback: 'handled', reviewed: 'handled', saveOnly: 'handled',
            // 平台回「无效的参数：code-1！」之后不能再补一次 submitCheckTimes：清单是空的，
            // 补的那一刀只会换来第二个同样失败的 POST。
            afterRejected: [], submissions: ['alert:无效的参数：code -1!', 'submit'], alertTrace: true,
            // 被拒的锁回退成 failed，同一章节可以重试（而不是被永久锁到刷新页面）。
            afterRetry: ['alert:无效的参数：code -1!', 'submit'], retryState: 'failed',
            // 仍在有效期内的 submitting 锁继续挡住重复提交。
            afterLocked: [], lockedInfo: '同一章节已由其他页面发起提交，已阻止重复提交',
            afterStale: [], afterFallback: [],
            afterReviewed: ['alert:已批阅作业，不允许重复提交!', 'submit'], afterSaveOnly: ['save'],
            workDone: true, submitState: 'reviewed' });
        console.log('PASS desktop chapter: only verified answers reach platform submit');
    } finally { await page.close(); }
}

// 「已有页面答案，按设置跳过」的题必须记成已处理：它没走 AI，但页面确实有答案。
// 早期实现只在成功填答分支记账，跳过题会让收尾把整章判成未完成，覆盖率 100% 却报「未作答」。
async function runDesktopChapterSkipAccounting(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent(`<section class="TiMu"><div class="Zy_TItle"><div class="clearfix">目标题干</div></div>
            <input name="answertype1" value="0"><ul>
            <li aria-checked="true"><span class="num_option">A</span><span class="after">甲</span></li>
            <li aria-checked="false"><span class="num_option">B</span><span class="after">乙</span></li>
            </ul></section>`);
        await page.addScriptTag({ content: await resource('https://lib.baomitu.com/jquery/3.6.0/jquery.min.js') });
        await page.addScriptTag({ content: panelMessage + helpers + extract('    function isTrue(str)', '    function HTMLDecode(text)') +
            extract('    function isDomQuestionAnswered(', '    function createContainer(') +
            extract('    function desktopChapterOptions(', '    function desktopChapterVerified(') +
            extract('    function desktopChapterVerified(', '    AI_STATUS_HOOKS.push(') + pacing });
        const result = await page.evaluate(async () => {
            window._self = window;
            window.iframeMsg = () => {};
            const autoSubmit = '0';
            const autoSave = '0';
            window.GM_getValue = () => autoSave;
            window.unrivalAutoSubmit = autoSubmit;
            window.unrivalAutoSave = autoSave;
            window.unrivalActiveWorkId = 'skipwork1';
            const item = $('.TiMu');
            const reports = [];
            const originalTrace = window.aiTrace;
            window.aiTrace = (message, level) => { reports.push(message); };
            // 跳过记录没有请求令牌：题目本来就已经答好了，跳过发生在建请求之前。
            const skipped = { success: true, request: null, skipped: true, verify: () => isDomQuestionAnswered(item) };
            const allOne = desktopChapterVerified([skipped], 1);
            const finishSkipped = await finishDesktopChapterWork(true, [skipped], 1);
            const skipText = reports.slice();
            // 页面答案被清掉后，跳过记录必须跟着变成未通过，不能靠 skipped 标记蒙过校验。
            item.find('li').attr('aria-checked', 'false');
            const allAfterClear = desktopChapterVerified([skipped], 1);
            reports.length = 0;
            const finishAfterClear = await finishDesktopChapterWork(true, [skipped], 1);
            const clearedText = reports.slice();
            // 上一次提交被平台拒绝时，页面上那批「已有答案」很可能就是被拒的那一份，
            // 沿用它们凑出的 100% 不能当结论，必须让用户重新作答。
            item.find('li').attr('aria-checked', 'true');
            window.__xxtChapterSubmit = { workId: 'skipwork1', source: '桌面章节页', state: 'failed',
                time: Date.now(), message: '无效的参数：code-1！' };
            reports.length = 0;
            const allAfterReject = desktopChapterVerified([skipped], 1);
            const finishAfterReject = await finishDesktopChapterWork(true, [skipped], 1);
            const rejectedText = reports.slice();
            delete window.__xxtChapterSubmit;
            const allAfterRetry = desktopChapterVerified([skipped], 1);
            window.aiTrace = originalTrace;
            return { allOne, finishSkipped, allAfterClear, finishAfterClear, skipText, clearedText,
                allAfterReject, finishAfterReject, rejectedText, allAfterRetry };
        });
        assert.equal(result.allOne, true, 'a skipped-but-already-answered question must count as verified');
        assert.equal(result.finishSkipped, 'handled');
        assert.equal(result.allAfterClear, false, 'clearing the page answer must invalidate a skipped record');
        assert.equal(result.finishAfterClear, 'handled');
        assert.deepEqual(result.skipText.filter(line => line.includes('页面校验未通过或未作答')), [],
            'a skipped question must never be reported as unanswered');
        assert.ok(result.skipText.some(line => line.includes('沿用页面已有答案')),
            'the summary must say how many questions reused the existing page answer');
        assert.ok(result.clearedText.some(line => line.includes('页面已有答案已失效，需重新作答')),
            'a cleared page answer must be reported with its own wording');
        assert.equal(result.allAfterReject, false,
            'reused page answers must not verify the chapter while the last submit is still rejected');
        assert.equal(result.finishAfterReject, 'handled');
        assert.ok(result.rejectedText.some(line => line.includes('上次提交被平台拒绝')),
            'a rejected chapter must tell the user to answer again instead of re-submitting the same answers');
        assert.equal(result.allAfterRetry, true,
            'once the lock is released the reused page answers count again');
        console.log('PASS desktop chapter: skipped-but-answered questions are recorded and never reported as unanswered');
    } finally { await page.close(); }
}

// 真实章节测验页的选中事件绑在 li 内部的 [class*="before-after"] 容器上，点 li 不生效。
async function runDesktopChapterWrapper(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent(`<section class="TiMu"><div class="Zy_TItle"><div class="clearfix">目标题干</div></div>
            <input name="answertype1" value="1"><ul>
            <li><span class="num_option">A</span><div class="before-after" aria-checked="false"><span class="after">甲</span></div></li>
            <li><span class="num_option">B</span><div class="before-after" aria-checked="false"><span class="after">乙</span></div></li>
            </ul></section>`);
        await page.addScriptTag({ content: await resource('https://lib.baomitu.com/jquery/3.6.0/jquery.min.js') });
        await page.addScriptTag({ content: panelMessage + helpers + extract('    function isTrue(str)', '    function HTMLDecode(text)') +
            extract('    function isDomQuestionAnswered(', '    function createContainer(') +
            extract('    function desktopChapterOptions(', '    function desktopChapterVerified(') +
            extract('    function desktopChapterVerified(', '    AI_STATUS_HOOKS.push(') + pacing });
        const result = await page.evaluate(async () => {
            window.GLOBAL = { fillAnswerDelay: 0 };
            window.sleep = () => Promise.resolve();
            const item = $('.TiMu');
            const data = { type: 1, question: '目标题干', options: ['甲', '乙'], $item: item,
                $options: item.find('ul:eq(0) li .num_option') };
            let wrapperClicks = 0;
            item.find('li').each((index, row) => row.onclick = () => {});
            item.find('li .before-after').each((index, wrapper) => wrapper.onclick = () => {
                wrapperClicks++;
                wrapper.setAttribute('aria-checked', wrapper.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
            });
            desktopChapterOptions(data);
            const row = await defaultQuestionResolve([['A', 'B']], data, () => {}, desktopChapterSelected, () => true);
            return { optionTags: data.$options.map((index, element) => element.tagName).get(), style: row.style,
                checked: item.find('li .before-after').map((index, wrapper) => wrapper.getAttribute('aria-checked')).get(),
                wrapperClicks };
        });
        assert.deepEqual(result, { optionTags: ['LI', 'LI'], style: 'primary-row', checked: ['true', 'true'], wrapperClicks: 2 });
        console.log('PASS desktop chapter: inner container receives the selection click');
    } finally { await page.close(); }
}

async function resource(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, url);
    assert.match(response.headers.get('content-type') || '', /javascript|css/);
    return response.text();
}

async function runSidebarDrag(browser) {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
    try {
        await page.setContent('<main></main>');
        await page.addScriptTag({ content: extract('    function dragModel(', '    function defaultWorkTypeResolver(') +
            extract('    function addModal2(', '    function renderModal(') });
        await page.evaluate(() => {
            window.GM_setValue = (key, value) => { if (key === 'pos') window.savedPos = value; };
            window.GM_getValue = () => undefined;
            window.GM_getResourceURL = () => '';
            window.GLOBAL = { length: 260 };
            window.PANEL_NONCE = 'fixture';
            window.PANEL_WIDTH = 361;
            window.modelId = 'modelId_xx';
            window.actionClicks = 0;
            window.createContainer = (name, children) => {
                const element = document.createElement('div');
                for (const child of Array.isArray(children) ? children : children ? [children] : []) element.appendChild(child);
                return element;
            };
            window.renderModal = child => {
                const modal = document.createElement('div');
                modal.id = modelId;
                modal.style.cssText = 'position:fixed;left:30px;top:30px;width:321px;background:white';
                modal.appendChild(child);
                document.body.appendChild(modal);
                return modal;
            };
            addModal2('<button id="action" onclick="parent.actionClicks++">LLM 设置</button>');
        });
        await page.frameLocator('#iframeNode').locator('#action').waitFor();
        const before = await page.locator('#modelId_xx').boundingBox();
        await page.frameLocator('#iframeNode').locator('#action').click();
        assert.equal(await page.evaluate(() => actionClicks), 1);
        assert.deepEqual(await page.locator('#modelId_xx').boundingBox(), before, 'ordinary buttons do not move the panel');
        const handle = await page.locator('.xxt-drag-handle').boundingBox();
        await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
        await page.mouse.down();
        await page.mouse.move(handle.x + handle.width / 2 + 230, handle.y + handle.height / 2 + 140, { steps: 8 });
        await page.mouse.up();
        const after = await page.locator('#modelId_xx').boundingBox();
        assert.ok(after.x > before.x + 180 && after.y > before.y + 100, 'handle drags the complete panel');
        assert.equal(await page.evaluate(() => savedPos), `${after.x}px,${after.y}px`);
        console.log('PASS sidebar: grip drags panel and controls remain clickable');
    } finally { await page.close(); }
}

async function runSidebarTraceReplay(browser) {
    const page = await browser.newPage();
    try {
        await page.setContent('<iframe id="iframeNode"></iframe>');
        await page.evaluate(() => {
            window.PANEL_NONCE = 'current';
            window.PANEL_STARTED_AT = 100;
            window.__xxtDebugEvents = [{ time: 90, message: 'older' }, { time: 110, message: 'current' }];
            window.iframeMessages = [];
            window.iframeMsg = (type, message) => iframeMessages.push({ type, message });
        });
        await page.addScriptTag({ content: extract('    top.addEventListener("message", event => {', '    $(document).keydown(function(event) {') });
        await page.locator('#iframeNode').evaluate(frame => frame.contentWindow.parent.postMessage({ type: 'trace_ready', nonce: 'current' }, '*'));
        await page.waitForFunction(() => iframeMessages.length === 1);
        assert.deepEqual(await page.evaluate(() => iframeMessages), [{ type: 'trace', message: { time: 110, message: 'current' } }]);
        await page.locator('#iframeNode').evaluate(frame => frame.contentWindow.parent.postMessage({ type: 'trace_ready', nonce: 'other' }, '*'));
        await page.waitForTimeout(50);
        assert.equal(await page.evaluate(() => iframeMessages.length), 1);
        console.log('PASS sidebar: current panel replays only its own recent trace');
    } finally { await page.close(); }
}

async function runSidebar(browser) {
    // 资源地址直接取自用户脚本的 @resource 声明，避免测试和生产用的版本漂移。
    const declared = name => {
        const m = source.match(new RegExp(`@resource\\s+${name}\\s+(\\S+)`));
        assert.ok(m, `@resource ${name} must be declared in the userscript`);
        return m[1];
    };
    const resources = {};
    resources.Vue = await resource(declared('Vue'));
    resources.ElementUi = await resource(declared('ElementUi'));
    resources.ElementUiCss = await resource(declared('ElementUiCss'));
    let html;
    const ui = vm.runInNewContext(uiModule + '\nXXT_UI;', {});
    html = ui.panelHtml({
        elementCss: resources.ElementUiCss,
        vue: resources.Vue,
        elementUi: resources.ElementUi,
        nonce: 'fixture',
        aiStatusText: 'LLM status ' + 'LongUnbrokenStatus'.repeat(8),
        autoJump: false
    });
    const page = await browser.newPage();
    try {
        await page.setContent(html);
        await page.waitForFunction(() => typeof window.vueDefinedProp === 'function' && document.querySelector('.el-table__body'));
        await page.evaluate(() => {
            vueDefinedProp('push', { question: '长题干'.repeat(60), answer: '城市民谣'.repeat(60), style: 'primary-row' });
            vueDefinedProp('push', { question: 'LongUnbrokenQuestion'.repeat(15), answer: 'Click failed '.repeat(30), style: 'warning-row' });
            vueDefinedProp('trace', { time: Date.now(), level: 'info', message: 'AI 请求已发出' });
            vueDefinedProp('trace', { time: Date.now() + 1, level: 'error', message: '平台错误 <img src=x>' });
            vueDefinedProp('tip', { type: 'hidden', tip: '章节作答完成' });
        });
        assert.equal(await page.locator('.xxt-trace-row').count(), 2);
        assert.match(await page.locator('.xxt-trace').innerText(), /平台错误 <img src=x>/);
        assert.equal(await page.locator('.xxt-trace img').count(), 0, 'trace text is escaped');
        assert.equal(await page.locator('.el-alert .el-button, .xxt-section > .el-button').count(), 0, 'terminal state hides processing controls');
        await page.evaluate(() => vueDefinedProp('tip', { type: 'active', tip: '正在处理下一章节测试' }));
        assert.equal(await page.locator('.el-alert .el-button, .xxt-section > .el-button').count(), 2, 'next task restores active controls');
        await page.evaluate(() => {
            window.chatMessages = [];
            window.addEventListener('message', event => {
                if (event.data && event.data.type === 'chat_send') window.chatMessages.push(event.data);
            });
        });
        await page.getByRole('button', { name: 'AI 问答' }).click();
        await page.locator('.xxt-chat-log').waitFor();
        await page.locator('.xxt-chat-controls input').fill('这道题的关键概念是什么？');
        await page.getByRole('button', { name: '发送' }).click();
        await page.waitForFunction(() => window.chatMessages.length === 1);
        assert.deepEqual(await page.evaluate(() => window.chatMessages[0].messages), [{ role: 'user', content: '这道题的关键概念是什么？' }]);
        await page.evaluate(() => vueDefinedProp('chat_result', { ok: true, text: '先定位题干中的限定条件。' }));
        assert.match(await page.locator('.xxt-chat-log').innerText(), /先定位题干中的限定条件。/);
        await page.getByRole('button', { name: '清空' }).click();
        assert.match(await page.locator('.xxt-chat-log').innerText(), /输入问题后发送/);
        await page.getByRole('button', { name: '答题状态' }).click();
        assert.equal(await page.locator('.el-table').count(), 1, 'switching back keeps answer records mounted');
        // 样式必须真的来自声明的那份 theme-chalk，否则上面所有尺寸断言都在验错文件。
        assert.equal(await page.evaluate(() => {
            const style = document.querySelector('style');
            const probe = document.createElement('div');
            probe.className = 'el-button';
            document.body.appendChild(probe);
            const styled = getComputedStyle(probe).boxSizing === 'border-box'
                && getComputedStyle(probe).borderStyle === 'solid';
            probe.remove();
            return styled && style.textContent.length > 200000;
        }), true, 'the injected theme-chalk stylesheet must be in effect');
        for (const width of [260, 321, 360, 560]) {
            await page.setViewportSize({ width, height: 820 });
            await page.evaluate(() => {
                document.querySelector('.el-table').__vue__.doLayout();
                return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            });
            const sizes = await page.evaluate(() => {
                const measure = element => ({ client: element.clientWidth, scroll: element.scrollWidth });
                return { viewport: innerWidth, document: measure(document.documentElement), body: measure(document.body),
                    shell: measure(document.querySelector('.drag_auto_answer-class')), table: measure(document.querySelector('.el-table__body-wrapper')),
                    status: measure(document.querySelector('.xxt-status')),
                    statusBounds: (() => { const rect = document.querySelector('.xxt-status').getBoundingClientRect(); return { left: rect.left, right: rect.right }; })(),
                    buttonBounds: (() => { const rect = document.querySelector('.xxt-status').previousElementSibling.getBoundingClientRect(); return { left: rect.left, right: rect.right }; })(),
                    shellBounds: (() => { const rect = document.querySelector('.drag_auto_answer-class').getBoundingClientRect(); return { left: rect.left, right: rect.right }; })(),
                    cells: Array.from(document.querySelectorAll('.el-table__body .cell')).map(measure) };
            });
            for (const [name, size] of Object.entries(sizes)) {
                if (['document', 'body', 'shell', 'table', 'status'].includes(name)) assert.ok(size.scroll <= size.client + 1, width + ' ' + name + ': ' + JSON.stringify(size));
            }
            assert.ok(sizes.cells.every(size => size.scroll <= size.client + 1), width + ' text overflow');
            assert.ok(sizes.status.scroll <= sizes.status.client + 1, width + ' status text overflow: ' + JSON.stringify(sizes.status));
            assert.ok(sizes.statusBounds.left >= sizes.buttonBounds.right - 1, width + ' status overlaps pause button');
            assert.ok(sizes.statusBounds.right <= sizes.shellBounds.right + 1, width + ' status exceeds sidebar: ' + JSON.stringify({ status: sizes.statusBounds, shell: sizes.shellBounds }));
            console.log('PASS sidebar width ' + width + ': ' + JSON.stringify(sizes));
            if (width === 321) await page.screenshot({ path: sidebarScreenshot, fullPage: true });
        }
    } finally { await page.close(); }
}

async function runPreview(browser) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    try {
        await page.goto(pathToFileURL(path.join(__dirname, '超星学习通助手调试.html')).href);
        // 主面板在电脑端不再用标签页，也不再单独列一张任务列表，也没有独立的 LLM 卡片：
        // 运行日志 + 课程内容/章节测试（同一张卡片）+ 顶部任务配置里的 LLM 配置。
        assert.equal(await page.locator('[data-tab]').count(), 0, 'desktop panel must not depend on tabs');
        assert.equal(await page.locator('#joblist, [data-pane="job"]').count(), 0, 'the task list section must be gone');
        const panes = ['log', 'course'];
        for (const name of panes) {
            assert.ok(await page.locator('.xxt-section[data-pane="' + name + '"]').isVisible(), 'section visible: ' + name);
            assert.ok(await page.locator('.xxt-section[data-pane="' + name + '"]').evaluate(el => el.getBoundingClientRect().height > 20),
                'section has real height: ' + name);
        }
        // LLM 配置不再是独立卡片，必须落在顶部任务配置里，否则用户又得在两处之间找。
        assert.equal(await page.locator('.xxt-section[data-pane="llm"]').count(), 0, 'the standalone LLM card must be gone');
        assert.equal(await page.locator('#normalQuery #llmSettingsContainer').count(), 1, 'the LLM form lives inside 任务配置');
        assert.equal(await page.locator('#normalQuery #aiStatus').count(), 1, 'the LLM status line moved into 任务配置');
        // 章节测试与课程内容共用一张卡片，靠 data-mode 切换，不再各自占一块。
        assert.equal(await page.locator('.xxt-section[data-pane="work"]').count(), 0, 'work must not be its own section');
        const course = page.locator('#courseSection');
        assert.equal(await course.getAttribute('data-mode'), 'course', 'the course card starts in course mode');
        assert.equal(await course.locator('#courseContent').isVisible(), true, 'course iframe visible in course mode');
        assert.equal(await course.locator('#workView').isVisible(), false, 'work stage hidden in course mode');
        await page.evaluate(() => window.xxtDebugSetCourseMode('work'));
        assert.equal(await course.getAttribute('data-mode'), 'work', 'the card switches to work mode');
        assert.equal(await course.locator('#frame_content').isVisible(), true, 'test iframe visible in work mode');
        assert.equal(await course.locator('#courseContent').isVisible(), false, 'course iframe hidden in work mode');
        assert.equal((await page.locator('#courseSection > .panel-heading').innerText()).includes('章节测试'), true,
            'headline names both course content and chapter test');
        await page.evaluate(() => window.xxtDebugSetCourseMode('course'));
        // LLM 表单默认收起，展开后必须真能用（iframe 已预挂载，不再停在占位文案）。
        const llmPanel = page.locator('#llmPanel');
        assert.equal(await llmPanel.isHidden(), true, 'the LLM block starts collapsed so the course card stays in view');
        assert.equal(await page.locator('#llmSettingsContainer > p.xxt-llm-placeholder').count(), 0,
            'the placeholder must already be replaced before the block is opened');
        await page.locator('#llmToggleButton').click();
        assert.equal(await llmPanel.isVisible(), true, 'the toggle opens the LLM block inside 任务配置');
        const settings = page.frameLocator('#llmPanel iframe');
        await settings.locator('#mode').waitFor();
        assert.equal(await settings.locator('#url').count(), 1, 'inline LLM form');
        await page.locator('#llmToggleButton').click();
        assert.equal(await llmPanel.isHidden(), true, 'the toggle collapses it again');
        const logBox = await page.locator('.xxt-section[data-pane="log"] #log').boundingBox();
        assert.ok(logBox && logBox.height >= 200, 'log area must be tall enough to read on desktop: ' + JSON.stringify(logBox));
        console.log('PASS preview: log + shared course/test card + inline LLM block without tabs, task list or LLM card');
    } finally { await page.close(); }
}

async function runInlineLlmSettings(browser) {
    const page = await browser.newPage();
    try {
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.setContent('<iframe id="assistantFrame" title="course assistant"></iframe>');
        await page.locator('#assistantFrame').evaluate(frame => {
            frame.srcdoc = '<div class="xxt-section" data-pane="log" id="logPane">运行日志</div>' +
                '<div class="panel" id="normalQuery"><div class="panel-body">' +
                '<a id="llmToggleButton" role="button" aria-expanded="false">展开设置</a>' +
                '<div id="llmPanel" style="display:none"><div id="llmSettingsContainer"><p>正在加载</p></div></div>' +
                '</div></div>';
        });
        await page.waitForFunction(() => {
            const frame = document.getElementById('assistantFrame');
            return frame && frame.contentDocument && frame.contentDocument.getElementById('llmSettingsContainer');
        });
        const assistant = page.frames().find(frame => frame.parentFrame());
        await assistant.addScriptTag({ content: `
            var unsafeWindow = window;
            var AI_SETTING_FRAME = null;
            var AI_SETTING_NODE_ID = 'xxt-llm-setting-node';
            var AI_SETTING_CARD_ID = 'xxt-llm-setting-card';
            var AI_SETTING_CARD = null;
            var AI_SETTING_HANDLER = null;
            var storedValues = {};
            function aiCfgSnapshot(cfg) { cfg = cfg || {}; return { mode: cfg.mode || 'off', url: cfg.url || 'https://api.fixture.test/v1', key: cfg.key || '', model: cfg.model || 'fixture-model', timeout: cfg.timeout || 30000, temperature: cfg.temperature == null ? 0.2 : cfg.temperature, max_tokens: cfg.maxTokens || 1024, system_prompt: cfg.systemPrompt || '', user_prompt: cfg.userPrompt || '', headers_json: cfg.headersJson || '', body_json: cfg.bodyJson || '', response_path: cfg.responsePath || 'choices.0.message.content', skip_answered: 0 }; }
            function aiStatsText() { return 'fixture stats'; }
            function aiCfgFromData(data) { return { mode: data.mode, url: data.url, key: data.key, model: data.model, timeout: 30000, temperature: 0.2, maxTokens: 1024, systemPrompt: data.system_prompt, userPrompt: data.user_prompt, headersJson: data.headers_json, bodyJson: data.body_json, responsePath: data.response_path }; }
            function aiCfg() { return { mode: 'first', url: storedValues.ai_url || '', key: storedValues.ai_key || '', model: storedValues.ai_model || 'fixture-model' }; }
            function aiEndpoint(url) { return String(url || '').startsWith('https://'); }
            function aiModeLabel() { return 'fixture'; }
            function GM_setValue(key, value) { storedValues[key] = value; }
            function GM_getValue(key) { return storedValues[key]; }
            function aiNotifyStatus() {}
            function aiStatusText() { return 'fixture enabled'; }
            function aiListModels() {}
            function aiTestConnection() {}
            ${uiModule}
            ${aiBackup}
            ${aiSettings}
            var _d = document;
            var _w = window;
            ${panelTabs}
            window.storedValues = storedValues;
        ` });
        const panel = page.frameLocator('#assistantFrame');
        // 主面板不再有标签页，用户不会“点进” LLM 区块；页面一渲染就必须自己把表单挂上，
        // 否则容器里会一直停在占位的“正在加载 LLM 配置…”。
        await panel.locator('#llmSettingsContainer iframe').waitFor({ state: 'attached' });
        const configFrame = panel.frameLocator('#xxt-llm-setting-node');
        assert.equal(await panel.locator('#llmSettingsContainer > p').count(), 0, 'the loading placeholder must be replaced');
        assert.equal(await panel.locator('#llmPanel').isHidden(), true, 'the LLM block stays collapsed after the silent premount');
        // 重复触发不能再挂一份；显式打开设置（非 silent）必须顺手把面板展开，
        // 否则用户点了「LLM 设置」还是得自己多按一次。
        await assistant.evaluate(() => { openAiSettingWindow(); openAiSettingWindow(true); });
        assert.equal(await panel.locator('#llmPanel').isVisible(), true, 'asking for settings opens the collapsed block');
        assert.equal(await panel.locator('#llmSettingsContainer iframe').count(), 1, 'premounting is idempotent');
        assert.equal(await panel.locator('#llmToggleButton').innerText(), '收起设置', 'the toggle reflects the opened state');
        // 展开开关必须真的把表单露出来/收回去，并且状态写回按钮。
        await panel.locator('#llmToggleButton').click();
        assert.equal(await panel.locator('#llmPanel').isHidden(), true, 'the toggle collapses the block');
        assert.equal(await panel.locator('#llmToggleButton').innerText(), '展开设置');
        assert.equal(await panel.locator('#llmToggleButton').getAttribute('aria-expanded'), 'false');
        await configFrame.locator('#mode').waitFor({ state: 'attached' });
        await panel.locator('#llmToggleButton').click();
        assert.equal(await panel.locator('#llmPanel').isVisible(), true, 'the toggle reopens the block');
        assert.equal(await panel.locator('#llmToggleButton').innerText(), '收起设置');
        assert.equal(await panel.locator('#llmToggleButton').getAttribute('aria-expanded'), 'true');
        await configFrame.locator('#mode').waitFor();
        await assistant.evaluate(() => xxtSetLlmPanel(false));
        assert.equal(await panel.locator('#llmPanel').isHidden(), true, 'the panel can collapse again');
        await assistant.evaluate(() => xxtSetLlmPanel(true));
        assert.equal(await panel.locator('#llmPanel').isVisible(), true, 'xxtSetLlmPanel(true) reopens it for the rest of the flow');
        // 配置备份：导出必须真的把 GM 里的 ai_* 取出来，导入必须只写白名单键。
        await assistant.evaluate(() => {
            GM_setValue('ai_url', 'https://api.backup.test/v1');
            GM_setValue('ai_key', 'sk-backup-123');
            GM_setValue('ai_model', 'backup-model');
            GM_setValue('ai_system_prompt', '备份用提示词');
            GM_setValue('rwl_userData', { sentinel: true });
        });
        await configFrame.locator('#exportCfg').click();
        let exported = '';
        for (let attempt = 0; attempt < 50 && !exported; attempt++) {
            exported = await configFrame.locator('#cfgText').inputValue();
            if (!exported) await page.waitForTimeout(100);
        }
        assert.ok(exported, 'export must write the configuration JSON into the textarea');
        const dumped = JSON.parse(exported);
        assert.equal(dumped.xxtConfig, 'llm', 'export must self-identify so import can reject garbage');
        assert.equal(dumped.ai_url, 'https://api.backup.test/v1');
        assert.equal(dumped.ai_key, 'sk-backup-123');
        assert.equal(dumped.ai_model, 'backup-model');
        assert.equal(dumped.ai_system_prompt, '备份用提示词');
        assert.ok(!('rwl_userData' in dumped), 'export must not leak non-LLM storage');
        // 导入：白名单外的键必须被忽略，勾选类字段要还原，并且写进 GM。
        await assistant.evaluate(() => { GM_setValue('ai_url', ''); GM_setValue('ai_key', ''); GM_setValue('ai_skip_answered', 0); });
        await configFrame.locator('#cfgText').fill(JSON.stringify({
            xxtConfig: 'llm', ai_url: 'https://api.imported.test/v1', ai_key: 'sk-imported-456',
            ai_model: 'imported-model', ai_skip_answered: 1, evil_key: 'should-not-land'
        }));
        await configFrame.locator('#importCfg').click();
        let imported = null;
        for (let attempt = 0; attempt < 50 && !imported; attempt++) {
            imported = await assistant.evaluate(() => storedValues.ai_key === 'sk-imported-456' ? {
                url: storedValues.ai_url, key: storedValues.ai_key, model: storedValues.ai_model,
                skip: storedValues.ai_skip_answered, evil: storedValues.evil_key
            } : null);
            if (!imported) await page.waitForTimeout(100);
        }
        assert.deepEqual(imported, {
            url: 'https://api.imported.test/v1', key: 'sk-imported-456', model: 'imported-model', skip: 1, evil: undefined
        }, 'import must apply whitelisted keys and drop anything else');
        // 粘错内容时必须报错而不是静默清空配置。
        await configFrame.locator('#cfgText').fill('这不是 JSON');
        await configFrame.locator('#importCfg').click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('assistantFrame').contentDocument.getElementById('xxt-llm-setting-node');
            return frame && frame.contentDocument && frame.contentDocument.getElementById('status').className === 'err';
        });
        assert.equal(await assistant.evaluate(() => storedValues.ai_key), 'sk-imported-456',
            'a rejected import must not touch the stored configuration');
        assert.deepEqual(await assistant.evaluate(() => ({ parent: document.getElementById('xxt-llm-setting-node').parentElement.id,
            directChild: document.querySelector('body > #xxt-llm-setting-node') !== null })), { parent: 'llmSettingsContainer', directChild: false }, 'settings mount in the LLM pane, not a floating card');
        await configFrame.locator('#mode').selectOption('first');
        await configFrame.locator('#url').fill('https://api.fixture.test/v1');
        await configFrame.locator('#key').fill('fixture-key');
        await configFrame.locator('#save').click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('assistantFrame').contentDocument.getElementById('xxt-llm-setting-node');
            return frame && frame.contentDocument && frame.contentDocument.getElementById('status').textContent.indexOf('已保存') >= 0;
        });
        assert.equal(await panel.locator('#llmPanel').isVisible(), true, 'save keeps the settings panel in place');
        assert.equal(await configFrame.locator('#mode').inputValue(), 'first');
        assert.equal(await assistant.evaluate(() => storedValues.ai_key), 'fixture-key');
        // 真实故障回归：填好地址和 Key 但下拉框仍停在「关闭」时，保存必须直接按开启处理并告知用户。
        await configFrame.locator('#mode').selectOption('off');
        await configFrame.locator('#url').fill('https://api.autoenable.test/v1');
        await configFrame.locator('#key').fill('sk-auto-enable');
        await configFrame.locator('#save').click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('assistantFrame').contentDocument.getElementById('xxt-llm-setting-node');
            return frame && frame.contentDocument && frame.contentDocument.getElementById('status').textContent.indexOf('已保存并启用') >= 0;
        });
        assert.deepEqual(await assistant.evaluate(() => ({ mode: storedValues.ai_mode, enable: storedValues.ai_enable, first: storedValues.ai_first })),
            { mode: 'first', enable: true, first: true },
            'saving an endpoint + key while the dropdown still says off must turn AI on instead of silently staying disabled');
        assert.equal(await configFrame.locator('#mode').inputValue(), 'first', 'the form must reflect the auto-enabled state');
        // 反向约束：凭据没变、只是把下拉框改回关闭时，必须真的关掉，不能被自动开启覆盖。
        await configFrame.locator('#mode').selectOption('off');
        await configFrame.locator('#save').click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('assistantFrame').contentDocument.getElementById('xxt-llm-setting-node');
            const status = frame && frame.contentDocument && frame.contentDocument.getElementById('status').textContent;
            return !!status && status.indexOf('已保存：') === 0;
        });
        assert.deepEqual(await assistant.evaluate(() => ({ mode: storedValues.ai_mode, enable: storedValues.ai_enable })),
            { mode: 'off', enable: false },
            'turning AI off with unchanged credentials must stick, otherwise the switch is a lie');
        await configFrame.locator('#mode').selectOption('first');
        await configFrame.locator('#save').click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('assistantFrame').contentDocument.getElementById('xxt-llm-setting-node');
            const status = frame && frame.contentDocument && frame.contentDocument.getElementById('status').textContent;
            return !!status && status.indexOf('已保存：') === 0;
        });
        assert.equal(await assistant.evaluate(() => storedValues.ai_mode), 'first');
        await configFrame.locator('#close').click();
        await page.waitForTimeout(150);
        assert.equal(await panel.locator('#llmSettingsContainer iframe').count(), 1, 'settings stay mounted after closing');
        assert.equal(await panel.locator('#llmPanel').isVisible(), true, 'the settings panel never hides itself');
        assert.equal(await configFrame.locator('#key').inputValue(), 'sk-auto-enable', 'the last saved form state remains visible on return');
        assert.deepEqual(pageErrors, [], 'no browser errors in the settings flow');
        console.log('PASS inline LLM settings: section mounts form inline, save stays in place, state preserved without a floating card');
    } finally { await page.close(); }
}

async function runExamLlmSettingCard(browser) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    try {
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        // 考试/作业页：只有悬浮面板 iframe，没有任何 llmSettingsContainer。
        await page.setContent('<div id="examQuestion">题目区域</div>');
        const assistant = page.mainFrame();
        await assistant.addScriptTag({ content: `
            var unsafeWindow = window;
            var AI_SETTING_FRAME = null;
            var AI_SETTING_NODE_ID = 'xxt-llm-setting-node';
            var AI_SETTING_CARD_ID = 'xxt-llm-setting-card';
            var AI_SETTING_CARD = null;
            var AI_SETTING_HANDLER = null;
            var storedValues = {};
            function aiCfgSnapshot(cfg) { cfg = cfg || {}; return { mode: cfg.mode || 'off', url: cfg.url || 'https://api.fixture.test/v1', key: cfg.key || '', model: cfg.model || 'fixture-model', timeout: cfg.timeout || 30000, temperature: cfg.temperature == null ? 0.2 : cfg.temperature, max_tokens: cfg.maxTokens || 1024, system_prompt: cfg.systemPrompt || '', user_prompt: cfg.userPrompt || '', headers_json: cfg.headersJson || '', body_json: cfg.bodyJson || '', response_path: cfg.responsePath || 'choices.0.message.content', skip_answered: 0 }; }
            function aiStatsText() { return 'fixture stats'; }
            function aiCfgFromData(data) { return { mode: data.mode, url: data.url, key: data.key, model: data.model, timeout: 30000, temperature: 0.2, maxTokens: 1024, systemPrompt: data.system_prompt, userPrompt: data.user_prompt, headersJson: data.headers_json, bodyJson: data.body_json, responsePath: data.response_path }; }
            function aiEndpoint(url) { return String(url || '').startsWith('https://'); }
            function aiModeLabel() { return 'fixture'; }
            function GM_setValue(key, value) { storedValues[key] = value; }
            function GM_getValue(key) { return storedValues[key]; }
            function aiNotifyStatus() {}
            function aiStatusText() { return 'fixture enabled'; }
            function aiListModels() {}
            function aiTestConnection() {}
            ${uiModule}
            ${aiBackup}
            ${aiSettings}
            window.storedValues = storedValues;
        ` });
        const cardCount = () => page.locator('#xxt-llm-setting-card').count();
        assert.equal(await cardCount(), 0, 'no card before the user asks for settings');
        await page.evaluate(() => openAiSettingWindow());
        await page.waitForSelector('#xxt-llm-setting-card');
        assert.equal(await cardCount(), 1, 'a page without llmSettingsContainer must get a floating card instead of an alert');
        const configFrame = page.frameLocator('#xxt-llm-setting-card iframe');
        await configFrame.locator('#mode').waitFor();
        assert.equal(await configFrame.locator('#close').textContent(), '关闭卡片', 'the card relabels the return button');
        // 卡片必须可拖动，且拖走后不能被右侧定位拉回去。
        const handle = page.locator('#xxt-llm-setting-card > div').first();
        const before = await page.locator('#xxt-llm-setting-card').boundingBox();
        const box = await handle.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 - 220, box.y + box.height / 2 + 90, { steps: 8 });
        await page.mouse.up();
        const after = await page.locator('#xxt-llm-setting-card').boundingBox();
        assert.ok(after.x < before.x - 100 && after.y > before.y + 40, 'dragging the header must move the card: ' + JSON.stringify({ before, after }));
        // 表单功能与内嵌模式一致：保存会写进 GM。
        await configFrame.locator('#mode').selectOption('first');
        await configFrame.locator('#url').fill('https://api.exam-card.test/v1');
        await configFrame.locator('#key').fill('sk-exam-card');
        await configFrame.locator('#save').click();
        await page.waitForFunction(() => {
            const frame = document.getElementById('xxt-llm-setting-node');
            return frame && frame.contentDocument && frame.contentDocument.getElementById('status').textContent.indexOf('已保存') >= 0;
        });
        assert.equal(await page.evaluate(() => storedValues.ai_key), 'sk-exam-card', 'saving inside the card must persist the key');
        // 重复打开必须复用同一张卡片，不能叠加。
        await page.evaluate(() => openAiSettingWindow());
        assert.equal(await cardCount(), 1, 'reopening reuses the mounted card');
        assert.equal(await page.locator('#xxt-llm-setting-card iframe').count(), 1, 'reopening reuses the mounted iframe');
        // 卡片里的「关闭卡片」按钮和头部 × 都必须真正移除卡片并解绑监听。
        await configFrame.locator('#close').click();
        await page.waitForFunction(() => document.getElementById('xxt-llm-setting-card') === null);
        assert.equal(await cardCount(), 0, 'the return button closes the card');
        assert.equal(await page.evaluate(() => AI_SETTING_HANDLER), null, 'closing the card must unbind the message handler');
        assert.equal(await page.evaluate(() => AI_SETTING_FRAME), null, 'closing the card must drop the stale frame reference');
        await page.evaluate(() => openAiSettingWindow());
        await page.waitForSelector('#xxt-llm-setting-card');
        await page.locator('#xxt-llm-setting-card button[aria-label="关闭 LLM 设置"]').click();
        await page.waitForFunction(() => document.getElementById('xxt-llm-setting-card') === null);
        // 主面板页面仍然必须内嵌挂载，绝不弹卡片 —— 这条是防止卡片逻辑污染课程页。
        await page.evaluate(() => {
            const panel = document.createElement('div');
            panel.className = 'panel';
            panel.id = 'normalQuery';
            panel.innerHTML = '<div class="panel-body"><div id="llmSettingsContainer"></div></div>';
            document.body.appendChild(panel);
            openAiSettingWindow();
        });
        await page.waitForSelector('#llmSettingsContainer iframe');
        assert.equal(await cardCount(), 0, 'a page with llmSettingsContainer must stay inline, never a floating card');
        assert.deepEqual(pageErrors, [], 'no browser errors in the exam-card flow');
        console.log('PASS exam LLM card: floating draggable card, reuses iframe, closes cleanly, inline mode untouched');
    } finally { await page.close(); }
}

(async () => {
    const browser = await chromium.launch({ headless: true,
        executablePath: process.env.XXT_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try {
        await runPanelMessageBridge(browser);
        await runVideoProgressRelay(browser);
        await runWorkerPanelLifecycle(browser);
        await runChapterSubmitOwnership(browser);
        await runPhoneCases(browser);
        await runGenericAnswers(browser);
        await runDesktopChapter(browser);
        await runDesktopChapterSkipAccounting(browser);
await runDesktopChapterWrapper(browser);
        await runMissionRendering(browser);
        await runSidebarDrag(browser);
        await runSidebarTraceReplay(browser);
        await runSidebar(browser);
        await runPreview(browser);
        await runInlineLlmSettings(browser);
        await runExamLlmSettingCard(browser);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
