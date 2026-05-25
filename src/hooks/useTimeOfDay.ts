import { useEffect, useState } from "react";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "lateNight";

/**
 * Returns a coarse time-of-day bucket based on the user's local hour. The
 * "lateNight" range (00:00 – 04:00) unlocks a subtle footer message.
 */
export function useTimeOfDay(): TimeOfDay {
  const [tod, setTod] = useState<TimeOfDay>(() => bucketFor(new Date()));

  useEffect(() => {
    // Re-check every 5 minutes — enough to flip from "night" to "lateNight"
    // without burning a wakelock.
    const id = window.setInterval(() => setTod(bucketFor(new Date())), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return tod;
}

function bucketFor(d: Date): TimeOfDay {
  const h = d.getHours();
  if (h >= 0 && h < 4) return "lateNight";
  if (h >= 4 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}
