import React, { useState } from "react";
import { useRouter } from 'next/navigation';

export default function AddBudgetModal({ setShowModal, setBudget, makeRequest }) {
  const router = useRouter();
  const [form, setForm] = useState({
    total: "",
    food: "",
    transport: "",
    bills: "",
    rent: "",
    entertainment: "",
    shopping: "",
    other: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasEmptyFields = Object.values(form).some((value) => value === '');
    if (hasEmptyFields) {
      alert("Please fill out all fields.");
      return;
    }

    // Convert string inputs to numbers
    const numericForm = {};
    Object.entries(form).forEach(([key, value]) => {
      numericForm[key] = parseFloat(value) || 0;
    });

    try {
      const response = await makeRequest('post', '/budget/addBudget', numericForm);
      
      if (response.status === 'Success') {
        // Fetch the updated budget list after adding
        const getBudgetResponse = await makeRequest('get', '/budget/getAllBudgets');
        if (getBudgetResponse.allBudgets && getBudgetResponse.allBudgets.length > 0) {
          setBudget(getBudgetResponse.allBudgets[0]);
        }
        setShowModal(false);
      } else {
        throw new Error('Failed to add budget');
      }
    } catch (err) {
      console.error("Error adding budget:", err);
      if (err.response?.status === 401) {
        router.push('/pages/Login');
      } else {
        alert("Error adding budget. Please try again.");
      }
    }
  };


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:w-2/3 md:w-1/2 lg:w-1/3 p-6 rounded-xl shadow-xl animate-slideUp">
        <h2 className="text-3xl font-bold mb-4">Add Budget</h2>

        <form onSubmit={handleSubmit}>
          {["total", "food", "transport", "bills", "rent", "entertainment", "shopping", "other"].map((item) => (
            <div key={item} className="mb-2">
              <label className="block font-semibold capitalize">{item} Budget</label>
              <input
                type="number"
                name={item}
                value={form[item]}
                min={0}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          ))}

          <div className="flex justify-end space-x-4 mt-3">
            <button
              type="button"
              className="bg-gray-300 px-6 py-2 rounded hover:scale-95 hover:cursor-pointer"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded hover:scale-95 hover:cursor-pointer"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}