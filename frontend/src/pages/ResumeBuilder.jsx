import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { resumeAPI } from '../services/api';
import {
  HiOutlineDownload, HiOutlineSave, HiOutlinePlus, HiOutlineTrash,
  HiOutlineDocumentText, HiOutlineChevronDown, HiX
} from 'react-icons/hi';
import {
  generateTemplateOne,
  generateTemplateTwo,
  generateTemplateThree,
  generateTemplateFour,
  generateTemplateFive
} from '../utils/resumeTemplates';
import { useDataCache } from '../context/DataContext';
import './ResumeBuilder.css';

const emptyResumeData = {
  contact: { name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', location: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: { languages: [], frameworks: [], tools: [], databases: [], other: [] }
};

const templatesList = [
  { id: 1, name: 'Professional Grey', image: '/template1.png' },
  { id: 2, name: 'Student Split', image: '/template2.png' },
  { id: 3, name: 'Minimalist Lines', image: '/template3.png' },
  { id: 4, name: 'Corporate Clean', image: '/template4.png' },
  { id: 5, name: 'Blue Tinted', image: '/template5.png' },
];

export default function ResumeBuilder() {
  // --- Core State ---
  const [resumeData, setResumeData] = useState(emptyResumeData);
  const [selectedTemplateId, setSelectedTemplateId] = useState(1);
  const [resumeId, setResumeId] = useState(null);
  const [resumeName, setResumeName] = useState('');

  // --- PDF Preview State ---
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // --- UI State ---
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('contact');
  const [skillInput, setSkillInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [savedResumes, setSavedResumes] = useState([]);
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const debounceTimer = useRef(null);
  const prevBlobUrl = useRef('');
  const dropdownRef = useRef(null);
  const { resumeCache, setResumeCache } = useDataCache();

  // --- Fetch saved resumes on mount ---
  useEffect(() => {
    fetchSavedResumes();
  }, []);

  const fetchSavedResumes = async (force = false) => {
    if (!force && resumeCache) {
      setSavedResumes(resumeCache);
      return;
    }
    try {
      setLoadingResumes(true);
      const res = await resumeAPI.getList();
      setSavedResumes(res.data || []);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    if (!loadingResumes) {
      setResumeCache(savedResumes);
    }
  }, [savedResumes, loadingResumes, setResumeCache]);

  // --- Close dropdown on outside click ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowResumeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Generate LaTeX ---
  const generateLatex = useCallback(() => {
    switch (selectedTemplateId) {
      case 1: return generateTemplateOne(resumeData);
      case 2: return generateTemplateTwo(resumeData);
      case 3: return generateTemplateThree(resumeData);
      case 4: return generateTemplateFour(resumeData);
      case 5: return generateTemplateFive(resumeData);
      default: return generateTemplateOne(resumeData);
    }
  }, [resumeData, selectedTemplateId]);

  // --- Check if resume has any content ---
  const hasContent = useCallback(() => {
    const c = resumeData.contact;
    const hasContact = c.name || c.email || c.phone;
    const hasSummary = resumeData.summary;
    const hasExperience = resumeData.experience.length > 0;
    const hasEducation = resumeData.education.length > 0;
    const hasProjects = resumeData.projects.length > 0;
    const hasSkills = Object.values(resumeData.skills).some(arr => arr.length > 0);
    return hasContact || hasSummary || hasExperience || hasEducation || hasProjects || hasSkills;
  }, [resumeData]);

  // --- Compile PDF via backend proxy (avoids CORS) ---
  const compilePdf = async (latexString) => {
    if (!latexString.trim()) return;
    setIsCompiling(true);
    setPreviewError('');
    try {
      const token = sessionStorage.getItem('prephelp_token');
      const baseUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${baseUrl}/resume/compile-latex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latex: latexString })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.detail
          ? `${errData.message}: ${errData.detail}`
          : errData.message || `Compilation failed (${res.status})`;
        console.error('Backend compilation error details:', errData);
        throw new Error(errorMsg);
      }
      const blob = await res.blob();
      // Revoke previous Object URL to prevent memory leaks
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
      }
      const url = URL.createObjectURL(blob);
      prevBlobUrl.current = url;
      setPdfBlobUrl(url);
    } catch (e) {
      console.error('Live Preview Compilation Error:', e);
      setPreviewError(e.message || 'Failed to compile PDF');
      toast.error(e.message || 'PDF compilation failed. Check your resume data.');
    } finally {
      setIsCompiling(false);
    }
  };

  // --- Manual Compile ---
  const handleManualCompile = () => {
    if (!hasContent()) {
      toast.error('Add some content first before compiling.');
      return;
    }
    const latex = generateLatex();
    if (latex) compilePdf(latex);
  };

  // --- Cleanup Object URL on unmount ---
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  // --- Resizer Logic ---
  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- Save Resume ---
  const handleSave = () => {
    setSaveNameInput(resumeName || '');
    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    const name = saveNameInput.trim();
    if (!name) {
      toast.error('Please enter a resume name');
      return;
    }
    setSaving(true);
    try {
      const res = await resumeAPI.save({
        _id: resumeId,
        resumeData,
        selectedTemplateId,
        resumeName: name
      });
      if (res.data && res.data._id) {
        setResumeId(res.data._id);
        setResumeName(name);
      }
      toast.success(`Resume "${name}" saved successfully!`);
      setShowSaveModal(false);
      fetchSavedResumes(true); // force refresh dropdown
    } catch (err) {
      console.error(err);
      toast.error('Failed to save resume. Please ensure you are logged in.');
    } finally {
      setSaving(false);
    }
  };

  // --- Load Resume ---
  const loadResume = async (id) => {
    try {
      const res = await resumeAPI.getOne(id);
      const data = res.data;
      setResumeId(data._id);
      setResumeName(data.resumeName || data.title || '');
      setResumeData(data.resumeData || emptyResumeData);
      setSelectedTemplateId(data.selectedTemplateId || 1);
      setShowResumeDropdown(false);
      toast.success(`Loaded "${data.resumeName || data.title}"`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load resume');
    }
  };

  // --- Delete Resume ---
  const handleDeleteResume = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this resume permanently?')) return;
    try {
      await resumeAPI.delete(id);
      toast.success('Resume deleted');
      if (resumeId === id) {
        setResumeId(null);
        setResumeName('');
        setResumeData(emptyResumeData);
      }
      fetchSavedResumes(true); // force refresh
    } catch (err) {
      toast.error('Failed to delete resume');
    }
  };

  // --- Download PDF ---
  const handleDownload = async () => {
    if (!resumeData.contact.name?.trim()) {
      toast.error('Please enter at least your name before downloading');
      return;
    }
    setDownloading(true);
    try {
      const latexString = generateLatex();
      if (!latexString.trim()) {
        toast.error('Template is empty. Please add some content first.');
        return;
      }
      const token = sessionStorage.getItem('prephelp_token');
      const baseUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${baseUrl}/resume/compile-latex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latex: latexString })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.detail
          ? `${errData.message}: ${errData.detail}`
          : errData.message || `Download compilation failed (${res.status})`;
        console.error('Download compilation error details:', errData);
        throw new Error(errorMsg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.contact.name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Resume downloaded!');
    } catch (e) {
      console.error('Download Compilation Error:', e);
      toast.error(e.message || 'Failed to download resume. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // --- New Resume ---
  const handleNewResume = () => {
    setResumeId(null);
    setResumeName('');
    setResumeData(emptyResumeData);
    setSelectedTemplateId(1);
    if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    setPdfBlobUrl('');
    setPreviewError('');
    toast.success('New resume started');
  };

  // --- Form Helpers ---
  const updateContact = (field, value) => setResumeData(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  const addExperience = () => setResumeData(prev => ({ ...prev, experience: [...prev.experience, { title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] }));
  const addEducation = () => setResumeData(prev => ({ ...prev, education: [...prev.education, { degree: '', institution: '', location: '', startDate: '', endDate: '', gpa: '', relevant: '' }] }));
  const addProject = () => setResumeData(prev => ({ ...prev, projects: [...prev.projects, { name: '', description: '', techStack: [], link: '', github: '', bullets: [''] }] }));

  const addSkill = (category) => {
    if (!skillInput.trim()) return;
    setResumeData(prev => ({ ...prev, skills: { ...prev.skills, [category]: [...(prev.skills[category] || []), skillInput.trim()] } }));
    setSkillInput('');
  };
  const removeSkill = (category, index) => setResumeData(prev => ({ ...prev, skills: { ...prev.skills, [category]: prev.skills[category].filter((_, i) => i !== index) } }));

  return (
    <div className="page resume-page">
      {/* ═══════ PAGE HEADER ═══════ */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Resume Builder</h1>
          <p>{resumeName ? `Editing: ${resumeName}` : 'Deterministic LaTeX Resume Generation'}</p>
        </div>
        <div className="resume-toolbar-actions">
          {/* My Resumes Dropdown */}
          <div className="resume-dropdown-container" ref={dropdownRef}>
            <button
              className="btn btn-secondary"
              id="my-resumes-btn"
              onClick={() => setShowResumeDropdown(!showResumeDropdown)}
            >
              <HiOutlineDocumentText /> My Resumes <HiOutlineChevronDown />
            </button>
            {showResumeDropdown && (
              <div className="resume-dropdown animate-fade-in-up" id="resume-dropdown">
                <div className="resume-dropdown-header">
                  <span>Saved Resumes</span>
                  <button className="btn btn-sm btn-primary" onClick={handleNewResume}>
                    <HiOutlinePlus /> New
                  </button>
                </div>
                {loadingResumes ? (
                  <div className="resume-dropdown-loading">
                    <div className="loader" style={{ width: 20, height: 20 }}></div>
                  </div>
                ) : savedResumes.length === 0 ? (
                  <div className="resume-dropdown-empty">
                    No saved resumes yet
                  </div>
                ) : (
                  <div className="resume-dropdown-list">
                    {savedResumes.map(r => (
                      <div
                        key={r._id}
                        className={`resume-dropdown-item ${resumeId === r._id ? 'active' : ''}`}
                        onClick={() => loadResume(r._id)}
                      >
                        <div className="resume-dropdown-item-info">
                          <HiOutlineDocumentText />
                          <div>
                            <span className="resume-dropdown-name">{r.resumeName || 'Untitled'}</span>
                            <span className="resume-dropdown-date">
                              {new Date(r.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          className="resume-delete-btn"
                          onClick={(e) => handleDeleteResume(r._id, e)}
                          title="Delete resume"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="btn btn-primary" id="save-resume-btn" onClick={handleSave} disabled={saving}>
            <HiOutlineSave /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-success" id="download-resume-btn" onClick={handleDownload} disabled={downloading}>
            <HiOutlineDownload /> {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ═══════ TEMPLATE SELECTOR ═══════ */}
      <div className="template-selector-bar glass-card" id="template-selector">
        <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: showTemplates ? '12px' : '0' }}>
          Select Template
          <button className="btn btn-sm btn-ghost" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? 'Hide' : 'Show'} <HiOutlineChevronDown style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '4px' }} />
          </button>
        </h4>
        {showTemplates && (
          <div className="template-selector-scroll" style={{ marginTop: '12px' }}>
            {templatesList.map(t => (
              <div
                key={t.id}
                className={`template-thumb-card ${selectedTemplateId === t.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplateId(t.id)}
                id={`template-${t.id}`}
              >
                <div className="template-thumb-img-wrapper">
                  <img src={t.image} alt={t.name} />
                  {selectedTemplateId === t.id && (
                    <div className="template-selected-badge">✓</div>
                  )}
                </div>
                <span className="template-thumb-label">{t.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ MAIN SPLIT LAYOUT ═══════ */}
      <div className={`resume-layout ${isFullscreen ? 'fullscreen-mode' : ''} ${!showTemplates ? 'templates-hidden' : ''} ${isResizing ? 'is-resizing' : ''}`}>
        {/* Left Panel - Forms */}
        <div className="resume-form-panel glass-card" id="resume-form-panel" style={{ flex: isFullscreen ? `0 0 ${leftWidth}%` : 1 }}>
          <div className="section-nav" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['contact', 'summary', 'experience', 'education', 'projects', 'skills'].map(s => (
              <button key={s} className={`btn btn-sm ${activeSection === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSection(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="section-editor">
            {/* ── CONTACT ── */}
            {activeSection === 'contact' && (
              <div className="editor-section">
                <h4>Contact Information</h4>
                <div className="editor-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {['name', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'location'].map(f => (
                    <div key={f} className="input-group">
                      <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                      <input
                        className="input-field"
                        style={{ width: '100%', padding: '8px' }}
                        value={resumeData.contact?.[f] || ''}
                        onChange={e => updateContact(f, e.target.value)}
                        id={`contact-${f}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SUMMARY ── */}
            {activeSection === 'summary' && (
              <div className="editor-section">
                <h4>Professional Summary</h4>
                <textarea
                  className="input-field"
                  style={{ width: '100%', padding: '8px' }}
                  value={resumeData.summary || ''}
                  onChange={e => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                  rows={6}
                  id="summary-textarea"
                />
              </div>
            )}

            {/* ── EXPERIENCE ── */}
            {activeSection === 'experience' && (
              <div className="editor-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4>Work Experience</h4>
                  <button className="btn btn-sm btn-primary" onClick={addExperience} id="add-experience-btn"><HiOutlinePlus /> Add</button>
                </div>
                {(resumeData.experience || []).length === 0 && (
                  <div className="editor-empty-hint">
                    <p>No experience entries yet. Click <strong>Add</strong> to create one.</p>
                  </div>
                )}
                {(resumeData.experience || []).map((exp, i) => (
                  <div key={i} className="editor-item glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label>Title</label>
                        <input className="input-field" style={{ width: '100%' }} value={exp.title || ''} onChange={e => {
                          const updated = [...resumeData.experience];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>Company</label>
                        <input className="input-field" style={{ width: '100%' }} value={exp.company || ''} onChange={e => {
                          const updated = [...resumeData.experience];
                          updated[i] = { ...updated[i], company: e.target.value };
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>Start Date</label>
                        <input className="input-field" style={{ width: '100%' }} value={exp.startDate || ''} onChange={e => {
                          const updated = [...resumeData.experience];
                          updated[i] = { ...updated[i], startDate: e.target.value };
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>End Date</label>
                        <input className="input-field" style={{ width: '100%' }} value={exp.endDate || ''} placeholder={exp.current ? 'Present' : ''} onChange={e => {
                          const updated = [...resumeData.experience];
                          updated[i] = { ...updated[i], endDate: e.target.value };
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }} />
                      </div>
                    </div>
                    <div className="input-group" style={{ marginTop: 12 }}>
                      <label>Bullet Points (one per line)</label>
                      <textarea className="input-field" style={{ width: '100%' }} rows={4}
                        value={(exp.bullets || []).join('\n')}
                        onChange={e => {
                          const updated = [...resumeData.experience];
                          updated[i] = { ...updated[i], bullets: e.target.value.split('\n') };
                          setResumeData(prev => ({ ...prev, experience: updated }));
                        }}
                      />
                    </div>
                    <button className="btn btn-sm btn-danger" style={{ marginTop: 12 }} onClick={() => {
                      setResumeData(prev => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));
                    }}><HiOutlineTrash /> Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── EDUCATION ── */}
            {activeSection === 'education' && (
              <div className="editor-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4>Education</h4>
                  <button className="btn btn-sm btn-primary" onClick={addEducation} id="add-education-btn"><HiOutlinePlus /> Add</button>
                </div>
                {(resumeData.education || []).length === 0 && (
                  <div className="editor-empty-hint">
                    <p>No education entries yet. Click <strong>Add</strong> to create one.</p>
                  </div>
                )}
                {(resumeData.education || []).map((edu, i) => (
                  <div key={i} className="editor-item glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label>Degree</label>
                        <input className="input-field" style={{ width: '100%' }} value={edu.degree || ''} onChange={e => {
                          const updated = [...resumeData.education];
                          updated[i] = { ...updated[i], degree: e.target.value };
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>Institution</label>
                        <input className="input-field" style={{ width: '100%' }} value={edu.institution || ''} onChange={e => {
                          const updated = [...resumeData.education];
                          updated[i] = { ...updated[i], institution: e.target.value };
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>GPA</label>
                        <input className="input-field" style={{ width: '100%' }} value={edu.gpa || ''} onChange={e => {
                          const updated = [...resumeData.education];
                          updated[i] = { ...updated[i], gpa: e.target.value };
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>Start Date</label>
                        <input className="input-field" style={{ width: '100%' }} value={edu.startDate || ''} onChange={e => {
                          const updated = [...resumeData.education];
                          updated[i] = { ...updated[i], startDate: e.target.value };
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>End Date / Year</label>
                        <input className="input-field" style={{ width: '100%' }} value={edu.endDate || ''} onChange={e => {
                          const updated = [...resumeData.education];
                          updated[i] = { ...updated[i], endDate: e.target.value };
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>Relevant Coursework</label>
                        <input className="input-field" style={{ width: '100%' }} value={edu.relevant || ''} onChange={e => {
                          const updated = [...resumeData.education];
                          updated[i] = { ...updated[i], relevant: e.target.value };
                          setResumeData(prev => ({ ...prev, education: updated }));
                        }} />
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" style={{ marginTop: 12 }} onClick={() => {
                      setResumeData(prev => ({ ...prev, education: prev.education.filter((_, idx) => idx !== i) }));
                    }}><HiOutlineTrash /> Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── PROJECTS ── */}
            {activeSection === 'projects' && (
              <div className="editor-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4>Projects</h4>
                  <button className="btn btn-sm btn-primary" onClick={addProject} id="add-project-btn"><HiOutlinePlus /> Add</button>
                </div>
                {(resumeData.projects || []).length === 0 && (
                  <div className="editor-empty-hint">
                    <p>No projects yet. Click <strong>Add</strong> to create one.</p>
                  </div>
                )}
                {(resumeData.projects || []).map((proj, i) => (
                  <div key={i} className="editor-item glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label>Project Name</label>
                        <input className="input-field" style={{ width: '100%' }} value={proj.name || ''} onChange={e => {
                          const updated = [...resumeData.projects];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setResumeData(prev => ({ ...prev, projects: updated }));
                        }} />
                      </div>
                      <div className="input-group">
                        <label>GitHub/Link</label>
                        <input className="input-field" style={{ width: '100%' }} value={proj.github || ''} onChange={e => {
                          const updated = [...resumeData.projects];
                          updated[i] = { ...updated[i], github: e.target.value };
                          setResumeData(prev => ({ ...prev, projects: updated }));
                        }} />
                      </div>
                    </div>
                    <div className="input-group" style={{ marginTop: 12 }}>
                      <label>Tech Stack (comma separated)</label>
                      <input className="input-field" style={{ width: '100%' }}
                        value={(proj.techStack || []).join(', ')}
                        onChange={e => {
                          const updated = [...resumeData.projects];
                          updated[i] = { ...updated[i], techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                          setResumeData(prev => ({ ...prev, projects: updated }));
                        }}
                      />
                    </div>
                    <div className="input-group" style={{ marginTop: 12 }}>
                      <label>Description & Bullets (one per line)</label>
                      <textarea className="input-field" style={{ width: '100%' }} rows={4}
                        value={(proj.bullets || []).join('\n')}
                        onChange={e => {
                          const updated = [...resumeData.projects];
                          updated[i] = { ...updated[i], bullets: e.target.value.split('\n') };
                          setResumeData(prev => ({ ...prev, projects: updated }));
                        }}
                      />
                    </div>
                    <button className="btn btn-sm btn-danger" style={{ marginTop: 12 }} onClick={() => {
                      setResumeData(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }));
                    }}><HiOutlineTrash /> Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── SKILLS ── */}
            {activeSection === 'skills' && (
              <div className="editor-section">
                <h4>Skills</h4>
                {['languages', 'frameworks', 'tools', 'databases', 'other'].map(cat => (
                  <div key={cat} className="skill-category" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', textTransform: 'capitalize', marginBottom: '8px' }}>{cat}</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {(resumeData.skills?.[cat] || []).map((s, i) => (
                        <span key={i} className="skill-chip badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {s}
                          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => removeSkill(cat, i)}>&times;</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="input-field"
                        style={{ flex: 1 }}
                        placeholder={`Add ${cat}...`}
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            addSkill(cat);
                            e.preventDefault();
                          }
                        }}
                      />
                      <button className="btn btn-sm btn-primary" onClick={() => addSkill(cat)}>Add</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vertical Resizer in Fullscreen */}
        {isFullscreen && (
          <div className="layout-resizer" onMouseDown={handleMouseDown}>
            <div className="layout-resizer-handle"></div>
          </div>
        )}

        {/* Right Panel - Live Preview */}
        <div className="resume-preview-panel glass-card" id="resume-preview-panel">
          <div className="preview-header">
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>Live Preview</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-primary" onClick={handleManualCompile}>
                <HiOutlineDocumentText style={{ marginRight: '4px' }} /> Compile Resume
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? 'Shrink' : 'Enlarge'}
              </button>
            </div>
          </div>
          
          <div className="preview-content-area">
            {/* Compiling overlay */}
            {isCompiling && (
              <div className="preview-compiling-overlay">
                <div className="preview-spinner">
                  <div className="loader"></div>
                  <span>Compiling LaTeX...</span>
                </div>
              </div>
            )}

            {/* PDF Preview */}
            {pdfBlobUrl && !previewError ? (
              <iframe
                src={pdfBlobUrl}
                title="Resume PDF Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
                type="application/pdf"
                id="pdf-preview-frame"
              />
            ) : previewError ? (
              <div className="preview-error-state">
                <div className="preview-error-icon">⚠️</div>
                <h3>Compilation Error</h3>
                <p>{previewError}</p>
                <button className="btn btn-sm btn-primary" onClick={() => {
                  setPreviewError('');
                  const latex = generateLatex();
                  if (latex) compilePdf(latex);
                }}>Retry</button>
              </div>
            ) : hasContent() ? (
              <div className="preview-waiting-state">
                <div className="preview-waiting-icon animate-pulse">📄</div>
                <p>Click "Compile Resume" to preview your document.</p>
              </div>
            ) : (
              <div className="preview-empty-state">
                <div className="preview-empty-icon">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <rect x="16" y="8" width="48" height="64" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
                  </svg>
                </div>
                <h3>Your Resume Preview</h3>
                <p>Start filling in your details on the left panel.<br />Then click Compile to see the PDF preview.</p>
                <div className="preview-empty-steps">
                  <span>① Add Info</span>
                  <span>② Choose Template</span>
                  <span>③ Compile</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ SAVE MODAL ═══════ */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} id="save-modal">
            <div className="modal-header">
              <h3>💾 Name Your Resume</h3>
              <button className="btn btn-ghost" onClick={() => setShowSaveModal(false)}>
                <HiX />
              </button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="input-group" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Resume Name (e.g. SDE_Google_Resume)
                </span>
                <input
                  className="input-field"
                  style={{ width: '100%' }}
                  value={saveNameInput}
                  onChange={e => setSaveNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmSave(); }}
                  placeholder="My Awesome Resume"
                  autoFocus
                  id="save-name-input"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmSave} disabled={saving} id="confirm-save-btn">
                <HiOutlineSave /> {saving ? 'Saving...' : 'Save Resume'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}