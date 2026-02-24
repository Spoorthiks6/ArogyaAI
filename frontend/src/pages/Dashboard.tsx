import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, AlertCircle, User, Phone, MapPin, Loader } from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import ProfileSection from "@/components/ProfileSection";
import EmergencyContacts from "@/components/EmergencyContacts";
import MedicalInfo from "@/components/MedicalInfo";
import EmergencyHistory from "@/components/EmergencyHistory";
import * as api from '../api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    checkUser();
  }, [loading]);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/auth", { replace: true });
        return;
      }

      const profileData = await api.getProfile();
      setUser({ id: profileData.userId || profileData.id, email: profileData.email });
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      navigate("/auth", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('token');
      toast({
        title: "Signed out successfully",
        description: "Stay safe!",
      });
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-medical/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">ArogyaAI</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Welcome, {profile?.full_name || user?.email}
              </CardTitle>
              <CardDescription>
                Your emergency dashboard is ready. Keep your information updated for quick response.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Profile Section */}
          <ProfileSection profile={profile} userId={user?.id} onUpdate={checkUser} />

          {/* Emergency Contacts */}
          <EmergencyContacts userId={user?.id} />

          {/* Medical Information */}
          <MedicalInfo userId={user?.id} />

          {/* Quick Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-emergency" />
                  Emergency Ready
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Press the emergency button below to instantly alert your contacts and nearby hospitals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-medical" />
                  Location Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your location will be automatically shared during emergencies for faster response.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Emergency History */}
          <EmergencyHistory />
        </div>
      </main>

      {/* Emergency Button - Fixed at bottom */}
      <EmergencyButton userId={user?.id} />
    </div>
  );
};

export default Dashboard;
