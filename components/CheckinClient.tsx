"use client";

import { useEffect, useRef, useState } from "react";

type ScanResult = "valido" | "usado" | "invalido" | null;

type TicketInfo = {
  ticket_code: string;
  buyer_name: string;
  lot_name: string;
  checkin_status: string;
  checkin_at: string | null;
};

export default function CheckinClient() {
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;
        const instance = new Html5Qrcode("qr-reader");
        scannerRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            handleScan(decodedText);
          },
          () => {
            // erro de leitura de frame individual — ignorar, é esperado
          }
        );
        setScanning(true);
      } catch (err: any) {
        setCameraError(
          "Não foi possível acessar a câmera. Confirme a permissão do navegador ou use o código manual abaixo."
        );
      }
    }

    start();

    return () => {
      isMounted = false;
      const instance = scannerRef.current;
      if (instance) {
        instance.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(code: string) {
    if (busy) return;
    setBusy(true);
    // pausa a câmera enquanto mostra o resultado, pra não escanear em loop
    try {
      await scannerRef.current?.pause(true);
    } catch {}

    try {
      const res = await fetch("/api/checkin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResult(data.result);
      setTicket(data.ticket ?? null);
    } catch {
      setResult("invalido");
      setTicket(null);
    }
    setBusy(false);
  }

  async function confirmEntry() {
    if (!ticket) return;
    setBusy(true);
    const res = await fetch("/api/checkin/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ticket.ticket_code }),
    });
    const data = await res.json();
    if (res.ok) {
      setTicket(data.ticket);
      setResult("valido");
    }
    setBusy(false);
  }

  function resumeScanning() {
    setResult(null);
    setTicket(null);
    try {
      scannerRef.current?.resume();
    } catch {}
  }

  async function submitManual() {
    if (!manualCode.trim()) return;
    await handleScan(manualCode.trim().toUpperCase());
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="admin-title">Check-in</div>
      </div>

      <div className="scan-stage">
        <div id="qr-reader" style={{ display: result ? "none" : "block" }} />

        {cameraError && !result && (
          <div className="panel" style={{ fontSize: 13, color: "var(--gray)" }}>
            {cameraError}
          </div>
        )}

        {!result && scanning && (
          <p style={{ textAlign: "center", color: "var(--gray)", fontSize: 13 }}>
            Aponte a câmera para o QR Code do ingresso.
          </p>
        )}

        {result === "valido" && ticket && (
          <div className="scan-result ok">
            <div className="scan-icon">
              {ticket.checkin_status === "realizado" ? "✓" : "🎟"}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase" }}>
              {ticket.checkin_status === "realizado" ? "Entrada confirmada" : "Ingresso válido"}
            </div>
            <div className="scan-detail">
              <div>
                <span>Nome</span>
                <b>{ticket.buyer_name}</b>
              </div>
              <div>
                <span>Lote</span>
                <b>{ticket.lot_name}</b>
              </div>
              <div>
                <span>Código</span>
                <b>{ticket.ticket_code}</b>
              </div>
            </div>
            {ticket.checkin_status !== "realizado" && (
              <button className="btn btn-primary btn-block" onClick={confirmEntry} disabled={busy}>
                {busy ? "Confirmando..." : "Confirmar entrada"}
              </button>
            )}
            <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={resumeScanning}>
              Escanear próximo
            </button>
          </div>
        )}

        {result === "usado" && ticket && (
          <div className="scan-result used">
            <div className="scan-icon">⚠</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase" }}>
              Ingresso já utilizado
            </div>
            <div className="scan-detail">
              <div>
                <span>Nome</span>
                <b>{ticket.buyer_name}</b>
              </div>
              <div>
                <span>Check-in em</span>
                <b>
                  {ticket.checkin_at
                    ? new Date(ticket.checkin_at).toLocaleString("pt-BR")
                    : "—"}
                </b>
              </div>
            </div>
            <button className="btn btn-outline btn-block" onClick={resumeScanning}>
              Escanear próximo
            </button>
          </div>
        )}

        {result === "invalido" && (
          <div className="scan-result no">
            <div className="scan-icon">✕</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase" }}>
              Ingresso não encontrado
            </div>
            <button className="btn btn-outline btn-block" onClick={resumeScanning}>
              Tentar de novo
            </button>
          </div>
        )}

        {!result && (
          <div className="manual-code">
            <input
              placeholder="Ou digite o código manualmente (BDC-XXXXXXXX)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
            />
            <button className="btn btn-outline" onClick={submitManual} disabled={busy}>
              Validar
            </button>
          </div>
        )}
      </div>
    </>
  );
}
