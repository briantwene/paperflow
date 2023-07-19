import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex h-screen font-poppins">
      <Navigation />
      <div className="w-full overflow-auto">
        {" "}
        <Outlet />
      </div>

      {/* <TanStackRouterDevtools /> */}
    </div>
  );
}

export default App
