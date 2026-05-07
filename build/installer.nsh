; Post-install: flush the Windows shell icon cache so the new taskbar icon
; takes effect immediately without requiring a reboot or manual cache clear.
!macro customInstall
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend
