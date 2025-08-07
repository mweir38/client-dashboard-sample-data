const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// @route   POST api/impersonation/start
// @desc    Start impersonating a user or customer
// @access  Private (Admin/User with impersonation permission)
router.post('/start', auth, async (req, res) => {
  try {
    const { targetUserId, targetCustomerId, reason } = req.body;
    const currentUser = await User.findById(req.user.id);

    // Check if current user can impersonate
    if (!currentUser.canImpersonate && currentUser.role !== 'admin') {
      return res.status(403).json({ 
        msg: 'You do not have permission to impersonate users' 
      });
    }

    let targetUser = null;
    let targetCustomer = null;

    // If impersonating a user
    if (targetUserId) {
      targetUser = await User.findById(targetUserId).populate('customerId');
      if (!targetUser) {
        return res.status(404).json({ msg: 'Target user not found' });
      }
    }

    // If impersonating a customer
    if (targetCustomerId) {
      targetCustomer = await Customer.findById(targetCustomerId);
      if (!targetCustomer) {
        return res.status(404).json({ msg: 'Target customer not found' });
      }
    }

    // Create impersonation session
    const impersonationData = {
      originalUserId: currentUser._id,
      originalUserRole: currentUser.role,
      targetUserId: targetUser?._id,
      targetCustomerId: targetCustomer?._id,
      reason: reason || 'Support request',
      startedAt: new Date()
    };

    // Generate impersonation token
    const impersonationToken = jwt.sign(
      {
        ...impersonationData,
        isImpersonation: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Log impersonation in user history
    currentUser.impersonationHistory.push({
      impersonatedUser: targetUser?._id,
      impersonatedCustomer: targetCustomer?._id,
      impersonatedAt: new Date(),
      impersonatedBy: currentUser._id,
      reason: reason || 'Support request'
    });

    await currentUser.save();

    res.json({
      msg: 'Impersonation started successfully',
      impersonationToken,
      impersonationData: {
        targetUser: targetUser ? {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          customerId: targetUser.customerId?._id || targetUser.customerId
        } : null,
        targetCustomer: targetCustomer ? {
          id: targetCustomer._id,
          name: targetCustomer.name,
          arr: targetCustomer.arr,
          healthScore: targetCustomer.healthScore
        } : null,
        reason: reason || 'Support request',
        startedAt: new Date()
      }
    });

  } catch (err) {
    console.error('Error starting impersonation:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/impersonation/stop
// @desc    Stop impersonation and return to original user
// @access  Private
router.post('/stop', auth, async (req, res) => {
  try {
    // Check if this is an impersonation session
    if (!req.user.isImpersonation) {
      return res.status(400).json({ msg: 'Not in impersonation mode' });
    }

    // Get original user
    const originalUser = await User.findById(req.user.originalUserId);
    if (!originalUser) {
      return res.status(404).json({ msg: 'Original user not found' });
    }

    // Calculate impersonation duration
    const duration = Math.round((Date.now() - new Date(req.user.startedAt).getTime()) / (1000 * 60));

    // Update impersonation history with duration
    const impersonationRecord = originalUser.impersonationHistory[originalUser.impersonationHistory.length - 1];
    if (impersonationRecord) {
      impersonationRecord.duration = duration;
      await originalUser.save();
    }

    // Generate token for original user
    const originalToken = jwt.sign(
      {
        user: {
          id: originalUser._id,
          role: originalUser.role
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      msg: 'Impersonation stopped successfully',
      token: originalToken,
      user: {
        id: originalUser._id,
        name: originalUser.name,
        email: originalUser.email,
        role: originalUser.role
      },
      impersonationDuration: duration
    });

  } catch (err) {
    console.error('Error stopping impersonation:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      user: req.user ? { id: req.user.id, isImpersonation: req.user.isImpersonation } : 'No user'
    });
    res.status(500).json({ 
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// @route   GET api/impersonation/history
// @desc    Get impersonation history for current user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('impersonationHistory.impersonatedUser', 'name email role')
      .populate('impersonationHistory.impersonatedCustomer', 'name arr healthScore')
      .populate('impersonationHistory.impersonatedBy', 'name email');

    res.json(user.impersonationHistory);

  } catch (err) {
    console.error('Error fetching impersonation history:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/impersonation/available-targets
// @desc    Get available users/customers for impersonation
// @access  Private (Admin/User with impersonation permission)
router.get('/available-targets', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser.canImpersonate && currentUser.role !== 'admin') {
      return res.status(403).json({ 
        msg: 'You do not have permission to impersonate users' 
      });
    }

    // Get all users (excluding current user)
    const users = await User.find({ _id: { $ne: currentUser._id } })
      .select('name email role customerId')
      .populate('customerId', 'name arr healthScore');

    // Get all customers
    const customers = await Customer.find()
      .select('name arr healthScore status');

    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customer: user.customerId
      })),
      customers: customers.map(customer => ({
        id: customer._id,
        name: customer.name,
        arr: customer.arr,
        healthScore: customer.healthScore,
        status: customer.status
      }))
    });

  } catch (err) {
    console.error('Error fetching available targets:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/impersonation/permissions/:userId
// @desc    Update impersonation permissions for a user
// @access  Private (Admin only)
router.put('/permissions/:userId', auth, authorize('admin'), async (req, res) => {
  try {
    const { canImpersonate } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.canImpersonate = canImpersonate;
    await user.save();

    res.json({
      msg: 'Impersonation permissions updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        canImpersonate: user.canImpersonate
      }
    });

  } catch (err) {
    console.error('Error updating impersonation permissions:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 