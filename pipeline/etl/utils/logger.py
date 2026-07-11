import logging
import json
import os
import sys
import time

_STANDARD = set(logging.makeLogRecord({}).__dict__.keys())


class CloudLoggingFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord):
        record.asctime = self.formatTime(record, self.datefmt)
        log_entity = {
            "asctime": record.asctime,
            'severity': record.levelname,
            'message': record.getMessage(),
            "module": record.name,
        }

        for k, v in record.__dict__.items():
            if k not in _STANDARD:  # LogRecord에 기본속성인 값들 제외, extra 추가
                log_entity[k] = v

        if record.exc_info:  # 예외가 있으면
            log_entity["err_msg"] = self.formatException(record.exc_info)

        return json.dumps(log_entity)


class CustomConsoleFormatter(logging.Formatter):
    def format(self, record):
        base = super().format(record)

        extras = {
            key: value
            for key, value in record.__dict__.items()
            if key not in _STANDARD
        }

        if extras:
            extra_str = " ".join(f"{k}={v}" for k, v in extras.items())
            return f"{base} | {{ {extra_str} }}"
        return base

class timed:
    def __init__(self, logger, stage, event=None, **fields):
        self.stage = stage
        self.event = event or self.stage
        self.logger = logger
        self.fields = fields

    def add(self, **kwargs):
        self.fields.update(kwargs)

    def __enter__(self):
        self.start = time.perf_counter()
        self.logger.info(
            f"{self.stage}-{self.event} start",
            extra={"stage": self.stage, "event": f"{self.event}_start", **self.fields},
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed_ms = round((time.perf_counter() - self.start) * 1000, 1)

        if exc_type is None:
            self.logger.info(
                f"{self.stage}-{self.event} end",
                extra={
                    "stage": self.stage,
                    "event": f"{self.event}_end",
                    "status": "success",
                    "duration_ms": elapsed_ms,
                    **self.fields,
                },
            )
        else:
            self.logger.error(
                f"{self.stage} failed",
                exc_info=True,
                extra={
                    "stage": self.stage,
                    "event": f"{self.event}_error",
                    "status": "fail",
                    "duration_ms": elapsed_ms,
                    **self.fields,
                },
            )
        return False


def setup_logger(level: str = 'INFO'):
    handler = logging.StreamHandler(sys.stdout)

    if os.getenv("ENV") == "local":
        formatter = CustomConsoleFormatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        )
    else:
        formatter = CloudLoggingFormatter()

    handler.setFormatter(formatter)
    logging.basicConfig(
        level=level,
        handlers=[handler],
        force=True
    )


def get_logger(name: str):
    return logging.getLogger(name)
