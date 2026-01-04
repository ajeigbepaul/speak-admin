"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { db, storage, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function CompleteCounsellorProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", state: "", country: "" });
  const [occupation, setOccupation] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) setEmail(decodeURIComponent(emailFromQuery));
  }, [searchParams]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be signed in to complete your profile.");
        setIsSubmitting(false);
        return;
      }
      // Find the invited counselor doc by email (if exists)
      const counselorsRef = collection(db, "counselors");
      const q = query(counselorsRef, where("personalInfo.email", "==", email));
      const querySnapshot = await getDocs(q);
      let invitedDocData = null;
      if (!querySnapshot.empty) {
        invitedDocData = querySnapshot.docs[0].data();
      }
      let profilePicUrl = "";
      if (profilePic) {
        try {
          const storageRef = ref(storage, `counsellors/${user.uid}/profilePic`);
          await uploadBytes(storageRef, profilePic);
          profilePicUrl = await getDownloadURL(storageRef);
        } catch (uploadErr) {
          toast.error("Failed to upload profile picture.");
          setIsSubmitting(false);
          return;
        }
      }
      // Create or update the doc with UID as ID
      const docRef = doc(db, "counselors", user.uid);
      await setDoc(docRef, {
        ...(invitedDocData || {}),
        personalInfo: {
          ...(invitedDocData?.personalInfo || {}),
          fullName,
          email,
          phoneNumber,
          profilePic: profilePicUrl || invitedDocData?.personalInfo?.profilePic || undefined,
          address,
        },
        professionalInfo: {
          ...(invitedDocData?.professionalInfo || {}),
          occupation,
        },
        isVerified: false,
        status: "Pending",
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      // Delete the invited doc if its ID is different from the UID
      if (!querySnapshot.empty && querySnapshot.docs[0].id !== user.uid) {
        await deleteDoc(doc(db, "counselors", querySnapshot.docs[0].id));
      }
      toast.success("Your profile has been submitted for review.");
      router.push("/profile-complete");
    } catch (err) {
      toast.error("Failed to update profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
          </div>
          <div>
            <Label>Address</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input name="street" placeholder="Street" value={address.street} onChange={handleAddressChange} required />
              <Input name="city" placeholder="City" value={address.city} onChange={handleAddressChange} required />
              <Input name="state" placeholder="State" value={address.state} onChange={handleAddressChange} required />
              <Input name="country" placeholder="Country" value={address.country} onChange={handleAddressChange} required />
            </div>
          </div>
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" value={occupation} onChange={e => setOccupation(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="profilePic">Profile Picture</Label>
            <Input id="profilePic" type="file" accept="image/*" onChange={handleProfilePicChange} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Profile"}</Button>
        </form>
      </CardContent>
    </Card>
  );
} 