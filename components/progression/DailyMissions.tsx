"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Circle,
  Loader2,
  Target,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DailyMission = {
  id: string;
  mission_date: string;
  mission_code: string;
  title: string;
  description: string;
  game_type: string | null;
  target_value: number;
  progress_value: number;
  xp_reward: number;
  completed: boolean;
  completed_at: string | null;
};

export default function DailyMissions() {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const supabase = createClient();

      const { data, error: rpcError } = await supabase.rpc(
        "get_daily_missions"
      );

      if (rpcError) {
        console.error("Daily missions load failed:", rpcError);
        setError(true);
        return;
      }

      const parsed =
        Array.isArray(data)
          ? data
          : typeof data === "string"
            ? JSON.parse(data)
            : [];

      setMissions(parsed as DailyMission[]);
    } catch (err) {
      console.error("Daily missions error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void loadMissions();
}, [loadMissions]);

  const completedCount = missions.filter(
    (mission) => mission.completed
  ).length;

  return (
    <section className="glass mt-6 rounded-xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Target size={17} className="text-[#ff4058]" />
            <h2 className="text-sm font-bold text-white">
              Daily Missions
            </h2>
          </div>

          <p className="mt-1 text-[11px] text-[#85818e]">
            Complete today&apos;s challenges and keep your momentum.
          </p>
        </div>

        {!loading && missions.length > 0 && (
          <div className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#aaa7b3]">
            {completedCount}/{missions.length} Complete
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[150px] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-[#85818e]">
            <Loader2 size={15} className="animate-spin" />
            Loading missions...
          </div>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-[#ff4058]/15 bg-[#ff4058]/[.04] p-4"
        >
          <p className="text-xs font-bold text-[#ff9aa6]">
            Missions unavailable
          </p>

          <p className="mt-1 text-[11px] leading-5 text-[#85818e]">
            We couldn&apos;t load your daily missions right now.
          </p>

          <button
            type="button"
            onClick={() => void loadMissions()}
            className="mt-3 rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-white/[.07]"
          >
            Retry
          </button>
        </div>
      ) : missions.length === 0 ? (
        <div className="rounded-lg bg-white/[.025] p-5 text-center">
          <p className="text-xs font-bold text-white">
            No missions available
          </p>
          <p className="mt-1 text-[11px] text-[#85818e]">
            Your daily missions will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {missions.map((mission) => {
            const progress = Math.min(
              mission.progress_value,
              mission.target_value
            );

            const percentage = Math.min(
              100,
              Math.round((progress / mission.target_value) * 100)
            );

            return (
              <article
                key={mission.id}
                className={`rounded-xl border p-4 transition ${
                  mission.completed
                    ? "border-[#60dba2]/20 bg-[#60dba2]/[.045]"
                    : "border-white/[.06] bg-white/[.025] hover:border-white/[.1]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      mission.completed
                        ? "bg-[#60dba2]/10 text-[#60dba2]"
                        : "bg-[#ff4058]/10 text-[#ff5368]"
                    }`}
                  >
                    {mission.completed ? (
                      <Check size={17} />
                    ) : (
                      <Circle size={17} />
                    )}
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-[#ffb54c]/[.08] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#ffb54c]">
                    <Trophy size={10} />
                    +{mission.xp_reward} XP
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-bold text-white">
                  {mission.title}
                </h3>

                <p className="mt-1 min-h-[32px] text-[11px] leading-5 text-[#85818e]">
                  {mission.description}
                </p>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-[#85818e]">
                      Progress
                    </span>

                    <span
                      className={
                        mission.completed
                          ? "text-[#60dba2]"
                          : "text-[#aaa7b3]"
                      }
                    >
                      {progress}/{mission.target_value}
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        mission.completed
                          ? "bg-[#60dba2]"
                          : "bg-[#ff4058]"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {mission.completed && (
                  <div className="mt-3 text-[9px] font-bold uppercase tracking-wider text-[#60dba2]">
                    Mission completed
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}