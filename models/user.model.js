import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function () {
        // Require username only if not a Google user
        return !this.googleId;
      },
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure email is unique
    },
    password: {
      type: String,
      required: function () {
        // Require password only if not a Google user
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true, // Ensure unique for Google users
      sparse: true, // Only applicable for Google users
    },
    enrolledCourses: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Course",
      },
    ],
    profileImage: {
      type: String,
    },
    location: {
      type: String,
    },
    followers: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
    },
    posts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Post",
      },
    ],
    courses: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Course",
      },
    ],
    bookmarkedCourses: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Course",
      },
    ],
    bookmarkedPosts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Post",
      },
    ],
    deviceToken: {
      type: String,
    },
    age: {
      type: Number,
      required: true,
    },
    resetOtp: {
      type: String,
      index: { expires: "15m" }, // TTL index to automatically remove the field after 15 minutes
    },
    otpExpires: {
      type: Date,
      index: { expires: "15m" }, // TTL index to automatically remove the field after 15 minutes
    },
  },
  { timestamps: true }
);

// Middleware to hash password before saving
userSchema.pre("save", function (next) {
  /**
   * Represents a user.
   * @type {Object}
   */
  const user = this;
  if (user.isModified("password")) {
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  } else {
    next();
  }
});

// Middleware to hash password before updating
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  // Check if the password field is being updated
  if (update.password) {
    try {
      // Find the current user data
      const user = await this.model.findOne(this.getQuery());

      // Compare the new password with the current password
      /**
       * Indicates whether the updated password matches the user's password.
       *
       * @type {boolean}
       */
      const isSamePassword = await bcrypt.compare(
        update.password,
        user.password
      );
      if (!isSamePassword) {
        // Hash the new password if it's different
        const hashedPassword = await bcrypt.hash(update.password, 10);
        update.password = hashedPassword;
      } else {
        // If the password is the same, remove it from the update
        delete update.password;
      }
    } catch (err) {
      return next(err);
    }
  }

  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export { User };
