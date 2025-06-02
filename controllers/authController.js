const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// @desc    Show login form
// @route   GET /auth/login
exports.showLoginForm = (req, res) => {
    res.render('auth/login', { 
        title: 'Login' 
    });
};

// @desc    Show registration form
// @route   GET /auth/register
exports.showRegisterForm = (req, res) => {
    res.render('auth/register', {
        title: 'Register'
    });
};

// @desc    Register user
// @route   POST /auth/register
exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            req.flash('error', 'Email already registered');
            return res.redirect('/auth/register');
        }

        const user = await User.create({
            name,
            email,
            password
        });

        const token = generateToken(user._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        req.flash('success', 'Registration successful!');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Registration failed');
        res.redirect('/auth/register');
    }
};

// @desc    Login user
// @route   POST /auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user || !(await user.matchPassword(password))) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        if (user.twoFactorEnabled) {
            req.session.tempUserId = user._id;
            return res.redirect('/auth/2fa');
        }

        const token = generateToken(user._id);
        res.cookie('jwt', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        
        req.flash('success', 'Logged in successfully');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/auth/login');
    }
};

// @desc    Logout user
// @route   GET /auth/logout
exports.logout = (req, res) => {
    res.clearCookie('jwt');
    req.flash('success', 'Logged out successfully');
    res.redirect('/auth/login');
};

// @desc    Show 2FA verification form
// @route   GET /auth/2fa
exports.show2faForm = (req, res) => {
    if (!req.session.tempUserId) {
        return res.redirect('/auth/login');
    }
    res.render('auth/2fa', { 
        title: 'Two-Factor Authentication' 
    });
};

// @desc    Verify 2FA code
// @route   POST /auth/2fa
exports.verify2fa = async (req, res) => {
    const { code } = req.body;
    
    try {
        const user = await User.findById(req.session.tempUserId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code
        });

        if (!verified) {
            req.flash('error', 'Invalid verification code');
            return res.redirect('/auth/2fa');
        }

        delete req.session.tempUserId;
        const token = generateToken(user._id);
        res.cookie('jwt', token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        
        req.flash('success', 'Logged in successfully');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/auth/login');
    }
};

// @desc    Show 2FA setup page
// @route   GET /auth/setup-2fa
exports.show2faSetup = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/profile');
        }

        if (user.twoFactorEnabled) {
            req.flash('info', '2FA is already enabled');
            return res.redirect('/profile');
        }

        const secret = speakeasy.generateSecret({
            name: `AdidasApp:${user.email}`
        });

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Error generating QR code');
                return res.redirect('/profile');
            }

            user.twoFactorSecret = secret.base32;
            user.save();

            res.render('auth/setup-2fa', { 
                title: 'Setup Two-Factor Authentication',
                qrCodeUrl: data_url,
                secret: secret.base32
            });
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/profile');
    }
};

// @desc    Enable 2FA
// @route   POST /auth/enable-2fa
exports.enable2fa = async (req, res) => {
    const { code } = req.body;
    
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/profile');
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code
        });

        if (!verified) {
            req.flash('error', 'Invalid verification code');
            return res.redirect('/auth/setup-2fa');
        }

        user.twoFactorEnabled = true;
        await user.save();
        
        req.flash('success', 'Two-factor authentication enabled successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error');
        res.redirect('/profile');
    }
};

// Helper function to generate JWT
function generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
}