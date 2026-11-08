"use client";

import { MAX_NOTE_LENGTH } from "@/modules/custom-pickle/custom-pickle.types";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";

export function NoteStep({ builder }: { builder: CustomPickleBuilderState }) {
  const { note, setNote } = builder;

  return (
    <Step index={6} title="Notunuz" hint="İsteğe bağlı">
      <label htmlFor="pickle-note" className="sr-only">
        Not
      </label>
      <textarea
        id="pickle-note"
        value={note}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-border bg-white p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
      <span className="-mt-2 self-end text-xs text-muted-foreground">
        {note.length}/{MAX_NOTE_LENGTH}
      </span>
    </Step>
  );
}
