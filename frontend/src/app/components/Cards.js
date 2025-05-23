"use client";
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { LucideBadgeDollarSign, Wallet, Calculator } from 'lucide-react';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:5000';

// Function to refresh data from outside the component
let refreshDataFunction = () => console.log("Refresh function not initialized yet");

export function refreshData() {
   console.log("Manual refresh triggered");
   refreshDataFunction();
}

export default function Cards() {
   const router = useRouter();
   const [totalBudget, setTotalBudget] = useState(0);
   const [remainBudget, setRemainBudget] = useState(0);
   const [totalSpent, setTotalSpent] = useState(0);
   const [totalSpentRegular, setTotalSpentRegular] = useState(0);
   const [totalSpentRecurring, setTotalSpentRecurring] = useState(0);

   // Helper function for API calls
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

   const updateCards = async () => {
      try {
         console.log("Updating cards data...");
         
         // Always calculate from source data
         const budgetRes = await makeRequest('get', '/budget/getAllBudgets');
         const budgets = budgetRes.allBudgets || [];
         const totalBudgetValue = budgets.length > 0 ? parseFloat(budgets[0].total || 0) : 0;

         const regularRes = await makeRequest('get', '/regularExpense/getAllRegularExpenses');
         const regularExpenses = regularRes.allRegularExpenses || [];

         const recurringRes = await makeRequest('get', '/recurringExpense/getAllRecurringExpenses');
         const recurringExpenses = recurringRes.allRecurringExpenses || [];

         // Calculate spent amounts
         const totalSpentRegularValue = regularExpenses.reduce((sum, exp) => 
            sum + parseFloat(exp.amount || 0), 0);
         
         // Count recurring expenses that have been paid
         const totalSpentRecurringValue = recurringExpenses.reduce((sum, exp) => {
            if (exp.lastPaid) {
               console.log(`Counting paid recurring expense: ${exp.name} - $${exp.amount}`);
               return sum + parseFloat(exp.amount || 0);
            }
            return sum;
         }, 0);

         console.log("Total recurring expenses:", totalSpentRecurringValue);
         console.log("Recurring expenses with lastPaid:", recurringExpenses.filter(exp => exp.lastPaid));

         const totalSpentValue = totalSpentRegularValue + totalSpentRecurringValue;
         const remainBudgetValue = totalBudgetValue - totalSpentValue;

         // Update states
         setTotalBudget(totalBudgetValue);
         setTotalSpent(parseFloat(totalSpentValue.toFixed(2)));
         setRemainBudget(parseFloat(remainBudgetValue.toFixed(2)));
         setTotalSpentRegular(parseFloat(totalSpentRegularValue.toFixed(2)));
         setTotalSpentRecurring(parseFloat(totalSpentRecurringValue.toFixed(2)));

         // Update the card data in the database
         const cardDataToUpdate = {
            totalSpent: totalSpentValue.toFixed(2),
            remainBudget: remainBudgetValue.toFixed(2),
            totalBudget: totalBudgetValue.toFixed(2),
            totalSpentRegular: totalSpentRegularValue.toFixed(2),
            totalSpentRecurring: totalSpentRecurringValue.toFixed(2)
         };

         // Get existing card data to check if we need to update or create
         const cardDataRes = await makeRequest('get', '/card/getCardData');
         
         if (cardDataRes && cardDataRes.allCardData && cardDataRes.allCardData.length > 0) {
            console.log("Updating existing card data");
            await makeRequest('put', '/card/updateCardData', cardDataToUpdate);
         } else {
            console.log("Creating new card data");
            await makeRequest('post', '/card/addCardData', cardDataToUpdate);
         }
      }
      catch (error) {
         console.error("Failed to fetch budget or expenses:", error);
      }
   };

   useEffect(() => {
      // Check authentication
      const token = getCookie('Token');
      if (!token) {
         router.push('/pages/Login');
         return;
      }

      // Set the refresh function for external access
      refreshDataFunction = updateCards;
      
      // Initial data fetch when component mounts
      updateCards();

      // Add event listener for the updateCards event
      const handleUpdateEvent = () => {
         console.log("Cards update event received");
         updateCards();
      };

      window.addEventListener('updateCards', handleUpdateEvent);

      // Cleanup
      return () => window.removeEventListener('updateCards', handleUpdateEvent);
   }, []);

   const formatCurrency = (amount) => {
      return `$${amount.toLocaleString("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      })}`;
   };

   return (
      <div className="w-full px-4 md:px-5 py-6 mb-8">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-white">
            {/* Total Spent */}
            <div className="bg-primary rounded-3xl p-6 py-12 shadow-xl hover:scale-105 transition">
               <div className="flex items-center justify-between">
                  <div>
                     <h2 className="text-2xl md:text-[29px] font-bold">Total Spent</h2>
                     <p className="text-2xl font-bold mt-2">{formatCurrency(totalSpent)}</p>
                     <div className="mt-2 text-sm opacity-80">
                        <p>Regular: {formatCurrency(totalSpentRegular)}</p>
                        <p>Recurring: {formatCurrency(totalSpentRecurring)}</p>
                     </div>
                  </div>
                  <LucideBadgeDollarSign size={55} />
               </div>
            </div>

            {/* Remaining Budget */}
            <div className="bg-primary rounded-3xl p-6 py-12 shadow-xl hover:scale-105 transition">
               <div className="flex items-center justify-between">
                  <div>
                     <h2 className="text-2xl md:text-[29px] font-bold">Remaining Budget</h2>
                     <p className="text-2xl font-bold mt-2">{formatCurrency(remainBudget)}</p>
                     <div className="mt-2 text-sm opacity-80">
                        <p>{remainBudget < 0 ? 'Over budget!' : 'Budget remaining'}</p>
                     </div>
                  </div>
                  <Calculator size={50} />
               </div>
            </div>

            {/* Total Budget */}
            <div className="bg-primary rounded-3xl p-6 py-12 shadow-xl hover:scale-105 transition">
               <div className="flex items-center justify-between">
                  <div>
                     <h2 className="text-2xl md:text-[29px] font-bold">Total Budget</h2>
                     <p className="text-2xl font-bold mt-2">{formatCurrency(totalBudget)}</p>
                     <div className="mt-2 text-sm opacity-80">
                        <p>{totalBudget > 0 ? 'Budget set' : 'No budget set'}</p>
                     </div>
                  </div>
                  <Wallet size={50} />
               </div>
            </div>
         </div>
      </div>
   );
}