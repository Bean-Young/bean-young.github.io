type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  yearMin: number;
  yearMax: number;
  yearLimit: number;
  onYearChange: (y: number) => void;
  nodeCount: number;
  linkCount: number;
};

export function GraphToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  yearMin,
  yearMax,
  yearLimit,
  onYearChange,
  nodeCount,
  linkCount,
}: Props) {
  return (
    <header className="graph-toolbar">
      <div className="graph-toolbar__search">
        <label htmlFor="paper-search" className="sr-only">
          Search papers by title
        </label>
        <input
          id="paper-search"
          type="search"
          placeholder="Search title…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchSubmit();
          }}
          className="graph-toolbar__input"
          autoComplete="off"
        />
        <button type="button" className="graph-toolbar__btn" onClick={onSearchSubmit}>
          Go
        </button>
      </div>
      <div className="graph-toolbar__slider">
        <label htmlFor="year-slider">
          Year ≤ <strong>{yearLimit}</strong>
        </label>
        <input
          id="year-slider"
          type="range"
          min={yearMin}
          max={yearMax}
          value={yearLimit}
          onChange={(e) => onYearChange(Number(e.target.value))}
        />
      </div>
      <div className="graph-toolbar__meta" aria-live="polite">
        {nodeCount} nodes · {linkCount} links
      </div>
    </header>
  );
}
