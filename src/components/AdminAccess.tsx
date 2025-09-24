import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useSecureAuth } from "@/hooks/useSecureAuth";

const AdminAccess = () => {
  const { user, isAdmin } = useSecureAuth();
  const navigate = useNavigate();

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => navigate('/admin-panel')}
        className="shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Shield className="h-5 w-5 mr-2" />
        Admin Panel
      </Button>
    </div>
  );
};

export default AdminAccess;