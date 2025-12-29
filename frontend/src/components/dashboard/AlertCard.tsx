import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface Alert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  booking_code: string;
}

interface AlertCardProps {
  alerts: Alert[];
}

export const AlertCard: React.FC<AlertCardProps> = ({ alerts }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <div className="relative">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
          </div>
          Alerts & Notifications
        </h3>
        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          {alerts.length} active
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="group rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className={cn(
                'rounded-xl p-2.5 flex-shrink-0 shadow-sm',
                alert.severity === 'high' ? 'bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200' : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'
              )}>
                <AlertCircle className={cn(
                  'h-4 w-4',
                  alert.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                )} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                  <Badge variant="outline" className="text-xs flex-shrink-0 font-mono bg-slate-50 border-slate-200 text-slate-700">
                    {alert.booking_code}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{alert.message}</p>
                <Button size="sm" variant="default" className="text-xs font-semibold">
                  Take Action <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

