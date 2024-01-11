import { runtimeOnMessage } from "../src/rx/listen-message";
import { filter, share } from "rxjs/operators";

console.log("youtube.ts");
chrome.runtime.sendMessage({
  ready: true,
});

const runtimeMessage$ = runtimeOnMessage().pipe(share());
const onPlaybackRateIncoming$ = runtimeMessage$.pipe(
  filter(({ request }) => request.playbackRate),
  share()
);

const onRequireCurPlaybackRate$ = runtimeMessage$.pipe(
  filter(({ request }) => request.reqCurPlaybackRate),
  share()
);

onPlaybackRateIncoming$.subscribe(({ request, sendResponse }) => {
  const videoEl = document.querySelector("video")!;
  videoEl.playbackRate = Number(request.playbackRate);
  sendResponse({ status: "ok" });
});

onRequireCurPlaybackRate$.subscribe(({ request, sendResponse }) => {
  const videoEl = document.querySelector("video")!;
  sendResponse({
    playbackRate: videoEl.playbackRate,
  });
});
