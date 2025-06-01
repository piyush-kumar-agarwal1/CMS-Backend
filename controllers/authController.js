import expressAsyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import User from '../models/userModel.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const authUser = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      picture: user.picture,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const registerUser = expressAsyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      picture: user.picture,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

const googleAuth = expressAsyncHandler(async (req, res) => {
  const { accessToken } = req.body;

  try {

    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { email, name, picture, sub: googleId } = data;


    let user = await User.findOne({ email });

    if (!user) {

      user = await User.create({
        name,
        email,
        googleId,
        picture,
      });
    } else {

      user.googleId = googleId;
      user.picture = picture;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      picture: user.picture,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401);
    throw new Error('Invalid Google token');
  }
});

// Add this function
const googleCallback = expressAsyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('Authorization code is required');
  }

  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${req.headers.origin}/auth/callback`,
      grant_type: 'authorization_code'
    });

    // Get the access token
    const accessToken = tokenResponse.data.access_token;

    // Use the access token to get user information
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { email, name, picture, sub: googleId } = data;

    // Find or create the user
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        isVerified: true
      });
    } else {
      // Update existing user with Google info
      user.googleId = googleId;
      user.picture = picture;
      await user.save();
    }

    // Send back user info and token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      picture: user.picture,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error('Google callback error:', error.response?.data || error.message);
    res.status(401);
    throw new Error('Failed to process Google authentication');
  }
});

const getUserProfile = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      picture: user.picture,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateUserProfile = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      picture: updatedUser.picture,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  googleAuth,
  googleCallback
};