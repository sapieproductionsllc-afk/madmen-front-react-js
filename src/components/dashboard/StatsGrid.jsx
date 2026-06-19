import StatCard from "./StatCard.jsx";
import { stats } from "../../data/mockData.js";

// Grille des 4 indicateurs clés.
export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((s, i) => (
        <div key={s.id} className="reveal" style={{ animationDelay: `${i * 80}ms` }}>
          <StatCard {...s} />
        </div>
      ))}
    </div>
  );
}
