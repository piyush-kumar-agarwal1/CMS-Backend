import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

const getUsers = expressAsyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});


const getUserById = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


const deleteUser = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot delete admin user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


const updateUser = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
};