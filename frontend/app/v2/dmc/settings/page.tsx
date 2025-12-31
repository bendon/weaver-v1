'use client'

export default function SettingsPage() {
  const teamMembers = [
    { name: 'John Mwangi', email: 'admin@safaridreams.co.ke', role: 'Admin', initials: 'JM' },
    { name: 'Sarah Kimani', email: 'sarah@safaridreams.co.ke', role: 'Agent', initials: 'SK' }
  ]

  const integrations = [
    { name: 'WhatsApp Business', provider: '360dialog', status: 'connected' },
    { name: 'Amadeus GDS', provider: 'Flight search & booking', status: 'connected' }
  ]

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <h1>Settings</h1>
          <p className="text-secondary mt-1">Organization and account settings</p>
        </div>
      </div>

      <div className="p-8 max-w-3xl">
        {/* Organization */}
        <div className="card mb-6">
          <div className="px-5 py-4 border-b border-default">
            <h3 className="text-lg">Organization</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-subtle rounded-xl flex items-center justify-center text-xl font-semibold">SD</div>
              <button className="btn-secondary px-4 py-2 rounded-lg text-sm">Upload Logo</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary">Organization Name</label>
                <input type="text" defaultValue="Safari Dreams Kenya" className="input-field w-full mt-1" />
              </div>
              <div>
                <label className="text-sm text-secondary">Country</label>
                <input type="text" defaultValue="Kenya" className="input-field w-full mt-1" />
              </div>
              <div>
                <label className="text-sm text-secondary">Phone</label>
                <input type="text" defaultValue="+254 722 123 456" className="input-field w-full mt-1" />
              </div>
              <div>
                <label className="text-sm text-secondary">Email</label>
                <input type="text" defaultValue="info@safaridreams.co.ke" className="input-field w-full mt-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="card mb-6">
          <div className="px-5 py-4 border-b border-default flex items-center justify-between">
            <h3 className="text-lg">Team Members</h3>
            <button className="text-sm font-medium">+ Invite</button>
          </div>
          <div className="divide-y divide-default">
            {teamMembers.map((member) => (
              <div key={member.email} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    member.role === 'Admin' ? 'bg-black text-white' : 'bg-subtle'
                  }`}>
                    {member.initials}
                  </div>
                  <div>
                    <div className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>{member.name}</div>
                    <div className="text-sm text-secondary">{member.email}</div>
                  </div>
                </div>
                <span className={`badge ${member.role === 'Admin' ? 'badge-completed' : 'badge-active'}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="card mb-6">
          <div className="px-5 py-4 border-b border-default">
            <h3 className="text-lg">Integrations</h3>
          </div>
          <div className="divide-y divide-default">
            {integrations.map((integration) => (
              <div key={integration.name} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-subtle rounded-lg flex items-center justify-center">
                    {integration.name === 'WhatsApp Business' ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>{integration.name}</div>
                    <div className="text-sm text-secondary">{integration.provider}</div>
                  </div>
                </div>
                <span className="badge badge-active">Connected</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="card">
          <div className="px-5 py-4 border-b border-default">
            <h3 className="text-lg">Subscription</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>Professional Plan</div>
                <div className="text-sm text-secondary">$149/month · 150 bookings · 5 users</div>
              </div>
              <button className="btn-primary px-4 py-2 rounded-lg text-sm">Upgrade</button>
            </div>
            <div className="p-4 bg-subtle rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Bookings this month</span>
                <span className="font-mono">34 / 150</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
