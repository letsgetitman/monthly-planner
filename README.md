# 한달노트

오늘 할 일부터 주간 계획, 월간 목표, 회고, 통계까지 관리하는 아이폰용 웹앱(PWA)입니다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 앱 화면 뼈대 |
| `styles.css` | 디자인 (라이트/다크 모드) |
| `app.js` | 모든 기능과 데이터 저장 |
| `manifest.webmanifest` | 홈 화면 앱 이름·아이콘 설정 |
| `sw.js` | 오프라인 실행, 알림 처리 |
| `icons/` | 앱 아이콘 |

## PC에서 미리 보기

```bash
python -m http.server 5173 --directory D:\monthly-planner
```

브라우저에서 http://localhost:5173 을 엽니다.

## 아이폰에 설치하기 (GitHub Pages, 무료)

1. github.com에 로그인하고 새 저장소(예: `monthly-planner`)를 만듭니다. 공개(Public)로 만들어야 무료로 호스팅됩니다.
2. 저장소 화면의 **Add file → Upload files**에 이 폴더의 파일과 `icons` 폴더를 끌어다 놓고 **Commit changes**를 누릅니다. (`.claude` 폴더는 올리지 않아도 됩니다.)
3. **Settings → Pages**에서 Source를 **Deploy from a branch**, Branch를 **main / (root)**로 정하고 저장합니다.
4. 1~2분 뒤 `https://<아이디>.github.io/monthly-planner/` 주소가 생깁니다.
5. 아이폰 **Safari**로 그 주소를 열고 공유 버튼 → **홈 화면에 추가**를 누릅니다.
6. 홈 화면의 한달노트 아이콘으로 실행한 뒤 설정(톱니바퀴) → **알림 켜기**를 누릅니다.

## 알아 둘 점

- 데이터는 아이폰 안에만 저장됩니다. 설정 → **백업 파일 저장**으로 가끔 백업해 두세요.
- 아이폰 알림은 iOS 16.4 이상, 홈 화면에 추가한 앱에서만 켤 수 있습니다. 서버가 없는 구조라서 앱이 완전히 종료된 상태에서는 알림이 울리지 않을 수 있고, 앱을 다시 열면 놓친 알림을 화면에 알려 줍니다.
- 앱 파일을 고친 뒤에는 `sw.js`의 `VERSION` 값을 올려야 아이폰에 새 버전이 적용됩니다.
