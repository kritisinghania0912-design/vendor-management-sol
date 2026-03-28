export function TableSkeleton({ cols = 5, rows = 6 }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, j) => (
              <th key={j}><div className="skeleton-cell" style={{ width: '55%' }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><div className="skeleton-cell" style={{ width: `${45 + (j * 11 + i * 7) % 40}%` }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardsSkeleton({ count = 4 }) {
  return (
    <div className="cards-row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="skeleton-cell" style={{ width: '48%', height: 11, marginBottom: 14 }} />
          <div className="skeleton-cell" style={{ width: '32%', height: 26 }} />
          <div className="skeleton-cell" style={{ width: '56%', height: 10, marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}
