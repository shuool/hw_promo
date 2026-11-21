# 小小会玩 · 官方主页

三个页面：

- `index.html` 官方首页（题库 / 工具 / 后台 / 合作 / 作者）
- `sponsor.html` 赞助方案页
- `join.html` 共同开发页

样式在 `assets/site.css`，交互在 `assets/site.js`，**所有可编辑内容都在 `content.json`**。

## 改内容

1. 打开 `content.json` 改文字、图片路径、链接、数字（支持 `//` 注释，文本里的 `\n` 表示换行）。
2. 双击 `更新页面.cmd`，或在本目录运行 `node build.js`。
3. 刷新页面查看结果。

不用直接改 HTML：重新生成会覆盖它。CSS / JS 地址会自动带版本号，改完刷新即可，**不需要手动清缓存**；页面不写入任何本地存储（无 localStorage / sessionStorage / IndexedDB）。

## 常改的地方

| 想改什么 | 改哪里 |
| --- | --- |
| 顶部按钮、导航 | `nav`、`headerCta` |
| 头部「打开小小会玩」及未发布弹窗 | `app`（`button` / `short` / `href` / `badge` / `title` / `desc` / `primary` / `copyLabel` / `copyValue` / `note`） |
| 首屏标题 / 说明 / 按钮 | `hero` |
| 两个数字 | `hero.stats`（只保留题目数量、工具攻略分类） |
| 手机截图 | `hero.phones.main / left / right` |
| 01 功能卡 | `features.items` |
| 02 工具卡 | `tools.items`（`image` 截图、`name` 名称、`desc` 一行说明） |
| 03 后台截图 | `admin.shots` |
| 04 合作卡 | `join.cards` |
| 小玩具按钮 | `toy.button`、`toy.href`、`toy.tip` |
| 作者头像 / ID / 房间 / 微信 | `author` |
| 赞助页、共同开发页 | `sponsor`、`joinPage` |

小玩具按钮和「成为赞助」在同一行：`href` 填 `#` 时点击只弹提示，后期换成真实链接即可，不用改 HTML。

## 图片

图片都放在 `images/`，JSON 里写相对路径（如 `./images/题库.png`）。替换同名文件即可；想加新图就复制一份再改 JSON 路径。

- 首屏截图建议竖版，比例接近 390×844。
- 后台截图建议宽屏，比例接近 16:9。
- 点击任意截图可看大图：Esc、点空白或右上角关闭。
- 背景图在 `backgrounds`，手机用竖版、宽屏用横版。

## 交互说明

- 手机底部有快捷导航；桌面右下角有返回顶部。
- 移动端首屏按钮为两列：赞助 / 小玩具一行，另一个按钮单独一行。
- 顶部「打开小小会玩」点击会弹未发布提示：可跳赞助页，或一键复制作者微信；`app.href` 填真实地址后即改为直接跳转。
- 所有页面都可以点击截图放大，不依赖任何第三方库。

## 注意

- `content.json` 里的注释只有本项目的构建脚本认识，普通 JSON 校验工具可能提示语法错误，属正常现象。
- 生成失败时先检查 `content.json` 的引号、逗号是否配对。
- 需要 Node.js 才能重新生成页面。
