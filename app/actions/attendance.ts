"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * 출석 체크 및 연속 출석 처리
 */
export async function checkAttendance(deviceId?: string) {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    
    // IP 주소 가져오기
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                     headersList.get('x-real-ip') || 
                     '0.0.0.0';

    // RPC 함수 호출
    const { data, error } = await supabase.rpc('handle_attendance_streak', {
      p_user_id: user?.id || null,
      p_ip_address: ipAddress,
      p_device_id: deviceId || null
    });

    if (error) {
      console.error("출석 체크 오류:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    return {
      success: true,
      streak: data.streak,
      newBadgeEarned: data.newBadgeEarned,
      attendanceDate: data.attendanceDate,
      totalDays: data.totalDays
    };
  } catch (error) {
    console.error("출석 체크 중 오류:", error);
    return { 
      success: false, 
      error: "출석 체크에 실패했습니다." 
    };
  }
}

/**
 * 연속 출석일 조회
 */
export async function getAttendanceStreak(deviceId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';

    const { data, error } = await supabase.rpc('calculate_attendance_streak', {
      p_user_id: user?.id || null,
      p_ip_address: ipAddress,
      p_device_id: deviceId || null
    });

    if (error) {
      console.error("연속 출석일 조회 오류:", error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error("연속 출석일 조회 중 오류:", error);
    return 0;
  }
}

/**
 * 사용자 배지 목록 조회
 */
export async function getUserBadges(deviceId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';

    const { data, error } = await supabase.rpc('get_user_badges', {
      p_user_id: user?.id || null,
      p_ip_address: ipAddress,
      p_device_id: deviceId || null
    });

    if (error) {
      console.error("배지 조회 오류:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("배지 조회 중 오류:", error);
    return [];
  }
}

/**
 * IP 기반 일일 투표 가능 여부 확인
 */
export async function canVoteToday(novelId: string, deviceId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';

    // 오늘 이미 투표했는지 확인
    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('novel_id', novelId)
      .eq('voted_at', new Date().toISOString().split('T')[0]);

    // user_id, voter_ip, device_id 중 하나라도 일치하면 투표 불가
    let query = supabase
      .from('votes')
      .select('id')
      .eq('novel_id', novelId)
      .eq('voted_at', new Date().toISOString().split('T')[0]);

    if (user) {
      query = query.eq('user_id', user.id);
    } else if (deviceId) {
      query = query.eq('device_id', deviceId);
    } else {
      query = query.eq('voter_ip', ipAddress);
    }

    const { data: existingVote, error: voteError } = await query.limit(1).single();

    if (voteError && voteError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("투표 확인 오류:", voteError);
      return false;
    }

    // 이미 투표한 경우 false
    return !existingVote;
  } catch (error) {
    console.error("투표 가능 여부 확인 중 오류:", error);
    return false;
  }
}
