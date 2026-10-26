# 第三方资源说明

- `assets/` 的角色、配件、表情图像来自用户本机 Wuwa Tappo 对应的原版资源；`asset-manifest.json` 记录每个本地文件的来源 URL。程序运行时只读取本地文件。
- `original-ui/` 保存原版界面 CSS、内嵌图像、独立图标和 975MaruSC 字体。版权与许可归原作者及权利人；本项目的 MIT 许可不覆盖这些资源。
- `emotions.js` 中的扇形交互配套弹簧参数及浮现偏移取自原版 EmotionMenu 和 local-emotion-bubble 的实现，改为本地独立界面使用。原版 CSS 中的图像与动画未重新绘制。
- Electron、Chromium 和 uiohook-napi 等依赖遵循各自许可证。便携包保留 Electron 的 LICENSE、LICENSES.chromium.html，并保留原生输入依赖的许可证。
- 源码上传不包含官方安装程序、用户账号、令牌、用户收藏存档或运行日志。
