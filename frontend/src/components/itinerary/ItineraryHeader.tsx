import type { Itinerary } from '../../types';
import { format } from 'date-fns';
import Card from '../Card';
import './ItineraryHeader.css';

interface ItineraryHeaderProps {
  itinerary: Itinerary;
}

export default function ItineraryHeader({ itinerary }: ItineraryHeaderProps) {
  // Use black as the primary color for brand consistency
  const primaryColor = '#000000';
  const startDate = itinerary.days[0]?.date;
  const endDate = itinerary.days[itinerary.days.length - 1]?.date;

  return (
    <Card className="itinerary-header" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      <div className="header-content">
        <h1 className="itinerary-title">{itinerary.title}</h1>
        <div className="itinerary-ref">Reference: {itinerary.reference_number}</div>
        {startDate && endDate && (
          <div className="itinerary-dates">
            {format(new Date(startDate), 'd MMMM')} - {format(new Date(endDate), 'd MMMM yyyy')}
            {itinerary.duration_nights > 0 && (
              <span className="duration">({itinerary.duration_nights} nights)</span>
            )}
          </div>
        )}
        {itinerary.travelers.length > 0 && (
          <div className="travelers">
            <strong>Travelers:</strong> {itinerary.travelers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
          </div>
        )}
      </div>
    </Card>
  );
}

