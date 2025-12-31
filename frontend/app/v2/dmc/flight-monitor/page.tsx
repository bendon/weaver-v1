'use client'

export default function FlightMonitorPage() {
  const flights = [
    {
      flight: 'KQ101',
      airline: 'Kenya Airways',
      booking: 'ABC123',
      traveler: 'Smith Family',
      route: 'LHR → NBO',
      date: 'Mar 15',
      scheduled: '21:15',
      terminal: 'Terminal 4',
      status: 'on-time',
      gate: 'B32'
    },
    {
      flight: 'KQ100',
      airline: 'Kenya Airways',
      booking: 'ABC123',
      traveler: 'Smith Family',
      route: 'NBO → LHR',
      date: 'Mar 22',
      scheduled: '23:55',
      actual: '01:55 +1',
      terminal: null,
      status: 'delayed',
      delay: '2h',
      gate: '—'
    },
    {
      flight: 'ET302',
      airline: 'Ethiopian',
      booking: 'DEF456',
      traveler: 'Johnson Family',
      route: 'JFK → JRO',
      date: 'Mar 28',
      scheduled: '22:00',
      terminal: 'Terminal 1',
      status: 'on-time',
      gate: '—'
    }
  ]

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1>Flight Monitor</h1>
              <p className="text-secondary mt-1">Real-time flight tracking</p>
            </div>
            <span className="text-sm text-tertiary">Last updated: 2 mins ago</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-sm text-secondary">Monitored</div>
            <div className="text-3xl font-semibold mt-2" style={{ fontFamily: "'EB Garamond', serif" }}>12</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-secondary">On Time</div>
            <div className="text-3xl font-semibold mt-2" style={{ fontFamily: "'EB Garamond', serif" }}>9</div>
          </div>
          <div className="card p-5 bg-subtle">
            <div className="text-sm text-secondary">Delayed</div>
            <div className="text-3xl font-semibold mt-2" style={{ fontFamily: "'EB Garamond', serif" }}>2</div>
          </div>
          <div className="card p-5 bg-black text-white">
            <div className="text-sm opacity-70">Cancelled</div>
            <div className="text-3xl font-semibold mt-2" style={{ fontFamily: "'EB Garamond', serif" }}>1</div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default bg-subtle">
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Flight</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Booking</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Route</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Scheduled</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {flights.map((flight, idx) => (
                <tr key={idx} className={`table-row ${flight.status === 'delayed' ? 'bg-subtle' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="font-medium">{flight.flight}</div>
                    <div className="text-sm text-tertiary">{flight.airline}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono">{flight.booking}</span>
                    <div className="text-sm text-tertiary">{flight.traveler}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{flight.route}</div>
                    <div className="text-sm text-tertiary">{flight.date}</div>
                  </td>
                  <td className="px-5 py-4">
                    {flight.actual ? (
                      <>
                        <span className="font-mono line-through">{flight.scheduled}</span>
                        <div className="text-sm font-medium">{flight.actual}</div>
                      </>
                    ) : (
                      <>
                        <span className="font-mono">{flight.scheduled}</span>
                        {flight.terminal && (
                          <div className="text-sm text-tertiary">{flight.terminal}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${flight.status === 'delayed' ? 'badge-alert' : 'badge-active'}`}>
                      {flight.status === 'delayed' ? `Delayed ${flight.delay}` : 'On Time'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono">{flight.gate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
