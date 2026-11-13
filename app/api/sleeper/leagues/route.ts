import { fetchLeaguesForUsername } from "@/lib/sleeper/aggregate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return Response.json({ error: "username required" }, { status: 400 });
  }

  try {
    const data = await fetchLeaguesForUsername(username);
    return Response.json(data);
  } catch (err) {
    const status =
      err && typeof err === "object" && "status" in err
        ? Number((err as { status: number }).status)
        : 500;
    const message = err instanceof Error ? err.message : "Failed to load leagues";
    return Response.json({ error: message }, { status: status || 500 });
  }
}