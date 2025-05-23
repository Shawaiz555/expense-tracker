"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

export default function page() {
   const [loginFormData, setLoginFormData] = useState({
      email: "",
      password: "",
   });

   const router = useRouter();

   const handleSubmit = async (e) => {
      e.preventDefault();
   
      try {
         const response = await axios.post(
            `${API_BASE_URL}/user/login`, 
            loginFormData, 
            { 
               withCredentials: true,
               headers: {
                  'Content-Type': 'application/json'
               }
            }
         );
   
         if (response.data.status === 'Success') {
            // Store token if it's in the response
            if (response.data.token) {
               document.cookie = `Token=${response.data.token}; path=/`;
               // Set default authorization header for future requests
               axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            }
   
            toast.success('User logged in Successfully...!');
            setLoginFormData({ email: "", password: "" });
            router.push('/pages/Dashboard');
         }
      } catch (err) {
         if (err.response?.data?.message) {
            toast.error(err.response.data.message);
         } else {
            toast.error('Something went wrong!');
         }
         console.error('Login error:', err);
      }
   };
   
   

   const handleSignupRouting = () => {
      router.push("/pages/Signup");
   }
   return (
      <div className='w-full bg-gray-200 flex justify-center'>
         <div className='w-[90%] lg:w-[60%] flex shadow-2xl my-20 rounded-3xl'>
            <div className='hidden md:block md:w-[50%] h-full bg-primary rounded-tl-3xl rounded-bl-3xl'>
               <h1 className='md:text-4xl mt-60 text-center text-white italic font-bold'>Welcome To our</h1>
               <h1 className='md:text-4xl text-center text-white font-bold italic'>Expense Tracker App</h1>
            </div>
            <div className='w-full md:w-[50%] bg-white py-30 px-10 rounded-tr-3xl rounded-br-3xl'>
               <h1 className='text-3xl sm:text-4xl lg:text-[38px] text-primary font-bold text-center mb-10 italic'>Login Form</h1>
               <form onSubmit={handleSubmit}>
                  <label htmlFor="SignupEmail" className='text-gray-500 font-semibold'>Email:</label><br />
                  <input type="email" name='email' value={loginFormData.email} onChange={(e) => setLoginFormData({ ...loginFormData, email: e.target.value })} placeholder='Enter your Email...' className='w-full text-gray-500 rounded-lg border border-gray-300 mt-2 py-2 px-2' required /><br /><br />
                  <label htmlFor="SignupPassword" className='text-gray-500 font-semibold'>Password:</label><br />
                  <input type="password" name='password' value={loginFormData.password} onChange={(e) => setLoginFormData({ ...loginFormData, password: e.target.value })} placeholder='Enter your Password...' className='w-full text-gray-500 rounded-lg border border-gray-300 mt-2 py-2 px-2' required /><br /><br />
                  <div className='flex justify-center'>
                     <button type='submit' className='bg-primary px-7 py-2 italic rounded-xl text-white font-bold tracking-wider hover:scale-95 hover:transition-all hover:cursor-pointer'>Login</button>
                  </div>
               </form>
               <div className='mt-5 text-center'>
                  <p className='text-gray-400'>Don't have an account? Signup form here <button className='text-primary font-bold hover:scale-95 hover:cursor-pointer' onClick={handleSignupRouting}>Signup</button></p>
               </div>
            </div>
         </div>
      </div>
   )
}
