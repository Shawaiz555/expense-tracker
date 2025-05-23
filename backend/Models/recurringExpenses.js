const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true
      },
      category: {
         type: String,
         required: true
      },
      amount: {
         type: Number,
         required: true
      },
      frequency: {
         type: String,
         required: true
      },
      nextDueDate: {
         type: Date,
         required: true
      },
      autoDeduct: {
         type: Boolean,
         required: true
      },
      lastPaid: {
         type: Date,
         default: null
       },
       payNow: {
         type: Boolean,
         default: false
       },
       isUpcoming: {
         type: Boolean,
         default: false
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

const recurringExpense = mongoose.model('recurringExpenses',recurringExpenseSchema);

module.exports = {
   recurringExpense
};