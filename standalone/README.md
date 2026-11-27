# Standalone cat window (no DSH)

This folder runs the cat **outside DSH**, in its own Chrome/Edge app window:

- Double-click `start.cmd`;
- It opens `pet-cat.html` in an app window (no address bar), with a separate
  browser profile, and pins the window **always-on-top**;
- The window is a separate process, so minimizing, moving or **closing DSH does
  not affect it**;
- It has a paper background (browser app windows cannot be transparent) and is
  not part of DSH's plugin system.

## 中文

不用 DSH 的独立猫猫窗口：

- 双击 `start.cmd`；
- 用 Chrome/Edge 的「应用窗口」打开 `pet-cat.html`（无地址栏），使用独立的浏览器配置；
- 脚本会把窗口设为**置顶**；
- 它是独立进程：最小化/移动/关闭 DSH 都不影响它；
- 窗口是不透明纸色底（浏览器应用窗口做不到透明），也不属于 DSH 插件。

如果窗口没置顶，等窗口出现后重新运行一次 `start.cmd`（它只做置顶，不会重复开窗），
或单独运行 `pin.ps1`。

要**透明 + 无边框 + 置顶**的桌面猫猫，需要独立的 Electron 程序（约 100–200MB 运行时），
那是另一个方案。
