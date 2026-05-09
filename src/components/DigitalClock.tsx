import { useState, useEffect } from 'react';

export function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours   = pad(time.getHours());
  const minutes = pad(time.getMinutes());
  const seconds = pad(time.getSeconds());

  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekDay  = weekDays[time.getDay()];
  const year     = time.getFullYear();
  const month    = String(time.getMonth() + 1).padStart(2, '0');
  const day      = String(time.getDate()).padStart(2, '0');

  return (
    <div className="clock-card fade-in select-none" style={{ minWidth: 320 }}>
      {/* Time display */}
      <div className="digital-clock flex items-end justify-center gap-1">
        <span className="clock-digit">{hours}</span>
        <span className="clock-sep" style={{ marginBottom: 6 }}>:</span>
        <span className="clock-digit">{minutes}</span>
        <span className="clock-sep" style={{ marginBottom: 6 }}>:</span>
        <span className="clock-digit clock-seconds">{seconds}</span>
      </div>

      {/* Date & Weekday */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="clock-sub-text">{year}/{month}/{day}</span>
        <span className="clock-dot">·</span>
        <span className="clock-sub-text font-medium">{weekDay}</span>
      </div>
    </div>
  );
}
