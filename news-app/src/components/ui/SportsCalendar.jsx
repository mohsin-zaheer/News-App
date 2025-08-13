import React, { useEffect, useState } from 'react';
import './SportsCalendar.css';

function SportsCalendar({ year, month }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
  const fetchEvents = async () => {
    const cacheKey = `sportsEvents-${year}-${month}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setEvents(JSON.parse(cached));
      console.log('Loaded from localStorage');
      return;
    }

    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id=4328`
      );
      const data = await res.json();
      const eventsData = data.events || [];
      console.log(data);
      

      // Save to localStorage
      localStorage.setItem(cacheKey, JSON.stringify(eventsData));
      setEvents(eventsData);
      console.log('Fetched from API and cached');
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  fetchEvents();
}, [year, month]);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay(); // 0 = Sun

  const matchMap = events.reduce((acc, event) => {
    acc[event.dateEvent] = event;
    return acc;
  }, {});

  const cells = [];

  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} className="cell empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const match = matchMap[dateStr];

    cells.push(
      <div key={day} className="cell">
        {match ? (
          <img
            src={match.strHomeTeamBadge || '/default-logo.png'}
            alt="Match"
            className="match-logo"
          />
        ) : (
          <span className="date">{day}</span>
        )}
      </div>
    );
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
    ];

    const displayMonth = monthNames[month - 1];

  return (
    <div className="calendar-container">
        <h5 className='currentMonth'>{displayMonth} {year}</h5>
      <div className="calendar">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="cell header">{day}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}

export default SportsCalendar;
