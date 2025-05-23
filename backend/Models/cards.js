const mongoose = require('mongoose');

const cardsSchema = new mongoose.Schema(
   {
      totalSpent: {
         type: Number
      },
      remainBudget: {
         type: Number
      },
      totalBudget: {
         type: Number
      },
      totalSpentRegular: {
         type: Number
      },
      totalSpentRecurring:{
         type: Number
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'users',
         required: true
      },
   },
   {
      timestamps: true
   }
)

const card = mongoose.model('cards',cardsSchema);

module.exports = {
   card
};