export type Route = { index: string; label: string; href: string };

/** Single source for navigation order and numbering (§15). */
export const ROUTES: Route[] = [
  { index: "01", label: "Index", href: "/" },
  { index: "02", label: "Work", href: "/work" },
  { index: "03", label: "Lab", href: "/lab" },
  { index: "04", label: "Profile", href: "/profile" },
  { index: "05", label: "Contact", href: "/contact" },
];
