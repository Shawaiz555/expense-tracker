const mongoose = require("mongoose");

const regularExpenseSchema = new mongoose.Schema(
   {
   amount: {
      type: Number,
      required: true,
   },
   date: {
      type: Date,
      required: true
   },
   category: {
      type: String,
      required: true
   },
   description: {
      type: String,
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

const regularExpense = mongoose.model('regularExpenses',regularExpenseSchema);

module.exports = {
   regularExpense
};