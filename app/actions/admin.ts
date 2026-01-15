"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 신고 처리: 블라인드 처리
 */
export async function processReportBlock(
  reportId: string,
  novelId: string,
  adminNotes?: string
) {
  try {
    const supabase = await createClient();

    // 작품 블라인드 처리
    const { error: blockError } = await supabase
      .from("novels")
      .update({ is_blocked: true })
      .eq("id", novelId);

    if (blockError) {
      return {
        success: false,
        error: "블라인드 처리 실패: " + blockError.message,
      };
    }

    // 신고 처리 완료 기록 (법적 증거용)
    const { error: reportError } = await supabase
      .from("reports")
      .update({
        status: "resolved",
        processed_at: new Date().toISOString(),
        admin_action: "blocked",
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (reportError) {
      return {
        success: false,
        error: "신고 처리 기록 실패: " + reportError.message,
      };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("신고 처리 실패:", error);
    return {
      success: false,
      error: "신고 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 신고 처리: 삭제
 */
export async function processReportDelete(
  reportId: string,
  novelId: string,
  adminNotes?: string
) {
  try {
    const supabase = await createClient();

    // 작품 삭제 (CASCADE로 관련 데이터도 자동 삭제)
    const { error: deleteError } = await supabase
      .from("novels")
      .delete()
      .eq("id", novelId);

    if (deleteError) {
      return {
        success: false,
        error: "삭제 실패: " + deleteError.message,
      };
    }

    // 신고 처리 완료 기록 (법적 증거용)
    const { error: reportError } = await supabase
      .from("reports")
      .update({
        status: "resolved",
        processed_at: new Date().toISOString(),
        admin_action: "deleted",
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (reportError) {
      return {
        success: false,
        error: "신고 처리 기록 실패: " + reportError.message,
      };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("신고 처리 실패:", error);
    return {
      success: false,
      error: "신고 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 신고 처리: 반려
 */
export async function processReportReject(
  reportId: string,
  adminNotes?: string
) {
  try {
    const supabase = await createClient();

    // 신고 반려 기록 (법적 증거용)
    const { error: reportError } = await supabase
      .from("reports")
      .update({
        status: "rejected",
        processed_at: new Date().toISOString(),
        admin_action: "rejected",
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (reportError) {
      return {
        success: false,
        error: "신고 처리 기록 실패: " + reportError.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("신고 처리 실패:", error);
    return {
      success: false,
      error: "신고 처리 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 법적 감사 리포트 조회
 */
export async function getLegalAuditReport(
  startDate?: string,
  endDate?: string
) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("reports")
      .select(
        `
        id,
        novel_id,
        reason,
        details,
        status,
        reported_at,
        processed_at,
        admin_action,
        admin_notes,
        novels(title)
      `
      )
      .order("reported_at", { ascending: false });

    if (startDate) {
      query = query.gte("reported_at", startDate);
    }
    if (endDate) {
      query = query.lte("reported_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        reports: [],
      };
    }

    // 처리 시간 계산
    const reports = (data || []).map((report: any) => {
      let processingTimeMinutes = null;
      if (report.processed_at && report.reported_at) {
        const reported = new Date(report.reported_at);
        const processed = new Date(report.processed_at);
        processingTimeMinutes =
          (processed.getTime() - reported.getTime()) / (1000 * 60);
      }

      return {
        ...report,
        processingTimeMinutes,
      };
    });

    return {
      success: true,
      reports,
    };
  } catch (error) {
    console.error("감사 리포트 조회 실패:", error);
    return {
      success: false,
      error: "감사 리포트 조회 중 오류가 발생했습니다.",
      reports: [],
    };
  }
}
