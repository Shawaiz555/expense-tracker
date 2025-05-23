import React, { useState } from "react";
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BudgetCards({ budget, setBudget, makeRequest }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    total: "",
    food: "",
    transport: "",
    bills: "",
    rent: "",
    entertainment: "",
    shopping: "",
    other: "",
  });

  const handleDelete = async () => {
    try {
      const response = await makeRequest('delete', `/budget/deleteBudget/${budget._id}`);
      if (response.status === 'Success') {
        setBudget(null);
      } else {
        throw new Error('Failed to delete budget');
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
      if (err.response?.status === 401) {
        router.push('/pages/Login');
      } else {
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditData(budget);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: parseFloat(value) || 0 });
  };

  const handleEditSave = async () => {
    try {
      const updatedBudget = { ...editData };
      
      // Ensure all values are numbers
      Object.keys(updatedBudget).forEach(key => {
        if (typeof updatedBudget[key] === 'string' && !isNaN(updatedBudget[key])) {
          updatedBudget[key] = parseFloat(updatedBudget[key]);
        }
      });
      
      const response = await makeRequest('put', `/budget/updateBudget/${budget._id}`, updatedBudget);
      
      if (response.status === 'Success' && response.updatedBudget) {
        setBudget(response.updatedBudget);
        setIsEditing(false);
      } else {
        throw new Error('Failed to update budget');
      }
    } catch (err) {
      console.error('Error saving edited budget:', err);
      if (err.response?.status === 401) {
        router.push('/pages/Login');
      } else {
        alert('Failed to save budget changes. Please try again.');
      }
    }
  };

  // Helper function to display budget values correctly
  const formatBudgetValue = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return value;
  };

  if (!budget) {
    return (
      <div className="py-5 rounded-xl text-center">
        <h3 className="text-2xl font-bold text-gray-600">No Budget Found</h3>
        <p className="text-gray-500 mt-2">Click "Add Budget" to create your budget plan</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 px-4 mt-6">
      <div className="bg-primary rounded-2xl border border-gray-300 shadow-xl p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Budget Plan
        </h2>

        {/* Inner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4">
          {[
            { label: "Total", key: "total" },
            { label: "Food", key: "food" },
            { label: "Transport", key: "transport" },
            { label: "Bills", key: "bills" },
            { label: "Rent", key: "rent" },
            { label: "Entertainment", key: "entertainment" },
            { label: "Shopping", key: "shopping" },
            { label: "Other", key: "other" },
          ].map(({ label, key }) => (
            <div
              key={key}
              className="rounded-xl shadow-2xl bg-white p-1 border border-gray-300 hover:scale-105 hover:transition-all sm:p-4 py-8 sm:py-12 text-center"
            >
              <h3 className="text-xl sm:text-2xl lg:text-[29px] font-bold text-primary mb-3">
                {label}
              </h3>
              <p className="text-lg font-bold text-gray-500">
                ${formatBudgetValue(budget[key]).toFixed(2).replace(/\.00$/, '')}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handleEditClick}
            className="p-2 px-3 bg-green-500 text-white rounded-lg hover:scale-95 hover:cursor-pointer transition-transform"
          >
            <Pencil className="w-6 h-7" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 px-3 bg-red-500 text-white rounded-lg hover:scale-95 hover:cursor-pointer transition-transform"
          >
            <Trash2 className="w-6 h-7" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full sm:w-2/3 md:w-1/2 lg:w-1/3 p-6 rounded-t-2xl shadow-xl animate-slideUp">
            <h2 className="text-3xl font-bold mb-4">Edit Budget</h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditSave();
            }}>
              {["total", "food", "transport", "bills", "rent", "entertainment", "shopping", "other"].map((item) => (
                <div key={item} className="mb-3">
                  <label className="block font-semibold capitalize">{item} Budget</label>
                  <input
                    type="number"
                    name={item}
                    value={editData[item] !== null && editData[item] !== undefined ? editData[item] : ""}
                    min={0}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              ))}

              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  className="bg-gray-300 px-6 py-2 rounded hover:scale-95 hover:cursor-pointer"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded hover:scale-95 hover:cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}