const consultation = document.querySelector("#consultation");
const mobileCta = document.querySelector(".mobile-cta");

new IntersectionObserver(([entry]) => {
  mobileCta.hidden = entry.isIntersecting;
}).observe(consultation);
const backgroundMusic = document.querySelector("#background-music");
const musicControls = document.querySelector(".music-controls");
const musicToggle = document.querySelector("#music-toggle");
const musicVolume = document.querySelector("#music-volume");
const musicVolumeValue = document.querySelector("#music-volume-value");
const musicStatus = document.querySelector("#music-status");
let musicWanted = true;
let musicStarting = false;
let musicNeedsGesture = false;

// Set the initial volume before the first scripted playback attempt.
backgroundMusic.volume = Number(musicVolume.value) / 100;

function updateMusicControls() {
  const playing = !backgroundMusic.paused;
  musicToggle.textContent = playing ? "음악 끄기" : "음악 켜기";
  musicToggle.setAttribute("aria-pressed", String(playing));
}

async function startMusic() {
  if (!musicWanted || musicStarting) return;
  musicStarting = true;
  try {
    await backgroundMusic.play();
    musicNeedsGesture = false;
    if (!musicWanted) backgroundMusic.pause();
    musicStatus.textContent = musicWanted ? "배경 음악이 재생 중입니다." : "배경 음악이 꺼졌습니다.";
  } catch (error) {
    musicNeedsGesture = error.name === "NotAllowedError";
    musicStatus.textContent = musicNeedsGesture
      ? "화면을 클릭하거나 음악 켜기 버튼을 누르면 음악이 재생됩니다."
      : "음악을 재생하지 못했습니다. 음악 켜기를 눌러 다시 시도해 주세요.";
  } finally {
    musicStarting = false;
    updateMusicControls();
  }
}

musicToggle.addEventListener("click", () => {
  musicWanted = backgroundMusic.paused && !musicStarting;
  if (musicWanted) {
    startMusic();
  } else {
    musicNeedsGesture = false;
    backgroundMusic.pause();
    musicStatus.textContent = "배경 음악이 꺼졌습니다.";
    updateMusicControls();
  }
});

musicVolume.addEventListener("input", () => {
  backgroundMusic.volume = Number(musicVolume.value) / 100;
  musicVolumeValue.textContent = musicVolume.value + "%";
});

backgroundMusic.addEventListener("play", updateMusicControls);
backgroundMusic.addEventListener("pause", updateMusicControls);
backgroundMusic.addEventListener("error", () => {
  musicNeedsGesture = false;
  musicStatus.textContent = "음악 파일을 불러오지 못했습니다.";
  updateMusicControls();
});

function resumeMusicAfterGesture(event) {
  if (!musicWanted || !musicNeedsGesture || musicControls.contains(event.target)) return;
  if (event.type === "keydown" && (event.repeat || event.ctrlKey || event.altKey || event.metaKey)) return;
  startMusic();
}

document.addEventListener("click", resumeMusicAfterGesture);
document.addEventListener("keydown", resumeMusicAfterGesture);
startMusic();
const comparisonFrame = document.querySelector("#kitchen-comparison");
const comparisonRange = document.querySelector("#comparison-range");
const comparisonPresets = document.querySelectorAll("[data-comparison-split]");
const beforeLabel = comparisonFrame.querySelector(".label-before");
const afterLabel = comparisonFrame.querySelector(".label-after");

function setComparisonSplit(value) {
  const split = Math.max(0, Math.min(100, Math.round(Number(value))));
  comparisonRange.value = String(split);
  comparisonFrame.style.setProperty("--split", split + "%");
  comparisonRange.setAttribute("aria-valuetext", "디자인 시안 " + split + "%, 완성 이미지 " + (100 - split) + "%");
  beforeLabel.hidden = split < 15;
  afterLabel.hidden = split > 85;
  for (const preset of comparisonPresets) {
    preset.setAttribute("aria-pressed", String(Number(preset.dataset.comparisonSplit) === split));
  }
}

comparisonRange.addEventListener("input", () => setComparisonSplit(comparisonRange.value));
for (const preset of comparisonPresets) {
  preset.addEventListener("click", () => setComparisonSplit(preset.dataset.comparisonSplit));
}
for (const image of comparisonFrame.querySelectorAll("img")) {
  const showImageError = () => { document.querySelector(".comparison-error").hidden = false; };
  image.addEventListener("error", showImageError, { once: true });
  if (image.complete && image.naturalWidth === 0) showImageError();
}
setComparisonSplit(50);

const typingText = document.querySelector("#typing-text");
const typingPhrase = "[YOU DERAM KITCHEN]";
const typingMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let typingIndex = 0;
let typingErasing = false;
let typingTimer;

function renderTypingText() {
  typingText.textContent = typingPhrase.slice(0, typingIndex);
}

function advanceTyping() {
  typingIndex += typingErasing ? -1 : 1;
  renderTypingText();

  let delay = 120;
  if (typingIndex === typingPhrase.length) {
    typingErasing = true;
    delay = 2000;
  } else if (typingIndex === 0) {
    typingErasing = false;
  }
  typingTimer = window.setTimeout(advanceTyping, delay);
}

function resetTyping() {
  window.clearTimeout(typingTimer);
  typingIndex = typingMotion.matches ? typingPhrase.length : 0;
  typingErasing = false;
  renderTypingText();
  if (!typingMotion.matches) {
    typingTimer = window.setTimeout(advanceTyping, 120);
  }
}

typingMotion.addEventListener("change", resetTyping);
resetTyping();
