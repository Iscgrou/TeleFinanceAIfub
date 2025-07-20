export default function DebugPortal({ username }: { username: string }) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Portal</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <h2 className="font-semibold">URL Information:</h2>
            <p>Username from URL: <code>{username}</code></p>
            <p>Current URL: <code>{window.location.href}</code></p>
            <p>Origin: <code>{window.location.origin}</code></p>
            <p>Pathname: <code>{window.location.pathname}</code></p>
          </div>
          
          <div className="p-4 bg-green-50 rounded">
            <h2 className="font-semibold">Browser Information:</h2>
            <p>User Agent: <code>{navigator.userAgent}</code></p>
            <p>Language: <code>{navigator.language}</code></p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded">
            <h2 className="font-semibold">API Test:</h2>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch(`/api/representatives/by-username/${username}`);
                  const data = await response.json();
                  alert(JSON.stringify(data, null, 2));
                } catch (err) {
                  alert(`Error: ${err}`);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test API Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}