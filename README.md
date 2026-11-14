# The Sculptural Kitchen

로컬에서 index.html을 열면 예시 상담 흐름을 확인할 수 있습니다. 운영 서버 설정이 없으면 입력 정보를 전송하거나 저장하지 않습니다.

## Vercel Pro 운영 설정

1. Supabase SQL Editor에서 schema.sql을 실행합니다.
2. Vercel 프로젝트에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CONSULTATION_FROM, CONSULTATION_TO, CONSULTATION_PRIVACY, CRON_SECRET을 서버 환경 변수로 설정합니다. CONSULTATION_PRIVACY에는 확정한 개인정보 수집·이용 문구를 입력합니다.
3. Resend에서 발신 도메인을 설정합니다. vercel.json의 Cron은 15분마다 미발송 건을 최대 10건 재시도합니다. 운영 담당자는 Supabase에서 접수 기록과 notified_at을 확인할 수 있습니다.
4. 공개 전 실제 접수 및 메일 발송, 중복 요청, 메일 장애 후 재시도를 확인합니다. 운영 정책에 따라 접수 기록을 삭제하고 운영 환경에 요청 빈도 제한을 적용합니다.
5. 가칭, 푸터 사업자 정보와 임시 콘셉트 이미지를 확정 자료로 교체합니다.
