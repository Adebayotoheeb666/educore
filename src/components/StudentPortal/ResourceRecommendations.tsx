import { BookOpen, Video, Globe, PlayCircle } from 'lucide-react';
import { useMemo } from 'react';
import type { ExamResult } from '../../lib/types';

interface Resource {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'website' | 'article' | 'interactive';
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  isPremium?: boolean;
}

interface ResourceRecommendationsProps {
  results: ExamResult[];
  weaknessThreshold?: number; // Score below which subject is considered weak (default: 70)
}

// Curated resource database
const RESOURCE_DATABASE: Resource[] = [
  // Mathematics
  {
    id: 'khan-algebra',
    name: 'Khan Academy: Algebra Basics',
    url: 'https://www.khanacademy.org/math/algebra',
    type: 'video',
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'beginner',
    duration: '20+ hours',
  },
  {
    id: 'paul-math',
    name: "Paul's Online Math Notes",
    url: 'https://tutorial.math.lamar.edu/',
    type: 'website',
    subject: 'Mathematics',
    topic: 'All Topics',
    difficulty: 'intermediate',
  },
  {
    id: 'desmos-graphing',
    name: 'Desmos Graphing Calculator',
    url: 'https://www.desmos.com/calculator',
    type: 'interactive',
    subject: 'Mathematics',
    topic: 'Graphing',
    difficulty: 'beginner',
  },
  {
    id: '3blue1brown-calc',
    name: 'Essence of Algebra (3Blue1Brown)',
    url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDdPTmh7TqXl7vrIEIPCvosO',
    type: 'video',
    subject: 'Mathematics',
    topic: 'Algebra',
    difficulty: 'intermediate',
  },

  // Physics
  {
    id: 'crash-course-physics',
    name: 'Crash Course Physics',
    url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0ge7yRdPSqJww7wdC2DMl',
    type: 'video',
    subject: 'Physics',
    topic: 'General Physics',
    difficulty: 'beginner',
  },
  {
    id: 'physics-classroom',
    name: 'The Physics Classroom',
    url: 'https://www.physicsclassroom.com/',
    type: 'website',
    subject: 'Physics',
    topic: 'All Topics',
    difficulty: 'intermediate',
  },
  {
    id: 'phet-simulations',
    name: 'PhET Physics Simulations',
    url: 'https://phet.colorado.edu/en/simulations',
    type: 'interactive',
    subject: 'Physics',
    topic: 'Mechanics & Waves',
    difficulty: 'beginner',
  },
  {
    id: 'walter-lewin-physics',
    name: 'Walter Lewin Physics Lectures',
    url: 'https://www.youtube.com/playlist?list=PLUdYlQf0_sSsX2mUbD7-hjFUApKzqx8FR',
    type: 'video',
    subject: 'Physics',
    topic: 'Classical Mechanics',
    difficulty: 'advanced',
  },

  // Chemistry
  {
    id: 'crash-course-chemistry',
    name: 'Crash Course Chemistry',
    url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPHzzYuWJCdoCkwB4bOQR1e',
    type: 'video',
    subject: 'Chemistry',
    topic: 'General Chemistry',
    difficulty: 'beginner',
  },
  {
    id: 'khan-chemistry',
    name: 'Khan Academy: Chemistry',
    url: 'https://www.khanacademy.org/science/chemistry',
    type: 'video',
    subject: 'Chemistry',
    topic: 'All Topics',
    difficulty: 'intermediate',
  },
  {
    id: 'molecular-viewer',
    name: 'Jmol: Molecular Viewer',
    url: 'http://www.jmol.org/',
    type: 'interactive',
    subject: 'Chemistry',
    topic: 'Molecular Structure',
    difficulty: 'intermediate',
  },

  // English
  {
    id: 'crash-course-literature',
    name: 'Crash Course Literature',
    url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNM_5XUqiztAiQM0A-Zo_5-',
    type: 'video',
    subject: 'English',
    topic: 'Literature',
    difficulty: 'intermediate',
  },
  {
    id: 'grammarly',
    name: 'Grammarly Writing Guide',
    url: 'https://www.grammarly.com/blog/writing-guide/',
    type: 'website',
    subject: 'English',
    topic: 'Writing & Grammar',
    difficulty: 'beginner',
  },
  {
    id: 'ted-ed-english',
    name: 'TED-Ed English Lessons',
    url: 'https://www.youtube.com/watch?v=FvzFZn0gYyA&list=PL8dPuuaLjXtPvdgLNX7g8A0sSoZc-QfJt',
    type: 'video',
    subject: 'English',
    topic: 'Literature & Writing',
    difficulty: 'intermediate',
  },

  // Biology
  {
    id: 'amoeba-sisters-biology',
    name: 'Amoeba Sisters Biology',
    url: 'https://www.youtube.com/playlist?list=PLJickJojmG-6d0OJN37-Uj58_3XM5dXlH',
    type: 'video',
    subject: 'Biology',
    topic: 'General Biology',
    difficulty: 'beginner',
  },
  {
    id: 'khan-biology',
    name: 'Khan Academy: Biology',
    url: 'https://www.khanacademy.org/science/biology',
    type: 'video',
    subject: 'Biology',
    topic: 'All Topics',
    difficulty: 'intermediate',
  },
  {
    id: 'bozeman-science',
    name: 'Bozeman Science',
    url: 'https://www.youtube.com/user/Amoebasisters',
    type: 'video',
    subject: 'Biology',
    topic: 'All Topics',
    difficulty: 'intermediate',
  },

  // History
  {
    id: 'crash-course-history',
    name: 'Crash Course World History',
    url: 'https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9',
    type: 'video',
    subject: 'History',
    topic: 'World History',
    difficulty: 'beginner',
  },
  {
    id: 'history-hit',
    name: 'History Hit',
    url: 'https://www.historyhit.com/',
    type: 'website',
    subject: 'History',
    topic: 'All History Topics',
    difficulty: 'intermediate',
    isPremium: true,
  },

  // Geography
  {
    id: 'crash-course-geography',
    name: 'Crash Course Geography',
    url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOauaVEEBCUUHjNucRL3Ta_',
    type: 'video',
    subject: 'Geography',
    topic: 'Human & Physical Geography',
    difficulty: 'beginner',
  },
  {
    id: 'national-geographic',
    name: 'National Geographic Learning',
    url: 'https://www.nationalgeographic.com/education/',
    type: 'website',
    subject: 'Geography',
    topic: 'All Geography Topics',
    difficulty: 'beginner',
  },
];

