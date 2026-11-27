# Pin the standalone cat window to the top of the desktop.
# The window is a Chrome/Edge app window whose title is the page title.
$title = [string]([char]0x732B + [char]0x732B)  # 猫猫

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class PetCatWin32 {
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern IntPtr FindWindow(string className, string windowName);
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
}
"@

$hwnd = [PetCatWin32]::FindWindow($null, $title)
if ($hwnd -eq [IntPtr]::Zero) {
  Write-Output 'window not found yet (run start.cmd again or move the window)'
  exit 0
}
# HWND_TOPMOST = -1, SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE
[PetCatWin32]::SetWindowPos($hwnd, [IntPtr](-1), 0, 0, 0, 0, 0x0001 -bor 0x0002 -bor 0x0010) | Out-Null
Write-Output 'cat window pinned on top'
