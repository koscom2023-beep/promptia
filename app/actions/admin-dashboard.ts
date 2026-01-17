"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 관리자 권한 확인
 */
export async function checkAdminRole(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    return userRole === "admin";
  } catch (error) {
    console.error("관리자 권한 확인 오류:", error);
    return false;
  }
}

/**
 * 작품 목록 조회 (페이지네이션, 필터링, 정렬 지원)
 */
export async function getNovelsForAdmin(options?: {
  page?: number;
  pageSize?: number;
  status?: "pending" | "approved" | "rejected" | "all";
  type?: "novel" | "webtoon" | "video" | "all";
  sortBy?: "created_at" | "view_count" | "vote_count" | "title";
  sortOrder?: "asc" | "desc";
  search?: string;
}) {
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = await createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("novels")
    .select(
      `
      id,
      title,
      description,
      type,
      thumbnail_url,
      view_count,
      vote_count,
      created_at,
      is_blocked,
      author_id
    `,
      { count: "exact" }
    );

  // 상태 필터 (is_blocked 기반, 추후 status 컬럼 추가 가능)
  if (options?.status && options.status !== "all") {
    if (options.status === "rejected") {
      query = query.eq("is_blocked", true);
    } else if (options.status === "approved") {
      query = query.eq("is_blocked", false);
    }
    // pending은 현재 스키마에 없으므로 모든 작품을 표시
  }

  // 타입 필터
  if (options?.type && options.type !== "all") {
    query = query.eq("type", options.type);
  }

  // 검색
  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`);
  }

  // 정렬
  const sortBy = options?.sortBy || "created_at";
  const sortOrder = options?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  // 페이지네이션
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * 작품 상태 변경 (Pending/Approved/Rejected)
 */
export async function updateNovelStatus(
  novelId: string,
  status: "pending" | "approved" | "rejected",
  _adminNotes?: string
) {
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = await createClient();

  // 현재 스키마에는 status 컬럼이 없으므로 is_blocked를 사용
  // rejected면 is_blocked = true, approved면 is_blocked = false
  const updateData: { is_blocked: boolean } = {
    is_blocked: status === "rejected",
  };

  // 추후 status 컬럼이 추가되면 아래와 같이 사용:
  // const updateData: { status: string; is_blocked?: boolean } = {
  //   status,
  //   is_blocked: status === "rejected",
  // };

  const { data, error } = await supabase
    .from("novels")
    .update(updateData)
    .eq("id", novelId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/dashboard");
  return data;
}

/**
 * 사용자 목록 조회
 */
export async function getUsersForAdmin(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "created_at" | "email";
  sortOrder?: "asc" | "desc";
}) {
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = await createClient();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  // Supabase Auth의 users 테이블은 직접 조회가 제한적이므로
  // novels 테이블의 author_id를 기반으로 사용자 정보를 추론
  // 실제로는 별도의 users 테이블이 필요할 수 있습니다

  let query = supabase
    .from("novels")
    .select("author_id", { count: "exact" })
    .not("author_id", "is", null);

  // 중복 제거를 위해 그룹화
  const { data: authors, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // author_id 중복 제거
  const uniqueAuthors = Array.from(
    new Set(authors?.map((a) => a.author_id) || [])
  );

  // 페이지네이션 적용
  const paginatedAuthors = uniqueAuthors.slice(offset, offset + pageSize);

  return {
    data: paginatedAuthors.map((authorId) => ({ id: authorId })),
    total: uniqueAuthors.length,
    page,
    pageSize,
    totalPages: Math.ceil(uniqueAuthors.length / pageSize),
  };
}

/**
 * 일일 투표 수 통계
 */
export async function getDailyVoteStats(days: number = 7) {
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = await createClient();

  // votes 테이블에서 날짜별 투표 수 집계
  const { data, error } = await supabase
    .from("votes")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    throw new Error(error.message);
  }

  // 날짜별로 그룹화
  const dailyStats: Record<string, number> = {};
  
  data?.forEach((vote) => {
    const date = new Date(vote.created_at).toISOString().split("T")[0];
    dailyStats[date] = (dailyStats[date] || 0) + 1;
  });

  // 날짜 순서대로 정렬
  const sortedDates = Object.keys(dailyStats).sort();
  
  return sortedDates.map((date) => ({
    date,
    votes: dailyStats[date],
  }));
}

/**
 * 일일 신규 가입자 통계
 */
export async function getDailySignupStats(days: number = 7) {
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = await createClient();

  // novels 테이블의 author_id를 기반으로 신규 작가 수 추정
  // 실제로는 auth.users 테이블을 조회해야 하지만, 제한이 있으므로
  // novels 테이블의 첫 작품 생성일을 기준으로 추정
  const { data, error } = await supabase
    .from("novels")
    .select("author_id, created_at")
    .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // author_id별 첫 작품 생성일 추적
  const firstNovelDate: Record<string, string> = {};
  
  data?.forEach((novel) => {
    const authorId = novel.author_id;
    if (authorId && (!firstNovelDate[authorId] || novel.created_at < firstNovelDate[authorId])) {
      firstNovelDate[authorId] = novel.created_at;
    }
  });

  // 날짜별로 그룹화
  const dailyStats: Record<string, number> = {};
  
  Object.values(firstNovelDate).forEach((dateStr) => {
    const date = new Date(dateStr).toISOString().split("T")[0];
    dailyStats[date] = (dailyStats[date] || 0) + 1;
  });

  // 날짜 순서대로 정렬
  const sortedDates = Object.keys(dailyStats).sort();
  
  return sortedDates.map((date) => ({
    date,
    signups: dailyStats[date],
  }));
}

/**
 * 대시보드 통계 요약
 */
export async function getDashboardStats() {
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const supabase = await createClient();

  // 총 작품 수
  const { count: totalNovels } = await supabase
    .from("novels")
    .select("*", { count: "exact", head: true });

  // 차단된 작품 수
  const { count: blockedNovels } = await supabase
    .from("novels")
    .select("*", { count: "exact", head: true })
    .eq("is_blocked", true);

  // 총 투표 수
  const { count: totalVotes } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true });

  // 오늘의 투표 수
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayVotes } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // 오늘의 신규 작품 수
  const { count: todayNovels } = await supabase
    .from("novels")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  return {
    totalNovels: totalNovels || 0,
    blockedNovels: blockedNovels || 0,
    totalVotes: totalVotes || 0,
    todayVotes: todayVotes || 0,
    todayNovels: todayNovels || 0,
  };
}
