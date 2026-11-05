const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '超星学习通助手.user.js'), 'utf8');
// 日志格式化辅助函数自成一段（只依赖彼此），aiRequest 与 aiBeginQuestion 都会调用它们，
// 切片执行时必须一并注入，否则 vm 里会报 aiRequestProfile/aiQuestionLabel is not defined。
const formatHelpersStart = script.indexOf('function aiTypeName(type)');
const formatHelpersEnd = script.indexOf('function aiPromptValues(data)');
assert.notEqual(formatHelpersStart, -1, 'log formatting helpers must exist in the userscript');
assert.ok(formatHelpersEnd > formatHelpersStart, 'log formatting helpers must have a boundary');
const formatHelpers = script.slice(formatHelpersStart, formatHelpersEnd);
const start = script.indexOf('function aiNormalize(text)');
const end = script.indexOf('function aiGetByPath(obj, path)', start);
const videoProgressStart = script.indexOf('function xxtFormatPlaybackTime');
const videoProgressEnd = script.indexOf('(() => {', videoProgressStart);
const panelMessageStart = script.indexOf('    top.addEventListener("message", event => {');
const panelMessageEnd = script.indexOf('    $(document).keydown(function(event) {', panelMessageStart);
assert.notEqual(start, -1, 'answer helpers must exist in the userscript');
assert.notEqual(end, -1, 'answer helper extraction boundary must exist');
assert.notEqual(videoProgressStart, -1, 'video progress helpers must exist in the userscript');
assert.ok(videoProgressEnd > videoProgressStart, 'video progress helper extraction boundary must exist');
assert.notEqual(panelMessageStart, -1, 'exam panel message bridge must exist in the userscript');
assert.ok(panelMessageEnd > panelMessageStart, 'exam panel message bridge extraction boundary must exist');

const cacheStart = script.indexOf('var AI_CROSS_PAGE_ANSWER_TTL_MS');
const cacheEnd = script.indexOf('// 判断两条请求记录是否指向同一道题。', cacheStart);
assert.notEqual(cacheStart, -1, 'cross-page answer cache must exist in the userscript');
assert.ok(cacheEnd > cacheStart, 'cross-page answer cache must have a boundary');
const context = vm.createContext({ console, Promise, WeakMap, Map, Set, Date, aiTrace: () => {} });
vm.runInContext(`
function aiChapterSubmitHost(sourceWindow) { return sourceWindow; }
${script.slice(cacheStart, cacheEnd)}
globalThis.cacheApi = { context: aiAnswerCacheContext, get: aiGetCrossPageAnswer, remember: aiRememberCrossPageAnswer };
`, context);
vm.runInContext(formatHelpers + script.slice(start, end) + `
globalThis.api = {
    parse: function (text, data) { data.options = Array.from(data.options || []); return Array.from(aiParseAnswer(text, data)); },
    map: function (answers, options) { return Array.from(aiMapOptionAnswers(Array.from(answers), Array.from(options))); },
    select: function (options, answers, type, isSelected, click, isCurrent, wait) {
        return aiSelectOptions(Array.from(options), Array.from(answers), type, isSelected, click, isCurrent, wait);
    },
    toggle: aiToggleOption,
    begin: aiBeginQuestion,
    canSubmit: aiCanSubmitQuestions,
    allVerified: aiAllQuestionsVerified,
    createQuestion: aiCreateQuestionModel,
    validateQuestion: aiValidateQuestionModel,
    missionState: createMissionState
};`, context);

const api = context.api;
const parse = (text, data) => Array.from(api.parse(text, data));
const map = (answers, options) => Array.from(api.map(answers, options));
const toggle = (node, isSelected) => api.toggle(node, isSelected);

const cacheWindow = {};
const cacheContext = (workId, questionId, type, question, options) =>
    context.cacheApi.context(workId, questionId, type, question, options);

test('cross-page answer cache requires matching work, question, and option fingerprints', () => {
    const options = [
        { value: 'A', text: '1' }, { value: 'B', text: '5' }, { value: 'C', text: '2' }, { value: 'D', text: '3' }
    ];
    const original = cacheContext('work-a', 'q-1', 0, 'Z6 的可逆元是？', options);
    context.cacheApi.remember(cacheWindow, original, ['B']);
    assert.deepEqual(Array.from(context.cacheApi.get(cacheWindow, original)), ['B']);
    assert.equal(context.cacheApi.get(cacheWindow, cacheContext('work-b', 'q-1', 0, 'Z6 的可逆元是？', options)), null);
    assert.equal(context.cacheApi.get(cacheWindow, cacheContext('work-a', 'q-1', 0, 'Z8 的零因子有？', options)), null);
    assert.equal(context.cacheApi.get(cacheWindow, cacheContext('work-a', 'q-1', 0, 'Z6 的可逆元是？', [
        { value: 'A', text: '1' }, { value: 'B', text: '5' }, { value: 'C', text: '3' }, { value: 'D', text: '2' }
    ])), null);
});

test('cross-page answer cache shares text-only and platform-value option representations', () => {
    const desktop = cacheContext('work-a', 'q-2', 3, '题目', ['正确', '错误']);
    const phone = cacheContext('work-a', 'q-2', 3, '题目', [{ value: 'true', text: '正确' }, { value: 'false', text: '错误' }]);
    context.cacheApi.remember(cacheWindow, phone, ['A']);
    assert.deepEqual(Array.from(context.cacheApi.get(cacheWindow, desktop)), ['A']);
    assert.equal(context.cacheApi.get(cacheWindow, cacheContext('work-a', 'q-2', 0, '题目', ['正确', '错误'])), null);
    assert.equal(context.cacheApi.get(cacheWindow, cacheContext('work-a', 'q-2', 3, '题目', ['错误', '正确'])), null);
});

test('cross-page answer cache sweeps every expired entry instead of only the looked-up key', () => {
    // 缓存挂在顶层窗口上、跨章节共用。以前只在「查到的那一条过期」时删，
    // 长会话里每答一题就多一条永不回收的记录。
    const window = {};
    const options = [{ value: 'A', text: '1' }, { value: 'B', text: '2' }];
    const at = (id, question) => cacheContext('work-sweep', id, 0, question, options);
    context.cacheApi.remember(window, at('q1', '一'), ['A']);
    context.cacheApi.remember(window, at('q2', '二'), ['B']);
    context.cacheApi.remember(window, at('q3', '三'), ['A']);
    const cache = window.__xxtCrossPageAnswers;
    assert.equal(cache.size, 3);
    // 把前两条拨成 10 分钟 TTL 之外，第三条保持新鲜。Map 保持插入顺序，按位置取即可。
    const stale = Date.now() - (11 * 60 * 1000);
    const records = Array.from(cache.values());
    records[0].time = stale;
    records[1].time = stale;
    context.cacheApi.remember(window, at('q4', '四'), ['B']);
    assert.equal(cache.size, 2, 'both expired entries must be swept by a single write');
    assert.deepEqual(Array.from(context.cacheApi.get(window, at('q3', '三'))), ['A'], 'a live entry must stay usable');
    assert.deepEqual(Array.from(context.cacheApi.get(window, at('q4', '四'))), ['B']);
});

test('cross-page answer lookup throttles the sweep but writes always reclaim', () => {
    // aiWaitCrossPageAnswer 每 250ms 轮询一次 miss。如果每次 miss 都全表扫，
    // 一次 60 秒的等待要白扫两百多遍；写入路径必须强制扫，读取路径节流即可。
    const window = {};
    const options = [{ value: 'A', text: '1' }, { value: 'B', text: '2' }];
    const at = (id, question) => cacheContext('work-throttle', id, 0, question, options);
    context.cacheApi.remember(window, at('q1', '一'), ['A']);
    context.cacheApi.remember(window, at('q2', '二'), ['B']);
    const cache = window.__xxtCrossPageAnswers;
    assert.equal(cache.size, 2);
    // 写入刚做过强制清扫，此时把 q1 拨成过期：紧接着的 miss 只欠一次读取，
    // 不应立刻全表扫（否则 250ms 轮询会把它变成热点）。
    Array.from(cache.values())[0].time = Date.now() - (11 * 60 * 1000);
    assert.equal(context.cacheApi.get(window, at('ghost', '幽灵')), null, 'a miss still returns null');
    assert.equal(cache.size, 2, 'a lookup right after a write must not re-scan the whole cache');
    context.cacheApi.remember(window, at('q3', '三'), ['A']);
    assert.equal(cache.size, 2, 'a write must force the sweep and drop the expired entry');
    assert.deepEqual(Array.from(context.cacheApi.get(window, at('q2', '二'))), ['B']);
    assert.deepEqual(Array.from(context.cacheApi.get(window, at('q3', '三'))), ['A']);
});

test('question model normalizes stable option identity and validates judgment choices', () => {
    const question = api.createQuestion({
        id: 'q-1', source: 'phone-chapter', index: 0, stem: '判断题', typeCode: 3,
        options: [
            { pageLetter: 'B', optionId: 'false-id', value: 'false', text: '错误', node: {} },
            { pageLetter: 'A', optionId: 'true-id', value: 'true', text: '正确', node: {} }
        ]
    });
    assert.deepEqual(question.options.map(option => option.modelIndex), [0, 1]);
    assert.equal(typeof question.fingerprint, 'function');
    assert.doesNotThrow(() => question.fingerprint());
    const valid = api.validateQuestion(question);
    assert.equal(valid.valid, true);
    assert.equal(valid.reason, '');
    question.options[1].optionId = question.options[0].optionId;
    const invalid = api.validateQuestion(question);
    assert.equal(invalid.valid, false);
    assert.equal(invalid.reason, 'duplicate-option-id');
});

test('submission gate requires every result to pass its live verifier', () => {
    const result = success => ({ success, verify: () => success });
    assert.equal(api.allVerified(2, [result(true), result(true)]), true);
    assert.equal(api.allVerified(2, [result(true), result(false)]), false);
    assert.equal(api.canSubmit(2, [result(true), result(false)], 30), false);
});

test('submission gate must not read holes in the result array as verified', () => {
    const result = success => ({ success, verify: () => success });
    // WorkerJS 按下标写结果，没处理到的题就是数组里的洞。Array.prototype.every 会跳过洞，
    // 用它实现「全部通过」等于把漏答题当成已答，章节会缺题提交。
    const holes = [];
    holes[0] = result(true);
    holes[2] = result(true);
    assert.equal(holes.length, 3);
    assert.equal(api.allVerified(3, holes), false, 'an unprocessed hole must fail the gate');
    assert.equal(api.canSubmit(3, holes, 0), false, 'a hole must never satisfy the submit gate');
    holes[1] = result(true);
    assert.equal(api.allVerified(3, holes), true, 'a fully filled indexed array must pass');
});

test('native player progress reports formatted time and only once per 5% bucket', () => {
    const listeners = {};
    const messages = [];
    const doc = {
        addEventListener: (type, handler) => { (listeners[type] ||= []).push(handler); },
        querySelectorAll: () => []
    };
    const playerWindow = {
        document: doc,
        parent: { postMessage: message => messages.push(message) }
    };
    const videoContext = vm.createContext({ WeakMap, Number, Math, String, isFinite, console });
    vm.runInContext(script.slice(videoProgressStart, videoProgressEnd), videoContext);
    videoContext.xxtObserveNativeVideoProgress(playerWindow);
    const video = { tagName: 'VIDEO', duration: 1232, currentTime: 828 };
    listeners.timeupdate[0]({ type: 'timeupdate', target: video });
    assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{ type: 'xxt-video-progress', currentTime: 828, duration: 1232, percent: 67.2 }]);
    assert.equal(videoContext.xxtFormatPlaybackTime(828), '13:48');
    assert.equal(videoContext.xxtFormatPlaybackTime(1232), '20:32');
    assert.equal(videoContext.xxtFormatPlaybackPercent(67.2), '67.2');

    video.currentTime = 840;
    listeners.timeupdate[0]({ type: 'timeupdate', target: video });
    assert.equal(messages.length, 1);
    video.currentTime = 925;
    listeners.timeupdate[0]({ type: 'timeupdate', target: video });
    assert.deepEqual(JSON.parse(JSON.stringify(messages[1])), { type: 'xxt-video-progress', currentTime: 925, duration: 1232, percent: 75.1 });
});

test('exam sidebar AI chat relays sanitized history through the shared LLM client', () => {
    let messageHandler;
    let requestMessages;
    let requestDone;
    const panelReplies = [];
    const bridgeContext = {
        PANEL_NONCE: 'fixture',
        top: { addEventListener: (type, handler) => { if (type === 'message') messageHandler = handler; } },
        iframeMsg: (type, payload) => panelReplies.push({ type, payload }),
        aiChat: (messages, done) => { requestMessages = messages; requestDone = done; },
        console
    };
    vm.runInNewContext(script.slice(panelMessageStart, panelMessageEnd), bridgeContext);
    messageHandler({ data: {
        nonce: 'fixture', type: 'chat_send', messages: [
            { role: 'system', content: '不能覆盖系统提示词' },
            { role: 'user', content: '  电视发展新趋势是什么？  ' },
            { role: 'assistant', content: '这是历史回答。' }
        ]
    } });
    assert.deepEqual(JSON.parse(JSON.stringify(requestMessages)), [
        { role: 'system', content: '你是一个乐于助人的中文学习助手，回答要简洁、准确、有条理。' },
        { role: 'user', content: '不能覆盖系统提示词' },
        { role: 'user', content: '电视发展新趋势是什么？' },
        { role: 'assistant', content: '这是历史回答。' }
    ]);
    requestDone({ ok: true, text: '参考课程资料说明。' });
    assert.deepEqual(panelReplies, [{ type: 'chat_result', payload: { ok: true, text: '参考课程资料说明。' } }]);
});

