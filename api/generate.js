import { endpoint, imageRunner } from "./_shared.js";

export const config = { maxDuration: 60 };

export default endpoint(
  (body) => (body.instruction ? "edit" : "generate"),
  (body) => imageRunner.run(body)
);
