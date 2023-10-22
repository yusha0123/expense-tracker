const Razorpay = require("razorpay");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { Parser } = require("json2csv");
const mongoose = require("mongoose");
const User = require("../models/user");
const Expense = require("../models/expense");
const Download = require("../models/download");
const uploadToS3 = require("../utils/upload");

const createOrder = asyncHandler(async (req, res, next) => {
  const instance = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY,
    key_secret: process.env.RAZOR_PAY_SECRET,
  });
  const options = {
    amount: 5000,
    currency: "INR",
  };
  instance.orders.create(options, (err, order) => {
    if (err) {
      res.status(500);
      throw new Error("Internal Server Error!");
    }
    return res.status(201).json(order);
  });
});

const verifyOrder = asyncHandler(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("All fields are Mandatory!");
  }

  const generatedSignature = crypto
    .createHmac("SHA256", process.env.RAZOR_PAY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const isValid = generatedSignature == razorpay_signature;
  if (!isValid) {
    res.status(400);
    throw new Error("Payment Failed!");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { isPremium: true },
      { session }
    );
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Payment Successful!",
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500);
    throw new Error("Something went wrong!");
  } finally {
    session.endSession();
  }
});

const leaderboard = asyncHandler(async (req, res, next) => {
  try {
    const result = await User.find()
      .select("name totalExpenses -_id")
      .sort({ totalExpenses: -1 });
    res.status(200).json(result);
  } catch (error) {
    res.status(500);
    throw new Error("Something went wrong!");
  }
});

const getReport = asyncHandler(async (req, res, next) => {
  const type = req.query.type;
  if (type != "monthly" && type != "yearly") {
    res.status(400);
    throw new Error("Invalid Type Specified!");
  }

  let startDate;
  if (type === "monthly") {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  const docsToSelect = { createdAt: 1, description: 1, category: 1, amount: 1 };
  try {
    const expenses = await Expense.find(
      {
        userId: req.user._id,
        createdAt: { $gte: startDate },
      },
      docsToSelect
    )
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500);
    throw new Error("Something went wrong!");
  }
});

const downloadExpenses = asyncHandler(async (req, res, next) => {
  // const t = await sequelize.transaction();
  // try {
  //   const result = await req.user.getExpenses({
  //     attributes: ["createdAt", "description", "category", "amount"],
  //   });
  //   if (result.length == 0) {
  //     return res.status(200).json({
  //       url: "",
  //       success: false,
  //     });
  //   }
  //   //Generate CSV file
  //   const data = [];
  //   result.forEach((element) => {
  //     const { createdAt, description, category, amount } = element;
  //     data.push({ createdAt, category, description, amount });
  //   });
  //   const fileName = `Expensify-${req.user._id}/${new Date()}.csv`;
  //   const csvFields = ["createdAt", "category", "description", " amount"];
  //   const csvParser = new Parser(csvFields);
  //   const csv = csvParser.parse(data);
  //   const fileUrl = await uploadToS3(csv, fileName);
  //   //save to database
  //   await req.user.createDownload(
  //     {
  //       url: fileUrl,
  //     },
  //     {
  //       transaction: t,
  //     }
  //   );
  //   await t.commit();
  //   return res.status(200).json({
  //     url: fileUrl,
  //     success: true,
  //   });
  // } catch (error) {
  //   await t.rollback();
  //   res.status(500);
  //   throw new Error("Something went Wrong!", error.message);
  // }
});

const getUserDownloads = asyncHandler(async (req, res, next) => {
  try {
    const result = await Download.find({ userId: req.user._id }).select(
      "createdAt url"
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500);
    throw new Error("Something went wrong!");
  }
});

module.exports = {
  createOrder,
  verifyOrder,
  leaderboard,
  getReport,
  downloadExpenses,
  getUserDownloads,
};
