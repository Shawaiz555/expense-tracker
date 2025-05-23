const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
   {
      total: {
         type: Number,
         required: true
      },
      food: {
         type: Number,
         required: true
      },
      transport: {
         type: Number,
         required: true
      },
      bills: {
         type: Number,
         required: true
      },
      rent: {
         type: Number,
         required: true
      },
      entertainment: {
         type: Number,
         required: true
      },
      shopping: {
         type: Number,
         required: true
      },
      other: {
         type: Number,
         required: true
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

const budget = mongoose.model('budgets',budgetSchema);

module.exports = {
    budget
};