export function ResourceRecommendations({
  results,
  weaknessThreshold = 70,
}: ResourceRecommendationsProps) {
  const recommendations = useMemo(() => {
    if (!results || results.length === 0) return {};

    // Calculate average score per subject
    const scoreBySubject: Record<string, number[]> = {};
    results.forEach((result) => {
      if (!scoreBySubject[result.subjectId]) {
        scoreBySubject[result.subjectId] = [];
      }
      scoreBySubject[result.subjectId].push(result.totalScore);
    });

    // Find weak subjects
    const weakSubjects: Record<string, { avg: number; topics: string[] }> = {};
    Object.entries(scoreBySubject).forEach(([subject, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore < weaknessThreshold) {
        weakSubjects[subject] = { avg: avgScore, topics: [] };
      }
    });

    // Get resources for weak subjects
    const recs: Record<string, Resource[]> = {};
    Object.keys(weakSubjects).forEach((subject) => {
      recs[subject] = RESOURCE_DATABASE.filter(
        (r) =>
          r.subject === subject &&
          (r.difficulty === 'beginner' || r.difficulty === 'intermediate')
      ).slice(0, 4);
    });

    return recs;
  }, [results, weaknessThreshold]);

  if (Object.keys(recommendations).length === 0) {
    return (
      <div className="p-6 bg-dark-card rounded-lg border border-teal-500/20">
        <p className="text-dark-text text-center">
          Great job! Your performance is strong across all subjects. No remedial resources needed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-text mb-2">Recommended Learning Resources</h2>
        <p className="text-dark-text/70">
          Based on your performance, here are curated resources to help you improve
        </p>
      </div>

      {Object.entries(recommendations).map(([subject, resources]) => (
        <div key={subject} className="space-y-3">
          <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <BookOpen size={20} />
            {subject}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Resource Card Component
function ResourceCard({ resource }: { resource: Resource }) {
  const typeIcons: Record<string, React.ReactNode> = {
    video: <Video className="text-red-400" size={18} />,
    website: <Globe className="text-blue-400" size={18} />,
    article: <BookOpen className="text-yellow-400" size={18} />,
    interactive: <PlayCircle className="text-green-400" size={18} />,
  };

  const typeLabels: Record<string, string> = {
    video: 'Video',
    website: 'Website',
    article: 'Article',
    interactive: 'Interactive',
  };

  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="p-4 bg-dark-card rounded-lg border border-teal-500/20 hover:border-teal-500/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {typeIcons[resource.type]}
          <div className="flex-1">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-400 hover:text-teal-300 transition-colors line-clamp-2"
            >
              {resource.name}
            </a>
            <p className="text-sm text-dark-text/70 mt-1">{resource.topic}</p>
          </div>
        </div>
        {resource.isPremium && (
          <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full whitespace-nowrap ml-2">
            Premium
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${difficultyColors[resource.difficulty]}`}>
          {resource.difficulty.charAt(0).toUpperCase() + resource.difficulty.slice(1)}
        </span>

        {resource.duration && (
          <span className="text-xs text-dark-text/60">⏱ {resource.duration}</span>
        )}

        <span className="text-xs px-2 py-1 bg-dark-bg rounded text-dark-text/70">
          {typeLabels[resource.type]}
        </span>
      </div>

      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded font-semibold transition-colors"
      >
        Access Resource
      </a>
    </div>
  );
}
