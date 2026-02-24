import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin, Phone, Clock, Heart } from "lucide-react";
import * as api from '../api';

interface EmergencyAlert {
  _id: string;
  message: string;
  location: string;
  latitude: number;
  longitude: number;
  contactsNotified: number;
  smsSent: number;
  smsFailed: number;
  status: string;
  createdAt: string;
  transcript?: string;
  translatedTranscript?: string;
  smsProvider?: string;
  patientMedicalInfo?: {
    bloodType: string;
    allergies: string[];
    medications: string[];
    medicalConditions: string[];
    emergencyNotes: string;
    organDonor: boolean;
    height?: string;
    weight?: string;
  };
  twilioDetails?: {
    messageSids: string[];
    errors: Array<{
      phone: string;
      errorCode: string;
      errorMessage: string;
    }>;
    sentDetails?: Array<{
      phone: string;
      sid: string;
      status: string;
    }>;
  };
  msg91Details?: {
    messageSids: string[];
    errors: Array<{
      phone: string;
      errorCode: string;
      errorMessage: string;
    }>;
    sentDetails?: Array<{
      phone: string;
      msgId: string;
      status: string;
    }>;
  };
}

const EmergencyHistory = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getEmergencyHistory();
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching emergency history:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="border-2 border-emergency/10">
        <CardHeader>
          <CardTitle>Emergency History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-emergency/10 shadow-md">
      <CardHeader className="bg-gradient-to-r from-emergency/5 to-emergency/2 border-b-2 border-emergency/10">
        <div className="flex items-center gap-3">
          <div className="bg-emergency/10 p-3 rounded-full">
            <AlertCircle className="h-6 w-6 text-emergency" />
          </div>
          <div>
            <CardTitle className="text-xl text-emergency">Emergency Alerts</CardTitle>
            <CardDescription>
              History of all emergency alerts and messages sent
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {alerts.length === 0 ? (
          <div className="bg-emergency/5 border border-emergency/10 rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              📋 No emergency alerts yet. Your alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert._id} className="border-l-4 border-l-emergency/50 hover:shadow-md transition-shadow bg-gradient-to-r from-white/80 to-emergency/2">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatDate(alert.createdAt)}</p>
                        <Badge variant={alert.status === 'sent' ? 'default' : 'destructive'} className="bg-emergency/80 text-white">
                          {alert.status === 'sent' ? '✓ Sent' : '✕ Failed'}
                        </Badge>
                      </div>

                      <div className="bg-gradient-to-r from-emergency/5 to-transparent p-3 rounded-lg border border-emergency/10">
                        <p className="text-sm font-medium text-foreground">{alert.message}</p>
                      </div>

                      {alert.transcript && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">🎤 Voice Transcript:</p>
                          <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-line">{alert.transcript}</p>
                        </div>
                      )}

                      {alert.translatedTranscript && alert.translatedTranscript !== alert.transcript && (
                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">🌐 Translated Message:</p>
                          <p className="text-sm text-purple-900 dark:text-purple-100">{alert.translatedTranscript}</p>
                        </div>
                      )}

                      {alert.location && (
                        <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded-lg border border-green-200 dark:border-green-800">
                          <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <a
                            href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 dark:text-green-400 hover:underline font-medium"
                          >
                            📍 {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                          </a>
                        </div>
                      )}

                      {alert.patientMedicalInfo && (alert.patientMedicalInfo.bloodType !== 'Unknown' || alert.patientMedicalInfo.allergies.length > 0 || alert.patientMedicalInfo.medications.length > 0 || alert.patientMedicalInfo.medicalConditions.length > 0) && (
                        <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            🚨 CRITICAL MEDICAL INFO
                          </p>
                          
                          {alert.patientMedicalInfo.bloodType !== 'Unknown' && (
                            <p className="text-sm font-bold text-red-900 dark:text-red-100">
                              🩸 Blood Type: <span className="text-lg">{alert.patientMedicalInfo.bloodType}</span>
                            </p>
                          )}

                          {alert.patientMedicalInfo.allergies.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-red-700 dark:text-red-300">⚠️ Allergies:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {alert.patientMedicalInfo.allergies.map((allergy, idx) => (
                                  <span key={idx} className="bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {allergy}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {alert.patientMedicalInfo.medications.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-red-700 dark:text-red-300">💊 Current Medications:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {alert.patientMedicalInfo.medications.map((med, idx) => (
                                  <span key={idx} className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {med}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {alert.patientMedicalInfo.medicalConditions.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-red-700 dark:text-red-300">🏥 Medical Conditions:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {alert.patientMedicalInfo.medicalConditions.map((condition, idx) => (
                                  <span key={idx} className="bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {condition}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {alert.patientMedicalInfo.emergencyNotes && (
                            <p className="text-xs text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/30 p-2 rounded italic">
                              📝 {alert.patientMedicalInfo.emergencyNotes}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm bg-emergency/5 p-2 rounded-lg border border-emergency/10">
                        <Phone className="h-4 w-4 text-emergency" />
                        <span>
                          <span className="font-semibold text-emergency">{alert.smsSent}</span> sent •{' '}
                          <span className={alert.smsFailed > 0 ? 'font-semibold text-destructive' : ''}>
                            {alert.smsFailed} failed
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        👥 {alert.contactsNotified} contact{alert.contactsNotified !== 1 ? 's' : ''} notified
                      </p>

                      {(alert.twilioDetails?.errors?.length > 0 || alert.msg91Details?.errors?.length > 0) && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-destructive">❌ Delivery Issues:</p>
                          
                          {/* Twilio errors */}
                          {alert.twilioDetails?.errors?.map((error, idx) => {
                            let explanation = '';
                            if (error.errorCode === '21608') {
                              explanation = '(Trial account: Number not verified in Twilio Console)';
                            } else if (error.errorCode === '30004') {
                              explanation = '(Message blocked by carrier - DLT registration required)';
                            } else if (error.errorCode === '21659') {
                              explanation = '(From number invalid - Check Sender ID on DLT)';
                            }
                            return (
                              <div key={`twilio-${idx}`} className="text-xs bg-destructive/10 p-2 rounded border border-destructive/20">
                                <p className="font-mono font-medium">{error.phone}</p>
                                <p className="text-destructive">Twilio Error {error.errorCode}: {error.errorMessage}</p>
                                {explanation && <p className="text-destructive/80 mt-1">{explanation}</p>}
                              </div>
                            );
                          })}
                          
                          {/* MSG91 errors */}
                          {alert.msg91Details?.errors?.map((error, idx) => {
                            let explanation = '';
                            if (error.errorCode === 'invalid_mobile') {
                              explanation = '(Invalid phone number format)';
                            } else if (error.errorCode === 'insufficient_credits') {
                              explanation = '(Insufficient MSG91 credits)';
                            }
                            return (
                              <div key={`msg91-${idx}`} className="text-xs bg-destructive/10 p-2 rounded border border-destructive/20">
                                <p className="font-mono font-medium">{error.phone}</p>
                                <p className="text-destructive">MSG91 Error {error.errorCode}: {error.errorMessage}</p>
                                {explanation && <p className="text-destructive/80 mt-1">{explanation}</p>}
                              </div>
                            );
                          })}
                          
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900">
                            <p className="font-medium mb-1">💡 How to fix:</p>
                            {alert.smsProvider === 'msg91' && (
                              <>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Check MSG91 account has sufficient credits</li>
                                  <li>Verify phone numbers are in E.164 format (+91XXXXXXXXXX)</li>
                                  <li>Ensure MSG91 Sender ID is approved</li>
                                </ul>
                                <p className="mt-2"><a href="https://dashboard.msg91.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">👉 MSG91 Dashboard</a></p>
                              </>
                            )}
                            {alert.smsProvider === 'twilio' && (
                              <>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Error 21608? <strong>Upgrade your Twilio account</strong> (5 min)</li>
                                  <li>Error 30004/21659? <strong>Register on India DLT portal</strong> (24-48 hours)</li>
                                </ul>
                                <p className="mt-2"><a href="https://www.twilio.com/console/account/upgrade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">👉 Upgrade Twilio Now</a></p>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {(alert.twilioDetails?.sentDetails?.length > 0 || alert.msg91Details?.sentDetails?.length > 0) && alert.smsSent > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-success">✅ Successfully Sent To:</p>
                          
                          {/* Twilio sent */}
                          {alert.twilioDetails?.sentDetails?.map((detail, idx) => (
                            <div key={`twilio-sent-${idx}`} className="text-xs bg-success/10 p-2 rounded border border-success/20">
                              <p className="font-mono">{detail.phone}</p>
                              <p className="text-success text-xs">Twilio SID: {detail.sid.substring(0, 20)}...</p>
                            </div>
                          ))}
                          
                          {/* MSG91 sent */}
                          {alert.msg91Details?.sentDetails?.map((detail, idx) => (
                            <div key={`msg91-sent-${idx}`} className="text-xs bg-success/10 p-2 rounded border border-success/20">
                              <p className="font-mono">{detail.phone}</p>
                              <p className="text-success text-xs">MSG91 ID: {detail.msgId.substring(0, 20)}...</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyHistory;
