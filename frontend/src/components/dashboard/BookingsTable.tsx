import React from 'react';
import { Eye, Send, MoreHorizontal, MapPin, ArrowRight } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

interface Booking {
  id: string;
  code: string;
  title: string;
  traveler: string;
  travelers: number;
  start: string;
  end: string;
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  price: number;
  currency?: string;
  destination: string;
}

interface BookingsTableProps {
  bookings: Booking[];
  onView?: (bookingId: string) => void;
  onSend?: (bookingId: string) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const BookingsTable: React.FC<BookingsTableProps> = ({ bookings, onView, onSend }) => {
  const statusConfig = {
    draft: { label: 'Draft', variant: 'secondary' as const },
    confirmed: { label: 'Confirmed', variant: 'default' as const },
    active: { label: 'Active', variant: 'success' as const },
    completed: { label: 'Completed', variant: 'secondary' as const },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const },
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trip Details</div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Traveler</div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Travel Dates</div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</div>
              </th>
              <th className="px-6 py-4 text-right">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => {
              const status = statusConfig[booking.status] || statusConfig.draft;
              const days = Math.ceil((new Date(booking.end).getTime() - new Date(booking.start).getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-black">{booking.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-black">{booking.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {booking.destination}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-black">{booking.traveler}</p>
                      {booking.travelers > 1 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          +{booking.travelers - 1} more traveler{booking.travelers > 2 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-black font-medium">{formatDate(booking.start)}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-black font-medium">{formatDate(booking.end)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{days} days</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-black">
                      {booking.currency ? 
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency }).format(booking.price) :
                        formatCurrency(booking.price)
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{booking.currency || 'USD'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => onView?.(booking.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {booking.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onSend?.(booking.id)}
                        >
                          <Send className="h-4 w-4" />
                          Send
                        </Button>
                      )}
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

