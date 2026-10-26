import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { StudentProfile } from './models/StudentProfile.js';
import { BusinessProfile } from './models/BusinessProfile.js';
import { Project } from './models/Project.js';
import { Team } from './models/Team.js';
import { Application } from './models/Application.js';
import { Notification } from './models/Notification.js';

const seedDatabase = async () => {
  await connectDB();

  console.log('🧹 Clearing existing database collections...');
  await Promise.all([
    User.deleteMany(),
    StudentProfile.deleteMany(),
    BusinessProfile.deleteMany(),
    Project.deleteMany(),
    Team.deleteMany(),
    Application.deleteMany(),
    Notification.deleteMany(),
  ]);

  console.log('🌱 Seeding users and profiles...');

  // 1. Create Student User (Rohan)
  const studentUser = await User.create({
    email: 'rohan.verma@college.edu',
    password: 'password123',
    name: 'Rohan Verma',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  });

  const studentProfile = await StudentProfile.create({
    user: studentUser._id,
    college: 'Gyan Ganga College of Technology (GGCT), Jabalpur',
    course: 'B.Tech Computer Science & Engineering',
    graduationYear: 2026,
    bio: 'Full-stack developer focused on React, Node.js, and modern web architectures. Passionate about building fast e-commerce products.',
    selfReportedSkills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Next.js', 'MongoDB', 'REST APIs'],
    interests: ['Web Development', 'E-commerce Platforms', 'Team Leadership'],
    availability: '15-25 hrs/week',
    preferredArrangement: 'Remote',
    experienceLevel: 'Intermediate',
    githubUrl: 'https://github.com/rohan-verma-demo',
    linkedinUrl: 'https://linkedin.com/in/rohan-verma-demo',
    portfolioItems: [
      {
        title: 'Local Kirana Online Order System',
        description: 'A responsive web catalog allowing neighborhood grocery customers to browse inventory and submit orders.',
        projectType: 'Web Development',
        technologies: ['React', 'Tailwind CSS', 'Vite', 'MongoDB'],
        skillsDemonstrated: ['Frontend Architecture', 'State Management'],
        githubUrl: 'https://github.com/rohan/kirana-orders',
        liveUrl: 'https://kirana-demo.netlify.app',
      },
    ],
  });

  // 2. Create Second Student User (Ananya)
  const studentUser2 = await User.create({
    email: 'ananya.sharma@college.edu',
    password: 'password123',
    name: 'Ananya Sharma',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const studentProfile2 = await StudentProfile.create({
    user: studentUser2._id,
    college: 'BITS Pilani',
    course: 'B.E. Computer Science',
    graduationYear: 2026,
    bio: 'Product Designer and Frontend Developer. I craft thoughtful user journeys and design systems.',
    selfReportedSkills: ['Figma', 'UI/UX Design', 'React', 'Tailwind CSS', 'Design Systems'],
    interests: ['Product Design', 'Consumer Tech'],
    availability: '15-25 hrs/week',
    preferredArrangement: 'Remote',
    experienceLevel: 'Advanced',
  });

  // 3. Create Business User (Bangalore TechRetail)
  const businessUser = await User.create({
    email: 'contact@techretail.in',
    password: 'password123',
    name: 'Bangalore TechRetail',
    role: 'business',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
  });

  const businessProfile = await BusinessProfile.create({
    user: businessUser._id,
    companyName: 'Bangalore TechRetail',
    businessType: 'Retail & D2C',
    description: 'Regional omnichannel retail chain specializing in tech gadgets and consumer accessories across South India.',
    websiteUrl: 'https://techretail.in',
    location: 'Bangalore, Karnataka',
    contactPerson: 'Suresh Menon (Head of Digital)',
    isVerified: true,
  });

  // 4. Create Admin User
  await User.create({
    email: 'admin@internbridge.in',
    password: 'password123',
    name: 'Platform Administrator',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  });

  console.log('🌱 Seeding Projects...');
  const project1 = await Project.create({
    business: businessProfile._id,
    businessUser: businessUser._id,
    title: 'Customer Loyalty & WhatsApp Automation Engine',
    category: 'Automation & Tools',
    budgetAmount: 22000,
    durationWeeks: 4,
    shortDescription: 'Build an automated WhatsApp campaign workflow for abandoned carts and loyalty rewards integration.',
    fullDescription: 'We operate 8 retail outlets and an online catalog storefront. We want to implement an automated notification microservice using WhatsApp Business Cloud API that sends abandoned cart reminders and loyalty points updates.',
    deliverables: [
      'Node.js microservice handling WhatsApp Business Cloud API triggers',
      'Webhook listener verifying payment and cart updates',
      'Admin analytics view displaying delivery and click-through rates',
    ],
    requiredSkills: ['Node.js', 'REST APIs', 'Webhooks', 'WhatsApp Cloud API'],
    arrangement: 'Remote',
    status: 'Open',
    applicantCount: 1,
  });

  const project2 = await Project.create({
    business: businessProfile._id,
    businessUser: businessUser._id,
    title: 'Next-Gen E-Commerce PWA Storefront',
    category: 'Full-Stack Web',
    budgetAmount: 25000,
    durationWeeks: 5,
    shortDescription: 'Looking for a 3-student squad to build a lightning-fast React PWA storefront with secure checkout integration.',
    fullDescription: 'We need to upgrade our client portal into a progressive web application (PWA) with offline support, instant product catalog filtering, and mobile-first aesthetics.',
    deliverables: [
      'Fast React 19 / Vite storefront with high Lighthouse scores',
      'PWA Service Worker caching catalog assets for offline browsing',
      'Integrated Razorpay test sandbox checkout flow',
    ],
    requiredSkills: ['React', 'Tailwind CSS', 'PWA', 'REST APIs'],
    arrangement: 'Remote',
    status: 'Open',
    applicantCount: 0,
  });

  console.log('🌱 Seeding Squads / Teams...');
  const team1 = await Team.create({
    name: 'ByteCraft Innovators',
    description: 'Cross-disciplinary student squad combining full-stack development, cloud microservices, and clean UI engineering.',
    leader: studentProfile._id,
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    combinedSkills: ['React', 'Node.js', 'Figma', 'UI/UX Design', 'Tailwind CSS', 'REST APIs'],
    projectInterests: ['E-commerce Platforms', 'Automation & Tools'],
    openPositions: ['Backend Go Engineer'],
    members: [
      {
        student: studentProfile._id,
        role: 'Team Lead & Full-Stack',
        isLeader: true,
      },
      {
        student: studentProfile2._id,
        role: 'Product Designer',
        isLeader: false,
      },
    ],
  });

  console.log('🌱 Seeding Applications & Notifications...');
  await Application.create({
    project: project1._id,
    business: businessProfile._id,
    applicantType: 'individual',
    student: studentProfile._id,
    proposalText: 'I have hands-on experience building Node.js webhooks and REST integrations as demonstrated in my portfolio kirana order system.',
    relevantSkills: ['Node.js', 'REST APIs', 'React'],
    availability: '15-25 hrs/week',
    estimatedTimeline: '4 weeks',
    status: 'Pending',
    matchScore: 92,
    matchReasons: [
      'Matches 3 required skill(s): Node.js, REST APIs',
      'Has active showcase portfolio work in adjacent technical domains',
      'Availability comfortably matches duration',
    ],
  });

  await Notification.create({
    recipient: studentUser._id,
    title: 'Welcome to InternBridge!',
    message: 'Your student profile has been created. Explore open briefs and form project squads.',
    type: 'system',
    link: '/projects',
  });

  console.log('✅ Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Test Accounts (Password for all: password123)');
  console.log('Student 1:  rohan.verma@college.edu');
  console.log('Student 2:  ananya.sharma@college.edu');
  console.log('Business:   contact@techretail.in');
  console.log('Admin:      admin@internbridge.in');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
