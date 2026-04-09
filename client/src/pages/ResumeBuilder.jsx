import { useState, useEffect, useRef } from 'react';
import Handlebars from 'handlebars';
import { resumeAPI } from '../services/api';
import {
  HiOutlineUpload, HiOutlinePencil, HiOutlineSparkles, HiOutlineDownload,
  HiOutlineTrash, HiOutlinePlus, HiOutlineEye, HiOutlineDocumentText,
  HiOutlineLightningBolt, HiOutlineCheckCircle, HiOutlineExclamation
} from 'react-icons/hi';
import './ResumeBuilder.css';

const targetRoles = [
  'SDE-1', 'SDE-2', 'Backend Engineer', 'Frontend Engineer',
  'Full Stack Developer', 'Data Scientist', 'ML Engineer',
  'DevOps Engineer', 'Data Analyst', 'Product Manager'
];

const templates = [
  { id: 'modern', name: 'Olivia Sanchez', image: 'https://placehold.co/120x160?text=Olivia' },
  { id: 'minimalist', name: 'Sebastian Student', image: 'https://placehold.co/120x160?text=Minimalist' },
  { id: 'corporate', name: 'Henrietta Mitchell', image: 'https://placehold.co/120x160?text=Corporate' },
  { id: 'tech', name: 'Sebastian Accountant', image: 'https://placehold.co/120x160?text=Tech' },
  { id: 'creative', name: 'Daniel Gallego', image: 'https://placehold.co/120x160?text=Creative' },
  { id: 'custom', name: 'Custom Template', image: 'https://placehold.co/120x160?text=Custom+CSS' }
];

