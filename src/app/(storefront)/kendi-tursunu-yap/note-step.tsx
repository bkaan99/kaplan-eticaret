"use client";

import {
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/modules/custom-pickle/custom-pickle.types";
import { type CustomPickleBuilderState } from "./use-custom-pickle-builder";
import { Step } from "./builder-step-frame";

/** Müşteri bidonun etiketine yazılacak ismi seçer ve ustaya not bırakır. */
export function NoteStep({ builder }: { builder: CustomPickleBuilderState }) {
  const { note, setNote, title, setTitle } = builder;

  return (
    <Step index={6} title="Etiketin ve notun" hint="İsteğe bağlı">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pickle-title"
          className="text-sm font-semibold text-primary"
        >
          Tarifine isim ver
        </label>
        <p className="text-xs text-slate-500">
          Bu isim bidonun etiketinde görünür. Örn. “Anneannemin karışığı”,
          “Cumartesi sofrası”.
        </p>
        <input
          id="pickle-title"
          type="text"
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Tarifinin adı"
          className="h-11 w-full rounded-full border border-slate-200 bg-[#f8f9f5] px-5 text-sm font-medium outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
        <span className="self-end text-xs text-muted-foreground">
          {title.length}/{MAX_TITLE_LENGTH}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pickle-note"
          className="text-sm font-semibold text-primary"
        >
          Ustana not bırak
        </label>
        <textarea
          id="pickle-note"
          value={note}
          maxLength={MAX_NOTE_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Örn. az tuzlu olsun, sarımsak bol olsun…"
          className="w-full rounded-2xl border border-slate-200 bg-[#f8f9f5] p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <span className="self-end text-xs text-muted-foreground">
          {note.length}/{MAX_NOTE_LENGTH}
        </span>
      </div>
    </Step>
  );
}
