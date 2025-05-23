"use client";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

export default function page() {
   const [signupFormData, setSignupFormData] = useState({
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
   });

   const router = useRouter();

   const handleSubmit = async (e) => {
      e.preventDefault();
   
      try {
         if (signupFormData.password === signupFormData.confirmPassword) {
            const response = await axios.post(`${API_BASE_URL}/user/signup`, signupFormData);
   
            if (response.data.status === 'Success') {
               toast.success("User Added Successfully!!");
               setSignupFormData({ name: "", email: "", password: "", confirmPassword: "" });
               router.push("/pages/Login");
            }
         } else {
            toast.error("Password and Confirm password should be same...!!");
         }
      } 
      catch (err) {
         if (err.response && err.response.data && err.response.data.message) {
            toast.error(err.response.data.message);
         } 
         else 
         {
            toast.error("Something went wrong!");
         }
         console.error(err);
      }
   }
   

   const handleLoginRouting = () => {
      router.push("/pages/Login");
   }

   return (
      <div className='w-full bg-gray-200 flex justify-center'>
         <div className='w-[90%] lg:w-[65%] flex shadow-2xl my-15 rounded-3xl'>
            <div className='hidden md:block md:w-[50%] h-full bg-primary rounded-tl-3xl rounded-bl-3xl'>
               <h1 className='md:text-4xl mt-74 text-center text-white font-bold italic'>Welcome To our</h1>
               <h1 className='md:text-4xl text-center text-white font-bold italic'>Expense Tracker App</h1>
            </div>
            <div className='w-full md:w-[50%] bg-white py-24 px-10 rounded-tr-3xl rounded-br-3xl'>
               <h1 className='text-3xl sm:text-4xl lg:text-[38px] text-primary font-bold text-center mb-10 italic'>Sign Up Form</h1>
               <form onSubmit={handleSubmit}>
                  <label htmlFor="SignupName" className='text-gray-500 font-semibold'>Name:</label><br />
                  <input type="text" name='name' value={signupFormData.name} onChange={(e) => setSignupFormData({ ...signupFormData, name: e.target.value })} placeholder='Enter your Name...' className='w-full text-gray-500 rounded-lg border border-gray-300 mt-2 py-2 px-2' required /><br /><br />
                  <label htmlFor="SignupEmail" className='text-gray-500 font-semibold'>Email:</label><br />
                  <input type="email" name='email' value={signupFormData.email} onChange={(e) => setSignupFormData({ ...signupFormData, email: e.target.value })} placeholder='Enter your Email...' className='w-full text-gray-500 rounded-lg border border-gray-300 mt-2 py-2 px-2' required /><br /><br />
                  <label htmlFor="SignupPassword" className='text-gray-500 font-semibold'>Password:</label><br />
                  <input type="password" name='password' value={signupFormData.password} onChange={(e) => setSignupFormData({ ...signupFormData, password: e.target.value })} placeholder='Enter your Password...' className='w-full text-gray-500 rounded-lg border border-gray-300 mt-2 py-2 px-2' required /><br /><br />
                  <label htmlFor="SignupConfirmPassword" className='text-gray-500 font-semibold'>Confirm Password:</label><br />
                  <input type="password" name='confirmPassword' value={signupFormData.confirmPassword} onChange={(e) => setSignupFormData({ ...signupFormData, confirmPassword: e.target.value })} placeholder='Enter your Confirm Password...' className='w-full text-gray-500 rounded-lg border border-gray-300 mt-2 py-2 px-2' required /><br /><br />
                  <div className='flex justify-center'>
                     <button type='submit' className='bg-primary px-7 py-2 rounded-xl text-white italic font-bold tracking-wider hover:scale-95 hover:transition-all hover:cursor-pointer'>Signup</button>
                  </div>
               </form>
               <div className='mt-5 text-center'>
                  <p className='text-gray-400'>If you already have an account Login form here <button className='text-primary font-bold hover:scale-95 hover:cursor-pointer' onClick={handleLoginRouting}>Login</button></p>
               </div>
            </div>
         </div>
      </div>
   )
}
