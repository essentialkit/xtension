import Analytics from "../utils/analytics";
/*
 * Set up context menu (right-click menu) for different conexts.
 * See reference https://developer.chrome.com/docs/extensions/reference/contextMenus/#method-create.
 * Max number of browser_action menu items: 6 - https://developer.chrome.com/docs/extensions/reference/contextMenus/#property-ACTION_MENU_TOP_LEVEL_LIMIT
 */
interface MenuItem {
  menu: chrome.contextMenus.CreateProperties;
  handler: (
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab
  ) => void;
}

/*
 * Prefer arrow method names here -
 * https://www.typescriptlang.org/docs/handbook/2/classes.html#arrow-functions.
 */

declare var IS_DEV_BUILD: boolean;
class ContextMenu {
  RELOAD_ACTION: MenuItem = {
    menu: {
      id: 'reload-action',
      title: 'Reload Extension',
      visible: true,
      contexts: ['action'],
    },
    handler: (unusedInfo) => {
      chrome.runtime.reload();
    },
  };

  CLEAR_STORAGE: MenuItem = {
    menu: {
      id: 'clear-storage',
      title: 'Clear Storage',
      visible: true,
      contexts: ['action'],
    },
    handler: (unusedInfo) => {
      chrome.storage.sync.clear();
      chrome.storage.local.clear();
    },
  };

  browserActionContextMenu: MenuItem[] = [];

  init = () => {
    // Maybe add dev-only actions.
    if(IS_DEV_BUILD) {
      this.browserActionContextMenu.push(this.RELOAD_ACTION, this.CLEAR_STORAGE);
    }

    // Check if we can access context menus.
    if (!chrome || !chrome.contextMenus) {
      console.warn('No access to chrome.contextMenus');
      return;
    }

    // Clear the menu.
    chrome.contextMenus.removeAll();
    // Add menu items.
    this.browserActionContextMenu.forEach((item) =>
      chrome.contextMenus.create(item.menu)
    );
    /*
     * When onClick is fired, execute the handler associated
     * with the menu clicked.
     */
    chrome.contextMenus.onClicked.addListener(this.onClick);
  };

  onClick = (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    const menuItem = this.browserActionContextMenu.find(
      (item) => item.menu.id === info.menuItemId
    );
    if (menuItem) {
      Analytics.fireEvent("context_menu_click", {"menu_id": menuItem.menu.id})
      menuItem.handler(info, tab);
    } else {
      console.error('Unable to find menu item: ', info);
    }
  };

  sendMessage(message: any): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
        console.debug('ack:', response);
      });
    });
  }
}

new ContextMenu().init();