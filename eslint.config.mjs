import next from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", "out/**", "_fonts-source/**"] },
  ...next,
  {
    // Media layers render pre-sized reference stills and video poster frames
    // at their exact display size. next/image would re-encode assets that are
    // already optimised, and cannot be used for a <video poster> at all.
    files: ["components/experience/**", "components/environment/**"],
    rules: { "@next/next/no-img-element": "off" },
  },
];

export default config;
