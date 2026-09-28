/**
 * BOOT SEQUENCE CONTENT
 *
 * Transcribed from loadinganimation.mp4 phase 1 (0–2.4s), where three
 * telemetry panels stream in. Kept as data so the sequence is a content
 * change, not a code change — and so the panels can be typed out line by line.
 */

export const TRACE_A = {
  title: "Trace·A",
  lines: [
    "ORIGIN: UNRESOLVED CLUSTER · BEARING 127.4° · ALT — · RANGE EST 4.2E6 KM",
    "SNR: 18.2 DB · JITTER 1.6MS · PHASE NOISE -94 DBC/HZ · DRIFT WITHIN TOL",
    "PACKET:// SYNC WORD 0XA91F · FRAME 18492 · SEQ ADMIT 0X00FA · CRC PASS",
    "CHRONO_DAEMON: LISTENING · PORT 0X4C1A · SOCKET RAW · RCVBUF 64K · QDEPTH 0",
    "LOCK: PENDING · CH-03 OPEN · WINDOW 4096 · ACK WAIT 12MS · RETRY 0 · LOSS 0%",
    "RX:// LANE-0 ACTIVE · LANE-1 STANDBY · INTERLEAVE 4 · SYMBOL RATE 2.4MSPS",
    "DSP:// FILTER BANK OK · FFT 1024 · BIN 418 · PEAK -12.4DBFS · AGC HOLD",
    "TIME:// UTC+00 SYNC · STRATUM 2 · OFFSET +0.8MS · LEAP 0 · DRIFT COMP ON",
    "BUF:// RING-02 78% · RING-03 12% · DROP 0 · LAT P50 0.3MS P99 1.1MS",
    "AUTH:// TOKEN NONE · SESSION — · HANDSHAKE DEFERRED · KEX SLOT RESERVED",
    "MAP:// SECTOR INBOUND-A READ · MIRROR 0X00 · FLAGS RX|RAW · CACHE COLD",
    "LOG:// TRACE VERBOSE · ROLL 64K · FLUSH 30S · COMPRESS OFF · REDACT OFF",
    "FRAME DUMP // SEQ 18492",
    "   HDR  A9 1F 00 FA  4C 1A 10 00",
    "   PAY  FF 13 22 00  98 C3 00 18",
    "   CRC  PASS · LEN 512 · PAD 0",
    "STAT:// RX BYTES 1849201 · FRAMES 4182 · ERR 0 · OVERRUN 0 · UPTIME 00:02:14",
  ],
} as const;

export const TRACE_B = {
  title: "Trace·B",
  lines: [
    "DRV:// VIEWPORT MAP ACTIVE · DPR 2.0 · LAYER ZL10050J · BLIT QUEUE 0 · VSYNC",
    "AUTH:// HANDSHAKE STANDBY · NONCE 0X8C41A92 · TTL 300S · CERT PENDING · KEX",
    "SYS:// HEAP 72% · THREADS 08 · FD 24 · WATCHDOG ARMED · UPTIME 00:14:22 · OK",
    "NET:// PING 14MS · ROUTE STABLE · GW 10.0.0.1 · MTU 1500 · LOSS 0.0% · QOS",
    "GPU:// CONTEXT OK · DRAW CALLS 418 · TRI 12K · SHADER HOT 3 · VRAM 18%",
    "IO:// READ 2.1MB/S · WRITE 0.4MB/S · IOPS 418 · QUEUE 2 · LAT 0.8MS",
    "PROC:// MAIN 12% · RENDER 8% · AUDIO 0% · IDLE 80% · THROTTLE OFF",
    "SEC:// SANDBOX ON · CSP STRICT · ORIGIN OK · CORS DENY · COOKIE NONE",
    "EVT:// QUEUE 0 · DISPATCH 4182 · LISTENER 24 · BUBBLE 0 · CAPTURE 0",
    "CACHE:// L1 HIT 94% · L2 HIT 88% · EVICT 12 · STALE 0 · WARM 3",
    "SCHED:// TICK 16.6MS · FRAME BUDGET OK · JANK 0 · LONG TASK 0 · RAF SYNC",
    "HAL:// DISPLAY OK · INPUT POLL 1000HZ · POINTER 1 · KEYMAP US · LOCALE AUTO",
    "DIAG:// SELFTEST PASS · CHECKSUM 0X91FA · LAST FAIL — · NEXT IN 3600S",
  ],
} as const;

