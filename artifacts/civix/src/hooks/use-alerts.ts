import { useEffect, useState, useCallback } from "react";

export interface AlertsData {
  escalatedThisWeek: number;
  urgentOpen: number;
  totalOpen: number;
  threshold: number;
}

const POLL_INTERVAL = 60_000;

export function useAlerts() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [prevEscalated, setPrevEscalated] = useState<number | null>(null);
  const [hasNew, setHasNew] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/issues/alerts", { credentials: "include" });
      if (!res.ok) return;
      const json: AlertsData = await res.json();
      setData(json);
      if (prevEscalated !== null && json.escalatedThisWeek > prevEscalated) {
        setHasNew(true);
      }
      setPrevEscalated(json.escalatedThisWeek);
    } catch {}
  }, [prevEscalated]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetch_]);

  const dismiss = useCallback(() => setHasNew(false), []);

  return { data, hasNew, dismiss };
}
