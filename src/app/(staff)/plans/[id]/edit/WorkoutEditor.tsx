"use client";
import { useState } from "react";
import { MUSCLE_LABELS } from "@/lib/labels";
import { MUSCLES, type Exercise, type PlanStatus, type WorkoutDay, type WorkoutPlanContent } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { PlanToolbar } from "./PlanToolbar";
import { usePlanSaver } from "./usePlanSaver";

export function WorkoutEditor({
  planId, memberId, memberName, exercises, initial,
}: {
  planId: string;
  memberId: string;
  memberName: string;
  exercises: Exercise[];
  initial: { title: string; status: PlanStatus; content: WorkoutPlanContent };
}) {
  const s = usePlanSaver(planId, initial);
  const { content, setContent } = s;

  const updateDay = (di: number, fn: (d: WorkoutDay) => WorkoutDay) =>
    setContent((c) => ({ ...c, days: c.days.map((d, i) => (i === di ? fn(d) : d)) }));

  const move = (di: number, xi: number, dir: -1 | 1) =>
    updateDay(di, (d) => {
      const list = [...d.exercises];
      const j = xi + dir;
      if (j < 0 || j >= list.length) return d;
      [list[xi], list[j]] = [list[j]!, list[xi]!];
      return { ...d, exercises: list };
    });

  return (
    <>
      <PlanToolbar
        planId={planId} memberId={memberId} memberName={memberName}
        title={s.title} onTitle={s.setTitle} status={s.status} dirty={s.dirty} busy={s.busy} result={s.result}
        blockers={0} onSave={s.save} onPublish={s.publish} onUnpublish={s.unpublish}
      />

      <div className="space-y-4">
        {content.days.map((day, di) => (
          <Card key={di}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor={`day-${di}`} className="sr-only">Day name</label>
              <input
                id={`day-${di}`}
                value={day.name}
                maxLength={80}
                onChange={(e) => {
                  const name = e.target.value;
                  updateDay(di, (d) => ({ ...d, name }));
                }}
                className="input text-lg font-semibold sm:flex-1"
              />
              <RemoveDayButton
                onConfirm={() => setContent((c) => ({ ...c, days: c.days.filter((_, i) => i !== di) }))}
                disabled={content.days.length <= 1}
              />
            </div>

            {day.exercises.length === 0 ? (
              <p className="mb-3 text-muted">No exercises yet.</p>
            ) : (
              <ol className="mb-3 space-y-3">
                {day.exercises.map((x, xi) => (
                  <li key={`${x.exercise_id}-${xi}`} className="rounded-xl bg-raised p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="flex-1 font-semibold">
                        {xi + 1}. {x.name} <span className="text-sm font-normal text-muted">({MUSCLE_LABELS[x.target_muscle]})</span>
                      </p>
                      <Button variant="ghost" onClick={() => move(di, xi, -1)} disabled={xi === 0} aria-label="Move up">↑</Button>
                      <Button variant="ghost" onClick={() => move(di, xi, 1)} disabled={xi === day.exercises.length - 1} aria-label="Move down">↓</Button>
                      <Button
                        variant="ghost"
                        onClick={() => updateDay(di, (d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== xi) }))}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-[6rem_8rem_8rem_1fr]">
                      <label className="text-sm text-muted">Sets
                        <input type="number" min={1} max={20} inputMode="numeric" value={x.sets} className="input mt-1"
                          onChange={(e) => {
                            const sets = Math.max(1, Math.min(20, Math.round(Number(e.target.value) || 1)));
                            updateDay(di, (d) => ({ ...d, exercises: d.exercises.map((y, i) => (i === xi ? { ...y, sets } : y)) }));
                          }} />
                      </label>
                      <label className="text-sm text-muted">Reps / time
                        <input value={x.reps} maxLength={30} className="input mt-1"
                          onChange={(e) => {
                            const reps = e.target.value;
                            updateDay(di, (d) => ({ ...d, exercises: d.exercises.map((y, i) => (i === xi ? { ...y, reps } : y)) }));
                          }} />
                      </label>
                      <label className="text-sm text-muted">Rest (sec)
                        <input type="number" min={0} max={600} step={15} inputMode="numeric" value={x.rest_sec} className="input mt-1"
                          onChange={(e) => {
                            const rest_sec = Math.max(0, Math.min(600, Math.round(Number(e.target.value) || 0)));
                            updateDay(di, (d) => ({ ...d, exercises: d.exercises.map((y, i) => (i === xi ? { ...y, rest_sec } : y)) }));
                          }} />
                      </label>
                      <label className="col-span-3 text-sm text-muted sm:col-span-1">Note
                        <input value={x.notes} maxLength={200} className="input mt-1" placeholder="e.g. light weight, go slow"
                          onChange={(e) => {
                            const notes = e.target.value;
                            updateDay(di, (d) => ({ ...d, exercises: d.exercises.map((y, i) => (i === xi ? { ...y, notes } : y)) }));
                          }} />
                      </label>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <ExercisePicker
              exercises={exercises}
              onAdd={(ex) =>
                updateDay(di, (d) => ({
                  ...d,
                  exercises: [...d.exercises, {
                    exercise_id: ex.id, name: ex.name, target_muscle: ex.target_muscle, sets: ex.default_sets,
                    reps: ex.default_reps, rest_sec: ex.default_rest_sec, notes: "",
                  }],
                }))
              }
            />
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Button
          variant="secondary"
          disabled={content.days.length >= 7}
          onClick={() => setContent((c) => ({ ...c, days: [...c.days, { name: `Day ${c.days.length + 1}`, exercises: [] }] }))}
        >
          + Add day
        </Button>
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
          placeholder="e.g. Warm up 5–10 minutes before every session."
        />
      </Card>
    </>
  );
}

function ExercisePicker({ exercises, onAdd }: { exercises: Exercise[]; onAdd: (e: Exercise) => void }) {
  const [choice, setChoice] = useState("");
  const active = exercises.filter((e) => e.is_active);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select value={choice} onChange={(e) => setChoice(e.target.value)} className="input sm:flex-1" aria-label="Exercise to add">
        <option value="">Choose an exercise to add…</option>
        {MUSCLES.map((m) => {
          const list = active.filter((e) => e.target_muscle === m);
          if (list.length === 0) return null;
          return (
            <optgroup key={m} label={MUSCLE_LABELS[m]}>
              {list.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </optgroup>
          );
        })}
      </select>
      <Button
        variant="secondary"
        disabled={!choice}
        onClick={() => {
          const ex = active.find((e) => e.id === choice);
          if (ex) onAdd(ex);
          setChoice("");
        }}
      >
        + Add exercise
      </Button>
    </div>
  );
}

function RemoveDayButton({ onConfirm, disabled }: { onConfirm: () => void; disabled: boolean }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <Button variant="danger" disabled={disabled} onClick={() => setAsking(true)}>Remove day</Button>;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-danger/50 bg-danger/10 p-2">
      <span>Remove this day?</span>
      <Button variant="danger" onClick={() => { onConfirm(); setAsking(false); }}>Yes, remove</Button>
      <Button variant="secondary" onClick={() => setAsking(false)}>No</Button>
    </div>
  );
}
