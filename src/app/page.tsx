export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">JogGPS AI Coaching Backend</h1>
        <p className="text-lg text-gray-600 mb-8">
          Self-hosted AI coaching API for the JogGPS running tracker app
        </p>
        
        <div className="bg-gray-100 p-6 rounded-lg mb-8 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Available Endpoints:</h2>
          <ul className="text-left space-y-2">
            <li><code className="bg-blue-100 px-2 py-1 rounded">POST /api/coaching</code> - Get AI coaching messages</li>
            <li><code className="bg-green-100 px-2 py-1 rounded">GET/POST /api/profile</code> - Manage user profiles</li>
            <li><code className="bg-purple-100 px-2 py-1 rounded">GET/POST /api/runs</code> - Log and retrieve run history</li>
            <li><code className="bg-orange-100 px-2 py-1 rounded">GET /api/health</code> - Service health check</li>
          </ul>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Version 1.0.0 • Self-hosted on Coolify</p>
          <p>Supports 30+ AI models via OpenRouter</p>
        </div>
      </div>
    </main>
  )
}