# syntax=docker/dockerfile:1.7

# ─── builder stage ────────────────────────────────────────────
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app

# 의존성 명세만 먼저 복사해 의존성 레이어 캐시를 코드 변경과 분리
COPY pyproject.toml uv.lock ./

# lockfile 그대로 설치, dev 의존성 제외, 프로젝트 자체는 미설치
RUN uv sync --frozen --no-dev --no-install-project


# ─── final stage ──────────────────────────────────────────────
FROM python:3.12-slim

# non-root user (UID 고정, home/shell 불필요)
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app

WORKDIR /app

# builder의 venv를 그대로 가져옴 (소유권을 app으로)
COPY --from=builder --chown=app:app /app/.venv /app/.venv

# 코드 복사 (소유권 app)
COPY --chown=app:app etl/ /app/etl/

# venv 활성화 + 런타임 최적화
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# import root = etl/
WORKDIR /app/etl

USER app

CMD ["python", "main.py"]
