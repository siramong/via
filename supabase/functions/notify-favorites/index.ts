import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface NotificationPayload {
  stationId: string;
  stationName: string;
  fuelType: string;
  price: number;
  type: "price_updated";
}

Deno.serve(async (req: Request) => {
  try {
    const payload: NotificationPayload = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Query favorites for this station
    const favResponse = await fetch(
      `${supabaseUrl}/rest/v1/favorites?station_id=eq.${payload.stationId}&select=user_id`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    const favorites = await favResponse.json();

    if (!Array.isArray(favorites) || favorites.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    const userIds = favorites.map((f: Record<string, unknown>) => f.user_id);
    const uniqueIds = [...new Set(userIds)];

    // Get push tokens for those users
    const tokensResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?id=in.(${uniqueIds.map((id) => `"${id}"`).join(",")})&select=expo_push_token`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    );
    const users = await tokensResponse.json();

    if (!Array.isArray(users)) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    const tokens: string[] = users
      .map((u: Record<string, unknown>) => u.expo_push_token)
      .filter((t): t is string => typeof t === "string" && t.length > 0);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    // Send push notifications via Expo
    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: `Precio actualizado en ${payload.stationName}`,
      body: `${payload.fuelType.toUpperCase()} — $${payload.price.toFixed(2)}. Toca para ver.`,
      data: { stationId: payload.stationId, type: "price_update" },
    }));

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    return new Response(JSON.stringify({ sent: tokens.length, result: pushResult }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
