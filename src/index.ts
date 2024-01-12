/// <reference types="chrome-types" />
import { ReplaySubject, firstValueFrom, fromEvent } from "rxjs";
import {
  concatMap,
  distinctUntilChanged,
  first,
  map,
  share,
  tap,
} from "rxjs/operators";
import { runtimeOnMessage } from "./rx/runtime-on-message";
import { onRequestAction } from "./rx/on-request-action";

console.log("extension init");

const rangePlaybackRateEl = document.querySelector<HTMLInputElement>(
  "input[data-playback-rate]"
)!;
const inptVolumeEl = document.querySelector<HTMLSpanElement>("#inptVolume")!;
const resetBtnEl =
  document.querySelector<HTMLButtonElement>("[data-reset-btn]")!;
const playRateValue$ = new ReplaySubject<number>(1);
const runtimeMessage$ = runtimeOnMessage();
const onTabReady$ = runtimeMessage$.pipe(onRequestAction("ready"));

fromEvent(rangePlaybackRateEl, "input")
  .pipe(
    map(() => rangePlaybackRateEl.valueAsNumber),
    distinctUntilChanged()
  )
  .subscribe(playRateValue$);

fromEvent(resetBtnEl, "click").subscribe(() => {
  playRateValue$.next(1);
});

syncCurrentPlaybackRate();

playRateValue$
  .pipe(
    tap(() => {
      console.log("concat");
    }),
    concatMap(async (value) => {
      const [tab] = await chrome.tabs.query({
        active: true,
      });

      try {
        await sendToYoutube(tab, value);
      } catch (err) {
        console.log({ error: err });
        if (tab.id) {
          await chrome.tabs.reload(tab.id);
        }
        const _tab = await tabAvailable();
        await sendToYoutube(_tab, value);
      }
      inptVolumeEl.innerText = `${value}`;
      rangePlaybackRateEl.valueAsNumber = value;
    })
  )
  .subscribe();

async function syncCurrentPlaybackRate() {
  const [tab] = await chrome.tabs.query({
    active: true,
  });
  if (tab.id) {
    try {
      await syncPlaybackRate(tab.id);
    } catch (err) {
      console.error(err);
      await chrome.tabs.reload(tab.id);
      const _tab = await tabAvailable();
      if (_tab.id) {
        await syncPlaybackRate(_tab.id);
      }
    }
  }
}

async function syncPlaybackRate(tabId: number) {
  console.log(`request current state tabId: ${tabId}`);
  const response = await chrome.tabs.sendMessage(tabId, {
    requestCurState: true,
  });
  console.log(`response current state ${response}`);

  rangePlaybackRateEl.value = response.playbackRate;
  inptVolumeEl.innerText = `${response.playbackRate}`;
}

function tabAvailable() {
  return firstValueFrom(
    onTabReady$.pipe(
      map((context) => context.sender.tab),
      first((tab): tab is chrome.tabs.Tab => Boolean(tab))
    )
  );
}

async function sendToYoutube(tab: chrome.tabs.Tab, playbackRate: number) {
  if (tab.id) {
    const response = await chrome.tabs.sendMessage(tab.id, {
      playbackRate,
    });
    console.log({ response });
    return response;
  }
  return null;
}
