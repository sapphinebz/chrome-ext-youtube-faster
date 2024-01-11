export interface CallBackListener {
  request: any;
  sender: chrome.runtime.MessageSender;
  sendResponse: (payload?: any) => void;
}
