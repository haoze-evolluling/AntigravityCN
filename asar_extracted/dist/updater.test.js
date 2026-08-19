"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const updater_1 = require("./updater");
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const electron_updater_2 = require("./__mocks__/electron-updater");
const settingsService_1 = require("./services/settingsService");
const storage_1 = require("./storage");
const mockGetSetting = vitest_1.vi.fn();
const mockOnSettingChanged = vitest_1.vi.fn();
// Use shared auto-mocks from __mocks__/
vitest_1.vi.mock('electron');
vitest_1.vi.mock('electron-updater');
vitest_1.vi.mock('child_process', () => ({
    spawn: vitest_1.vi.fn(() => ({
        unref: vitest_1.vi.fn(),
    })),
}));
vitest_1.vi.mock('./services/settingsService', () => {
    return {
        SettingKey: {
            RUN_IN_BACKGROUND: 'runInBackground',
            KEEP_COMPUTER_AWAKE: 'keepComputerAwake',
            AUTO_CHECK_FOR_UPDATES: 'autoCheckForUpdates',
        },
        SettingsService: vitest_1.vi.fn().mockImplementation(function () {
            return {
                getSetting: mockGetSetting,
                onSettingChanged: mockOnSettingChanged,
            };
        }),
    };
});
(0, vitest_1.describe)('updater', () => {
    let mockSettingsService;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks(); // Clear mock history before each test
        vitest_1.vi.useFakeTimers();
        mockSettingsService = new settingsService_1.SettingsService(Object.create(storage_1.StorageManager.prototype));
        vitest_1.vi.mocked(mockSettingsService.getSetting).mockResolvedValue(true);
        vitest_1.vi.mocked(mockSettingsService.onSettingChanged).mockReturnValue({
            dispose: vitest_1.vi.fn(),
        });
    });
    (0, vitest_1.it)('should register IPC handlers and updater events on init', async () => {
        (0, updater_1.initAutoUpdater)(false, mockSettingsService);
        // Verify autoUpdater events were registered
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.on).toHaveBeenCalledWith('checking-for-update', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.on).toHaveBeenCalledWith('update-available', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.on).toHaveBeenCalledWith('update-not-available', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.on).toHaveBeenCalledWith('download-progress', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.on).toHaveBeenCalledWith('update-downloaded', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.on).toHaveBeenCalledWith('error', vitest_1.expect.any(Function));
    });
    (0, vitest_1.it)('should schedule an update check when setting is enabled', async () => {
        (0, updater_1.initAutoUpdater)(false, mockSettingsService);
        // Fast-forward the 10-second delay
        await vitest_1.vi.advanceTimersByTimeAsync(10000);
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.checkForUpdates).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should NOT schedule an update check when setting is disabled', async () => {
        vitest_1.vi.mocked(mockSettingsService.getSetting).mockResolvedValue(false);
        (0, updater_1.initAutoUpdater)(false, mockSettingsService);
        // Fast-forward the 10-second delay
        await vitest_1.vi.advanceTimersByTimeAsync(10000);
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should dynamically start/stop periodic checks on setting change', async () => {
        let settingChangeListener;
        vitest_1.vi.mocked(mockSettingsService.onSettingChanged).mockImplementation((key, listener) => {
            if (key === settingsService_1.SettingKey.AUTO_CHECK_FOR_UPDATES) {
                settingChangeListener = listener;
            }
            return { dispose: vitest_1.vi.fn() };
        });
        // Start with disabled
        vitest_1.vi.mocked(mockSettingsService.getSetting).mockResolvedValue(false);
        (0, updater_1.initAutoUpdater)(false, mockSettingsService);
        // Fast-forward delay: no checks run
        await vitest_1.vi.advanceTimersByTimeAsync(10000);
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.checkForUpdates).not.toHaveBeenCalled();
        // Enable it
        settingChangeListener(true);
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
        // Disable it
        settingChangeListener(false);
        await vitest_1.vi.advanceTimersByTimeAsync(3600 * 1000); // Wait 1 hour (interval time)
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1); // No new checks run
    });
    (0, vitest_1.it)('should auto-install on update-downloaded in headless mode (packaged)', async () => {
        (0, updater_1.initAutoUpdater)(true, mockSettingsService);
        const callback = electron_updater_2.autoUpdaterEvents['update-downloaded'];
        (0, vitest_1.expect)(callback).toBeDefined();
        callback({ version: '1.2.3' });
        if (process.platform === 'linux') {
            (0, vitest_1.expect)(child_process_1.spawn).toHaveBeenCalled();
            (0, vitest_1.expect)(electron_1.app.quit).toHaveBeenCalled();
            (0, vitest_1.expect)(electron_updater_1.autoUpdater.quitAndInstall).not.toHaveBeenCalled();
        }
        else {
            (0, vitest_1.expect)(electron_updater_1.autoUpdater.quitAndInstall).toHaveBeenCalled();
        }
        (0, vitest_1.expect)(electron_1.BrowserWindow.getAllWindows).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should prompt the user on update-downloaded in normal mode (packaged)', async () => {
        (0, updater_1.initAutoUpdater)(false, mockSettingsService);
        const callback = electron_updater_2.autoUpdaterEvents['update-downloaded'];
        (0, vitest_1.expect)(callback).toBeDefined();
        callback({ version: '1.2.3' });
        (0, vitest_1.expect)(electron_updater_1.autoUpdater.quitAndInstall).not.toHaveBeenCalled();
        const win = vitest_1.vi.mocked(electron_1.BrowserWindow.getAllWindows).mock.results[0].value[0];
        (0, vitest_1.expect)(win.webContents.send).toHaveBeenCalledWith('updater:state-changed', {
            type: 'ready',
            update: { version: '1.2.3' },
        });
    });
    (0, vitest_1.it)('should show modal on update-not-available if manual check', async () => {
        (0, updater_1.initAutoUpdater)(false, mockSettingsService);
        (0, updater_1.checkForUpdates)(true);
        const callback = electron_updater_2.autoUpdaterEvents['update-not-available'];
        (0, vitest_1.expect)(callback).toBeDefined();
        callback({ version: '1.0.0' });
        (0, vitest_1.expect)(electron_1.dialog.showMessageBox).toHaveBeenCalledWith(vitest_1.expect.anything(), vitest_1.expect.objectContaining({
            message: 'No updates available',
        }));
    });
    (0, vitest_1.it)('should NOT show modal on update-not-available if periodic check', async () => {
        (0, updater_1.initAutoUpdater)(false, mockSettingsService);
        (0, updater_1.checkForUpdates)(false);
        const callback = electron_updater_2.autoUpdaterEvents['update-not-available'];
        (0, vitest_1.expect)(callback).toBeDefined();
        callback({ version: '1.0.0' });
        (0, vitest_1.expect)(electron_1.dialog.showMessageBox).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should NOT show modal on update-not-available if manual check in headless mode', async () => {
        (0, updater_1.initAutoUpdater)(true, mockSettingsService);
        (0, updater_1.checkForUpdates)(true);
        const callback = electron_updater_2.autoUpdaterEvents['update-not-available'];
        (0, vitest_1.expect)(callback).toBeDefined();
        callback({ version: '1.0.0' });
        (0, vitest_1.expect)(electron_1.dialog.showMessageBox).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should set lastState and broadcast state to all windows on broadcastState', () => {
        const statePayload = {
            type: 'downloading',
            progress: { percent: 50 },
        };
        (0, updater_1.broadcastState)(statePayload);
        (0, vitest_1.expect)((0, updater_1.getLastState)()).toEqual(statePayload);
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        (0, vitest_1.expect)(win.webContents.send).toHaveBeenCalledWith('updater:state-changed', statePayload);
    });
});
