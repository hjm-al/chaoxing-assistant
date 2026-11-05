# 第三方组件与数据许可声明

本脚本（`超星学习通助手.user.js`）以 **GPL-3.0-or-later** 发布，详见 [LICENSE](./LICENSE)。
本文件汇总脚本内**内嵌**或**运行时加载**的第三方组件与数据，以及各自的许可要求。

---

## 1. Typr.js（内嵌）

| 项 | 内容 |
| --- | --- |
| 名称 | Typr.js — TrueType / OpenType 字体解析库 |
| 上游 | https://github.com/photopea/Typr.js |
| 版本 | v1.0.0（2016 发布） |
| 许可 | MIT |
| 版权 | Copyright (c) 2016 Photopea |
| 位置 | `超星学习通助手.user.js` 内 `var Typr = {};` 起始的整段（约 1,340 行） |
| 用途 | 解析学习通页面内联的 base64 字体，取字形路径生成指纹，还原 `.font-cxsecret` 加密题干 |
| 修改 | **未修改**，原样内嵌；仅通过 `Typr.parse` / `Typr.U.codeToGlyph` / `Typr.U.glyphToPath` 调用 |

为什么不 `@require`：上游未发布到 Greasyfork 认可的任何 CDN，npm 侧也没有可直接使用的独立 UMD 构建；
通过 `@require` 引入会增加一次跨域下载与版本漂移风险，而本脚本只用到上述三个入口。

MIT 许可全文：

```
The MIT License (MIT)

Copyright (c) 2016 Photopea

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. 字体映射表（`@resource Table`，运行时加载）

| 项 | 内容 |
| --- | --- |
| 名称 | 超星 `font-cxsecret` 字形指纹映射表 |
| 原作者 | wyn665817（`wyn665817@163.com`） |
| 原始出处 | 脚本猫 432《超星字体解密》https://scriptcat.org/zh-CN/script-show-page/432 |
| 表内声明版本 | `20220515.1` |
| 许可 | MIT |
| 当前加载地址 | `https://www.forestpolice.org/ttf/2.0/table.json`（第三方静态托管，非官方） |
| 修改 | **未修改**，原样加载 |

该表通过 `@resource` 在运行时下载，**不内嵌在脚本中**，因此不构成对脚本本体的再许可。
`forestpolice.org` 仅为托管镜像，与原作者身份及授权关系无关；若该地址失效，替换为任意同内容地址即可，
字体解密逻辑无需改动。逐字节备份与 SHA-256 见工作区的 `第三方资源镜像/` 目录（不随脚本分发）。

MIT 许可全文与上方第 1 节相同（版权人为 wyn665817），此处不再重复。

---

## 3. 通过 `@require` / `@resource` 加载的公开库

以下均为未修改的官方发行版，取自 Greasyfork 认可的 CDN（75CDN / `lib.baomitu.com`），各自保留原有许可：

| 组件 | 版本 | 地址 | 许可 |
| --- | --- | --- | --- |
| jQuery | 3.6.0 | `lib.baomitu.com/jquery/3.6.0/jquery.min.js` | MIT |
| axios | 0.27.2 | `lib.baomitu.com/axios/0.27.2/axios.min.js` | MIT |
| Vue | 2.6.0 | `lib.baomitu.com/vue/2.6.0/vue.min.js` | MIT |
| Element UI | 2.15.13 | `lib.baomitu.com/element-ui/2.15.13/index.js` | MIT |
| Element UI theme-chalk | 2.15.13 | `lib.baomitu.com/element-ui/2.15.13/theme-chalk/index.min.css` | MIT |
| promise-polyfill | 8.3.0 | `lib.baomitu.com/promise-polyfill/8.3.0/polyfill.min.js` | MIT |
| cryptico | 0.0.1343522940 | `lib.baomitu.com/cryptico/0.0.1343522940/hash.min.js` | MIT |
| 字体映射表 | `20220515.1` | `www.forestpolice.org/ttf/2.0/table.json` | MIT（见第 2 节） |

---

## 4. 其他致谢

脚本文件头 `@thanks` 还列出了若干在开发过程中提供思路与对照参考的前辈项目。
**这些项目未被内嵌，也未从中复制代码**，因此不构成本脚本的许可来源；逐项定性见
[README.md 的「致谢」与「来源与许可」](./README.md#致谢) 两节，以及工作区内部的
`内部资料与合规审计/脚本借鉴与来源说明.md`。
