from utils.env import load_env
from utils.logger import setup_logger
from nsm import run_nsm

if __name__ == "__main__":
    load_env()
    setup_logger()
    run_nsm()