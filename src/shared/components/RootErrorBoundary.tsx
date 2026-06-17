import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort error boundary mounted above every window root in main.tsx.
 *
 * Without it, any uncaught throw during render unmounts the whole tree and leaves a
 * permanent blank white window (no Vite overlay in production) — and the in-app updater
 * never mounts, so the app can't even auto-fix itself. This converts that into a readable
 * recovery screen with a one-click "Reset & restart" that wipes the app's persisted state.
 *
 * It must keep working even when antd / i18n / the settings context are exactly what
 * crashed, so it depends only on React + inline styles + hardcoded bilingual (EN/RU) copy.
 */
class RootErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Surface to any attached console / DevTools for diagnosis.
    console.error("RootErrorBoundary caught:", error, info?.componentStack);
  }

  private handleRestart = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    // Blanket clear so recovery is exhaustive — every app key (incl. ad-hoc ones not in
    // STORAGE_KEYS) is wiped, and localStorage is per-origin so nothing else is affected.
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* storage unavailable — nothing we can do */
    }
    window.location.reload();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const details = `${error.message || String(error)}\n\n${error.stack || ""}`.trim();

    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.title}>Something went wrong · Что-то пошло не так</div>

          <p style={styles.text}>
            The app failed to start. Try restarting first; if it keeps happening, reset its
            saved data. Resetting clears your loot-filter settings and profiles — export a
            profile first if you can.
          </p>
          <p style={styles.textMuted}>
            Не удалось запустить приложение. Сначала попробуйте перезапустить; если не
            помогает — сбросьте сохранённые данные. Сброс очистит настройки фильтра и
            профили — если можете, сначала экспортируйте профиль.
          </p>

          <div style={styles.buttons}>
            <button style={styles.secondaryBtn} onClick={this.handleRestart} type="button">
              Restart · Перезапустить
            </button>
            <button style={styles.primaryBtn} onClick={this.handleReset} type="button">
              Reset &amp; restart · Сбросить и перезапустить
            </button>
          </div>

          <details style={styles.details}>
            <summary style={styles.summary}>Error details · Детали ошибки</summary>
            <pre style={styles.pre}>{details}</pre>
          </details>
        </div>
      </div>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#111827",
    color: "#e5e7eb",
    fontFamily:
      "'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif",
    overflow: "auto",
    zIndex: 2147483647,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: 12,
    padding: 24,
    boxSizing: "border-box",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fbbf24",
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: "0 0 8px",
  },
  textMuted: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#9ca3af",
    margin: "0 0 20px",
  },
  buttons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  secondaryBtn: {
    flex: 1,
    minWidth: 160,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #4b5563",
    background: "#374151",
    color: "#e5e7eb",
    fontSize: 14,
    cursor: "pointer",
  },
  primaryBtn: {
    flex: 1,
    minWidth: 160,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #f59e0b",
    background: "#f59e0b",
    color: "#111827",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  details: {
    marginTop: 18,
  },
  summary: {
    fontSize: 12,
    color: "#9ca3af",
    cursor: "pointer",
  },
  pre: {
    marginTop: 8,
    maxHeight: 180,
    overflow: "auto",
    background: "#0b1220",
    border: "1px solid #374151",
    borderRadius: 8,
    padding: 12,
    fontSize: 11,
    lineHeight: 1.4,
    color: "#cbd5e1",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};

export default RootErrorBoundary;
