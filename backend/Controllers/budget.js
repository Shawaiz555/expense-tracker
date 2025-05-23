const { budget } = require("../Models/budget");

async function handleAddBudget(req, res) {
   try {
      const { total, food, transport, bills, rent, entertainment, shopping, other } = req.body;
      const userId = req.user._id;

      await budget.create({
         user: userId,
         total, 
         food, 
         transport, 
         bills, 
         rent, 
         entertainment, 
         shopping, 
         other
      });

      return res.status(201).json({ status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleGetAllBudgets(req, res) {
   try {
      const userId = req.user._id;
      const allBudgets = await budget.find({ user: userId });
      return res.status(200).json({ allBudgets, status: 'Success' });
   }
   catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleDeleteBudgets(req, res) {
   try {
      const { id } = req.params;
      const userId = req.user._id;

      if (!id) return res.status(400).json({ message: 'Id is required' });

      // Check if budget belongs to user
      const budgetItem = await budget.findOne({ _id: id, user: userId });
      if (!budgetItem) {
         return res.status(404).json({ message: 'Budget not found or not authorized' });
      }

      const deletedBudget = await budget.findByIdAndDelete(id);
      return res.status(200).json({ deletedBudget, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleUpdateBudgets(req, res) {
   try {
      const { id } = req.params;
      const update = req.body;
      const userId = req.user._id;

      if (!id) return res.status(400).json({ message: 'Id is required' });

      // Check if budget belongs to user
      const budgetItem = await budget.findOne({ _id: id, user: userId });
      if (!budgetItem) {
         return res.status(404).json({ message: 'Budget not found or not authorized' });
      }

      const updatedBudget = await budget.findByIdAndUpdate(id, { $set: update }, { new: true });
      return res.status(200).json({ updatedBudget, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

module.exports = {
   handleAddBudget,
   handleGetAllBudgets,
   handleDeleteBudgets,
   handleUpdateBudgets
};
