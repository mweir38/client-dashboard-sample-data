const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const { auth } = require("../middleware/auth");

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({ name, email, password, role });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    let userId;
    
    // Handle impersonation tokens
    if (req.user.isImpersonation) {
      if (req.user.targetUserId) {
        userId = req.user.targetUserId;
      } else if (req.user.targetCustomerId) {
        // For customer impersonation, return the customer ID so the frontend can fetch customer data
        return res.json({
          id: req.user.targetCustomerId,
          name: 'Customer Impersonation',
          email: 'customer@impersonation.com',
          role: 'customer',
          customerId: req.user.targetCustomerId, // Add this field for customer impersonation
          isImpersonation: true,
          impersonationData: {
            originalUserId: req.user.originalUserId,
            reason: req.user.reason,
            startedAt: req.user.startedAt
          }
        });
      }
    } else {
      // Regular user token
      userId = req.user.id;
    }
    
    if (!userId) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }
    
    const user = await User.findById(userId).select('-password').populate('customerId');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Add impersonation flag if this is an impersonation session
    const userData = user.toObject();
    if (req.user.isImpersonation) {
      userData.isImpersonation = true;
      userData.impersonationData = {
        originalUserId: req.user.originalUserId,
        reason: req.user.reason,
        startedAt: req.user.startedAt
      };
    }
    
    res.json(userData);
  } catch (err) {
    console.error('Error in /api/auth/me:', err.message);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      user: req.user ? { 
        id: req.user.id, 
        isImpersonation: req.user.isImpersonation,
        targetUserId: req.user.targetUserId,
        targetCustomerId: req.user.targetCustomerId
      } : 'No user'
    });
    res.status(500).json({ 
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

module.exports = router;
