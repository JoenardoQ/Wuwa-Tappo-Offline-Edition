#!/bin/sh
# Wuwa Tappo 离线版 Linux 启动器：自动处理 Chromium 沙箱与 Wayland 兼容后启动主程序。
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BIN="$HERE/WuwaTappo-Offline"
SANDBOX="$HERE/chrome-sandbox"

sandbox_usable() {
  # chrome-sandbox 已由 root 所有并带 SUID 时直接可用
  if [ -u "$SANDBOX" ] && [ -x "$SANDBOX" ] && [ "$(stat -c %u "$SANDBOX" 2>/dev/null)" = 0 ]; then return 0; fi
  [ "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null)" = 1 ] && return 1
  [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)" = 0 ] && return 1
  [ "$(cat /proc/sys/user/max_user_namespaces 2>/dev/null)" = 0 ] && return 1
  return 0
}

# Keep all supplied arguments, including --qa and --selftest (isolated save data).
if [ "$WUWA_ALLOW_NO_SANDBOX" = 1 ]; then
  echo "兼容模式：已按 WUWA_ALLOW_NO_SANDBOX=1 关闭 Chromium 进程隔离。" >&2
  set -- --no-sandbox "$@"
elif ! sandbox_usable; then
  echo "系统可能限制 Chromium 沙箱，默认仍保留进程隔离。若启动失败，请参考 README；仅在主动接受风险时使用 WUWA_ALLOW_NO_SANDBOX=1。" >&2
fi
# 原生 Wayland 不支持置顶、定位和全局光标坐标，存在 XWayland 时改用 X11
if [ -n "$WAYLAND_DISPLAY" ] && [ -n "$DISPLAY" ] && [ -z "$WUWA_NATIVE_WAYLAND" ]; then
  set -- --ozone-platform=x11 "$@"
fi
exec "$BIN" "$@"
