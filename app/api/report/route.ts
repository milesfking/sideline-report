import { buildReport } from "@/lib/sleeper/aggregate";
import { orderPlayersForRooting } from "@/lib/rooting/score";
import type { LeagueCare } from "@/lib/types";

const CARE_VALUES = new Set<LeagueCare>([
  "careALot",
  "careALittle",
  "couldntCareLess",
]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  const username =
    body && typeof body === "object" && "username" in body
      ? String((body as { username: unknown }).username ?? "").trim()
      : "";
  const careRaw =
    body && typeof body === "object" && "care" in body
      ? (body as { care: unknown }).care
      : null;

  if (!username) {
    return Response.json({ error: "username required" }, { status: 400 });
  }
  if (!careRaw || typeof careRaw !== "object") {
    return Response.json({ error: "care map required" }, { status: 400 });
  }

  const care: Record<string, LeagueCare> = {};
  for (const [leagueId, value] of Object.entries(
    careRaw as Record<string, unknown>,
  )) {
    if (typeof value === "string" && CARE_VALUES.has(value as LeagueCare)) {
      care[leagueId] = value as LeagueCare;
    }
  }

  try {
    const report = await buildReport(username, care);
    const ranked = orderPlayersForRooting(report.players);
    return Response.json({ ...report, ranked });
  } catch (err) {
    const status =
      err && typeof err === "object" && "status" in err
        ? Number((err as { status: number }).status)
        : 500;
    const message = err instanceof Error ? err.message : "Failed to build report";
    return Response.json({ error: message }, { status: status || 500 });
  }
}