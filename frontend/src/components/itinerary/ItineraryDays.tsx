import type { ItineraryDay } from '../../types';
import ItineraryDayCard from './ItineraryDayCard';
import './ItineraryDays.css';

interface ItineraryDaysProps {
  days: ItineraryDay[];
}

export default function ItineraryDays({ days }: ItineraryDaysProps) {
  if (days.length === 0) {
    return (
      <div className="itinerary-days-empty">
        <p>No itinerary days available</p>
      </div>
    );
  }

  return (
    <div className="itinerary-days">
      {days.map((day) => (
        <ItineraryDayCard key={day.day_number} day={day} />
      ))}
    </div>
  );
}

