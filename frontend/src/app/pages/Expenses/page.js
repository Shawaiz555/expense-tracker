'use client';
import axios from 'axios';
import Cards from '@/app/components/Cards';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

const API_BASE_URL = 'http://localhost:5000';

export default function Page() {
   const router = useRouter();
   const [showModal, setShowModal] = useState(false);
   const [expenses, setExpenses] = useState([]);
   const [isBudgetZero, setIsBudgetZero] = useState(false);
   const [formData, setFormData] = useState({
      amount: '',
      date: '',
      category: 'food',
      description: ''
   });
   const [editIndex, setEditIndex] = useState(null);
   const [selectedCategory, setSelectedCategory] = useState('All');
   const [isAuthenticated, setIsAuthenticated] = useState(false);

   // Check if user is authenticated
   useEffect(() => {
      const token = getCookie('Token');
      if (!token) {
         router.push('/pages/Login');
         return;
      }
      setIsAuthenticated(true);
   }, [router]);

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

   // Fetch expenses when component mounts
   useEffect(() => {
      if (isAuthenticated) {
         fetchExpenses();
         window.addEventListener("updateCards", updateRemainingBudget);
         return () => {
            window.removeEventListener("updateCards", updateRemainingBudget);
         };
      }
   }, [isAuthenticated]);

   const fetchExpenses = async () => {
      try {
         const response = await makeRequest('get', '/regularExpense/getAllRegularExpenses');
         setExpenses(response.allRegularExpenses || []);
         await updateRemainingBudget();
      } catch (error) {
         console.error("Failed to fetch expenses:", error);
         toast.error("Failed to load expenses. Please try again.");
      }
   };

   const updateRemainingBudget = async () => {
      try {
         const budgetRes = await makeRequest('get', '/budget/getAllBudgets');
         const regularRes = await makeRequest('get', '/regularExpense/getAllRegularExpenses');
         const recurringRes = await makeRequest('get', '/recurringExpense/getAllRecurringExpenses');

         const budgets = budgetRes.allBudgets || [];
         const regularExpenses = regularRes.allRegularExpenses || [];
         const recurringExpenses = recurringRes.allRecurringExpenses || [];

         const totalBudget = budgets.length > 0 ? parseFloat(budgets[0].total) : 0;

         const totalSpentRegular = regularExpenses.reduce((sum, exp) => {
            return sum + parseFloat(exp.amount);
         }, 0);

         const totalSpentRecurring = recurringExpenses.reduce((sum, exp) => {
            return exp.lastPaid ? sum + parseFloat(exp.amount) : sum;
         }, 0);

         const totalSpent = totalSpentRegular + totalSpentRecurring;
         const remainBudget = totalBudget - totalSpent;

         await makeRequest('put', '/card/updateCardData', {
            totalSpent: totalSpent.toFixed(2),
            remainBudget: remainBudget.toFixed(2),
            totalBudget: totalBudget.toFixed(2),
            totalSpentRegular: totalSpentRegular.toFixed(2),
            totalSpentRecurring: totalSpentRecurring.toFixed(2)
         });

         setIsBudgetZero(remainBudget <= 0);
         window.dispatchEvent(new Event("updateCards"));
      } catch (error) {
         console.error("Error updating remaining budget:", error);
         setIsBudgetZero(false);
      }
   };

   const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
   };

   const handleAddOrEditExpense = async () => {
      const inputAmount = parseFloat(formData.amount);
      const category = formData.category.toLowerCase();

      try {
         const budgetRes = await makeRequest('get', '/budget/getAllBudgets');
         const budgets = budgetRes.allBudgets;

         const budgetObj = budgets[0] || {};
         const rawCategoryBudget = budgetObj[category];

         if (rawCategoryBudget === undefined) {
            toast.error(`No budget set for category "${category}". Please set it before adding expenses.`);
            return;
         }

         const budgetForCategory = parseFloat(rawCategoryBudget);

         const expensesRes = await makeRequest('get', '/regularExpense/getAllRegularExpenses');
         const allExpenses = expensesRes.allRegularExpenses;

         const totalSpentInCategory = allExpenses.reduce((acc, expense) => {
            if (editIndex !== null && expense._id === expenses[editIndex]._id) return acc;
            if (expense.category.toLowerCase() === category) {
               return acc + parseFloat(expense.amount);
            }
            return acc;
         }, 0);

         const remainingForCategory = budgetForCategory - totalSpentInCategory;

         if (remainingForCategory <= 0) {
            toast.error(`You only have $0.00 left for ${category}`);
            return;
         }

         if (inputAmount > remainingForCategory) {
            toast.error(`You only have $${remainingForCategory.toFixed(2)} left for ${category}`);
            return;
         }

         if (editIndex !== null) {
            const expenseId = expenses[editIndex]._id;
            await makeRequest('put', `/regularExpense/updateRegularExpense/${expenseId}`, formData);
            toast.success("Expense Updated Successfully!!!");
         } else {
            await makeRequest('post', '/regularExpense/addRegularExpense', formData);
            toast.success("Expense Added Successfully!!!");
         }

         await fetchExpenses();
         await updateRemainingBudget();

         setFormData({ amount: '', date: '', category: 'food', description: '' });
         setEditIndex(null);
         setShowModal(false);
      } catch (err) {
         console.error(err);
         toast.error("Something went wrong. Please try again.");
      }
   };

   const handleEdit = (index) => {
      setFormData(expenses[index]);
      setEditIndex(index);
      setShowModal(true);
   };

   const handleDelete = async (id) => {
      try {
         await makeRequest('delete', `/regularExpense/deleteRegularExpense/${id}`);
         toast.success("Expense Deleted Successfully!!!");
         await fetchExpenses();
      } catch (error) {
         console.error("Error deleting expense:", error);
         toast.error("Failed to delete expense.");
      }
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      handleAddOrEditExpense();
   };

   const uniqueCategories = [...new Set(expenses.map(exp => exp.category))];

   if (!isAuthenticated) {
      return null;
   }

   return (
      <div className="p-2 space-y-6">
         <div>
            {/* Guidelines Panel */}
            <details className="group border border-primary bg-white shadow-md rounded-2xl p-5 py-7 mb-6">
               <summary className="text-lg font-bold text-primary cursor-pointer flex gap-2 items-center">
                  <span className="flex sm:text-2xl items-center gap-2">
                     📘Guidelines & Functionality
                  </span>
                  <span className="transition-transform duration-300 text-lg sm:text-xl group-open:rotate-180">
                     ⬇️
                  </span>
               </summary>

               <div className="mt-4 text-sm text-gray-700 space-y-3 leading-relaxed">
                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Click the <strong className="text-primary">"Add New"</strong> button to open a form modal for adding a new expense.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Each expense requires: <span className="font-semibold text-gray-800">amount</span>, <span className="font-semibold text-gray-800">category</span>, <span className="font-semibold text-gray-800">date</span>, and <span className="font-semibold text-gray-800">description</span>.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Expenses are stored under the key <code className="bg-gray-100 text-gray-800 px-1 rounded">"ExpenseCards"</code>.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        You can <span className="font-semibold text-green-600">edit</span> or <span className="font-semibold text-red-600">delete</span> any expense using the respective icons.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Each category (like Food, Transport, etc.) has a set <strong>budget</strong> under <code className="bg-gray-100 text-gray-800 px-1 rounded">"budgets"</code>.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        If the entered expense amount <strong className="text-red-500">exceeds</strong> the remaining budget, an error is shown and submission is blocked.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Total spent and remaining budget are automatically updated after every addition, deletion, or edit.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        When the category budget is fully consumed, the <strong className="text-orange-600">"Add New"</strong> button becomes disabled to prevent overspending.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        You can <strong className="text-blue-600">filter</strong> expenses by category using the dropdown menu.
                     </p>
                  </div>
               </div>
            </details>
         </div>

         {/* Header */}
         <div className='flex justify-between items-center bg-white border border-gray-300 shadow-lg py-6 px-8 rounded-2xl text-primary'>
            <h1 className='xs:text-xl sm:text-2xl lg:text-3xl font-bold'>Regular Expenses</h1>
            <button
               disabled={isBudgetZero}
               onClick={() => {
                  setShowModal(true);
                  setEditIndex(null);
                  setFormData({ amount: '', date: '', category: 'food', description: '' });
               }}
               className={`bg-primary text-white tracking-wide px-3 sm:px-6 py-1 sm:py-2 rounded-lg font-bold hover:scale-95 hover:cursor-pointer transition-transform duration-200
                  ${isBudgetZero ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
               Add New
            </button>
         </div>

         <div>
            <Cards />
         </div>

         {/* Filter Dropdown */}
         <div className='flex gap-2 justify-center md:justify-end items-center mx-2 my-10'>
            <h1 className='text-primary text-xl sm:text-2xl font-bold'>Filter Expenses:</h1>
            <select
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
               className="w-1/3 md:w-1/5 px-1 sm:px-5 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
               <option value="All">All Categories</option>
               {uniqueCategories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
               ))}
            </select>
         </div>

         {/* Expense Cards */}
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {expenses.length > 0 ? (
               expenses
                  .filter(exp => selectedCategory === 'All' || exp.category === selectedCategory)
                  .map((expense, index) => (
                     <div
                        key={expense._id}
                        className="border-2 border-gray-300 rounded-2xl p-7 shadow-xl"
                     >
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-3xl font-bold text-primary capitalize">{expense.category}</h3>
                           <span className="text-2xl text-red-500 font-bold">${parseFloat(expense.amount).toFixed(2)}</span>
                        </div>
                        <p className="text-gray-500 text-xs mb-2"><b>Date:</b> {new Date(expense.date).toLocaleDateString()}</p>
                        <p className='text-gray-500 mt-3'><strong>Description:</strong> {expense.description}</p>

                        <div className="flex justify-end items-center mt-4 gap-3">
                           <button
                              onClick={() => handleEdit(index)}
                              className="p-2 bg-green-500 text-white rounded-lg hover:scale-95 hover:cursor-pointer"
                           >
                              <Pencil className="w-5 h-5" />
                           </button>
                           <button
                              onClick={() => handleDelete(expense._id)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:scale-95 hover:cursor-pointer"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                  ))
            ) : (
               <div className="col-span-3 text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-xl">No Expenses Found. Add your first expense!</p>
               </div>
            )}
         </div>

         {/* Modal */}
         {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
               <div className="bg-white rounded-2xl shadow-lg p-6 py-12 w-full max-w-md animate-slideUp">
                  <h2 className="text-3xl font-bold mb-4 text-primary">
                     {editIndex !== null ? 'Edit Expense' : 'Add Expense'}
                  </h2>

                  <div className="space-y-4">
                     <form onSubmit={handleSubmit}>
                        <input
                           name="amount"
                           type="number"
                           placeholder="Amount"
                           min={0}
                           step="0.01"
                           value={formData.amount}
                           onChange={handleChange}
                           className="w-full p-2 border border-gray-300 my-3 text-gray-600 rounded-lg"
                           required
                        />

                        <select
                           name="category"
                           value={formData.category}
                           onChange={handleChange}
                           className="w-full p-2 border border-gray-300 my-3 text-gray-600 rounded-lg"
                           required
                        >
                           <option value="food">Food</option>
                           <option value="transport">Transport</option>
                           <option value="shopping">Shopping</option>
                           <option value="entertainment">Entertainment</option>
                           <option value="other">Other</option>
                        </select>

                        <input
                           name="date"
                           type="date"
                           value={formData.date}
                           onChange={handleChange}
                           className="w-full p-2 border border-gray-300 my-3 text-gray-600 rounded-lg"
                           required
                        />
                        <textarea
                           name="description"
                           rows={3}
                           placeholder="Description"
                           value={formData.description}
                           onChange={handleChange}
                           className="w-full p-2 border border-gray-300 my-3 text-gray-600 rounded-lg"
                           required
                        />

                        <div className="flex justify-end gap-3 pt-2">
                           <button
                              type="button"
                              onClick={() => {
                                 setShowModal(false);
                                 setEditIndex(null);
                              }}
                              className="text-white bg-gray-400 rounded-xl px-7 py-2 font-semibold hover:scale-95 hover:cursor-pointer"
                           >
                              Cancel
                           </button>
                           <button
                              type='submit'
                              className="bg-primary text-white px-8 py-2 tracking-wider rounded-xl font-semibold hover:scale-95 hover:cursor-pointer"
                           >
                              {editIndex !== null ? 'Update' : 'Add'}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}