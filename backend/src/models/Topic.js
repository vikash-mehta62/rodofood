const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  topicKey: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  autoSubscribe: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  }
}, { timestamps: true });

module.exports = mongoose.model("Topic", topicSchema);
