const env = process.env;
const settings = [
  "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY",
  "CONSULTATION_FROM", "CONSULTATION_TO", "CONSULTATION_PRIVACY", "CRON_SECRET",
];

async function database(path, options = {}) {
  const response = await fetch(new URL("/rest/v1/" + path, env.SUPABASE_URL), {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Database request failed");
  return response;
}

async function notify(id) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": "consultation/" + id,
    },
    body: JSON.stringify({
      from: env.CONSULTATION_FROM,
      to: [env.CONSULTATION_TO],
      subject: "새 주방 상담 문의",
      text: "상담 기록에서 접수 번호를 확인하세요.\n" + id,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Notification request failed");
  await database("consultations?id=eq." + id, {
    method: "PATCH",
    body: JSON.stringify({ notified_at: new Date().toISOString() }),
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const live = settings.every((key) => Boolean(env[key]));

  if (req.method === "GET") {
    if (req.query?.retry === "1") {
      if (!live || req.headers.authorization !== "Bearer " + env.CRON_SECRET) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const response = await database("consultations?select=id&notified_at=is.null&order=created_at.asc&limit=10");
        const rows = await response.json();
        const outcomes = await Promise.allSettled(rows.map(({ id }) => notify(id)));
        const failed = outcomes.filter(({ status }) => status === "rejected").length;
        return res.status(failed ? 502 : 200).json({ attempted: rows.length, failed });
      } catch {
        return res.status(503).json({ message: "Retry unavailable" });
      }
    }
    return res.status(200).json({ live, privacy: live ? env.CONSULTATION_PRIVACY : undefined });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "지원하지 않는 요청입니다." });
  }
  if (!live) return res.status(503).json({ message: "상담 접수를 준비 중입니다." });
  if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] ?? "")) {
    return res.status(415).json({ message: "지원하지 않는 요청 형식입니다." });
  }

  const body = req.body;
  const read = (key) => typeof body?.[key] === "string" ? body[key].trim() : "";
  const id = read("id");
  const name = read("name");
  const phone = read("phone");
  const region = read("region");
  const schedule = read("schedule");
  const message = read("message");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
    !name || name.length > 80 || !region || region.length > 100 ||
    !/^[+\d(). -]{7,30}$/.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, "")) ||
    schedule.length > 100 || !message || message.length > 2000 ||
    body.consent !== "on" || read("website")
  ) {
    return res.status(400).json({ message: "필수 항목, 연락처 형식 및 개인정보 동의를 확인해 주세요." });
  }
  try {
    await database("consultations?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ id, name, phone, region, schedule, message }),
    });
  } catch {
    return res.status(503).json({ message: "접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." });
  }
  try {
    const response = await database("consultations?select=id&id=eq." + id + "&notified_at=is.null");
    if ((await response.json()).length) await notify(id);
  } catch {
    console.error("Consultation notification pending");
  }
  return res.status(200).json({ message: "상담 신청이 접수되었습니다. 접수 번호 " + id });
}
