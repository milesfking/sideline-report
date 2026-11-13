import assert from "node:assert/strict";
import { orderPlayersForRooting, scorePlayerRooting } from "@/lib/rooting/score";
import type { ReportPlayer } from "@/lib/types";

function player(
  id: string,
  leagues: ReportPlayer["leagues"],
  onSlate = true,
): ReportPlayer {
  return {
    playerId: id,
    name: id,
    nflTeam: "KC",
    position: "WR",
    onSlate,
    kickoffIso: "2026-11-16T18:00:00Z",
    gameStatus: "pre",
    isLive: false,
    leagues,
  };
}

function approx(actual: number, expected: number) {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `expected ${expected}, got ${actual}`,
  );
}

function run() {
  // T1: Own only, careALot
  approx(
    scorePlayerRooting(
      player("t1", [
        {
          leagueId: "L1",
          leagueName: "Serious",
          care: "careALot",
          ownedByUser: 1,
          ownedByOpponents: 0,
        },
      ]),
    ),
    1.0,
  );

  // T2: Opp only, careALot
  approx(
    scorePlayerRooting(
      player("t2", [
        {
          leagueId: "L1",
          leagueName: "Serious",
          care: "careALot",
          ownedByUser: 0,
          ownedByOpponents: 1,
        },
      ]),
    ),
    -0.92,
  );

  // T3: Equal-care cancelation → slight FOR
  approx(
    scorePlayerRooting(
      player("t3", [
        {
          leagueId: "L1",
          leagueName: "A",
          care: "careALot",
          ownedByUser: 1,
          ownedByOpponents: 0,
        },
        {
          leagueId: "L2",
          leagueName: "B",
          care: "careALot",
          ownedByUser: 0,
          ownedByOpponents: 1,
        },
      ]),
    ),
    0.08,
  );

  // T4: Own careALittle + opp careALot
  approx(
    scorePlayerRooting(
      player("t4", [
        {
          leagueId: "L1",
          leagueName: "A",
          care: "careALittle",
          ownedByUser: 1,
          ownedByOpponents: 0,
        },
        {
          leagueId: "L2",
          leagueName: "B",
          care: "careALot",
          ownedByUser: 0,
          ownedByOpponents: 1,
        },
      ]),
    ),
    0.45 - 0.92,
  );

  // T7: Off-slate excluded
  const ordered = orderPlayersForRooting([
    player(
      "active",
      [
        {
          leagueId: "L1",
          leagueName: "A",
          care: "careALot",
          ownedByUser: 1,
          ownedByOpponents: 0,
        },
      ],
      true,
    ),
    player(
      "bye",
      [
        {
          leagueId: "L1",
          leagueName: "A",
          care: "careALot",
          ownedByUser: 1,
          ownedByOpponents: 0,
        },
      ],
      false,
    ),
  ]);
  assert.equal(ordered.length, 1);
  assert.equal(ordered[0].playerId, "active");
  assert.equal(ordered[0].fieldPos, 0.5);

  // T12: Stable id tiebreak
  const tied = orderPlayersForRooting([
    player("b", [
      {
        leagueId: "L1",
        leagueName: "A",
        care: "careALot",
        ownedByUser: 1,
        ownedByOpponents: 0,
      },
    ]),
    player("a", [
      {
        leagueId: "L1",
        leagueName: "A",
        care: "careALot",
        ownedByUser: 1,
        ownedByOpponents: 0,
      },
    ]),
  ]);
  assert.deepEqual(
    tied.map((r) => r.playerId),
    ["a", "b"],
  );

  console.log("rooting score tests passed");
}

run();