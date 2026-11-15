import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/geist-mono";
import "./style.css";
import { render } from "preact";
import { App } from "./ui/App";

render(<App />, document.getElementById("app")!);
