const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_BASE = "https://api.replicate.com/v1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pollPrediction = async (predictionId) => {
  const MAX = 30;
  for (let i = 0; i < MAX; i++) {
    await sleep(1000);

    const res = await fetch(`${REPLICATE_BASE}/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
    });

    const data = await res.json();

    if (data.status === "succeeded") {
      return Array.isArray(data.output)
        ? data.output.join("")
        : data.output || "";
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Prediction ${data.status}: ${data.error || ""}`);
    }
  }

  throw new Error("Replicate timeout setelah 30 detik.");
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  // ── GET /predictions/:id  →  polling ──────────────────────────────────────
  if (event.httpMethod === "GET") {
    const predictionId = event.queryStringParameters?.id;
    if (!predictionId) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing prediction id" }),
      };
    }

    try {
      const result = await pollPrediction(predictionId);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ output: result }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── POST /predictions  →  create + poll sampai selesai ───────────────────
  if (event.httpMethod === "POST") {
    if (!REPLICATE_TOKEN) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "REPLICATE_API_TOKEN tidak ditemukan di environment." }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    try {
      // 1. Buat prediction
      const createRes = await fetch(`${REPLICATE_BASE}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        return {
          statusCode: createRes.status,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: err.detail || createRes.statusText }),
        };
      }

      const prediction = await createRes.json();

      // 2. Poll sampai selesai (di dalam function, bukan di browser)
      const output = await pollPrediction(prediction.id);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ output }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};