import { onRequestAction } from "../src/rx/on-request-action";
import { runtimeOnMessage } from "../src/rx/runtime-on-message";
import { filter, share } from "rxjs/operators";

console.log("youtube.ts");
chrome.runtime.sendMessage({
  ready: true,
});

const runtimeMessage$ = runtimeOnMessage();
const onPlaybackRateIncoming$ = runtimeMessage$.pipe(
  onRequestAction("playbackRate")
);

const onRequireCurPlaybackRate$ = runtimeMessage$.pipe(
  onRequestAction("requestCurState")
);

onPlaybackRateIncoming$.subscribe(({ request, sendResponse }) => {
  const videoEl = document.querySelector("video")!;
  videoEl.playbackRate = Number(request.playbackRate);
  sendResponse({ status: "ok" });
});

onRequireCurPlaybackRate$.subscribe(({ sendResponse }) => {
  const videoEl = document.querySelector("video")!;
  sendResponse({
    playbackRate: videoEl.playbackRate,
  });
});
