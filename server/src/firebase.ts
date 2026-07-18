import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { createConfiguredApp } from "./bootstrap";

setGlobalOptions({
  region: "asia-southeast1",
  memory: "2GiB",
  timeoutSeconds: 540,
  maxInstances: 3,
});

const { app } = createConfiguredApp();

export const api = onRequest(
  {
    cors: false,
    invoker: "public",
  },
  app,
);
