'use client'

export default function AutomationPage() {
  const preTripAutomations = [
    { title: 'Welcome Message', description: 'Sent after booking is confirmed', enabled: true },
    { title: 'Document Reminder', description: '14 days before departure', enabled: true },
    { title: 'Packing Tips', description: '7 days before departure', enabled: true },
    { title: 'Flight Reminder', description: '24 hours before departure', enabled: true }
  ]

  const duringTripAutomations = [
    { title: 'Daily Check-in', description: 'Morning message with today\'s schedule', enabled: true },
    { title: 'Flight Alerts', description: 'Automatic delay/cancellation notifications', enabled: true }
  ]

  const postTripAutomations = [
    { title: 'Welcome Home', description: 'Thank you message on return', enabled: true },
    { title: 'Review Request', description: '7 days after return', enabled: false }
  ]

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1>Automation</h1>
              <p className="text-secondary mt-1">Configure automated traveler messages</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-secondary">Master Switch</span>
              <button className="w-12 h-6 bg-black rounded-full relative">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Pre-Trip */}
            <div className="card">
              <div className="px-5 py-4 border-b border-default">
                <h3 className="text-lg">Pre-Trip Messages</h3>
              </div>
              <div className="divide-y divide-default">
                {preTripAutomations.map((auto, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>{auto.title}</div>
                      <div className="text-sm text-secondary">{auto.description}</div>
                    </div>
                    <button className={`w-10 h-5 rounded-full relative ${auto.enabled ? 'bg-black' : 'border-2'}`}>
                      <span className={`absolute ${auto.enabled ? 'right-0.5 top-0.5 w-4 h-4 bg-white' : 'left-0.5 top-0.5 w-4 h-4 bg-black/20'} rounded-full`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* During Trip */}
            <div className="card">
              <div className="px-5 py-4 border-b border-default">
                <h3 className="text-lg">During Trip</h3>
              </div>
              <div className="divide-y divide-default">
                {duringTripAutomations.map((auto, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>{auto.title}</div>
                      <div className="text-sm text-secondary">{auto.description}</div>
                    </div>
                    <button className={`w-10 h-5 rounded-full relative ${auto.enabled ? 'bg-black' : 'border-2'}`}>
                      <span className={`absolute ${auto.enabled ? 'right-0.5 top-0.5 w-4 h-4 bg-white' : 'left-0.5 top-0.5 w-4 h-4 bg-black/20'} rounded-full`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Trip */}
            <div className="card">
              <div className="px-5 py-4 border-b border-default">
                <h3 className="text-lg">Post-Trip</h3>
              </div>
              <div className="divide-y divide-default">
                {postTripAutomations.map((auto, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>{auto.title}</div>
                      <div className="text-sm text-secondary">{auto.description}</div>
                    </div>
                    <button className={`w-10 h-5 rounded-full relative ${auto.enabled ? 'bg-black' : 'border-2'}`}>
                      <span className={`absolute ${auto.enabled ? 'right-0.5 top-0.5 w-4 h-4 bg-white' : 'left-0.5 top-0.5 w-4 h-4 bg-black/20'} rounded-full`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-medium mb-4" style={{ fontFamily: "'Geist', sans-serif" }}>Quiet Hours</h3>
              <div className="flex items-center gap-3">
                <input type="time" defaultValue="22:00" className="input-field" />
                <span className="text-secondary">to</span>
                <input type="time" defaultValue="07:00" className="input-field" />
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span>Bypass for urgent alerts</span>
              </label>
            </div>

            <div className="card p-5">
              <h3 className="font-medium mb-4" style={{ fontFamily: "'Geist', sans-serif" }}>Tone & Style</h3>
              <select className="input-field w-full">
                <option>Friendly</option>
                <option>Formal</option>
                <option>Casual</option>
              </select>
              <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span>Use emojis</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
