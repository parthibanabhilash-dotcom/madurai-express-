export function Hours({ value }: { value: unknown }) {
  const rows = Array.isArray(value)
    ? (value as { day: string; closed: boolean; open: string; close: string }[])
    : [];
  if (!rows.length) return null;
  return (
    <div className="visit-hours">
      <h3>Opening hours · IST</h3>
      {rows.map((h) => (
        <div className="hours-row" key={h.day}>
          <span>{h.day}</span>
          <span>{h.closed ? 'Closed' : h.open + ' – ' + h.close}</span>
        </div>
      ))}
    </div>
  );
}
