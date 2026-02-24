import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Zap, AlertCircle } from "lucide-react";
import * as api from '../api';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-medical/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            ArogyaAI
            <span className="block text-medical mt-2">Intelligent Emergency Response</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal safety companion. Instantly alert emergency contacts and nearby hospitals with voice-enabled emergency reporting in any language.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 bg-emergency hover:bg-emergency/90"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <AlertCircle className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-emergency/10">
                <AlertCircle className="h-8 w-8 text-emergency" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Instant Alerts</h3>
            <p className="text-muted-foreground">
              One-tap emergency button sends alerts to all your contacts and nearby hospitals with your location
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-medical/10">
                <Zap className="h-8 w-8 text-medical" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Voice Recognition</h3>
            <p className="text-muted-foreground">
              Record emergency details in any language - automatically transcribed to English for responders
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-success/10">
                <Shield className="h-8 w-8 text-success" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your medical information is encrypted and only shared during confirmed emergencies
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center space-y-6 p-8 rounded-2xl bg-gradient-to-r from-emergency/10 via-medical/10 to-success/10 border">
          <h2 className="text-3xl font-bold">Ready to Stay Safe?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands who trust ArogyaAI for their safety. Set up your profile in minutes and have peace of mind.
          </p>
          <Button 
            size="lg"
            className="text-lg px-12 bg-primary hover:bg-primary/90"
            onClick={() => navigate("/auth")}
          >
            Create Your Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
