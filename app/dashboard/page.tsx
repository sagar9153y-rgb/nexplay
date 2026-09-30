import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Medal,
  Trophy,
  UserRound,
} from "lucide-react";

import XPProgressCard from "@/components/progression/XPProgressCard";
import AchievementCard from "@/components/progression/AchievementCard";
import GameHistoryList from "@/components/progression/GameHistoryList";
import StreakCard from "@/components/progression/StreakCard";
import DailyMissions from "@/components/progression/DailyMissions";

import { createClient } from "@/lib/supabase/server";
import { getProgressionSnapshot } from "@/lib/progression-data";

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-4">
      <p
        className={`text-2xl font-black ${
          accent ?? "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#85818e]">
        {label}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let snapshot;

  try {
    snapshot = await getProgressionSnapshot(supabase);
  } catch {
    return (
      <main className="min-h-screen bg-[#08080b] pb-24 pt-28">
        <div className="container-wide max-w-[1050px]">
          <header className="mb-8">
            <p className="eyebrow mb-3">
              Player dashboard
            </p>

            <h1 className="text-4xl font-black text-white">
              Progress unavailable
            </h1>

            <p className="mt-3 text-sm text-[#85818e]">
              We couldn&apos;t load your progression data.
              Your account is still safe.
            </p>
          </header>

          <div
            role="alert"
            className="glass rounded-xl border border-[#ff4058]/20 p-5 text-sm text-[#ffb0ba]"
          >
            Please retry in a moment. No private account
            details are shown here.
          </div>

          <Link
            href="/dashboard"
            className="ghost-button mt-5 inline-flex"
          >
            Retry
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  const unlocked = snapshot.achievements.filter(
    (achievement) => achievement.unlocked_at
  );

  return (
    <main className="min-h-screen bg-[#08080b] pb-24 pt-28">
      <div className="container-wide max-w-[1120px]">

        {/* HEADER */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/[.07] pb-7">
          <div>
            <p className="eyebrow mb-3">
              Player dashboard
            </p>

            <h1 className="text-4xl font-black text-white sm:text-5xl">
              Welcome,{" "}
              <span className="text-[#ff4058]">
                {snapshot.profile.username}
              </span>
            </h1>

            <p className="mt-3 text-sm text-[#85818e]">
              Your NEXPLAY progress at a glance.
            </p>
          </div>

          <Link
            href="/games"
            className="accent-button"
          >
            Play Games
            <ArrowRight size={15} />
          </Link>
        </header>

        {/* MIGRATION NOTICE */}
        {snapshot.migrationPending && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-[#ffb54c]/25 bg-[#ffb54c]/[.06] px-4 py-3 text-xs leading-5 text-[#ffcf7b]"
          >
            Your existing XP is available. Run{" "}
            <span className="font-bold">
              sql/progression-platform.sql
            </span>{" "}
            in Supabase to enable history, achievements,
            streaks, and leaderboard statistics.
          </div>
        )}

        {/* XP + CORE METRICS */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><DailyMissions />
          <XPProgressCard
            xp={snapshot.profile.xp}
            level={snapshot.profile.level}
          />

          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Games played"
              value={snapshot.stats.games_played}
            />

            <Metric
              label="Global rank"
              value={
                snapshot.stats.global_rank
                  ? `#${snapshot.stats.global_rank}`
                  : "—"
              }
              accent="text-[#ffb54c]"
            />

            <Metric
              label="Win rate"
              value={`${snapshot.stats.win_rate}%`}
              accent="text-[#60dba2]"
            />

            <StreakCard streak={snapshot.streak} />
          </div>
        </div>

        {/* DAILY MISSIONS */}
        <DailyMissions />

        {/* PERFORMANCE */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <BarChart3
              size={16}
              className="text-[#ff5368]"
            />
            Performance
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Wins"
              value={snapshot.stats.wins}
              accent="text-[#60dba2]"
            />

            <Metric
              label="Losses"
              value={snapshot.stats.losses}
              accent="text-[#ff6879]"
            />

            <Metric
              label="Draws"
              value={snapshot.stats.draws}
            />

            <Metric
              label="Tracked games"
              value={snapshot.stats.history_games}
            />
          </div>
        </section>

        {/* RECENT GAMES + ACHIEVEMENTS */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">

          <section className="glass rounded-xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Trophy
                  size={16}
                  className="text-[#ffb54c]"
                />
                Recent Games
              </h2>

              <Link
                href="/profile"
                className="text-[11px] font-bold text-[#aaa7b3] hover:text-white"
              >
                Full profile
              </Link>
            </div>

            <GameHistoryList
              games={snapshot.recent_games}
              limit={5}
            />
          </section>

          <section className="glass rounded-xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Medal
                  size={16}
                  className="text-[#ffb54c]"
                />
                Achievements
              </h2>

              <Link
                href="/achievements"
                className="text-[11px] font-bold text-[#aaa7b3] hover:text-white"
              >
                View all
              </Link>
            </div>

            {unlocked.length === 0 ? (
              <p className="rounded-lg bg-white/[.025] p-4 text-xs leading-5 text-[#85818e]">
                Your first achievement will appear here
                after you complete a milestone.
              </p>
            ) : (
              <div className="grid gap-3">
                {unlocked
                  .slice(0, 3)
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      compact
                    />
                  ))}
              </div>
            )}
          </section>
        </div>

        {/* LEADERBOARD */}
        <section className="glass mt-6 rounded-xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Medal
                size={16}
                className="text-[#ffb54c]"
              />
              Leaderboard Preview
            </h2>

            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#aaa7b3] hover:text-white"
            >
              Full leaderboard
              <ArrowRight size={13} />
            </Link>
          </div>

          {snapshot.leaderboard_preview.length === 0 ? (
            <p className="py-5 text-center text-xs text-[#85818e]">
              Leaderboard rankings will appear once
              progression data is enabled.
            </p>
          ) : (
            <ol className="divide-y divide-white/[.06]">
              {snapshot.leaderboard_preview.map(
                (entry) => (
                  <li
                    key={`${entry.rank}-${entry.username}`}
                    className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${
                      entry.is_current_user
                        ? "text-white"
                        : "text-[#c9c5ce]"
                    }`}
                  >
                    <span className="w-8 text-xs font-black text-[#ffb54c]">
                      #{entry.rank}
                    </span>

                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[.06] text-xs font-bold text-[#aaa7b3]"
                      aria-label={`${entry.username} avatar`}
                    >
                      {entry.avatar_url ? (
                        <span
                          className="h-full w-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${entry.avatar_url})`,
                          }}
                        />
                      ) : (
                        <UserRound size={16} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-xs font-bold">
                      {entry.username}

                      {entry.is_current_user && (
                        <span className="ml-2 text-[9px] uppercase text-[#ff6879]">
                          You
                        </span>
                      )}
                    </span>

                    <span className="text-[10px] text-[#85818e]">
                      Lv {entry.level}
                    </span>

                    <span className="w-20 text-right text-xs font-bold text-[#ffb54c]">
                      {entry.xp.toLocaleString()} XP
                    </span>
                  </li>
                )
              )}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}