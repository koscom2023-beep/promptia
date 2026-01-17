// 플랫폼 그룹 레이아웃 (작품 관련 페이지)
// 헤더와 푸터는 포함하지 않음 (뷰어 페이지는 전체 화면 사용)
// 병렬 라우트: @modal 슬롯 지원

export default function PlatformLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
