const COLORS = ['#000000', '#ffffff', '#e5484d', '#f59e0b', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const SIZES = [
  { label: 'Thin', value: 3 },
  { label: 'Medium', value: 8 },
  { label: 'Thick', value: 16 },
];

export default function Toolbar({ color, setColor, size, setSize, isEraser, setIsEraser, onUndo, onClear, disabled }) {
  if (disabled) return null;

  return (
    <div className="toolbar">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-swatch${color === c && !isEraser ? ' selected' : ''}`}
          style={{ background: c }}
          onClick={() => {
            setColor(c);
            setIsEraser(false);
          }}
          aria-label={`Color ${c}`}
        />
      ))}

      <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
        {SIZES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <button type="button" className={`btn${isEraser ? ' btn-primary' : ''}`} onClick={() => setIsEraser((v) => !v)}>
        Eraser
      </button>
      <button type="button" className="btn" onClick={onUndo}>Undo</button>
      <button type="button" className="btn btn-danger" onClick={onClear}>Clear</button>
    </div>
  );
}
