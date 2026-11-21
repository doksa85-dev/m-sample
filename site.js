const form = document.querySelector("#consultation-form");
const button = form.querySelector("button");
const status = document.querySelector("#status");
const consultation = document.querySelector("#consultation");
const mobileCta = document.querySelector(".mobile-cta");
let live = false;
let submissionId;

new IntersectionObserver(([entry]) => {
  mobileCta.hidden = entry.isIntersecting;
}).observe(consultation);

async function initialize() {
  try {
    const response = await fetch(form.action, { headers: { Accept: "application/json" } });
    if (response.ok) {
      const configuration = await response.json();
      live = configuration.live === true;
      if (live) {
        document.querySelector("#preview-note").hidden = true;
        document.querySelector("#privacy-text").textContent = configuration.privacy;
      }
    }
  } catch {
    // The static preview also works without an API.
  } finally {
    button.disabled = false;
  }
}

form.addEventListener("input", () => { submissionId = undefined; });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!live) {
    status.textContent = "미리보기 제출이 완료되었습니다. 입력 내용은 저장되지 않았습니다.";
    form.reset();
    return;
  }

  const values = Object.fromEntries(new FormData(form));
  submissionId ??= crypto.randomUUID();
  button.disabled = true;
  status.textContent = "상담 신청을 보내는 중입니다.";
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, id: submissionId }),
    });
    const result = await response.json();
    status.textContent = result.message;
    if (response.ok) {
      form.reset();
      submissionId = undefined;
    }
  } catch {
    status.textContent = "연결 상태를 확인한 뒤 다시 시도해 주세요.";
  } finally {
    button.disabled = false;
  }
});

initialize();

const comparisonFrame = document.querySelector("#hero-comparison");
const comparisonRange = document.querySelector("#comparison-range");
const comparisonSlider = document.querySelector("#comparison-slider");
const comparisonReadout = document.querySelector("#comparison-readout");
const comparisonPresets = document.querySelectorAll("[data-comparison-split]");
const beforeLabel = comparisonFrame.querySelector(".label-before");
const afterLabel = comparisonFrame.querySelector(".label-after");

function setComparisonSplit(value) {
  const split = Math.max(0, Math.min(100, Math.round(Number(value))));
  comparisonRange.value = String(split);
  comparisonSlider.value = String(split);
  comparisonReadout.textContent = split + "%";
  comparisonFrame.style.setProperty("--split", split + "%");
  comparisonRange.setAttribute("aria-valuetext", "일러스트 " + split + "%, 실제 사진 " + (100 - split) + "%");
  beforeLabel.hidden = split < 15;
  afterLabel.hidden = split > 85;
  for (const preset of comparisonPresets) {
    preset.setAttribute("aria-pressed", String(Number(preset.dataset.comparisonSplit) === split));
  }
}

comparisonSlider.addEventListener("input", () => setComparisonSplit(comparisonSlider.value));
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