export const TRACE_C = {
  title: "Trace·C",
  lines: [
    "BUF:// RING-07 FLUSH COMPLETE · HEAD 0X2F4 · TAIL 0X2F4 · OFLOW 0 · LAT 0.4MS",
    "HEX DUMP // OFFSET 0X4000",
    "0X4000   FF 13 00 A1  98 C3 22 00",
    "0X4010   00 18 4A 91  FA 00 00 00",
    "0X4020   41 43 43 45  53 53 5F 47",
    "0X4030   41 54 45 00  00 00 00 00",
    "ASM:// OP 4182 · REG AX 0X00FA · BX 0X4C1A · CX 0X1000 · FLAGS ZF|CF",
    "LINK:// PEER — · MAC — · VLAN 0 · MTU 1500 · ARP PENDING · DHCP ACK",
    "FLOW:// WINDOW 4096 · CWND 2048 · RTT 14MS · RTO 120MS · SACK ON",
    "META:// BUILD 2026.04.18 · REV 4182 · BRANCH MAIN · DIRTY 0 · SIG OK",
    "AUDIT:// LAST LOGIN — · FAIL 0 · ROTATE 30D · VAULT SEALED · KEY SLOT 3",
    "TAIL:// LOG CONTINUOUS · ROTATE AT 64K · COMPRESS ZSTD · ARCHIVE LOCAL",
    "END TRACE-C // REPORT CLOSED · STREAM IDLE · AWAITING NEXT INBOUND CYCLE",
    "REPORT:// INBOUND TRACE LOG · SECTOR 04 · SESSION 7FA2 · STREAM CONT",
    "I/O:// 0XFF13 0X00A1 0X98C3 0X2200 0X0018 · BUS WIDTH 32 · WAIT STATES 1",
  ],
} as const;

/**
 * Phase 2 — the authentication block, left of the hexagon at (393, 315).
 * It ACCRUES: the rows are there from the start, then three further stages
 * append as the phase runs, which is what the source does.
 */
export const AUTH_BLOCK = {
  title: "User Authentication",
  rows: [
    ["Locale", "nl, en-US, en"],
    ["Viewport", null], // filled at runtime with the real viewport
    ["Online", "yes · touch 0"],
  ] as const,
  /** [delay ms from phase start, line] */
  stages: [
    [900, "// SUBSYS_ACCESS_GATE · · · · · · · · · · · · LOG"],
    [2100, "[EXEC] HANDSHAKE · VERIFYING_"],
    [3400, "[00] PERMIT"],
    [3700, "CLASS:OBSERVER · MODE:READ-ONLY · PLJ:"],
  ] as const,
};

/** Phase 2 — the loading module, right of the hexagon. */
export const LOADING_MODULE = {
  title: "Loading",
  lines: ["WebGL · 3D Scene", "Canvas Ready"],
  sectors: ["Sec-04", "Sec-0A", "Sec-03"],
} as const;

/**
 * Phase timing, measured from the ink-activity profile of the source:
 *   0.00 – 2.40  TRACE      three telemetry panels stream in
 *   2.50 – 7.70  AUTH       panels clear, hexagon + loading module
 *   7.80 – 10.40 COMPLETE   everything retracts, COMPLETE at centre
 *  10.40 – 11.00 SETTLE     resolves into the resting composition
 */
export const PHASES = {
  trace: { start: 0, end: 2400 },
  auth: { start: 2500, end: 7700 },
  complete: { start: 7800, end: 10400 },
  settle: { start: 10400, end: 11000 },
} as const;

export const BOOT_TOTAL = 11000;
