import base from "./playwright.config";
export default { ...base, expect: { timeout: 15_000 } };
