"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 회원가입
 */
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  try {
    const supabase = await createClient();

    // 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split("@")[0],
          role: "user", // 기본 역할
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: "회원가입에 실패했습니다." };
    }

    // 캐시 갱신
    revalidatePath("/", "layout");
    
    // 성공 반환 (redirect는 클라이언트에서 처리)
    return { success: true };
  } catch (error) {
    console.error("회원가입 오류:", error);
    return { error: "회원가입 중 오류가 발생했습니다." };
  }
}

/**
 * 로그인
 */
export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    if (!data.user) {
      return { error: "로그인에 실패했습니다." };
    }

    // 마지막 활동 시간 업데이트
    await supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", data.user.id);

    // 캐시 갱신
    revalidatePath("/", "layout");
    
    // 성공 반환 (redirect는 클라이언트에서 처리)
    return { success: true };
  } catch (error) {
    console.error("로그인 오류:", error);
    return { error: "로그인 중 오류가 발생했습니다." };
  }
}

/**
 * 로그아웃
 */
export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    
    // 캐시 갱신
    revalidatePath("/", "layout");
    
    // 홈으로 리다이렉트
    redirect("/ko");
  } catch (error) {
    console.error("로그아웃 오류:", error);
    return { error: "로그아웃 중 오류가 발생했습니다." };
  }
}

/**
 * 현재 사용자 프로필 조회
 */
export async function getCurrentUserProfile() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("프로필 조회 오류:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("프로필 조회 중 오류:", error);
    return null;
  }
}

/**
 * 프로필 업데이트
 */
export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "로그인이 필요합니다." };
    }

    const updates = {
      full_name: formData.get("fullName") as string,
      username: formData.get("username") as string,
      bio: formData.get("bio") as string,
      avatar_url: formData.get("avatarUrl") as string,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      return { error: error.message };
    }

    // 캐시 갱신
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return { error: "프로필 업데이트 중 오류가 발생했습니다." };
  }
}
