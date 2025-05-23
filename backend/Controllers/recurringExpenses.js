const { recurringExpense } = require("../Models/recurringExpenses");

async function handleAddRecurringExpense(req, res) {
   try {
      const { name, category, amount, frequency, nextDueDate, autoDeduct, lastPaid, payNow, isUpcoming } = req.body;
      const userId = req.user._id;

      const newExpense = await recurringExpense.create({
         user: userId,
         name, 
         category, 
         amount, 
         frequency, 
         nextDueDate: new Date(nextDueDate), 
         autoDeduct,
         lastPaid: lastPaid ? new Date(lastPaid) : null,
         payNow: payNow || false,
         isUpcoming: isUpcoming || false
      });

      return res.status(201).json({ recurringExpense: newExpense, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleGetAllRecurringExpenses(req, res) {
   try {
      const userId = req.user._id;
      const allRecurringExpenses = await recurringExpense.find({ user: userId });
      return res.status(200).json({ allRecurringExpenses, status: 'Success' });
   } 
   catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleDeleteRecurringExpense(req, res) {
   try {
      const { id } = req.params;
      const userId = req.user._id;

      if (!id) return res.status(400).json({ message: 'Id is required' });

      // Check if expense belongs to user
      const expense = await recurringExpense.findOne({ _id: id, user: userId });
      if (!expense) {
         return res.status(404).json({ message: 'Expense not found or not authorized' });
      }

      const deletedRecurringExpense = await recurringExpense.findByIdAndDelete(id);
      return res.status(200).json({ deletedRecurringExpense, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleUpdateRecurringExpense(req, res) {
   try {
      const { id } = req.params;
      const update = req.body;
      const userId = req.user._id;

      if (!id) return res.status(400).json({ message: 'Id is required' });

      // Check if expense belongs to user
      const expense = await recurringExpense.findOne({ _id: id, user: userId });
      if (!expense) {
         return res.status(404).json({ message: 'Expense not found or not authorized' });
      }

      if (update.lastPaid) {
         update.lastPaid = new Date(update.lastPaid);
      }

      if (update.nextDueDate) {
         update.nextDueDate = new Date(update.nextDueDate);
      }

      const updatedRecurringExpense = await recurringExpense.findByIdAndUpdate(
         id, 
         { $set: update }, 
         { new: true }
      );
      
      return res.status(200).json({ updatedRecurringExpense, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

module.exports = {
   handleAddRecurringExpense,
   handleGetAllRecurringExpenses,
   handleDeleteRecurringExpense,
   handleUpdateRecurringExpense
};
