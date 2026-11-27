# dsh-pet-cat

The **pet-the-cat** cat as a transparent, cropped window inside DeepSeek Harness.

The cat page is bundled (one self-contained HTML file) and served locally by the
Host half, so it works offline. Only the cat is drawn: no room, no shadow, no
hand, no window chrome. The window is cropped to the cat's idle bounding box, so
there is no large empty transparent frame around it.

## 中文

右下角只有一只猫，窗口按猫的范围裁剪，没有手、没有可见控件。

- **快速滑过猫身**：正常摸猫（原页面的手感、呼噜、换猫都保留，画面里不画手）；
- **按住猫约 0.3 秒再拖动**：移动窗口（位置会记住），用的是屏幕坐标，不会抖；
- **按住猫不动约 0.85 秒**：弹出设置，选 14 只猫、重载或收起；
- 设置菜单在猫身上方，选中后关闭，Esc 也可以关；
- 收起后右下角保留 🐱 按钮，点一下重新出现。

猫的照片与页面版权归作者 zubu（<https://pet-the-cat.pages.dev>），经作者同意内置。

### 安装

```sh
dsh plugin --profile web add git+https://github.com/laibanet/dsh-pet-cat.git
```

或在插件管理里安装 `dsh-pet-cat-<version>.tgz`。

## English

Only a cat sits in the corner; the window is cropped to the cat, with no hand
and no visible controls.

- **Quickly stroke the cat**: normal petting (the page's feel, purring and cat
  switching are unchanged; the hand is not drawn);
- **Press and hold the cat for ~0.3 s, then drag**: move the window (position is
  remembered); drag deltas use screen coordinates, so it does not jitter;
- **Hold the cat still for ~0.85 s**: open settings — pick one of 14 cats, reload
  or hide;
- The settings sheet appears over the cat, closes after a pick, and Escape closes
  it too;
- After hiding, a 🐱 button stays in the corner to bring it back.

The cat photos and page are by **zubu**
(<https://pet-the-cat.pages.dev>) and are bundled with the author's permission.

## Development

`site/index.html` is generated from the unpacked sources in `site/`
(`page.html`, `app.js`, `photos.bin`, `directory.json`). Rebuild it with:

```sh
node tools/build-site.mjs
```
