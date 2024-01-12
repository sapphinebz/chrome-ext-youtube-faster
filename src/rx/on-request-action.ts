import { MonoTypeOperatorFunction, pipe } from "rxjs";
import { filter, share } from "rxjs/operators";
import { CallBackListener } from "../../models/callback-listener";

export function onRequestAction(
  name: string
): MonoTypeOperatorFunction<CallBackListener> {
  return pipe(
    filter(({ request }) => Boolean(request[name])),
    share()
  );
}
