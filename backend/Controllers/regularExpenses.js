const { regularExpense } = require("../Models/regularExpenses");

async function handleAddRegularExpense(req, res) {
   try {
      const { amount, date, category, description } = req.body;
      const userId = req.user._id; 

      await regularExpense.create({
         user: userId,
         amount, 
         date, 
         category, 
         description
      });

      return res.status(201).json({ status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleGetAllRegularExpenses(req, res) {
   try {
      const userId = req.user._id;
      const allRegularExpenses = await regularExpense.find({ user: userId });
      return res.status(200).json({ allRegularExpenses, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleDeleteRegularExpenses(req, res) {
   try {
      const { id } = req.params;
      const userId = req.user._id;

      if (!id) return res.status(400).json({ message: 'Id is required' });

      // Check if expense belongs to user
      const expense = await regularExpense.findOne({ _id: id, user: userId });
      if (!expense) {
         return res.status(404).json({ message: 'Expense not found or not authorized' });
      }

      const deletedExpense = await regularExpense.findByIdAndDelete(id);
      return res.status(200).json({ deletedExpense, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleUpdateRegularExpenses(req, res) {
   try {
      const { id } = req.params;
      const update = req.body;
      const userId = req.user._id;

      if (!id) return res.status(400).json({ message: 'Id is required' });

      // Check if expense belongs to user
      const expense = await regularExpense.findOne({ _id: id, user: userId });
      if (!expense) {
         return res.status(404).json({ message: 'Expense not found or not authorized' });
      }

      const updatedExpense = await regularExpense.findByIdAndUpdate(id, { $set: update }, { new: true });
      return res.status(200).json({ updatedExpense, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

module.exports = {
   handleAddRegularExpense,
   handleGetAllRegularExpenses,
   handleDeleteRegularExpenses,
   handleUpdateRegularExpenses
};
