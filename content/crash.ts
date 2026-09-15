/** [REBUILD] — the fake crash. Times in ms from the press. */
export const CRASH = {
  panic: 350,
  black: 1350,
  total: 2150,
  title: "!! System Fault",
  reboot: "Rebooting",
} as const;

export const CRASH_LINES = [
  "PROCESS    PORTFOLIO.CORE          PID 4182",
  "FAULT      0xJVR1955  SCULPTURE_STACK_OVERFLOW",
  "ADDRESS    0x7FFE:00C4:A2B1",
  "STATE      HOME -> UNDEFINED",
  "DUMPING CORE .................... OK",
  "RESTART    FORCED BY USER [REBUILD]",
];
