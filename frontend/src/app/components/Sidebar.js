"use client"
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  LucidePackage,
  Codesandbox,
  CalculatorIcon,
  MenuIcon,
  XIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getCookie } from 'cookies-next';
import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const token = getCookie('Token');
    if (!token) {
      router.push('/pages/Login');
    }
  }, []);

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/pages/Dashboard' },
    { label: 'Regular Expenses', icon: <LucidePackage size={20} />, href: '/pages/Expenses' },
    { label: 'Budget Plan', icon: <CalculatorIcon size={20} />, href: '/pages/Budget' },
    { label: 'Recurring Expenses', icon: <Codesandbox size={20} />, href: '/pages/RecurringBills' },
  ];

  const handleLogoutFunctionality = async () => {
    try {
       await axios.post(
          `${API_BASE_URL}/user/logout`,
          {},
          { 
             withCredentials: true,
             headers: {
                'Authorization': `Bearer ${getCookie('Token')}`
             }
          }
       );
 
       // Clear cookie
       document.cookie = "Token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
       
       // Clear authorization header
       delete axios.defaults.headers.common['Authorization'];
 
       router.push("/pages/Login");
    } catch (err) {
       console.error("Logout error:", err);
       // Clear everything even if logout fails
       document.cookie = "Token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
       delete axios.defaults.headers.common['Authorization'];
       router.push("/pages/Login");
    }
 };

  return (
    <>
      {/* Mobile Menu Trigger Container */}
      {!open && (
        <div className="md:hidden fixed top-0 left-0 h-screen w-16 bg-primary flex items-start justify-center z-50">
          <button
            className="mt-4 text-white"
            onClick={() => setOpen(true)}
          >
            <MenuIcon size={24} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-54 bg-primary shadow-xl transform transition-transform duration-300 ease-in-out z-40
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative lg:w-[15%]`}
      >
        {/* Close button for mobile */}
        <button
          className="md:hidden absolute top-4 right-4 text-white"
          onClick={() => setOpen(false)}
        >
          <XIcon size={24} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mt-6 md:mt-10">
          <Image
            src="/Logo.png"
            width={60}
            height={60}
            alt="Logo"
            className="w-20 lg:w-24 rounded-2xl"
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="mt-20">
          <ul>
            {menuItems.map(item => (
              <li key={item.label}>
                <Link href={item.href}>
                  <div
                    className="flex ml-5 items-center gap-2 text-white my-5 py-2 px-3 rounded-lg hover:bg-white hover:text-primary transition-colors cursor-pointer"
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className='absolute bottom-5 right-5'>
          <button 
            className='bg-white font-serif tracking-wide text-primary font-bold px-7 py-2 rounded-xl hover:scale-95 hover:cursor-pointer transition-transform duration-200' 
            onClick={handleLogoutFunctionality}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}