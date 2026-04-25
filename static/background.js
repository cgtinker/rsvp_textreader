browser.contextMenus.create({
  id: 'textplayer-read',
  title: 'Read with TextPlayer',
  contexts: ['selection'],
});

async function getActiveTabText() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id == null) return '';
    const [result] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? '',
    });
    return result?.result ?? '';
  } catch {
    return '';
  }
}

async function openTextPlayer(text) {
  const finalText = text ?? await getActiveTabText();
  if (finalText) {
    await browser.storage.local.set({ pendingText: finalText });
  }
  browser.windows.create({
    url: browser.runtime.getURL('index.html'),
    type: 'popup',
    width: 600,
    height: 500,
  });
}

browser.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'textplayer-read') {
    openTextPlayer(info.selectionText ?? '');
  }
});

browser.action.onClicked.addListener(() => {
  openTextPlayer(null);
});

browser.commands.onCommand.addListener((command) => {
  if (command === 'open-textplayer') {
    openTextPlayer(null);
  }
});
