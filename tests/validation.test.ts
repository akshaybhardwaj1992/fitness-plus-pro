import { describe, expect, it } from "vitest";
import { parseFoodForm, parseMemberForm, parseWeightForm } from "@/lib/validation";
import { toCsv } from "@/lib/csv";

const form = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of Array.isArray(v) ? v : [v]) f.append(k, x);
  return f;
};

const goodMember = {
  full_name: "Asha Rao", phone: "+91 98765 43210", age: "28", sex: "female", height_cm: "160", weight_kg: "62.5",
  goal: "fat_loss", activity_level: "light", workouts_per_week: "4", experience: "beginner", diet_type: "vegetarian",
  cooking_style: "simple",
  allergies: "peanuts", foods_to_avoid: "", daily_budget_inr: "", medical_notes: "",
};

describe("member form", () => {
  it("accepts a valid member and converts numbers", () => {
    const r = parseMemberForm(form(goodMember));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.age).toBe(28);
      expect(r.data.weight_kg).toBe(62.5);
      expect(r.data.daily_budget_inr).toBeNull();
      expect(r.data.needs_professional_review).toBe(false);
    }
  });

  it("gives plain-language errors for missing / out-of-range fields", () => {
    const r = parseMemberForm(form({ ...goodMember, full_name: "", age: "7", goal: "bulk", phone: "abc" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.full_name).toMatch(/Please enter/);
      expect(r.errors.age).toMatch(/between 10 and 100/);
      expect(r.errors.goal).toMatch(/Please choose/);
      expect(r.errors.phone).toBeDefined();
    }
  });

  it("reads the review checkbox", () => {
    const r = parseMemberForm(form({ ...goodMember, needs_professional_review: "on" }));
    expect(r.ok && r.data.needs_professional_review).toBe(true);
  });
});

describe("food form", () => {
  it("keeps only known allergens and roles", () => {
    const r = parseFoodForm(form({
      name: "Test", category: "fruits", diet_type: "vegan", serving_size_g: "100", serving_desc: "", kcal: "50",
      protein_g: "1", carbs_g: "12", fat_g: "0", fibre_g: "", price_inr: "", source: "label",
      allergens: ["milk", "made-up"], roles: ["fruit", "nope"], is_active: "on",
    }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allergens).toEqual(["milk"]);
      expect(r.data.roles).toEqual(["fruit"]);
      expect(r.data.verified).toBe(false);
    }
  });
});

describe("weight form", () => {
  it("rejects a bad date and weight", () => {
    const r = parseWeightForm(form({ logged_on: "yesterday", weight_kg: "5" }));
    expect(r.ok).toBe(false);
  });
});

describe("CSV export", () => {
  it("quotes commas/quotes and blocks spreadsheet formulas", () => {
    const csv = toCsv([{ a: 'He said "hi", ok', b: "=HYPERLINK(1)", c: null, d: ["x", "y"] }]);
    expect(csv).toBe(`a,b,c,d\r\n"He said ""hi"", ok",'=HYPERLINK(1),,"[""x"",""y""]"`);
  });
});
