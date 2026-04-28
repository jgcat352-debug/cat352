# 황금의 성 — Golden Castle

1980년대 아케이드 액션 게임 스타일의 중세 전투 게임. HTML5 Canvas와 순수 JavaScript(ES6+)로 제작.

## 실행 방법

브라우저에서 `index.html`을 열거나 로컬 웹 서버로 실행:

```bash
npx serve .
# 또는
python3 -m http.server 8080
```

> ES6 모듈을 사용하므로 반드시 웹 서버를 통해 실행해야 합니다 (`file://` 불가).

## 조작 방법

| 키 | 동작 |
|---|---|
| `← →` | 이동 |
| `↑ ↓` | 공격/방어 레벨 변경 (상단/중단/하단) |
| `Z` | 공격 |
| `X` | 방어 (홀드) |
| `Space` | 점프 |

## 핵심 전투 시스템

- **3단 공격/방어**: 상단(HEAD) · 중단(MID) · 하단(LOW) 레벨을 실시간으로 전환
- **방어 성공**: X키를 누른 상태에서 적의 공격 레벨과 내 방어 레벨이 일치하면 방어
- **갑옷 파괴 시스템**: 머리/가슴/방패/다리 4부위 갑옷이 순서대로 파괴되며 튕겨나감
- **무방비 상태**: 갑옷 모두 파괴 후 피격 시 사망 판정

## 게임 구성

| 스테이지 | 배경 | 적 |
|---|---|---|
| 1 | 입구 홀 | 해골 병사 × 2, 아마조네스 × 1 |
| 2 | 경비 막사 | 해골 병사 × 2, 아마조네스 × 2 |
| 3 | 왕좌의 방 | **보스** 거대 검사 + 해골 병사 |

## 파일 구조

```
index.html          — 메인 HTML, Canvas, HUD
js/
  main.js           — 진입점
  game.js           — 게임 루프, 상태 관리
  player.js         — 플레이어 Entity, 갑옷 시스템
  enemy.js          — 적 AI (Skeleton, Amazon, GiantSwordsman)
  entity.js         — 기본 Entity, ArmorDebris, Projectile
  collision.js      — 충돌 판정 모듈
  render.js         — Canvas 렌더링 (배경, 캐릭터, HUD)
  particles.js      — 파티클 이펙트 시스템
  sound.js          — Web Audio API 기반 8비트 효과음
  level.js          — 레벨 데이터, 함정(Trap) 시스템
```
