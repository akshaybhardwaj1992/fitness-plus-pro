import { describe, expect, it } from "vitest";
import { fmtPortion, fmtQty } from "@/lib/labels";

describe("kitchen-friendly quantities", () => {
  it("fmtQty uses fractions", () => {
    expect(fmtQty(2.5)).toBe("2½");
    expect(fmtQty(0.5)).toBe("½");
    expect(fmtQty(3)).toBe("3");
    expect(fmtQty(1.25)).toBe("1¼");
  });

  it("fmtPortion multiplies the leading amount", () => {
    expect(fmtPortion(1, "1 katori", 150)).toBe("1 katori");
    expect(fmtPortion(2.5, "1 katori", 150)).toBe("2½ katori");
    expect(fmtPortion(2, "½ katori (100 g cooked)", 100)).toBe("1 katori");
    expect(fmtPortion(1.5, "2 small chilla", 100)).toBe("3 small chilla");
    expect(fmtPortion(2, "1 glass (250 ml)", 250)).toBe("2 glass");
  });

  it("falls back to N × description when there is no clear amount", () => {
    expect(fmtPortion(1.5, "about 15 almonds", 20)).toBe("1½ × about 15 almonds");
    expect(fmtPortion(2, "2-3 dates", 20)).toBe("2 × 2-3 dates");
    expect(fmtPortion(2, "", 40)).toBe("80 g");
  });
});