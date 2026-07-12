import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "../src/config";
import { createElevenLabsTts } from "../src/adapters/tts/elevenlabs";
import { knownFixtures, loadCachedBooking } from "../src/lib/fixtures";
import { voiceFixturesRoot } from "../src/lib/paths";
import { composeBrief, type BriefLang } from "../src/voice/brief";
import { PHRASE_CLIPS } from "../src/voice/phrases";

interface Target {
  file: string;
  text: string;
}

const LANGS: readonly BriefLang[] = ["en", "ms", "zh"];

function collectTargets(): Target[] {
  const targets: Target[] = [];
  const seen = new Set<string>();
  for (const fixture of knownFixtures()) {
    if (seen.has(fixture.slug)) continue;
    seen.add(fixture.slug);
    const booking = loadCachedBooking(fixture.slug);
    if (!booking) continue;
    for (const lang of LANGS) {
      targets.push({
        file: path.join("briefs", `${fixture.slug}.${lang}.mp3`),
        text: composeBrief(booking, lang),
      });
    }
  }
  for (const phrase of PHRASE_CLIPS) {
    targets.push({
      file: path.join("phrases", `${phrase.id}.mp3`),
      text: phrase.textLocal,
    });
  }
  return targets;
}

// One-off generator for the committed demo audio set. Run with --print to list
// each target file and its text for manual export from the ElevenLabs web UI
// when API credits are unavailable.
async function main(): Promise<void> {
  const targets = collectTargets();
  if (process.argv.includes("--print")) {
    for (const target of targets) {
      console.info(
        `${path.join(voiceFixturesRoot(), target.file)}\n  ${target.text}\n`,
      );
    }
    return;
  }
  const config = loadConfig();
  if (!config.ELEVENLABS_API_KEY) {
    throw new Error(
      "ELEVENLABS_API_KEY is required (or run with --print for manual export).",
    );
  }
  const tts = createElevenLabsTts(config.ELEVENLABS_API_KEY);
  for (const target of targets) {
    const outPath = path.join(voiceFixturesRoot(), target.file);
    if (process.argv.includes("--missing") && existsSync(outPath)) continue;
    const audio = await tts.synthesize({
      text: target.text,
      voiceId: config.ELEVENLABS_VOICE_ID,
      modelId: config.ELEVENLABS_TTS_MODEL,
    });
    mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileSync(outPath, audio);
    console.info(`wrote ${outPath} (${audio.length} bytes)`);
  }
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
