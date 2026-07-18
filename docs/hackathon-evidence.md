# Databricks Evidence

Databricks is not used in the current Jalan2 implementation and should not be tagged for this submission. The repository does not contain a Databricks App, workspace, notebook, SDK, pipeline, Delta Lake integration, MLflow integration, Model Serving endpoint, Vector Search index, Mosaic AI feature or Unity Catalog governance configuration. Jalan2 currently uses an Expo client, a Node.js and Express server, local JSON and in-memory storage, and adapter-based external AI and travel services.

Code evidence:

- No Databricks package, import, environment variable or integration is present in the repository.
- The current application stack and provider list are documented in [`README.md`](../README.md).
- Server dependencies are declared in [`server/package.json`](../server/package.json).
- Client dependencies are declared in [`app/package.json`](../app/package.json).

# ElevenLabs Evidence

Jalan2 integrates ElevenLabs as its multilingual voice layer. The current application configuration uses ElevenLabs for live text-to-speech, while speech transcription currently uses OpenAI. An optional ElevenLabs Scribe speech-to-text adapter is also implemented and can be enabled through configuration.

Features used:

- **Multilingual text-to-speech:** Jalan2 calls the ElevenLabs text-to-speech API using `eleven_multilingual_v2` and configurable stock voice IDs.
- **Optional Scribe speech-to-text:** The implemented Scribe adapter can transcribe audio extracted from TikTok and Xiaohongshu posts. Returned text and word timings are validated before being used by the travel-planning pipeline.
- **Spoken safety briefs:** Travellers can play trip-safety summaries in English, Bahasa Melayu and Mandarin.
- **Say My Order:** Travellers can hear local ordering phrases for dishes identified from a photographed menu, helping them communicate with hawkers and local MSME operators.
- **Voice caching and fallback:** Generated MP3 files are cached using a content hash. Prepared fixture audio provides a reliable fallback when live synthesis is unavailable.
- **Synthetic-media disclosure:** Voice API responses are marked with `synthetic: true`, and the safety-brief interface displays an **AI voice** label.
- **Stock voices only:** Jalan2 does not capture, clone or impersonate a traveller's or operator's voice.
- **User-controlled playback:** Voice is played only after the traveller taps the relevant audio control.

Code evidence:

- ElevenLabs text-to-speech adapter: [`server/src/adapters/tts/elevenlabs.ts`](../server/src/adapters/tts/elevenlabs.ts)
- ElevenLabs Scribe speech-to-text adapter: [`server/src/adapters/stt/elevenlabs.ts`](../server/src/adapters/stt/elevenlabs.ts)
- Speech-to-text provider selection: [`server/src/adapters/stt/index.ts`](../server/src/adapters/stt/index.ts)
- Text-to-speech provider selection: [`server/src/adapters/tts/index.ts`](../server/src/adapters/tts/index.ts)
- Cantonese provider routing: [`server/src/adapters/tts/languageRouter.ts`](../server/src/adapters/tts/languageRouter.ts)
- ElevenLabs model and voice configuration: [`server/src/config.ts`](../server/src/config.ts)
- Environment configuration template: [`server/.env.example`](../server/.env.example)
- Voice synthesis, fixture fallback and caching service: [`server/src/services/voice.ts`](../server/src/services/voice.ts)
- Hashed MP3 cache implementation: [`server/src/lib/voiceCache.ts`](../server/src/lib/voiceCache.ts)
- Safety-brief and audio-serving routes: [`server/src/routes/voice.ts`](../server/src/routes/voice.ts)
- Menu ordering-audio route: [`server/src/routes/menu.ts`](../server/src/routes/menu.ts)
- Deterministic multilingual order phrases: [`server/src/voice/menuOrder.ts`](../server/src/voice/menuOrder.ts)
- Deterministic multilingual safety briefs: [`server/src/voice/brief.ts`](../server/src/voice/brief.ts)
- Synthetic voice API contracts: [`shared/src/api.ts`](../shared/src/api.ts)
- Safety-brief AI voice disclosure and playback: [`app/src/components/VoiceButton.tsx`](../app/src/components/VoiceButton.tsx)
- Menu ordering voice interface: [`app/src/components/MenuOrderSpeaker.tsx`](../app/src/components/MenuOrderSpeaker.tsx)
- ElevenLabs Scribe validation tests: [`server/test/scribeParse.test.ts`](../server/test/scribeParse.test.ts)
- Voice-language routing tests: [`server/test/ttsLanguageRouter.test.ts`](../server/test/ttsLanguageRouter.test.ts)
- Safety-brief tests: [`server/test/voiceBrief.test.ts`](../server/test/voiceBrief.test.ts)

