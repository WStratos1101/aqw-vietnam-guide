export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json({
      ok: false,
      error: "D1 binding DB not found"
    }, { status: 503 });
  }

  try {
    const result = await env.DB
      .prepare("SELECT 1 AS connected")
      .first();

    return Response.json({
      ok: result?.connected === 1,
      database: "connected",
      service: "AQW Vietnam Guide"
    });
  } catch (error) {
    console.error("D1 health check failed", error);

    return Response.json({
      ok: false,
      error: "Database connection failed"
    }, { status: 503 });
  }
}
