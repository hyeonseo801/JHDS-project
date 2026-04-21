"""
generate.py — 잡학다식 데이터 자동 생성기
web_search 완전 제거 버전 (비용 안정화)
뉴스/이슈: Claude 자체 지식 기반
경제 분석: 뉴스+이슈 기반 추론
날짜별 누적 저장
"""

import anthropic
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

DATA_DIR = Path(__file__).parent / "data"
ARCHIVE_DIR = DATA_DIR / "archive"
DATA_DIR.mkdir(exist_ok=True)
ARCHIVE_DIR.mkdir(exist_ok=True)

MODEL = "claude-haiku-4-5-20251001"
TODAY = datetime.now().strftime("%Y.%m.%d")


def call_claude(system: str, user: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    for block in response.content:
        if hasattr(block, "text"):
            return block.text
    return ""


def parse_json(raw: str) -> dict | list:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned.strip())


def generate_news() -> dict:
    print("[NEWS] 생성 중...")
    system = """한국 뉴스 에디터. JSON만 출력. 마크다운 펜스 금지.
{"updated_at":"HH:MM","items":[{"tag":"econ|fin|tech|int|def","title":"제목","summary":"요약(상위2개만, 나머지 빈문자열)","category":"경제|금융|기술|국제|정치","time":"N시간 전"}]}
items 5개 정확히. 국제/경제/기술 중심."""
    user = f"오늘({TODAY}) 기준 한국과 세계 주요 뉴스 5개를 JSON으로."
    return parse_json(call_claude(system, user))


def generate_issues() -> dict:
    print("[ISSUES] 생성 중...")
    system = """국제 정세 분석가. JSON만 출력. 마크다운 펜스 금지.
{"issues":[{"tag":"war|eco|pol|cli","title":"이슈명","summary":"한줄요약","detail":"2-3문장","status":"진행 중|협상 중|고조|완화|시행 중","updated":"YYYY.MM.DD"}]}
issues 4개 정확히. 한국 연관성 높은 이슈 우선."""
    user = f"현재({TODAY}) 진행 중인 주요 글로벌 이슈 4개를 JSON으로."
    return parse_json(call_claude(system, user))


def generate_economy_analysis(news: dict, issues: dict) -> dict:
    print("[ECON] 생성 중...")
    news_titles = "\n".join([f"- {i['title']}" for i in news.get("items", [])])
    issue_titles = "\n".join([f"- {i['title']}: {i['summary']}" for i in issues.get("issues", [])])
    system = """경제 분석가. JSON만 출력. 마크다운 펜스 금지.
{"summary":"한국 경제 영향 2-3문장","points":[{"icon":"▲|▼|━","text":"포인트"}],"watchlist":["키워드1","키워드2","키워드3"]}
points 3개, watchlist 3개 정확히."""
    user = f"아래 뉴스/이슈 기반으로 한국 경제 영향 분석.\n[뉴스]\n{news_titles}\n[이슈]\n{issue_titles}"
    return parse_json(call_claude(system, user))


def save(filename: str, data: dict | list):
    path = DATA_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    stem = Path(filename).stem
    archive_path = ARCHIVE_DIR / f"{stem}_{TODAY.replace('.', '-')}.json"
    with open(archive_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  → {path} 완료 (아카이브: {archive_path.name})")


def main():
    print(f"\n잡학다식 데이터 생성 시작 — {TODAY}\n" + "─" * 40)
    news, issues = None, None

    try:
        news = generate_news()
        save("news.json", news)
    except Exception as e:
        print(f"  [ERROR] 뉴스: {e}")

    try:
        issues = generate_issues()
        save("issues.json", issues)
    except Exception as e:
        print(f"  [ERROR] 이슈: {e}")

    if news and issues:
        try:
            economy = generate_economy_analysis(news, issues)
            save("economy.json", economy)
        except Exception as e:
            print(f"  [ERROR] 경제: {e}")

    print("\n" + "─" * 40 + "\n완료.")


if __name__ == "__main__":
    main()
