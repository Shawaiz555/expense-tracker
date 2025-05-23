"use client";
import axios from 'axios';
import AddBudgetModal from "@/app/pages/Budget/AddBudgetModel";
import BudgetCards from "@/app/pages/Budget/BudgetCards";
import React, { useState, useEffect } from "react";
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:5000';

export default function Page() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [budget, setBudget] = useState(null);
  const [isBudgetAdded, setIsBudgetAdded] = useState(false);

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

  useEffect(() => {
    const token = getCookie('Token');
    if (!token) {
      router.push('/pages/Login');
      return;
    }
  
    const fetchBudget = async () => {
      try {
        const response = await makeRequest('get', '/budget/getAllBudgets');
        if (response.allBudgets && response.allBudgets.length > 0) {
          // Get the first budget since we're only handling one
          setBudget(response.allBudgets[0]);
          setIsBudgetAdded(true);
        } else {
          setBudget(null);
          setIsBudgetAdded(false);
        }
      } catch (err) {
        console.error('Error fetching budget:', err);
        setBudget(null);
        setIsBudgetAdded(false);
      }
    };
  
    fetchBudget();
  }, []);

  return (
    <div className="p-2">
      <div>
        {/* Guidelines Panel */}
        <details className="group border border-primary bg-white shadow-md rounded-2xl p-5 py-7 mb-6">
          <summary className="text-lg font-bold text-primary cursor-pointer flex gap-2 items-center">
            <span className="flex sm:text-2xl items-center gap-2">
              💰Guidelines & Functionality
            </span>
            <span className="transition-transform duration-300 text-lg sm:text-xl group-open:rotate-180">
              ⬇️
            </span>
          </summary>

          <div className="mt-4 text-sm text-gray-700 space-y-3 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                Click the <strong className="text-primary">"Add Budget"</strong> button to define a budget for each category.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                You can only <strong>add budget once</strong>. After it's set, the button becomes disabled to prevent further changes.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                Each budget entry includes: <span className="font-semibold text-gray-800">category</span> and <span className="font-semibold text-gray-800">total amount</span>.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                All budget entries are securely stored in the database and protected by authentication.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                The total sum of all budgets is calculated and stored in the database.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                If no budgets exist, the <strong className="text-primary">"Add Budget"</strong> button remains enabled to allow new entries.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                All budget cards are rendered through the <code className="bg-gray-100 text-gray-800 px-1 rounded">BudgetCards</code> component for easy viewing and management.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-primary">➤</span>
              <p>
                Budget data persists across sessions through secure database storage, ensuring continuity and data security.
              </p>
            </div>
          </div>
        </details>
      </div>

      <div className="flex justify-between items-center bg-white border border-gray-300 shadow-lg py-6 px-8 rounded-2xl text-primary">
        <h1 className="xs:text-xl sm:text-2xl lg:text-3xl font-bold">Manage Budgets</h1>
        <button
          onClick={() => setShowModal(true)}
          className={`${isBudgetAdded
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-primary hover:scale-95 hover:cursor-pointer"
            } text-white px-4 sm:px-6 sm:py-2 rounded-lg font-bold transition-transform duration-200`}
          disabled={isBudgetAdded}
        >
          {isBudgetAdded ? "Budget Added" : "Add Budget"}
        </button>
      </div>

      {showModal && (
        <AddBudgetModal
          setShowModal={setShowModal}
          setBudget={setBudget}
          budget={budget}
          makeRequest={makeRequest} // Pass makeRequest to modal
        />
      )}

      <BudgetCards
        budget={budget}
        setBudget={(newBudget) => {
          setBudget(newBudget);
          setIsBudgetAdded(newBudget.length > 0);
        }}
        makeRequest={makeRequest} // Pass makeRequest to cards
      />
    </div>
  );
}