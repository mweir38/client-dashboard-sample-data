const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// @route   GET api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ date: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users
// @desc    Create a new user (admin only)
// @access  Private/Admin
router.post('/', auth, authorize('admin'), async (req, res) => {
  const { name, email, password, role, customerId } = req.body;

  try {
    // Validate client role requires customerId
    if (role === 'client' && !customerId) {
      return res.status(400).json({ msg: 'Client users must be assigned to a customer' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role: role || 'user'
    };
    
    // Only add customerId if role is client and customerId is provided
    if (role === 'client' && customerId) {
      userData.customerId = customerId;
    }
    
    user = new User(userData);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
      date: user.date
    };

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  const { name, email, role, customerId } = req.body;

  try {
    // Validate client role requires customerId
    if (role === 'client' && !customerId) {
      return res.status(400).json({ msg: 'Client users must be assigned to a customer' });
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    
    // Handle customer assignment
    if (role === 'client') {
      user.customerId = customerId || user.customerId;
    } else {
      // Clear customerId if role is not client
      user.customerId = undefined;
    }

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
      date: user.date
    };

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Cannot delete your own account' });
    }

    // Prevent deletion of the last admin user
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ msg: 'Cannot delete the last admin user' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id/permissions
// @desc    Update user reporting permissions (admin only)
// @access  Private/Admin
router.put('/:id/permissions', auth, authorize('admin'), async (req, res) => {
  const { reportingPermissions } = req.body;

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update reporting permissions
    user.reportingPermissions = {
      ...user.reportingPermissions,
      ...reportingPermissions
    };

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
      reportingPermissions: user.reportingPermissions,
      date: user.date
    };

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;