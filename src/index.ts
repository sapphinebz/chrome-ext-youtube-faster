import { ReplaySubject, fromEvent } from "rxjs";
import { concatMap, distinctUntilChanged, map, tap } from "rxjs/operators";
import { runtimeOnMessage } from "./rx/listen-message";

console.log("extension init");

const rangePlaybackRateEl = document.querySelector<HTMLInputElement>(
  "input[data-playback-rate]"
)!;
const inptVolumeEl = document.querySelector<HTMLSpanElement>("#inptVolume")!;
const resetBtnEl =
  document.querySelector<HTMLButtonElement>("[data-reset-btn]")!;
const playRateValue$ = new ReplaySubject<number>(1);

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

      console.log(tab);
      try {
        await sendToYoutube(tab, value);
      } catch (err) {
        console.log({ error: err });
        if (tab.id) {
          await chrome.tabs.reload(tab.id);
        }
        console.log("after reloaded");
        const _tab = await tabAvailable();
        console.log("after delay");
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
  const response = await chrome.tabs.sendMessage(tabId, {
    reqCurPlaybackRate: true,
  });

  console.log("sync response", response);

  rangePlaybackRateEl.value = response.playbackRate;
  inptVolumeEl.innerText = `${response.playbackRate}`;
}

function delay(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function tabAvailable() {
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    const subscription = runtimeOnMessage().subscribe((context) => {
      if (context.request.ready) {
        if (context.sender.tab) {
          resolve(context.sender.tab);
          subscription.unsubscribe();
        } else {
          reject("tab unvailable");
        }
      }
    });
  });
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
