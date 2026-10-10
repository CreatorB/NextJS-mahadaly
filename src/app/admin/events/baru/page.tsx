import Link from 'next/link'
import { EventForm } from '../EventForm'

export const metadata = { title: 'Event Baru — Admin' }

export default function NewEventPage() {
  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div>
        <Link href="/admin/events" className="text-sm text-gray-500 hover:text-brand-primary">← Event</Link>
        <h1 className="text-2xl font-bold text-brand-primary">Event Baru</h1>
      </div>
      <EventForm
        initial={{
          title: '', slug: '', content: '', images: [], startDate: '', endDate: '', registrationStart: '', registrationEnd: '',
          isPaid: false, price: '0', hasAttendance: true, hasCertificate: false, status: 'draft',
          groupIkhwan: '', groupAkhwat: '', groupPublic: '', quotaIkhwan: '', quotaAkhwat: '', autoAccept: true,
        }}
      />
    </div>
  )
}
