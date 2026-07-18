import { describe, expect, it } from "vitest";
import {
  isShareIntentHandoff,
  redirectSystemPath,
} from "../src/app/+native-intent";

describe("share-extension native intent", () => {
  it("redirects the iOS web URL hand-off to the app root", () => {
    expect(redirectSystemPath({
      path: "jalan2://dataUrl=jalan2ShareKey#weburl",
      initial: true,
    })).toBe("/");
  });

  it("handles the lower-cased form shown by iOS", () => {
    expect(isShareIntentHandoff("jalan2://dataurl=jalan2sharekey")).toBe(true);
    expect(redirectSystemPath({
      path: "jalan2://dataurl=jalan2sharekey",
      initial: false,
    })).toBe("/");
  });

  it("does not rewrite normal Jalan2 deep links", () => {
    const path = "jalan2://trip/xhs-ipoh-gopeng-demo-04";
    expect(redirectSystemPath({ path, initial: false })).toBe(path);
  });
});
