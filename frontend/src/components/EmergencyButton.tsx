import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mic, Square, MessageSquare, Send, MessageCircle, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as api from '../api';
import TranscriptionDisplay from './TranscriptionDisplay';

interface EmergencyButtonProps {
  userId: string;
}

const EmergencyButton = ({ userId }: EmergencyButtonProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showSharingOptions, setShowSharingOptions] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Use refs to persist transcript and speech recognition across callbacks
  const fullTranscriptRef = useRef<string>('');
  const speechRecognitionRef = useRef<any>(null);
  const emergencyTranscriptRef = useRef<string>(''); // Stores translated message for sending
  const emergencyLocationRef = useRef<any>(null); // Stores actual location for sending

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reset refs for new recording
      fullTranscriptRef.current = '';
      
      // Start Web Speech API recognition immediately
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        console.log(`🎤 Starting Web Speech API (${selectedLanguage})...`);
        const recognition = new SpeechRecognition();
        
        // Set language based on selection
        const langMap: { [key: string]: string } = {
          'en': 'en-US',
          'hi': 'hi-IN',
          'kn': 'kn-IN'
        };
        recognition.lang = langMap[selectedLanguage] || 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        speechRecognitionRef.current = recognition;

        recognition.onstart = () => {
          console.log('✅ Web Speech API started listening');
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            console.log(`   Result [${i}]:`, transcript, 'isFinal:', event.results[i].isFinal);
            
            if (event.results[i].isFinal) {
              fullTranscriptRef.current += transcript + ' ';
              console.log('   ✅ FINAL result added. fullTranscriptRef.current is now:', fullTranscriptRef.current);
            } else {
              interimTranscript += transcript;
              console.log('   ⏳ Interim result (not final)');
            }
          }
          console.log('📝 Display update - Interim:', interimTranscript, 'Full:', fullTranscriptRef.current);
          setTranscript(fullTranscriptRef.current + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('⚠️ Web Speech error:', event.error);
        };

        recognition.onend = () => {
          console.log('✅ Web Speech API stopped. Final transcript:', fullTranscriptRef.current);
          if (fullTranscriptRef.current) {
            setTranscript(fullTranscriptRef.current.trim());
          }
        };

        recognition.start();
        setTranscript(`🎤 Listening in ${selectedLanguage.toUpperCase()}...`); // Show user we're listening
      }

      // Record audio
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        console.log('🎙️ MediaRecorder stopped');
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        console.log('⏳ Waiting for Web Speech API to finalize transcript...');
        console.log('   Current transcript in ref before wait:', fullTranscriptRef.current);
        
        // Wait longer for Web Speech API to finalize
        // Web Speech API sends final results after a short silence
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('   Current transcript in ref after wait:', fullTranscriptRef.current);
        
        // Get the final transcript from ref
        const finalTranscript = fullTranscriptRef.current.trim();
        console.log('📋 FINAL TRANSCRIPT TO SEND:', finalTranscript);
        console.log('   Length:', finalTranscript.length, 'chars');
        
        if (!finalTranscript) {
          console.warn('⚠️ WARNING: Transcript is empty!');
        }
        
        await processEmergency(blob, finalTranscript);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      toast({
        title: "Recording started 🎤",
        description: `Speak in ${selectedLanguage.toUpperCase()}... transcribing in real-time`,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Could not access microphone",
        description: "Please allow microphone access to record emergency details.",
      });
    }
  };

  const stopRecording = () => {
    console.log('⏹️ Stop recording clicked');
    if (mediaRecorder && isRecording) {
      console.log('   Stopping media recorder...');
      mediaRecorder.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      // Stop Web Speech API to finalize the transcript
      if (speechRecognitionRef.current) {
        console.log('   Stopping Web Speech API...');
        speechRecognitionRef.current.stop();
      }
    }
  };

  const processEmergency = async (audioBlob: Blob, capturedTranscript: string = '') => {
    try {
      console.log('🚨 Emergency processing started with audio blob:', audioBlob);
      console.log('   Blob size:', audioBlob.size);
      console.log('   Blob type:', audioBlob.type);
      console.log('   Captured transcript from Web Speech API:', capturedTranscript);
      
      // Get location
      toast({
        title: "Getting your location...",
        description: "Please wait",
      });

      const location = await getLocation();
      setCurrentLocation(location);
      console.log('📍 Location obtained:', location);

      try {
        // Show transcription is in progress
        setIsTranscribing(true);
        setShowTranscription(true);
        
        toast({
          title: "🎤 Processing voice...",
          description: "Transcribing your message...",
        });

        console.log('📤 Sending emergency with voice to backend...');
        console.log('   Captured transcript:', capturedTranscript);
        console.log('   Transcript length:', capturedTranscript?.length || 0);
        console.log('   Transcript trimmed:', capturedTranscript?.trim() || 'EMPTY');
        
        // Build emergency message - if we have transcript, use it; otherwise indicate we're sending audio for transcription
        let emergencyMessage = '';
        
        if (capturedTranscript && typeof capturedTranscript === 'string' && capturedTranscript.trim().length > 5) {
          // We have a good transcript from Web Speech API
          emergencyMessage = `🚨 EMERGENCY: ${capturedTranscript.trim()}`;
          console.log('   ✅ Using Web Speech transcript');
        } else {
          // No transcript or too short - send audio for backend transcription
          emergencyMessage = "🚨 EMERGENCY: Voice recording received - transcribing...";
          console.log('   ⚠️ Web Speech transcript empty/short, will transcribe on backend');
        }
          
        console.log('   Final message to send:', emergencyMessage);
          
        // Send emergency alert with audio
        const result = await api.sendEmergencyWithVoice(
          emergencyMessage,
          location,
          audioBlob,
          selectedLanguage
        );

        console.log('✅ Emergency response:', result);
        
        // Get transcript from response - use translated version for SMS/WhatsApp
        let finalTranscript = '';
        let displayTranscript = '';
        
        console.log('   Checking response fields:');
        console.log('   - translatedTranscript:', result?.emergency?.translatedTranscript);
        console.log('   - transcript:', result?.emergency?.transcript);
        
        if (result?.emergency?.translatedTranscript) {
          finalTranscript = result.emergency.translatedTranscript; // Use translated for sending
          displayTranscript = result.emergency.transcript || result.emergency.translatedTranscript;
          setTranscript(displayTranscript);
          console.log(`📝 ✅ Using translated transcript: "${finalTranscript}"`);
        } else if (result?.emergency?.transcript) {
          finalTranscript = result.emergency.transcript;
          setTranscript(finalTranscript);
          console.log(`📝 ✅ Using original transcript: "${finalTranscript}"`);
        } else {
          console.log('⚠️ No transcript found in response!');
          finalTranscript = 'Emergency alert activated';
        }
        
        setIsTranscribing(false);

        // Fetch emergency contacts
        await fetchEmergencyContacts();
        
        console.log('🔔 About to send with finalTranscript:', finalTranscript);
        
        // Make sure we have a message to send
        if (!finalTranscript || finalTranscript.trim() === '') {
          console.warn('⚠️ finalTranscript is empty, using default message');
          finalTranscript = 'Emergency alert activated - voice message received';
        }
        
        // Auto-send to all contacts immediately for emergency patients
        setTimeout(() => {
          console.log('🔔 Calling autoSendEmergencyToAllContacts with:', { finalTranscript, location });
          autoSendEmergencyToAllContacts(finalTranscript, location);
        }, 500);

        toast({
          title: "🚨 Emergency Activated!",
          description: "Sending alerts to all emergency contacts...",
        });
      } catch (error: any) {
        console.error('Error sending emergency:', error);
        setIsTranscribing(false);
        toast({
          variant: "destructive",
          title: "Error creating alert",
          description: error.message || "Please try again or call emergency services directly.",
        });
      }
    } catch (error: any) {
      console.error('Error processing emergency:', error);
      setIsTranscribing(false);
      toast({
        variant: "destructive",
        title: "Error processing emergency",
        description: error.message || "Please try again or call emergency services directly.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const autoSendEmergencyToAllContacts = async (finalTranscript: string, location: any) => {
    try {
      // Fetch latest contacts
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Could not fetch emergency contacts",
        });
        return;
      }
      
      const contacts = await response.json();
      
      if (!contacts || contacts.length === 0) {
        toast({
          variant: "destructive",
          title: "No contacts",
          description: "Please add emergency contacts first",
        });
        return;
      }

      // Set emergency contacts and show sharing options
      setEmergencyContacts(contacts);
      setShowSharingOptions(true);
      setShowTranscription(false);
      
      // Store the final transcript and location for use in send functions
      emergencyTranscriptRef.current = finalTranscript;
      emergencyLocationRef.current = location;
      
      console.log('✅ Stored in refs:');
      console.log('   emergencyTranscriptRef.current:', emergencyTranscriptRef.current);
      console.log('   emergencyLocationRef.current:', emergencyLocationRef.current);

      toast({
        title: "✅ Emergency Recorded!",
        description: "Choose SMS or WhatsApp to send alerts",
      });
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch emergency contacts",
      });
    }
  };

  const handleEmergencyClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found');
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setEmergencyContacts(data || []);
      console.log('Fetched contacts:', data);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      setEmergencyContacts([]);
    }
  };

  const sendViaSMS = (contact: any) => {
    try {
      console.log('📱 sendViaSMS - Emergency transcript ref:', emergencyTranscriptRef.current);
      console.log('📱 sendViaSMS - Emergency location ref:', emergencyLocationRef.current);
      
      // Use the final transcribed and translated message from emergency flow
      const transcriptPart = emergencyTranscriptRef.current ? `\n\nVoice Message: ${emergencyTranscriptRef.current}` : '';
      // Use the location from emergency flow
      const location = emergencyLocationRef.current;
      const locationStr = (location && location.latitude && location.longitude) 
        ? `${location.latitude},${location.longitude}`
        : '12.3356,76.6196';
      const message = `🚨 EMERGENCY: I need help! My location: https://maps.google.com/?q=${locationStr}${transcriptPart}`;
      console.log('📱 Final SMS message:', message);
      
      // Remove all non-digits
      const phone = contact.phone.replace(/\D/g, '');
      const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
      window.location.href = smsUrl;
      
      toast({
        title: "📱 SMS app opened",
        description: `Message ready to send to ${contact.name}`,
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not open SMS app",
      });
    }
  };

  const sendViaWhatsApp = (contact: any) => {
    try {
      // Use the final transcribed and translated message from emergency flow
      const transcriptPart = emergencyTranscriptRef.current ? `\n\nVoice Message: ${emergencyTranscriptRef.current}` : '';
      // Use the location from emergency flow
      const location = emergencyLocationRef.current;
      const locationStr = (location && location.latitude && location.longitude) 
        ? `${location.latitude},${location.longitude}`
        : '12.3356,76.6196';
      const message = `🚨 EMERGENCY: I need help! My location: https://maps.google.com/?q=${locationStr}${transcriptPart}`;
      // Remove all non-digits
      const phone = contact.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "💬 WhatsApp opened",
        description: `Message ready to send to ${contact.name}`,
      });
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not open WhatsApp",
      });
    }
  };

  const sendSMSToAll = () => {
    try {
      if (emergencyContacts.length === 0) {
        toast({
          variant: "destructive",
          title: "No contacts",
          description: "Please add emergency contacts first",
        });
        return;
      }

      console.log('📱 sendSMSToAll - Emergency transcript ref:', emergencyTranscriptRef.current);
      console.log('📱 sendSMSToAll - Emergency location ref:', emergencyLocationRef.current);

      // Send to all contacts one by one with a slight delay
      emergencyContacts.forEach((contact, index) => {
        setTimeout(() => {
          // Use the final transcribed and translated message from emergency flow
          const transcriptPart = emergencyTranscriptRef.current ? `\n\nVoice Message: ${emergencyTranscriptRef.current}` : '';
          // Use the location from emergency flow
          const location = emergencyLocationRef.current;
          const locationStr = (location && location.latitude && location.longitude) 
            ? `${location.latitude},${location.longitude}`
            : '12.3356,76.6196';
          const message = `🚨 EMERGENCY: I need help! My location: https://maps.google.com/?q=${locationStr}${transcriptPart}`;
          console.log(`   [${index}] SMS message to ${contact.name}:`, message);
          const phone = contact.phone.replace(/\D/g, '');
          const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
          window.location.href = smsUrl;
        }, index * 100); // Small delay between each SMS
      });

      setShowSharingOptions(false);
      toast({
        title: "🚨 Emergency SMS Initiated",
        description: `Opening SMS app for ${emergencyContacts.length} contact${emergencyContacts.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error sending SMS to all:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not initiate emergency SMS",
      });
    }
  };

  const sendWhatsAppToAll = () => {
    try {
      if (emergencyContacts.length === 0) {
        toast({
          variant: "destructive",
          title: "No contacts",
          description: "Please add emergency contacts first",
        });
        return;
      }

      // Send to all contacts one by one with a slight delay
      emergencyContacts.forEach((contact, index) => {
        setTimeout(() => {
          // Use the final transcribed and translated message from emergency flow
          const transcriptPart = emergencyTranscriptRef.current ? `\n\nVoice Message: ${emergencyTranscriptRef.current}` : '';
          // Use the location from emergency flow
          const location = emergencyLocationRef.current;
          const locationStr = (location && location.latitude && location.longitude) 
            ? `${location.latitude},${location.longitude}`
            : '12.3356,76.6196';
          const message = `🚨 EMERGENCY: I need help! My location: https://maps.google.com/?q=${locationStr}${transcriptPart}`;
          const phone = contact.phone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }, index * 500); // Longer delay for WhatsApp to avoid being blocked
      });

      setShowSharingOptions(false);
      toast({
        title: "💬 Emergency WhatsApp Initiated",
        description: `Opening WhatsApp for ${emergencyContacts.length} contact${emergencyContacts.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error sending WhatsApp to all:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not initiate emergency WhatsApp",
      });
    }
  };

  const toggleSharingOptions = async () => {
    if (!showSharingOptions) {
      await fetchEmergencyContacts();
    }
    setShowSharingOptions(!showSharingOptions);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
      <div className="container mx-auto max-w-4xl pointer-events-auto space-y-3">
        {/* Transcription Display Modal */}
        {showTranscription && (
          <TranscriptionDisplay
            transcript={transcript}
            isLoading={isTranscribing}
            onClose={() => setShowTranscription(false)}
          />
        )}

        {/* Language Selector Panel - Always visible when not recording/processing */}
        {!isRecording && !isProcessing && !showSharingOptions && (
          <div className="bg-background border-2 border-primary/20 rounded-xl p-3 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedLanguage === 'en'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setSelectedLanguage('hi')}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedLanguage === 'hi'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                🇮🇳 हिंदी
              </button>
              <button
                onClick={() => setSelectedLanguage('kn')}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedLanguage === 'kn'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                🇮🇳 ಕನ್ನಡ
              </button>
            </div>
          </div>
        )}

        {/* SMS/WhatsApp Sharing Options */}
        {/* SMS/WhatsApp Sharing Panel - Shows after emergency is recorded */}
        {showSharingOptions && (
          <div className="bg-background border-2 border-emergency/30 rounded-xl p-4 space-y-3 shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emergency flex items-center gap-2">
                <span className="text-lg">📱</span> Send Emergency Alert
              </p>
              <button
                onClick={() => setShowSharingOptions(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            
            {emergencyContacts.length === 0 ? (
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">No emergency contacts added</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Contact List */}
                <div className="space-y-2 max-h-32 overflow-y-auto bg-white/30 p-3 rounded-lg">
                  {emergencyContacts.map((contact) => (
                    <div key={contact._id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                      <span className="text-lg">✓</span>
                    </div>
                  ))}
                </div>

                {/* Send Buttons - SMS and WhatsApp */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={sendSMSToAll}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>SMS</span>
                  </Button>
                  <Button
                    onClick={sendWhatsAppToAll}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Send emergency alert to all {emergencyContacts.length} contact{emergencyContacts.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Emergency Button */}
        <Button
          onClick={handleEmergencyClick}
          disabled={isProcessing || showSharingOptions}
          className={`w-full h-24 text-lg font-bold shadow-2xl transition-all rounded-xl ${
            isRecording
              ? "bg-emergency hover:bg-emergency/90 animate-pulse shadow-emergency/50 shadow-2xl"
              : "bg-emergency hover:bg-emergency/90 shadow-lg hover:shadow-xl"
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-6 w-6 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          ) : isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <Square className="h-6 w-6 animate-bounce" />
              <span className="text-sm">Tap to Stop</span>
            </div>
          ) : showSharingOptions ? (
            <div className="flex flex-col items-center gap-2">
              <Mic className="h-6 w-6" />
              <span className="text-base font-bold">Send Emergency SMS</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Mic className="h-6 w-6" />
              <span className="text-base font-bold">🚨 EMERGENCY ALERT</span>
            </div>
          )}
        </Button>

        {/* Status Messages */}
        {isRecording && (
          <div className="bg-emergency/10 border border-emergency/30 rounded-lg p-3 text-center animate-in fade-in">
            <p className="text-xs font-semibold text-emergency">🎤 Recording...</p>
            <p className="text-xs text-muted-foreground mt-1">Describe the situation clearly</p>
          </div>
        )}

        {showSharingOptions && emergencyContacts.length > 0 && !isRecording && !isProcessing && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-green-700 dark:text-green-300">✓ Emergency recorded!</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Click "SMS" or "WhatsApp" button above to notify all emergency contacts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyButton;
