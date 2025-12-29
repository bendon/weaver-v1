import React from 'react';
import { Plane, MapPin, ChevronRight } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

interface Flight {
  flight_number: string;
  time: string;
  traveler: string;
  destination: string;
  status: 'scheduled' | 'delayed' | 'cancelled';
  code: string;
  from: string;
}

interface TodaysFlightsProps {
  flights: Flight[];
}

export const TodaysFlights: React.FC<TodaysFlightsProps> = ({ flights }) => {
  const statusConfig = {
    scheduled: { label: 'On Time', variant: 'success' as const },
    delayed: { label: 'Delayed', variant: 'warning' as const },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const },
  };
  
  if (flights.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Plane className="h-5 w-5 text-slate-700" strokeWidth={2} />
              Today's Departures
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {flights.length} flights
            </span>
          </div>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 mb-4">
              <Plane className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-500 font-medium">No departures scheduled for today</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <Plane className="h-5 w-5 text-slate-700" strokeWidth={2} />
            Today's Departures
          </h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {flights.length} flights
          </span>
        </div>
        <div className="space-y-3">
          {flights.map((flight, idx) => {
            const status = statusConfig[flight.status] || statusConfig.scheduled;
            return (
              <div key={idx} className="group rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white px-3.5 py-2.5 text-xs font-bold shadow-md">
                      <div className="text-sm">{flight.time}</div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{flight.traveler}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {flight.from} → {flight.destination}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status.variant} className="font-semibold">{status.label}</Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-mono font-medium">{flight.flight_number} • {flight.code}</span>
                  <Button size="sm" variant="ghost" className="text-xs font-semibold">
                    View Details <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

