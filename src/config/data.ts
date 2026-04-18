export interface SkillGroup {
  label: string;
  items: string[];
}

export const SKILLS: Record<string, SkillGroup> = {
  frontend: {
    label: "Frontend",
    items: ["HTML5", "CSS3", "JavaScript", "Responsive Design"],
  },
  backend: {
    label: "Backend",
    items: ["Python", "Django", "PostgreSQL", "REST APIs"],
  },
  tools: {
    label: "Tools",
    items: ["Git", "GitHub", "VS Code", "Vercel", "Render"],
  },
  learning: {
    label: "In Training",
    items: ["React", "Node.js", "TypeScript", "Tailwind"],
  },
};

export interface Project {
  codename: string;
  title: string;
  desc: string;
  tech: string[];
  live: string;
  github: string;
  status: string;
}

export const PROJECTS: Project[] = [
  {
    codename: "QUICKGIGS",
    title: "QuickGigs Platform",
    desc: "Full-stack freelance marketplace with user authentication, Stripe payment integration, and complete CRUD operations.",
    tech: ["Django", "Python", "PostgreSQL", "Stripe API"],
    live: "https://quickgigs-django.onrender.com/",
    github: "https://github.com/aransys/quickgigs-django",
    status: "DEPLOYED",
  },
  {
    codename: "WORCESTER",
    title: "Worcester Laundry Service",
    desc: "Responsive landing page with modern CSS animations and accessibility features.",
    tech: ["HTML5", "CSS3", "JavaScript"],
    live: "https://aransys.github.io/Project-1/",
    github: "https://github.com/aransys/Project-1",
    status: "DEPLOYED",
  },
  {
    codename: "SOUNDWAVE",
    title: "Music Explorer",
    desc: "Interactive music discovery application with real-time search and API integration.",
    tech: ["JavaScript", "HTML5", "CSS3", "REST API"],
    live: "https://aransys.github.io/Project-2/",
    github: "https://github.com/aransys/Project-2",
    status: "DEPLOYED",
  },
];

export interface TimelineEntry {
  period: string;
  title: string;
  place: string;
  detail: string;
}

export const TIMELINE: TimelineEntry[] = [
  {
    period: "2025 – Present",
    title: "BSc Computer Science",
    place: "Leeds Beckett University",
    detail:
      "Year 1 — Building foundations in algorithms, data structures, and software engineering.",
  },
  {
    period: "2024 – 2025",
    title: "Level 5 Web Apps Development",
    place: "New City College London",
    detail:
      "Completed with Distinction. Full-stack web development with Django, Python, and PostgreSQL.",
  },
  {
    period: "Previous",
    title: "Lithuanian Professional Army",
    place: "Lithuanian Armed Forces",
    detail:
      "Military service — discipline, teamwork, and leadership under pressure.",
  },
];

export interface OwnerDossierField {
  label: string;
  value: string;
}

export interface Owner {
  name: string;
  dossierFields: OwnerDossierField[];
  bio: string;
}

export const OWNER: Owner = {
  name: "Aurimas Ransys",
  dossierFields: [
    { label: "Designation", value: "Full Stack Developer" },
    { label: "Academic Unit", value: "Leeds Beckett University" },
    { label: "Program", value: "BSc Computer Science — Year 1" },
    { label: "Origin", value: "Kaunas, Lithuania 🇱🇹" },
    { label: "Current Base", value: "Leeds, UK 🇬🇧" },
    { label: "Prior Service", value: "Lithuanian Professional Army" },
    { label: "Clearance", value: "Level 5 — Distinction" },
    { label: "Interests", value: "MMA / Basketball / Sci-fi" },
  ],
  bio: `Full stack developer from Lithuania, currently based in Leeds. I build web applications with Django & Python on the backend and modern JavaScript on the frontend. Completed Level 5 Web Apps Development with Distinction, now pursuing a CS degree. When I'm not coding, I train MMA and cheer for Žalgiris Kaunas. Open to internships and collaboration.`,
};

export interface SocialLink {
  label: string;
  value: string;
  href: string;
  icon: string;
}

export const SOCIALS: SocialLink[] = [
  {
    label: "Email",
    value: "ransys.dev@gmail.com",
    href: "mailto:ransys.dev@gmail.com",
    icon: "✉",
  },
  {
    label: "GitHub",
    value: "aransys",
    href: "https://github.com/aransys",
    icon: "◆",
  },
  {
    label: "LinkedIn",
    value: "aurimas-ransys",
    href: "https://uk.linkedin.com/in/aurimas-ransys",
    icon: "▣",
  },
  {
    label: "Instagram",
    value: "@aurimasran",
    href: "https://www.instagram.com/aurimasran",
    icon: "◈",
  },
];

export interface NavLinkEntry {
  href: string;
  heroLabel: string;
  stickyLabel: string;
}

export const NAV_LINKS: NavLinkEntry[] = [
  { href: "#about", heroLabel: "> about", stickyLabel: "About" },
  { href: "#skills", heroLabel: "> skills", stickyLabel: "Skills" },
  { href: "#projects", heroLabel: "> missions", stickyLabel: "Missions" },
  { href: "#timeline", heroLabel: "> timeline", stickyLabel: "Timeline" },
  { href: "#contact", heroLabel: "> contact", stickyLabel: "Contact" },
];