test('AI request exits when the manager never calls back and reports HTTP failures', async () => {
    const requestSource = script.slice(script.indexOf('function aiIsRetryableOutcome'), script.indexOf('function aiModelAnswer(data)'));
    const warnings = [];
    const trace = [];
    const requests = [];
    const timers = new Map();
    let timerId = 0;
    const requestContext = vm.createContext({
        Promise, Date, Math, isFinite, Object, JSON, String, Array, Number,
        console: { warn: (...parts) => warnings.push(parts.join(' ')), log: () => {} },
        aiTrace: (message, level) => trace.push({ message, level }),
        setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
        clearTimeout: id => { timers.delete(id); },
        aiEndpoint: () => 'https://fixture.test/v1/chat/completions',
        aiJsonParse: () => null,
        aiExtractText: res => (res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || '',
        aiBuildMessages: () => [],
        GM_xmlhttpRequest: options => { requests.push(options); return { abort: () => {} }; }
    });
    vm.runInContext(formatHelpers + requestSource, requestContext);
    const config = { url: 'https://fixture.test', timeout: 3000, model: 'fixture', temperature: 0, maxTokens: 10 };
    const stalled = requestContext.aiRequest({ question: 'test' }, config);
    const watchdog = Array.from(timers.values())[0];
    assert.equal(watchdog.delay, 4000);
    watchdog.callback();
    assert.equal(await stalled, '');
    assert.equal(timers.size, 0);
    requests[0].onload({ status: 200, responseText: '{}' });
    assert.equal(warnings.some(message => message.includes('请求等待超时')), true);
    assert.equal(trace.some(entry => entry.message.includes('本地等待超时')), true);

    const rejected = requestContext.aiRequest({ question: 'test' }, config);
    requests[1].onload({ status: 429, responseText: '{"error":"rate limited"}' });
    assert.equal(await rejected, '');
    assert.equal(timers.size, 0);
    assert.equal(warnings.some(message => message.includes('HTTP 429')), true);
    assert.equal(trace.some(entry => entry.message.includes('HTTP 429')), true);
    assert.equal(trace.some(entry => entry.message.includes('rate limited')), true);
});

test('retryable AI failures retry with backoff, non-retryable errors fail fast, and concurrency is capped', async () => {
    const requestSource = script.slice(script.indexOf('function aiIsRetryableOutcome'), script.indexOf('function aiModelAnswer(data)'));
    const trace = [];
    const requests = [];
    const timers = new Map();
    let timerId = 0;
    const requestContext = vm.createContext({
        Promise, Date, Math, isFinite, Object, JSON, String, Array, Number,
        console: { warn: () => {}, log: () => {} },
        aiTrace: message => trace.push(message),
        setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
        clearTimeout: id => { timers.delete(id); },
        aiEndpoint: () => 'https://fixture.test/v1/chat/completions',
        aiJsonParse: () => null,
        aiExtractText: res => (res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || '',
        aiBuildMessages: () => [],
        GM_xmlhttpRequest: options => { requests.push(options); return { abort: () => {} }; }
    });
    vm.runInContext(formatHelpers + requestSource, requestContext);
    const config = { url: 'https://fixture.test', timeout: 3000, model: 'fixture', temperature: 0, maxTokens: 10, retries: 2 };
    let settled = null;
    const retried = requestContext.aiRequest({ question: 'retry' }, config).then(text => { settled = text; return text; });
    requests[0].onload({ status: 502, responseText: '{}' });
    assert.equal(requests.length, 1, 'one in-flight attempt after a 502');
    const retryTimer = Array.from(timers.values())[0];
    assert.ok(retryTimer && retryTimer.delay >= 600 && retryTimer.delay < 1000, 'first retry delay uses backoff: ' + (retryTimer && retryTimer.delay));
    timers.clear();
    retryTimer.callback();
    assert.equal(requests.length, 2, 'second attempt issued');
    requests[1].onload({ status: 429, responseText: '{}' });
    const secondRetry = Array.from(timers.values())[0];
    assert.ok(secondRetry && secondRetry.delay >= 1200, 'second retry delay grows: ' + (secondRetry && secondRetry.delay));
    timers.clear();
    secondRetry.callback();
    assert.equal(requests.length, 3, 'third attempt issued');
    requests[2].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    assert.equal(await retried, 'A');
    assert.equal(settled, 'A');
    assert.equal(trace.filter(message => /次重试/.test(message)).length, 2);
    assert.equal(trace.some(message => /共 3 次尝试（重试 2 次）/.test(message)), true);

    const authFailed = requestContext.aiRequest({ question: 'auth' }, config);
    requests[3].onload({ status: 401, responseText: '{"error":{"message":"invalid key"}}' });
    assert.equal(await authFailed, '');
    assert.equal(requests.length, 4, 'client errors are not retried');
    assert.equal(trace.some(message => /invalid key/.test(message)), true);

    const queued = [];
    for (let index = 0; index < 4; index++) {
        queued.push(requestContext.aiRequest({ question: 'queue-' + index }, config));
    }
    const drainQueue = () => {
        for (const [id, entry] of Array.from(timers)) {
            if (entry.delay !== 0) continue;
            timers.delete(id);
            entry.callback();
        }
    };
    assert.equal(requests.length, 6, 'two concurrent requests start immediately, the rest wait');
    requests[4].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    assert.equal(await queued[0], 'A');
    drainQueue();
    assert.equal(requests.length, 7, 'a waiting request starts after a slot frees up');
    requests[5].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    drainQueue();
    assert.equal(requests.length, 8, 'fourth queued request starts after the second slot frees');
    requests[6].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    requests[7].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    drainQueue();
    assert.equal(requests.length, 8, 'no further attempts start once the queue drains');
    assert.deepEqual(await Promise.all(queued), ['A', 'A', 'A', 'A']);
});

test('AI concurrency limit is configurable and retries are logged as attempt numbers', async () => {
    const requestSource = script.slice(script.indexOf('function aiIsRetryableOutcome'), script.indexOf('function aiModelAnswer(data)'));
    const trace = [];
    const requests = [];
    const timers = new Map();
    let timerId = 0;
    const requestContext = vm.createContext({
        Promise, Date, Math, isFinite, Object, JSON, String, Array, Number,
        console: { warn: () => {}, log: () => {} },
        aiTrace: message => trace.push(message),
        setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
        clearTimeout: id => { timers.delete(id); },
        aiEndpoint: () => 'https://fixture.test/v1/chat/completions',
        aiJsonParse: () => null,
        aiExtractText: res => (res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || '',
        aiBuildMessages: () => [],
        GM_xmlhttpRequest: options => { requests.push(options); return { abort: () => {} }; }
    });
    vm.runInContext(formatHelpers + requestSource, requestContext);
    assert.equal(requestContext.aiSlotLimit({ concurrency: 4 }), 4);
    assert.equal(requestContext.aiSlotLimit({ concurrency: 99 }), 6);
    assert.equal(requestContext.aiSlotLimit({}), 2);

    const config = { url: 'https://fixture.test', timeout: 3000, model: 'fixture', temperature: 0, maxTokens: 10, retries: 1, concurrency: 3 };
    const answers = [];
    for (let index = 0; index < 4; index++) {
        answers.push(requestContext.aiRequest({ question: 'q' + index, type: 0, options: ['A', 'B'], requestMeta: { requestId: 'c-' + index } }, config));
    }
    assert.equal(requests.length, 3, 'configured concurrency starts three requests at once');
    assert.equal(trace.filter(message => /排队等待槽位/.test(message)).length, 1, 'the fourth request reports that it waits for a slot');
    assert.equal(trace.filter(message => /并发上限 3/.test(message)).length, 4, 'every request logs the effective concurrency cap');

    requests[0].onload({ status: 502, responseText: '{}' });
    const retryEntry = Array.from(timers.entries()).find(([, entry]) => entry.delay > 0 && entry.delay < 2000);
    assert.ok(retryEntry, 'a 502 schedules a retry');
    timers.delete(retryEntry[0]);
    retryEntry[1].callback();
    assert.equal(requests.length, 4, 'the retried request reuses its slot');
    assert.equal(trace.filter(message => /^AI 请求 #c-0开始/.test(message)).length, 1, 'the first attempt logs 开始 only once');
    assert.equal(trace.some(message => /^AI 请求 #c-0第 2 次尝试开始（共 2 次）/.test(message)), true, 'the retry logs its attempt number');

    requests[3].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    assert.equal(await answers[0], 'A');

    const drainQueue = () => {
        for (const [id, entry] of Array.from(timers)) {
            if (entry.delay !== 0) continue;
            timers.delete(id);
            entry.callback();
        }
    };
    assert.equal(requests.length, 4, 'queued request still waits while three slots are busy');
    drainQueue();
    assert.equal(requests.length, 5, 'the queued request starts once a slot frees up');
    requests[1].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    requests[2].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    requests[4].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    assert.deepEqual(await Promise.all(answers), ['A', 'A', 'A', 'A']);
});

test('transient AI failures surface a retry hint for later questions, other failures stay silent', async () => {
    const requestSource = script.slice(script.indexOf('function aiIsRetryableOutcome'), script.indexOf('function aiModelAnswer(data)'));
    const requests = [];
    const timers = new Map();
    let timerId = 0;
    const requestContext = vm.createContext({
        Promise, Date, Math, isFinite, Object, JSON, String, Array, Number,
        console: { warn: () => {}, log: () => {} },
        aiTrace: () => {},
        setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
        clearTimeout: id => { timers.delete(id); },
        aiEndpoint: () => 'https://fixture.test/v1/chat/completions',
        aiJsonParse: () => null,
        aiExtractText: res => (res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || '',
        aiBuildMessages: () => [],
        GM_xmlhttpRequest: options => { requests.push(options); return { abort: () => {} }; }
    });
    vm.runInContext(formatHelpers + requestSource, requestContext);
    const config = { url: 'https://fixture.test', timeout: 3000, model: 'fixture', temperature: 0, maxTokens: 10, retries: 1 };
    const failing = requestContext.aiRequest({ question: 'q', requestMeta: { requestId: 'q-1' } }, config);
    requests[0].onload({ status: 502, responseText: '{"error":"bad gateway"}' });
    Array.from(timers.values())[0].callback();
    timers.clear();
    requests[1].onload({ status: 502, responseText: '{"error":"bad gateway"}' });
    assert.equal(await failing, '');
    const hint = requestContext.aiFailureHint('q-1');
    assert.match(hint, /HTTP 502/);
    assert.match(hint, /已重试 1 次/);
    assert.equal(requestContext.aiFailureHint('unknown'), '');

    const ok = requestContext.aiRequest({ question: 'q2', requestMeta: { requestId: 'q-2' } }, config);
    requests[2].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'A' } }] }) });
    assert.equal(await ok, 'A');
    assert.equal(requestContext.aiFailureHint('q-2'), '');
});

test('http 4xx failures explain which setting to fix instead of staying silent', async () => {
    const requestSource = script.slice(script.indexOf('function aiIsRetryableOutcome'), script.indexOf('function aiModelAnswer(data)'));
    const requests = [];
    const timers = new Map();
    let timerId = 0;
    const requestContext = vm.createContext({
        Promise, Date, Math, isFinite, Object, JSON, String, Array, Number,
        console: { warn: () => {}, log: () => {} },
        aiTrace: () => {},
        setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
        clearTimeout: id => { timers.delete(id); },
        aiEndpoint: () => 'https://fixture.test/v1/chat/completions',
        aiJsonParse: () => null,
        aiExtractText: () => '',
        aiBuildMessages: () => [],
        GM_xmlhttpRequest: options => { requests.push(options); return { abort: () => {} }; }
    });
    vm.runInContext(formatHelpers + requestSource, requestContext);
    const config = { url: 'https://fixture.test', timeout: 3000, model: 'fixture', temperature: 0, maxTokens: 10, retries: 2 };

    const unauthorized = requestContext.aiRequest({ question: 'a', requestMeta: { requestId: 'k-401' } }, config);
    requests[0].onload({ status: 401, responseText: '{"error":{"message":"invalid api key"}}' });
    assert.equal(await unauthorized, '');
    const keyHint = requestContext.aiFailureHint('k-401');
    assert.match(keyHint, /HTTP 401/);
    assert.match(keyHint, /API Key/, 'a bad key must point at the key field');
    assert.match(keyHint, /invalid api key/, 'the upstream message must stay visible');

    const broke = requestContext.aiRequest({ question: 'b', requestMeta: { requestId: 'k-402' } }, config);
    requests[1].onload({ status: 402, responseText: '' });
    assert.equal(await broke, '');
    assert.match(requestContext.aiFailureHint('k-402'), /额度/, 'an empty 402 body still has to name the quota problem');

    const missing = requestContext.aiRequest({ question: 'c', requestMeta: { requestId: 'k-404' } }, config);
    requests[2].onload({ status: 404, responseText: '' });
    assert.equal(await missing, '');
    assert.match(requestContext.aiFailureHint('k-404'), /接口地址或模型名/);

    assert.equal(requestContext.aiStatusAdvice(418), '', 'an unmapped status must not invent advice');
    assert.equal(requestContext.aiFailureHint('never-used'), '');

    // 设置面板的「测试连接」不带 requestMeta，走的是 requestId = 配置测试 的分支，
    // 它被 aiRecordRequestOutcome 排除，必须靠 aiLastOutcomes 才能把状态码带回面板。
    const probe = requestContext.aiRequest({ question: '请只回复 OK', options: [], type: 4 }, config);
    requests[3].onload({ status: 401, responseText: '{"error":{"message":"invalid api key"}}' });
    assert.equal(await probe, '');
    assert.match(requestContext.aiLastFailureAdvice('配置测试'), /HTTP 401 · API Key/);
    const probeOk = requestContext.aiRequest({ question: '请只回复 OK', options: [], type: 4 }, config);
    requests[4].onload({ status: 200, responseText: JSON.stringify({ choices: [{ message: { content: 'OK' } }] }) });
    await probeOk;
    assert.equal(requestContext.aiLastFailureAdvice('配置测试'), '', 'a 2xx probe must clear the stale advice');
});

test('option numbering maps model letters directly to ordered page descriptors', () => {
    const pageOptions = [
        { pageLetter: 'A', text: '城市民谣' },
        { pageLetter: 'B', text: '抒情摇滚' }
    ];
    const modelOptions = pageOptions.map(option => option.text);
    assert.deepEqual(modelOptions, ['城市民谣', '抒情摇滚']);
    assert.equal(modelOptions.includes('length'), false);
    assert.deepEqual(parse('B', { type: 0, options: modelOptions }), ['B']);
    assert.deepEqual(map(['B'], pageOptions), [1]);
    assert.equal(pageOptions[map(['B'], pageOptions)[0]].pageLetter, 'B');
});

test('single choice accepts explicit letters and unique exact text only', () => {
    const options = ['阿尔法', '贝塔', '伽马', '德尔塔'];
    assert.deepEqual(parse('答案：C', { type: 0, options }), ['C']);
    assert.deepEqual(parse('Final answer: D.', { type: 0, options }), ['D']);
    assert.deepEqual(parse('伽马', { type: 0, options }), ['C']);
    assert.deepEqual(parse('The answer is C', { type: 0, options }), []);
    assert.deepEqual(parse('C or D', { type: 0, options }), []);
    assert.deepEqual(parse('C\nActually D', { type: 0, options }), []);
    assert.deepEqual(parse('H', { type: 0, options }), []);
});

test('answer decorations are stripped only after the strict pass fails', () => {
    const options = ['阿尔法', '贝塔', '伽马', '德尔塔'];
    assert.deepEqual(parse('```\nC\n```', { type: 0, options }), ['C']);
    assert.deepEqual(parse('**C**', { type: 0, options }), ['C']);
    assert.deepEqual(parse('- C', { type: 0, options }), ['C']);
    assert.deepEqual(parse('答案：C\n解析：伽马排在第三位', { type: 0, options }), ['C']);
    assert.deepEqual(parse('正确\n解析：结论明确', { type: 3, options: [] }), ['正确']);
    assert.deepEqual(parse('答案：A、C\n解析：两项都成立', { type: 1, options }), ['A', 'C']);
    // 宽容模式不能被用来猜答案：先讲理由再给结论、或结论含糊时必须继续拒答。
    assert.deepEqual(parse('A 选项不对\n所以答案是 C', { type: 0, options }), []);
    assert.deepEqual(parse('【解析】因为因此', { type: 0, options }), []);
    assert.deepEqual(parse('C or D', { type: 0, options }), []);
});

test('duplicate exact option text is ambiguous instead of choosing the first match', () => {
    assert.deepEqual(parse('同名选项', { type: 0, options: ['同名选项', '其他', '同名选项'] }), []);
});

test('multiple choice accepts explicit sets and rejects explanatory prose', () => {
    const options = ['甲', '乙', '丙', '丁'];
    assert.deepEqual(parse('AC', { type: 1, options }), ['A', 'C']);
    assert.deepEqual(parse('A，C', { type: 1, options }), ['A', 'C']);
    assert.deepEqual(parse('A 和 C', { type: 1, options }), ['A', 'C']);
    assert.deepEqual(parse('I think A and C are correct', { type: 1, options }), []);
    assert.deepEqual(parse('AA', { type: 1, options }), []);
});

test('judgment parsing accepts exact truth values and rejects explanations', () => {
    assert.deepEqual(parse('错误', { type: 3, options: [] }), ['错误']);
    assert.deepEqual(parse('true', { type: 3, options: [] }), ['正确']);
    assert.deepEqual(parse('错误，因为……', { type: 3, options: [] }), []);
    assert.deepEqual(parse('uncertain', { type: 3, options: [] }), []);
});

test('duplicate option text remains distinct by model index', async () => {
    const options = [{ text: '重复' }, { text: '重复' }, { text: '不同' }];
    const selected = [false, false, false];
    const result = await api.select(options, ['B'], 0, option => selected[options.indexOf(option)], option => { selected[options.indexOf(option)] = true; }, () => true);
    assert.equal(result.success, true);
    assert.deepEqual(selected, [false, true, false]);
});

test('failed clicks and stale requests are not reported as successful selections', async () => {
    const options = [{}, {}];
    const selected = [false, false];
    const failedClick = await api.select(options, ['B'], 0, option => selected[options.indexOf(option)], () => {}, () => true);
    assert.equal(failedClick.success, false);
    assert.equal(failedClick.reason, 'click-failed');

    let current = true;
    const stale = await api.select(options, ['A'], 0, option => selected[options.indexOf(option)], option => {
        selected[options.indexOf(option)] = true;
        current = false;
    }, () => current);
    assert.equal(stale.success, false);
    assert.equal(stale.reason, 'stale-question');
});

test('same live question cannot acquire a duplicate request; completed result is terminal', () => {
    const document = { documentElement: { contains: () => true } };
    const root = { ownerDocument: document, isConnected: true };
    const signature = () => 'q1:A,B';
    const first = api.begin(root, 'q1', 'test', signature);
    assert.ok(first);
    assert.equal(api.begin(root, 'q1', 'test', signature), null);
    // 同一道题渲染在另一个容器里：指纹相同，仍然必须挡住。
    const duplicateRoot = { ownerDocument: document, isConnected: true };
    assert.equal(api.begin(duplicateRoot, 'q1', 'second-flow', signature), null);
    assert.equal(first.finish(true, 'verified'), true);
    assert.equal(first.finish(false, 'duplicate-callback'), false);
    assert.equal(first.state, 'done');
    assert.equal(api.begin(root, 'q1', 'test', signature), null);
});

test('a different question that reuses the same page id is not blocked by a finished request', () => {
    const document = { documentElement: { contains: () => true } };
    // 新版考试页里 input[name^=answer] 常常缺失或重名，多道题会拿到同一个 key。
    const firstRoot = { ownerDocument: document, isConnected: true };
    const secondRoot = { ownerDocument: document, isConnected: true };
    const first = api.begin(firstRoot, 'q1', 'exam', () => 'stem-1:A,B');
    assert.ok(first);
    assert.equal(first.finish(true, 'verified'), true);
    assert.equal(first.state, 'done');
    // 同一节点再次进入：仍视为同一道题，按「已完成」跳过。
    assert.equal(api.begin(firstRoot, 'q1', 'exam', () => 'stem-1:A,B'), null);
    // 节点与指纹都不同 => 是另一道题，必须放行，否则会出现整卷「已有处理请求」。
    const second = api.begin(secondRoot, 'q1', 'exam', () => 'stem-2:A,B');
    assert.ok(second, 'a different question sharing the same id must still be processed');
    assert.equal(second.state, 'pending');
    assert.equal(second.finish(true, 'verified'), true);
});

test('stale pending request of another question does not block the current one', () => {
    const document = { documentElement: { contains: () => true } };
    const firstRoot = { ownerDocument: document, isConnected: true };
    const secondRoot = { ownerDocument: document, isConnected: true };
    const first = api.begin(firstRoot, 'q1', 'exam', () => 'stem-1:A,B');
    assert.ok(first);
    // 第一题还在跑，但断开了（切题/重渲染）；另一道同 key 的题必须能开始。
    firstRoot.isConnected = false;
    const second = api.begin(secondRoot, 'q1', 'exam', () => 'stem-2:A,B');
    assert.ok(second);
    assert.equal(second.state, 'pending');
});

test('changed question supersedes an old request and rejects late success', () => {
    const document = { documentElement: { contains: () => true } };
    const root = { ownerDocument: document, isConnected: true };
    let fingerprint = 'old';
    const old = api.begin(root, 'q1', 'first', () => fingerprint);
    fingerprint = 'new';
    const current = api.begin(root, 'q1', 'second', () => fingerprint);
    assert.ok(current);
    assert.equal(old.isCurrent(), false);
    assert.equal(old.finish(true, 'late'), false);
    assert.equal(current.isCurrent(), true);
    fingerprint = 'newer';
    assert.equal(current.finish(true, 'late'), false);
    assert.equal(current.state, 'failed');
});

test('judgment selection rejects multiple targets and multi-choice clears extra selections', async () => {
    const options = [{}, {}, {}];
    const selected = [false, true, true];
    const invalid = await api.select(options, ['A', 'B'], 3, () => false, () => {}, () => true);
    assert.equal(invalid.success, false);
    const multi = await api.select(options, ['A', 'C'], 1, item => selected[options.indexOf(item)], item => {
        const index = options.indexOf(item);
        selected[index] = !selected[index];
    }, () => true);
    assert.equal(multi.success, true);
    assert.deepEqual(selected, [true, false, true]);
});

test('option toggling clicks the platform inner container instead of the bare list item', () => {
    const clicked = [];
    const container = {
        nodeType: 1, clicked: false,
        click() { this.clicked = true; clicked.push('container'); }
    };
    const node = {
        nodeType: 1,
        matches: () => false,
        closest: () => null,
        querySelector: selector => (selector === '[class*="before-after"]' ? container : null),
        click() { clicked.push('li'); },
        className: '',
        classList: { add() {}, remove() {}, contains: () => false }
    };
    const ok = toggle(node, () => container.clicked);
    assert.equal(ok, true);
    assert.deepEqual(clicked, ['container']);
});

test('option toggling falls back to writing the native control when clicks do nothing', () => {
    const input = { checked: false, type: 'checkbox', value: 'A', dispatchEvent() {} };
    const node = {
        nodeType: 1,
        matches: () => false,
        closest: () => null,
        querySelector: selector => (selector.indexOf('input') === 0 ? input : null),
        click() {},
        className: '',
        classList: { add() {}, remove() {}, contains: () => false }
    };
    const ok = toggle(node, () => input.checked);
    assert.equal(ok, true);
    assert.equal(input.checked, true);
});

function extract(from, to) {
    const start = script.indexOf(from);
    const end = script.indexOf(to, start);
    assert.ok(start >= 0 && end > start, 'production extraction boundaries: ' + from);
    return script.slice(start, end);
}

function createScheduler(missions = [], busy = 0, startTask, taskCandidateCount = 0) {
    const timers = new Map();
    const logs = [];
    const starts = [];
    let timerId = 0;
    const sandbox = vm.createContext({
        console: { error() {}, warn() {} },
        missionList: Object.fromEntries(missions.map(item => ['m' + item.jobid, item])),
        taskCandidateCount, taskSetupReady: true,
        busyThread: busy, stop: false, cVersion: 999, jumpType: 0,
        _w: { top: { unrivalScriptList: [] } },
        logs: { addLog: message => logs.push(message) },
        drainAiTrace: () => {},
        _p: 'https:', _h: 'mooc1.chaoxing.com',
        _d: { getElementById: () => null },
        xxtFormatPlaybackTime: seconds => String(seconds) + 's',
        xxtRiskControlUrl: (protocol, host) => String(protocol || 'https:') + '//' + String(host || '') +
            '/antispiderShowVerify.ac',
        setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
        clearTimeout: id => timers.delete(id)
    });
    for (const type of ['Video', 'Document', 'Work', 'Book', 'Hyperlink', 'MicroCourse', 'Live']) {
        sandbox['do' + type] = item => {
            starts.push(item.jobid);
            if (startTask) startTask(item, sandbox);
            else item.status = 'running';
        };
    }
    vm.runInContext('var ' + extract('loopJobTimer = null,', '            readyCheck =').replace(/,\s*$/, ';'), sandbox);
    return {
        sandbox, timers, logs, starts,
        tick() {
            const [id, callback] = timers.entries().next().value;
            timers.delete(id);
            callback();
        }
    };
}

test('scheduler owns one timer, starts one mission, and completes once', () => {
    const first = { jobid: '1', type: 'video', status: 'pending' };
    const second = { jobid: '2', type: 'document', status: 'pending' };
    const scheduler = createScheduler([first, second]);
    for (let i = 0; i < 8; i++) scheduler.sandbox.loopjob();
    assert.equal(scheduler.timers.size, 1);
    assert.deepEqual(scheduler.starts, ['1']);
    first.status = 'done';
    scheduler.tick();
    assert.deepEqual(scheduler.starts, ['1', '2']);
    second.status = 'done';
    scheduler.tick();
    assert.equal(scheduler.timers.size, 0);
    assert.equal(scheduler.sandbox._w.top.jump, true);
    scheduler.sandbox.loopjob();
    assert.equal(scheduler.logs.length, 1);
});

test('scheduler waits for busy initialization and cancels its owned timer', () => {
    const scheduler = createScheduler([], 1);
    scheduler.sandbox.loopjob();
    assert.equal(scheduler.sandbox._w.top.jump, undefined);
    assert.equal(scheduler.timers.size, 1);
    scheduler.tick();
    assert.equal(scheduler.timers.size, 1);
    scheduler.sandbox.busyThread = 0;
    scheduler.tick();
    assert.equal(scheduler.sandbox._w.top.jump, true);
    const cancelled = createScheduler([], 1);
    cancelled.sandbox.loopjob();
    cancelled.sandbox.cancelLoopJob();
    cancelled.sandbox.loopjob();
    assert.equal(cancelled.timers.size, 0);
});

test('scheduler never marks unregistered chapter tasks as completed', () => {
    const scheduler = createScheduler([], 0, null, 1);
    scheduler.sandbox.loopjob();
    assert.equal(scheduler.sandbox._w.top.jump, undefined);
    assert.equal(scheduler.timers.size, 0);
    assert.match(scheduler.logs[0], /没有可执行项/);
});

test('scheduler contains reentrant calls and marks a synchronous start failure terminal', () => {
    const item = { jobid: '1', name: 'broken', type: 'work', status: 'pending' };
    const scheduler = createScheduler([item], 0, (mission, sandbox) => {
        sandbox.loopjob();
        throw new Error('fixture failure');
    });
    scheduler.sandbox.loopjob();
    assert.equal(item.status, 'failed');
    assert.equal(scheduler.timers.size, 1);
    scheduler.tick();
    assert.deepEqual(scheduler.starts, ['1']);
    assert.equal(scheduler.timers.size, 0);
    assert.match(scheduler.logs[0], /任务启动失败/);
});

test('video readiness deduplicates requests and ignores success after timeout', () => {
    const timers = new Map();
    const missions = new Map();
    const requests = [];
    let timerId = 0;
    const sandbox = vm.createContext({
        console, Set, busyThread: 0, stop: false, FID: 'fid', _p: 'https:', _h: 'fixture.test', vrefer: '',
        setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
        clearTimeout: id => timers.delete(id),
        logs: { addLog() {} }, appendMissionNode() {},
        getMission: id => missions.get(String(id)),
        setMission: mission => missions.set(String(mission.jobid), mission),
        GM_xmlhttpRequest: request => requests.push(request)
    });
    vm.runInContext(extract('const videoReadyRequests = new Set();', '            doVideo =').replace(/,\s*$/, ';'), sandbox);
    const item = { jobid: 'video1', property: { objectid: 'object', name: 'video' } };
    sandbox.video_getReady(item);
    sandbox.video_getReady(item);
    assert.equal(requests.length, 1);
    assert.equal(sandbox.busyThread, 1);
    Array.from(timers.values())[0]();
    assert.equal(sandbox.busyThread, 0);
    assert.equal(missions.get('video1').status, 'failed');
    requests[0].onload({ responseText: '{"duration":30}' });
    requests[0].ontimeout();
    assert.equal(sandbox.busyThread, 0);
    assert.equal(missions.get('video1').status, 'failed');
});

test('document failure releases busy once and ignores late responses', () => {
    for (const synchronousFailure of [false, true]) {
        const timers = [];
        const requests = [];
        const mission = { jobid: 'doc1', name: 'document', status: 'pending' };
        const sandbox = vm.createContext({
            console: { log() {}, error() {} }, Math,
            missionList: { mdoc1: mission }, busyThread: 0, stop: false,
            _p: 'https:', _h: 'fixture.test', chapterId: 'chapter', courseId: 'course', classId: 'class',
            logs: { addLog() {} }, setTimeout: callback => timers.push(callback),
            GM_xmlhttpRequest: request => {
                if (synchronousFailure) throw new Error('request failed');
                requests.push(request);
            }
        });
        vm.runInContext('var ' + extract('doDocument = (item) => {', '            doWork =').replace(/,\s*$/, ';'), sandbox);
        sandbox.doDocument(mission);
        timers[0]();
        if (!synchronousFailure) {
            assert.equal(sandbox.busyThread, 1);
            requests[0].ontimeout();
            requests[0].onload({ responseText: '{"status":true}' });
            requests[0].onerror({ error: 'late error' });
        }
        assert.equal(sandbox.busyThread, 0);
        assert.equal(mission.status, 'failed');
    }
});

test('live info success arriving after timeout cannot start progress timers', () => {
    const requests = [];
    let intervals = 0;
    const mission = { jobid: 'live1', name: 'live', status: 'pending' };
    const sandbox = vm.createContext({
        console, missionList: { mlive1: mission }, stop: false,
        _p: 'https:', _h: 'fixture.test', UID: 'user', classId: 'class', chapterId: 'chapter', courseId: 'course',
        logs: { addLog() {} }, GM_xmlhttpRequest: request => requests.push(request),
        setInterval: () => intervals++, clearInterval() {},
        xxtQueryString: (pairs) => pairs.map(pair => pair[0] + '=' + pair[1]).join('&'),
        xxtCreateLiveProgress: (duration) => ({
            duration, step: 30, getProgress: () => 0, isComplete: () => false,
            canReport: () => true, remaining: () => duration, recordSuccess: () => false, recordFailure: () => false
        })
    });
    vm.runInContext('var ' + extract('doLive = (item) => {', '            missionList = Object.create(null),').replace(/,\s*$/, ';'), sandbox);
    sandbox.doLive(mission);
    requests[0].ontimeout();
    requests[0].onload({ responseText: '{"data":{"duration":60}}' });
    assert.equal(mission.status, 'failed');
    assert.equal(intervals, 0);
});

test('automatic submission requires a nonempty, fully successful, verified result set', () => {
    const verified = { success: true, verify: () => true };
    assert.equal(api.canSubmit(0, [], 30), false);
    assert.equal(api.canSubmit(2, [verified], 30), false);
    assert.equal(api.canSubmit(2, [verified, { success: false, verify: () => false }], 30), false);
    assert.equal(api.canSubmit(2, [verified, verified], 30), true);
});

test('mission state keeps legacy fields synchronized and terminal states stable', () => {
    const changes = [];
    const mission = api.missionState('pending', state => changes.push(state));
    assert.equal(mission.getStatus(), 'pending');
    assert.equal(mission.isRunning(), false);
    assert.equal(mission.isDone(), false);
    mission.setRunning(true);
    assert.equal(mission.getStatus(), 'running');
    assert.equal(mission.isRunning(), true);
    mission.setRunning(false);
    assert.equal(mission.getStatus(), 'pending');
    mission.setDone(true);
    assert.equal(mission.getStatus(), 'done');
    mission.setRunning(true);
    assert.equal(mission.getStatus(), 'done');
    assert.deepEqual(changes, ['running', 'pending', 'done']);

    const failed = api.missionState('failed');
    assert.equal(failed.isDone(), true);
    failed.setDone(false);
    failed.setRunning(true);
    assert.equal(failed.getStatus(), 'failed');
});

const independent = vm.createContext({ console, Date, Math, JSON, Object, String, Number, isFinite, encodeURIComponent });
vm.runInContext(extract('function xxtDecodeEntities(text)', 'function xxtFormatPlaybackTime(seconds)') +
    '\nglobalThis.api = { text: xxtTextFromMarkup, url: xxtAnanasUrl, ok: xxtAnanasSucceeded, live: xxtCreateLiveProgress,' +
    ' run: xxtRegisterRun, conflict: xxtFindStudyConflict, sessions: xxtReadStudySessions,' +
    ' risk: xxtRiskControlMark, riskUrl: xxtRiskControlUrl };', independent);
const media = independent.api.text;
const ananas = independent.api.url;
const succeeded = independent.api.ok;
const liveProgress = independent.api.live;
const registerRun = independent.api.run;
const studyConflict = independent.api.conflict;
const readSessions = independent.api.sessions;
const riskMark = independent.api.risk;
const riskUrl = independent.api.riskUrl;

test('media extraction keeps readable URLs and drops scripts, styles, and unsafe sources', () => {
    const markup = '<style>.a{content:"<img src=x>"}</style>' +
        '<script>var a = "<iframe src=y>"</script>' +
        '<p>题干<img class="q" src="https://cdn.test/a.png?s=1&amp;t=2" onerror="x()"></p>' +
        '<iframe _src="//cdn.test/voice.mp3"></iframe>' +
        '<img src="javascript:alert(1)">' +
        '<div class="audioReader"><source src="https://cdn.test/old.mp3"></div>';
    const text = media(markup);
    assert.equal(text, '<p>题干cdn.test/a.png?s=1&t=2</p>cdn.test/voice.mp3cdn.test/old.mp3');
    assert.equal(media(null), '');
    assert.equal(media('<p>未闭合<b>标签</p>'), '<p>未闭合<b>标签</p>');
    assert.equal(media('<img src="https://a.test/x.png"'), 'a.test/x.png', 'unterminated tag still yields its media url');
    assert.equal(media('<img src=plain.png>'), 'plain.png', 'unquoted attribute values survive');
    assert.equal(media('<div class="audioReader"><div><source src="deep.mp3"></div><span>ignored</span></div>尾'), 'deep.mp3尾');
});

test('task request builder encodes every parameter and keeps retries unique', () => {
    const context = { protocol: 'https:', host: 'mooc1.test', chapterId: 'ch 1', courseId: 'c&1', classId: 'k1' };
    const item = { jobid: 'job-1', jtoken: 'a+b' };
    assert.equal(ananas(item, { path: '/ananas/job' }, context),
        'https://mooc1.test/ananas/job?jobid=job-1&knowledgeid=ch%201&courseid=c%261&clazzid=k1&jtoken=a%2Bb');
    const first = ananas(item, { path: '/ananas/job/microCourse', params: [['_', 1]] }, context);
    const second = ananas(item, { path: '/ananas/job/microCourse', params: [['_', 2]] }, context);
    assert.notEqual(first, second);
    assert.match(first, /&_=1$/);
    assert.equal(succeeded({}, '{"status":true}'), true);
    assert.equal(succeeded({}, '{"status":0}'), false);
    assert.equal(succeeded({}, 'not json'), false);
    assert.equal(succeeded({ successText: '添加考核点成功' }, '结果：添加考核点成功'), true);
    assert.equal(succeeded({ successText: '添加考核点成功' }, '{"status":true}'), false);
});

test('live progress only counts confirmed reports and stops after repeated failures', () => {
    const progress = liveProgress(90, 0, { step: 30, maxFailures: 2 });
    assert.equal(progress.canReport(), true);
    assert.equal(progress.isComplete(), false);
    assert.equal(progress.recordFailure(), false);
    assert.equal(progress.getProgress(), 0, 'failed reports cannot advance the watch time');
    assert.equal(progress.recordFailure(), true);
    assert.equal(progress.recordSuccess(), false);
    assert.equal(progress.getProgress(), 30);
    assert.equal(progress.remaining(), 60);
    assert.equal(progress.recordSuccess(), false);
    assert.equal(progress.recordSuccess(), true);
    assert.equal(progress.isComplete(), true);
    assert.equal(progress.canReport(), false);
    assert.equal(liveProgress(0, 0).canReport(), false);
    assert.equal(liveProgress(60, 60).isComplete(), true);
});

test('single-instance lease blocks a second owner and expires stale owners', () => {
    const registry = {};
    const plain = value => JSON.parse(JSON.stringify(value));
    assert.deepEqual(plain(registerRun(registry, 'a', 1000, 30000)), { duplicate: false, owner: '' });
    assert.deepEqual(plain(registerRun(registry, 'b', 1000, 30000)), { duplicate: true, owner: 'a' });
    assert.deepEqual(plain(registerRun(registry, 'a', 31000, 30000)), { duplicate: false, owner: '' });
    assert.deepEqual(plain(registerRun(registry, 'b', 31000, 30000)), { duplicate: true, owner: 'a' });
    assert.deepEqual(plain(registerRun(registry, 'b', 62000, 30000)), { duplicate: false, owner: '' });
    assert.deepEqual(Object.keys(registry), ['b']);
});

test('study sessions warn only for a live different course in another window', () => {
    const plain = value => JSON.parse(JSON.stringify(value));
    const now = 100000,
        ttl = 600000;
    const sessions = readSessions(JSON.stringify({ w1: { courseId: 'c1', seen: now - 1000 } }));
    assert.equal(studyConflict(sessions, 'w2', 'c1', now, ttl), '');
    assert.equal(studyConflict(sessions, 'w2', 'c2', now, ttl), 'c1');
    assert.equal(studyConflict(sessions, 'w1', 'c2', now, ttl), '', 'self window is never a conflict');
    assert.equal(studyConflict(sessions, 'w2', 'c2', now + ttl + 1, ttl), '', 'expired sessions are ignored');
    assert.deepEqual(plain(readSessions('broken')), {});
    assert.deepEqual(plain(readSessions(null)), {});
});


// ---- 视频进度上报的本地加密串 ----

function strEcBuilder() {
    const start = script.indexOf("var strEc = '[' + classId");
    const end = script.indexOf("';", script.indexOf("'][0_' + item['duration'] + ']", start) - 1);
    assert.ok(start > 0 && end > start, 'strEc expression must exist in the userscript');
    const expression = script.slice(start, end + 2);
    const sandbox = vm.createContext({});
    vm.runInContext('globalThis.build = function (classId, UID, item, playTime) { ' + expression + ' return strEc; };', sandbox);
    return sandbox.build;
}

test('video progress encryption string matches the upstream template exactly', () => {
    const build = strEcBuilder();
    const legacy = (classId, UID, jobid, objectId, playTime, duration) =>
        `[${classId}][${UID}][${jobid}][${objectId}][${playTime * 1000}][d_yHJ!$pdA~5][${duration * 1000}][0_${duration}]`;
    const cases = [
        [1, 2, 3, 4, 0, 60],
        [999999, 123456, 5555, 77777, 59, 120],
        [0, 0, 0, 0, 1800, 1800],
        ['c1', 'u1', 'j1', 'o1', 12.7, 45.3]
    ];
    for (const [classId, UID, jobid, objectId, playTime, duration] of cases) {
        assert.equal(
            build(classId, UID, { jobid, objectId, duration }, playTime),
            legacy(classId, UID, jobid, objectId, playTime, duration)
        );
    }
    const source = script.slice(script.indexOf('function ecOnload'), script.indexOf('let reportsUrl = reportUrl'));
    assert.ok(!/encUrl|getEnc\.php/.test(source), 'progress reporting must not call the retired encryption host');
    assert.match(source, /var strEc =/, 'strEc must be declared locally instead of leaking an implicit global');
});

// ---- replaceAll 兜底实现 ----

test('replaceAll fallback treats string patterns literally instead of as regexes', () => {
    const source = script.slice(script.indexOf('if (typeof String.prototype.replaceAll !== "function")'),
        script.indexOf('// ==================== 第三方 AI 模型辅助'));
    assert.ok(source.length > 0, 'replaceAll fallback must exist');
    assert.ok(!/new RegExp\(\s*s1/.test(source), 'the old regex-based monkey patch must not come back');
    const sandbox = vm.createContext({});
    vm.runInContext('delete String.prototype.replaceAll;' + source +
        '\nglobalThis.apply = function (value, pattern, replacement) { return value.replaceAll(pattern, replacement); };', sandbox);
    assert.equal(sandbox.apply('a.b.c', '.', '-'), 'a-b-c', 'dot is a literal, not any-character');
    assert.equal(sandbox.apply('f(x)', '(', '['), 'f[x)');
    assert.equal(sandbox.apply('题目（1分）', '（1分）', ''), '题目');
    assert.equal(sandbox.apply('abc', /b/g, 'B'), 'aBc');
    assert.throws(() => sandbox.apply('abc', /b/, 'B'), /global/);
});


// ---- 自动跳章链路 / 日志转义 / JSON 旁路采集 回归 ----

test('auto next-chapter must not depend on an undefined platform hook', () => {
    const anchor = 'setInterval(function () {\r\n            let but = null;\r\n            if (_w.jump) {';
    const from = script.indexOf('if (_w.jump) {');
    assert.notEqual(from, -1, 'the auto-jump interval must exist');
    const to = script.indexOf('} else if (_l.href.indexOf("work/phone/doHomeWork") > 0) {', from);
    assert.ok(to > from, 'the auto-jump interval must be bounded');
    const source = script.slice(from, to);

    assert.match(source, /typeof _w\.onReadComplete1 === 'function'/,
        'onReadComplete1 must be existence-checked before being called');
    assert.ok(!/setTimeout\s*\(\s*['"]/.test(source),
        'the string form of setTimeout (implicit eval) must not come back');

    // 用真实现跑一遍：钩子缺失时仍必须调度跳章
    const scheduled = [];
    const win = { top: { unrivalPageRd: '0.42' } };
    win.jjump = rd => scheduled.push(rd);
    const context = vm.createContext({ _w: win, console, setTimeout: fn => fn() });
    vm.runInContext(`
        var jumpRd = _w.top.unrivalPageRd;
        setTimeout(function () { if (typeof _w.jjump === 'function') _w.jjump(jumpRd); }, 2856);
    `, context);
    assert.deepEqual(scheduled, ['0.42'], 'jump must still be scheduled when the hook is absent');
});

test('addLog renders page-derived text as text and only allows opt-in HTML', () => {
    const from = script.indexOf('"addLog": function (str, color = "black"');
    assert.notEqual(from, -1, 'addLog must exist');
    const to = script.indexOf('latestNativeVideoProgress = null', from);
    assert.ok(to > from, 'addLog must be bounded');
    const source = script.slice(from, to);

    assert.match(source, /allowHtml = false/, 'HTML must be opt-in');
    assert.match(source, /logEntry\.textContent = logText/, 'default path must use textContent');
    assert.match(source, /if \(allowHtml\) logEntry\.innerHTML = logText/, 'HTML path must be gated');

    // HTML 只允许出现在「自己拼的链接」或「已经过 textContent 转义的副本」这两类调用点。
    const htmlCalls = [...script.matchAll(/\.addLog\([\s\S]{0,400}?,\s*true\);/g)];
    assert.ok(htmlCalls.length >= 1, 'at least the risk-control link must opt into HTML');
    for (const call of htmlCalls) {
        const intentional = /<a\s|<\/a>/.test(call[0])
            || /safe\.innerHTML/.test(call[0])
            || /escapeLogHtml\(/.test(call[0]);
        assert.ok(intentional, 'unexpected HTML log: ' + call[0].slice(0, 70));
    }
});

test('JSON.parse hook swallows callback failures so the page keeps parsing', () => {
    const from = script.indexOf('function JSONParseHook(func)');
    assert.notEqual(from, -1, 'JSONParseHook must exist');
    const to = script.indexOf('function parseIcve(', from);
    assert.ok(to > from, 'JSONParseHook must be bounded');
    const source = script.slice(from, to);
    assert.match(source, /try \{ func\(o\); \} catch/, 'the hook callback must be wrapped in try/catch');

    const context = vm.createContext({ console, JSON });
    vm.runInContext(source + '\nglobalThis.hook = JSONParseHook;', context);
    const original = context.JSON.parse;
    context.hook(() => { throw new Error('boom'); });
    assert.equal(context.JSON.parse('{"paper":{}}').paper !== undefined, true,
        'a failing side-channel collector must not break JSON.parse');
    context.JSON.parse = original;
});

test('mobile chapter submit resolves platform hooks by name and never calls a bare identifier', () => {
    const from = script.indexOf("aiTrace('手机提交：调用 submitCheckTimes'");
    assert.notEqual(from, -1, 'the mobile submit sequence must exist');
    const to = script.indexOf(`aiTrace('手机提交：submitAction 已返回`, from);
    assert.ok(to > from, 'the mobile submit sequence must be bounded');
    const source = script.slice(from, to);

    // 上游 v1.46 的调用点在 unsafewindow 的裸作用域里能命中平台全局函数，
    // 迁移进 IIFE 之后必须显式走 _w，否则每次提交都是 ReferenceError。
    for (const hook of ['submitCheckTimes', 'escapeBlank', 'submitAction']) {
        assert.ok(!new RegExp('(^|[^.\\w$])' + hook + '\\s*\\(', 'm').test(source),
            hook + ' must not be called as a bare identifier');
        assert.ok(source.indexOf(`_w.${hook}`) !== -1, hook + ' must be resolved through _w');
    }
    assert.match(source, /typeof _w\.submitAction === 'function'/, 'submitAction must be existence-checked');
    assert.match(source, /throw new Error\('平台未提供 submitAction/, 'a missing submitAction must abort loudly');
});

test('desktop chapter submit drives the platform confirm flow instead of a bare submitCheckTimes', () => {
    const from = script.indexOf('async function desktopChapterConfirmSubmit()');
    assert.notEqual(from, -1, 'the desktop confirm helper must exist');
    const end = script.indexOf('\n    }\n', from);
    assert.ok(end > from, 'the desktop confirm helper must be bounded');
    const helper = script.slice(from, end);

    // submitCheckTimes 会跳过平台的 toadd，#answerwqbid / enc 还是空的，服务端回「无效的参数：code-1！」。
    assert.match(helper, /desktopChapterFormReady\(\)/, 'the bounded-form state must be verified before submitting');
    assert.match(helper, /if \(!confirmed && !desktopChapterSubmitNote && !aiChapterAlreadyReviewed\(_self, ''\) && desktopChapterFormReady\(\)\)/,
        'the submitCheckTimes fallback may only run once the pending-question list is populated');
    // validate 走 status==1（账号异常）/status==2（验证码）时确认框永远不会来，
    // 必须报出真实原因，不能把验证码说成「凭证未就绪」。
    assert.match(helper, /desktopChapterSubmitBlocker\(\)/, 'a verification-code submit must be reported as such');
    assert.match(helper, /if \(blocker\) \{/, 'a blocking verify dialog must break the wait');
    assert.match(helper, /aiChapterSubmitFailed\(_self, ''\)\) break/,
        'a platform rejection must stop the wait instead of burning the full timeout');
    assert.match(helper, /workPop/, 'the platform confirm dialog must be intercepted');
    assert.match(helper, /\/确认提交\//, 'only the submit confirmation may be auto-confirmed');
    assert.match(helper, /hook\.target\.workPop = hook\.original/, 'the workPop hook must be restored');

    const callFrom = script.indexOf("aiTrace('桌面提交：调用 btnBlueSubmit'");
    assert.notEqual(callFrom, -1, 'the desktop submit sequence must exist');
    const callTo = script.indexOf("aiTrace('桌面提交：submitCheckTimes 已返回", callFrom);
    assert.ok(callTo > callFrom, 'the desktop submit sequence must be bounded');
    const sequence = script.slice(callFrom, callTo);
    assert.match(sequence, /await desktopChapterConfirmSubmit\(\)/, 'the sequence must go through the confirm helper');
    assert.ok(!/_self\.submitCheckTimes\(\)/.test(sequence),
        'the sequence must not call submitCheckTimes outside the guarded helper');
    assert.match(sequence, /if \(!submitted\)/, 'an unconfirmed submit must be reported, not claimed as success');

    return Promise.resolve();
});

test('platform submit rejections are surfaced instead of claimed as success', () => {
    const from = script.indexOf('const observed = function (message) {');
    assert.notEqual(from, -1, 'the alert observer must exist');
    const to = script.indexOf('target.alert = observed;', from);
    assert.ok(to > from, 'the alert observer must be bounded');
    const source = script.slice(from, to);
    assert.match(source, /无效的参数/, 'the code-1 rejection must be recognised');
    assert.match(source, /平台拒绝提交/, 'the rejection must be reported to the panel');
    assert.match(source, /unrivalWorkInfo/, 'the rejection must overwrite the panel status');
    // 协调层先有机会回退提交锁，但上报与回退是两件事：回退成功不代表用户知道课没交上。
    assert.match(source, /const handled = aiObserveChapterAlert\(_self, '', message\);[\s\S]*if \(!handled &&/,
        'the panel tip must not depend on the lock rollback result');
    // validate 的 status==1 只 alert 就返回，确认框永远不会来，必须记下这句真实原因。
    assert.match(source, /账号发生异常/, 'a platform-level block must be remembered for the final report');
});

// 提交锁的三种状态语义：reviewed/result 永久挡、submitting 只在 TTL 内挡、failed 立刻可重试。
// 早期实现只要 state 不是 reviewed 就一律挡，于是一次「无效的参数：code-1！」能把整章
// 永久锁在 submitting，用户只能刷新页面重来。
test('an expired or platform-rejected chapter submit lock never blocks a retry', () => {
    const from = script.indexOf('function aiChapterSubmitHost(');
    const to = script.indexOf('var GLOBAL = {', from);
    assert.ok(from !== -1 && to > from, 'the chapter submit coordination layer must be bounded');
    const context = vm.createContext({ console, Date, Map, URLSearchParams, Promise, setTimeout,
        aiTrace: () => {}, aiClip: (text, max) => String(text).slice(0, max) });
    // 提交锁要能识别风控拦截文案，这个判定是仓库级共享的纯函数，一并带进沙箱。
    const riskMarkFrom = script.indexOf('function xxtRiskControlMark(');
    const riskMarkTo = script.indexOf('function xxtRiskControlUrl(', riskMarkFrom);
    assert.ok(riskMarkFrom !== -1 && riskMarkTo > riskMarkFrom, 'the risk-control detection helper must exist');
    vm.runInContext(script.slice(from, to) + '\n' + script.slice(riskMarkFrom, riskMarkTo) + `
globalThis.api = { claim: aiClaimChapterSubmit, observe: aiObserveChapterAlert, failed: aiChapterSubmitFailed,
    pending: aiChapterPendingRequests, wait: aiWaitChapterPendingRequests };`, context);
    const api = context.api;
    const win = { location: { search: '' }, document: { getElementById: () => null }, unrivalActiveWorkId: 'w1' };
    win.parent = win;

    assert.equal(api.claim(win, '', '桌面章节页').claimed, true);
    assert.equal(win.__xxtChapterSubmit.state, 'submitting');
    // 跨 vm context 的对象原型不同，只能逐字段比较。
    const blocked = api.claim(win, '', '手机章节页');
    assert.equal(blocked.claimed, false, 'a fresh submitting lock must still block the other page');
    assert.equal(blocked.reason, 'already-submitted');
    assert.equal(blocked.source, '桌面章节页');

    // 平台回「无效的参数：code-1！」= 这次提交根本没进去，锁必须立刻回退成可重试。
    assert.equal(api.observe(win, '', '无效的参数：code -1!'), true);
    assert.equal(win.__xxtChapterSubmit.state, 'failed');
    assert.equal(api.failed(win, ''), true);
    assert.equal(api.claim(win, '', '手机章节页').claimed, true, 'a platform rejection must release the lock');

    // 平台卡住、页面被关：TTL 之后同样必须允许重试，否则章节永久停在「已提交」。
    win.__xxtChapterSubmit = { workId: 'w1', source: '桌面章节页', state: 'submitting',
        time: Date.now() - 61000 };
    assert.equal(api.claim(win, '', '手机章节页').claimed, true, 'an expired submitting lock must not block');

    // 已批阅是终态：任何情况下都不能被降级，也不能再重试。
    assert.equal(api.observe(win, '', '已批阅作业，不允许重复提交!'), true);
    assert.equal(win.__xxtChapterSubmit.state, 'reviewed');
    assert.equal(api.observe(win, '', '无效的参数：code -1!'), true);
    assert.equal(win.__xxtChapterSubmit.state, 'reviewed', 'a late failure alert must not downgrade a reviewed chapter');
    assert.equal(api.claim(win, '', '桌面章节页').claimed, false);
});

// 桌面章节页只看得到本页 results；手机章节页的 AI 请求在共享注册表里。提交前必须按
// pending 计数等待，绝不能 2 秒后硬提交一份「答了一半」的卷子。
test('submission waits for the chapter in-flight requests instead of submitting early', async () => {
    const from = script.indexOf('function aiChapterSubmitHost(');
    const to = script.indexOf('var GLOBAL = {', from);
    const context = vm.createContext({ console, Date, Map, URLSearchParams, Promise, setTimeout,
        aiTrace: () => {}, aiClip: (text, max) => String(text).slice(0, max) });
    vm.runInContext(script.slice(from, to) + `
globalThis.api = { pending: aiChapterPendingRequests, wait: aiWaitChapterPendingRequests };`, context);
    const api = context.api;
    const win = { location: { search: '' }, document: { getElementById: () => null } };
    win.parent = win;

    assert.equal(api.pending(win, 'w1'), 0, 'an empty registry means nothing is in flight');
    const requests = new Map();
    win.__xxtChapterQuestionRequests = new Map([['w1', requests]]);
    const startedAt = Date.now();
    requests.set('id:402563592', { state: 'pending', startedAt: startedAt });
    requests.set('id:402563590', { state: 'done', startedAt: startedAt });
    // 页面被关掉后没人收尾的令牌不能永远拖住提交。
    requests.set('id:stale', { state: 'pending', startedAt: startedAt - 300000 });
    assert.equal(api.pending(win, 'w1'), 1, 'only live in-flight requests count');
    assert.equal(api.pending(win, 'w2'), 0, 'another chapter must not be affected');

    const seen = [];
    const timer = setTimeout(() => requests.get('id:402563592').state = 'done', 120);
    const settled = await api.wait(win, 'w1', 20000, (pending, left) => seen.push(pending));
    clearTimeout(timer);
    assert.equal(settled.timedOut, false, 'the wait must end as soon as the registry is clear');
    assert.equal(settled.pending, 0);
    assert.ok(settled.waited >= 100, 'the wait must not resolve while a request is still pending');

    requests.set('id:402563592', { state: 'pending', startedAt: Date.now() });
    const timedOut = await api.wait(win, 'w1', 300, () => {});
    assert.equal(timedOut.timedOut, true, 'the wait must give up at the budget instead of hanging');
    assert.equal(timedOut.pending, 1);
});

// 共享注册表挂在顶层窗口上，切章时不会重建。只写不删的话，每切一章就永久留下
// 一份已销毁 iframe 的 document（令牌的 root 与 signature 闭包都指向它）。
// 回收必须保守：在途令牌影响提交等待、终态令牌影响跨页「已作答」去重，都不能误删，
// 所以当前正在处理的章节整条跳过，只回收已经被切走的章节。
test('chapter token registry reclaims dead chapters without dropping live coordination', () => {
    const from = script.indexOf('function aiChapterSubmitHost(');
    const to = script.indexOf('var GLOBAL = {', from);
    assert.ok(from !== -1 && to > from, 'the chapter submit coordination layer must be bounded');
    const context = vm.createContext({ console, Date, Map, URLSearchParams, Promise, setTimeout,
        aiTrace: () => {}, aiClip: (text, max) => String(text).slice(0, max) });
    vm.runInContext(script.slice(from, to) + `
globalThis.api = { pending: aiChapterPendingRequests, pruneRegistry: aiPruneChapterRegistry,
    pruneTokens: aiPruneChapterTokens, max: AI_CHAPTER_REGISTRY_MAX };`, context);
    const api = context.api;
    const now = Date.now();

    // 一章的正常状态：一道还在跑、一道刚答完还挂在本页 DOM 上、一道答在已销毁的 iframe 里。
    const requests = new Map();
    requests.set('id:pending', { state: 'pending', startedAt: now });
    requests.set('id:done-live', { state: 'done', startedAt: now, endedAt: now, root: { isConnected: true } });
    requests.set('id:done-detached', { state: 'done', startedAt: now, endedAt: now, root: { isConnected: false } });
    requests.set('id:stale-pending', { state: 'pending', startedAt: now - 300000 });
    requests.set('id:done-expired', { state: 'done', startedAt: now - 3600000, endedAt: now - 3600000,
        root: { isConnected: true } });
    // 空壳的旧章节、还有在途请求的旧章节、以及当前正在处理的章节。
    const registry = new Map([['work-empty', new Map()], ['work-busy',
        new Map([['id:other', { state: 'pending', startedAt: now }]])], ['w1', requests]]);

    api.pruneRegistry(registry, 'w2');
    assert.deepEqual(Array.from(requests.keys()).sort(), ['id:done-live', 'id:pending'],
        'detached and expired tokens must be reclaimed, live ones must stay');
    assert.equal(api.pending({ __xxtChapterQuestionRequests: registry }, 'w1'), 1,
        'the reclaimed stale pending token must stop holding back the chapter submit');
    assert.equal(registry.has('work-empty'), false, 'an emptied chapter entry must not linger');
    assert.equal(registry.has('work-busy'), true, 'a chapter with an in-flight request must be kept');

    // 当前章节整条跳过：它还要参与「另一页面已完成」的跨页去重，那一步不检查 isLive()。
    const current = new Map([['id:c', { state: 'done', startedAt: now, endedAt: now, root: { isConnected: false } }]]);
    const registry2 = new Map([['w-current', current]]);
    api.pruneRegistry(registry2, 'w-current');
    assert.equal(current.size, 1, 'the chapter being processed must keep its coordination state');

    // 硬上限：章节数再多也不能让注册表无限增长，且绝不清理当前章节。
    const big = new Map();
    for (let i = 0; i < api.max + 4; i++) {
        big.set('w' + i, new Map([['id:' + i, { state: 'done', startedAt: now, endedAt: now, root: { isConnected: true } }]]));
    }
    big.set('current', new Map([['id:cur', { state: 'done', startedAt: now, endedAt: now, root: { isConnected: true } }]]));
    api.pruneRegistry(big, 'current');
    assert.ok(big.size <= api.max, 'the registry must stay under its hard cap');
    assert.equal(big.has('current'), true, 'the chapter being processed must never be dropped');
    assert.equal(big.has('w' + (api.max + 3)), true, 'the newest chapters are the ones worth keeping');

    // 在途令牌一律不回收，哪怕节点已经不在了：AI 请求可能仍在写这一页的答案。
    const live = new Map([['id:x', { state: 'pending', startedAt: now, root: { isConnected: false } }]]);
    api.pruneTokens(live, now);
    assert.equal(live.has('id:x'), true, 'an in-flight request must survive pruning');
});

// 行为级校验：模拟真实桌面章节页的三段链路（validate 异步 → toadd 写清单 → workPop 确认），
// 确认脚本只在平台真的把清单写好之后才提交，绝不自己造一次空表单 POST。
test('desktop confirm helper only submits once the platform filled the pending list', async () => {
    const submitStart = script.indexOf('function desktopChapterSubmitWindows()');
    const submitEnd = script.indexOf('function desktopChapterTraceAlerts()', submitStart);
    assert.ok(submitStart !== -1 && submitEnd > submitStart, 'the desktop submit helpers must be bounded');
    const helpers = script.slice(submitStart, submitEnd);

    const build = (platformWritesList, verifyDialog) => {
        const document = {
            getElementById: id => {
                if (id === 'answerwqbid') return { value: platformWritesList ? '402563742,402563744,' : '' };
                // validate 回 status==2 时平台弹验证码，此时确认框永远不会出现。
                if (id === 'verifyCodeWin') return { style: { display: verifyDialog ? 'block' : 'none' } };
                return null;
            }
        };
        const calls = [];
        const win = {
            document,
            btnBlueSubmit() {
                calls.push('btnBlueSubmit');
                // 平台真实顺序：先发 /work/validate，回调里 toadd 写清单，最后弹确认框。
                setTimeout(() => {
                    // 平台被验证码拦住时不会回调 toadd，确认框压根不弹。
                    if (verifyDialog) return;
                    if (platformWritesList) document.getElementById('answerwqbid').value = '402563742,402563744,';
                    win.workPop('确认提交？', '提交', '取消', () => calls.push('submitCheckTimes'));
                }, 5);
            },
            workPop() { calls.push('workPop-fallback'); },
            submitCheckTimes() { calls.push('submitCheckTimes'); }
        };
        win.parent = win;
        win.top = win;
        const context = vm.createContext({
            console, Promise, setTimeout, Date, String,
            _self: win,
            sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
            aiTrace: () => {},
            aiChapterAlreadyReviewed: () => false,
            aiChapterSubmitFailed: () => false,
            aiChapterSubmitHost: () => win
        });
        vm.runInContext(helpers + '\nglobalThis.run = desktopChapterConfirmSubmit;\n' +
            'globalThis.note = () => desktopChapterSubmitNote;', context);
        return { calls, run: context.run, note: context.note, win };
    };

    const happy = build(true);
    assert.equal(await happy.run(), true, 'a platform-confirmed submit must report success');
    assert.deepEqual(happy.calls, ['btnBlueSubmit', 'submitCheckTimes'],
        'the submit must come from the platform confirm callback, not a manual call');
    assert.equal(happy.win.workPop('确认提交？', '提交', '取消', () => {}), undefined,
        'the workPop hook must be released after submitting');

    const broken = build(false);
    assert.equal(await broken.run(), false, 'an unconfirmable submit must not be reported as success');
    // 平台的确认框原样交给用户（workPop-fallback），绝不能自己发一次空表单提交。
    assert.deepEqual(broken.calls, ['btnBlueSubmit', 'workPop-fallback'],
        'an empty pending list must never produce a submit POST');
    assert.equal(broken.win.workPop('确认提交？', '提交', '取消', () => {}), undefined,
        'the workPop hook must be released even when the submit was refused');

    // validate 回 status==2（验证码）时平台不会回调 toadd，确认框压根不弹：
    // 必须立刻停下并报出验证码，不能让用户白等 15 秒，也不能谎报「凭证未就绪」。
    const verified = build(false, true);
    assert.equal(await verified.run(), false, 'a captcha-blocked submit must not be reported as success');
    assert.deepEqual(verified.calls, ['btnBlueSubmit'], 'a captcha block must not produce a submit POST');
    assert.match(verified.note(), /验证码/, 'the blocking reason must be reported to the panel');
});

test('confirm override defers to the platform unless the script holds the submit lock', () => {
    const from = script.indexOf('if (typeof _w.__xxtNativeConfirm !== \'function\')');
    assert.notEqual(from, -1, 'the confirm override must exist');
    const to = script.indexOf('if (parseFloat(rate) == parseInt(rate))', from);
    assert.ok(to > from, 'the confirm override must be bounded');
    const source = script.slice(from, to);

    // 原实现无条件 return true 并每 2 秒重设，等于让平台所有确认框失效。
    assert.ok(!/setInterval/.test(source), 'the 2s re-arm loop must not come back');
    assert.ok(!/^\s*return true;\s*$/m.test(source) || /__xxtNativeConfirm/.test(source),
        'the override must not unconditionally return true');

    const make = submitting => {
        const asked = [];
        const win = {
            confirm: msg => { asked.push(msg); return false; },
            top: submitting ? { __xxtChapterSubmit: { state: 'submitting' } } : {}
        };
        const context = vm.createContext({ _w: win, console });
        vm.runInContext(source, context);
        return { win, asked, call: msg => context._w.confirm(msg) };
    };

    // 未持有提交权 -> 必须回落到平台原生 confirm（用户点“取消”时要能取消）
    const idle = make(false);
    assert.equal(idle.call('确定要退出吗？'), false, 'platform confirm must still be able to deny');
    assert.deepEqual(idle.asked, ['确定要退出吗？'], 'the platform confirm must be reached');

    // 脚本持有提交权 -> 自动放行
    const busy = make(true);
    assert.equal(busy.call('确认提交？'), true, 'the script must be able to clear its own submit dialog');
    assert.deepEqual(busy.asked, [], 'the native confirm must be bypassed while submitting');
});

test('every @resource is a neutral CDN and every declared resource is actually read', () => {
    const header = script.slice(0, script.indexOf('==/UserScript=='));

    // 资源域名与会话无关：不得依赖第三方作者自有域名（审核与供应链风险）。
    const neutral = ['lib.baomitu.com', 'www.forestpolice.org'];
    const resources = [...header.matchAll(/^\/\/\s*@resource\s+(\S+)\s+(\S+)$/gm)];
    assert.ok(resources.length >= 4, 'the panel still needs its CDN resources');
    for (const [, name, url] of resources) {
        const host = new URL(url).host;
        assert.ok(neutral.includes(host), `unexpected @resource host for ${name}: ${host}`);
    }

    // 声明了却没人读 = 白等一次下载；读了却没声明 = 运行时拿不到内容。
    const body = script.slice(script.indexOf('==/UserScript=='));
    for (const [, name] of resources) {
        assert.ok(new RegExp(`GM_getResourceText\\(["']${name}["']\\)`).test(body),
            `@resource ${name} is declared but never read`);
    }
    for (const [, name] of body.matchAll(/GM_getResourceText\(["'](\w+)["']\)/g)) {
        assert.ok(resources.some(r => r[1] === name), `resource ${name} is read but not declared`);
    }
});

test('Element UI stylesheet version matches the Element UI script version', () => {
    const header = script.slice(0, script.indexOf('==/UserScript=='));
    const ver = name => {
        const m = header.match(new RegExp(`@resource\\s+${name}\\s+(\\S+)`));
        assert.ok(m, `@resource ${name} must be declared`);
        return m[1].match(/element-ui\/([\d.]+)\//)[1];
    };
    // 2.15.x 的 index.js 会为图标等组件依赖 2.15.x 的主题样式，混用旧样式会错位。
    assert.equal(ver('ElementUiCss'), ver('ElementUi'), 'theme-chalk must match element-ui');
});

test('the font-decrypt table machinery is gone instead of shipping dead code', () => {
    // getEncryptString/genTable 从未被调用，SourceTable 只为它们存在；留着等于白下载 850KB。
    for (const name of ['getEncryptString', 'genTable', 'SourceTable']) {
        assert.ok(!new RegExp(`(^|[^.\\w$])${name}\\b`, 'm').test(script),
            `${name} must be removed, it has no callers`);
    }
    // 仍然保留的 Table 2.0 是真正在用的字体映射。
    assert.match(script, /GM_getResourceText\("Table"\)/, 'the live font table must stay');
});

test('the update check is gone instead of shipping an inert chain', () => {
    // 脚本头没有 @downloadURL / @updateURL（未发布，也没有远端仓库），versionJsonUrl 永远返回空串，
    // checkVersion 会在发请求前 return，versionInfoFromResponse 在主流程里根本走不到。
    // 面板侧的 updateScript 也从未实现过 —— 整条链没有任何一处能真正生效，留着只会让人以为更新检查在工作。
    for (const name of ['checkVersion', 'versionInfoFromResponse', 'versionJsonUrl', 'updateScript']) {
        assert.ok(!new RegExp(`(^|[^.\\w$])${name}\\b`, 'm').test(script),
            `${name} must be removed, it has no live path`);
    }
    // 没有实际调用方时，这两个域名不能继续挂在 @connect 里骗审核。
    const header = script.slice(0, script.indexOf('// ==/UserScript=='));
    assert.ok(!/@connect\s+(?:[^/\s]*\.)?(?:greasyfork|scriptcat)\.org/i.test(header),
        'no @connect may exist for a host the script never reaches');
});

test('the legacy non-AI answer path and 智慧树 remnants are gone', () => {
    // 作答早已全部走 AI：`defaultFillAnswer` 只在旧「题库答案」分支里被选中过，现无调用点；
    // `getMost`/`getLang` 只服务于那条已删除的题库投票；`vm.zhihuishuSaveTip` 对应的智慧树流程也已移除。
    for (const name of ['defaultFillAnswer', 'getMost', 'getLang', 'zhihuishuSaveTip', 'saveTipHtml', 'SAVE_TIP_HTML']) {
        assert.ok(!new RegExp(`(^|[^.\\w$])${name}\\b`, 'm').test(script),
            `${name} must be removed, it has no callers`);
    }
    // 智慧树平台的题目解析函数同样没有任何 WorkerJSPlus 入口引用它们。
    for (const name of ['parseYkt', 'parsehnzkwText', 'parseDanWei', 'parseYxbyunExam']) {
        assert.ok(!new RegExp(`(^|[^.\\w$])${name}\\b`, 'm').test(script),
            `${name} is a 智慧树 remnant without a caller`);
    }
    // XXT_UI 只导出真正被用到的模板。
    assert.ok(!/saveTipHtml\s*:/.test(script), 'XXT_UI must not export an unused template');
});

test('the LLM settings entry works without the course panel (exam pages)', () => {
    // 考试/作业页只有悬浮面板，没有 #llmSettingsContainer；早期实现直接 alert 要求先去主面板，
    // 导致考生在考试页完全无法配置。现在必须降级成独立浮层卡片。
    assert.ok(!/请先打开学习通助手主面板/.test(script),
        'the panel-only alert must be gone, exam pages need to configure LLM directly');
    assert.ok(/var AI_SETTING_CARD_ID = "xxt-llm-setting-card"/.test(script), 'the card needs a stable id');
    const mountIdx = script.indexOf('function aiSettingMount(');
    assert.notEqual(mountIdx, -1, 'aiSettingMount must exist');
    const mountEnd = script.indexOf('function aiShowSettingTab(', mountIdx);
    assert.ok(mountEnd > mountIdx, 'aiSettingMount must have a boundary');
    const mountBody = script.slice(mountIdx, mountEnd);
    // 有容器就内嵌，没容器才建卡片：顺序反过来会让课程页也弹浮层。
    const containerIdx = mountBody.indexOf('getElementById("llmSettingsContainer")');
    const cardIdx = mountBody.indexOf('AI_SETTING_CARD_ID');
    assert.ok(containerIdx >= 0 && cardIdx > containerIdx, 'the container must be preferred over the floating card');

    // 关闭路径必须区分两种模式，否则卡片模式会去切一个不存在的页签。
    const closeIdx = script.indexOf('function aiCloseSettingWindow(');
    const closeEnd = script.indexOf('function aiTeardownSettingCard(', closeIdx);
    assert.ok(closeIdx >= 0 && closeEnd > closeIdx, 'aiCloseSettingWindow must have a boundary');
    const closeBody = script.slice(closeIdx, closeEnd);
    assert.ok(closeBody.indexOf('aiTeardownSettingCard') >= 0, 'closing a card must tear the card down');
    assert.ok(closeBody.indexOf('aiShowSettingTab') >= 0, 'closing inline mode must still switch back to the log tab');
    // 卡片移除后统计刷新不能继续写信箱里的旧 frame。
    assert.ok(/isConnected !== false/.test(script), 'aiStatAdd must not write into a detached frame');
});

test('the LLM form mounts when the panel renders, not only on a tab click', () => {
    // 桌面端取消了标签页之后，没有任何交互会把用户“带进” LLM 区块，
    // 只在 xxtShowTab('llm') 里挂载会让容器永远停在占位文案“正在加载 LLM 配置…”。
    assert.ok(/id="llmSettingsContainer"><p class="xxt-llm-placeholder">正在加载 LLM 配置…/.test(script),
        'the placeholder must still exist for the no-JS case');
    const renderIdx = script.indexOf('innerHTML = XXT_UI.pageHtml(');
    assert.notEqual(renderIdx, -1, 'the panel render site must exist');
    const mountCallIdx = script.indexOf('openAiSettingWindow(true)', renderIdx);
    const nextBoundaryIdx = script.indexOf("        var courseContentFrame = _d.getElementById('courseContent');", renderIdx);
    assert.ok(mountCallIdx > renderIdx && mountCallIdx < nextBoundaryIdx,
        'the panel must premount the LLM form right after rendering');
    // 预挂载必须是 silent 的：不能弹 alert，也不能把滚动位置拽到 LLM 区块。
    const openIdx = script.indexOf('function openAiSettingWindow(');
    const openEnd = script.indexOf('var iframe = doc.createElement("iframe");', openIdx);
    assert.ok(openIdx >= 0 && openEnd > openIdx, 'openAiSettingWindow must have a boundary');
    const openBody = script.slice(openIdx, openEnd);
    assert.ok(/function openAiSettingWindow\(silent\)/.test(openBody), 'the silent flag must be a parameter');
    const alerts = openBody.match(/alert\("页面尚未加载完成，请稍后再试"\)/g) || [];
    const guarded = openBody.match(/if \(!silent\) \{ try \{ alert\("页面尚未加载完成，请稍后再试"\)/g) || [];
    assert.ok(alerts.length > 0 && alerts.length === guarded.length,
        'every premature-mount alert must be skipped while premounting');
    assert.ok(/aiSettingMount\(doc, host, silent\)/.test(openBody), 'silent must reach aiSettingMount');
    const settingMountIdx = script.indexOf('function aiSettingMount(');
    const settingMountBody = script.slice(settingMountIdx, script.indexOf('function aiShowSettingTab(', settingMountIdx));
    assert.ok(/if \(!silent\) aiShowSettingTab\(host, "llm"\);/.test(settingMountBody),
        'premounting must not hijack the scroll position');
});

test('the LLM settings live inside the task config panel instead of its own card', () => {
    // 用户反馈：LLM 配置占了一整张卡片，跟任务配置分成两处，得来回找。
    // 现在它并进顶部「任务配置」，用 #llmToggleButton 控制展开，避免 640px 的表单一直占满首屏。
    const uiStart = script.indexOf('var XXT_UI = (function () {');
    const uiEnd = script.indexOf('// ==================== UI 模块结束', uiStart);
    assert.ok(uiStart >= 0 && uiEnd > uiStart, 'the UI module must have a boundary');
    const uiSource = script.slice(uiStart, uiEnd);
    const template = vm.runInNewContext(uiSource + '\nXXT_UI;', {}).pageHtml({ aiStatusText: 'AI已关闭' });

    assert.ok(!/data-pane="llm"/.test(template), 'the standalone LLM card must be gone');
    const configStart = template.indexOf('id="normalQuery"');
    const gridStart = template.indexOf('class="xxt-grid"');
    assert.ok(configStart >= 0 && gridStart > configStart, 'the task config panel must precede the grid');
    const configPanel = template.slice(configStart, gridStart);
    assert.ok(configPanel.includes('id="llmSettingsContainer"'), 'the LLM form container must sit inside 任务配置');
    // 模板里 id 引号单双混用（历史原因），断言必须两种都认。
    assert.match(configPanel, /id=['"]aiStatus['"]/, 'the LLM status line must sit inside 任务配置');
    assert.match(configPanel, /id=['"]llmToggleButton['"]/, 'the LLM block needs a toggle button');
    assert.match(configPanel, /id="llmPanel" style="display: none;"/,
        'the LLM block must start collapsed, otherwise the course card is pushed off screen');
    assert.equal(template.match(/id=['"]aiStatus['"]/g).length, 1, 'the status line may not be duplicated');
    assert.equal(template.split('id="llmSettingsContainer"').length - 1, 1, 'the form container may not be duplicated');

    // 开关与滚动入口必须真的接上，否则按钮点了没反应。
    const toggleIdx = script.indexOf('var xxtSetLlmPanel = function (open)');
    assert.notEqual(toggleIdx, -1, 'xxtSetLlmPanel must exist');
    const toggleEnd = script.indexOf('var xxtScrollTo = function (target)', toggleIdx);
    assert.ok(toggleEnd > toggleIdx, 'xxtSetLlmPanel must have a boundary');
    const toggleBody = script.slice(toggleIdx, toggleEnd);
    assert.match(toggleBody, /llmPanelEl\.style\.display = next \? 'block' : 'none'/);
    assert.match(toggleBody, /aria-expanded/, 'the toggle must expose its state for accessibility');
    assert.match(toggleBody, /llmToggleEl\.addEventListener\('click'/, 'clicking the button must toggle the block');
});

test('the config backup covers every LLM key the save path writes', () => {
    // @storageName 一旦改名，GM 存储命名空间随之改变，旧命名空间里的 ai_* 配置就读不回来了
    // （GM API 没有跨命名空间读取能力，@grant 里也没有 GM_listValues），
    // 所以唯一可行的迁移手段是用户自己把旧配置导出、在新版里导入。
    // 备份白名单必须覆盖保存路径写入的每一个键，否则导入后会「看起来恢复了其实少几项」。
    const saveBlockStart = script.indexOf('GM_setValue("ai_mode"');
    assert.notEqual(saveBlockStart, -1, 'the LLM save block must exist');
    // 保存块的最后一个写库语句是 ai_skip_answered；用它当结尾比用提示文案稳，文案改动不会让守卫失效。
    const skipIdx = script.indexOf('GM_setValue("ai_skip_answered"', saveBlockStart);
    assert.ok(skipIdx > saveBlockStart, 'the LLM save block must end with ai_skip_answered');
    const saveBlockEnd = script.indexOf('\n', skipIdx);
    assert.ok(saveBlockEnd > skipIdx, 'the LLM save block must have a boundary');
    const savedKeys = new Set(
        Array.from(script.slice(saveBlockStart, saveBlockEnd).matchAll(/GM_setValue\("(ai_[a-z_]+)"/g), m => m[1])
    );
    assert.ok(savedKeys.size >= 17, `expected at least 17 saved ai_* keys, got ${savedKeys.size}`);

    const whitelistStart = script.indexOf('function aiBackupKeys()');
    assert.notEqual(whitelistStart, -1, 'aiBackupKeys must exist');
    const whitelistEnd = script.indexOf('function aiBackupExport()', whitelistStart);
    assert.ok(whitelistEnd > whitelistStart, 'aiBackupKeys must have a boundary');
    const backupKeys = new Set(
        Array.from(script.slice(whitelistStart, whitelistEnd).matchAll(/"((?:ai_)[a-z_]+)"/g), m => m[1])
    );

    for (const key of savedKeys) {
        assert.ok(backupKeys.has(key), `${key} is saved but missing from aiBackupKeys, an export would lose it`);
    }

    // 导出的 JSON 必须带标识，导入时才能识别出「粘错了东西」而不是静默写入空配置。
    assert.match(script, /xxtConfig:\s*"llm"/, 'the export payload must self-identify');
    assert.match(script, /function aiBackupImport/, 'an import path must exist');
    // 导入只允许写白名单键，不能把任意键塞进 GM 存储。
    assert.match(script, /Object\.prototype\.hasOwnProperty\.call\(parsed,\s*keys\[i\]\)/,
        'import must whitelist keys instead of trusting the pasted object');
});

test('an unset AI mode follows the saved endpoint instead of defaulting to off', () => {
    // 真实故障复现：用户填好接口地址与 Key、点保存，日志仍然刷「LLM 未启用或未配置」，
    // 因为「AI 答题」下拉框默认停在「关闭」，aiCfg 又把「没有 ai_mode」当成关闭。
    // 规则应为：没有 ai_mode 时，只要已经存了接口地址就按开启处理。
    const cfgStart = script.indexOf('function aiCfg()');
    const cfgEnd = script.indexOf('function aiEndpoint(base)', cfgStart);
    assert.ok(cfgStart >= 0 && cfgEnd > cfgStart, 'aiCfg must be extractable');

    const run = stored => {
        const context = vm.createContext({
            AI_MODEL_DEFAULT: 'deepseek-flash',
            AI_SYSTEM_DEFAULT: 'sys',
            AI_USER_DEFAULT: 'usr',
            AI_RESPONSE_PATH_DEFAULT: 'choices.0.message.content',
            AI_TIMEOUT_DEFAULT: 22000,
            AI_RETRY_DEFAULT: 2,
            AI_CONCURRENCY_DEFAULT: 2,
            XXTFoundation: {
                get: (key, fallback) => (key in stored ? stored[key] : fallback),
                enabled: value => value === true || value === 'true' || value === 1 || value === '1',
                text: (value, fallback) => String(value == null ? '' : value).trim() || (fallback || ''),
                number: (value, fallback, minimum) => {
                    const parsed = Number(value);
                    if (!isFinite(parsed) || (minimum != null && parsed < minimum)) return fallback;
                    return parsed;
                }
            }
        });
        vm.runInContext(script.slice(cfgStart, cfgEnd) + '\nglobalThis.mode = aiCfg().mode;', context);
        return context.mode;
    };

    assert.equal(run({}), 'off', 'nothing configured at all must stay off, video/document tasks keep working');
    assert.equal(run({ ai_url: 'https://api.deepseek.com' }), 'first',
        'a saved endpoint with no explicit ai_mode must count as enabled, that is the bug this fixes');
    assert.equal(run({ ai_url: 'https://api.deepseek.com', ai_mode: 'off' }), 'off',
        'an explicit off choice must still be respected');
    assert.equal(run({ ai_mode: 'first' }), 'first');
    assert.equal(run({ ai_enable: 1 }), 'first', 'legacy ai_enable must keep working');

    // 默认超时/重试/并发必须落在推荐值上（22s / 2 次 / 2），否则新装用户会继承旧的大超时。
    const defaultRun = (() => {
        const context = vm.createContext({
            AI_MODEL_DEFAULT: 'deepseek-flash',
            AI_SYSTEM_DEFAULT: 'sys',
            AI_USER_DEFAULT: 'usr',
            AI_RESPONSE_PATH_DEFAULT: 'choices.0.message.content',
            AI_TIMEOUT_DEFAULT: 22000,
            AI_RETRY_DEFAULT: 2,
            AI_CONCURRENCY_DEFAULT: 2,
            XXTFoundation: {
                get: (key, fallback) => fallback,
                enabled: value => value === true || value === 'true' || value === 1 || value === '1',
                text: (value, fallback) => String(value == null ? '' : value).trim() || (fallback || ''),
                number: (value, fallback, minimum) => {
                    const parsed = Number(value);
                    if (!isFinite(parsed) || (minimum != null && parsed < minimum)) return fallback;
                    return parsed;
                }
            }
        });
        vm.runInContext(script.slice(cfgStart, cfgEnd) + '\nglobalThis.cfg = aiCfg();', context);
        return context.cfg;
    })();
    assert.equal(defaultRun.timeout, 22000, 'default per-request timeout must be 22000ms');
    assert.equal(defaultRun.retries, 2, 'default retry count must be 2');
    assert.equal(defaultRun.concurrency, 2, 'default concurrency must be 2');

    // 保存时也要兜住「填了地址和 Key 但下拉框还是关闭」：否则用户必须找到那个下拉框才能答题。
    // 判据必须是「这次保存改动了凭据」，否则用户把下拉框改回关闭再保存，会被自己反复打开。
    const saveStart = script.indexOf('if (d.type === "save")');
    const saveEnd = script.indexOf('GM_setValue("ai_mode"', saveStart);
    const saveHead = script.slice(saveStart, saveEnd);
    assert.match(saveHead, /credChanged = aiEndpoint\(cfg\.url\) !== prevUrl \|\| cfg\.key !== prevKey/,
        'auto-enable must key off changed credentials, not merely a filled-in form');
    assert.match(saveHead, /prevUrl = aiEndpoint\(String\(GM_getValue\("ai_url"/,
        'the previous credential must be read from storage, not from the submitted form');
    assert.match(saveHead, /cfg\.mode === "off" && credChanged && aiEndpoint\(cfg\.url\) && cfg\.key/,
        'saving a new endpoint + key while the dropdown still says off must auto-enable');
    assert.match(saveHead, /autoEnabled = true/, 'auto-enable must be flagged so the reply can say so');
});

test('the storage namespace is frozen and documented as unchangeable after release', () => {
    // 脚本管理器把 @storageName 当作 GM 存储命名空间，改名等于清空所有用户配置。
    // 历史上已经改过三次（unrivalxxt → fssdwwxxt → li_stu_xxt），每次都丢一次配置。
    const header = script.slice(0, script.indexOf('// ==/UserScript=='));
    const match = header.match(/^\/\/\s*@storageName\s+(\S+)\s*$/m);
    assert.ok(match, '@storageName must stay declared explicitly, relying on @namespace would re-collide with upstream');
    assert.equal(match[1], 'li_stu_xxt', '@storageName must never change again once released');

    // 迁移代码在技术上写不出来（GM 无法跨命名空间读取），所以脚本里不应该出现假装能迁移的残留。
    for (const name of ['migrateStorage', 'migrateFromNamespace', 'GM_listValues', 'legacyStorageName']) {
        assert.ok(!new RegExp(`(^|[^.\\w$])${name}\\b`, 'm').test(script),
            `${name} cannot work under the GM API and must not be faked`);
    }
});

test('the NuoAPI entry is a plain link with no tracking parameter', () => {
    // 2026-11 起取消推广参数：链接只剩裸注册地址，任何 aff/ref/utm 残留都会被用户当成偷偷带量，
    // 而带了参数又没声明 @antifeature referral-link 属于 Greasyfork 规则违反，所以两端必须同时干净。
    const PLAIN = 'https://nuoapi.net/register';
    const registerHits = script.match(/https?:\/\/nuoapi\.net\/register[^"'\s)]*/g) || [];
    assert.ok(registerHits.length >= 2, 'both the settings row and the failure hint must offer the entry');
    for (const url of registerHits) {
        assert.equal(url, PLAIN, 'the register URL must stay bare, the settings row and the hint must be identical');
    }
    for (const param of ['aff=', 'referral', 'invite', 'ref=', 'utm_', 'source=']) {
        assert.ok(!script.includes(`nuoapi.net/register?${param}`),
            `the register URL must not carry a tracking parameter: ${param}`);
    }
    for (const wrapper of ['bit.ly', 't.cn', 'tinyurl', 'dwz.cn', 'suo.im']) {
        assert.ok(!script.includes(wrapper), `no short-link wrapper may stand in for the register link: ${wrapper}`);
    }
    // 入口只出现在「什么都没填」这一支：另外两支用户已经配过东西，再推销属于骚扰。
    const hintStart = script.indexOf('function aiDisabledHint()');
    const hintEnd = script.indexOf('function aiModeLabel(cfg)', hintStart);
    const hint = script.slice(hintStart, hintEnd);
    assert.equal(hint.split('nuoapi.net/register').length - 1, 1, 'the hint must offer the link exactly once');
    const branches = hint.split('return ');
    assert.ok(!branches[1].includes('nuoapi.net/register'), 'the URL-empty branch must not advertise');
    assert.ok(!branches[2].includes('nuoapi.net/register'), 'the mode-off branch must not advertise');
});

test('no referral antifeature is claimed while the script carries no referral link', () => {
    // Greasyfork 规则双向约束：有推广链接必须声明，没有就不能虚报。
    // 链接已改为裸地址，于是 referral-link 声明也必须同步删除，否则等于向审核撒谎。
    const header = script.slice(0, script.indexOf('==/UserScript=='));
    assert.ok(!/referral-link/.test(header), 'referral-link must be withdrawn together with the affiliate parameter');
    // payment 不能顺手删掉：它如实说明 AI 答题依赖第三方付费接口。
    assert.ok(header.includes('@antifeature payment'), 'the payment antifeature must stay');
});

test('the discovery tags stay inside the study-helper wording and never promise Zhihuishu', () => {
    // 脚本猫的「标签」下拉是禁用态，只解析脚本头部的 @tag，所以标签只能靠元数据提供。
    // 用词必须停在「学习辅助 / 效率工具」的口径内，并且不能挂智慧树——那条分支 v2.38 已整体移除。
    const header = script.slice(0, script.indexOf('==/UserScript=='));
    const tags = Array.from(header.matchAll(/^\/\/\s*@tag\s+(\S+)\s*$/gm), (m) => m[1]);
    assert.ok(tags.length >= 5, `expected at least 5 discovery tags, got ${tags.length}`);
    for (const required of ['超星学习通', '学习辅助', '答题辅助']) {
        assert.ok(tags.includes(required), `${required} is a high-frequency search term on ScriptCat and must stay`);
    }
    for (const banned of ['刷课工具', '自动挂课', '免费搜题', '知到智慧树']) {
        assert.ok(!tags.includes(banned), `${banned} must not be used: it is either grey-area wording or a promise the script no longer keeps`);
    }
});

test('the embedded Typr.js keeps its source and license notice', () => {
    // Greasyfork 要求内嵌库注明来源；MIT 要求保留版权与许可声明。两者都靠这段注释满足。
    const at = script.indexOf('var Typr = {};');
    assert.ok(at > 0, 'the embedded Typr parser must stay');
    const notice = script.slice(Math.max(0, at - 2000), at);
    assert.match(notice, /photopea\/Typr\.js/, 'the upstream URL must be named above the embedded library');
    assert.match(notice, /MIT/, 'the license must be named above the embedded library');
    assert.match(notice, /Copyright \(c\) 2016 Photopea/, 'the MIT copyright line must be preserved');
    // 许可全文必须随仓分发，否则 MIT 要求的 "included in all copies" 不成立。
    const notices = fs.readFileSync(path.join(__dirname, 'THIRD-PARTY-NOTICES.md'), 'utf8');
    assert.match(notices, /Copyright \(c\) 2016 Photopea/, 'THIRD-PARTY-NOTICES must carry the full Typr MIT text');
    assert.match(notices, /wyn665817/, 'THIRD-PARTY-NOTICES must credit the font table author');
});

test('the legacy question-bank answer path is gone instead of shipping dead code', () => {
    // v2.37 起作答全部走 AI，题库比对链路没有调用方了，留着只会误导后来的人以为还在用题库。
    for (const name of ['getAnswerForKey', 'getAnswer', 'similar', 'answerSimilar', 'isPlainAnswer', 'save_setting']) {
        assert.ok(!new RegExp(`(^|[^.\\w$])${name}\\b`, 'm').test(script),
            `${name} must be removed, it has no callers`);
    }

    // search_delay 曾是「查题间隔」设置项，现在已经没有面板入口，只能靠题量常量驱动节奏。
    assert.ok(!/search_delay/.test(script), 'search_delay must be replaced by GLOBAL.questionInterval');
    assert.match(script, /questionInterval:\s*\d+/, 'the per-question interval must stay configurable');
    // 逐题节奏过密会被平台判定异常，所以低于 10 秒的取值必须被抬到 12 秒。
    assert.match(script, /function questionIntervalSeconds\(\)/, 'the interval floor helper must exist');
    assert.match(script, /value < 10 \? 12 : value/, 'intervals under 10s must be raised to 12s');
    assert.ok(!/GLOBAL\.questionInterval \* 1e3/.test(script), 'callers must go through questionIntervalSeconds()');

    // 「跳过已作答」的题目不调 AI，没必要再等风控间隔，否则整卷答完会白等 12s × 题量。
    assert.match(script, /var AI_SKIP_ANSWERED_DELAY_MS = \d+;/, 'the skip-answered fast path needs its own short delay');
    assert.match(script, /await sleep\(noAiNeeded \? AI_SKIP_ANSWERED_DELAY_MS : answerIntervalMs\(\)\)/,
        'the loop must use the short delay when the next question is already answered or the queue is empty');
    assert.match(script, /const noAiNeeded = !GLOBAL\.stop && \(pendingItem \? \(aiSkipAnswered\(\) && isDomQuestionAnswered\(pendingItem\)\) : lastIterationSkipped\);/,
        'skip detection must reuse the same answered check the skip branch uses');

    // 固定到秒的节奏本身就是特征，逐题与保存都要在固定基数上叠随机浮动。
    assert.match(script, /answerJitter:\s*\d+/, 'the per-question jitter must stay configurable');
    assert.match(script, /saveJitter:\s*\d+/, 'the save/submit jitter must stay configurable');
    assert.match(script, /function answerIntervalMs\(\) \{[\s\S]*?questionIntervalSeconds\(\) \* 1e3 \+ jitterMs\(/,
        'the per-question wait must add jitter on top of the risk-control interval');
    assert.match(script, /function saveDelayMs\(baseMs\) \{[\s\S]*?\+ jitterMs\(/,
        'save/submit waits must add jitter on top of their fixed base');
    // 浮动量必须是 [0, 上限) 区间：Math.random() 返回 0 时不加，回归测试才拿得到确定时长。
    assert.match(script, /Math\.floor\(Math\.random\(\) \* range \* 1e3\)/,
        'jitter must stay random-but-bounded so fixtures remain deterministic at Math.random() === 0');
    // 逐题节奏不得绕过 answerIntervalMs 退回裸的固定间隔。
    assert.ok(!/questionIntervalSeconds\(\) \* 1e3\)/.test(script.replace(/function answerIntervalMs[\s\S]*?\n}/, '')),
        'per-question waits must go through answerIntervalMs() so they carry jitter');

    // 没有任何选择题选择器声明 answer 元素，所以 getAnswer 那条分支永远走不到。
    for (const [, body] of script.matchAll(/elements:\s*\{([\s\S]*?)\n\s*\},/g)) {
        assert.ok(!/(^|[{\s,])answer\s*:/.test(body), 'no selector profile may declare an answer element');
    }

    // 用户可见文案不得再出现题库时代的说法。
    for (const stale of ['相似答案', '查看相关答案', '搜索框', '暂停搜索', '继续搜索']) {
        assert.ok(!script.includes(stale), `stale question-bank wording must be gone: ${stale}`);
    }
});

// —— 超星风控（antispider）验证码 ——
// 平台会把业务请求 302 到 /antispiderShowVerify.ac 并回一张要输入图片验证码的 HTML。
// 这些回包必须被认出来，否则 JSON.parse 失败会被当成「接口错误」，任务进入 failed 终态，
// 用户做完验证也接不回来，整章只能重来。
test('antispider verify pages are recognised from the response body or the redirect target', () => {
    // 真实验证页的标题与提示文案（issue Samueli924/chaoxing#510）。
    const verifyPage = '<html><head><title>提示页面</title></head><body>' +
        '<p>【9010】操作异常，请输入图片中的验证码</p>' +
        '<img src="/processVerifyPng.ac?t=1699999999999"></body></html>';
    assert.equal(riskMark(verifyPage), 'antispider');
    assert.equal(riskMark('<p>请输入图片中的验证码</p>'), 'antispider');
    assert.equal(riskMark('<p>【9010】操作异常</p>'), 'antispider');
    // 302 后的地址由脚本管理器回传时可能出现在 finalUrl 里，同样要认。
    assert.equal(riskMark('{}', 'https://mooc1.chaoxing.com/antispiderShowVerify.ac'), 'antispider');
    assert.equal(riskMark('', '', 'location: /antispiderShowVerify.ac'), 'antispider');
    assert.equal(riskMark('<img src="/processVerifyPng.ac?t=1">'), 'antispider', 'the captcha image must be enough');
    assert.equal(riskMark('', 'https://mooc1.chaoxing.com/processVerifyPng.ac?t=1'), 'antispider',
        'a verify endpoint in the redirect target must be enough even with an empty body');
    assert.equal(riskMark('', 'https://mooc1.chaoxing.com/ananas/status/1'), '', 'a business endpoint must not match');

    // 正常业务回包不能被误判，否则每次上报都会被当成风控。
    assert.equal(riskMark('{"isPassed":true,"duration":600}'), '');
    assert.equal(riskMark('success'), '');
    assert.equal(riskMark(''), '');
    assert.equal(riskMark(null, undefined), '');
    assert.equal(riskMark('{"status":true}', 'https://mooc1.chaoxing.com/ananas/status/1'), '');
});

test('the verify link points at a page a human can actually solve', () => {
    // 早期实现把上报接口当 href，用户点开只看得到一段 JSON。
    const url = riskUrl('https:', 'mooc1.chaoxing.com');
    assert.equal(url, 'https://mooc1.chaoxing.com/antispiderShowVerify.ac');
    assert.ok(!/saveTimePc|ananas|processVerify/.test(url), 'the link must not point at a business endpoint');
    assert.equal(riskUrl('', ''), 'https:///antispiderShowVerify.ac', 'missing inputs must not throw');
});

test('every antispider-aware request reports a pause instead of a terminal failure', () => {
    // 回归防线：这几处 onload 一旦退回「解析失败 / 任务失败」，验证完就再也接不回来。
    for (const [label, from, to] of [
        ['video readiness', 'const videoReadyRequests = new Set();', 'doVideo ='],
        ['document', 'doDocument = (item) => {', 'doWork ='],
        ['ananas task', 'doAnanasTask = (item, spec, label) => {', 'doBook ='],
        ['live', 'doLive = (item) => {', 'missionList = Object.create(null),']
    ]) {
        const start = script.indexOf(from);
        const end = script.indexOf(to, start);
        assert.ok(start >= 0 && end > start, label + ' block must be bounded');
        const block = script.slice(start, end);
        assert.match(block, /xxtRiskControlMark\(/, label + ' must detect an antispider response');
        assert.match(block, /xxtRiskControlEnter\(/, label + ' must pause instead of failing the mission');
    }

    // 视频进度上报是最常撞风控的一步，也必须走同一套暂停逻辑。
    const progressFrom = script.indexOf('let reportsUrl = reportUrl');
    const progressTo = script.indexOf('onerror: function (err) {', progressFrom);
    assert.ok(progressFrom >= 0 && progressTo > progressFrom, 'the video progress block must be bounded');
    const progress = script.slice(progressFrom, progressTo);
    assert.match(progress, /xxtRiskControlMark\(/, 'the video progress report must detect an antispider response');
    assert.match(progress, /xxtRiskControlEnter\('video-progress'\)/,
        'a blocked progress report must pause the mission, not stop the engine');
    assert.ok(!/stop = true/.test(progress), 'an antispider response must never stop the whole engine');
    assert.ok(!/_l\.reload\(\)/.test(progress), 'a captcha must not force an unexplained page reload');
});

test('a risk-control pause keeps missions alive and resumes them on demand', () => {
    const timers = new Map();
    let timerId = 0;
    const logs = [];
    const retried = [];
    const sandbox = vm.createContext({
        console, Date, Math, String, Number, _p: 'https:', _h: 'mooc1.chaoxing.com',
        stop: false, loopJobEnded: false,
        logs: { addLog: message => logs.push(message) },
        _d: { getElementById: () => null }, _w: {},
        xxtFormatPlaybackTime: seconds => String(seconds) + 's',
        setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
        clearTimeout: id => timers.delete(id)
    });
    // 暂停/恢复是调度器的一部分，测试直接跑生产实现。
    const from = script.indexOf('            loopJobTimer = null,');
    const to = script.indexOf('            loopjob = () => {', from);
    assert.ok(from >= 0 && to > from, 'the risk-control state machine must be bounded');
    const helperFrom = script.indexOf('function xxtRiskControlMark(');
    const helperTo = script.indexOf('function xxtFormatPlaybackTime(seconds)', helperFrom);
    assert.ok(helperFrom >= 0 && helperTo > helperFrom, 'the verify-link helper must exist');
    vm.runInContext(script.slice(helperFrom, helperTo) + '\nvar ' + script.slice(from, to).replace(/,\s*$/, ';') +
        '\nglobalThis.api = { enter: xxtRiskControlEnter, leave: xxtRiskControlLeave, state: riskControl };', sandbox);
    const api = sandbox.api;

    assert.equal(api.state.active, false);
    api.enter('video-progress', () => retried.push('video'));
    assert.equal(api.state.active, true);
    assert.equal(api.state.scene, 'video-progress');
    assert.equal(api.state.url, 'https://mooc1.chaoxing.com/antispiderShowVerify.ac');
    assert.equal(logs.length, 1);
    assert.match(logs[0], /验证码/);
    assert.match(logs[0], /暂停/);
    // 暂停期间要有心跳，否则用户验证完之后脚本永远不会再动。
    assert.equal(timers.size, 1);
    assert.equal(Array.from(timers.values())[0].delay, 3000);

    // 重复撞验证不应刷屏，但重试动作要都记住。
    api.enter('document', () => retried.push('document'));
    assert.equal(logs.length, 1, 'the pause must only be announced once');

    api.leave();
    assert.equal(api.state.active, false);
    assert.deepEqual(retried, ['video', 'document'], 'every blocked mission must be retried after verification');
    assert.equal(logs.length, 2);
    assert.match(logs[1], /已恢复运行/);
    assert.equal(timers.size, 1, 'resuming must reschedule the scheduler exactly once');
});

test('the panel exposes a verify entry and a resume button', () => {
    const page = script.slice(script.indexOf('var PAGE_HTML'), script.indexOf('var SETTINGS_HTML'));
    assert.match(page, /id="riskControlBar"/, 'the panel must carry a risk-control bar');
    assert.match(page, /id="riskControlVerifyButton"/, 'the user needs a link to the verify page');
    assert.match(page, /id="riskControlResumeButton"/, 'the user needs a way to resume the run');
    assert.match(page, /target="_blank"/, 'the verify page must open in a new tab so the run page keeps its state');
    assert.match(page, /rel="noopener"/, 'an outbound verification link must not gain a window handle');

    // 按钮必须真的接上状态机，否则 UI 只是装饰。
    assert.match(script, /riskControlResumeButton[\s\S]{0,160}xxtRiskControlLeave\(\)/,
        'the resume button must clear the pause');
    assert.match(script, /riskControlVerifyButton'\)[\s\S]{0,160}riskControl\.url/,
        'the verify link must carry the real verify URL');
});

test('a blocked chapter submit is reported as a verification request and stays retryable', () => {
    // 桌面提交：整页被 302 到验证页时 #verifyCodeWin 根本不会出现。
    const blockerFrom = script.indexOf('function desktopChapterSubmitBlocker()');
    const blockerTo = script.indexOf('let desktopChapterSubmitNote', blockerFrom);
    assert.ok(blockerFrom >= 0 && blockerTo > blockerFrom, 'the submit blocker must be bounded');
    const blocker = script.slice(blockerFrom, blockerTo);
    assert.match(blocker, /xxtRiskControlMark\(/, 'the submit blocker must recognise an antispider redirect');
    assert.match(blocker, /验证码/, 'the reported reason must mention the verification code');

    // alert 通道里的【9010】也要被记成拦截原因。
    const observerFrom = script.indexOf('const observed = function (message) {');
    const observerTo = script.indexOf('target.alert = observed;', observerFrom);
    assert.ok(observerFrom >= 0 && observerTo > observerFrom, 'the alert observer must be bounded');
    assert.match(script.slice(observerFrom, observerTo), /xxtRiskControlMark\(text\)/,
        'an antispider alert must be remembered as the block reason');
});
