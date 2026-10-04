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
	applyFlag := flag.Bool("apply", false, "安装汉化补丁")
	restoreFlag := flag.Bool("restore", false, "还原英文原版")
	cleanCacheFlag := flag.Bool("clean-cache", false, "清理应用缓存")
	launchFlag := flag.Bool("launch", false, "启动 Antigravity")
	asarPathFlag := flag.String("path", "", "指定 app.asar 路径")
	forceCloseFlag := flag.Bool("force-close", false, "若程序正在运行，自动关闭进程")
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
	if *applyFlag || *restoreFlag || *cleanCacheFlag || *launchFlag {
		opts := &patcher.PatchOptions{AutoCloseProcess: *forceCloseFlag}

		if *cleanCacheFlag {
			fmt.Println("================================================")
			fmt.Println("   AntigravityCN — 正在清理应用缓存")
			fmt.Println("================================================")
			count, err := patcher.CleanAppCache(func(msg string) { fmt.Println(msg) })
			if err != nil {
				fmt.Fprintf(os.Stderr, "[错误] 清理缓存失败: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("\n[完成] 缓存清理完成，共清理 %d 处目录。\n", count)
		}

		if *applyFlag {
			fmt.Printf("================================================\n   AntigravityCN — 正在安装汉化补丁\n================================================\n目标路径: %s\n\n", targetAsar)
			if err := patcher.ApplyPatch(targetAsar, patchesSubFS, func(msg string) { fmt.Println(msg) }, opts); err != nil {
				fmt.Fprintf(os.Stderr, "\n[错误] 汉化失败: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("\n[完成] 汉化完成，请启动 Antigravity 查看效果。")
		} else if *restoreFlag {
			fmt.Printf("================================================\n   AntigravityCN — 正在还原英文原版\n================================================\n目标路径: %s\n\n", targetAsar)
			if err := patcher.RestoreOriginal(targetAsar, func(msg string) { fmt.Println(msg) }, opts); err != nil {
				fmt.Fprintf(os.Stderr, "\n[错误] 还原失败: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("\n[完成] 还原完成，已恢复为英文原版。")
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
		Title:             "Google Antigravity 简体中文汉化工具",
		Width:             920,
		Height:            630,
		MinWidth:          840,
		MinHeight:         580,
		Frameless:         true,
		BackgroundColour:  &options.RGBA{R: 11, G: 15, B: 25, A: 255},
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
	fmt.Println("Google Antigravity 简体中文汉化工具")
	fmt.Println("使用说明:")
	fmt.Println("  双击运行: 启动图形界面")
	fmt.Println("  命令行参数:")
	fmt.Println("    -apply        安装汉化补丁")
	fmt.Println("    -restore      还原英文原版")
	fmt.Println("    -clean-cache  清理应用缓存")
	fmt.Println("    -launch       启动 Antigravity")
	fmt.Println("    -path <path>  指定 app.asar 路径")
	fmt.Println("    -force-close  若程序正在运行，自动关闭进程")
	fmt.Println("    -help         显示帮助信息")
}
