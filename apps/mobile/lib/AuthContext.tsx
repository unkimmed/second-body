import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { AvatarGender } from "@second-body/shared";

interface AuthContextValue {
  session: Session | null;
  userId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
}

interface SignUpParams {
  name: string;
  email: string;
  password: string;
  avatarName: string;
  gender: AvatarGender;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp({
    name,
    email,
    password,
    avatarName,
    gender,
  }: SignUpParams): Promise<{ needsEmailConfirm: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("가입에 실패했습니다.");

    // 이메일 인증이 비활성화된 경우 즉시 세션 발급 → 프로필 생성 가능
    if (data.session) {
      await supabase.from("users").insert({ id: data.user.id, email });
      await supabase
        .from("avatars")
        .insert({ user_id: data.user.id, avatar_name: avatarName, gender });
      return { needsEmailConfirm: false };
    }

    return { needsEmailConfirm: true };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        userId: session?.user?.id ?? null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
