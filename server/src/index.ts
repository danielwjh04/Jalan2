import { createConfiguredApp } from "./bootstrap";

const { app, config, openai } = createConfiguredApp();

app.listen(config.PORT, () => {
  console.info(
    `jalan2 server on :${config.PORT} ` +
      `(pipeline=${config.PIPELINE_MODE}, extractor=${config.EXTRACTOR}, ` +
      `messaging=${config.MESSAGING_PROVIDER}, openai=${openai ? "configured" : "absent"})`,
  );
});
