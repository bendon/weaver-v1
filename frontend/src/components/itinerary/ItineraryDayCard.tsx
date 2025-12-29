import type { ItineraryDay } from '../../types';
import { format } from 'date-fns';
import Card from '../Card';
import EventCard from './EventCard';
import './ItineraryDayCard.css';

interface ItineraryDayCardProps {
  day: ItineraryDay;
}

export default function ItineraryDayCard({ day }: ItineraryDayCardProps) {
  const hasEvents = day.activities.length > 0 || day.transfers.length > 0;

  return (
    <Card className="day-card" variant="elevated">
      <div className="day-header">
        <div className="day-number">{day.day_number}</div>
        <div className="day-info">
          <div className="day-title">
            {day.location || `Day ${day.day_number}`}
          </div>
          <div className="day-date">
            {format(new Date(day.date), 'EEEE, d MMMM yyyy')}
          </div>
        </div>
      </div>

      {hasEvents ? (
        <div className="day-events">
          {day.transfers.map((transfer) => (
            <EventCard key={transfer.booking_id} type="transfer" data={transfer} />
          ))}
          {day.activities.map((activity) => (
            <EventCard key={activity.booking_id} type="activity" data={activity} />
          ))}
        </div>
      ) : (
        <div className="day-empty">Free day - no scheduled activities</div>
      )}
    </Card>
  );
}

