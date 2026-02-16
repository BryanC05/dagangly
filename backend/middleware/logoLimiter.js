const User = require('../models/User');

const DAILY_LIMIT = parseInt(process.env.LOGO_GENERATION_LIMIT) || 5;

/**
 * Middleware to check and enforce daily logo generation limits
 * Also resets the counter if it's a new day
 */
async function logoGenerationLimiter(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const lastReset = new Date(user.logoGenerationCount.lastResetDate);
    
    // Check if we need to reset the counter (new day)
    const isNewDay = now.getUTCDate() !== lastReset.getUTCDate() ||
                     now.getUTCMonth() !== lastReset.getUTCMonth() ||
                     now.getUTCFullYear() !== lastReset.getUTCFullYear();
    
    if (isNewDay) {
      // Reset counter for new day
      user.logoGenerationCount.count = 0;
      user.logoGenerationCount.lastResetDate = now;
      await user.save();
    }
    
    // Check if user has exceeded daily limit
    if (user.logoGenerationCount.count >= DAILY_LIMIT) {
      // Calculate time until next reset (midnight UTC)
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      
      return res.status(429).json({
        success: false,
        error: 'Daily limit reached',
        message: `You have reached your daily limit of ${DAILY_LIMIT} logo generations`,
        limit: DAILY_LIMIT,
        used: user.logoGenerationCount.count,
        resetTime: tomorrow.toISOString(),
        resetInHours: Math.ceil((tomorrow - now) / (1000 * 60 * 60))
      });
    }
    
    // Attach limit info to request for later use
    req.logoLimitInfo = {
      limit: DAILY_LIMIT,
      used: user.logoGenerationCount.count,
      remaining: DAILY_LIMIT - user.logoGenerationCount.count
    };
    
    next();
  } catch (error) {
    console.error('Logo generation limiter error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Error checking generation limits',
      error: error.message 
    });
  }
}

/**
 * Increment the user's logo generation count
 * Call this after successful generation
 */
async function incrementGenerationCount(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'logoGenerationCount.count': 1 }
    });
  } catch (error) {
    console.error('Error incrementing generation count:', error);
  }
}

/**
 * Get current generation status for a user
 */
async function getGenerationStatus(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;
    
    const now = new Date();
    const lastReset = new Date(user.logoGenerationCount.lastResetDate);
    
    // Check if counter needs reset
    const isNewDay = now.getUTCDate() !== lastReset.getUTCDate() ||
                     now.getUTCMonth() !== lastReset.getUTCMonth() ||
                     now.getUTCFullYear() !== lastReset.getUTCFullYear();
    
    let count = user.logoGenerationCount.count;
    
    if (isNewDay) {
      count = 0;
    }
    
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    
    return {
      limit: DAILY_LIMIT,
      used: count,
      remaining: Math.max(0, DAILY_LIMIT - count),
      resetTime: tomorrow.toISOString(),
      resetInHours: Math.ceil((tomorrow - now) / (1000 * 60 * 60))
    };
  } catch (error) {
    console.error('Error getting generation status:', error);
    return null;
  }
}

module.exports = {
  logoGenerationLimiter,
  incrementGenerationCount,
  getGenerationStatus,
  DAILY_LIMIT
};
