import { describe, expect, it } from "vitest";

import {
  calculateDiscountedPriceCents,
  getNextAvailableSlug,
  normalizePhoneNumber,
  sanitizeText,
} from "@/lib/utils";

describe("utils", () => {
  it("calculates percentage discounts safely", () => {
    expect(calculateDiscountedPriceCents(10000, "PERCENTAGE", 20)).toBe(8000);
  });

  it("calculates fixed discounts without going negative", () => {
    expect(calculateDiscountedPriceCents(1500, "FIXED_AMOUNT", 5000)).toBe(0);
  });

  it("normalizes phone numbers", () => {
    expect(normalizePhoneNumber("+961 3 118 776")).toBe("+9613118776");
  });

  it("removes control characters from text input", () => {
    expect(sanitizeText("Hello\u0000 Shopizaj")).toBe("Hello Shopizaj");
  });

  it("finds the next available slug suffix", () => {
    expect(
      getNextAvailableSlug("breeze-thermostat", [
        "breeze-thermostat",
        "breeze-thermostat-2",
        "breeze-thermostat-3",
      ]),
    ).toBe("breeze-thermostat-4");
  });

  it("throws when a slug would be empty", () => {
    expect(() => getNextAvailableSlug("", [])).toThrow(
      "Name must include at least one letter or number.",
    );
  });
});
