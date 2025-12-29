import type { Itinerary } from '../../types';
import Card from '../Card';
import { Plane, Hotel, MapPin, Calendar } from 'lucide-react';
import './ItinerarySummary.css';

interface ItinerarySummaryProps {
  itinerary: Itinerary;
}

export default function ItinerarySummary({ itinerary }: ItinerarySummaryProps) {
  return (
    <div className="itinerary-summary">
      <Card className="summary-card">
        <div className="summary-item">
          <Plane className="summary-icon" />
          <div>
            <div className="summary-label">Flights</div>
            <div className="summary-value">{itinerary.flights.length}</div>
          </div>
        </div>
        <div className="summary-item">
          <Hotel className="summary-icon" />
          <div>
            <div className="summary-label">Hotels</div>
            <div className="summary-value">{itinerary.hotels.length}</div>
          </div>
        </div>
        <div className="summary-item">
          <MapPin className="summary-icon" />
          <div>
            <div className="summary-label">Activities</div>
            <div className="summary-value">{itinerary.activities.length}</div>
          </div>
        </div>
        <div className="summary-item">
          <Calendar className="summary-icon" />
          <div>
            <div className="summary-label">Days</div>
            <div className="summary-value">{itinerary.days.length}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

