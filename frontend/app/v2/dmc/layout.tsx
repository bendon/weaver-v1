import Sidebar from '@/v2/components/Sidebar'
import '@/v2/styles/globals.css'

export default function DMCLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}
