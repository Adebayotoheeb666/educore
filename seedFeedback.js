const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Feedback = require('./models/feedbackModel');
const User = require('./models/userModel');
const School = require('./models/schoolModel');

dotenv.config();

const seedFeedback = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get some users and schools
        const superAdmin = await User.findOne({ role: 'super_admin' });
        const schoolAdmin = await User.findOne({ role: 'school_owner' });
        const school = await School.findOne();

        if (!superAdmin || !schoolAdmin || !school) {
            console.error('Required seed data (users/schools) not found. Please run main seeds first.');
            process.exit(1);
        }

        const sampleFeedbacks = [
            {
                sender: schoolAdmin._id,
                targetType: 'platform',
                schoolId: school._id,
                category: 'feature_request',
                subject: 'AI Timetable Flexibility',
                content: 'We would love to see more options for teacher constraints in the AI timetable generator.',
                rating: 4,
                status: 'pending'
            },
            {
                sender: schoolAdmin._id,
                targetType: 'platform',
                schoolId: school._id,
                category: 'bug',
                subject: 'Attendance Report Alignment',
                content: 'The PDF export for attendance reports has some alignment issues on mobile devices.',
                rating: 3,
                status: 'reviewed',
                response: 'Thank you for reporting this. We are looking into the PDF rendering engine.',
                responseDate: new Date(),
                respondedBy: superAdmin._id
            },
            {
                sender: superAdmin._id,
                targetType: 'school',
                schoolId: school._id,
                category: 'suggestion',
                subject: 'Optimizing Student Records',
                content: 'We noticed your school has many incomplete student profiles. Completing these will improve your AI insights accuracy.',
                rating: 5,
                status: 'pending'
            }
        ];

        await Feedback.deleteMany({});
        await Feedback.insertMany(sampleFeedbacks);

        console.log('Feedback seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding feedback:', error);
        process.exit(1);
    }
};

seedFeedback();
