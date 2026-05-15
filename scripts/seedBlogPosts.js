/**
 * Seed platform blog posts for the public Knowledge Hub.
 * Run: node scripts/seedBlogPosts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const BlogPost = require('../models/blogModel');
const User = require('../models/userModel');

const POSTS = [
  {
    title: 'The Future of Personalized Learning in Nigerian Schools',
    subtitle: 'How AI is tailoring education to every student’s pace and style',
    category: 'AI in Classroom',
    featured: true,
    readTime: '6 min read',
    tags: ['EdTech', 'AI', 'Personalization'],
    coverImage: '/assets/teacher-main.png',
    content: `Artificial intelligence is reshaping how Nigerian schools deliver instruction. EduCore AI helps teachers identify learning gaps early and recommend targeted support before students fall behind.

Schools using adaptive learning modules report stronger engagement in core subjects and fewer end-of-term surprises on report cards.

The key is pairing automation with teacher judgment — AI handles pattern detection while educators focus on mentorship and classroom culture.`,
  },
  {
    title: 'Expanding our Reach: 50 New Schools Joined EduCore',
    subtitle: 'Quarterly growth update from the EduCore team',
    category: 'Company News',
    readTime: '4 min read',
    tags: ['Company', 'Growth'],
    coverImage: '/assets/analytics-chart.png',
    content: `We are proud to welcome fifty additional schools to the EduCore ecosystem this quarter. Each onboarding includes staff training, data migration support, and a dedicated success manager.

Our goal remains the same: give every Nigerian school modern tools for attendance, results, fees, and parent communication without overwhelming administrative teams.`,
  },
  {
    title: '10 Tips for Effective Digital Grading and Feedback',
    subtitle: 'Practical workflows for teachers using EduCore',
    category: 'Educational Tips',
    readTime: '7 min read',
    tags: ['Grading', 'Teachers'],
    coverImage: '/assets/hero.png',
    content: `Digital grading saves time when it is structured. Start with clear rubrics, batch similar assignments, and use comment banks for common feedback.

EduCore’s results module lets you enter scores once and publish to parents when ready — reducing duplicate data entry across spreadsheets.

Always review outliers before release; AI suggestions are helpful, but professional judgment stays with the teacher.`,
  },
  {
    title: 'Case Study: Government College Lagos Attendance Surge',
    subtitle: 'How automated alerts improved daily presence',
    category: 'Case Studies',
    readTime: '5 min read',
    tags: ['Attendance', 'Case Study'],
    coverImage: '/assets/teacher-group.png',
    content: `Government College Lagos piloted EduCore attendance alerts for one term. Daily registers synced to the dashboard, and parents received notifications for unexplained absences.

Within twelve weeks, average attendance improved measurably. Administrators attributed the gain to faster follow-up and clearer accountability.`,
  },
  {
    title: 'Integrating AI Without Losing the Human Touch',
    subtitle: 'Best practices for school leaders',
    category: 'AI in Classroom',
    readTime: '8 min read',
    tags: ['Leadership', 'AI'],
    coverImage: '/assets/parent_portal.png',
    content: `Technology should amplify relationships, not replace them. Set policies for when AI recommendations require human approval, especially for discipline and promotion decisions.

Train staff on interpreting analytics dashboards and involve parents through transparent communication about how data is used.`,
  },
  {
    title: 'The Future of School Management: 5 AI Tips to Transform Efficiency',
    subtitle: 'A strategic guide for principals and bursars',
    category: 'AI Strategy',
    readTime: '8 min read',
    tags: ['SchoolManagement', 'AI', 'NigeriaEducation'],
    coverImage: '/assets/hero.png',
    content: `1. Automate attendance tracking and parent notifications.\n\n2. Use predictive analytics on fee collections to reduce defaulters.\n\n3. Standardize result computation to cut release delays.\n\n4. Centralize announcements instead of scattered WhatsApp threads.\n\n5. Review class performance trends monthly with your academic team.\n\nEduCore AI bundles these workflows so leadership can focus on culture and learning outcomes.`,
  },
];

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGO_URI or MONGODB_URI');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const author =
    (await User.findOne({ role: 'super_admin' })) ||
    (await User.findOne({ role: 'school_owner' })) ||
    (await User.findOne());

  if (!author) {
    console.error('No user found to assign as blog author. Seed users first.');
    process.exit(1);
  }

  const existing = await BlogPost.countDocuments();
  if (existing > 0) {
    console.log(`Skipping seed: ${existing} blog post(s) already exist.`);
    await mongoose.disconnect();
    return;
  }

  await BlogPost.insertMany(
    POSTS.map((p) => ({ ...p, author: author._id, published: true }))
  );
  console.log(`Seeded ${POSTS.length} blog posts (author: ${author.email}).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