Consent and safety notes:

- Jalan2 currently uses stock synthetic voices and does not process biometric voice samples for cloning.
- Speech-to-text, when enabled, processes audio extracted from a social post shared by the traveller; it does not continuously record the device microphone.
- Cantonese ordering audio currently routes to Google Cloud TTS using `yue-HK`, rather than ElevenLabs. ElevenLabs is used for the other configured text-to-speech requests.
- Before production deployment, Jalan2 should add an explicit privacy notice explaining when source audio or generated text is processed by an external voice provider, how long generated audio is retained, and how users can request deletion.
- The menu-order player should display the same visible **AI voice** label already used by the safety-brief player.

# Responsible AI Notes

## Privacy

- Provider credentials, operator messaging destinations and private configuration remain on the server and are not returned to the client.
- The booking flow never automatically messages phone numbers extracted from TikTok, Xiaohongshu, Google Places or public web results. Outbound requests use only an approved server-side contact destination.
- Uploaded menu images are served with private, no-store cache headers.
- Basic travel preferences are stored locally on the traveller's device rather than in an online user profile.
- Reservation responses omit operator phone numbers, WhatsApp addresses and private provider identifiers.
- Jalan2 currently has no production authentication or multi-user access-control layer, formal retention policy or automatic deletion process for downloaded media, persisted trips and generated voice files.
- Uploaded images may be processed by OpenAI, while audio and generated text may be processed by configured voice providers. A production release requires a clear privacy notice, explicit provider disclosure, defined retention periods and user-accessible deletion controls.

Privacy code evidence:

- Menu upload validation, scoped upload limit and private source-image response: [`server/src/routes/menu.ts`](../server/src/routes/menu.ts)
- In-memory menu and source-image storage: [`server/src/store/menus.ts`](../server/src/store/menus.ts)
- Local device preference storage: [`app/src/lib/userPreferences.ts`](../app/src/lib/userPreferences.ts)
- Server-side trip persistence: [`server/src/store/trips.ts`](../server/src/store/trips.ts)
- Server-side provider and messaging configuration: [`server/src/config.ts`](../server/src/config.ts)
- Approved operator destination and no-cold-contact rule: [`server/src/services/booking.ts`](../server/src/services/booking.ts)
- Reservation preview and approved-address enforcement: [`server/src/services/tripReservations.ts`](../server/src/services/tripReservations.ts)
- Public reservation contracts that omit messaging destinations: [`shared/src/reservation.ts`](../shared/src/reservation.ts)

## Safety

- AI prompts require the system to use only supplied captions, transcripts, video frames and provider evidence. The system is instructed to prefer an unknown or null value instead of inventing a price, operator, contact, location or availability claim.
- Model outputs are validated against Zod schemas. Invalid structured results are rejected or retried, while unsupported prices and phone numbers are removed programmatically.
- The final plan critic checks transport continuity, daily workload, unsupported claims and provider-confirmation gaps before a guide is presented.
- Travellers review dates, guest counts, selected stops and requested times before any reservation message is sent.
- A venue is never shown as confirmed until a matching operator reply is received. Easybook, KTMB and accommodation links are presented as external searches or hand-offs, not purchased tickets or confirmed inventory.
- Safety briefs are deterministic templates based on evidenced trip information. They state that they are general guidance and not professional safety instructions.
- Menu taste and allergen information is labelled as typical-recipe guidance. Travellers are told to confirm ingredients directly with the stall.
- Public web mentions and operator trust signals are presented as due-diligence aids, not licences, accreditation or safety certification.

Safety code evidence:

