'use client';
import { useState } from 'react';
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
type Hours = { day: string; closed: boolean; open: string; close: string };
export function HoursEditor({ initial }: { initial: unknown }) {
  const list = Array.isArray(initial) ? (initial as Hours[]) : [];
  const [enabled, setEnabled] = useState(list.length === 7);
  const [hours, setHours] = useState<Hours[]>(
    days.map(
      (day) => list.find((h) => h.day === day) ?? { day, closed: false, open: '', close: '' },
    ),
  );
  function update(index: number, field: string, value: string | boolean) {
    setHours((old) => old.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }
  return (
    <fieldset className="hours-editor">
      <legend>Weekly opening hours</legend>
      <label className="check">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Hours confirmed by owner
      </label>
      <input
        type="hidden"
        name="hours"
        value={
          enabled
            ? JSON.stringify(
                hours.map((h) => (h.closed ? { ...h, open: '00:00', close: '00:00' } : h)),
              )
            : ''
        }
      />
      {enabled &&
        hours.map((h, i) => (
          <div className="hours-edit-row" key={h.day}>
            <strong>{h.day}</strong>
            <label className="check">
              <input
                type="checkbox"
                checked={h.closed}
                onChange={(e) => update(i, 'closed', e.target.checked)}
              />
              Closed
            </label>
            {!h.closed && (
              <>
                <label>
                  Opens
                  <input
                    type="time"
                    required
                    value={h.open}
                    onChange={(e) => update(i, 'open', e.target.value)}
                  />
                </label>
                <label>
                  Closes
                  <input
                    type="time"
                    required
                    value={h.close}
                    onChange={(e) => update(i, 'close', e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
        ))}
    </fieldset>
  );
}
