import { 
    setAutoCompileMuatationObserver,
    turnOnAllPseudocodeView,
} from "./main";
import { initPseudocode } from "./pseudocode";

console.log("pseudocode daemon start");

initPseudocode();
turnOnAllPseudocodeView();
setAutoCompileMuatationObserver(document.documentElement);