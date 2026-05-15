require('dotenv').config();
const mongoose = require('mongoose');
const curriculum = require('../ai/nerdc_curriculum.json');
const Subject = require('../models/subjectModel');

const seedNERDCData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Seeding NERDC reference data...');

  const allSubjects = new Set();
  const allLevels = [
    ...Object.keys(curriculum.primary || {}),
    ...Object.keys(curriculum.secondary || {}),
  ];

  for (const level of allLevels) {
    const section = curriculum.primary?.[level] || curriculum.secondary?.[level] || {};
    for (const subject of Object.keys(section)) {
      allSubjects.add(subject);
    }
  }

  console.log(`Found ${allSubjects.size} unique subjects in NERDC curriculum.`);

  const nerdcTopicsMap = {};
  for (const [level, subjects] of Object.entries({ ...curriculum.primary, ...curriculum.secondary })) {
    for (const [subject, topics] of Object.entries(subjects)) {
      if (!nerdcTopicsMap[subject]) nerdcTopicsMap[subject] = {};
      nerdcTopicsMap[subject][level] = topics;
    }
  }

  // Store curriculum map as a JSON file for quick access
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '../ai/nerdc_topics_map.json');
  fs.writeFileSync(outputPath, JSON.stringify(nerdcTopicsMap, null, 2));

  console.log(`NERDC topics map written to ${outputPath}`);
  console.log('Subjects in curriculum:', Array.from(allSubjects).join(', '));
  console.log('Class levels covered:', allLevels.join(', '));

  await mongoose.disconnect();
  console.log('NERDC data seeding complete.');
};

seedNERDCData().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
