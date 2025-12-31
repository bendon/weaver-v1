import Sidebar from '@/v2/components/Sidebar'
import '@/v2/styles/globals.css'

export default function DMCLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