- Evidence-only frame-reading prompt: [`server/src/pipeline/vision.ts`](../server/src/pipeline/vision.ts)
- Evidence fusion, schema validation and unsupported-field removal: [`server/src/pipeline/fusion.ts`](../server/src/pipeline/fusion.ts)
- Menu-reading uncertainty and advisory constraints: [`server/src/pipeline/menuVision.ts`](../server/src/pipeline/menuVision.ts)
- Conservative dish-photo verification: [`server/src/pipeline/dishPhotoVerifier.ts`](../server/src/pipeline/dishPhotoVerifier.ts)
- End-to-end AI and deterministic plan critic: [`server/src/planner/planCritic.ts`](../server/src/planner/planCritic.ts)
- Planning evidence levels, warnings and hand-off contracts: [`shared/src/planner.ts`](../shared/src/planner.ts)
- Human-reviewed reservation interface: [`app/src/components/ReservationReviewCard.tsx`](../app/src/components/ReservationReviewCard.tsx)
- Booking state validation and operator-reply correlation: [`server/src/services/tripReservations.ts`](../server/src/services/tripReservations.ts)
- Safety-brief disclaimer and deterministic templates: [`server/src/voice/brief.ts`](../server/src/voice/brief.ts)
- Menu confidence, allergen and representative-photo disclaimers: [`app/src/components/DishCard.tsx`](../app/src/components/DishCard.tsx)
- Public-evidence certification disclaimer: [`app/src/app/(tabs)/experience/[id].tsx`](<../app/src/app/(tabs)/experience/[id].tsx>)

## Bias

- Jalan2 supports English, Bahasa Melayu, Simplified Chinese and Traditional Chinese, and includes Malaysian regional food distinctions to reduce mistranslation and incorrect dish matching.
- Uncertain menu readings are visibly labelled, and the original menu row remains available for comparison.
- Dish photographs are accepted only when a conservative verifier finds a sufficiently strong regional match. A missing photograph is preferred to a misleading one.
- The operator trust signal returns no score when supporting evidence is absent instead of automatically treating a low-digital-presence MSME as untrustworthy.
- Social-media popularity, Google Places coverage and public web visibility can still favour urban, established or digitally active operators. Rural, offline and newly established MSMEs may be underrepresented.
- No formal fairness or demographic performance evaluation is currently implemented. This should be added using multilingual and geographically diverse Malaysian evaluation sets.

Bias code evidence:

- Multilingual social-frame reading and strict visible-evidence rules: [`server/src/pipeline/vision.ts`](../server/src/pipeline/vision.ts)
- Malaysian multilingual menu interpretation and regional food distinctions: [`server/src/pipeline/menuVision.ts`](../server/src/pipeline/menuVision.ts)
- Web-presence-only trust heuristic and null result for absent evidence: [`server/src/pipeline/trust.ts`](../server/src/pipeline/trust.ts)
- Visible confidence labels for uncertain menu readings: [`app/src/components/DishCard.tsx`](../app/src/components/DishCard.tsx)
- Licensed image attribution component: [`app/src/components/ImageAttribution.tsx`](../app/src/components/ImageAttribution.tsx)

## Data and Model Limitations

- Speech transcription, visual reading, OCR, translation, place matching and itinerary generation can be incorrect even after validation.
- Social posts may be outdated, incomplete, sponsored or missing important operational details. Expired and private posts remain unsupported rather than being converted into invented itineraries.
- Prices, opening hours, transport schedules, weather conditions, operator credentials, allergens and availability must be verified with the relevant provider or operator.
- Google route results show geographic connectivity but do not prove that ride-hailing, public transport, an operator pickup or a specific departure is available.
- Easybook and KTMB integrations provide ticket-search hand-offs rather than live ticket inventory or completed purchases. Accommodation links are also external searches.
- Some stage flows use validated cached fixtures when live services fail. The interface identifies cached or demo results where relevant.
- Reservation and itinerary state is partly stored in memory. A server restart can expire a demo reservation session, and the current prototype does not provide durable exactly-once messaging.
- Jalan2 does not process payments or make binding purchases. Travellers retain control and must approve outreach and complete any external transaction themselves.

Limitations code evidence:

- Cached and live pipeline fallback behavior: [`server/src/pipeline/run.ts`](../server/src/pipeline/run.ts)
- Deterministic fallback when the AI plan critic fails: [`server/src/planner/planCritic.ts`](../server/src/planner/planCritic.ts)
- External booking hand-offs and provider disclaimers: [`server/src/planner/smartPlanner.ts`](../server/src/planner/smartPlanner.ts)
- In-memory itinerary state: [`server/src/store/itineraries.ts`](../server/src/store/itineraries.ts)
- In-memory reservation state: [`server/src/store/tripReservations.ts`](../server/src/store/tripReservations.ts)
- Runtime downloads, trip files and voice-cache paths: [`server/src/lib/paths.ts`](../server/src/lib/paths.ts)
- Reservation architecture, privacy constraints and prototype limitations: [`docs/specs/2026-07-15-trip-reservation-batch-design.md`](specs/2026-07-15-trip-reservation-batch-design.md)
