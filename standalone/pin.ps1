# Pin the standalone cat window to the top of the desktop.
# The window is a Chrome/Edge app window whose title contains 猫 (U+732B).
$cat = [string]([char]0x732B)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class PetCatWin32 {
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
}
"@

$proc = Get-Process chrome, msedge -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle.Contains($cat) } |
  Select-Object -First 1

if (-not $proc) {
  Write-Output 'cat window not found yet (wait for it to open, then run pin.ps1 again)'
  exit 0
}

# HWND_TOPMOST = -1, SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE
[PetCatWin32]::SetWindowPos($proc.MainWindowHandle, [IntPtr](-1), 0, 0, 0, 0, 0x0001 -bor 0x0002 -bor 0x0010) | Out-Null
Write-Output "pinned on top: $($proc.MainWindowTitle)"
