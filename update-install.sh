#!/bin/sh
set -u
target=$1 stage=$2 backup=$3 oldpid=$4 data=$5 version=$6 token=$7
case "$token" in *[!a-f0-9]*|'') exit 2;; esac
[ "${#token}" = 32 ] && [ "$stage" = "$target.incoming-$token" ] && [ "$backup" = "$target.backup-$token" ] && [ "$target" != / ] || exit 2
case "$target:$data" in /*:/*) ;; *) exit 2;; esac
case "$oldpid" in *[!0-9]*|'') exit 2;; esac
case "$version" in *[!0-9.]*|'') exit 2;; esac
[ -f "$target/resources/app/package.json" ] && [ -f "$stage/resources/app/package.json" ] && [ ! -e "$backup" ] || exit 2
receipt="$data/updates/$token/ready"
result="$data/update-result.json"
printf ready > "$data/updates/$token/helper-ready" || exit 2
moved=0 installed=0 newpid=''
rollback() {
 if [ -n "$newpid" ]; then kill "$newpid" 2>/dev/null || true; sleep 1; fi
 if [ "$installed" = 1 ]; then mv -- "$target" "$stage" || return 1; fi
 if [ "$moved" = 1 ]; then mv -- "$backup" "$target" || return 1; fi
 if ! kill -0 "$oldpid" 2>/dev/null && [ -f "$target/WuwaTappo-Offline.sh" ]; then (cd "$target" && exec ./WuwaTappo-Offline.sh) </dev/null >/dev/null 2>&1 & fi
 printf '{"ok":false,"version":"%s","error":"Update failed; previous version restored"}' "$version" > "$result"
}
n=0
while kill -0 "$oldpid" 2>/dev/null; do n=$((n+1)); [ "$n" -le 120 ] || { rollback; exit 1; }; sleep 1; done
mv -- "$target" "$backup" || { rollback; exit 1; }; moved=1
mv -- "$stage" "$target" || { rollback; exit 1; }; installed=1
(cd "$target" && exec ./WuwaTappo-Offline.sh "--update-token=$token") </dev/null >/dev/null 2>&1 &
newpid=$!
n=0
while [ ! -f "$receipt" ]; do n=$((n+1)); if [ "$n" -gt 60 ] || ! kill -0 "$newpid" 2>/dev/null; then rollback; exit 1; fi; sleep 1; done
[ "$(cat "$receipt")" = "$version" ] || { rollback; exit 1; }
printf '{"ok":true,"version":"%s"}' "$version" > "$result"
