import Sidebar from '@/app/components/Sidebar'
import { Bounce, ToastContainer } from 'react-toastify'


export default function DashboardLayout({ children }) {
  return (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          {/* Main content */}
          <div className="w-full lg:w-[85%] ml-14 md:ml-0 overflow-y-auto bg-gray-50 p-4">
          <ToastContainer theme="colored" transition={Bounce} position="top-right" pauseOnHover autoClose={4000}/>
              {children}
          </div>
        </div>
      
  )
}
