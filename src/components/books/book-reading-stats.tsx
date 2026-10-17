import type { BookReadingStatsView } from '@/features/reading/queries';

export function BookReadingStats({ stats }: { stats: BookReadingStatsView }) {
  return (
    <div className="book-reading-stats-bar" aria-label="Leitores desta obra na comunidade">
      <div className="book-reading-stat-item">
        <strong>{stats.activeReaders}</strong>
        <span>lendo agora</span>
      </div>
      <div className="book-reading-stat-item">
        <strong>{stats.completedReaders}</strong>
        <span>já leram</span>
      </div>
      <div className="book-reading-stat-item">
        <strong>{stats.startedReaders}</strong>
        <span>iniciaram</span>
      </div>
      {stats.rankPosition !== null && stats.completedReaders > 0 && (
        <div className="book-reading-stat-item is-rank">
          <strong>#{stats.rankPosition}</strong>
          <span>no ranking de leitura</span>
        </div>
      )}
    </div>
  );
}
