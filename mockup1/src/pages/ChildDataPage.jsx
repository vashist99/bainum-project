import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { ArrowLeft, User, Calendar, Languages, Stethoscope, Users, FileText, BookOpen, MessageCircle, Microscope, Brain, Plus, Trash2, Upload, Mic, Check, X, Download } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import ReactSpeedometer, { CustomSegmentLabelPosition } from "react-d3-speedometer";

const ChildDataPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user, isParent, isAdmin } = useAuth();

  // Prevent parents from navigating away using browser back button
  useEffect(() => {
    if (isParent() && user?.childId) {
      const handlePopState = (e) => {
        // Prevent navigation away from child's page
        window.history.pushState(null, '', `/data/child/${user.childId}`);
        toast.info("You can only view your child's data page");
      };

      // Push current state to prevent back navigation
      window.history.pushState(null, '', `/data/child/${user.childId}`);
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isParent, user, childId]);
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [recordingDate, setRecordingDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [uploading, setUploading] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [allAssessments, setAllAssessments] = useState([]);
  const [viewMode, setViewMode] = useState("dotmatrix"); // "dotmatrix" or "semicircular"
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState(null);
  const [pendingAssessment, setPendingAssessment] = useState(null);

  useEffect(() => {
    const fetchChild = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/children/${childId}`);
        const childData = response.data.child;
        
        if (!childData) {
          console.error("No child data received from API");
          setChild(null);
          setLoading(false);
          return;
        }
        
        // If user is a parent, verify they have access to this child
        if (user?.role === 'parent' && user?.childId) {
          const userChildId = typeof user.childId === 'string' ? user.childId : user.childId.toString();
          const currentChildId = childData._id?.toString() || childData.id?.toString();
          
          if (userChildId !== currentChildId) {
            toast.error("You don't have access to this child's data");
            // Redirect to their own child's page instead of home
            navigate(`/data/child/${user.childId}`, { replace: true });
            return;
          }
        }
        
        setChild(childData);
      } catch (error) {
        console.error("Error fetching child:", error);
        if (error.response?.status === 403) {
          toast.error("You don't have access to this child's data");
          // Redirect to their own child's page if parent
          if (user?.role === 'parent' && user?.childId) {
            navigate(`/data/child/${user.childId}`, { replace: true });
          } else {
            navigate("/home");
          }
        }
        setChild(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [childId, user, navigate]);

  // Load notes from database
  useEffect(() => {
    const fetchNotes = async () => {
      if (childId) {
        try {
          const response = await axios.get(`/api/notes/child/${childId}`);
          setNotes(response.data.notes || []);
        } catch (error) {
          // Only log if it's not a 404 (which is expected if no notes exist)
          if (error.response?.status !== 404) {
          console.error("Error fetching notes:", error);
          }
          setNotes([]);
        }
      }
    };

    fetchNotes();
  }, [childId]);

  // Load latest assessment from database
  useEffect(() => {
    const fetchLatestAssessment = async () => {
      if (childId) {
        try {
          const response = await axios.get(`/api/assessments/child/${childId}/latest`);
          setLatestAssessment(response.data.assessment);
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error("Error fetching assessment:", error);
          }
          setLatestAssessment(null);
        }
      }
    };

    fetchLatestAssessment();
  }, [childId]);

  // Load all assessments from database for aggregation
  useEffect(() => {
    const fetchAllAssessments = async () => {
      if (childId) {
        try {
          const response = await axios.get(`/api/assessments/child/${childId}`);
          setAllAssessments(response.data.assessments || []);
        } catch (error) {
          console.error("Error fetching all assessments:", error);
          setAllAssessments([]);
        }
      }
    };

    fetchAllAssessments();
  }, [childId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      const noteData = {
        childId,
        content: newNote,
        author: user?.name || "Unknown User",
        authorId: user?.id
      };

      const response = await axios.post("/api/notes", noteData);
      
      // Add the new note to the list
      setNotes([response.data.note, ...notes]);
      setNewNote("");
      toast.success("Note added successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add note";
      toast.error(errorMessage);
      console.error("Error adding note:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await axios.delete(`/api/notes/${noteId}`);
        setNotes(notes.filter(note => note._id !== noteId));
        toast.success("Note deleted successfully!");
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to delete note";
        toast.error(errorMessage);
        console.error("Error deleting note:", error);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File size must be less than 25MB");
        return;
      }
      setAudioFile(file);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    if (!recordingDate) {
      toast.error("Please select a recording date");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('childId', childId);
      formData.append('uploadedBy', user?.name || "Unknown");
      formData.append('recordingDate', recordingDate);

      const response = await axios.post('/api/whisper', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Assessment result:", response.data);

      // Store transcript and assessment data for review
      if (response.data.transcript && response.data.assessment) {
        setPendingTranscript(response.data.transcript);
        setPendingAssessment(response.data.assessment);

        // Close upload modal and show transcript modal
      setShowUploadModal(false);
      setAudioFile(null);
        setShowTranscriptModal(true);
      } else {
        // Fallback if no transcript (shouldn't happen, but handle gracefully)
        toast.error("No transcript received from server");
        setUploading(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to process audio";
      toast.error(errorMessage);
      console.error("Error uploading audio:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleAcceptTranscript = async () => {
    try {
      console.log("Accepting transcript, pendingAssessment:", pendingAssessment);
      console.log("KeywordCounts being sent:", pendingAssessment?.keywordCounts);
      
      // Save the assessment to the server
      const response = await axios.post('/api/assessments/accept', pendingAssessment);
      
      console.log("Assessment saved, response:", response.data);
      console.log("Saved assessment keywordCounts:", response.data.assessment?.keywordCounts);
      
      toast.success("Assessment saved successfully!");
      
      // Update local state with saved assessment
      setLatestAssessment(response.data.assessment);
      
      // Reload all assessment data to ensure we have the latest
      const assessmentResponse = await axios.get(`/api/assessments/child/${childId}/latest`);
      setLatestAssessment(assessmentResponse.data.assessment);
      
      // Reload all assessments for aggregation
      const allAssessmentsResponse = await axios.get(`/api/assessments/child/${childId}`);
      console.log("All assessments loaded:", allAssessmentsResponse.data.assessments?.length || 0);
      console.log("First assessment keywordCounts:", allAssessmentsResponse.data.assessments?.[0]?.keywordCounts);
      setAllAssessments(allAssessmentsResponse.data.assessments || []);
      
      // Close transcript modal and reset
      setShowTranscriptModal(false);
      setPendingTranscript(null);
      setPendingAssessment(null);
    } catch (error) {
      console.error("Error accepting transcript:", error);
      const errorMessage = error.response?.data?.message || "Error saving assessment";
      toast.error(errorMessage);
    }
  };

  const handleRejectTranscript = () => {
    // Reject: just close the modal without saving
    // Note: The assessment is already saved on the server, so this is more of a "dismiss" action
    // If you want to actually delete it, you'd need to add a delete endpoint
    toast.info("Transcript review cancelled");
    setShowTranscriptModal(false);
    setPendingTranscript(null);
    setPendingAssessment(null);
  };

  // Get language development data from latest assessment
  const languageData = useMemo(() => {
    if (latestAssessment) {
      return {
        scienceTalk: latestAssessment.scienceTalk || 0,
        socialTalk: latestAssessment.socialTalk || 0,
        literatureTalk: latestAssessment.literatureTalk || 0,
        languageDevelopment: latestAssessment.languageDevelopment || 0,
      };
    }
    return null;
  }, [latestAssessment]);

  // Group assessments by month and aggregate keyword counts
  const monthlyKeywordData = useMemo(() => {
    try {
      const monthlyData = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize all months with 0 counts
      monthNames.forEach((month, index) => {
        monthlyData[index] = {
          month,
          science: 0,
          social: 0,
          literature: 0,
          language: 0
        };
      });

      // Aggregate assessments by month
      if (Array.isArray(allAssessments)) {
        allAssessments.forEach(assessment => {
          if (assessment && assessment.date && assessment.keywordCounts) {
            try {
              const date = new Date(assessment.date);
              if (!isNaN(date.getTime())) {
                const monthIndex = date.getMonth(); // 0-11
                
                if (monthlyData[monthIndex]) {
                  monthlyData[monthIndex].science += assessment.keywordCounts.science || 0;
                  monthlyData[monthIndex].social += assessment.keywordCounts.social || 0;
                  monthlyData[monthIndex].literature += assessment.keywordCounts.literature || 0;
                  monthlyData[monthIndex].language += assessment.keywordCounts.language || 0;
                }
              }
            } catch (error) {
              console.error("Error processing assessment date:", error);
            }
          }
        });
      }

      return monthlyData;
    } catch (error) {
      console.error("Error in getMonthlyKeywordData:", error);
      // Return empty data structure on error
      const emptyData = {};
      for (let i = 0; i < 12; i++) {
        emptyData[i] = { month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i], science: 0, social: 0, literature: 0, language: 0 };
      }
      return emptyData;
    }
  }, [allAssessments]);

  // Calculate total aggregated keyword counts for speedometer
  const totalKeywordCounts = useMemo(() => {
    try {
      const totals = {
      scienceTalk: 0,
      socialTalk: 0,
      literatureTalk: 0,
      languageDevelopment: 0
    };

      if (Array.isArray(allAssessments)) {
        allAssessments.forEach(assessment => {
          if (assessment && assessment.keywordCounts) {
            totals.scienceTalk += assessment.keywordCounts.science || 0;
            totals.socialTalk += assessment.keywordCounts.social || 0;
            totals.literatureTalk += assessment.keywordCounts.literature || 0;
            totals.languageDevelopment += assessment.keywordCounts.language || 0;
          }
        });
      }

      return totals;
    } catch (error) {
      console.error("Error in getTotalKeywordCounts:", error);
      return { scienceTalk: 0, socialTalk: 0, literatureTalk: 0, languageDevelopment: 0 };
    }
  }, [allAssessments]);

  // Calculate dynamic max value for speedometer based on highest total
  const speedometerMax = useMemo(() => {
    try {
      const maxValue = Math.max(
        totalKeywordCounts.scienceTalk,
        totalKeywordCounts.socialTalk,
        totalKeywordCounts.literatureTalk,
        totalKeywordCounts.languageDevelopment
      );
      // Round up to nearest 50, with minimum of 200
      return Math.max(200, Math.ceil(maxValue / 50) * 50);
    } catch (error) {
      console.error("Error in getSpeedometerMax:", error);
      return 200;
    }
  }, [totalKeywordCounts]);

  // Calculate age in months from date of birth
  const calculateAgeInMonths = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Calculate difference in months
    const yearsDiff = today.getFullYear() - birthDate.getFullYear();
    const monthsDiff = today.getMonth() - birthDate.getMonth();
    
    const totalMonths = yearsDiff * 12 + monthsDiff;
    
    // If the day of month hasn't occurred yet this month, subtract one
    if (today.getDate() < birthDate.getDate()) {
      return Math.max(0, totalMonths - 1);
    }
    
    return totalMonths;
  };

  const ageInMonths = calculateAgeInMonths(child?.dateOfBirth);

  // Semicircular Dial Component
  const SemicircularDial = ({ value, max = 200, color, label, description, icon: Icon }) => {
    // Extract color value for custom segments
    const getColorValue = (colorClass) => {
      if (colorClass.includes('blue')) return '#2563eb';
      if (colorClass.includes('green')) return '#16a34a';
      if (colorClass.includes('purple')) return '#9333ea';
      if (colorClass.includes('orange')) return '#ea580c';
      if (colorClass.includes('indigo')) return '#4f46e5';
      return '#6366f1';
    };

    try {
      return (
        <div className="flex flex-col items-center p-4">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {Icon && <Icon className={`w-5 h-5 ${color}`} />}
              <h3 className={`font-bold text-lg ${color.replace('600', '800')} dark:${color.replace('600', '200')}`}>
                {label}
              </h3>
            </div>
            <p className={`text-sm ${color.replace('600', '700')} dark:${color.replace('600', '300')}`}>
              {description}
            </p>
          </div>
          <div className="flex flex-col items-center" style={{ width: '100%', minHeight: '240px', overflow: 'visible' }}>
            <ReactSpeedometer
              maxValue={max}
              minValue={0}
              value={Math.round(Math.max(0, Math.min(value, max)))}
              needleColor={getColorValue(color)}
              customSegmentStops={(() => {
                // Generate segment stops dynamically based on max value
                const segments = 8;
                const stops = [];
                for (let i = 0; i <= segments; i++) {
                  stops.push(Math.round((max / segments) * i));
                }
                return stops;
              })()}
              segmentColors={[
                '#f59e0b', // Yellow: 0-25 (0-12.5%)
                '#f59e0b', // Yellow: 25-50 (12.5-25%)
                '#22c55e', // Green: 50-75 (25-37.5%)
                '#22c55e', // Green: 75-100 (37.5-50%)
                '#22c55e', // Green: 100-125 (50-62.5%)
                '#22c55e', // Green: 125-150 (62.5-75%)
                '#ef4444', // Red: 150-175 (75-87.5%)
                '#ef4444', // Red: 175-200 (87.5-100%)
              ]}
              segmentValueFormatter={(value) => {
                // Show labels at all stop points (segment boundaries)
                return String(Math.round(value));
              }}
              ringWidth={30}
              needleTransitionDuration={1000}
              needleTransition="easeElastic"
              textColor="#ffffff"
              valueTextFontSize="16px"
              labelFontSize="12px"
              currentValueText={`${Math.round(value)} words`}
              width={280}
              height={200}
              paddingHorizontal={15}
              paddingVertical={30}
            />
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering speedometer:', error);
      return (
        <div className="flex flex-col items-center p-4">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {Icon && <Icon className={`w-5 h-5 ${color}`} />}
              <h3 className={`font-bold text-lg ${color.replace('600', '800')}`}>
                {label}
              </h3>
            </div>
            <p className={`text-sm ${color.replace('600', '700')}`}>
              {description}
            </p>
          </div>
          <div className="text-3xl font-bold mt-4" style={{ color: getColorValue(color) }}>
            {Math.round(value)} words
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="alert alert-warning">
            <span>Child not found</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {user?.role !== 'parent' && (
            <button
              onClick={() => navigate("/data")}
              className="btn btn-ghost btn-circle"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            )}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {child?.name || 'Child'}'s Data
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Dropdown */}
            <div className="form-control">
              <select
                className="select select-bordered select-primary"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="dotmatrix">Dot Matrix</option>
                <option value="semicircular">Semicircular Dials</option>
              </select>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary gap-2"
            >
              <Mic className="w-5 h-5" />
              Upload Recording
            </button>
          </div>
        </div>

        {/* Child Info Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div className="stat-title">Full Name</div>
                <div className="stat-value text-2xl">
                  {child?.name || 'N/A'}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-secondary">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="stat-title">Age</div>
                <div className="stat-value text-2xl">{ageInMonths} months</div>
                <div className="stat-desc text-xs text-base-content/60">
                  Born: {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-accent">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">Gender</div>
                <div className="stat-value text-2xl">{child.gender}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-info">
                  <Languages className="w-8 h-8" />
                </div>
                <div className="stat-title">Primary Language</div>
                <div className="stat-value text-2xl">{child.primaryLanguage}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-warning">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="stat-title">Diagnosis</div>
                <div className="stat-value text-2xl">
                  <span
                    className={`badge ${
                      child.diagnosis === "Yes" ? "badge-warning" : "badge-success"
                    } badge-lg`}
                  >
                    {child.diagnosis}
                  </span>
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-figure text-primary">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">Lead Teacher</div>
                <div className="stat-value text-2xl">{child.leadTeacher}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Language Development Section */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
              <Languages className="w-6 h-6 text-primary" />
              Language Development Analysis {viewMode === "dotmatrix" ? "- Year Overview" : ""}
            </h2>
            <div className="divider"></div>
            
            {viewMode === "semicircular" ? (
              // Semicircular Dials View
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                <SemicircularDial
                  value={totalKeywordCounts.scienceTalk || 0}
                  max={speedometerMax}
                  color="text-blue-600"
                  label="Talk to support Science"
                  description="Scientific vocabulary & concepts"
                  icon={Microscope}
                />
                <SemicircularDial
                  value={totalKeywordCounts.socialTalk || 0}
                  max={speedometerMax}
                  color="text-green-600"
                  label="Talk to support social interactions"
                  description="Communication & interaction"
                  icon={MessageCircle}
                />
                <SemicircularDial
                  value={totalKeywordCounts.literatureTalk || 0}
                  max={speedometerMax}
                  color="text-purple-600"
                  label="Talk to support Literature"
                  description="Storytelling & narrative skills"
                  icon={BookOpen}
                />
                <SemicircularDial
                  value={totalKeywordCounts.languageDevelopment || 0}
                  max={speedometerMax}
                  color="text-orange-600"
                  label="Talk to support Language development"
                  description="Overall language growth"
                  icon={Brain}
                />
              </div>
            ) : (
              // Dot Matrix View
              <div className="space-y-8">
              {/* Talk to support Science - Year View */}
              <div className="border-b border-base-300 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Microscope className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">Talk to support Science</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Scientific vocabulary & concepts</p>
                  </div>
                </div>
                {/* Monthly Grid */}
                <div className="flex flex-col gap-3">
                  {/* Month Labels */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                      <div 
                        key={month} 
                        className="text-xs text-base-content/60 text-center w-16"
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                  
                  {/* Month Boxes Grid */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIndex) => {
                      const monthData = monthlyKeywordData?.[monthIndex] || {};
                      const wordCount = monthData.science || 0;
                      // Intensity based on words: 0-80, 80-110, 110-140, 140-170, 170+
                      const intensity = wordCount < 80 ? 0 : wordCount < 110 ? 1 : wordCount < 140 ? 2 : wordCount < 170 ? 3 : 4;
                      const colors = [
                        'bg-blue-100 dark:bg-blue-950/20',
                        'bg-blue-300 dark:bg-blue-800/50',
                        'bg-blue-500 dark:bg-blue-600',
                        'bg-blue-600 dark:bg-blue-500',
                        'bg-blue-700 dark:bg-blue-400'
                      ];
                      return (
                        <div
                          key={month}
                          className={`w-16 h-16 rounded-lg ${colors[intensity]} hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer flex flex-col items-center justify-center`}
                          title={`${month}: ${wordCount} words`}
                        >
                          <span className="text-xs font-semibold text-base-content/70">{wordCount}</span>
                          <span className="text-[10px] text-base-content/50">words</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-base-content/60">
                    <span>Fewer words</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-lg bg-blue-100 dark:bg-blue-950/20"></div>
                      <div className="w-4 h-4 rounded-lg bg-blue-300 dark:bg-blue-800/50"></div>
                      <div className="w-4 h-4 rounded-lg bg-blue-500 dark:bg-blue-600"></div>
                      <div className="w-4 h-4 rounded-lg bg-blue-600 dark:bg-blue-500"></div>
                      <div className="w-4 h-4 rounded-lg bg-blue-700 dark:bg-blue-400"></div>
                    </div>
                    <span>More words</span>
                  </div>
                </div>
              </div>

              {/* Talk to support social interactions - Year View */}
              <div className="border-b border-base-300 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-bold text-lg text-green-800 dark:text-green-200">Talk to support social interactions</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Communication & interaction</p>
                  </div>
                </div>
                {/* Monthly Grid */}
                <div className="flex flex-col gap-3">
                  {/* Month Labels */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                      <div 
                        key={month} 
                        className="text-xs text-base-content/60 text-center w-16"
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                  
                  {/* Month Boxes Grid */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIndex) => {
                      const monthData = monthlyKeywordData?.[monthIndex] || {};
                      const wordCount = monthData.social || 0;
                      const intensity = wordCount < 80 ? 0 : wordCount < 110 ? 1 : wordCount < 140 ? 2 : wordCount < 170 ? 3 : 4;
                      const colors = [
                        'bg-green-100 dark:bg-green-950/20',
                        'bg-green-300 dark:bg-green-800/50',
                        'bg-green-500 dark:bg-green-600',
                        'bg-green-600 dark:bg-green-500',
                        'bg-green-700 dark:bg-green-400'
                      ];
                      return (
                        <div
                          key={month}
                          className={`w-16 h-16 rounded-lg ${colors[intensity]} hover:ring-2 hover:ring-green-500 transition-all cursor-pointer flex flex-col items-center justify-center`}
                          title={`${month}: ${wordCount} words`}
                        >
                          <span className="text-xs font-semibold text-base-content/70">{wordCount}</span>
                          <span className="text-[10px] text-base-content/50">words</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-base-content/60">
                    <span>Fewer words</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-lg bg-green-100 dark:bg-green-950/20"></div>
                      <div className="w-4 h-4 rounded-lg bg-green-300 dark:bg-green-800/50"></div>
                      <div className="w-4 h-4 rounded-lg bg-green-500 dark:bg-green-600"></div>
                      <div className="w-4 h-4 rounded-lg bg-green-600 dark:bg-green-500"></div>
                      <div className="w-4 h-4 rounded-lg bg-green-700 dark:bg-green-400"></div>
                    </div>
                    <span>More words</span>
                  </div>
                </div>
              </div>

              {/* Talk to support Literature - Year View */}
              <div className="border-b border-base-300 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-lg text-purple-800 dark:text-purple-200">Talk to support Literature</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Storytelling & narrative skills</p>
                  </div>
                </div>
                {/* Monthly Grid */}
                <div className="flex flex-col gap-3">
                  {/* Month Labels */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                      <div 
                        key={month} 
                        className="text-xs text-base-content/60 text-center w-16"
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                  
                  {/* Month Boxes Grid */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIndex) => {
                      const monthData = monthlyKeywordData?.[monthIndex] || {};
                      const wordCount = monthData.literature || 0;
                      const intensity = wordCount < 80 ? 0 : wordCount < 110 ? 1 : wordCount < 140 ? 2 : wordCount < 170 ? 3 : 4;
                      const colors = [
                        'bg-purple-100 dark:bg-purple-950/20',
                        'bg-purple-300 dark:bg-purple-800/50',
                        'bg-purple-500 dark:bg-purple-600',
                        'bg-purple-600 dark:bg-purple-500',
                        'bg-purple-700 dark:bg-purple-400'
                      ];
                      return (
                        <div
                          key={month}
                          className={`w-16 h-16 rounded-lg ${colors[intensity]} hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer flex flex-col items-center justify-center`}
                          title={`${month}: ${wordCount} words`}
                        >
                          <span className="text-xs font-semibold text-base-content/70">{wordCount}</span>
                          <span className="text-[10px] text-base-content/50">words</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-base-content/60">
                    <span>Fewer words</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-lg bg-purple-100 dark:bg-purple-950/20"></div>
                      <div className="w-4 h-4 rounded-lg bg-purple-300 dark:bg-purple-800/50"></div>
                      <div className="w-4 h-4 rounded-lg bg-purple-500 dark:bg-purple-600"></div>
                      <div className="w-4 h-4 rounded-lg bg-purple-600 dark:bg-purple-500"></div>
                      <div className="w-4 h-4 rounded-lg bg-purple-700 dark:bg-purple-400"></div>
                    </div>
                    <span>More words</span>
                  </div>
                </div>
              </div>

              {/* Talk to support Language development - Year View */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="font-bold text-lg text-orange-800 dark:text-orange-200">Talk to support Language development</h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Overall language growth</p>
                  </div>
                </div>
                {/* Monthly Grid */}
                <div className="flex flex-col gap-3">
                  {/* Month Labels */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                      <div 
                        key={month} 
                        className="text-xs text-base-content/60 text-center w-16"
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                  
                  {/* Month Boxes Grid */}
                  <div className="flex gap-3 justify-center">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIndex) => {
                      const monthData = monthlyKeywordData?.[monthIndex] || {};
                      const wordCount = monthData.language || 0;
                      const intensity = wordCount < 80 ? 0 : wordCount < 110 ? 1 : wordCount < 140 ? 2 : wordCount < 170 ? 3 : 4;
                      const colors = [
                        'bg-orange-100 dark:bg-orange-950/20',
                        'bg-orange-300 dark:bg-orange-800/50',
                        'bg-orange-500 dark:bg-orange-600',
                        'bg-orange-600 dark:bg-orange-500',
                        'bg-orange-700 dark:bg-orange-400'
                      ];
                      return (
                        <div
                          key={month}
                          className={`w-16 h-16 rounded-lg ${colors[intensity]} hover:ring-2 hover:ring-orange-500 transition-all cursor-pointer flex flex-col items-center justify-center`}
                          title={`${month}: ${wordCount} words`}
                        >
                          <span className="text-xs font-semibold text-base-content/70">{wordCount}</span>
                          <span className="text-[10px] text-base-content/50">words</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-base-content/60">
                    <span>Fewer words</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-lg bg-orange-100 dark:bg-orange-950/20"></div>
                      <div className="w-4 h-4 rounded-lg bg-orange-300 dark:bg-orange-800/50"></div>
                      <div className="w-4 h-4 rounded-lg bg-orange-500 dark:bg-orange-600"></div>
                      <div className="w-4 h-4 rounded-lg bg-orange-600 dark:bg-orange-500"></div>
                      <div className="w-4 h-4 rounded-lg bg-orange-700 dark:bg-orange-400"></div>
                    </div>
                    <span>More words</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Language Development Insights */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Language Development Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h4 className="font-semibold text-sm mb-2">Strengths</h4>
                    <ul className="text-sm space-y-1">
                      {languageData?.scienceTalk > 80 && <li>• Strong scientific vocabulary</li>}
                      {languageData?.socialTalk > 80 && <li>• Excellent social communication</li>}
                      {languageData?.literatureTalk > 80 && <li>• Advanced storytelling skills</li>}
                      {languageData?.languageDevelopment > 80 && <li>• Rapid language development</li>}
                      {(!languageData || Object.values(languageData).every(v => v <= 80)) && 
                        <li>• Consistent progress across all areas</li>
                      }
                    </ul>
                  </div>
                </div>
                
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h4 className="font-semibold text-sm mb-2">Areas for Growth</h4>
                    <ul className="text-sm space-y-1">
                      {languageData?.scienceTalk < 70 && <li>• Science vocabulary development</li>}
                      {languageData?.socialTalk < 70 && <li>• Social interaction skills</li>}
                      {languageData?.literatureTalk < 70 && <li>• Narrative and storytelling</li>}
                      {languageData?.languageDevelopment < 70 && <li>• Overall language skills</li>}
                      {(!languageData || Object.values(languageData).every(v => v >= 70)) && 
                        <li>• Continue current development trajectory</li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Data Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Word Assessment Scores
              </h2>
              <div className="divider"></div>
              
              {/* Overall Assessment Score Dial */}
              <div className="flex justify-center mb-6">
                <SemicircularDial
                  value={Math.round(
                    ((totalKeywordCounts?.scienceTalk || 0) +
                     (totalKeywordCounts?.socialTalk || 0) +
                     (totalKeywordCounts?.literatureTalk || 0) +
                     (totalKeywordCounts?.languageDevelopment || 0)) / 4
                  )}
                  max={speedometerMax}
                  color="text-indigo-600"
                  label="Overall Assessment Score"
                  description="Average words spoken across all categories"
                  icon={Brain}
                />
              </div>
              
              <div className="divider"></div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Microscope className="w-4 h-4 text-blue-600" />
                      Talk to support Science
                    </span>
                    <span className="text-sm text-base-content/60">{totalKeywordCounts?.scienceTalk || 0}/{speedometerMax} words</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${((totalKeywordCounts?.scienceTalk || 0) / speedometerMax) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      Talk to support social interactions
                    </span>
                    <span className="text-sm text-base-content/60">{totalKeywordCounts?.socialTalk || 0}/{speedometerMax} words</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-green-600 transition-all duration-300 rounded-full"
                      style={{ width: `${((totalKeywordCounts?.socialTalk || 0) / speedometerMax) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      Talk to support Literature
                    </span>
                    <span className="text-sm text-base-content/60">{totalKeywordCounts?.literatureTalk || 0}/{speedometerMax} words</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                      style={{ width: `${((totalKeywordCounts?.literatureTalk || 0) / speedometerMax) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4 text-orange-600" />
                      Talk to support Language development
                    </span>
                    <span className="text-sm text-base-content/60">{totalKeywordCounts?.languageDevelopment || 0}/{speedometerMax} words</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-orange-600 transition-all duration-300 rounded-full"
                      style={{ width: `${((totalKeywordCounts?.languageDevelopment || 0) / speedometerMax) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Progress Timeline
              </h2>
              <div className="divider"></div>
              <ul className="timeline timeline-vertical">
                <li>
                  <div className="timeline-start">Jan 2024</div>
                  <div className="timeline-middle">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-primary"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="timeline-end timeline-box">Initial Assessment</div>
                  <hr className="bg-primary" />
                </li>
                <li>
                  <hr className="bg-primary" />
                  <div className="timeline-start">Mar 2024</div>
                  <div className="timeline-middle">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-base-content/20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="timeline-end timeline-box">Mid-term Review</div>
                  <hr />
                </li>
                <li>
                  <hr />
                  <div className="timeline-start">Jun 2024</div>
                  <div className="timeline-middle">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 text-base-content/20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="timeline-end timeline-box">Final Assessment</div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notes & Observations
              <span className="badge badge-primary">{notes.length}</span>
            </h2>
            <div className="divider"></div>
            
            {/* Add Note Form */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">Add New Note</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24 focus:textarea-primary"
                placeholder="Enter your observations, notes, or comments about the child's progress..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddNote();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-base-content/60">Press Ctrl+Enter to add note</span>
                <button 
                  onClick={handleAddNote}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            {notes.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Recent Notes</h3>
                {notes.map((note) => (
                  <div key={note._id} className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-base-content whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-base-content/60">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {note.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          className="btn btn-ghost btn-sm btn-circle text-error"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
                <span>No notes yet. Add your first observation above!</span>
            </div>
            )}
          </div>
        </div>

        {/* Transcripts Section - Admin Only */}
        {isAdmin() && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Transcripts
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-base-content/60">
                    {allAssessments.filter(a => a.transcript && a.transcript.trim()).length} transcript{allAssessments.filter(a => a.transcript && a.transcript.trim()).length !== 1 ? 's' : ''} available
                  </div>
                  {allAssessments.filter(a => a.transcript && a.transcript.trim()).length > 0 && (
                    <button
                      onClick={() => {
                        // Combine all transcripts into one file
                        const transcriptsWithDates = allAssessments
                          .filter(a => a.transcript && a.transcript.trim())
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((assessment) => {
                            const dateStr = new Date(assessment.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            return `=== Transcript from ${dateStr} ===\n${assessment.uploadedBy ? `Uploaded by: ${assessment.uploadedBy}\n` : ''}${assessment.transcript}\n\n`;
                          });
                        
                        const allTranscriptsText = transcriptsWithDates.join('\n');
                        const blob = new Blob([allTranscriptsText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${child?.name || 'child'}_all_transcripts_${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success("All transcripts downloaded");
                      }}
                      className="btn btn-primary btn-sm gap-2"
                      title="Download all transcripts"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                  )}
                </div>
              </div>

              {allAssessments.filter(a => a.transcript && a.transcript.trim()).length === 0 ? (
                <div className="alert alert-info">
                  <FileText className="w-5 h-5" />
                  <span>No transcripts available yet. Transcripts will appear here after recordings are processed and accepted.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {allAssessments
                    .filter(a => a.transcript && a.transcript.trim())
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((assessment) => (
                      <div key={assessment._id} className="card bg-base-200 border border-base-300">
                        <div className="card-body p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(assessment.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </h3>
                              {assessment.uploadedBy && (
                                <p className="text-sm text-base-content/60 mt-1">
                                  Uploaded by: {assessment.uploadedBy}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-base-100 p-4 rounded-lg border border-base-300 max-h-64 overflow-y-auto">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed text-base-content">
                              {assessment.transcript}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 text-xs text-base-content/60">
                            <span>
                              {assessment.transcript.length} characters • {assessment.transcript.split(/\s+/).filter(w => w.length > 0).length} words
                            </span>
                            {assessment.keywordCounts && (
                              <div className="flex gap-3">
                                <span className="badge badge-sm badge-info">
                                  Science: {assessment.keywordCounts.science || 0}
                                </span>
                                <span className="badge badge-sm badge-success">
                                  Social: {assessment.keywordCounts.social || 0}
                                </span>
                                <span className="badge badge-sm badge-warning">
                                  Literature: {assessment.keywordCounts.literature || 0}
                                </span>
                                <span className="badge badge-sm badge-secondary">
                                  Language: {assessment.keywordCounts.language || 0}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Recording Modal */}
        {showUploadModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
              <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
                <Mic className="w-6 h-6 text-primary" />
                Upload Audio Recording
              </h3>
              
              <div className="divider"></div>

              {/* Keywords Info */}
              <div className="alert alert-info mb-4">
                <div className="w-full">
                  <h4 className="font-semibold mb-2">Keywords Being Tracked:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-blue-600">🔬 Science:</span>
                      <span className="ml-2">experiment, hypothesis, observe, predict, measure</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-600">👥 Social:</span>
                      <span className="ml-2">friend, share, help, together, feelings</span>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-600">📚 Literature:</span>
                      <span className="ml-2">story, character, beginning, ending, imagine</span>
                    </div>
                    <div>
                      <span className="font-semibold text-orange-600">💬 Language:</span>
                      <span className="ml-2">word, sentence, speak, listen, communicate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Select Audio File</span>
                  <span className="label-text-alt">Max size: 25MB</span>
                </label>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga,.oga,.ogg"
                  onChange={handleFileSelect}
                  className="file-input file-input-bordered file-input-primary w-full"
                />
                {audioFile && (
                  <label className="label">
                    <span className="label-text-alt text-success">
                      ✓ Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </label>
                )}
              </div>

              {/* Recording Date */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Recording Date
                  </span>
                  <span className="label-text-alt">Date when recording was made</span>
                </label>
                <input
                  type="date"
                  value={recordingDate}
                  onChange={(e) => setRecordingDate(e.target.value)}
                  className="input input-bordered input-primary w-full"
                  max={new Date().toISOString().split('T')[0]} // Can't select future dates
                />
              </div>

              {/* Processing Info */}
              {uploading && (
                <div className="alert alert-warning mb-4">
                  <span className="loading loading-spinner"></span>
                  <div>
                    <p className="font-semibold">Processing audio...</p>
                    <p className="text-sm">Transcribing with RevAI and analyzing keywords. This may take a minute.</p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="modal-action">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setAudioFile(null);
                    setRecordingDate(new Date().toISOString().split('T')[0]); // Reset to today
                  }}
                  className="btn btn-ghost"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadAudio}
                  className="btn btn-primary gap-2"
                  disabled={!audioFile || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => !uploading && setShowUploadModal(false)}></div>
          </div>
        )}

        {/* Transcript Review Modal */}
        {showTranscriptModal && pendingTranscript && (
          <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
              <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Review Transcript
              </h3>
              
              <div className="divider"></div>

              {/* Transcript Display */}
              <div className="mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Transcribed Text</span>
                </label>
                <div className="bg-base-200 p-4 rounded-lg border border-base-300 max-h-96 overflow-y-auto">
                  <p className="text-base whitespace-pre-wrap leading-relaxed">
                    {pendingTranscript || "No transcript available"}
                  </p>
                </div>
                {pendingTranscript && (
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      {pendingTranscript.length} characters
                    </span>
                  </label>
                )}
              </div>

              {/* Assessment Preview */}
              {pendingAssessment && (
                <div className="mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Assessment Scores</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="stat bg-base-200 rounded-lg p-3">
                      <div className="stat-title text-xs">Science Talk</div>
                      <div className="stat-value text-lg">{pendingAssessment.scienceTalk || 0}%</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-3">
                      <div className="stat-title text-xs">Social Talk</div>
                      <div className="stat-value text-lg">{pendingAssessment.socialTalk || 0}%</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-3">
                      <div className="stat-title text-xs">Literature Talk</div>
                      <div className="stat-value text-lg">{pendingAssessment.literatureTalk || 0}%</div>
                    </div>
                    <div className="stat bg-base-200 rounded-lg p-3">
                      <div className="stat-title text-xs">Language Development</div>
                      <div className="stat-value text-lg">{pendingAssessment.languageDevelopment || 0}%</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="alert alert-info mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm">Please review the transcript above. Click Accept to save this assessment or Reject to cancel.</span>
              </div>

              {/* Modal Actions */}
              <div className="modal-action">
                <button
                  onClick={handleRejectTranscript}
                  className="btn btn-ghost gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={handleAcceptTranscript}
                  className="btn btn-primary gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept & Save
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={handleRejectTranscript}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildDataPage;



