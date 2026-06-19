const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  mobile:    { type: String, required: true, unique: true },
  village:   { type: String, default: "" },
  state:     { type: String, default: "" },
  farmSize:  { type: Number, default: 0 },
  crop:      { type: String, default: "" },
  password:  { type: String, required: true },
  avatar:    { type: String, default: "" },       // Cloudinary URL
  location:  {
    lat:  { type: Number, default: null },
    lng:  { type: Number, default: null },
    name: { type: String, default: "" }
  },
  motorOn:   { type: Boolean, default: false },
  waterUsed: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);
