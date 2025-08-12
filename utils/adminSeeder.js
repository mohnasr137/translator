import User from '../models/user.js';

const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME });
    
    if (!adminExists) {
      const admin = new User({
        username: process.env.ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });

      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  }
};

export default createAdminUser;