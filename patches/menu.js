"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupApplicationMenu = setupApplicationMenu;
const electron_1 = require("electron");
const utils_1 = require("./utils");
const updater_1 = require("./updater");

/**
 * 构造并应用全中文原生应用菜单
 */
function setupApplicationMenu(url) {
    const isMac = (0, utils_1.isMacOS)();
    
    const template = [
        ...(isMac ? [{
            label: electron_1.app.name,
            submenu: [
                { label: `关于 ${electron_1.app.name}`, role: 'about' },
                { type: 'separator' },
                {
                    id: 'check-for-updates',
                    label: updater_1.MenuUpdateStep.CheckForUpdates,
                    click: (menuItem) => {
                        const action = updater_1.updateActions[menuItem.label];
                        action?.();
                    },
                },
                { type: 'separator' },
                { label: '服务', role: 'services' },
                { type: 'separator' },
                { label: `隐藏 ${electron_1.app.name}`, role: 'hide' },
                { label: '隐藏其他', role: 'hideOthers' },
                { label: '显示全部', role: 'unhide' },
                { type: 'separator' },
                { label: `退出 ${electron_1.app.name}`, role: 'quit' },
            ]
        }] : []),
        {
            label: '文件',
            submenu: [
                {
                    label: '新建窗口',
                    accelerator: 'CmdOrCtrl+Shift+N',
                    click: () => {
                        (0, utils_1.createWindow)(url);
                    },
                },
                { type: 'separator' },
                isMac ? { label: '关闭窗口', role: 'close' } : { label: '退出', role: 'quit' }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { label: '撤销', role: 'undo' },
                { label: '重做', role: 'redo' },
                { type: 'separator' },
                { label: '剪切', role: 'cut' },
                { label: '复制', role: 'copy' },
                { label: '粘贴', role: 'paste' },
                { label: '粘贴并匹配格式', role: 'pasteAndMatchStyle' },
                { label: '删除', role: 'delete' },
                { label: '全选', role: 'selectAll' },
            ]
        },
        {
            label: '视图',
            submenu: [
                { label: '重新加载', role: 'reload' },
                { label: '强制重新加载', role: 'forceReload' },
                { label: '切换开发者工具', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: '实际大小', role: 'resetZoom' },
                { label: '放大', role: 'zoomIn' },
                { label: '缩小', role: 'zoomOut' },
                { type: 'separator' },
                { label: '切换全屏', role: 'togglefullscreen' },
            ]
        },
        {
            label: '窗口',
            submenu: [
                { label: '最小化', role: 'minimize' },
                { label: '缩放', role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { label: '前置全部窗口', role: 'front' },
                    { type: 'separator' },
                    { label: '窗口', role: 'window' }
                ] : [
                    { label: '关闭', role: 'close' }
                ])
            ]
        },
        {
            label: '帮助',
            role: 'help',
            submenu: [
                {
                    label: '官方文档',
                    click: async () => {
                        await electron_1.shell.openExternal('https://antigravity.google/docs');
                    },
                },
                ...(!isMac ? [
                    { type: 'separator' },
                    {
                        id: 'check-for-updates',
                        label: updater_1.MenuUpdateStep.CheckForUpdates,
                        click: (menuItem) => {
                            const action = updater_1.updateActions[menuItem.label];
                            action?.();
                        },
                    },
                    { type: 'separator' },
                    {
                        label: '关于 Antigravity',
                        click: () => {
                            electron_1.app.showAboutPanel();
                        }
                    }
                ] : [])
            ]
        }
    ];

    const menu = electron_1.Menu.buildFromTemplate(template);

    // 在正式打包版本中默认隐藏开发者工具项，以保持界面整洁
    const hideDevTools = (menuInstance) => {
        menuInstance.items?.forEach((item) => {
            if (item.role?.toLocaleLowerCase() === 'toggledevtools' && electron_1.app.isPackaged) {
                item.visible = false;
            }
            if (item.submenu) {
                hideDevTools(item.submenu);
            }
        });
    };
    hideDevTools(menu);

    electron_1.Menu.setApplicationMenu(menu);
}
