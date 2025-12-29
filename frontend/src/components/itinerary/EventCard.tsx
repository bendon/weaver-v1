import type { Activity, Transfer } from '../../types';
import { format } from 'date-fns';
import { Plane, Car, Target, Hotel } from 'lucide-react';
import Badge from '../Badge';
import './EventCard.css';

interface EventCardProps {
  type: 'activity' | 'transfer' | 'flight' | 'hotel';
  data: Activity | Transfer | any;
}

export default function EventCard({ type, data }: EventCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'activity':
        return <Target className="event-icon" />;
      case 'transfer':
        return <Car className="event-icon" />;
      case 'flight':
        return <Plane className="event-icon" />;
      case 'hotel':
        return <Hotel className="event-icon" />;
      default:
        return null;
    }
  };

  const getTime = () => {
    if (type === 'activity' && (data as Activity).start_time) {
      return format(new Date(`2000-01-01T${(data as Activity).start_time}`), 'HH:mm');
    }
    if (type === 'transfer' && (data as Transfer).pickup_datetime) {
      return format(new Date((data as Transfer).pickup_datetime!), 'HH:mm');
    }
    return null;
  };

  const getTitle = () => {
    if (type === 'activity') {
      return (data as Activity).name;
    }
    if (type === 'transfer') {
      return (data as Transfer).transfer_type === 'private' ? 'PRIVATE TRANSFER' : 'TRANSFER';
    }
    return '';
  };

  const getDetails = () => {
    if (type === 'activity') {
      const activity = data as Activity;
      return (
        <>
          {activity.description && <div className="event-description">{activity.description}</div>}
          {activity.meeting_point && (
            <div className="event-detail">Meet at: {activity.meeting_point}</div>
          )}
        </>
      );
    }
    if (type === 'transfer') {
      const transfer = data as Transfer;
      return (
        <>
          <div className="event-detail">
            {transfer.pickup_location} → {transfer.dropoff_location}
          </div>
          {transfer.driver_name && (
            <div className="event-detail">Driver: {transfer.driver_name}</div>
          )}
          {transfer.driver_phone && (
            <div className="event-detail">Phone: {transfer.driver_phone}</div>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div className="event-card">
      <div className="event-icon-wrapper">{getIcon()}</div>
      <div className="event-content">
        {getTime() && <div className="event-time">{getTime()}</div>}
        <div className="event-title">{getTitle()}</div>
        {getDetails()}
      </div>
    </div>
  );
}

