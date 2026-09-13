import next from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", "out/**", "_fonts-source/**"] },
  ...next,
];

export default config;
