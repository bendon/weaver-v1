'use client'

export default function TravelersPage() {
  const travelers = [
    {
      name: 'John Smith',
      phone: '+44 7911 234567',
      trips: 3,
      bookingCode: 'ABC123',
      status: 'active'
    },
    {
      name: 'Michael Johnson',
      phone: '+1 555 123 4567',
      trips: 1,
      bookingCode: 'DEF456',
      status: 'upcoming'
    },
    {
      name: 'Jane Chen',
      phone: '+86 139 1234 5678',
      trips: 2,
      bookingCode: 'GHI789',
      status: null
    }
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1>Travelers</h1>
              <p className="text-secondary mt-1">Your traveler directory</p>
            </div>
            <button className="btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Traveler
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="card p-4 mb-6">
          <input type="text" placeholder="Search travelers by name, email, or phone..." className="input-field w-full" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {travelers.map((traveler) => (
            <div key={traveler.name} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-subtle rounded-full flex items-center justify-center font-medium">
                    {getInitials(traveler.name)}
                  </div>
                  <div>
                    <h3 className="font-medium text-base" style={{ fontFamily: "'Geist', sans-serif" }}>
                      {traveler.name}
                    </h3>
                    <p className="text-sm text-secondary">{traveler.phone}</p>
                  </div>
                </div>
                {traveler.status && (
                  <span className={`badge ${traveler.status === 'active' ? 'badge-active' : 'badge-upcoming'}`}>
                    {traveler.status === 'active' ? 'Active' : 'Upcoming'}
                  </span>
                )}
              </div>
              <div className="pt-4 border-t border-default flex justify-between text-sm">
                <span className="text-tertiary">{traveler.trips} trips</span>
                <span className="font-mono">{traveler.bookingCode}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 btn-secondary px-3 py-2 rounded-lg text-sm">View</button>
                <button className="flex-1 btn-primary px-3 py-2 rounded-lg text-sm">Message</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
