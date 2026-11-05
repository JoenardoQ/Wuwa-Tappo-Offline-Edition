> **版权声明：本项目使用的 Wuwa Tappo／《鸣潮》角色、美术、表情及原版界面资源，版权归官方及相应权利人所有。本项目为非官方个人离线娱乐修改版，不代表官方，也不取得原版素材版权。请勿付费传播。**
> 字体与其他第三方依赖保留各自版权；仓库中的 MIT 许可仅适用于本项目可授权的独立代码，不覆盖官方或第三方资源。

# Wuwa Tappo Offline Edition

## Release 下载

**[前往最新 Release](https://github.com/JoenardoQ/Wuwa-Tappo-Offline-Edition/releases/latest)**

**[直接下载 Windows x64 便携 ZIP · v1.0.6](https://github.com/JoenardoQ/Wuwa-Tappo-Offline-Edition/releases/download/v1.0.6/WuwaTappo-Offline-42keys-v1.0.6.zip)**
[下载 SHA-256 校验文件](https://github.com/JoenardoQ/Wuwa-Tappo-Offline-Edition/releases/download/v1.0.6/WuwaTappo-Offline-42keys-v1.0.6.sha256.txt)

下载上面的便携 ZIP，完整解压后运行文件夹内的 **WuwaTappo-Offline.exe**。无需安装 Node.js，也无需官方账号。请保留全部文件，不能只拷贝 exe。GitHub 自动生成的 Source code 压缩包是源码，不是可直接运行的程序。

本次 v1.0.6 新增一键全图鉴、背包自定义图片配件与位置编辑，以及直接从 GitHub Release 下载、校验、替换并重启的自动更新。完整更新说明见 [CHANGELOG.md](CHANGELOG.md)，便携包内也附有此文件。

当前支持 Windows x64 与 Linux x64。正常使用不访问网络；仅主动点击“检查并更新”时连接本仓库的 GitHub Release。收藏、搭配、自定义图片和设置只保存在本机。

### Linux x64

**[下载 Linux x64 便携 tar.gz · v1.0.6](https://github.com/JoenardoQ/Wuwa-Tappo-Offline-Edition/releases/download/v1.0.6/WuwaTappo-Offline-Linux-x64-v1.0.6.tar.gz)**

完整解压后通过启动器运行：

```bash
tar -xzf WuwaTappo-Offline-Linux-x64-v1.0.6.tar.gz
cd WuwaTappo-Offline-1.0.6
./WuwaTappo-Offline.sh
```

- 启动器完整保留传入参数。在存在 XWayland 的 Wayland 会话中自动使用 X11；设置 `WUWA_NATIVE_WAYLAND=1` 可主动使用原生 Wayland，但窗口定位、置顶、全局输入等能力受桌面环境限制。
- 默认保留 Chromium 进程隔离。Ubuntu 等系统若限制沙箱而无法启动，可由管理员正确配置沙箱支持；仅在主动接受关闭进程隔离的风险时，使用 `WUWA_ALLOW_NO_SANDBOX=1 ./WuwaTappo-Offline.sh`。`npm start` 和界面测试采用相同策略，不会自动关闭隔离。
- 全局键鼠监听基于 X11/libXtst，Wayland 下通常只能收到 XWayland 窗口的输入。钩子能启动不代表能监听所有原生 Wayland 应用。
- 透明窗口需要桌面合成器；托盘需要 AppIndicator/StatusNotifier 支持，GNOME 可能需要相应扩展。Linux 托盘请用菜单打开“收藏与搭配”。
- 开机启动写入 XDG 配置目录下的 `autostart/wuwa-tappo-offline.desktop`；保留空格、百分号等路径字符。开启时会保存本次主动选择的兼容模式。更换便携目录后，请关闭再开启一次开机启动以更新路径。
- Linux 存档位于 `$XDG_CONFIG_HOME/WuwaTappoOffline/collection.json`，未设置 XDG_CONFIG_HOME 时为 `~/.config/WuwaTappoOffline/collection.json`。

## 与官方版的差别

| 项目 | 本离线版的处理 |
| --- | --- |
| 账号与联机 | 不登录官方账号，不连接官方服务器；不提供官方联机、房间、好友、排行榜或云存档，不修改官方收藏。 |
| 初始收藏 | 仅开放男女漂泊者经典形象、阿布配件和八个阿布基础表情，共 11 件；其余通过本地开箱、合成或主动点击“一键全图鉴”获得。 |
| 开箱 | 单抽、十连均无限免费。采用本地规则：普通 65%、珍稀 25%、稀有 9%、史诗 1%；十连至少珍稀，最多 50 抽获得史诗。这些是离线版规则，不承诺与官方概率相同。 |
| 合成 | 升阶消耗 10 份、平阶消耗 5 份同品类同稀有度多余副本；支持单次或十连，保留每件物品最后一份。 |
| 键盘与拍桌 | 在原有底部胶囊内增加 42 键实时映射键盘，向右倾斜 30°，使用圆润字体与轻微立体效果。每次有效键鼠输入交替触发左右手拍桌及计数；同一按键长按产生的重复事件不重复计数或换手。 |
| 计数 | 计数从 999 再增加一次归零，并从当前装备的表情中随机浮现一个。未装备表情时只归零；按住同一个键不会重复计数。 |
| 表情 | 使用原始互动图像，保留原版气泡边框、32/30 像素按钮布局、80 像素浮现图像、1 秒上浮轨迹及按压弹性。侧边气泡不再使用图鉴缩略图；点击背包上方任意表情槽的“更换”，可沿用主页面角色、稀有度下拉筛选已拥有表情并立即替换。 |
| 窗口 | 强制始终置顶，失焦或层级变化后自动恢复，不主动抢输入焦点。Windows 安全桌面和独占全屏不受普通应用置顶控制。 |
| 图鉴与搭配 | 保留本地背包、收藏、搭配预设、稀有度分组，支持系列、角色和稀有度组合筛选，以及连续“显示更多”。图鉴只渲染当前视口附近的卡片，滚动时逐段更新。 |
| 自定义配件 | 在背包导入 JPG/JPEG/PNG，调整位置、大小和旋转；按角色分别记忆，也随搭配预设保存，仅在本机使用。 |
| 更新与存档 | 设置中直接从本仓库 GitHub Release 下载、校验、替换并重启；历史收藏、图片与设置沿用固定用户目录，不连接官方更新或账号服务。 |

内置 899 个收集物：260 个角色皮肤、135 个配件、504 个表情，对应 3098 张离线图像。资源为本仓库当前快照，不会自动跟随官方新增内容。

<img src="docs/images/pet.png" alt="42键桌宠和原版表情气泡" width="320"> <img src="docs/images/emote.png" alt="原版表情浮现" width="320">

## 快捷键与交互

| 操作 | 快捷键或方法 |
| --- | --- |
| 切换鼠标穿透 | **Ctrl+Alt+P** |
| 关闭游戏模式、恢复鼠标交互 | **F7** |
| 切换显示屏 | **F8** |
| 播放当前装备的第 1～5 个表情 | **Ctrl+Alt+1～5** |
| 展开表情 | 鼠标移入桌宠 |
| 固定展开／收起表情 | 点击底部计数 |
| 打开背包与设置 | 点击底栏右侧三横线，或双击托盘图标 |
| 打开无限开箱 | 点击底栏星形入口 |
| 拖动桌宠 | 按住角色拖动；禁用拖动、游戏模式或鼠标穿透时不可拖动 |
| 预览已拥有表情 | 在背包或图鉴中右键表情卡片 |
| 更换表情 | 点击背包上方 5 个表情槽中的“更换”，在主页面用角色、稀有度下拉筛选并点击已拥有的表情；也可点击下方新表情卡片，再选替换位置 |
| 调整窗口 | 顶部 − / ＋、最小化、最大化 / 还原，或拖动边缘与四角 |
| 保存搭配 | 背包中点击空白预设位 |
| 一键全图鉴 | 背包或图鉴 → 一键全图鉴，补齐未拥有的内置收藏 |
| 自定义配件 | 背包 → 自定义配件与位置 → 导入 JPG / PNG，在预览中拖动或调整滑杆，自动保存 |
| 自动更新 | 设置 → 检查并更新，完成下载与校验后自动重启 |

若桌宠无法点击，先按 **F7** 关闭游戏模式，再用 **Ctrl+Alt+P** 切换鼠标穿透，或从系统托盘打开设置。

## 存档与升级

从 v1.0.3 起，存档固定保存在 **%APPDATA%/WuwaTappoOffline/collection.json**，备份为 collection.json.bak。可以在设置里点击“查看存档”打开，不受 ZIP 版本号和解压目录变化影响。

首次启动 v1.0.3 或更新版本时，优先继承当前 exe 旁的旧 data/collection.json；若没有，会在解压目录附近以及 Downloads 下的 WuwaTappo-Offline 文件夹中寻找最近的有效旧存档。迁移前自动复制到固定存档目录的 migration-backups，旧文件保留不动。已有固定存档后，后续版本直接读取它，不会重复导入旧文件。

从 v1.0.6 起，使用设置 → **检查并更新**，程序自动下载对应平台的正式 Release 包和 SHA-256 文件、校验、保存存档并重启安装。无需打开网页或手动解压。请把便携版放在自己有写入权限的目录；更新时该目录及上级目录需要可写。下载、校验或保存失败会停止安装；新版未能启动时尝试恢复旧版。旧程序备份保留在同级的 `.backup-` 文件夹，更新日志位于存档目录的 `update-result.json`，下载文件位于 `updates`。

自定义图片位于存档目录的 `custom-accessories`，位置、搭配及当前佩戴记录在 `collection.json`。备份或搬到另一台电脑时，请复制整个 `WuwaTappoOffline` 存档目录。导入最多 100 张 JPG/JPEG/PNG，单张不超过 12 MB、2400 万像素且每边不超过 8192 像素；最长边会缩至 1024 像素。JPG 保留原背景，透明配件请用 PNG。每次佩戴一件配件。

v1.0.5 及更早版首次升级到本版：退出旧版，完整解压新便携包后运行；之后即可使用内置更新。历史收藏通常无需手动复制 data。请在首次迁移成功前保留旧目录。如果旧版放在其他任意位置，可先把它的 data 文件夹放到新版 exe 旁再首次启动。发行包不包含任何用户存档、账号或日志。

## 从源码运行与打包

需要 Windows x64 或 Linux x64，以及 Node.js 24；首次安装依赖及 Electron 运行程序需要联网。

```powershell
npm ci
npm test
npm start
```

`npm ci` 的安装步骤会自动下载并校验所需 Electron 运行程序。生成便携目录：

```powershell
npm run build
```

输出位于 `dist/WuwaTappo-Offline-1.0.6/`。GitHub Actions 分别在 Windows 和 Linux 上安装依赖、运行测试、构建 ZIP / tar.gz。Linux 工作流还在 X11 虚拟桌面中运行界面测试及便携启动器测试；其中关闭隔离仅用于 CI 的显式兼容模式。

## 验证与许可范围

`npm test` 验证初始收藏、资源完整性、抽取、合成、存档迁移、计数归零和装备表情选择。`npm run test:ui` 在独立存档中检查换装、输入、表情、置顶恢复、连续加载、筛选及保存，结果写入 `qa-output/result.json`；需要桌面会话。Linux 可在带窗口管理器的 Xvfb 环境中测试；原生 GNOME/KDE/Wayland 的桌面行为仍需实机验证。`npm run test:drag` 在独立存档和原生窗口中通过实际拖动入口测试 5 种屏幕缩放 × 3 种桌宠大小，每个组合连续移动 120 次，并检查异常尺寸恢复与拖动禁用规则；不会改动系统显示设置，结果写入 `qa-output/drag/result.json`。

独立代码许可见 [LICENSE](LICENSE)，官方美术、字体、界面资源及依赖说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
