import React, { useEffect, useState } from 'react';
import './NextMatch.css'; // Optional styling

function NextMatch() {
  const [match, setMatch] = useState(null);

  useEffect(() => {
    const fetchNextMatch = async () => {
      const cacheKey = 'nextMatch';
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        setMatch(JSON.parse(cached));
        console.log('Loaded next match from localStorage');
        return;
      }

      try {
        const res = await fetch(
          'https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id=4328'
        );
        const data = await res.json();
        const next = data.events?.[0] || null;

        if (next) {
          localStorage.setItem(cacheKey, JSON.stringify(next));
          setMatch(next);
        }
      } catch (err) {
        console.error('Failed to fetch next match:', err);
      }
    };

    fetchNextMatch();
  }, []);

  if (!match) return <p>Loading next match...</p>;

  function formatMatchDateTime(dateStr, timeStr) {
    const dateTime = new Date(`${dateStr}T${timeStr}Z`);

    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateTime);
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(dateTime);
    const day = dateTime.getDate();

    const ordinal = (n) => {
        if (n >= 11 && n <= 13) return `${n}th`;
        switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
        }
    };

    const formattedTime = dateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return `${dayOfWeek}, ${month} ${ordinal(day)} at ${formattedTime}`;
    }



  return (
    <div className="next-match-container">
      <h3 className='nm-title'>Next Match</h3>
      <div className="match-info">
        <div className="team">
          <img src={match.strHomeTeamBadge || '/default-logo.png'} alt={match.strHomeTeam} className='teamLogo' />
        </div>
        <div className="vs">vs</div>
        <div className="team">
          <img src={match.strAwayTeamBadge || '/default-logo.png'} alt={match.strAwayTeam}  className='teamLogo' />
        </div>
      </div>
      <p className="match-date">
        {formatMatchDateTime(match.dateEvent, match.strTime)}
      </p>

      <div className='teamScores'>
          <p className='teamName1'>{match.strHomeTeam}</p>
          <div className='scoreBg'>
            <div className="score1">00</div>
            <div className="stroke"></div>
            <div className="score2">00</div>

          </div>
          <p className='teamName2' >{match.strAwayTeam}</p>
      </div>


    </div>
  );
}

export default NextMatch;
