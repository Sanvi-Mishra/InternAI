import React, { useState, useCallback, useEffect } from 'react';

// --- Inline SVG Icons ---
const MailIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const UserIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const ZapIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 20v-9l-7 8L15 4l-4 8h8L10 20" />
  </svg>
);
const ClipboardCheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);
const ClipboardCopyIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4l-4 5V11H8z" />
  </svg>
);

// Proxy endpoint
const API_PROXY = '/api/generate';

// Main App
const App = () => {
  // Prof discovery states
  const [universityName, setUniversityName] = useState('Harvard University');
  const [availableDepartments] = useState(['Computer Science', 'Electrical Engineering', 'Applied Mathematics', 'Data Science', 'Machine Learning', 'Software Engineering']);
  const [selectedDepartments, setSelectedDepartments] = useState(['Computer Science', 'Electrical Engineering', 'Applied Mathematics']);
  const [discoveredProfessors, setDiscoveredProfessors] = useState([]);
  const [discoveryStatus, setDiscoveryStatus] = useState('idle'); // 'idle', 'discovering', 'completed', 'error'
  const [selectedProfessors, setSelectedProfessors] = useState([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [sentEmails, setSentEmails] = useState([]);

  // User form states
  const [researcherName, setResearcherName] = useState('');
  const [researchFocus, setResearchFocus] = useState('');
  const [userName, setUserName] = useState('');
  const [userAffiliation, setUserAffiliation] = useState('');
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [motivation, setMotivation] = useState('');
  const [attachResume, setAttachResume] = useState(true);
  const [attachTranscript, setAttachTranscript] = useState(false);

  // Email output & UI
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  // Subject & signature
  const [subject, setSubject] = useState('');
  const [signature, setSignature] = useState('Best,\n[Your Name]\n[Affiliation]');

  // Templates
  const TEMPLATES_KEY = 'aoeg_templates_v1';
  const STORAGE_KEY = 'aoeg_user_profile_v1';
  const EMAIL_TRACKING_KEY = 'aoeg_sent_emails_v1';
  const [templates, setTemplates] = useState([]);

  // Load saved data
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.userName === 'string') setUserName(saved.userName);
        if (typeof saved.userAffiliation === 'string') setUserAffiliation(saved.userAffiliation);
        if (typeof saved.technicalSkills === 'string') setTechnicalSkills(saved.technicalSkills);
        if (typeof saved.motivation === 'string') setMotivation(saved.motivation);
        if (typeof saved.attachResume === 'boolean') setAttachResume(saved.attachResume);
        if (typeof saved.attachTranscript === 'boolean') setAttachTranscript(saved.attachTranscript);
      }
    } catch (_) {}
    try {
      const tRaw = localStorage.getItem(TEMPLATES_KEY);
      if (tRaw) setTemplates(JSON.parse(tRaw));
    } catch (_) {}
    try {
      const emailTracking = localStorage.getItem(EMAIL_TRACKING_KEY);
      if (emailTracking) setSentEmails(JSON.parse(emailTracking));
    } catch (_) {}
  }, []);

  // Persist user profile
  useEffect(() => {
    const toStore = { userName, userAffiliation, technicalSkills, motivation, attachResume, attachTranscript };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore)); } catch (_) {}
  }, [userName, userAffiliation, technicalSkills, motivation, attachResume, attachTranscript]);

  // Persist templates
  useEffect(() => {
    try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); } catch (_) {}
  }, [templates]);

  const clearSavedInfo = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    setUserName(''); setUserAffiliation(''); setTechnicalSkills(''); setMotivation('');
    setAttachResume(true); setAttachTranscript(false);
  };

  // Email tracking
  const trackSentEmail = (professor, emailContent) => {
    const sentEmail = {
      id: Date.now(),
      professorName: professor.name,
      professorEmail: professor.email || '',
      professorDepartment: professor.department || '',
      sentDate: new Date().toISOString(),
      emailContent,
      status: 'generated'
    };
    const updated = [...sentEmails, sentEmail];
    setSentEmails(updated);
    try { localStorage.setItem(EMAIL_TRACKING_KEY, JSON.stringify(updated)); } catch (_) {}
  };

  const clearEmailTracking = () => {
    setSentEmails([]);
    try { localStorage.removeItem(EMAIL_TRACKING_KEY); } catch (_) {}
  };

  // Professor discovery (calls proxy which calls Gemini - still simulated)
  const discoverProfessors = async () => {
    if (!universityName) { setError('Please enter a university name'); return; }
    if (selectedDepartments.length === 0) { setError('Select at least one department'); return; }

    setDiscoveryStatus('discovering');
    setError(null);
    setDiscoveredProfessors([]);

    try {
      const discoveryPrompt = `
Generate a list of 8 professors from ${universityName} within the following departments: ${selectedDepartments.join(', ')}.
For each professor, provide as a JSON array with fields: name, title, department, researchAreas (array of strings), recentFocus (one sentence), relevance (High/Medium/Low), matchScore (0.0-1.0), webpage (url if known), email (university email if known), linkedin (url if known).

Return only a JSON array.
      `;
      const requestBody = {
        contents: [{ role: "user", parts: [{ text: discoveryPrompt }] }],
        config: { systemInstruction: "You are an assistant that returns accurate JSON arrays of professor metadata.", temperature: 0.2 }
      };

      const resp = await fetch(API_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.0-flash-exp', request: requestBody }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server responded ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      let professors = [];
      if (jsonMatch) {
        try {
          professors = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Parsing discovery JSON failed', e);
          professors = [];
        }
      }

      if (professors.length === 0) {
        // fallback sample if API returns nothing usable
        professors = [
          {
            name: "Dr. Yiling Chen",
            title: "Professor of Computer Science",
            department: "Computer Science",
            researchAreas: ["Machine Learning", "Algorithmic Game Theory", "Data Science"],
            recentFocus: "Developing ML algorithms for social systems",
            relevance: "High",
            matchScore: 0.88,
            webpage: "https://yiling.seas.harvard.edu/",
            email: "yiling@seas.harvard.edu",
            linkedin: ""
          }
        ];
      }

      setDiscoveredProfessors(professors);
      setDiscoveryStatus('completed');
    } catch (err) {
      console.error('Discovery error', err);
      setError('Failed to discover professors. Check server logs or your network.');
      setDiscoveryStatus('error');
    }
  };

  const toggleProfessorSelection = (professor) => {
    setSelectedProfessors(prev => {
      const exists = prev.some(p => p.name === professor.name);
      if (exists) return prev.filter(p => p.name !== professor.name);
      return [...prev, professor];
    });
  };

  const selectAllProfessors = () => setSelectedProfessors(discoveredProfessors);
  const clearSelection = () => setSelectedProfessors([]);

  // Generate an email for a given professor via proxy
  const generateEmailForProfessor = async (professor) => {
    const attachments = [];
    if (attachResume) attachments.push('Resume/CV');
    if (attachTranscript) attachments.push('Transcript/Portfolio link');
    const attachmentsString = attachments.length > 0 ? `Attachments to mention: ${attachments.join(' and ')}` : '';

    const prompt = `
Generate a concise (<= 200 words), professional academic outreach email body (do NOT include signature or subject) to this professor.

Professor details:
Name: ${professor.name}
Title: ${professor.title || 'Professor'}
Department: ${professor.department || ''}
Research Areas: ${professor.researchAreas?.join(', ') || 'Not specified'}
Recent Focus: ${professor.recentFocus || 'Not specified'}
Relevance: ${professor.relevance || 'Medium'}

Sender details:
Name: ${userName}
Affiliation: ${userAffiliation}
Technical skills: ${technicalSkills}
Motivation/story: "${motivation}"
${attachmentsString}

Structure:
1) Short opening referencing their work.
2) One short paragraph that connects your background and what you can contribute (2-3 concrete bullet points or lines).
3) CTA: ask for 15-min meeting or a chance to contribute.
4) Mention attachments briefly.

Keep it specific and respectful.
    `;

    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { systemInstruction: "You are a concise professional assistant for academic outreach.", temperature: 0.7 }
    };

    const resp = await fetch(API_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-2.0-flash-exp', request: requestBody }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Server error: ${resp.status} ${t}`);
    }
    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: could not generate';
    return text.trim();
  };

  // Batch generation
  const generateBatchEmails = async () => {
    if (selectedProfessors.length === 0) { setError('Please select at least one professor'); return; }
    if (!userName || !userAffiliation || !technicalSkills || !motivation) { setError('Please fill in your personal info'); return; }

    setBatchProgress({ current: 0, total: selectedProfessors.length });
    setGeneratedEmails([]);
    setError(null);

    const emails = [];
    for (let i = 0; i < selectedProfessors.length; i++) {
      const prof = selectedProfessors[i];
      setBatchProgress({ current: i + 1, total: selectedProfessors.length });
      try {
        const e = await generateEmailForProfessor(prof);
        emails.push({ professor: prof, email: e, timestamp: new Date().toISOString() });
        trackSentEmail(prof, e);
      } catch (err) {
        console.error(err);
        emails.push({ professor: prof, email: `Error generating: ${err.message}`, timestamp: new Date().toISOString(), error: true });
      }
      // rate limit-ish
      if (i < selectedProfessors.length - 1) await new Promise(r => setTimeout(r, 1000));
    }
    setGeneratedEmails(emails);
    setBatchProgress({ current: selectedProfessors.length, total: selectedProfessors.length });
  };

  // Generic generation via proxy for manual generate button (for researcherName + researchFocus)
  const constructPrompt = useCallback(() => {
    const attachments = [];
    if (attachResume) attachments.push('Resume/CV');
    if (attachTranscript) attachments.push('Transcript/Portfolio link');
    const attachmentsString = attachments.length > 0 ? `Attachments to mention: ${attachments.join(' and ')}` : '';
    return `
Generate a concise academic outreach email body (<=200 words). Do NOT include subject or signature.

Recipient:
${researcherName}
Research focus/project: "${researchFocus}"

Sender:
${userName} (${userAffiliation})
Skills: ${technicalSkills}
Motivation: "${motivation}"
${attachmentsString}

Structure:
1) Start referencing the recipient's work.
2) Show connection and what you can offer (2-3 concrete points).
3) Call to action: ask for 15-min meeting.
    `;
  }, [researcherName, researchFocus, userName, userAffiliation, technicalSkills, motivation, attachResume, attachTranscript]);

  const generateEmail = async () => {
    if (!userName || !userAffiliation || !technicalSkills || !motivation || !researcherName || !researchFocus) {
      setError('Please complete the form');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedEmail('');
    setIsCopied(false);

    const prompt = constructPrompt();
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { systemInstruction: "You are a concise professional assistant for academic outreach.", temperature: 0.7 }
    };

    try {
      const resp = await fetch(API_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.0-flash-exp', request: requestBody }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Server error: ${resp.status} ${t}`);
      }
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: no response';
      setGeneratedEmail(text.trim());
    } catch (err) {
      console.error(err);
      setError('Failed to generate email; check server/network.');
    } finally {
      setIsLoading(false);
    }
  };

  // Subject & signature generation helpers
  const generateSubjectSuggestions = async () => {
    // Build small prompt to generate 3 short subject lines
    if (!researcherName && !generatedEmail) setError('Provide recipient or generate the email first');
    setIsLoading(true);
    setError(null);

    const prompt = `
Given the following outreach context, produce 3 concise subject lines (max 8 words each) suitable for an academic cold email. Provide them as a JSON array of strings.

Context:
Recipient: ${researcherName || '[Not specified]'}
Research focus: ${researchFocus || '[Not specified]'}
Sender: ${userName || '[Not specified]'}
Skills: ${technicalSkills || '[Not specified]'}
Motivation: ${motivation || '[Not specified]'}
    `;
    const requestBody = { contents: [{ role: "user", parts: [{ text: prompt }] }], config: { systemInstruction: "Generate 3 subject lines in JSON array." , temperature: 0.5 } };

    try {
      const resp = await fetch(API_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.0-flash-exp', request: requestBody }),
      });
      if (!resp.ok) throw new Error('Subject generation failed');
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const match = text.match(/\[[\s\S]*\]/) || [text];
      let arr = [];
      try { arr = JSON.parse(match[0]); } catch (e) { arr = []; }
      if (arr.length > 0) setSubject(arr[0]);
      else if (typeof match[0] === 'string') setSubject(match[0].slice(0, 80));
    } catch (err) {
      console.error(err);
      setError('Subject generation failed.');
    } finally { setIsLoading(false); }
  };

  const generateSignature = async () => {
    setIsLoading(true);
    setError(null);
    const prompt = `
Generate a professional email signature block for the sender with this information:
Name: ${userName || '[Your name]'}
Affiliation: ${userAffiliation || '[Affiliation]'}
Include: short role (if available), contact placeholder, and a one-line link/portfolio placeholder.
Return plain text only.
    `;
    const requestBody = { contents: [{ role: 'user', parts: [{ text: prompt }] }], config: { systemInstruction: "Return a simple signature block.", temperature: 0.2 } };
    try {
      const resp = await fetch(API_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.0-flash-exp', request: requestBody }),
      });
      if (!resp.ok) throw new Error('Signature generation failed');
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setSignature(text.trim());
    } catch (err) {
      console.error(err);
      setError('Signature generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy & Gmail open
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_) {
      setError('Clipboard not available');
    }
  };

  const openInGmail = (toEmail) => {
    const body = `${generatedEmail}\n\n${signature}`;
    const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail || '')}&su=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body)}`;
    window.open(composeUrl, '_blank');
  };

  // Templates management
  const saveTemplate = (name) => {
    if (!name) name = `template-${new Date().toISOString()}`;
    const t = { id: Date.now(), name, subject, signature, body: generatedEmail };
    const updated = [t, ...templates];
    setTemplates(updated);
  };

  const applyTemplate = (t) => {
    setSubject(t.subject || '');
    setSignature(t.signature || '');
    setGeneratedEmail(t.body || '');
  };

  const deleteTemplate = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-xl overflow-hidden p-6 md:p-10">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center space-x-2">
            <MailIcon className="w-8 h-8 text-blue-600" />
            <span>Academic Outreach Email Generator</span>
          </h1>
          <p className="text-gray-500 mt-2">Personalized outreach with a secure backend proxy for the model.</p>
        </header>

        <div className="space-y-6">
          {/* Discovery & Batch */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 mb-2 flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-purple-500" />
              <span>Professor Discovery & Batch</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <fieldset className="p-4 border border-purple-200 rounded-lg space-y-3">
                <legend className="px-2 text-lg font-medium text-purple-700">University & Departments</legend>
                <div>
                  <label className="text-sm font-medium text-gray-700">University</label>
                  <input className="mt-1 px-3 py-2 border rounded w-full" value={universityName} onChange={(e)=>setUniversityName(e.target.value)} placeholder="Harvard University" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mt-2 block">Departments</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableDepartments.map((d,i)=>(
                      <button key={i} onClick={()=> setSelectedDepartments(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d])}
                        className={`px-3 py-1 rounded-full text-sm ${selectedDepartments.includes(d) ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <button onClick={discoverProfessors} className="mt-3 w-full bg-purple-600 text-white px-3 py-2 rounded disabled:opacity-50" disabled={discoveryStatus==='discovering'}>
                    {discoveryStatus==='discovering' ? 'Discovering...' : 'Discover Professors'}
                  </button>
                </div>
              </fieldset>

              <fieldset className="p-4 border border-gray-200 rounded-lg col-span-2 max-h-64 overflow-y-auto">
                <legend className="px-2 text-lg font-medium text-gray-700">Discovered Professors</legend>
                {discoveryStatus === 'idle' && <p className="text-sm text-gray-500">Click "Discover Professors" to run discovery</p>}
                {discoveryStatus === 'discovering' && <p className="text-sm text-blue-600">Discovering professors...</p>}
                {discoveryStatus === 'completed' && discoveredProfessors.length > 0 && (
                  <>
                    <div className="flex justify-end space-x-2 mb-2">
                      <button onClick={selectAllProfessors} className="text-sm px-2 py-1 bg-blue-100 rounded">Select All</button>
                      <button onClick={clearSelection} className="text-sm px-2 py-1 bg-gray-100 rounded">Clear</button>
                      <button onClick={generateBatchEmails} className="text-sm px-2 py-1 bg-green-600 text-white rounded">Generate Batch</button>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2">Select</th>
                          <th className="px-2 py-2">Name</th>
                          <th className="px-2 py-2">Dept</th>
                          <th className="px-2 py-2">Research</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discoveredProfessors.map((p,i)=>(
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-2 py-2">
                              <input type="checkbox" checked={selectedProfessors.some(x=>x.name===p.name)} onChange={()=>toggleProfessorSelection(p)} />
                            </td>
                            <td className="px-2 py-2">
                              <div className="font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.title}</div>
                            </td>
                            <td className="px-2 py-2">{p.department}</td>
                            <td className="px-2 py-2 text-xs">{p.researchAreas?.slice(0,3).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {discoveryStatus === 'completed' && discoveredProfessors.length === 0 && <p className="text-sm text-gray-500">No professors found.</p>}
                {discoveryStatus === 'error' && <p className="text-sm text-red-600">Discovery failed.</p>}
              </fieldset>
            </div>
          </section>

          {/* Manual generation form */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-indigo-500" />
              <span>Manual Email Generation</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <fieldset className="p-4 border border-indigo-200 rounded-lg space-y-3">
                <legend className="text-indigo-700">Recipient Info</legend>
                <label className="text-sm">Researcher Name</label>
                <input className="mt-1 px-3 py-2 border rounded w-full" value={researcherName} onChange={(e)=>setResearcherName(e.target.value)} placeholder="Dr. Amelia Chen" />
                <label className="text-sm mt-2">Research Focus / Project</label>
                <textarea rows={2} className="mt-1 px-3 py-2 border rounded w-full" value={researchFocus} onChange={(e)=>setResearchFocus(e.target.value)} placeholder="..." />
              </fieldset>

              <fieldset className="p-4 border border-blue-200 rounded-lg space-y-3">
                <legend className="text-blue-700">Your Information</legend>
                <div className="flex justify-end -mt-2 mb-2">
                  <button onClick={clearSavedInfo} className="text-xs px-2 py-1 border rounded text-gray-600">Clear saved info</button>
                </div>
                <label className="text-sm">Your Name</label>
                <input className="mt-1 px-3 py-2 border rounded w-full" value={userName} onChange={(e)=>setUserName(e.target.value)} placeholder="Alex Johnson" />
                <label className="text-sm mt-2">Your Role/Affiliation</label>
                <input className="mt-1 px-3 py-2 border rounded w-full" value={userAffiliation} onChange={(e)=>setUserAffiliation(e.target.value)} placeholder="3rd-year Undergraduate Student, Computer Science" />
                <label className="text-sm mt-2">Technical Skills</label>
                <input className="mt-1 px-3 py-2 border rounded w-full" value={technicalSkills} onChange={(e)=>setTechnicalSkills(e.target.value)} placeholder="Python, PyTorch, C++" />
              </fieldset>

              <fieldset className="p-4 border border-green-200 rounded-lg space-y-3">
                <legend className="text-green-700">Motivation & Attachments</legend>
                <label className="text-sm">Motivation / Background</label>
                <textarea rows={4} className="mt-1 px-3 py-2 border rounded w-full" value={motivation} onChange={(e)=>setMotivation(e.target.value)} placeholder="My final year project ..." />
                <div className="flex space-x-4 items-center pt-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={attachResume} onChange={(e)=>setAttachResume(e.target.checked)} />
                    <span>Resume/CV attached</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={attachTranscript} onChange={(e)=>setAttachTranscript(e.target.checked)} />
                    <span>Transcript/Portfolio attached</span>
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="flex space-x-2">
              <button onClick={generateEmail} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded">
                {isLoading ? 'Generating...' : 'Generate Email'}
              </button>
              <button onClick={generateSubjectSuggestions} className="px-4 py-2 bg-yellow-500 text-white rounded">Suggest Subject</button>
              <button onClick={generateSignature} className="px-4 py-2 bg-gray-800 text-white rounded">Generate Signature</button>
            </div>
            {error && <div className="text-red-600">{error}</div>}
          </section>

          {/* Output & Templates */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 flex items-center space-x-2">
              <MailIcon className="w-5 h-5 text-gray-500" />
              <span>Generated Email & Templates</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2 p-4 border rounded bg-gray-50 min-h-[250px] relative">
                <label className="text-sm font-medium">Subject</label>
                <input className="mt-1 mb-3 px-3 py-2 border rounded w-full" value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject line" />

                <label className="text-sm font-medium">Email Body (editable)</label>
                <textarea className="mt-1 px-3 py-2 border rounded w-full h-40" value={generatedEmail} onChange={(e)=>setGeneratedEmail(e.target.value)} placeholder="Your generated email will appear here..." />
                <label className="text-sm font-medium mt-2">Signature</label>
                <textarea className="mt-1 px-3 py-2 border rounded w-full h-24" value={signature} onChange={(e)=>setSignature(e.target.value)} />

                <div className="flex space-x-2 mt-3">
                  <button onClick={()=>copyToClipboard(`${subject}\n\n${generatedEmail}\n\n${signature}`)} className="px-3 py-1 bg-white border rounded">Copy</button>
                  <button onClick={()=>openInGmail(selectedProfessors[0]?.email || '')} className="px-3 py-1 bg-blue-600 text-white rounded">Open in Gmail</button>
                  <button onClick={()=>saveTemplate('Saved template ' + (new Date()).toLocaleString())} className="px-3 py-1 bg-green-600 text-white rounded">Save Template</button>
                </div>

                <div className="absolute top-3 right-3">
                  <button onClick={()=>copyToClipboard(generatedEmail)} className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-md transition duration-150 ${isCopied ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200 border'}`}>
                    {isCopied ? (<><ClipboardCheckIcon className="w-4 h-4" /><span>Copied</span></>) : (<><ClipboardCopyIcon className="w-4 h-4" /><span>Copy</span></>)}
                  </button>
                </div>
              </div>

              <aside className="p-4 border rounded space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Templates</h3>
                </div>
                {templates.length === 0 && <p className="text-sm text-gray-500">No templates saved yet</p>}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {templates.map(t => (
                    <div key={t.id} className="p-2 border rounded bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.subject}</div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button onClick={()=>applyTemplate(t)} className="text-xs bg-blue-100 px-2 rounded">Apply</button>
                          <button onClick={()=>deleteTemplate(t.id)} className="text-xs bg-red-100 px-2 rounded">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          {/* Batch generated emails display */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Batch Generated Emails</h2>
            {generatedEmails.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {generatedEmails.map((g, i) => (
                  <div key={i} className="p-3 border rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{g.professor.name}</div>
                        <div className="text-xs text-gray-500">{new Date(g.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <pre className="mt-2 text-sm whitespace-pre-wrap">{g.email}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No batch emails generated yet</p>
            )}
          </section>

          {/* Email tracking */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Email Tracking</h2>
            {sentEmails.length === 0 ? <p className="text-sm text-gray-500">No emails generated/sent yet</p> : (
              <div className="max-h-64 overflow-y-auto border rounded p-2">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-2">Professor</th>
                      <th className="p-2">Dept</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentEmails.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-2">{s.professorName}</td>
                        <td className="p-2">{s.professorDepartment}</td>
                        <td className="p-2"><a className="text-blue-600" href={`mailto:${s.professorEmail}`}>{s.professorEmail}</a></td>
                        <td className="p-2">{new Date(s.sentDate).toLocaleDateString()}</td>
                        <td className="p-2"><span className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs">{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <button onClick={clearEmailTracking} className="text-xs bg-red-100 px-2 py-1 rounded">Clear History</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;