const emptyResume = {
  contact: { name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', location: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: { languages: [], frameworks: [], tools: [], databases: [], other: [] },
  certifications: [],
  customCss: ''
};

/* ──────────────────────────────────────────────────────────────
   Live HTML Resume Renderer — renders resume data as a clean,
   professional A4‑style page INSTANTLY in the browser.
   No external LaTeX service needed for preview.
   ────────────────────────────────────────────────────────────── */
const TemplateRenderer = ({ sections }) => {
  const { contact, summary, experience, education, projects, skills, certifications } = sections || {};
  const allSkills = [
    ...(skills?.languages || []),
    ...(skills?.frameworks || []),
    ...(skills?.tools || []),
    ...(skills?.databases || []),
    ...(skills?.other || [])
  ].filter(Boolean);

  return (
    <div className="live-resume-page">
      {/* Header */}
      <header className="lr-header">
        <h1>{contact?.name || 'Your Name'}</h1>
        <div className="lr-contact-row">
          {[contact?.email, contact?.phone, contact?.location, contact?.linkedin, contact?.github, contact?.portfolio]
            .filter(Boolean)
            .map((item, i) => <span key={i}>{item}</span>)}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="lr-section">
          <h2>Summary</h2>
          <hr className="lr-rule" />
          <p className="lr-summary">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience?.length > 0 && (
        <section className="lr-section">
          <h2>Experience</h2>
          <hr className="lr-rule" />
          {experience.map((exp, i) => (
            <div key={i} className="lr-entry">
              <div className="lr-entry-header">
                <div><strong>{exp.title}</strong>{exp.company ? `, ${exp.company}` : ''}{exp.location ? ` — ${exp.location}` : ''}</div>
                <div className="lr-date">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : exp.current ? ' – Present' : ''}</div>
              </div>
              {exp.bullets?.filter(Boolean).length > 0 && (
                <ul className="lr-bullets">
                  {exp.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <section className="lr-section">
          <h2>Education</h2>
          <hr className="lr-rule" />
          {education.map((edu, i) => (
            <div key={i} className="lr-entry">
              <div className="lr-entry-header">
                <div><strong>{edu.degree}</strong>{edu.institution ? `, ${edu.institution}` : ''}{edu.location ? ` — ${edu.location}` : ''}</div>
                <div className="lr-date">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}{edu.gpa ? `  |  GPA: ${edu.gpa}` : ''}</div>
              </div>
              {edu.relevant && <p className="lr-relevant">{edu.relevant}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects?.length > 0 && (
        <section className="lr-section">
          <h2>Projects</h2>
          <hr className="lr-rule" />
          {projects.map((proj, i) => (
            <div key={i} className="lr-entry">
              <div className="lr-entry-header">
                <div>
                  <strong>{proj.name}</strong>
                  {proj.techStack?.filter(Boolean).length > 0 && (
                    <span className="lr-tech"> [{proj.techStack.filter(Boolean).join(', ')}]</span>
                  )}
                </div>
                {(proj.link || proj.github) && (
                  <div className="lr-date">{proj.link || proj.github}</div>
                )}
              </div>
              {proj.description && <p className="lr-desc">{proj.description}</p>}
              {proj.bullets?.filter(Boolean).length > 0 && (
                <ul className="lr-bullets">
                  {proj.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills  */}
      {allSkills.length > 0 && (
        <section className="lr-section">
          <h2>Skills</h2>
          <hr className="lr-rule" />
          <div className="lr-skills-grid">
            {skills?.languages?.length > 0 && <div><strong>Languages:</strong> {skills.languages.join(', ')}</div>}
            {skills?.frameworks?.length > 0 && <div><strong>Frameworks:</strong> {skills.frameworks.join(', ')}</div>}
            {skills?.tools?.length > 0 && <div><strong>Tools:</strong> {skills.tools.join(', ')}</div>}
            {skills?.databases?.length > 0 && <div><strong>Databases:</strong> {skills.databases.join(', ')}</div>}
            {skills?.other?.length > 0 && <div><strong>Other:</strong> {skills.other.join(', ')}</div>}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications?.filter(Boolean).length > 0 && (
        <section className="lr-section">
          <h2>Certifications</h2>
          <hr className="lr-rule" />
          <ul className="lr-bullets">
            {certifications.filter(Boolean).map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
};

const ResumeBuilder = () => {
  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [sections, setSections] = useState(emptyResume);
  const [targetRole, setTargetRole] = useState('SDE-1');
  const [template, setTemplate] = useState('modern');
  const [latexTemplate, setLatexTemplate] = useState('');
  const [title, setTitle] = useState('My Resume');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [activeSection, setActiveSection] = useState('contact');
  const [view, setView] = useState('editor'); // editor | preview | analysis
  const [previewMode, setPreviewMode] = useState('template'); // pdf | template
  const [skillInput, setSkillInput] = useState('');

  const mergeWithEmpty = (data) => ({
    ...emptyResume,
    ...data,
    contact: { ...emptyResume.contact, ...(data?.contact || {}) },
    skills: { ...emptyResume.skills, ...(data?.skills || {}) },
    experience: data?.experience || [],
    education: data?.education || [],
    projects: data?.projects || []
  });

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const res = await resumeAPI.getAll();
      setResumes(res.data);
    } catch (err) { /* empty */ }
  };

  const createNewResume = async () => {
    setLoading(true);
    try {
      const newTitle = 'New Resume';
      const res = await resumeAPI.create({ title: newTitle, targetRole: 'SDE-1', sections: emptyResume, template: 'modern' });
      setActiveResume(res.data);
      setSections(mergeWithEmpty(res.data.sections));
      setTargetRole('SDE-1');
      setTemplate('modern');
      setLatexTemplate('');
      setTitle(newTitle);
      setAnalysis(null);
      await loadResumes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create resume');
    } finally {
      setLoading(false);
    }
  };

  const loadResume = async (id) => {
    try {
      const res = await resumeAPI.getOne(id);
      const r = res.data;
      setActiveResume(r);
      setSections(mergeWithEmpty(r.sections));
      setTargetRole(r.targetRole || 'SDE-1');
      setTemplate(r.template || 'modern');
      setLatexTemplate(r.latexTemplate || '');
      setTitle(r.title || 'My Resume');
      setAnalysis(r.aiAnalysis?.overallScore ? r.aiAnalysis : null);
      setPreviewMode('template'); // ALWAYS show live template by default
      setView('editor');
    } catch (err) {
      alert('Failed to load resume');
    }
  };

  const saveResume = async () => {
    if (!activeResume) return;
    setLoading(true);
    try {
      await resumeAPI.update(activeResume._id, { sections, targetRole, template, title, latexTemplate });
    } catch (err) {
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const analyzeResume = async (force = false) => {
    if (!activeResume) return;

    // If analysis already loaded and not forcing, just show it
    if (!force && analysis) {
      setView('analysis');
      return;
    }

    setAnalyzing(true);
    try {
      await resumeAPI.update(activeResume._id, { sections, targetRole });
      const res = await resumeAPI.analyze(activeResume._id);
      setAnalysis(res.data.analysis);
      setView('analysis');
    } catch (err) {
      alert(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const optimizeResume = async () => {
    if (!activeResume) return;
    setOptimizing(true);
    try {
      const res = await resumeAPI.optimize(activeResume._id);
      if (res.data.resume?.sections) {
        setSections(res.data.resume.sections);
      }
    } catch (err) {
      alert('Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('targetRole', targetRole);
      const res = await resumeAPI.upload(formData);
      setActiveResume(res.data);
      setSections(mergeWithEmpty(res.data.sections));
      setLatexTemplate(res.data.latexTemplate || '');
      setPreviewMode('template');
      setView('preview');
      await loadResumes();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload & Parsing failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await resumeAPI.delete(id);
      if (activeResume?._id === id) {
        setActiveResume(null);
        setSections(emptyResume);
        setAnalysis(null);
      }
      await loadResumes();
    } catch (err) {
      console.error('Delete failed error: ', err.response || err);
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateContact = (field, value) => {
    setSections(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  };

  const addExperience = () => {
    setSections(prev => ({
      ...prev,
      experience: [...prev.experience, { title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }]
    }));
  };

  const addEducation = () => {
    setSections(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', location: '', startDate: '', endDate: '', gpa: '', relevant: '' }]
    }));
  };

  const addProject = () => {
    setSections(prev => ({
      ...prev,
      projects: [...prev.projects, { name: '', description: '', techStack: [], link: '', github: '', bullets: [''] }]
    }));
  };

  const addSkill = (category) => {
    if (!skillInput.trim()) return;
    setSections(prev => ({
      ...prev,
      skills: { ...prev.skills, [category]: [...(prev.skills[category] || []), skillInput.trim()] }
    }));
    setSkillInput('');
  };

  const removeSkill = (category, index) => {
    setSections(prev => ({
      ...prev,
      skills: { ...prev.skills, [category]: prev.skills[category].filter((_, i) => i !== index) }
    }));
  };

  const downloadPDF = () => {
    window.print();
  };

  const overallScore = analysis?.overallScore || 0;
  const atsScore = analysis?.atsScore || 0;
  const scoreColor = (s) => s >= 70 ? '#00b894' : s >= 40 ? '#fdcb6e' : '#ff6b6b';

  return (
    <div className="page resume-page" id="resume-page">
      <div className="page-header">
        <h1>Resume Builder</h1>
        <p>Create, optimize, and download ATS-ready resumes with AI</p>
      </div>

      <div className="resume-layout">
        {/* Left Panel - Resume List & Upload */}
        <div className="resume-sidebar glass-card">
          <div className="resume-sidebar-header">
            <h3>My Resumes</h3>
          </div>

          <div className="resume-upload-zone">
            <label className="upload-btn" htmlFor="resume-upload">
              <HiOutlineUpload /> Upload PDF
              <input type="file" id="resume-upload" accept=".pdf,.doc,.docx" onChange={handleUpload} hidden />
            </label>
            <button className="btn btn-sm btn-primary" onClick={createNewResume} disabled={loading}>
              <HiOutlinePlus /> New Resume
            </button>
          </div>

          <div className="resume-list">
            {resumes.map(r => (
              <div
                key={r._id}
                className={`resume-list-item ${activeResume?._id === r._id ? 'active' : ''}`}
                onClick={() => loadResume(r._id)}
              >
                <div className="resume-list-info">
                  <HiOutlineDocumentText />
                  <div>
                    <span className="resume-list-title">{r.title}</span>
                    <span className="resume-list-role">{r.targetRole}</span>
                  </div>
                </div>
                <button className="resume-delete-btn" title="Delete Resume" onClick={(e) => { e.stopPropagation(); deleteResume(r._id); }}>
                  <HiOutlineTrash />
                </button>
              </div>
            ))}
          </div>

          {/* Target Role & Template */}
          <div className="resume-config">
            <div className="input-group">
              <label>Target Role</label>
              <select className="input-field" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                {targetRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Choose a Template</label>
              <div className="template-selector-grid">
                {templates.map(t => (
                  <div key={t.id} className={`template-thumbnail ${template === t.id ? 'selected' : ''}`} onClick={() => setTemplate(t.id)}>
                    <img src={t.image} alt={t.name} />
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {template === 'custom' && (
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Custom CSS Overrides</label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  value={sections.customCss || ''} 
                  onChange={e => setSections({...sections, customCss: e.target.value})}
                  placeholder=".resume-template { background: #fee; }"
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="resume-main">
          {/* Toolbar */}
          <div className="resume-toolbar glass-card">
            <div className="resume-toolbar-tabs">
              <button className={`tab ${view === 'editor' ? 'active' : ''}`} onClick={() => setView('editor')}>
                <HiOutlinePencil /> Editor
              </button>
              <button className={`tab ${view === 'preview' ? 'active' : ''}`} onClick={() => setView('preview')}>
                <HiOutlineEye /> Preview
              </button>
              <button className={`tab ${view === 'analysis' ? 'active' : ''}`} onClick={() => setView('analysis')}>
                <HiOutlineSparkles /> AI Analysis
              </button>
            </div>
            <div className="resume-toolbar-actions">
              <button className="btn btn-sm btn-secondary" onClick={saveResume} disabled={!activeResume || loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-sm btn-success" onClick={() => analyzeResume(false)} disabled={!activeResume || analyzing}>
                {analyzing ? 'Analyzing...' : analysis ? '🔍 View Analysis' : '🔍 Analyze'}
              </button>
              {analysis && (
                <button className="btn btn-sm btn-ghost" onClick={() => analyzeResume(true)} disabled={analyzing} title="Re-analyze using AI (uses API credits)">
                  🔄 Re-Analyze
                </button>
              )}
              <button className="btn btn-sm btn-primary" onClick={optimizeResume} disabled={!activeResume || optimizing}>
                {optimizing ? 'Optimizing...' : '✨ AI Optimize'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={downloadPDF}>
                <HiOutlineDownload /> PDF
              </button>
            </div>
          </div>

          {/* Editor View */}
          {view === 'editor' && (
            <div className="resume-editor">
              {/* Section Nav */}
              <div className="section-nav">
                {['contact', 'summary', 'experience', 'education', 'projects', 'skills'].map(s => (
                  <button
                    key={s}
                    className={`section-nav-btn ${activeSection === s ? 'active' : ''}`}
                    onClick={() => setActiveSection(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className="section-editor glass-card">
                {activeSection === 'contact' && (
                  <div className="editor-section">
                    <h4>Contact Information</h4>
                    <div className="editor-grid">
                      {['name', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'location'].map(f => (
                        <div key={f} className="input-group">
                          <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                          <input
                            className="input-field"
                            value={sections.contact?.[f] || ''}
                            onChange={e => updateContact(f, e.target.value)}
                            placeholder={f === 'linkedin' ? 'linkedin.com/in/yourname' : f === 'github' ? 'github.com/yourname' : ''}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'summary' && (
                  <div className="editor-section">
                    <h4>Professional Summary</h4>
                    <textarea
                      className="input-field summary-textarea"
                      value={sections.summary || ''}
                      onChange={e => setSections(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Write a 2-3 line professional summary highlighting your key skills and goals..."
                      rows={4}
                    />
                  </div>
                )}

                {activeSection === 'experience' && (
                  <div className="editor-section">
                    <div className="editor-section-header">
                      <h4>Work Experience</h4>
                      <button className="btn btn-sm btn-primary" onClick={addExperience}><HiOutlinePlus /> Add</button>
                    </div>
                    {(sections.experience || []).map((exp, i) => (
                      <div key={i} className="editor-item">
                        <div className="editor-grid">
                          <div className="input-group">
                            <label>Job Title</label>
                            <input className="input-field" value={exp.title || ''} onChange={e => {
                              const updated = [...sections.experience];
                              updated[i] = { ...updated[i], title: e.target.value };
                              setSections(prev => ({ ...prev, experience: updated }));
                            }} />
                          </div>
                          <div className="input-group">
                            <label>Company</label>
                            <input className="input-field" value={exp.company || ''} onChange={e => {
                              const updated = [...sections.experience];
                              updated[i] = { ...updated[i], company: e.target.value };
                              setSections(prev => ({ ...prev, experience: updated }));
                            }} />
                          </div>
                          <div className="input-group">
                            <label>Start Date</label>
                            <input className="input-field" value={exp.startDate || ''} onChange={e => {
                              const updated = [...sections.experience];
                              updated[i] = { ...updated[i], startDate: e.target.value };
                              setSections(prev => ({ ...prev, experience: updated }));
                            }} placeholder="Jan 2024" />
                          </div>
                          <div className="input-group">
                            <label>End Date</label>
                            <input className="input-field" value={exp.endDate || ''} onChange={e => {
                              const updated = [...sections.experience];
                              updated[i] = { ...updated[i], endDate: e.target.value };
                              setSections(prev => ({ ...prev, experience: updated }));
                            }} placeholder="Present" />
                          </div>
                        </div>
                        <div className="input-group" style={{ marginTop: 12 }}>
                          <label>Bullet Points (one per line)</label>
                          <textarea className="input-field" rows={3}
                            value={(exp.bullets || []).join('\n')}
                            onChange={e => {
                              const updated = [...sections.experience];
                              updated[i] = { ...updated[i], bullets: e.target.value.split('\n') };
                              setSections(prev => ({ ...prev, experience: updated }));
                            }}
                            placeholder="Designed and developed..."
                          />
                        </div>
                        <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={() => {
                          setSections(prev => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));
                        }}><HiOutlineTrash /> Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'education' && (
                  <div className="editor-section">
                    <div className="editor-section-header">
                      <h4>Education</h4>
                      <button className="btn btn-sm btn-primary" onClick={addEducation}><HiOutlinePlus /> Add</button>
                    </div>
                    {(sections.education || []).map((edu, i) => (
                      <div key={i} className="editor-item">
                        <div className="editor-grid">
                          <div className="input-group">
                            <label>Degree</label>
                            <input className="input-field" value={edu.degree || ''} onChange={e => {
                              const updated = [...sections.education];
                              updated[i] = { ...updated[i], degree: e.target.value };
                              setSections(prev => ({ ...prev, education: updated }));
                            }} placeholder="B.Tech Computer Science" />
                          </div>
                          <div className="input-group">
                            <label>Institution</label>
                            <input className="input-field" value={edu.institution || ''} onChange={e => {
                              const updated = [...sections.education];
                              updated[i] = { ...updated[i], institution: e.target.value };
                              setSections(prev => ({ ...prev, education: updated }));
                            }} />
                          </div>
                          <div className="input-group">
                            <label>GPA</label>
                            <input className="input-field" value={edu.gpa || ''} onChange={e => {
                              const updated = [...sections.education];
                              updated[i] = { ...updated[i], gpa: e.target.value };
                              setSections(prev => ({ ...prev, education: updated }));
                            }} placeholder="8.5/10" />
                          </div>
                          <div className="input-group">
                            <label>Year</label>
                            <input className="input-field" value={edu.endDate || ''} onChange={e => {
                              const updated = [...sections.education];
                              updated[i] = { ...updated[i], endDate: e.target.value };
                              setSections(prev => ({ ...prev, education: updated }));
                            }} placeholder="2025" />
                          </div>
                        </div>
                        <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={() => {
                          setSections(prev => ({ ...prev, education: prev.education.filter((_, idx) => idx !== i) }));
                        }}><HiOutlineTrash /> Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'projects' && (
                  <div className="editor-section">
                    <div className="editor-section-header">
                      <h4>Projects</h4>
                      <button className="btn btn-sm btn-primary" onClick={addProject}><HiOutlinePlus /> Add</button>
                    </div>
                    {(sections.projects || []).map((proj, i) => (
                      <div key={i} className="editor-item">
                        <div className="editor-grid">
                          <div className="input-group">
                            <label>Project Name</label>
                            <input className="input-field" value={proj.name || ''} onChange={e => {
                              const updated = [...sections.projects];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setSections(prev => ({ ...prev, projects: updated }));
                            }} />
                          </div>
                          <div className="input-group">
                            <label>GitHub Link</label>
                            <input className="input-field" value={proj.github || ''} onChange={e => {
                              const updated = [...sections.projects];
                              updated[i] = { ...updated[i], github: e.target.value };
                              setSections(prev => ({ ...prev, projects: updated }));
                            }} />
                          </div>
                        </div>
                        <div className="input-group" style={{ marginTop: 12 }}>
                          <label>Description & Bullets (one per line)</label>
                          <textarea className="input-field" rows={3}
                            value={(proj.bullets || []).join('\n')}
                            onChange={e => {
                              const updated = [...sections.projects];
                              updated[i] = { ...updated[i], bullets: e.target.value.split('\n') };
                              setSections(prev => ({ ...prev, projects: updated }));
                            }}
                          />
                        </div>
                        <div className="input-group" style={{ marginTop: 8 }}>
                          <label>Tech Stack (comma separated)</label>
                          <input className="input-field"
                            value={(proj.techStack || []).join(', ')}
                            onChange={e => {
                              const updated = [...sections.projects];
                              updated[i] = { ...updated[i], techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                              setSections(prev => ({ ...prev, projects: updated }));
                            }}
                            placeholder="React, Node.js, MongoDB"
                          />
                        </div>
                        <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={() => {
                          setSections(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }));
                        }}><HiOutlineTrash /> Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'skills' && (
                  <div className="editor-section">
                    <h4>Skills</h4>
                    {['languages', 'frameworks', 'tools', 'databases', 'other'].map(cat => (
                      <div key={cat} className="skill-category">
                        <label>{cat.charAt(0).toUpperCase() + cat.slice(1)}</label>
                        <div className="skill-chips">
                          {(sections.skills?.[cat] || []).map((s, i) => (
                            <span key={i} className="skill-chip">
                              {s}
                              <button onClick={() => removeSkill(cat, i)}>&times;</button>
                            </span>
                          ))}
                        </div>
                        <div className="skill-add">
                          <input
                            className="input-field"
                            placeholder={`Add ${cat}...`}
                            value={skillInput}
                            onChange={e => setSkillInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSkill(cat)}
                          />
                          <button className="btn btn-sm btn-primary" onClick={() => addSkill(cat)}>Add</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview View */}
          {view === 'preview' && (
            <div className="resume-preview glass-card" id="resume-preview">
              
              {activeResume?.pdfUrl && (
                <div className="preview-toggle-bar">
                  <span style={{ marginRight: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Original PDF uploaded. Toggle to see live edits in Template view:
                  </span>
                  <div className="btn-group">
                    <button 
                      className={`btn btn-sm ${previewMode === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPreviewMode('pdf')}
                    >
                      Original PDF
                    </button>
                    <button 
                      className={`btn btn-sm ${previewMode === 'template' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPreviewMode('template')}
                    >
                      Live Template
                    </button>
                  </div>
                </div>
              )}

              <div className="preview-content-area" style={{ marginTop: activeResume?.pdfUrl ? 16 : 0 }}>
                {activeResume?.pdfUrl && previewMode === 'pdf' ? (
                  <iframe src={`http://localhost:5000${activeResume.pdfUrl}`} title="PDF Preview" width="100%" height="800px" style={{ border: 'none', borderRadius: '8px', background: 'white' }} />
                ) : (
                  <TemplateRenderer sections={sections} />
                )}
              </div>
            </div>
          )}

          {/* Analysis View */}
          {view === 'analysis' && (
            <div className="resume-analysis">
              {analysis ? (
                <div className="stagger-children">
                  {/* Score Cards */}
                  <div className="analysis-scores">
                    <div className="glass-card analysis-score-card">
                      <h4>Overall Score</h4>
                      <div className="analysis-score" style={{ color: scoreColor(overallScore) }}>
                        {overallScore}<span>/100</span>
                      </div>
                    </div>
                    <div className="glass-card analysis-score-card">
                      <h4>ATS Score</h4>
                      <div className="analysis-score" style={{ color: scoreColor(atsScore) }}>
                        {atsScore}<span>/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  {analysis.missingKeywords?.length > 0 && (
                    <div className="glass-card" style={{ padding: 24 }}>
                      <h4><HiOutlineExclamation style={{color: '#fdcb6e'}} /> Missing Keywords for {targetRole}</h4>
                      <div className="keyword-chips">
                        {analysis.missingKeywords.map((k, i) => (
                          <span key={i} className="badge badge-warning">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions?.length > 0 && (
                    <div className="glass-card" style={{ padding: 24 }}>
                      <h4><HiOutlineLightningBolt style={{color: 'var(--accent-primary)'}} /> Suggestions</h4>
                      <div className="suggestions-list">
                        {analysis.suggestions.map((s, i) => (
                          <div key={i} className="suggestion-item">
                            <span className={`badge badge-${s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warning' : 'success'}`}>{s.section}</span>
                            <div>
                              <p className="suggestion-issue">{s.issue}</p>
                              <p className="suggestion-fix">{s.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improved Summary */}
                  {analysis.improvedSummary && (
                    <div className="glass-card" style={{ padding: 24 }}>
                      <h4><HiOutlineCheckCircle style={{color: '#00b894'}} /> AI-Generated Summary</h4>
                      <p className="improved-text">{analysis.improvedSummary}</p>
                      <button className="btn btn-sm btn-success" style={{ marginTop: 12 }}
                        onClick={() => { setSections(prev => ({ ...prev, summary: analysis.improvedSummary })); setView('editor'); }}>
                        Use This Summary
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
                  <HiOutlineSparkles style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', marginBottom: 16 }} />
                  <h3>Analyze Your Resume</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '8px 0 24px' }}>
                    Click "🔍 Analyze" in the toolbar to get ATS scores, missing keywords, and AI suggestions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
