const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sourcePath = path.resolve(__dirname, '超星学习通助手.user.js');
const outputPath = path.resolve(__dirname, '超星学习通助手调试.html');

if (!fs.existsSync(sourcePath)) {
    console.error(`找不到用户脚本：${sourcePath}`);
    process.exitCode = 1;
    return;
}

const source = fs.readFileSync(sourcePath, 'utf8');

function slice(from, to, label) {
    const start = source.indexOf(from);
    const end = source.indexOf(to, start);
    if (start < 0 || end <= start) {
        console.error(`没有找到${label}，请检查用户脚本结构是否已变化。`);
        process.exitCode = 1;
        return null;
    }
    return source.slice(start, end);
}

const moduleSource = slice('var XXT_UI = (function () {', '// ==================== UI 模块结束', ' UI 模块');
if (!moduleSource) return;

// UI 模块只依赖字符串与 JSON，可以直接在 Node 里求值拿到最终模板。
const ui = vm.runInNewContext(moduleSource + '\nXXT_UI;', {});
const template = ui.pageHtml({ aiStatusText: 'AI已关闭' });
if (!template.includes('id="normalQuery"') || !template.includes('id="llmSettingsContainer"') ||
    !template.includes('id="llmPanel"') || !template.includes('id="courseSection"') || !template.includes('id="log"')) {
    console.error('学习通助手主页面板结构异常，请检查 XXT_UI.pageHtml 是否完整。');
    process.exitCode = 1;
    return;
}

const settingsLiteral = JSON.stringify(ui.settingsHtml()).replace(/<\/script/gi, '<\\/script');

const html = template.replace(
    '</body>',
    `    <script>
        (function () {
            const settingsHtml = ${settingsLiteral};

            function mountSettings() {
                const container = document.getElementById('llmSettingsContainer');
                if (container && !container.querySelector('iframe')) {
                    const frame = document.createElement('iframe');
                    frame.title = 'LLM 配置';
                    frame.style.cssText = 'display:block;width:100%;min-height:520px;border:0;background:#f3f6f9';
                    frame.srcdoc = settingsHtml.replace('__AI_NONCE__', 'debug-preview');
                    container.textContent = '';
                    container.appendChild(frame);
                }
            }
            mountSettings();

            document.getElementById('log').innerHTML =
                '<span style="color: green">[调试] 页面模板加载成功</span><br>' +
                '<span style="color: #526273">[调试] 当前为独立预览，不会访问超星接口</span>';

            document.getElementById('courseContent').srcdoc =
                '<!doctype html><html><body style="font-family:Microsoft YaHei;padding:24px;color:#263445">' +
                '<h3>课程内容预览区域</h3><p>这里可以替换成需要调试的卡片 HTML。</p>' +
                '<div style="padding:16px;border:1px solid #d7e1eb;border-radius:6px;background:#f8fafc">' +
                '示例课程卡片</div></body></html>';

            document.getElementById('frame_content').srcdoc =
                '<!doctype html><html><body style="font-family:Microsoft YaHei;padding:24px">' +
                '章节测试预览区域</body></html>';

            // 课程卡片默认展示课程内容；调试页通过 window.xxtDebugSetCourseMode 切换两种模式。
            const courseSection = document.getElementById('courseSection');
            const workStateTip = document.getElementById('workStateTip');
            window.xxtDebugSetCourseMode = function (mode) {
                if (!courseSection) return;
                const isWork = mode === 'work';
                courseSection.setAttribute('data-mode', isWork ? 'work' : 'course');
                document.getElementById('workPanel').style.display = isWork ? 'block' : 'none';
                document.getElementById('workEmpty').style.display = isWork ? 'none' : 'block';
                if (workStateTip) workStateTip.textContent = isWork ? '正在作答：调试章节测试' : '暂无进行中的章节测试';
            };
            window.xxtDebugSetCourseMode('course');

            // LLM 表单并进顶部任务配置，默认收起；调试页提供同样语义的开关。
            const llmPanel = document.getElementById('llmPanel');
            const llmToggle = document.getElementById('llmToggleButton');
            window.xxtDebugSetLlmPanel = function (open) {
                if (!llmPanel) return;
                llmPanel.style.display = open ? 'block' : 'none';
                if (llmToggle) {
                    llmToggle.textContent = open ? '收起设置' : '展开设置';
                    llmToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                }
            };
            if (llmToggle) {
                llmToggle.addEventListener('click', function () {
                    window.xxtDebugSetLlmPanel(llmPanel && llmPanel.style.display === 'none');
                });
            }
            window.xxtDebugSetLlmPanel(false);

            document.getElementById('previewPlayButton').addEventListener('click', function () {
                this.classList.toggle('btn-success');
                this.classList.toggle('btn-default');
            });
        }());
    </script>
</body>`);

fs.writeFileSync(outputPath, html, 'utf8');
console.log(`已生成：${outputPath}`);
