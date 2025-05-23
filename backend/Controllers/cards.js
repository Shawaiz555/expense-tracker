const { card } = require("../Models/cards");

async function handleAddCardData(req, res) {
   try {
      const { totalSpent, remainBudget, totalBudget, totalSpentRegular, totalSpentRecurring } = req.body;
      const userId = req.user._id;

      await card.create({
         user: userId,
         totalSpent,
         remainBudget,
         totalBudget,
         totalSpentRegular,
         totalSpentRecurring
      });

      return res.status(200).json({ status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleGetCardData(req, res) {
   try {
      const userId = req.user._id;
      const allCardData = await card.find({ user: userId });
      return res.status(200).json({ allCardData, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

async function handleUpdateCardData(req, res) {
   try {
      const update = req.body;
      const userId = req.user._id;

      if (!update || Object.keys(update).length === 0) {
         return res.status(400).json({ message: 'Update data is required' });
      }

      const updatedCardData = await card.updateMany({ user: userId }, { $set: update });
      return res.status(200).json({ updatedCardData, status: 'Success' });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
   }
}

module.exports = {
   handleAddCardData,
   handleGetCardData,
   handleUpdateCardData
};
