import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Only required if not a Google user
      },
    },
    googleId: {
      type: String,
      sparse: true, // Allows null but ensures uniqueness when present
    },
    picture: {
      type: String,
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    title: {
      type: String,
    },
    department: {
      type: String,
    },
    avatar: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  // For Google users who don't have a password
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  // Only hash password if it's modified and exists (won't exist for Google users)
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;