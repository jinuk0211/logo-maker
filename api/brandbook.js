import { generateBrandbook } from "../server/brandbookHandler.js";
import { endpoint } from "./_shared.js";

export const config = { maxDuration: 60 };

export default endpoint(
  () => "brandbook",
  (body) => generateBrandbook(body.brief || {}, body.logo || {}, process.env.ANTHROPIC_API_KEY, body.extra || {})
);
