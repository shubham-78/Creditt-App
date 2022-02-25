const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
        trim: true,
    },
    Email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Please enter a valid E-mail id i.e. abcd@gmail.com");
            }
        }
    },
    Password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error("Password cant be password");
            }
        }
    },
    MobileNumber: {
        type: Number,
        required: true,
        trim: true,
        minlength: 10,
        unique: true
    },
    DOB: {
        type: Date,
        required: true
    },
    City: {
        type: String,
        required: true,
        trim: true
    },
    State: {
        type: String,
        required: true,
        trim: true
    },
    Country: {
        type: String,
        required: true,
        trim: true
    },
    profilepic: {
        type: Buffer
    }
}, {
    timestamps: true,
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    delete userObject.profilepic

    return userObject
}

//below method is used to generate web token 
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'credittapp');
    await user.save()
    return token
}

//below method id used for searching the user by credentials for logging into app
userSchema.statics.findByCredentials = async (Email, Password) => {
    const user = await User.findOne({ Email: Email })
    if (!user) {
        throw new Error("Email is not Register. Please Register!");
    }
    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
        throw new Error("Please enter correct password");
    }
    return user
}
//below is middleware
// hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('Password')) {
        user.Password = await bcrypt.hash(user.Password, 8)
    }
    next();
})

const User = new mongoose.model('User', userSchema);

module.exports = User;