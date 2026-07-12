import { Router } from "express";
import type { PhraseClipResponse, VoiceBriefResponse } from "@shared/api";
import type { Config } from "../config";
import type { TextToSpeech } from "../adapters/tts/types";
import { briefClip, findVoiceAudioFile, phraseClip } from "../services/voice";
import { getItinerary } from "../store/itineraries";
import { composeBrief, type BriefLang } from "../voice/brief";
import { PHRASE_CLIPS } from "../voice/phrases";
import { loadCachedBooking, loadCachedTrip } from "../lib/fixtures";

export function voiceRouter(config: Config, tts: TextToSpeech): Router {
  const router = Router();
  const deps = { config, tts };

  router.get("/voice/brief/:itineraryId", (req, res) => {
    const itinerary = getItinerary(req.params.itineraryId);
    if (!itinerary?.booking) {
      res
        .status(404)
        .json({ error: `No briefable itinerary ${req.params.itineraryId}` });
      return;
    }
    const lang: BriefLang =
      req.query.lang === "ms" || req.query.lang === "zh"
        ? req.query.lang
        : "en";
    const text = composeBrief(itinerary.booking, lang);
    void briefClip(deps, itinerary.sourceUrl, text, lang).then((clip) => {
      const payload: VoiceBriefResponse = {
        itineraryId: itinerary.id,
        lang,
        text,
        synthetic: true,
        ...clip,
      };
      res.json(payload);
    });
  });

  router.get("/voice/trip/:tripId", (req, res) => {
    const trip = loadCachedTrip(req.params.tripId);
    const booking = loadCachedBooking(req.params.tripId);
    if (!trip || !booking) {
      res.status(404).json({ error: `No briefable trip ${req.params.tripId}` });
      return;
    }
    const lang: BriefLang =
      req.query.lang === "ms" || req.query.lang === "zh"
        ? req.query.lang
        : "en";
    const text = composeBrief(booking, lang);
    void briefClip(deps, trip.source_url, text, lang).then((clip) => {
      const payload: VoiceBriefResponse = {
        itineraryId: trip.id,
        lang,
        text,
        synthetic: true,
        ...clip,
      };
      res.json(payload);
    });
  });

  router.get("/voice/trip/:tripId", (req, res) => {
    const trip = loadCachedTrip(req.params.tripId);
    const booking = loadCachedBooking(req.params.tripId);
    if (!trip || !booking) {
      res.status(404).json({ error: `No briefable trip ${req.params.tripId}` });
      return;
    }
    const lang: BriefLang =
      req.query.lang === "ms" || req.query.lang === "zh"
        ? req.query.lang
        : "en";
    const text = composeBrief(booking, lang);
    void briefClip(deps, trip.source_url, text, lang).then((clip) => {
      const payload: VoiceBriefResponse = {
        itineraryId: trip.id,
        lang,
        text,
        synthetic: true,
        ...clip,
      };
      res.json(payload);
    });
  });

  router.get("/voice/phrases", (_req, res) => {
    void Promise.all(
      PHRASE_CLIPS.map(async (phrase): Promise<PhraseClipResponse> => ({
        ...phrase,
        ...(await phraseClip(deps, phrase)),
      })),
    ).then((clips) => {
      res.json(clips);
    });
  });

  router.get("/voice/audio/:name", (req, res) => {
    const file = findVoiceAudioFile(req.params.name);
    if (!file) {
      res.status(404).json({ error: "Unknown audio clip" });
      return;
    }
    res.type("audio/mpeg").sendFile(file);
  });

  return router;
}
