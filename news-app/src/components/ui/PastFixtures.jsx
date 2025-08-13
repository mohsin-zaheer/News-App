import React, { useEffect, useState } from 'react';
import './PastFixtures.css'; // Optional: style this separately

function PastFixtures() {
  const [table, setTable] = useState([]);

  useEffect(() => {
    const fetchLeagueTable = async () => {
      const cacheKey = 'leagueTable-4328-2025';
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        setTable(JSON.parse(cached));
        console.log('Loaded standings from localStorage');
        return;
      }

      try {
        const res = await fetch(
          'https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=4328&s=2024-2025'
        );
        const data = await res.json();
        const standings = data.table || [];

        localStorage.setItem(cacheKey, JSON.stringify(standings));
        setTable(standings);
        console.log('Fetched standings from API');
      } catch (err) {
        console.error('Failed to fetch standings:', err);
      }
    };

    fetchLeagueTable();
  }, []);



  return (
    <div className="past-fixtures-container">
      <h3 className='pf-title'>English Premier League Standings</h3>
      <table className="fixtures-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>MP</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
           {table.map(team => (
            <tr key={team.teamid}>
              <td>{team.intRank}</td>
              <td className="team-name">
                <img src={team.strBadge} alt={team.name} className="team-logo" />
            
              </td>
              <td>{team.intPlayed}</td>
              <td>{team.intWin}</td>
              <td>{team.intDraw}</td>
              <td>{team.intLoss}</td>
              <td>{team.intGoalsFor}</td>
              <td>{team.intGoalsAgainst}</td>
              <td>{team.intGoalDifference}</td>
              <td>{team.intPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PastFixtures;
