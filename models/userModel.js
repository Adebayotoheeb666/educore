const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minLength: [8, 'Password must be at least 8 characters long'],
        },
        role: {
            type: String,
            enum: [
                'principal',
                'vp_admin',
                'vp_academics',
                'admin_staff',
                'class_teacher',
                'subject_teacher',
                'bursar',
                'school_owner',
                'parent',
                'student',
                'super_admin',
            ],
            required: true,
        },
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'School',
            required: function () {
                return this.role !== 'super_admin';
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        phone: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        avatar: {
            type: String,
        },
        parents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false, // For students to link to multiple parents
        }],
        children: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        }],
        // Student-specific fields
        admissionNo: { type: String },
        dob: { type: Date },
        gender: { type: String, enum: ['Male', 'Female', ''] },
        parentPhone: { type: String },
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
