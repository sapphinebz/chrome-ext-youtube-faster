import { Observable } from "rxjs";
import { CallBackListener } from "../../models/callback-listener";

export function runtimeOnMessage() {
  return new Observable<CallBackListener>((subscriber) => {
    const callback = (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: () => void
    ) => {
      subscriber.next({ request, sender, sendResponse });
      return undefined;
    };
    chrome.runtime.onMessage.addListener(callback);
    return {
      unsubscribe: () => {
        chrome.runtime.onMessage.removeListener(callback);
      },
    };
  });
}
