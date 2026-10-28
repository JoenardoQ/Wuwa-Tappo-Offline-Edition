#!/bin/sh
# Wuwa Tappo 离线版 Linux 启动器：自动处理 Chromium 沙箱与 Wayland 兼容后启动主程序。
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BIN="$HERE/WuwaTappo-Offline"
SANDBOX="$HERE/chrome-sandbox"

sandbox_usable() {
  # chrome-sandbox 已由 root 所有并带 SUID 时直接可用
  if [ -u "$SANDBOX" ] && [ "$(stat -c %u "$SANDBOX" 2>/dev/null)" = 0 ]; then return 0; fi
  [ "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null)" = 1 ] && return 1
  [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)" = 0 ] && return 1
  [ "$(cat /proc/sys/user/max_user_namespaces 2>/dev/null)" = 0 ] && return 1
  return 0
}

set --
if ! sandbox_usable; then
  echo "提示：系统限制了 Chromium 沙箱，本次以 --no-sandbox 启动。可执行以下命令启用沙箱：" >&2
  echo "  sudo chown root:root '$SANDBOX' && sudo chmod 4755 '$SANDBOX'" >&2
  set -- --no-sandbox
fi
# 原生 Wayland 不支持置顶、定位和全局光标坐标，存在 XWayland 时改用 X11
if [ -n "$WAYLAND_DISPLAY" ] && [ -n "$DISPLAY" ] && [ -z "$WUWA_NATIVE_WAYLAND" ]; then
  set -- "$@" --ozone-platform=x11
fi
exec "$BIN" "$@"
