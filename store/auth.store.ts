import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  [key: string]: any;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initializeAuth: () => Promise<() => void>;
  loadProfile: (userId: string) => Promise<void>;

  signIn: (identifier: string, password: string) => Promise<void>;

  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
  ) => Promise<void>;

  signOut: () => Promise<void>;

  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  // =========================
  // Initialize Auth
  // =========================
  initializeAuth: async () => {
    set({ isLoading: true });
    let initialLoadHandled = false;

    const applySession = async (session: Session | null) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
      });

      if (session?.user) {
        await get().loadProfile(session.user.id);
      } else {
        set({ profile: null, isLoading: false });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      initialLoadHandled = true;
      await applySession(session);
    });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!initialLoadHandled) {
        await applySession(session);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);

      set({
        session: null,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }

    return () => subscription.unsubscribe();
  },

  // =========================
  // Load Profile
  // =========================
  loadProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile error:", error);

      set({
        profile: null,
        isLoading: false,
      });

      return;
    }

    set({
      profile: data,
      isLoading: false,
    });
  },

  // =========================
  // Sign In
  // =========================
  signIn: async (identifier, password) => {
    set({ isLoading: true });

    try {
      const isEmail = identifier.includes("@");

      let email = identifier;

      // Login using phone number
      if (!isEmail) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("phone", identifier)
          .single();

        if (error || !data?.email) {
          throw new Error("No account found with this phone number");
        }

        email = data.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("User not found");
      }

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: true,
      });

      await get().loadProfile(data.user.id);
    } catch (error) {
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        profile: null,
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // =========================
  // Sign Up
  // =========================
  signUp: async (email, password, fullName, phone) => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            email: email,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Failed to create account");
      }

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: !!data.session,
      });

      if (data.session) {
        await get().loadProfile(data.user.id);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // =========================
  // Sign Out
  // =========================
  signOut: async () => {
    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      set({
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // =========================
  // Request Password Reset
  // =========================
  requestPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "laparisienne://reset-password",
    });

    if (error) {
      throw error;
    }
  },

  // =========================
  // Update Password
  // =========================
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  },
}));
