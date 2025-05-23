'use client';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { X, Pencil, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import Cards, { refreshData } from '@/app/components/Cards';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

const API_BASE_URL = 'http://localhost:5000';

export default function Page() {
   const router = useRouter();
   const [showModal, setShowModal] = useState(false);
   const [editIndex, setEditIndex] = useState(null);
   const [recurringExpenses, setRecurringExpenses] = useState([]);
   const [alertExpenses, setAlertExpenses] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isBudgetZero, setIsBudgetZero] = useState(false);

   const [formData, setFormData] = useState({
      name: '',
      category: '',
      amount: '',
      frequency: '',
      nextDueDate: '',
      autoDeduct: false,
   });

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

   const diagnoseCardData = async () => {
      try {
         const cardRes = await makeRequest('get', '/card/getCardData');
         console.log("Card Data:", cardRes);

         const recurringRes = await makeRequest('get', '/recurringExpense/getAllRecurringExpenses');
         const recurringExpenses = recurringRes.allRecurringExpenses || [];
         console.log("Recurring Expenses:", recurringExpenses);

         const paidExpenses = recurringExpenses.filter(exp => exp.lastPaid);
         console.log("Paid Recurring Expenses:", paidExpenses);

         const totalRecurring = paidExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
         console.log("Total Recurring Expenses (calculated):", totalRecurring);
      } catch (error) {
         console.error("Diagnostic error:", error);
      }
   };

   const loadData = async () => {
      setIsLoading(true);
      try {
         const recurringResponse = await makeRequest('get', '/recurringExpense/getAllRecurringExpenses');
         const storedExpenses = recurringResponse.allRecurringExpenses || [];

         const cardsResponse = await makeRequest('get', '/card/getCardData');
         const cardData = cardsResponse.allCardData[0] || {};

         const regularResponse = await makeRequest('get', '/regularExpense/getAllRegularExpenses');
         const regularExpenses = regularResponse.allRegularExpenses || [];

         const totalBudget = cardData.totalBudget || 0;

         if (!totalBudget) {
            setIsBudgetZero(true);
         }

         const totalSpentRegular = regularExpenses.reduce((sum, exp) => {
            return sum + parseFloat(exp.amount);
         }, 0);

         const today = new Date();
         const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

         let updatedExpenses = [];
         let totalDeducted = 0;

         updatedExpenses = storedExpenses.map(expense => {
            const expenseAmount = parseFloat(expense.amount);
            const dueDate = new Date(expense.nextDueDate);
            const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

            const isDue = dueMidnight <= todayMidnight;
            let wasProcessed = false;

            const updatedExpense = { ...expense };

            if (isDue && updatedExpense.autoDeduct) {
               if (!isNaN(expenseAmount)) {
                  totalDeducted += expenseAmount;
                  wasProcessed = true;
               }

               let newDueDate = new Date(updatedExpense.nextDueDate);
               switch (updatedExpense.frequency) {
                  case 'Daily':
                     newDueDate.setDate(newDueDate.getDate() + 1);
                     break;
                  case 'Weekly':
                     newDueDate.setDate(newDueDate.getDate() + 7);
                     break;
                  case 'Monthly':
                     newDueDate.setMonth(newDueDate.getMonth() + 1);
                     break;
                  case 'Yearly':
                     newDueDate.setFullYear(newDueDate.getFullYear() + 1);
                     break;
               }
               updatedExpense.nextDueDate = newDueDate.toISOString().split('T')[0];
               updatedExpense.lastPaid = today.toISOString().split('T')[0];

               if (wasProcessed) {
                  toast.success(`Auto-deducted $${expenseAmount.toFixed(2)} for ${updatedExpense.name}`);
                  updateExpenseToBackend(updatedExpense._id, updatedExpense);
               }
            }

            updatedExpense.payNow = isDue && !updatedExpense.autoDeduct;
            updatedExpense.isUpcoming = !isDue && dueMidnight <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            return updatedExpense;
         });

         const totalSpentRecurring = updatedExpenses.reduce((sum, exp) => {
            if (exp.lastPaid) {
               return sum + parseFloat(exp.amount);
            }
            return sum;
         }, 0);

         const totalSpent = totalSpentRegular + totalSpentRecurring;
         const remainBudget = totalBudget - totalSpent;

         await updateCardData({
            totalSpent,
            remainBudget,
            totalBudget,
            totalSpentRegular,
            totalSpentRecurring
         });

         setRecurringExpenses(updatedExpenses);

         const alertItems = updatedExpenses.filter(e => e.payNow || e.isUpcoming);
         setAlertExpenses(alertItems);

      } catch (error) {
         toast.error("Failed to load data from server");
      } finally {
         setIsLoading(false);
      }
   };

   const updateCardData = async (cardData) => {
      try {
         console.log("Updating card data:", cardData);
         const response = await makeRequest('get', '/card/getCardData');
         const existingCardData = response.allCardData;

         if (existingCardData && existingCardData.length > 0) {
            await makeRequest('put', '/card/updateCardData', cardData);
         }
         else {
            await makeRequest('post', '/card/addCardData', cardData);
         }

         refreshData();
         window.dispatchEvent(new Event('updateCards'));
      } catch (error) {
         console.error("Error updating card data:", error);
         toast.error("Failed to update budget calculations");
      }
   };

   const updateRemainingBudget = async (updatedRecurringExpenses) => {
      try {
         console.log("Updating remaining budget...");
         const cardsResponse = await makeRequest('get', '/card/getCardData');
         const cardData = cardsResponse.allCardData[0] || {};

         const regularResponse = await makeRequest('get', '/regularExpense/getAllRegularExpenses');
         const regularExpenses = regularResponse.allRegularExpenses || [];

         const totalBudget = cardData.totalBudget || 0;

         const totalSpentRegular = regularExpenses.reduce((sum, exp) => {
            return sum + parseFloat(exp.amount);
         }, 0);

         const totalSpentRecurring = updatedRecurringExpenses.reduce((sum, exp) => {
            if (exp.lastPaid) {
               return sum + parseFloat(exp.amount);
            }
            return sum;
         }, 0);

         const totalSpent = totalSpentRegular + totalSpentRecurring;
         const remainBudget = totalBudget - totalSpent;

         const updatedCardData = {
            totalSpent,
            remainBudget,
            totalBudget,
            totalSpentRegular,
            totalSpentRecurring
         };

         console.log("New budget calculations:", updatedCardData);
         await updateCardData(updatedCardData);
      } catch (error) {
         console.error("Error updating budget:", error);
         toast.error("Failed to update budget calculations");
      }
   };

   const updateExpenseToBackend = async (id, expenseData) => {
      try {
         const response = await makeRequest('put', `/recurringExpense/updateRecurringExpense/${id}`, expenseData);
         return response;
      } catch (error) {
         console.error("Error updating expense:", error);
         throw error;
      }
   };

   const handlePayNow = async (index) => {
      const expense = recurringExpenses[index];
      const expenseAmount = parseFloat(expense.amount);
   
      if (isNaN(expenseAmount)) {
         toast.error("Invalid expense amount");
         return;
      }
   
      try {
         await diagnoseCardData();
         
         let newDueDate = new Date(expense.nextDueDate);
         switch (expense.frequency) {
            case 'Daily':
               newDueDate.setDate(newDueDate.getDate() + 1);
               break;
            case 'Weekly':
               newDueDate.setDate(newDueDate.getDate() + 7);
               break;
            case 'Monthly':
               newDueDate.setMonth(newDueDate.getMonth() + 1);
               break;
            case 'Yearly':
               newDueDate.setFullYear(newDueDate.getFullYear() + 1);
               break;
         }
   
         const today = new Date();
         
         const updatedExpense = {
            ...expense,
            nextDueDate: newDueDate.toISOString().split('T')[0],
            payNow: false,
            lastPaid: today.toISOString().split('T')[0]
         };
   
         await makeRequest('put', `/recurringExpense/updateRecurringExpense/${expense._id}`, updatedExpense);
   
         const verifyResponse = await makeRequest('get', '/recurringExpense/getAllRecurringExpenses');
         const updatedExpenseFromDB = verifyResponse.allRecurringExpenses.find(e => e._id === expense._id);
         
         if (!updatedExpenseFromDB.lastPaid) {
            console.error("lastPaid field was not saved to the database!");
         }
   
         const updatedExpenses = [...recurringExpenses];
         updatedExpenses[index] = updatedExpense;
         setRecurringExpenses(updatedExpenses);
   
         refreshData();
         
         const alertItems = updatedExpenses.filter(e => e.payNow || e.isUpcoming);
         setAlertExpenses(alertItems);
   
         await updateRemainingBudget(updatedExpenses);
         await diagnoseCardData();
   
         toast.success(`Paid $${expenseAmount.toFixed(2)} for ${expense.name}`);
      }
      catch (error) {
         console.error("Error in handlePayNow:", error);
         if (error.response?.status === 401) {
            router.push('/pages/Login');
         } else {
            toast.error("Failed to process payment");
         }
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) {
         toast.error("Please enter a valid amount");
         return;
      }

      try {
         const today = new Date();
         const dueDate = new Date(formData.nextDueDate);
         const isDue = dueDate <= today;
         const isUpcoming = !isDue && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

         const expenseData = {
            ...formData,
            amount,
            payNow: isDue && !formData.autoDeduct,
            isUpcoming
         };

         let updatedExpenses;

         if (editIndex !== null) {
            // Editing existing expense
            const expenseId = recurringExpenses[editIndex]._id;
            await makeRequest('put', `/recurringExpense/updateRecurringExpense/${expenseId}`, expenseData);

            updatedExpenses = [...recurringExpenses];
            updatedExpenses[editIndex] = { ...expenseData, _id: expenseId };

            toast.success("Recurring expense updated successfully!");
         } else {
            // Adding new expense
            const response = await makeRequest('post', '/recurringExpense/addRecurringExpense', expenseData);
            
            const newExpenseId = response.recurringExpense?._id || response._id || response.data?._id;
            if (!newExpenseId) {
               console.error("Could not find ID in response:", response);
               await loadData();
               setShowModal(false);
               return;
            }

            const newExpense = { ...expenseData, _id: newExpenseId };
            updatedExpenses = [...recurringExpenses, newExpense];
            toast.success("Recurring expense added successfully!");
         }

         setRecurringExpenses(updatedExpenses);
         await updateRemainingBudget(updatedExpenses);

         const alertItems = updatedExpenses.filter(e => e.payNow || e.isUpcoming);
         setAlertExpenses(alertItems);

         setShowModal(false);
      } catch (error) {
         console.error("Error submitting form:", error);
         if (error.response?.status === 401) {
            router.push('/pages/Login');
         } else {
            toast.error("Failed to save expense");
         }

         setTimeout(() => {
            loadData();
         }, 1000);
      }
   };

   const handleDelete = async (index) => {
      try {
         const expense = recurringExpenses[index];
         await makeRequest('delete', `/recurringExpense/deleteRecurringExpense/${expense._id}`);

         const updatedExpenses = recurringExpenses.filter((_, i) => i !== index);
         setRecurringExpenses(updatedExpenses);

         await updateRemainingBudget(updatedExpenses);

         const alertItems = updatedExpenses.filter(e => e.payNow || e.isUpcoming);
         setAlertExpenses(alertItems);

         toast.success(`Deleted recurring expense: ${expense.name}`);
      } catch (error) {
         console.error("Error deleting expense:", error);
         if (error.response?.status === 401) {
            router.push('/pages/Login');
         } else {
            toast.error("Failed to delete expense");
         }
      }
   };

   const handleAutoDeductToggle = async (index) => {
      try {
         const updated = [...recurringExpenses];
         const expense = updated[index];

         expense.autoDeduct = !expense.autoDeduct;

         if (expense.autoDeduct) {
            expense.payNow = false;
         } else {
            const dueDate = new Date(expense.nextDueDate);
            const today = new Date();
            expense.payNow = dueDate <= today;
         }

         await makeRequest('put', `/recurringExpense/updateRecurringExpense/${expense._id}`, expense);

         setRecurringExpenses(updated);
         await updateRemainingBudget(updated);

         toast.info(`Auto-deduct ${expense.autoDeduct ? 'enabled' : 'disabled'} for ${expense.name}`);
      } catch (error) {
         console.error("Error toggling auto-deduct:", error);
         if (error.response?.status === 401) {
            router.push('/pages/Login');
         } else {
            toast.error("Failed to update auto-deduct setting");
         }
      }
   };

   const openAddModal = () => {
      setEditIndex(null);
      setFormData({
         name: '',
         category: '',
         amount: '',
         frequency: '',
         nextDueDate: '',
         autoDeduct: false,
      });
      setShowModal(true);
   };

   const openEditModal = (index) => {
      const expense = recurringExpenses[index];
      setEditIndex(index);
      setFormData({ ...expense });
      setShowModal(true);
   };

   const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : value
      }));
   };

   // Helper function to format date nicely
   const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
   };

   useEffect(() => {
      const token = getCookie('Token');
      if (!token) {
         router.push('/pages/Login');
         return;
      }
      loadData();
   }, []);

   if (isLoading) {
      return (
         <div className="min-h-screen p-3 flex items-center justify-center">
            <div className="text-2xl text-white font-bold">Loading recurring expenses...</div>
         </div>
      );
   }

   return (
      <div className="min-h-screen p-3 text-white">
         <div>
            {/* Guidelines Panel */}
            <details className="group border border-primary bg-white shadow-md rounded-2xl p-5 py-7 mb-6">
               <summary className="text-lg font-bold text-primary cursor-pointer flex gap-2 items-center">
                  <span className="flex sm:text-2xl items-center gap-2">
                     🔁Guidelines & Functionality
                  </span>
                  <span className="transition-transform duration-300 text-lg sm:text-xl group-open:rotate-180">
                     ⬇️
                  </span>
               </summary>

               <div className="mt-4 text-sm text-gray-700 space-y-3 leading-relaxed">
                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Click the <strong className="text-primary">"Add New"</strong> button to open a form modal for adding a recurring expense.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Required fields include: <span className="font-semibold text-gray-800">name</span>, <span className="font-semibold text-gray-800">amount</span>, <span className="font-semibold text-gray-800">category</span>, <span className="font-semibold text-gray-800">start date</span>, and <span className="font-semibold text-gray-800">frequency</span>.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        You can <span className="font-semibold text-green-600">edit</span> or <span className="font-semibold text-red-600">delete</span> any recurring expense from the list.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        If <strong className="text-green-700">Auto Deduct</strong> is enabled, the expense is automatically marked as paid when due.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        If <strong>Auto Deduct</strong> is off, you'll see a <strong className="text-orange-600">"Pay Now"</strong> button on the due date to manually pay the expense.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        When an expense is paid, its <span className="font-semibold text-gray-800">next due date</span> is automatically updated based on the selected frequency.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Total recurring expenses and remaining budget are updated in real-time after every transaction.
                     </p>
                  </div>

                  <div className="flex items-start gap-2">
                     <span className="text-primary">➤</span>
                     <p>
                        Expenses due today or within the next 7 days are highlighted for your attention.
                     </p>
                  </div>
               </div>
            </details>
         </div>


         Here's the next section of Part 2 (UI Component), continuing directly:

```jsx
         {/* Header */}
         <div className="flex justify-between items-center bg-white border border-gray-300 shadow-lg py-6 px-8 rounded-2xl text-primary mb-8">
            <h1 className="xs:text-xl sm:text-2xl lg:text-3xl text-primary font-bold">Recurring Expenses</h1>
            <button
               disabled={isBudgetZero}
               onClick={openAddModal}
               className={`bg-primary text-white tracking-wide px-3 sm:px-6 py-1 sm:py-2 rounded-lg font-bold hover:scale-95 hover:cursor-pointer transition-transform duration-200
               ${isBudgetZero ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
               Add New
            </button>
         </div>

         <div>
            <Cards />
         </div>

         {/* Alerts Banner */}
         {alertExpenses.length > 0 && (
            <div className="w-full flex mb-8">
               <div className="w-full md:w-[60%] lg:w-[40%] bg-yellow-400 backdrop-blur-md rounded-2xl p-7 py-12 shadow-xl border border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                     <AlertTriangle className="w-6 h-6 text-red-600" />
                     <h2 className="text-2xl md:text-3xl font-bold text-white">Upcoming Bills</h2>
                  </div>
                  <ul className="list-disc list-inside text-black text-md mt-4 space-y-2">
                     {alertExpenses.map((e, i) => (
                        <li key={i} className={e.payNow ? "text-red-600 font-medium" : ""}>
                           <span className="font-medium">{e.name}</span> - ${parseFloat(e.amount).toFixed(2)}
                           <span className={e.payNow ? "text-red-700 font-bold ml-2" : "text-gray-700 ml-2"}>
                              {e.payNow ? "PAST DUE" : "Due"} on {formatDate(e.nextDueDate)}
                           </span>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         )}

         {/* No Expenses Message */}
         {recurringExpenses.length === 0 && (
            <div className="text-center py-10">
               <h2 className="text-gray-400 text-xl">No Recurring Expenses yet. Add your first one!</h2>
            </div>
         )}

         {/* Expense Cards */}
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recurringExpenses.map((e, i) => (
               <div key={i} className={`bg-white border-2 ${e.payNow ? 'border-red-400' : 'border-gray-300'} rounded-2xl p-5 py-8 shadow-lg relative`}>
                  {e.payNow && (
                     <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Payment Due
                     </div>
                  )}
                  {e.isUpcoming && !e.payNow && (
                     <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Upcoming
                     </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-3xl font-bold text-primary">{e.name}</h3>
                     <span className="text-2xl text-red-500 font-bold">${parseFloat(e.amount).toFixed(2)}</span>
                  </div>

                  <div className={`text-sm ${e.payNow ? 'text-red-500 font-bold' : 'text-gray-400'} mb-3`}>
                     Next Due: {formatDate(e.nextDueDate)}
                  </div>

                  {e.lastPaid && (
                     <div className="text-sm text-green-600 mb-3">
                        Last Paid: {formatDate(e.lastPaid)}
                     </div>
                  )}

                  <p className="text-sm text-gray-400"><b>Category:</b> {e.category}</p>
                  <p className="text-sm text-gray-400"><b>Frequency:</b> {e.frequency}</p>

                  <div className="flex gap-3 justify-end items-center mt-4">
                     <span className="text-sm text-gray-400 font-bold">Auto-Deduct:</span>
                     <Switch
                        checked={e.autoDeduct}
                        onChange={() => handleAutoDeductToggle(i)}
                        className={`${e.autoDeduct ? 'bg-primary' : 'bg-gray-400'} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                     >
                        <span
                           className={`${e.autoDeduct ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                     </Switch>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-5">
                     {e.payNow && (
                        <button
                           onClick={() => handlePayNow(i)}
                           className="px-3 py-2 bg-black text-white rounded-lg hover:scale-95 hover:cursor-pointer flex items-center gap-1"
                        >
                           Pay Now
                        </button>
                     )}
                     <button
                        onClick={() => openEditModal(i)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:scale-95 hover:cursor-pointer"
                     >
                        <Pencil className="w-5 h-5" />
                     </button>
                     <button
                        onClick={() => handleDelete(i)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:scale-95 hover:cursor-pointer"
                     >
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            ))}
         </div>


         {/* Modal */}
         {showModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-white text-gray-800 w-full max-w-md rounded-xl shadow-xl relative animate-fadeInUp p-6 py-12">
                  <button
                     className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                     onClick={() => setShowModal(false)}
                  >
                     <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-3xl font-bold mb-6">{editIndex !== null ? 'Edit' : 'Add'} Recurring Expense</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                     <label htmlFor="Category" className='font-semibold'>Category:</label>
                     <select
                        required
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                     >
                        <option value="">Select Category</option>
                        <option value="rent">Rent</option>
                        <option value="bills">Bills</option>
                     </select>
                     <label htmlFor="Name" className='font-semibold'>Name:</label>
                     <input
                        type="text"
                        required
                        name="name"
                        placeholder="Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                     />
                     <label htmlFor="Amount" className='font-semibold'>Amount:</label>
                     <input
                        type="number"
                        required
                        name="amount"
                        placeholder="Amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                     />
                     <label htmlFor="Frequency" className='font-semibold'>Frequency:</label>
                     <select
                        required
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                     >
                        <option value="">Select...</option>
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Yearly</option>
                     </select>
                     <label htmlFor="Date" className='font-semibold'>Date:</label>
                     <input
                        type="date"
                        required
                        name="nextDueDate"
                        value={formData.nextDueDate}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                     />
                     <label className="flex items-center gap-2 text-sm">
                        <input
                           type="checkbox"
                           name="autoDeduct"
                           checked={formData.autoDeduct}
                           onChange={handleChange}
                        />
                        Enable Auto-Deduct
                     </label>
                     <div className="flex justify-end gap-2">
                        <button 
                           type="button" 
                           onClick={() => setShowModal(false)} 
                           className="px-4 py-2 bg-gray-300 rounded hover:cursor-pointer hover:scale-95"
                        >
                           Cancel
                        </button>
                        <button 
                           type="submit" 
                           className="px-4 py-2 bg-primary text-white rounded hover:cursor-pointer hover:scale-95"
                        >
                           {editIndex !== null ? 'Update' : 'Add'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}