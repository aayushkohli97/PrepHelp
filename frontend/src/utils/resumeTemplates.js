// ═══════════════════════════════════════════════════════════════
//  resumeTemplates.js — Deterministic LaTeX Resume Generation
//  Each template maps to a visual design. The functions receive
//  the structured `resumeData` object from the React state and
//  produce a compilable LaTeX string.
// ═══════════════════════════════════════════════════════════════

// --- LaTeX special-character escaper ---
export const escapeLatexText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\textbackslash ')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde ')
    .replace(/\^/g, '\\textasciicircum ');
};

// --- Helper: create LaTeX href ---
const createHref = (url, prefix = '') => {
  if (!url) return '';
  let hrefUrl = String(url).trim();
  if (hrefUrl.includes('@') && !hrefUrl.startsWith('http') && !hrefUrl.startsWith('mailto:')) {
    hrefUrl = 'mailto:' + hrefUrl;
  } else if (!hrefUrl.startsWith('http') && !hrefUrl.startsWith('mailto:')) {
    hrefUrl = 'https://' + hrefUrl;
  }
  const safeUrl = hrefUrl.replace(/%/g, '\\%').replace(/#/g, '\\#');
  return `${prefix}\\href{${safeUrl}}{${escapeLatexText(url)}}`;
};

// --- Flatten the skills object into a single array of strings ---
const flattenSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills; // already flat
  const all = [];
  for (const category of ['languages', 'frameworks', 'tools', 'databases', 'other']) {
    if (Array.isArray(skills[category])) {
      all.push(...skills[category]);
    }
  }
  return all;
};

// --- Format skills as categorised LaTeX lines ---
const formatSkillsCategorised = (skills) => {
  if (!skills || Array.isArray(skills)) return '';
  const lines = [];
  const labels = {
    languages: 'Languages',
    frameworks: 'Frameworks',
    tools: 'Tools',
    databases: 'Databases',
    other: 'Other'
  };
  for (const [key, label] of Object.entries(labels)) {
    const arr = skills[key];
    if (arr && arr.length > 0) {
      lines.push(`\\textbf{${escapeLatexText(label)}:} ${escapeLatexText(arr.join(', '))}`);
    }
  }
  return lines.join(' \\\\\\\\\n');
};

// --- Helper: format bullet points ---
const formatBullets = (bullets) => {
  if (!bullets || bullets.length === 0) return '';
  const filtered = bullets.filter(b => b && b.trim());
  if (filtered.length === 0) return '';
  return `\\begin{itemize}[leftmargin=*, noitemsep, topsep=0pt, parsep=0pt, partopsep=0pt]
${filtered.map(b => `\\item ${escapeLatexText(b)}`).join('\n')}
\\end{itemize}`;
};

// --- Helper: format experience entries ---
const formatExperience = (experienceArray) => {
  if (!experienceArray || experienceArray.length === 0) return '';
  return experienceArray.map(exp => {
    const title = escapeLatexText(exp.title || '');
    const company = escapeLatexText(exp.company || '');
    const startDate = escapeLatexText(exp.startDate || '');
    const endDate = exp.current ? 'Present' : escapeLatexText(exp.endDate || '');
    const bullets = formatBullets(exp.bullets);
    return `\\noindent \\textbf{${title}}, ${company} \\hfill \\textbf{${startDate} -- ${endDate}}\\\\
${bullets}
\\vspace{0.2cm}`;
  }).join('\n');
};

// --- Helper: format education entries ---
const formatEducation = (educationArray) => {
  if (!educationArray || educationArray.length === 0) return '';
  return educationArray.map(edu => {
    const degree = escapeLatexText(edu.degree || '');
    const institution = escapeLatexText(edu.institution || edu.school || '');
    const startDate = escapeLatexText(edu.startDate || '');
    const endDate = escapeLatexText(edu.endDate || '');
    const gpa = edu.gpa ? `GPA: ${escapeLatexText(edu.gpa)}` : '';
    const relevant = edu.relevant ? escapeLatexText(edu.relevant) : '';
    return `\\noindent \\textbf{${degree}} \\hfill \\textbf{${startDate} -- ${endDate}}\\\\
\\textit{${institution}}${gpa ? ` \\hfill ${gpa}` : ''}\\\\
${relevant ? `${relevant}\\\\` : ''}
\\vspace{0.2cm}`;
  }).join('\n');
};

