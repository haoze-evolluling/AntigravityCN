Unicode true
SetCompressor /SOLID lzma
SetCompressorDictSize 32

!define APP_NAME "AntigravityCN"
!define APP_DISPLAY_NAME "AntigravityCN"
!define APP_VERSION "4.0.0"
!define APP_PUBLISHER "AntigravityCN"
!define APP_EXE "AntigravityCN.exe"
!define PROJECT_ROOT "${__FILEDIR__}\.."
!define SOURCE_EXE "${PROJECT_ROOT}\build\bin\AntigravityCN.exe"
!define OUTPUT_EXE "${PROJECT_ROOT}\build\bin\AntigravityCN-Setup-${APP_VERSION}.exe"

Name "${APP_DISPLAY_NAME} ${APP_VERSION}"
Caption "${APP_DISPLAY_NAME} ${APP_VERSION} 安装程序"
OutFile "${OUTPUT_EXE}"
InstallDir "$LOCALAPPDATA\Programs\${APP_NAME}"
InstallDirRegKey HKCU "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel user
BrandingText "${APP_DISPLAY_NAME} ${APP_VERSION}"
ShowInstDetails show
ShowUninstDetails show

VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey "ProductName" "${APP_DISPLAY_NAME}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "FileDescription" "Google Antigravity 简体中文汉化工具安装程序"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey "LegalCopyright" "Copyright © 2026"

!include "MUI2.nsh"
!include "LogicLib.nsh"
!define MUI_ICON "${PROJECT_ROOT}\build\windows\icon.ico"
!define MUI_UNICON "${PROJECT_ROOT}\build\windows\icon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "启动 ${APP_DISPLAY_NAME}"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"

Function .onInit
  SetShellVarContext current

  nsExec::ExecToStack 'powershell.exe -NoProfile -NonInteractive -Command "if (Get-Process -Name AntigravityCN -ErrorAction SilentlyContinue) { exit 1 }"'
  Pop $0
  Pop $1

  ${If} $0 == "1"
    MessageBox MB_YESNO|MB_ICONQUESTION "AntigravityCN 正在运行。安装程序需要关闭它才能继续，是否关闭并继续安装？" IDYES close_running IDNO abort_install

    close_running:
      nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /IM AntigravityCN.exe /F /T'
      Sleep 500
      Goto init_done

    abort_install:
      Abort
  ${EndIf}

  init_done:
FunctionEnd

Section "AntigravityCN 主程序" SEC_MAIN
  SectionIn RO
  SetOutPath "$INSTDIR"
  SetOverwrite on
  File /oname=${APP_EXE} "${SOURCE_EXE}"
  File "${PROJECT_ROOT}\build\appicon.png"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_DISPLAY_NAME}.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\卸载 ${APP_DISPLAY_NAME}.lnk" "$INSTDIR\Uninstall.exe"

  WriteRegStr HKCU "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_DISPLAY_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXE}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "EstimatedSize" 12200
SectionEnd

Section "创建桌面快捷方式" SEC_DESKTOP
  CreateShortCut "$DESKTOP\${APP_DISPLAY_NAME}.lnk" "$INSTDIR\${APP_EXE}"
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_MAIN} "安装 AntigravityCN 主程序、开始菜单入口和卸载程序。"
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_DESKTOP} "在桌面创建 AntigravityCN 快捷方式。"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section "Uninstall"
  SetShellVarContext current

  Delete "$DESKTOP\${APP_DISPLAY_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_DISPLAY_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\卸载 ${APP_DISPLAY_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"

  Delete "$INSTDIR\${APP_EXE}"
  Delete "$INSTDIR\appicon.png"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
  DeleteRegKey HKCU "Software\${APP_NAME}"
SectionEnd
