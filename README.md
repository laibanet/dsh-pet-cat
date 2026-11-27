# dsh-pet-cat

The **pet-the-cat** cat as a transparent, resizable window inside DeepSeek Harness.

The cat page is bundled (one self-contained HTML file) and served locally by the
Host half, so it works offline. Only the cat is drawn: the room background and
the contact shadow are removed and the canvas is transparent, so the cat floats
over DSH. Hover the window for the drag grip, the cat picker and the size slider;
drag the bottom-right corner to resize. The cat artwork belongs to **zubu**
(<https://pet-the-cat.pages.dev>) and is bundled with the author's permission.

## 中文

右下角一只猫，没有房间、没有阴影、没有标题栏：

- 画布透明，只有猫本体（和摸猫的手）浮在 DSH 上；
- 鼠标移上去：左上 **⠿** 拖动，右上 **⧉** 弹出独立浏览器小窗、**⚙** 打开猫猫选择器（14 只）+ **大小** 滑杆；
- 右下角拖动可调整窗口大小，位置和尺寸都会记住；
- 窗口默认 360×420 竖版，猫完整显示；大小滑杆会同步到原页面的“猫の大きさ”；
- 页面与照片全部内置、离线可用，不访问原站。

### 安装

```sh
dsh plugin --profile web add git+https://github.com/laibanet/dsh-pet-cat.git
```

或在插件管理里安装 `dsh-pet-cat-<version>.tgz`。

## English

A cat in the corner with no room, no shadow and no chrome:

- The canvas is transparent, so only the cat (and the petting hand) floats over
  DSH;
- On hover: **⠿** drags, **⧉** pops the cat out into a separate browser window
  (it survives DSH being minimized; it is not always-on-top, has no transparent
  background and closes with DSH), **⚙** opens the 14-cat picker plus a **size**
  slider;
- Drag the bottom-right corner to resize; position and size are remembered;
- Defaults to 360×420 portrait so the whole cat is visible; the size slider
  drives the page's own "cat size" control;
- Everything is bundled and offline; the public site is never contacted.

The cat photos and page are by **zubu**
(<https://pet-the-cat.pages.dev>) and are bundled with the author's permission.

## Development

`site/index.html` is generated from the unpacked sources in `site/`
(`page.html`, `app.js`, `photos.bin`, `directory.json`). Rebuild it with:

```sh
node tools/build-site.mjs
```
