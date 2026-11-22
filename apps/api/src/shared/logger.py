import logging

FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter(FORMAT))

def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format=FORMAT,
    )


class Logger(logging.LoggerAdapter[logging.Logger]):
    def __init__(self, name: str) -> None:
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        logger.addHandler(console_handler)
        logger.propagate = False
        super().__init__(logger)
