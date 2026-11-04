"use client";
import { useMemo, useState } from "react";
import { DAY_NAMES, SLOT_LABELS, WORKOUT_DAY_SLOTS } from "@/lib/nutrition/config";
import {
  calorieBounds, checkDietPlan, dayCost, dayTotal, foodConflicts, foodToItem, itemNutrients, itemsTotal,
} from "@/lib/nutrition/rules";
import { CATEGORY_LABELS, fmt } from "@/lib/labels";
import { FOOD_CATEGORIES, type DietDay, type DietPlanContent, type Food, type MemberForPlan, type PlanStatus } from "@/lib/types";
import { Button, Card, Notice, Stat } from "@/components/ui";
import { PlanToolbar } from "./PlanToolbar";
import { usePlanSaver } from "./usePlanSaver";

export function DietEditor({
  planId, memberId, memberName, member, foods, initial,
}: {
  planId: string;
  memberId: string;
  memberName: string;
  member: MemberForPlan;
  foods: Food[];
  initial: { title: string; status: PlanStatus; content: DietPlanContent };
}) {
  const s = usePlanSaver(planId, initial);
  const { content, setContent } = s;
  const [dayIdx, setDayIdx] = useState(0);
  const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);
  const check = useMemo(() => checkDietPlan(content, member, { strict: false, foodsById }), [content, member, foodsById]);
  const t = content.targets;
  const day = content.days[dayIdx];

  const updateDay = (fn: (d: DietDay) => DietDay) =>
    setContent((c) => ({ ...c, days: c.days.map((d, i) => (i === dayIdx ? fn(d) : d)) }));

  const setServings = (mealIdx: number, itemIdx: number, servings: number) =>
    updateDay((d) => ({
      ...d,
      meals: d.meals.map((m, mi) =>
        mi !== mealIdx ? m : { ...m, items: m.items.map((it, ii) => (ii === itemIdx ? { ...it, servings } : it)) },
      ),
    }));

  const removeItem = (mealIdx: number, itemIdx: number) =>
    updateDay((d) => ({
      ...d,
      meals: d.meals.map((m, mi) => (mi !== mealIdx ? m : { ...m, items: m.items.filter((_, ii) => ii !== itemIdx) })),
    }));

  const addItem = (mealIdx: number, foodId: string) => {
    const food = foodsById.get(foodId);
    if (!food) return;
    updateDay((d) => ({
      ...d,
      meals: d.meals.map((m, mi) => (mi !== mealIdx ? m : { ...m, items: [...m.items, foodToItem(food, 1)] })),
    }));
  };

  const setWorkoutDay = (on: boolean) =>
    updateDay((d) => {
      const slots = on ? WORKOUT_DAY_SLOTS : WORKOUT_DAY_SLOTS.filter((x) => x !== "pre_workout" && x !== "post_workout");
      return {
        ...d,
        is_workout_day: on,
        meals: slots.map((slot) => d.meals.find((m) => m.slot === slot) ?? { slot, items: [] }),
      };
    });

  const copyDayToAll = () =>
    setContent((c) => {
      const src = c.days[dayIdx]!;
      return {
        ...c,
        days: c.days.map((d, i) =>
          i === dayIdx ? d : {
            ...d,
            meals: d.meals.map((m) => {
              const from = src.meals.find((x) => x.slot === m.slot);
              return from ? { ...m, items: from.items.map((it) => ({ ...it })) } : m;
            }),
          },
        ),
      };
    });

  if (!day) return <Notice tone="error">This plan has no days.</Notice>;
  const total = dayTotal(day);
  const [lo, hi] = t ? calorieBounds(t) : [0, Infinity];
  const kcalOk = !t || (total.kcal >= lo - 0.5 && total.kcal <= hi + 0.5);
  const cost = dayCost(day);
  const prePostHasFood = day.meals.some((m) => (m.slot === "pre_workout" || m.slot === "post_workout") && m.items.length > 0);

  return (
    <>
      <PlanToolbar
        planId={planId} memberId={memberId} memberName={memberName}
        title={s.title} onTitle={s.setTitle} status={s.status} dirty={s.dirty} busy={s.busy} result={s.result}
        blockers={check.errors.length} onSave={s.save} onPublish={s.publish} onUnpublish={s.unpublish}
      />

      {check.errors.length > 0 && (
        <div className="mb-4">
          <Notice tone="error" title="Must fix before publishing">
            <ul className="list-disc pl-5">{check.errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </Notice>
        </div>
      )}
      {(check.warnings.length > 0 || content.warnings.length > 0) && (
        <div className="mb-4">
          <Notice tone="warn" title="Please check">
            <ul className="list-disc pl-5">
              {[...content.warnings, ...check.warnings].map((w) => <li key={w}>{w}</li>)}
            </ul>
          </Notice>
        </div>
      )}

      {/* day tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Days">
        {content.days.map((d, i) => (
          <button
            key={d.day}
            role="tab"
            aria-selected={i === dayIdx}
            onClick={() => setDayIdx(i)}
            className={`min-h-12 shrink-0 rounded-xl px-4 font-medium ${i === dayIdx ? "bg-brand text-ink" : "bg-card text-white hover:bg-raised"}`}
          >
            {DAY_NAMES[d.day]?.slice(0, 3)}
            {d.is_workout_day && <span className="ml-1" aria-label="workout day">•</span>}
          </button>
        ))}
      </div>

      {/* day summary */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {DAY_NAMES[day.day]} <span className="text-muted">— {day.is_workout_day ? "workout day" : "rest day"}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <label className="flex min-h-12 items-center gap-2 rounded-xl bg-raised px-3">
              <input
                type="checkbox"
                checked={day.is_workout_day}
                disabled={day.is_workout_day && prePostHasFood}
                onChange={(e) => setWorkoutDay(e.target.checked)}
              />
              Workout day
            </label>
            <CopyDayButton onConfirm={copyDayToAll} dayName={DAY_NAMES[day.day] ?? ""} />
          </div>
        </div>
        {day.is_workout_day && prePostHasFood && (
          <p className="mt-1 text-sm text-muted">To make this a rest day, first remove the pre- and post-workout foods.</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat
            label="Calories"
            value={<span className={kcalOk ? "text-brand" : "text-warn"}>{fmt(total.kcal)}</span>}
            sub={t ? `target ${fmt(t.calories)} (${fmt(lo)}–${fmt(hi)})` : "no target (manual plan)"}
          />
          <Stat label="Protein" value={`${fmt(total.protein_g)} g`} sub={t ? `target ${t.protein_g} g` : undefined} />
          <Stat label="Carbs" value={`${fmt(total.carbs_g)} g`} sub={t ? `target ${t.carbs_g} g` : undefined} />
          <Stat label="Fat" value={`${fmt(total.fat_g)} g`} sub={t ? `target ${t.fat_g} g` : undefined} />
          <Stat label="Est. cost" value={`₹${fmt(cost.cost)}`} sub={member.daily_budget_inr ? `budget ₹${fmt(member.daily_budget_inr)}` : undefined} />
        </div>
      </Card>

      {/* meals */}
      <div className="space-y-4">
        {day.meals.map((meal, mealIdx) => {
          const mt = itemsTotal(meal.items);
          return (
            <Card key={meal.slot}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{SLOT_LABELS[meal.slot]}</h3>
                <p className="text-muted">{fmt(mt.kcal)} kcal · {fmt(mt.protein_g)} g protein</p>
              </div>
              {meal.items.length === 0 ? (
                <p className="mb-3 text-muted">No food added yet.</p>
              ) : (
                <ul className="mb-3 divide-y divide-line">
                  {meal.items.map((it, itemIdx) => {
                    const current = it.food_id ? foodsById.get(it.food_id) : undefined;
                    const conflicts = foodConflicts(current ?? it, member);
                    const n = itemNutrients(it);
                    return (
                      <li key={`${it.food_id}-${itemIdx}`} className="flex flex-wrap items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {it.name} {!it.verified && <span title="Nutrition values not verified yet" className="text-warn">⚠</span>}
                          </p>
                          <p className="text-sm text-muted">
                            1 serving = {it.serving_desc || `${it.serving_size_g} g`} · {fmt(n.kcal)} kcal · {fmt(n.protein_g)} g protein
                          </p>
                          {conflicts.length > 0 && (
                            <p className="text-sm font-semibold text-danger">Not allowed: {conflicts.join(", ")}</p>
                          )}
                        </div>
                        <label className="flex items-center gap-2">
                          <span className="text-sm text-muted">Servings</span>
                          <input
                            type="number"
                            min={0.25}
                            max={20}
                            step={0.25}
                            inputMode="decimal"
                            value={it.servings}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v) && v >= 0) setServings(mealIdx, itemIdx, v);
                            }}
                            className="input w-24"
                            aria-label={`Servings of ${it.name}`}
                          />
                        </label>
                        <Button variant="ghost" onClick={() => removeItem(mealIdx, itemIdx)} aria-label={`Remove ${it.name}`}>
                          Remove
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <FoodPicker foods={foods} member={member} onAdd={(id) => addItem(mealIdx, id)} />
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <label htmlFor="plan-notes" className="mb-1 block font-semibold">Notes for the member (printed on the plan)</label>
        <textarea
          id="plan-notes"
          value={content.notes}
          maxLength={2000}
          onChange={(e) => {
            const notes = e.target.value;
            setContent((c) => ({ ...c, notes }));
          }}
          className="input"
          placeholder="e.g. Drink 3 litres of water. Use 2 tsp oil per meal."
        />
      </Card>
    </>
  );
}

function FoodPicker({ foods, member, onAdd }: { foods: Food[]; member: MemberForPlan; onAdd: (id: string) => void }) {
  const [filter, setFilter] = useState("");
  const [choice, setChoice] = useState("");
  const shown = foods.filter((f) => f.is_active && f.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Type to filter foods"
        className="input sm:w-48"
        aria-label="Filter foods"
      />
      <select value={choice} onChange={(e) => setChoice(e.target.value)} className="input sm:flex-1" aria-label="Food to add">
        <option value="">Choose a food to add…</option>
        {FOOD_CATEGORIES.map((cat) => {
          const list = shown.filter((f) => f.category === cat);
          if (list.length === 0) return null;
          return (
            <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
              {list.map((f) => {
                const bad = foodConflicts(f, member);
                return (
                  <option key={f.id} value={f.id} disabled={bad.length > 0}>
                    {f.name} — {fmt(f.kcal)} kcal{bad.length ? ` (not allowed: ${bad.join(", ")})` : ""}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
      <Button
        variant="secondary"
        disabled={!choice}
        onClick={() => {
          onAdd(choice);
          setChoice("");
        }}
      >
        + Add
      </Button>
    </div>
  );
}

function CopyDayButton({ onConfirm, dayName }: { onConfirm: () => void; dayName: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <Button variant="secondary" onClick={() => setAsking(true)}>Copy to all days</Button>;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-warn/50 bg-warn/10 p-2">
      <span>Replace every other day&apos;s meals with {dayName}&apos;s?</span>
      <Button onClick={() => { onConfirm(); setAsking(false); }}>Yes, copy</Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>No</Button>
    </div>
  );
}
