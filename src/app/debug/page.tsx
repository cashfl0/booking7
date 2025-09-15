'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [serverSession, setServerSession] = useState(null)

  useEffect(() => {
    // Fetch session from server
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setServerSession(data))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Client Session Status:</h2>
          <p>Status: {status}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Client Session Data:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Server Session Data:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(serverSession, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}