export function riskBadge(v) {
  const cls = { High: 'badge badge-red', Medium: 'badge badge-amber', Low: 'badge badge-green' };
  return <span className={cls[v] || 'badge badge-gray'}>{v}</span>;
}

export function statusBadge(v) {
  const cls = { Open: 'badge badge-red', 'In-Progress': 'badge badge-amber', Resolved: 'badge badge-green' };
  return <span className={cls[v] || 'badge badge-gray'}>{v}</span>;
}

export function priorityBadge(v) {
  const cls = { P0: 'badge badge-red', P1: 'badge badge-red', P2: 'badge badge-amber', P3: 'badge badge-blue', P4: 'badge badge-gray' };
  return <span className={cls[v] || 'badge badge-gray'}>{v}</span>;
}

export function paymentBadge(v) {
  const cls = { 'Fully Paid': 'badge badge-green', Partial: 'badge badge-amber', Pending: 'badge badge-red' };
  return <span className={cls[v] || 'badge badge-gray'}>{v}</span>;
}
