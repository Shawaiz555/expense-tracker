"use client";
import axios from 'axios';
import Cards from '@/app/components/Cards'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

import {
   Chart as ChartJS,
   PointElement,
   LinearScale,
   ArcElement,
   Title,
   Tooltip,
   Legend,
   CategoryScale,
   LineElement,
} from 'chart.js';

import { Pie, Scatter, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale,
   LinearScale,
   PointElement,
   LineElement,
   Title,
   Tooltip,
   Legend);
ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = 'http://localhost:5000';

export default function Dashboard() {
   const router = useRouter();
   const [selectedRegularCategory, setSelectedRegularCategory] = useState('All');
   const [selectedRecurringCategory, setSelectedRecurringCategory] = useState('All');
   const [recurringExpenses, setRecurringExpenses] = useState([]);
   const [expenses, setExpenses] = useState([]);
   const [scatterData, setScatterData] = useState({ datasets: [] });
   const [pieData, setPieData] = useState({ labels: [], datasets: [{ data: [], backgroundColor: [] }] });

   const [isMobile, setIsMobile] = useState(false);

   useEffect(() => {
      const checkMobile = () => {
         setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
   }, []);

   const makeRequest = async (method, endpoint, data = null) => {
      const token = getCookie('Token');
      try {
         const response = await axios({
            method,
            url: `${API_BASE_URL}${endpoint}`,
            data,
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            withCredentials: true
         });
         return response.data;
      } catch (error) {
         if (error.response?.status === 401) {
            console.error("Authentication error:", error);
            router.push('/pages/Login');
         }
         throw error;
      }
   };

   useEffect(() => {
      const token = getCookie('Token');
      if (!token) {
         router.push('/pages/Login');
         return;
      }

      const fetchData = async () => {
         try {
            const regularRes = await makeRequest('get', '/regularExpense/getAllRegularExpenses');
            const regularExpenses = regularRes.allRegularExpenses || [];
            setExpenses(regularExpenses);

            const recurringRes = await makeRequest('get', '/recurringExpense/getAllRecurringExpenses');
            const recurringExpenses = recurringRes.allRecurringExpenses || [];
            setRecurringExpenses(recurringExpenses);
            prepareScatterData(regularExpenses);
            preparePieData(regularExpenses);
         } catch (error) {
            console.error("Failed to fetch data:", error);
         }
      };

      fetchData();
   }, []);

   const prepareScatterData = (expenses) => {
      if (!expenses.length) return;

      const dailyData = groupExpensesByTimeframe(expenses, 'day');
      const weeklyData = groupExpensesByTimeframe(expenses, 'week');
      const monthlyData = groupExpensesByTimeframe(expenses, 'month');
      const yearlyData = groupExpensesByTimeframe(expenses, 'year');

      setScatterData({
         datasets: [
            {
               label: 'Daily',
               data: convertToScatterPoints(dailyData),
               backgroundColor: 'rgba(255, 99, 132, 1)',
            },
            {
               label: 'Weekly',
               data: convertToScatterPoints(weeklyData),
               backgroundColor: 'rgba(54, 162, 235, 1)',
            },
            {
               label: 'Monthly',
               data: convertToScatterPoints(monthlyData),
               backgroundColor: 'rgba(255, 206, 86, 1)',
            },
            {
               label: 'Yearly',
               data: convertToScatterPoints(yearlyData),
               backgroundColor: 'rgba(75, 192, 192, 1)',
            },
         ],
      });
   };

   const groupExpensesByTimeframe = (expenses, timeframe) => {
      const groups = {};

      expenses.forEach(expense => {
         const date = new Date(expense.date);
         let key;

         switch (timeframe) {
            case 'day':
               key = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
               break;
            case 'week':
               const weekNumber = Math.ceil((date.getDate()) / 7);
               key = `Week ${weekNumber}, ${date.getMonth() + 1}/${date.getFullYear()}`;
               break;
            case 'month':
               key = `${date.getMonth() + 1}/${date.getFullYear()}`;
               break;
            case 'year':
               key = `${date.getFullYear()}`;
               break;
            default:
               key = expense.date;
         }

         if (!groups[key]) {
            groups[key] = 0;
         }

         groups[key] += Number(expense.amount);
      });

      return groups;
   };

   const convertToScatterPoints = (groupedData) => {
      return Object.keys(groupedData).map((key, index) => ({
         x: index + 1,
         y: groupedData[key]
      }));
   };

   const preparePieData = (expenses) => {
      if (!expenses.length) return;

      const categoryGroups = {};

      expenses.forEach(expense => {
         if (!categoryGroups[expense.category]) {
            categoryGroups[expense.category] = 0;
         }
         categoryGroups[expense.category] += Number(expense.amount);
      });

      const backgroundColors = [
         'rgba(255, 99, 132, 0.6)',
         'rgba(54, 162, 235, 0.6)',
         'rgba(255, 206, 86, 0.6)',
         'rgba(75, 192, 192, 0.6)',
         'rgba(153, 102, 255, 0.6)',
         'rgba(255, 159, 64, 0.6)',
         'rgba(199, 199, 199, 0.6)',
         'rgba(83, 102, 255, 0.6)',
      ];

      const categories = Object.keys(categoryGroups);
      const amounts = categories.map(cat => categoryGroups[cat]);

      setPieData({
         labels: categories,
         datasets: [
            {
               label: 'Expenses',
               data: amounts,
               backgroundColor: backgroundColors.slice(0, categories.length),
               borderWidth: 1,
            },
         ],
      });
   };

   const scatterOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
         legend: {
            position: 'bottom',
            labels: {
               boxWidth: 10,
               padding: 10,
               font: {
                  size: isMobile ? 10 : 12
               }
            }
         },
         title: {
            display: true,
            text: 'Expenses Overview',
            font: {
               size: isMobile ? 14 : 16
            }
         }
      },
      scales: {
         x: {
            title: {
               display: true,
               text: 'Time Period',
               font: {
                  size: isMobile ? 10 : 12
               }
            },
            ticks: {
               font: {
                  size: isMobile ? 8 : 10
               }
            }
         },
         y: {
            title: {
               display: true,
               text: 'Amount ($)',
               font: {
                  size: isMobile ? 10 : 12
               }
            },
            ticks: {
               font: {
                  size: isMobile ? 8 : 10
               }
            }
         }
      }
   };

   const pieOptions = {
      responsive: true,
      plugins: {
         legend: {
            position: 'bottom',
         },
      },
   };

   return (
      <div className='w-full h-screen'>
         <div>
            <Cards />
         </div>
         <div className="w-full h-full px-2 md:px-7 mt-8">
            <div className='w-full flex flex-col justify-center gap-10 lg:gap-2 lg:flex-row mt-10'>
               <div className="w-full h-[300px] md:h-[450px] bg-gray-150 border border-gray-300 flex justify-center lg:w-[60%] py-5 lg:p-4 lg:py-10 rounded-xl shadow-xl">
                  <Scatter data={scatterData} options={scatterOptions} />                  
               </div>
               <div className='w-full lg:w-[40%] flex justify-center'>
                  <Pie data={pieData} options={pieOptions} />
               </div>
            </div>

            <div className="w-full flex flex-col lg:flex-row gap-5 py-14">
               {/* Regular Expenses */}
               <div className="w-full lg:w-1/2">
                  <div className="rounded-3xl shadow-lg p-5">
                     <div className="flex justify-between items-center mb-5">
                        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-primary">Regular Expenses</h1>
                        <select
                           value={selectedRegularCategory}
                           onChange={(e) => setSelectedRegularCategory(e.target.value)}
                           className="w-[40%] px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                           <option value="All">All Categories</option>
                           {[...new Set(expenses.map(exp => exp.category))].map((cat, index) => (
                              <option key={index} value={cat}>{cat}</option>
                           ))}
                        </select>
                     </div>

                     <div className="w-full overflow-x-auto custom-scroll">
                        <div className="min-w-[950px]">
                           <table className="w-full border border-gray-200 text-center rounded-xl">
                              <thead className="bg-primary text-white">
                                 <tr>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">ID</th>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">Category</th>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">Amount</th>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">Date</th>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">Description</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 <AnimatePresence>
                                    {expenses
                                       .filter(item => selectedRegularCategory === 'All' || item.category === selectedRegularCategory)
                                       .map((item, index) => (
                                          <motion.tr
                                             key={item.category + item.date + item.amount + index}
                                             initial={{ opacity: 0, y: 10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             exit={{ opacity: 0, y: 10 }}
                                             transition={{ duration: 0.3 }}
                                             className="hover:bg-gray-50 border-t border-gray-200"
                                          >
                                             <td className="px-6 py-4 text-gray-800 text-sm">{index + 1}</td>
                                             <td className="px-6 py-4 text-gray-800 text-sm">{item.category}</td>
                                             <td className="px-6 py-4 text-green-600 font-semibold text-sm">${item.amount}</td>
                                             <td className="px-6 py-4 text-gray-800 text-sm">{new Date(item.date).toLocaleDateString()}</td>
                                             <td className="px-6 py-4 text-gray-700 text-sm text-left max-w-[250px]">{item.description}</td>
                                          </motion.tr>
                                       ))}
                                 </AnimatePresence>
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Recurring Expenses */}
               <div className="w-full lg:w-1/2">
                  <div className="rounded-3xl shadow-lg p-5">
                     <div className="flex justify-between items-center mb-5">
                        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-primary">Recurring Expenses</h1>
                        <select
                           value={selectedRecurringCategory}
                           onChange={(e) => setSelectedRecurringCategory(e.target.value)}
                           className="w-[40%] px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                           <option value="All">All Categories</option>
                           {[...new Set(recurringExpenses.map(exp => exp.category))].map((cat, index) => (
                              <option key={index} value={cat}>{cat}</option>
                           ))}
                        </select>
                     </div>

                     <div className="w-full overflow-x-auto custom-scroll">
                        <div className="min-w-[750px]">
                           <table className="w-full border border-gray-200 bg-white text-center rounded-xl">
                              <thead className="bg-primary text-white">
                                 <tr>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">ID</th>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">Category</th>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">Amount</th>
                                    <th className="px-6 py-3 text-md font-bold whitespace-nowrap">Date</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 <AnimatePresence>
                                    {recurringExpenses
                                       .filter(item => selectedRecurringCategory === 'All' || item.category === selectedRecurringCategory)
                                       .map((item, index) => (
                                          <motion.tr
                                             key={item.category + item.date + item.amount + index}
                                             initial={{ opacity: 0, y: 10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             exit={{ opacity: 0, y: 10 }}
                                             transition={{ duration: 0.3 }}
                                             className="hover:bg-gray-50 border-t border-gray-200"
                                          >
                                             <td className="px-6 py-4 text-gray-800 text-sm">{index + 1}</td>
                                             <td className="px-6 py-4 text-gray-800 text-sm">{item.category}</td>
                                             <td className="px-6 py-4 text-green-600 font-semibold text-sm">${item.amount}</td>
                                             <td className="px-6 py-4 text-gray-800 text-sm">{new Date(item.nextDueDate).toLocaleDateString()}</td>
                                          </motion.tr>
                                       ))}
                                 </AnimatePresence>
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

