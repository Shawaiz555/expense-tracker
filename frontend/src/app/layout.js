import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Bounce, ToastContainer } from 'react-toastify'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Expense Tracker App',
  description: 'Connect with us to manage your expenses well.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className='w-full'>
          <ToastContainer theme="colored" transition={Bounce} position="top-right" pauseOnHover autoClose={4000}/>
              {children}
          </div>
      </body>
    </html>
  )
}
