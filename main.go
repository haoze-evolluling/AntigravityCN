package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"os"

	"antigravity-cn/internal/patcher"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed all:patches
var embeddedPatches embed.FS

func main() {
	applyFlag := flag.Bool("apply", false, "一键安装汉化补丁 (命令行模式)")
	restoreFlag := flag.Bool("restore", false, "还原官方英文原版 (命令行模式)")
	launchFlag := flag.Bool("launch", false, "启动 Antigravity")
	asarPathFlag := flag.String("path", "", "自定义 app.asar 路径")
	forceCloseFlag := flag.Bool("force-close", false, "若 Antigravity 正在运行，自动关闭进程")
	helpFlag := flag.Bool("help", false, "显示帮助信息")

	flag.Parse()

	if *helpFlag {
		printHelp()
		return
	}

	targetAsar := *asarPathFlag
	if targetAsar == "" {
		targetAsar = patcher.FindAppAsar()
	}

	patchesSubFS, _ := fs.Sub(embeddedPatches, "patches")
	if patchesSubFS == nil {
		patchesSubFS = embeddedPatches
	}

	// CLI Mode
	if *applyFlag || *restoreFlag || *launchFlag {
		opts := &patcher.PatchOptions{AutoCloseProcess: *forceCloseFlag}

		if *applyFlag {
			fmt.Printf("================================================\n   AntigravityCN — 正在应用简体中文汉化补丁\n================================================\n目标路径: %s\n\n", targetAsar)
			if err := patcher.ApplyPatch(targetAsar, patchesSubFS, func(msg string) { fmt.Println(msg) }, opts); err != nil {
				fmt.Fprintf(os.Stderr, "\n[错误] 汉化失败: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("\n[完成] 汉化成功！请重启或启动 Antigravity。")
		} else if *restoreFlag {
			fmt.Printf("================================================\n   AntigravityCN — 正在还原官方英文原版\n================================================\n目标路径: %s\n\n", targetAsar)
			if err := patcher.RestoreOriginal(targetAsar, func(msg string) { fmt.Println(msg) }, opts); err != nil {
				fmt.Fprintf(os.Stderr, "\n[错误] 还原失败: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("\n[完成] 还原成功！已恢复官方英文原版。")
		}

		if *launchFlag {
			fmt.Println("[*] 正在启动 Antigravity...")
			if err := patcher.LaunchAntigravity(targetAsar); err != nil {
				fmt.Fprintf(os.Stderr, "[错误] 启动失败: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("[OK] 启动成功。")
		}
		return
	}

	frontendFS, _ := fs.Sub(assets, "frontend/dist")
	if frontendFS == nil {
		frontendFS = assets
	}

	app := NewApp(patchesSubFS)

	err := wails.Run(&options.App{
		Title:             "Google Antigravity 简体中文汉化工具 (便携版)",
		Width:             780,
		Height:            590,
		MinWidth:          720,
		MinHeight:         540,
		Frameless:         true,
		BackgroundColour:  &options.RGBA{R: 15, G: 17, B: 21, A: 255},
		AssetServer:       &assetserver.Options{Assets: frontendFS},
		OnStartup:         app.startup,
		Bind:              []interface{}{app},
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			BackdropType:         windows.Mica,
			Theme:                windows.Dark,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func printHelp() {
	fmt.Println("Google Antigravity 简体中文汉化工具 (便携版)")
	fmt.Println("使用说明:")
	fmt.Println("  双击运行: 自动启动 Wails 现代化图形界面")
	fmt.Println("  命令行参数:")
	fmt.Println("    -apply        一键安装简体中文汉化")
	fmt.Println("    -restore      还原官方英文原版")
	fmt.Println("    -launch       启动 Antigravity")
	fmt.Println("    -path <path>  指定自定义 app.asar 路径")
	fmt.Println("    -force-close  若检测到运行中自动安全关闭进程")
	fmt.Println("    -help         显示此帮助信息")
}
