import { describe, expect, it } from "vitest";

import { MAX_ALT_LENGTH, mediaAltSchema } from "@/lib/validation/media";

describe("mediaAltSchema", () => {
  it("recorta los espacios", () => {
    expect(mediaAltSchema.parse("  Taza de espresso  ")).toBe("Taza de espresso");
  });

  it("convierte el texto vacío en null, para poder borrarlo", () => {
    expect(mediaAltSchema.parse("")).toBeNull();
    expect(mediaAltSchema.parse("   ")).toBeNull();
  });

  it("rechaza descripciones interminables", () => {
    expect(mediaAltSchema.safeParse("a".repeat(MAX_ALT_LENGTH)).success).toBe(true);
    expect(mediaAltSchema.safeParse("a".repeat(MAX_ALT_LENGTH + 1)).success).toBe(false);
  });
});
