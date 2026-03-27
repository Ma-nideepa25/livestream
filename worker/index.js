export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "telegram-upload-bridge" });
    }

    if (request.method !== "POST" || url.pathname !== "/upload") {
      return new Response("Not Found", { status: 404 });
    }

    const uploadKey = request.headers.get("X-Upload-Key");
    if (!uploadKey || uploadKey !== env.UPLOAD_SHARED_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Expected multipart/form-data", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const caption = formData.get("caption") || "Live stream archive";

    if (!(file instanceof File)) {
      return new Response("Missing file", { status: 400 });
    }

    const telegramForm = new FormData();
    telegramForm.append("chat_id", env.TELEGRAM_CHAT_ID);
    telegramForm.append("caption", String(caption));
    telegramForm.append("document", file, file.name || "recording.webm");

    const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`;

    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      body: telegramForm,
    });

    const telegramPayload = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramPayload.ok) {
      return Response.json(
        { ok: false, error: telegramPayload },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      telegram_message_id: telegramPayload.result?.message_id,
      telegram_chat_id: telegramPayload.result?.chat?.id,
    });
  },
};
