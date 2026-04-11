import type { PaperNode } from '../types';

type Props = {
  paper: PaperNode | null;
  onClose: () => void;
};

export function PaperInfoPanel({ paper, onClose }: Props) {
  if (!paper) return null;

  return (
    <aside className="paper-panel" aria-label="Paper details">
      <div className="paper-panel__head">
        <h2 className="paper-panel__title">
          {paper.role === 'hub' ? 'Center' : paper.role === 'pillar' ? 'Pillar' : 'Publication'}
        </h2>
        <button type="button" className="paper-panel__close" onClick={onClose} aria-label="Close panel">
          ×
        </button>
      </div>
      <div className="paper-panel__body">
        <p className="paper-panel__field">
          <span className="paper-panel__label">Title</span>
          <span className="paper-panel__value">{paper.title}</span>
        </p>
        <p className="paper-panel__field">
          <span className="paper-panel__label">Year</span>
          <span className="paper-panel__value">{paper.year}</span>
        </p>
        <p className="paper-panel__field">
          <span className="paper-panel__label">Venue</span>
          <span className="paper-panel__value">{paper.venue}</span>
        </p>
        <p className="paper-panel__field">
          <span className="paper-panel__label">Field</span>
          <span className="paper-panel__value">{paper.field}</span>
        </p>
        <p className="paper-panel__field">
          <span className="paper-panel__label">Citations</span>
          <span className="paper-panel__value">{paper.citations}</span>
        </p>
        <div className="paper-panel__actions">
          <a
            className="paper-panel__btn paper-panel__btn--primary"
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Paper
          </a>
        </div>
      </div>
    </aside>
  );
}