// --- Helper: format project entries ---
const formatProjects = (projectsArray) => {
  if (!projectsArray || projectsArray.length === 0) return '';
  return projectsArray.map(proj => {
    const name = escapeLatexText(proj.name || '');
    const techStack = (proj.techStack || []).map(t => escapeLatexText(t)).join(', ');
    const github = createHref(proj.github, 'GitHub: ');
    const link = createHref(proj.link, 'Link: ');
    
    const extraLinks = [];
    if (github) extraLinks.push(github);
    if (link) extraLinks.push(link);
    const linksStr = extraLinks.join(' | ');

    const secondaryHeader = [
      techStack ? `\\textit{${techStack}}` : '',
      linksStr ? linksStr : ''
    ].filter(Boolean).join(' \\hfill ');

    const bullets = formatBullets(proj.bullets);
    return `\\noindent \\textbf{${name}}${secondaryHeader ? ` \\hfill ${secondaryHeader}` : ''}\\\\
${bullets}
\\vspace{0.2cm}`;
  }).join('\n');
};

// --- Helper: skills as \\item list ---
const formatSkillsList = (skills) => {
  const flat = flattenSkills(skills);
  if (flat.length === 0) return '';
  return flat.map(skill => `\\item ${escapeLatexText(skill)}`).join('\n');
};

// --- Helper: skills as comma-separated ---
const formatSkillsComma = (skills) => {
  const flat = flattenSkills(skills);
  if (flat.length === 0) return '';
  return escapeLatexText(flat.join(', '));
};


