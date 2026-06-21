import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/api";
import type { User } from "@supabase/supabase-js";

export function useAuth(redirectIfNoProfile = true) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      // Fetch profile after auth state set
      setTimeout(() => fetchProfileData(), 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        setLoading(false);
        return;
      }
      setUser(session.user);
      fetchProfileData();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      if (redirectIfNoProfile && data && !data.onboarding_completed) {
        navigate("/onboarding");
      }
    } catch {
      // Profile fetch may fail if not yet created
    }
    setLoading(false);
  };

  return { user, profile, loading, refetchProfile: () => fetchProfileData() };
}
