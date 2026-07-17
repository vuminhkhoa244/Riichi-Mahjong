import { state } from "./state.js";
import { startRound, drawTile, discardSelected, riichiCheck, handleCall, passCall } from "./game.js";

window.addEventListener("DOMContentLoaded", () => {
  const drawBtn = document.getElementById("draw-btn");
  const discardBtn = document.getElementById("discard-btn");
  const riichiBtn = document.getElementById("riichi-btn");
  const resetBtn = document.getElementById("reset-btn");
  const ponBtn = document.getElementById("pon-btn");
  const chiBtn = document.getElementById("chi-btn");
  const kanBtn = document.getElementById("kan-btn");
  const ronBtn = document.getElementById("ron-btn");
  const passBtn = document.getElementById("pass-call-btn");

  if (drawBtn) drawBtn.addEventListener("click", drawTile);
  if (discardBtn) discardBtn.addEventListener("click", discardSelected);
  if (riichiBtn) riichiBtn.addEventListener("click", riichiCheck);
  if (resetBtn) resetBtn.addEventListener("click", startRound);
  if (ponBtn) ponBtn.addEventListener("click", () => handleCall("pon"));
  if (chiBtn) chiBtn.addEventListener("click", () => handleCall("chi"));
  if (kanBtn) kanBtn.addEventListener("click", () => handleCall("kan"));
  if (ronBtn) ronBtn.addEventListener("click", () => handleCall("ron"));
  if (passBtn) passBtn.addEventListener("click", passCall);

  startRound();
});
