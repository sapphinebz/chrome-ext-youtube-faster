import { interval } from "rxjs";

interval(1000).subscribe((value) => {
  console.log(value);
});
console.log("Hello World");
