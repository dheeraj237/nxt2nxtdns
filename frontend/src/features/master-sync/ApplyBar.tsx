interface Props {
  selectedCount: number;
  hasMaster: boolean;
  onApply: () => void;
  disabled: boolean;
}

export function ApplyBar({ selectedCount, hasMaster, onApply, disabled }: Props) {
  if (!hasMaster) {
    return <p className="text-sm text-amber-700">Set a master profile first, then select targets to sync.</p>;
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">{selectedCount} profile(s) selected</span>
      <button
        onClick={onApply}
        disabled={disabled || selectedCount === 0}
        className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        Apply master to selected
      </button>
    </div>
  );
}