// ==========================================
// TEMPLATE 1: Daniel Gallego (Grey Headers)
// ==========================================
export const generateTemplateOne = (data) => {
  const c = data.contact || {};
  const name = escapeLatexText(c.name || 'Your Name');
  const title = escapeLatexText(c.title || '');
  const phone = escapeLatexText(c.phone || '');
  const email = createHref(c.email);
  const location = escapeLatexText(c.location || '');
  const linkedin = createHref(c.linkedin, 'LinkedIn: ');
  const github = createHref(c.github, 'GitHub: ');
  const portfolio = createHref(c.portfolio, 'Portfolio: ');
  const summary = escapeLatexText(data.summary || '');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{left=1.5cm, right=1.5cm, top=1.5cm, bottom=1.5cm}
\\usepackage{xcolor}
\\usepackage[explicit]{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks, pdfnewwindow=true]{hyperref}

\\definecolor{headgray}{HTML}{E0E0E0}
\\titleformat{\\section}{\\normalfont\\Large\\bfseries\\color{black}}{}{0em}{\\colorbox{headgray}{\\makebox[\\dimexpr\\textwidth-2\\fboxsep\\relax][l]{\\strut\\hspace{0.5em}#1}}}
\\titlespacing*{\\section}{0pt}{4ex plus 1ex minus .2ex}{1.5ex plus .2ex}

\\begin{document}
\\pagestyle{empty}

\\noindent
{\\Huge \\textbf{${name}}}\\\\[0.2cm]
${title ? `{\\Large \\textbf{${title}}}\\\\[0.2cm]` : ''}
{\\small ${[location, email, phone, linkedin, github, portfolio].filter(Boolean).join(' | ')}}

\\vspace{0.5cm}

${summary ? `\\section*{SUMMARY}
${summary}

` : ''}\\section*{TECHNICAL SKILLS}
${formatSkillsCategorised(data.skills) || formatSkillsComma(data.skills)}

\\section*{PROFESSIONAL EXPERIENCE}
${formatExperience(data.experience)}

${data.projects && data.projects.length > 0 ? `\\section*{PROJECTS}
${formatProjects(data.projects)}

` : ''}\\section*{EDUCATION}
${formatEducation(data.education)}

\\end{document}`;
};

// ==========================================
// TEMPLATE 2: Sebastian Student (Split Left Grey)
// ==========================================
export const generateTemplateTwo = (data) => {
  const c = data.contact || {};
  const name = escapeLatexText(c.name || 'Your Name');
  const title = escapeLatexText(c.title || '');
  const phone = escapeLatexText(c.phone || '');
  const email = createHref(c.email);
  const location = escapeLatexText(c.location || '');
  const linkedin = createHref(c.linkedin, 'LinkedIn: ');
  const github = createHref(c.github, 'GitHub: ');
  const portfolio = createHref(c.portfolio, 'Portfolio: ');
  const summary = escapeLatexText(data.summary || '');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{left=0.5cm, right=0.5cm, top=0cm, bottom=1cm}
\\usepackage{xcolor}
\\usepackage{paracol}
\\usepackage{enumitem}
\\usepackage[hidelinks, pdfnewwindow=true]{hyperref}

\\definecolor{leftcol}{HTML}{E6E8ED}
\\definecolor{headerbg}{HTML}{D3D8E2}

\\begin{document}
\\pagestyle{empty}

\\noindent
\\colorbox{headerbg}{\\makebox[\\dimexpr\\textwidth-2\\fboxsep\\relax][c]{\\begin{minipage}{\\dimexpr\\textwidth-2\\fboxsep-2\\fboxrule\\relax}
\\vspace{1cm}
\\centering
{\\Huge \\textbf{${name}}}\\\\[0.3cm]
{\\Large ${title}}
\\vspace{1cm}
\\end{minipage}}}

\\vspace{0.5cm}
\\columnratio{0.35}
\\begin{paracol}{2}

\\begin{minipage}{\\linewidth}
\\vspace{0.3cm}
${summary ? `\\textbf{\\large PROFILE}\\\\[0.3cm]
${summary}

\\vspace{0.8cm}` : ''}
\\textbf{\\large CONTACT ME}\\\\[0.3cm]
${phone ? `${phone}\\\\` : ''}
${email ? `${email}\\\\` : ''}
${location ? `${location}\\\\` : ''}
${linkedin ? `${linkedin}\\\\` : ''}
${github ? `${github}\\\\` : ''}
${portfolio ? `${portfolio}` : ''}
\\end{minipage}

\\switchcolumn

\\begin{minipage}{\\linewidth}
\\vspace{0.3cm}
\\textbf{\\large EDUCATION}\\\\[0.3cm]
${formatEducation(data.education)}

\\vspace{0.5cm}
\\textbf{\\large SKILLS}\\\\[0.3cm]
${formatSkillsCategorised(data.skills) || formatSkillsComma(data.skills)}

\\vspace{0.5cm}
\\textbf{\\large WORK EXPERIENCE}\\\\[0.3cm]
${formatExperience(data.experience)}

${data.projects && data.projects.length > 0 ? `\\vspace{0.5cm}
\\textbf{\\large PROJECTS}\\\\[0.3cm]
${formatProjects(data.projects)}` : ''}
\\end{minipage}

\\end{paracol}
\\end{document}`;
};

// ==========================================
// TEMPLATE 3: Sebastian Pro (Minimalist Lines)
// ==========================================
export const generateTemplateThree = (data) => {
  const c = data.contact || {};
  const name = escapeLatexText(c.name || 'Your Name');
  const title = escapeLatexText(c.title || '');
  const phone = escapeLatexText(c.phone || '');
  const email = createHref(c.email);
  const location = escapeLatexText(c.location || '');
  const linkedin = createHref(c.linkedin, 'LinkedIn: ');
  const github = createHref(c.github, 'GitHub: ');
  const portfolio = createHref(c.portfolio, 'Portfolio: ');
  const summary = escapeLatexText(data.summary || '');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{left=1.5cm, right=1.5cm, top=1.5cm, bottom=1.5cm}
\\usepackage{enumitem}
\\usepackage[hidelinks, pdfnewwindow=true]{hyperref}

\\begin{document}
\\pagestyle{empty}

\\begin{center}
{\\Huge \\textbf{${name}}}\\\\[0.2cm]
${title ? `{\\Large ${title}}\\\\[0.2cm]` : ''}
\\small ${[phone, email, location, linkedin, github, portfolio].filter(Boolean).join(' \\hspace{1cm} ')}
\\end{center}
\\vspace{-0.3cm}
\\hrulefill
\\vspace{0.3cm}

${summary ? `\\noindent \\textbf{\\Large ABOUT ME}\\\\
${summary}

\\vspace{0.3cm}
\\hrulefill
\\vspace{0.3cm}

` : ''}\\noindent \\textbf{\\Large EDUCATION}\\\\[0.2cm]
${formatEducation(data.education)}

\\vspace{0.3cm}
\\hrulefill
\\vspace{0.3cm}

\\noindent \\textbf{\\Large WORK EXPERIENCE}\\\\[0.2cm]
${formatExperience(data.experience)}

${data.projects && data.projects.length > 0 ? `\\vspace{0.3cm}
\\hrulefill
\\vspace{0.3cm}

\\noindent \\textbf{\\Large PROJECTS}\\\\[0.2cm]
${formatProjects(data.projects)}

` : ''}\\vspace{0.3cm}
\\hrulefill
\\vspace{0.3cm}

\\noindent \\textbf{\\Large SKILLS}\\\\[0.2cm]
${formatSkillsCategorised(data.skills) || formatSkillsComma(data.skills)}

\\vspace{0.3cm}
\\hrulefill

\\end{document}`;
};

// ==========================================
// TEMPLATE 4: Henrietta Mitchell (Clean Corporate)
// ==========================================
export const generateTemplateFour = (data) => {
  const c = data.contact || {};
  const name = escapeLatexText(c.name || 'Your Name');
  const phone = escapeLatexText(c.phone || '');
  const email = createHref(c.email);
  const location = escapeLatexText(c.location || '');
  const linkedin = createHref(c.linkedin, 'LinkedIn: ');
  const github = createHref(c.github, 'GitHub: ');
  const portfolio = createHref(c.portfolio, 'Portfolio: ');
  const summary = escapeLatexText(data.summary || '');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{left=1.2cm, right=1.2cm, top=1.2cm, bottom=1.2cm}
\\usepackage{enumitem}
\\usepackage[hidelinks, pdfnewwindow=true]{hyperref}

\\begin{document}
\\pagestyle{empty}

\\noindent {\\Huge \\textbf{${name}}}\\\\[0.1cm]
{\\small ${[phone, email, linkedin, github, portfolio].filter(Boolean).join(' $\\cdot$ ')}}\\\\
${location ? `{\\small ${location}}` : ''}

\\vspace{0.2cm}
\\hrule
\\vspace{0.4cm}

${summary ? `\\noindent \\textbf{BUSINESS MANAGEMENT \\& ANALYSIS}\\\\
${summary}

\\vspace{0.2cm}
\\hrule
\\vspace{0.4cm}

` : ''}\\noindent \\textbf{KEY COMPETENCIES}\\\\
${formatSkillsCategorised(data.skills) || formatSkillsComma(data.skills)}

\\vspace{0.2cm}
\\hrule
\\vspace{0.4cm}

\\noindent \\textbf{PROFESSIONAL EXPERIENCE}\\\\
${formatExperience(data.experience)}

${data.projects && data.projects.length > 0 ? `\\vspace{0.2cm}
\\hrule
\\vspace{0.4cm}

\\noindent \\textbf{PROJECTS}\\\\
${formatProjects(data.projects)}

` : ''}\\vspace{0.2cm}
\\hrule
\\vspace{0.4cm}

\\noindent \\textbf{EDUCATION}\\\\
${formatEducation(data.education)}

\\end{document}`;
};

// ==========================================
// TEMPLATE 5: Olivia Sanchez (Blue Tinted Headers)
// ==========================================
export const generateTemplateFive = (data) => {
  const c = data.contact || {};
  const name = escapeLatexText(c.name || 'Your Name');
  const title = escapeLatexText(c.title || '');
  const phone = escapeLatexText(c.phone || '');
  const email = createHref(c.email);
  const location = escapeLatexText(c.location || '');
  const linkedin = createHref(c.linkedin, 'LinkedIn: ');
  const github = createHref(c.github, 'GitHub: ');
  const portfolio = createHref(c.portfolio, 'Portfolio: ');
  const summary = escapeLatexText(data.summary || '');

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{left=1.5cm, right=1.5cm, top=1.5cm, bottom=1.5cm}
\\usepackage{xcolor}
\\usepackage[explicit]{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks, pdfnewwindow=true]{hyperref}

\\definecolor{lightblue}{HTML}{D9E2EC}
\\titleformat{\\section}{\\normalfont\\large\\bfseries\\color{black}}{}{0em}{\\colorbox{lightblue}{\\makebox[\\dimexpr\\textwidth-2\\fboxsep\\relax][l]{\\strut\\hspace{0.5em}#1}}}
\\titlespacing*{\\section}{0pt}{3ex plus 1ex minus .2ex}{1ex plus .2ex}

\\begin{document}
\\pagestyle{empty}

\\begin{center}
{\\Huge \\textbf{${name}}}\\\\[0.2cm]
${title ? `{\\large \\textbf{${title}}}\\\\[0.2cm]` : ''}
{\\small ${[email, phone, location, linkedin, github, portfolio].filter(Boolean).join(' | ')}}
\\end{center}

\\vspace{0.3cm}

${summary ? `\\section*{SUMMARY}
${summary}

` : ''}\\section*{WORK EXPERIENCE}
${formatExperience(data.experience)}

${data.projects && data.projects.length > 0 ? `\\section*{PROJECTS}
${formatProjects(data.projects)}

` : ''}\\section*{EDUCATION}
${formatEducation(data.education)}

\\section*{KEY SKILLS}
${formatSkillsCategorised(data.skills) || formatSkillsComma(data.skills)}

\\end{document}`;
};