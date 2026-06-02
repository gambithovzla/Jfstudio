"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FolderDown, FolderSync, Loader2, Unlink } from "lucide-react";

import { markBackupDoneToday } from "./backup-reminder";

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  }
}

/**
 * Guardado automático del respaldo en una carpeta de la PC, usando la File System Access API.
 * Solo Chrome/Edge de escritorio. La dueña autoriza una carpeta una vez (el "handle" queda en
 * IndexedDB); mientras el permiso siga concedido, al abrir el panel el respaldo del día se
 * guarda solo. Si el navegador pide reconfirmar el permiso, basta con "Guardar ahora".
 */

const DB_NAME = "jf-backup";
const STORE = "handles";
const HANDLE_KEY = "dir";
const LAST_KEY = "jf-last-backup";

type PermissionState = "granted" | "denied" | "prompt";

/** El handle real trae query/requestPermission, que aún no están en los tipos estándar. */
type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function backupFilename(ext: string): string {
  return `respaldo-jfstudio-${todayStr()}.${ext}`;
}

// ── IndexedDB mínimo (los handles no se pueden guardar en localStorage) ──────
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<DirHandle | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as DirHandle | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: DirHandle): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Descarga + escritura ────────────────────────────────────────────────────
async function fetchBackupBlob(format: "json" | "xlsx"): Promise<Blob> {
  const res = await fetch(`/api/admin/backup?format=${format}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`No se pudo generar el respaldo (HTTP ${res.status}).`);
  return res.blob();
}

async function writeToDir(dir: DirHandle, name: string, blob: Blob): Promise<void> {
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function saveBackupToDir(dir: DirHandle): Promise<void> {
  const [json, xlsx] = await Promise.all([fetchBackupBlob("json"), fetchBackupBlob("xlsx")]);
  await writeToDir(dir, backupFilename("json.gz"), json);
  await writeToDir(dir, backupFilename("xlsx"), xlsx);
  markBackupDoneToday();
}

export function BackupAutoFolder() {
  const [supported, setSupported] = useState(true);
  const [dirName, setDirName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "info" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.showDirectoryPicker !== "function") {
      setSupported(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const handle = await idbGet(HANDLE_KEY).catch(() => undefined);
      if (cancelled || !handle) return;
      setDirName(handle.name);
      // Auto-guardado silencioso: solo si el permiso sigue concedido y aún no se guardó hoy.
      const perm = (await handle.queryPermission?.({ mode: "readwrite" })) ?? "prompt";
      let lastDone: string | null = null;
      try {
        lastDone = localStorage.getItem(LAST_KEY);
      } catch {
        lastDone = null;
      }
      if (perm === "granted" && lastDone !== todayStr()) {
        try {
          await saveBackupToDir(handle);
          if (!cancelled) setMsg({ kind: "ok", text: `Respaldo de hoy guardado en "${handle.name}".` });
        } catch (err) {
          if (!cancelled) setMsg({ kind: "error", text: (err as Error).message });
        }
      } else if (perm !== "granted") {
        setMsg({ kind: "info", text: "Reabre el permiso con “Guardar ahora” para reanudar el guardado automático." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    if (typeof window.showDirectoryPicker !== "function") return;
    setBusy(true);
    setMsg(null);
    try {
      const handle = (await window.showDirectoryPicker({ mode: "readwrite" })) as DirHandle;
      await idbSet(HANDLE_KEY, handle);
      setDirName(handle.name);
      await saveBackupToDir(handle);
      setMsg({ kind: "ok", text: `Carpeta conectada. Respaldo de hoy guardado en "${handle.name}".` });
    } catch (err) {
      const e = err as Error;
      // El usuario canceló el selector: no es un error real.
      if (e?.name !== "AbortError") setMsg({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }, []);

  const saveNow = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      const handle = await idbGet(HANDLE_KEY);
      if (!handle) {
        setMsg({ kind: "error", text: "No hay carpeta conectada." });
        return;
      }
      const current = (await handle.queryPermission?.({ mode: "readwrite" })) ?? "prompt";
      const perm = current === "granted" ? current : (await handle.requestPermission?.({ mode: "readwrite" })) ?? "denied";
      if (perm !== "granted") {
        setMsg({ kind: "error", text: "Permiso denegado para escribir en la carpeta." });
        return;
      }
      await saveBackupToDir(handle);
      setMsg({ kind: "ok", text: `Respaldo de hoy guardado en "${handle.name}".` });
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await idbDel(HANDLE_KEY).catch(() => undefined);
    setDirName(null);
    setMsg({ kind: "info", text: "Carpeta desconectada." });
  }, []);

  if (!supported) {
    return (
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Carpeta automática</h2>
          <FolderSync size={20} aria-hidden />
        </div>
        <p className="small muted">
          Esta función (guardar el respaldo solo en una carpeta de tu PC) requiere <strong>Chrome o Edge en
          computadora</strong>. En este dispositivo o navegador no está disponible; usa los botones de descarga de arriba.
        </p>
      </section>
    );
  }

  const msgColor = msg?.kind === "error" ? "#b91c1c" : msg?.kind === "ok" ? "#155e54" : "#6b7280";

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Carpeta automática (PC)</h2>
        <FolderSync size={20} aria-hidden />
      </div>
      <p className="small muted" style={{ marginBottom: 14 }}>
        Elige una carpeta de tu computadora una sola vez. Mientras abras el panel en este navegador, el respaldo del
        día se guardará ahí automáticamente. (Solo Chrome/Edge de escritorio.)
      </p>

      {dirName ? (
        <>
          <p className="small" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={16} aria-hidden style={{ color: "#155e54" }} />
            Carpeta conectada: <strong>{dirName}</strong>
          </p>
          <div className="button-row">
            <button className="btn" type="button" onClick={saveNow} disabled={busy}>
              {busy ? <Loader2 size={16} aria-hidden className="spin" /> : <FolderDown size={16} aria-hidden />}
              Guardar ahora
            </button>
            <button className="btn secondary" type="button" onClick={disconnect} disabled={busy}>
              <Unlink size={16} aria-hidden />
              Desconectar
            </button>
          </div>
        </>
      ) : (
        <button className="btn" type="button" onClick={connect} disabled={busy}>
          {busy ? <Loader2 size={16} aria-hidden className="spin" /> : <FolderDown size={16} aria-hidden />}
          Conectar carpeta de respaldos
        </button>
      )}

      {msg ? (
        <p className="small" style={{ marginTop: 12, marginBottom: 0, color: msgColor }}>
          {msg.text}
        </p>
      ) : null}
    </section>
  );
}
