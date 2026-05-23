import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../lib/api.js";

/** @typedef {"connecting" | "connected" | "reconnecting" | "disconnected"} WsStatus */

/**
 * @param {string} [apiBaseUrl]
 * @returns {string}
 */
export function getHousingScoresWsUrl(apiBaseUrl = API_BASE_URL) {
  const base = apiBaseUrl?.replace(/\/$/, "") ?? "";
  if (base) {
    return `${base.replace(/^http/i, "ws")}/ws/housing-scores`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/housing-scores`;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 15000;

/**
 * @returns {{
 *   housing: Array<{ id: string; slug: string; name: string; point: number }>;
 *   clientCount: number;
 *   status: WsStatus;
 * }}
 */
export function useHousingScoresWs() {
  const [housing, setHousing] = useState([]);
  const [clientCount, setClientCount] = useState(0);
  /** @type {[WsStatus, import('react').Dispatch<import('react').SetStateAction<WsStatus>>]} */
  const [status, setStatus] = useState("connecting");
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let intentionalClose = false;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current != null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (!mountedRef.current || intentionalClose) return;
      setStatus("reconnecting");
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    }

    function connect() {
      clearReconnectTimer();
      if (!mountedRef.current) return;

      const wsUrl = getHousingScoresWsUrl();
      setStatus((prev) => (prev === "connected" ? "reconnecting" : "connecting"));

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        backoffRef.current = INITIAL_BACKOFF_MS;
        setStatus("connected");
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const payload = JSON.parse(String(event.data));
          if (payload?.type === "scores" && Array.isArray(payload.housing)) {
            setHousing(payload.housing);
            setClientCount(Number(payload.clientCount) || 0);
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsRef.current = null;
        if (intentionalClose) {
          setStatus("disconnected");
          return;
        }
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      intentionalClose = true;
      clearReconnectTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return { housing, clientCount, status };
}
