export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const corsHeaders = buildCorsHeaders(origin, env.ALLOWED_ORIGINS);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "telegram-upload-bridge" }, 200, corsHeaders);
    }

    if (request.method !== "POST" || url.pathname !== "/upload") {
      return text("Not Found", 404, corsHeaders);
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "telegram-upload-bridge" });
    }

    if (request.method !== "POST" || url.pathname !== "/upload") {
      return new Response("Not Found", { status: 404 });
    }

    const uploadKey = request.headers.get("X-Upload-Key");
    if (!uploadKey || uploadKey !== env.UPLOAD_SHARED_KEY) {
      return text("Unauthorized", 401, corsHeaders);
      return new Response("Unauthorized", { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return text("Expected multipart/form-data", 400, corsHeaders);
      return new Response("Expected multipart/form-data", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const caption = formData.get("caption") || "Live stream archive";

    if (!(file instanceof File)) {
      return text("Missing file", 400, corsHeaders);
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
      return json(
        { ok: false, error: telegramPayload },
        502,
        corsHeaders,
      );
    }

    return json(
      {
        ok: true,
        telegram_message_id: telegramPayload.result?.message_id,
        telegram_chat_id: telegramPayload.result?.chat?.id,
      },
      200,
      corsHeaders,
    );
  },
};

function buildCorsHeaders(origin, allowedOriginsRaw) {
  const allowedOrigins = String(allowedOriginsRaw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowOrigin = pickAllowedOrigin(origin, allowedOrigins);

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Upload-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function pickAllowedOrigin(origin, allowedOrigins) {
  if (!origin) {
    return allowedOrigins[0] || "*";
  }

  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    return origin;
  }

  return allowedOrigins[0] || "*";
}

function json(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function text(payload, status, corsHeaders) {
  return new Response(payload, {
    status,
    headers: corsHeaders,
  });
}
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
