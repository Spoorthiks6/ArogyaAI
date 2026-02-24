import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Save, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MedicalInfoProps {
  userId: string;
}

interface MedicalData {
  bloodType: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  emergencyNotes: string;
  height?: string;
  weight?: string;
  organDonor: boolean;
}

const MedicalInfo = ({ userId }: MedicalInfoProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [medicalInfo, setMedicalInfo] = useState<MedicalData>({
    bloodType: "Unknown",
    allergies: [],
    medications: [],
    medicalConditions: [],
    emergencyNotes: "",
    organDonor: false,
  });
  const [tempInput, setTempInput] = useState("");

  useEffect(() => {
    fetchMedicalInfo();
  }, [userId]);

  const fetchMedicalInfo = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/profile/medical`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMedicalInfo(data);
      }
    } catch (error) {
      console.error("Error fetching medical info:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load medical information",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveMedicalInfo = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/profile/medical`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(medicalInfo),
        }
      );

      if (response.ok) {
        toast({
          title: "✅ Saved",
          description: "Medical information saved successfully",
        });
        setIsEditing(false);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving medical info:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save medical information",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (field: "allergies" | "medications" | "medicalConditions") => {
    if (tempInput.trim()) {
      setMedicalInfo({
        ...medicalInfo,
        [field]: [...medicalInfo[field], tempInput.trim()],
      });
      setTempInput("");
    }
  };

  const removeItem = (
    field: "allergies" | "medications" | "medicalConditions",
    index: number
  ) => {
    setMedicalInfo({
      ...medicalInfo,
      [field]: medicalInfo[field].filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <CardTitle>Medical Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <div>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>
                Critical health details for emergency responders
              </CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blood Type */}
        <div>
          <label className="text-sm font-semibold mb-2 block">Blood Type</label>
          {isEditing ? (
            <select
              value={medicalInfo.bloodType}
              onChange={(e) =>
                setMedicalInfo({
                  ...medicalInfo,
                  bloodType: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="Unknown">Unknown</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          ) : (
            <p className="text-lg font-bold text-red-600">
              {medicalInfo.bloodType}
            </p>
          )}
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Height</label>
            {isEditing ? (
              <Input
                placeholder="e.g., 5ft 10in or 178 cm"
                value={medicalInfo.height || ""}
                onChange={(e) =>
                  setMedicalInfo({
                    ...medicalInfo,
                    height: e.target.value,
                  })
                }
              />
            ) : (
              <p className="text-sm">{medicalInfo.height || "Not specified"}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Weight</label>
            {isEditing ? (
              <Input
                placeholder="e.g., 75 kg or 165 lbs"
                value={medicalInfo.weight || ""}
                onChange={(e) =>
                  setMedicalInfo({
                    ...medicalInfo,
                    weight: e.target.value,
                  })
                }
              />
            ) : (
              <p className="text-sm">{medicalInfo.weight || "Not specified"}</p>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            ⚠️ Allergies
          </label>
          <div className="space-y-2">
            {medicalInfo.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {medicalInfo.allergies.map((allergy, idx) => (
                  <div
                    key={idx}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {allergy}
                    {isEditing && (
                      <button
                        onClick={() =>
                          removeItem("allergies", idx)
                        }
                        className="hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None listed</p>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add allergy..."
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addItem("allergies");
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => addItem("allergies")}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Medications */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            💊 Current Medications
          </label>
          <div className="space-y-2">
            {medicalInfo.medications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {medicalInfo.medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {med}
                    {isEditing && (
                      <button
                        onClick={() =>
                          removeItem("medications", idx)
                        }
                        className="hover:text-blue-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None listed</p>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add medication..."
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addItem("medications");
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => addItem("medications")}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            🏥 Medical Conditions
          </label>
          <div className="space-y-2">
            {medicalInfo.medicalConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {medicalInfo.medicalConditions.map((condition, idx) => (
                  <div
                    key={idx}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {condition}
                    {isEditing && (
                      <button
                        onClick={() =>
                          removeItem("medicalConditions", idx)
                        }
                        className="hover:text-yellow-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None listed</p>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add condition..."
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addItem("medicalConditions");
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => addItem("medicalConditions")}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Notes */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            📝 Emergency Notes
          </label>
          {isEditing ? (
            <textarea
              value={medicalInfo.emergencyNotes}
              onChange={(e) =>
                setMedicalInfo({
                  ...medicalInfo,
                  emergencyNotes: e.target.value,
                })
              }
              placeholder="Any additional information for emergency responders..."
              className="w-full px-3 py-2 border rounded-md min-h-24"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {medicalInfo.emergencyNotes ||
                "No additional notes"}
            </p>
          )}
        </div>

        {/* Organ Donor */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="checkbox"
              checked={medicalInfo.organDonor}
              onChange={(e) =>
                setMedicalInfo({
                  ...medicalInfo,
                  organDonor: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
          ) : (
            <input
              type="checkbox"
              checked={medicalInfo.organDonor}
              disabled
              className="h-4 w-4"
            />
          )}
          <label className="text-sm font-semibold">Organ Donor</label>
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={saveMedicalInfo}
              disabled={isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
          💙 Your medical information will be automatically included in all
          emergency alerts to help responders provide the best care.
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalInfo;
