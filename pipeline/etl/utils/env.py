import os
import dotenv
from pathlib import Path

def load_env():
    BASE = Path(__file__).resolve().parent.parent.parent   # pipeline/ 경로

    dotenv.load_dotenv(BASE / ".env")
    dotenv.load_dotenv(BASE / (".env.production" if os.getenv("ENV") == "production" else ".env.development"))