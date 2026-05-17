import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByToken: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired tokens (TTL index)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to check if token is valid
refreshTokenSchema.methods.isValid = function () {
  return !this.revokedAt && this.expiresAt > new Date();
};

// Instance method to revoke token
refreshTokenSchema.methods.revoke = async function () {
  this.revokedAt = new Date();
  return this.save();
};

// Static method to find valid refresh token
refreshTokenSchema.statics.findValidToken = async function (token) {
  const refreshToken = await this.findOne({
    token,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  return refreshToken;
};

// Static method to revoke all user tokens
refreshTokenSchema.statics.revokeUserTokens = async function (userId) {
  return this.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
};

// Static method to revoke all tokens except one
refreshTokenSchema.statics.revokeAllButOne = async function (userId, keepToken) {
  return this.updateMany(
    { userId, token: { $ne: keepToken }, revokedAt: null },
    { revokedAt: new Date() }
  );
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
