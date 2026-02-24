import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Plus, Trash2 } from "lucide-react";
import * as api from '../api';

interface Contact {
  _id: string;
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

interface EmergencyContactsProps {
  userId: string;
}

const EmergencyContacts = ({ userId }: EmergencyContactsProps) => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });

  useEffect(() => {
    fetchContacts();
  }, [userId]);

  const fetchContacts = async () => {
    try {
      const data = await api.getContacts();
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
    if (!phoneRegex.test(newContact.phone)) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Please enter a valid phone number (e.g., +1234567890 or 123-456-7890)",
      });
      return;
    }

    try {
      await api.addContact({
        name: newContact.name,
        phone: newContact.phone,
        relation: newContact.relationship
      });

      toast({
        title: "Contact added",
        description: "Emergency contact has been saved.",
      });

      setNewContact({ name: "", phone: "", relationship: "" });
      setIsAdding(false);
      fetchContacts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding contact",
        description: error.message,
      });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await api.deleteContact(id);

      toast({
        title: "Contact removed",
        description: "Emergency contact has been deleted.",
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting contact",
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <CardTitle>Emergency Contacts</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
        <CardDescription>
          Add trusted contacts who will be notified in emergencies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="bg-accent/20">
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone * (with country code)</Label>
                  <Input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-xs text-muted-foreground">Format: +[country code][number] or [10-digit]</p>
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    placeholder="Spouse, Parent, Friend"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addContact}>Save Contact</Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {contacts.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No emergency contacts added yet. Click "Add Contact" to get started.
          </p>
        )}

        {contacts.map((contact) => (
          <Card key={contact._id || contact.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
                {contact.relationship && (
                  <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteContact(contact._id || contact.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default EmergencyContacts;
